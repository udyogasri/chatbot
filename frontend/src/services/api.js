import axios from "axios";

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Sends a message to the FastAPI backend /chat endpoint.
 * @param {string} message The user's query
 * @returns {Promise<string>} The AI response
 */
export const sendChatMessage = async (message) => {
  try {
    const response = await apiClient.post("/chat", { message });
    return response.data.response;
  } catch (error) {
    console.error("API Service Error:", error);

    // Parse error detail from FastAPI if present
    if (error.response && error.response.data && error.response.data.detail) {
      throw new Error(error.response.data.detail);
    }

    // Check if server is entirely offline
    if (!error.response) {
      throw new Error(
        "Connection refused. Make sure the FastAPI backend is running on http://localhost:8000",
      );
    }

    throw new Error(
      error.message || "An error occurred while communicating with the server.",
    );
  }
};
