import React, { useEffect, useRef } from "react";
import { Box, Typography, Alert, CircularProgress, Link } from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

// Glowing keyframes for the pulse dot loading indicator
const pulse = keyframes`
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
`;

const WindowContainer = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  width: "100vw",
  backgroundColor: "#0b0f19",
  backgroundImage:
    "radial-gradient(circle at 10% 20%, rgba(124, 77, 255, 0.05) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(0, 176, 255, 0.05) 0%, transparent 40%)",
  overflow: "hidden",
}));

const Header = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(2, 3),
  background: "rgba(11, 15, 25, 0.7)",
  backdropFilter: "blur(20px)",
  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  zIndex: 10,
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1.5, 2),
  },
}));

const StatusDot = styled(Box)(() => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  backgroundColor: "#00e676",
  marginLeft: 12,
  boxShadow: "0 0 10px #00e676",
}));

const MessageArea = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: "auto",
  padding: theme.spacing(3),
  display: "flex",
  flexDirection: "column",
  "&::-webkit-scrollbar": {
    width: "6px",
  },
  "&::-webkit-scrollbar-track": {
    background: "transparent",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "10px",
    "&:hover": {
      background: "rgba(255, 255, 255, 0.2)",
    },
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const LoadingBubble = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  background: "rgba(255, 255, 255, 0.04)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  padding: theme.spacing(1.75, 2.5),
  borderRadius: "20px 20px 20px 4px",
  alignSelf: "flex-start",
  marginLeft: theme.spacing(5.25),
  marginBottom: theme.spacing(2),
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)",
}));

const Dot = styled(Box)(({ delay }) => ({
  width: 7,
  height: 7,
  borderRadius: "50%",
  backgroundColor: "#00b0ff",
  animation: `${pulse} 1.2s infinite ease-in-out`,
  animationDelay: delay,
}));

const EmptyState = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  flexGrow: 1,
  padding: theme.spacing(4),
  textAlign: "center",
  color: "rgba(255, 255, 255, 0.5)",
  gap: theme.spacing(2),
}));

export const ChatWindow = ({ messages, isLoading, error, onSendMessage }) => {
  const messagesEndRef = useRef(null);

  // Automatically scroll to latest message when array length changes or loading changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <WindowContainer>
      {/* Dynamic Header */}
      <Header>
        <SmartToyRoundedIcon sx={{ color: "#7c4dff", fontSize: 32, mr: 1.5 }} />
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.05rem", sm: "1.25rem" },
              letterSpacing: "0.5px",
            }}
          >
            AI Chat Assistant
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255, 255, 255, 0.5)" }}
            >
              Online
            </Typography>
            <StatusDot />
          </Box>
        </Box>
      </Header>

      {/* Main Message Area */}
      <MessageArea>
        {messages.length === 0 ? (
          <EmptyState>
            <SmartToyRoundedIcon
              sx={{ fontSize: 64, color: "rgba(124, 77, 255, 0.15)", mb: 1 }}
            />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: "rgba(255, 255, 255, 0.8)",
                fontSize: { xs: "1.2rem", sm: "1.5rem" },
              }}
            >
              Welcome to AI Chat!
            </Typography>
            <Typography
              variant="body2"
              sx={{
                maxWidth: "400px",
                fontSize: { xs: "0.85rem", sm: "0.95rem" },
              }}
            >
              Ask me anything. I'm powered by OpenAI's language models and
              FastAPI.
            </Typography>
          </EmptyState>
        ) : (
          messages.map((msg, index) => (
            <MessageBubble key={index} message={msg.text} isUser={msg.isUser} />
          ))
        )}

        {/* Pulsing AI Typing Loader */}
        {isLoading && (
          <LoadingBubble>
            <Dot delay="0s" />
            <Dot delay="0.2s" />
            <Dot delay="0.4s" />
          </LoadingBubble>
        )}

        {/* Global Error Banner */}
        {error && (
          <Alert
            severity="error"
            sx={{
              borderRadius: "12px",
              mt: 1,
              mb: 2,
              alignSelf: "center",
              background: "rgba(211, 47, 47, 0.1)",
              border: "1px solid rgba(211, 47, 47, 0.3)",
              color: "#ff8a80",
              maxWidth: "90%",
              "& .MuiAlert-icon": {
                color: "#ff5252",
              },
            }}
          >
            {error}
          </Alert>
        )}

        <div ref={messagesEndRef} />
      </MessageArea>

      {/* Message Input Bottom Area */}
      <ChatInput onSendMessage={onSendMessage} disabled={isLoading} />
    </WindowContainer>
  );
};

export default ChatWindow;
