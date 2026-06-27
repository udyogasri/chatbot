import React, { useState, useRef, useEffect, useCallback } from "react";
import { ThemeProvider, createTheme, CssBaseline, Box } from "@mui/material";
import ChatWindow from "./components/ChatWindow";
import Sidebar from "./components/Sidebar";
import { sendChatMessage, getSessions, createSession, getSessionMessages, deleteSession, saveMessageToBackend, renameSession, searchSessions, updateMessage, deleteMessagesAfter } from "./services/api";

  const getTheme = (mode) => createTheme({
    palette: {
      mode,
      primary: {
        main: "#7c4dff",
        light: "#b388ff",
        dark: "#651fff",
      },
      secondary: {
        main: "#00b0ff",
        light: "#80d8ff",
        dark: "#0091ea",
      },
      background: {
        default: mode === 'dark' ? "#0b0f19" : "#f4f6f8",
        paper: mode === 'dark' ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
      },
      text: {
        primary: mode === 'dark' ? "#ffffff" : "#111827",
        secondary: mode === 'dark' ? "rgba(255, 255, 255, 0.7)" : "#4b5563",
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
            scrollbar-color: rgba(${mode === 'dark' ? '255, 255, 255' : '0, 0, 0'}, 0.1) transparent;
            scrollbar-width: thin;
            background-color: ${mode === 'dark' ? '#0b0f19' : '#f4f6f8'};
          }
          ::selection {
            background-color: rgba(124, 77, 255, 0.3);
            color: ${mode === 'dark' ? '#ffffff' : '#111827'};
          }
        `,
      },
    },
  });

const createClientMessageId = () => (
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
);

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [themeMode, setThemeMode] = useState("dark");

  const streamingTextRef = useRef("");

  const handleSelectSession = useCallback(async (id) => {
    setCurrentSessionId(id);
    setIsLoading(true);
    try {
      const msgs = await getSessionMessages(id);
      setMessages(msgs.map(m => ({
        id: m.id,
        text: m.text,
        isUser: m.is_user,
        imageBase64: m.image_base64,
        toolStatus: m.tool_status
      })));
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSessions = useCallback(async (selectFirstSession = false) => {
    try {
      const data = await getSessions();
      setSessions(data);
      if (selectFirstSession && data.length > 0) {
        handleSelectSession(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  }, [handleSelectSession]);

  useEffect(() => {
    loadSessions(true);
  }, [loadSessions]);

  const handleNewChat = async () => {
    try {
      const newSession = await createSession();
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
    } catch (err) {
      console.error("Failed to create new chat:", err);
    }
  };

  const handleDeleteSession = async (id) => {
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter(s => s.id !== id));
      if (currentSessionId === id) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const handleRenameSession = async (id, newTitle) => {
    try {
      await renameSession(id, newTitle);
      setSessions((prev) => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
    } catch (err) {
      console.error("Failed to rename session:", err);
    }
  };

  const handleSearchSessions = async (query) => {
    if (!query.trim()) {
      loadSessions();
      return;
    }
    try {
      const results = await searchSessions(query);
      setSessions(results);
    } catch (err) {
      console.error("Failed to search sessions:", err);
    }
  };

  const streamAIResponse = async (text, imageBase64, docData, activeSessionId) => {
    const assistantMessageId = createClientMessageId();
    setMessages((prev) => [...prev, { id: assistantMessageId, text: "", isUser: false, toolStatus: null }]);

    setError(null);
    setIsLoading(true);
    streamingTextRef.current = "";

    try {
      await sendChatMessage(text, imageBase64, docData, {
        onChunk: (chunkText) => {
           streamingTextRef.current += chunkText;
           const currentText = streamingTextRef.current;
           setMessages((prev) => {
             return prev.map((msg) => (
               msg.id === assistantMessageId ? { ...msg, text: currentText } : msg
             ));
           });
        },
        onToolStart: (toolName) => {
           setMessages((prev) => {
             return prev.map((msg) => (
               msg.id === assistantMessageId ? { ...msg, toolStatus: `Running tool: ${toolName}...` } : msg
             ));
           });
        },
        onToolEnd: () => {
           setMessages((prev) => {
             return prev.map((msg) => (
               msg.id === assistantMessageId ? { ...msg, toolStatus: null } : msg
             ));
           });
        },
        onError: (errMsg) => {
           setError(errMsg);
        }
      });

      try {
        await saveMessageToBackend(activeSessionId, { text: streamingTextRef.current, isUser: false });
      } catch (e) {
        console.error("Failed to save AI message:", e);
      }

    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text, imageBase64 = null, docData = null) => {
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      const newSession = await createSession();
      setSessions((prev) => [newSession, ...prev]);
      activeSessionId = newSession.id;
      setCurrentSessionId(activeSessionId);
    }

    const userMessageId = createClientMessageId();
    setMessages((prev) => [...prev, { id: userMessageId, text, isUser: true, imageBase64 }]);

    try {
      const savedMsg = await saveMessageToBackend(activeSessionId, { text, isUser: true, imageBase64 });
      setMessages((prev) => prev.map((msg) => (
        msg.id === userMessageId ? { ...msg, id: savedMsg.id } : msg
      )));
      loadSessions(); // refresh titles
    } catch (e) {
      console.error("Failed to save user message:", e);
      setError("Failed to save your message. Please try again.");
      return;
    }

    await streamAIResponse(text, imageBase64, docData, activeSessionId);
  };

  const handleRegenerate = async (index) => {
    let text = "";
    let imageBase64 = null;
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].isUser) {
        text = messages[i].text;
        imageBase64 = messages[i].imageBase64;
        break;
      }
    }
    if (text || imageBase64) {
      await streamAIResponse(text, imageBase64, null, currentSessionId);
    }
  };

  const handleEditMessage = async (index, newText) => {
    const msg = messages[index];
    if (!msg || !msg.isUser) return;
    
    if (msg.id) {
      try {
        await updateMessage(msg.id, newText, msg.imageBase64);
        await deleteMessagesAfter(currentSessionId, msg.id);
      } catch (err) {
        console.error("Failed to edit message:", err);
      }
    } else {
      console.warn("Editing a message without an ID. Backend update skipped.");
    }

    const newMessages = messages.slice(0, index + 1);
    newMessages[index] = { ...newMessages[index], text: newText };
    setMessages(newMessages);

    await streamAIResponse(newText, msg.imageBase64, null, currentSessionId);
  };

  const toggleTheme = () => setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <ThemeProvider theme={getTheme(themeMode)}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        <Sidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          onSearch={handleSearchSessions}
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          themeMode={themeMode}
          toggleTheme={toggleTheme}
        />
        <Box sx={{ flexGrow: 1, height: '100%', transition: 'margin 0.3s ease' }}>
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            error={error}
            onSendMessage={handleSendMessage}
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onRegenerate={handleRegenerate}
            onEdit={handleEditMessage}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
