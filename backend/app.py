from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from sqlalchemy.orm import Session as DBSession
from datetime import datetime
from dotenv import load_dotenv

import database
import models
import base64
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io

# Configure Tesseract path for Windows
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Create DB tables
models.Base.metadata.create_all(bind=database.engine)

# Load environment variables from .env file
load_dotenv()

# Import Groq service
from services.groq_service import GroqService  # noqa: E402
from services.rag_service import rag_service  # noqa: E402

# Initialize FastAPI app
app = FastAPI(
    title="AI Chat Assistant API",
    description="Backend API for the React-FastAPI OpenAI Chat Assistant.",
    version="1.0.0",
)

# Configure CORS Middleware
# React default development server runs on http://localhost:5173
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the Groq service
groq_service = GroqService()

MAX_IMAGE_BASE64_CHARS = 12 * 1024 * 1024
MAX_FILE_BASE64_CHARS = 16 * 1024 * 1024


# Request Pydantic Schema
class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        description="The message sent by the user to the AI Chat Assistant.",
    )
    image_base64: Optional[str] = Field(
        None,
        description="Base64 encoded string of an uploaded image.",
    )
    file_base64: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None


# Response Pydantic Schema
class ChatResponse(BaseModel):
    response: str = Field(..., description="The AI generated response message.")

class MessageCreate(BaseModel):
    text: Optional[str] = None
    is_user: bool = True
    image_base64: Optional[str] = None
    tool_status: Optional[str] = None

class MessageOut(BaseModel):
    id: int
    session_id: str
    text: Optional[str]
    is_user: bool
    image_base64: Optional[str]
    tool_status: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class SessionOut(BaseModel):
    id: str
    title: str
    created_at: datetime

    class Config:
        from_attributes = True

class SessionRename(BaseModel):
    title: str


@app.get("/")
def read_root():
    """
    Health check and root API endpoint.
    """
    return {
        "status": "healthy",
        "app": "AI Chat Assistant API",
        "configured": groq_service.model_name is not None,
    }


@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    POST /chat endpoint to receive user questions, consult Groq via streaming, and handle MCP tools.
    """
    try:
        global groq_service
        if not groq_service.client:
            groq_service = GroqService()

        message_text = request.message

        if request.image_base64 and len(request.image_base64) > MAX_IMAGE_BASE64_CHARS:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Uploaded image is too large. Please try a smaller file.",
            )
        
        if request.file_base64:
            if len(request.file_base64) > MAX_FILE_BASE64_CHARS:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="Uploaded document is too large. Please try a smaller file.",
                )
            try:
                # Remove validate=True in case frontend sends slight padding issues
                file_bytes = base64.b64decode(request.file_base64)
                extracted_text = ""
                
                if request.file_type == "application/pdf":
                    doc = fitz.open(stream=file_bytes, filetype="pdf")
                    for page in doc:
                        page_text = page.get_text()
                        if not page_text.strip():
                            try:
                                pix = page.get_pixmap()
                                img = Image.open(io.BytesIO(pix.tobytes("png")))
                                page_text = pytesseract.image_to_string(img)
                            except Exception as ocr_err:
                                print(f"OCR failed for a page: {ocr_err}")
                        extracted_text += page_text + "\n"
                elif request.file_type in ["text/plain", "text/csv"]:
                    extracted_text = file_bytes.decode("utf-8")
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Unsupported file type. Please upload a PDF, text file, or CSV.",
                    )
                    
                if extracted_text.strip():
                    # Ingest the document into our Vector DB
                    rag_service.ingest_document(extracted_text, request.file_name)
                else:
                    extracted_text = "ERROR: This document contained no readable text. It appears to be an image-based scan, and the OCR engine failed to run because Tesseract is not installed on the system."
                    rag_service.ingest_document(extracted_text, request.file_name)
                    
            except HTTPException:
                raise
            except Exception as e:
                print(f"Error processing document: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Error processing uploaded document: {str(e)}",
                )

        # Always query the RAG service for relevant context
        retrieved_context = rag_service.query_context(message_text)
        if retrieved_context:
            message_text = f"Relevant Document Context:\n{retrieved_context}\n\nUser Question:\n{message_text}"

        return StreamingResponse(
            groq_service.generate_stream(message_text, request.image_base64), 
            media_type="text/event-stream"
        )

    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(re))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected server error occurred: {str(e)}",
        )

@app.post("/sessions", response_model=SessionOut)
def create_session(db: DBSession = Depends(database.get_db)):
    session = models.Session()
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@app.get("/sessions", response_model=List[SessionOut])
def get_sessions(db: DBSession = Depends(database.get_db)):
    return db.query(models.Session).order_by(models.Session.created_at.desc()).all()

@app.get("/sessions/search", response_model=List[SessionOut])
def search_sessions(q: str, db: DBSession = Depends(database.get_db)):
    search_query = f"%{q}%"
    sessions = db.query(models.Session).outerjoin(models.Message).filter(
        (models.Session.title.ilike(search_query)) | 
        (models.Message.text.ilike(search_query))
    ).distinct().order_by(models.Session.created_at.desc()).all()
    return sessions

@app.get("/sessions/{session_id}/messages", response_model=List[MessageOut])
def get_messages(session_id: str, db: DBSession = Depends(database.get_db)):
    return db.query(models.Message).filter(models.Message.session_id == session_id).order_by(models.Message.created_at.asc()).all()

@app.post("/sessions/{session_id}/messages", response_model=MessageOut)
def create_message(session_id: str, message: MessageCreate, db: DBSession = Depends(database.get_db)):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Update title on first user message
    if message.is_user and message.text and session.title == "New Chat":
        session.title = message.text[:30] + ("..." if len(message.text) > 30 else "")

    new_msg = models.Message(
        session_id=session_id,
        text=message.text,
        is_user=message.is_user,
        image_base64=message.image_base64,
        tool_status=message.tool_status
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg

@app.put("/messages/{message_id}", response_model=MessageOut)
def update_message(message_id: int, data: MessageCreate, db: DBSession = Depends(database.get_db)):
    msg = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.text = data.text
    if data.image_base64:
        msg.image_base64 = data.image_base64
    db.commit()
    db.refresh(msg)
    return msg

@app.delete("/sessions/{session_id}/messages_after/{message_id}")
def delete_messages_after(session_id: str, message_id: int, db: DBSession = Depends(database.get_db)):
    msgs_to_delete = db.query(models.Message).filter(
        models.Message.session_id == session_id,
        models.Message.id > message_id
    ).all()
    count = len(msgs_to_delete)
    for msg in msgs_to_delete:
        db.delete(msg)
    db.commit()
    return {"status": "deleted", "count": count}

@app.delete("/sessions/{session_id}")
def delete_session(session_id: str, db: DBSession = Depends(database.get_db)):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"status": "deleted"}

@app.put("/sessions/{session_id}", response_model=SessionOut)
def rename_session(session_id: str, data: SessionRename, db: DBSession = Depends(database.get_db)):
    session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.title = data.title
    db.commit()
    db.refresh(session)
    return session
