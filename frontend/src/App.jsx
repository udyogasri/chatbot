import React, { useState, useRef, useEffect } from "react";
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

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [themeMode, setThemeMode] = useState("dark");

  const streamingTextRef = useRef("");

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await getSessions();
      setSessions(data);
      if (data.length > 0 && !currentSessionId) {
        handleSelectSession(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  };

  const handleNewChat = async () => {
    try {
      const newSession = await createSession();
      setSessions([newSession, ...sessions]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
    } catch (err) {
      console.error("Failed to create new chat:", err);
    }
  };

  const handleSelectSession = async (id) => {
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
    setMessages((prev) => [...prev, { text: "", isUser: false, toolStatus: null }]);

    setError(null);
    setIsLoading(true);
    streamingTextRef.current = "";

    try {
      await sendChatMessage(text, imageBase64, docData, {
        onChunk: (chunkText) => {
           streamingTextRef.current += chunkText;
           const currentText = streamingTextRef.current;
           setMessages((prev) => {
             const newMsgs = [...prev];
             newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], text: currentText };
             return newMsgs;
           });
        },
        onToolStart: (toolName, args) => {
           setMessages((prev) => {
             const newMsgs = [...prev];
             newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], toolStatus: `Running tool: ${toolName}...` };
             return newMsgs;
           });
        },
        onToolEnd: (toolName) => {
           setMessages((prev) => {
             const newMsgs = [...prev];
             newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], toolStatus: null };
             return newMsgs;
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

    try {
      const savedMsg = await saveMessageToBackend(activeSessionId, { text, isUser: true, imageBase64 });
      setMessages(prev => {
        const newMsgs = [...prev];
        for(let i=newMsgs.length-1; i>=0; i--) {
           if(newMsgs[i].text === text && newMsgs[i].isUser) {
              newMsgs[i].id = savedMsg.id;
              break;
           }
        }
        return newMsgs;
      });
      loadSessions(); // refresh titles
    } catch (e) {
      console.error("Failed to save user message:", e);
    }

    const userMessage = { text, isUser: true, imageBase64 };
    setMessages((prev) => [...prev, userMessage]);

    await streamAIResponse(text, imageBase64, docData, activeSessionId);
  };

  const handleRegenerate = async (index) => {
    let text = "";
    let imageBase64 = null;
    let docData = null; // Regenerating won't resend the doc since it's heavy, just the text. Or we could save the docData in state. For now, regenerating only resends the text and image.
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
