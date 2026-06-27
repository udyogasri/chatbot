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
 * Sends a message to the FastAPI backend /chat endpoint and streams the response.
 * @param {string} message The user's query
 * @param {string|null} imageBase64 The base64 encoded image string
 * @param {object} callbacks Callbacks for chunk, tool_start, tool_end, and error
 */
export const sendChatMessage = async (message, imageBase64, docData, callbacks) => {
  const { onChunk, onToolStart, onToolEnd, onError } = callbacks;
  try {
    const bodyPayload = { message, image_base64: imageBase64 };
    if (docData) {
      bodyPayload.file_base64 = docData.base64;
      bodyPayload.file_name = docData.name;
      bodyPayload.file_type = docData.type;
    }

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Server error");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // Keep the incomplete line in the buffer
      
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.type === "content") {
            if (onChunk) onChunk(data.content);
          } else if (data.type === "tool_start") {
            if (onToolStart) onToolStart(data.tool_name, data.args);
          } else if (data.type === "tool_end") {
            if (onToolEnd) onToolEnd(data.tool_name);
          } else if (data.type === "error") {
            if (onError) onError(data.content);
          }
        } catch (e) {
          console.error("Failed to parse stream chunk:", line, e);
        }
      }
    }
  } catch (error) {
    console.error("API Service Error:", error);
    if (onError) {
      onError(error.message || "An error occurred while communicating with the server.");
    }
  }
};

export const getSessions = async () => {
  const response = await apiClient.get("/sessions");
  return response.data;
};

export const createSession = async () => {
  const response = await fetch(`${API_BASE_URL}/sessions`, { method: "POST" });
  if (!response.ok) throw new Error("Failed to create session");
  return response.json();
};

export const deleteSession = async (sessionId) => {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete session");
  return response.json();
};

export const updateMessage = async (messageId, text, imageBase64 = null) => {
  const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, is_user: true, image_base64: imageBase64 }),
  });
  if (!response.ok) throw new Error("Failed to update message");
  return response.json();
};

export const deleteMessagesAfter = async (sessionId, messageId) => {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/messages_after/${messageId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete subsequent messages");
  return response.json();
};

export const searchSessions = async (query) => {
  const response = await fetch(`${API_BASE_URL}/sessions/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error("Failed to search sessions");
  return response.json();
};

export const getSessionMessages = async (sessionId) => {
  const response = await apiClient.get(`/sessions/${sessionId}/messages`);
  return response.data;
};

export const saveMessageToBackend = async (sessionId, { text, isUser, imageBase64, toolStatus }) => {
  const response = await apiClient.post(`/sessions/${sessionId}/messages`, {
    text,
    is_user: isUser,
    image_base64: imageBase64,
    tool_status: toolStatus
  });
  return response.data;
};

export const renameSession = async (sessionId, newTitle) => {
  const response = await apiClient.put(`/sessions/${sessionId}`, { title: newTitle });
  return response.data;
};
