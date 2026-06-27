import os
import logging
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

logger = logging.getLogger("rag_service")
logging.basicConfig(level=logging.INFO)

class RAGService:
    """
    Handles chunking text, generating embeddings, and storing/retrieving 
    from a local Chroma vector database.
    """
    def __init__(self):
        self.persist_directory = os.path.join(os.path.dirname(__file__), "..", "chroma_db")
        os.makedirs(self.persist_directory, exist_ok=True)
        
        logger.info("Initializing HuggingFace Embeddings (this may download the model the first time)...")
        # using a fast, small, effective local embedding model
        self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        
        logger.info("Initializing ChromaDB Vector Store...")
        self.vectorstore = Chroma(
            collection_name="chatbot_documents",
            embedding_function=self.embeddings,
            persist_directory=self.persist_directory
        )
        
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        logger.info("RAGService successfully initialized.")

    def ingest_document(self, text: str, doc_name: str):
        """
        Splits a large document into chunks and stores them in ChromaDB.
        """
        if not text.strip():
            return
            
        logger.info(f"Chunking document: {doc_name} ({len(text)} characters)")
        chunks = self.text_splitter.split_text(text)
        
        # Add source metadata to each chunk
        metadatas = [{"source": doc_name} for _ in chunks]
        
        logger.info(f"Adding {len(chunks)} chunks to Vector DB...")
        self.vectorstore.add_texts(texts=chunks, metadatas=metadatas)
        
        logger.info(f"Successfully ingested {doc_name}.")

    def query_context(self, user_query: str, top_k: int = 4) -> str:
        """
        Retrieves the top_k most relevant chunks for the given user_query.
        """
        # If the database is empty, similarity_search might fail or return nothing
        try:
            results = self.vectorstore.similarity_search(user_query, k=top_k)
            if not results:
                return ""
                
            context_pieces = []
            for i, doc in enumerate(results):
                source = doc.metadata.get("source", "Unknown Document")
                context_pieces.append(f"--- Document Excerpt (Source: {source}) ---\n{doc.page_content}\n")
                
            return "\n".join(context_pieces)
        except Exception as e:
            logger.error(f"Error querying ChromaDB: {e}")
            return ""

# Global instance
rag_service = RAGService()
