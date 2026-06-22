import os
import logging
from groq import AsyncGroq

# Set up logger
logger = logging.getLogger("groq_service")
logging.basicConfig(level=logging.INFO)


class GroqService:
    """
    Service to interact with the Groq API.
    """

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")

        # Validate that the API key exists
        if not self.api_key or self.api_key == "your_groq_api_key_here":
            logger.warning(
                "GROQ_API_KEY is not set or is using the default placeholder value in .env. Responses will fail."
            )
            self.client = None
        else:
            # Configure the Groq SDK
            self.client = AsyncGroq(api_key=self.api_key)
            self.model_name = (
                "llama-3.1-8b-instant"  # Updated to a current supported model
            )
            logger.info("GroqService successfully initialized.")

    async def generate_response(self, message: str) -> str:
        """
        Sends user message to Groq model.
        """
        if not self.client:
            raise ValueError(
                "Groq API key is missing or invalid. Please check your backend/.env file and set GROQ_API_KEY."
            )

        if not message.strip():
            raise ValueError("Message content cannot be empty.")

        try:
            logger.info(f"Sending request to Groq API with message: {message[:50]}...")

            # Request chat generation
            response = await self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful, modern, and highly intelligent AI Chat Assistant. Keep responses concise, useful, and formatted beautifully in markdown when appropriate.",
                    },
                    {"role": "user", "content": message},
                ],
                model=self.model_name,
            )

            ai_response = response.choices[0].message.content
            logger.info("Successfully received response from Groq API.")
            return ai_response

        except Exception as e:
            logger.error(f"Unexpected error while calling Groq API: {str(e)}")
            raise RuntimeError(f"Failed to generate response: {str(e)}")
