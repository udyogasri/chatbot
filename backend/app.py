from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import Groq service
from services.groq_service import GroqService  # noqa: E402

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


# Request Pydantic Schema
class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        description="The message sent by the user to the AI Chat Assistant.",
    )


# Response Pydantic Schema
class ChatResponse(BaseModel):
    response: str = Field(..., description="The AI generated response message.")


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


@app.post("/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat_endpoint(request: ChatRequest):
    """
    POST /chat endpoint to receive user questions, consult Gemini, and return AI generated replies.
    """
    try:
        # Re-initialize the Groq service dynamically if it was not setup originally
        # (e.g. if the user runs the app first and configures the .env key later)
        global groq_service
        if not groq_service.client:
            groq_service = GroqService()

        ai_reply = await groq_service.generate_response(request.message)
        return ChatResponse(response=ai_reply)

    except ValueError as ve:
        # Configuration/Validation issues
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except RuntimeError as re:
        # Groq API issues
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(re))
    except Exception as e:
        # Catch-all for unexpected backend failures
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected server error occurred: {str(e)}",
        )
