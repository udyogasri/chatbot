import React, { useState } from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import ChatWindow from "./components/ChatWindow";
import { sendChatMessage } from "./services/api";

// Create a custom modern dark theme using Plus Jakarta Sans
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#7c4dff", // Radiant purple
      light: "#b388ff",
      dark: "#651fff",
    },
    secondary: {
      main: "#00b0ff", // Electric blue
      light: "#80d8ff",
      dark: "#0091ea",
    },
    background: {
      default: "#0b0f19", // Deep space dark background
      paper: "rgba(255, 255, 255, 0.03)",
    },
    text: {
      primary: "#ffffff",
      secondary: "rgba(255, 255, 255, 0.7)",
    },
  },
  typography: {
    fontFamily:
      '"Plus Jakarta Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        body {
          scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
          scrollbar-width: thin;
        }
        ::selection {
          background-color: rgba(124, 77, 255, 0.3);
          color: #ffffff;
        }
      `,
    },
  },
});

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSendMessage = async (text) => {
    // 1. Add user message to history
    const userMessage = { text, isUser: true };
    setMessages((prev) => [...prev, userMessage]);

    // Clear any previous error and start loader
    setError(null);
    setIsLoading(true);

    try {
      // 2. Call backend Gemini api
      const responseText = await sendChatMessage(text);

      // 3. Add AI response to history
      const aiMessage = { text: responseText, isUser: false };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Failed to communicate with chat backend:", err);
      setError(
        err.message || "Unable to get response from AI. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        error={error}
        onSendMessage={handleSendMessage}
      />
    </ThemeProvider>
  );
}

export default App;
