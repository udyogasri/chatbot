import React from "react";
import { Box, Typography, Avatar, Paper } from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";

// Keyframe for bubble appearance animation
const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled container for bubble layout
const BubbleContainer = styled(Box)(({ theme, isUser }) => ({
  display: "flex",
  flexDirection: isUser ? "row-reverse" : "row",
  alignItems: "flex-start",
  marginBottom: theme.spacing(2.5),
  gap: theme.spacing(1.5),
  animation: `${slideIn} 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
  width: "100%",
}));

// Styled paper for the actual message bubble
const Bubble = styled(Paper)(({ theme, isUser }) => ({
  padding: theme.spacing(1.5, 2.5),
  borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
  maxWidth: "75%",
  minWidth: "60px",
  boxShadow: isUser
    ? "0 4px 15px rgba(124, 77, 255, 0.25)"
    : "0 4px 15px rgba(0, 0, 0, 0.15)",
  background: isUser
    ? "linear-gradient(135deg, #7c4dff 0%, #651fff 100%)"
    : "rgba(255, 255, 255, 0.04)",
  border: isUser ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
  color: "#ffffff",
  backdropFilter: isUser ? "none" : "blur(10px)",
  wordBreak: "break-word",
  transition: "transform 0.2s ease",
  "&:hover": {
    transform: "scale(1.01)",
  },
  [theme.breakpoints.down("sm")]: {
    maxWidth: "85%",
    padding: theme.spacing(1.25, 1.75),
  },
}));

// User and AI themed Avatars
const BubbleAvatar = styled(Avatar)(({ theme, isUser }) => ({
  backgroundColor: isUser ? "#b388ff" : "#00b0ff",
  boxShadow: isUser
    ? "0 0 10px rgba(179, 136, 255, 0.4)"
    : "0 0 10px rgba(0, 176, 255, 0.4)",
  width: 36,
  height: 36,
  [theme.breakpoints.down("sm")]: {
    width: 32,
    height: 32,
  },
}));

export const MessageBubble = ({ message, isUser }) => {
  // Utility function to format line breaks and links in text
  const formatText = (text) => {
    if (!text) return "";
    return text.split("\n").map((line, idx) => {
      // Basic inline code rendering
      const parts = line.split(/(`[^`]+`)/g);
      return (
        <span key={idx} style={{ display: "block", minHeight: "1.2em" }}>
          {parts.map((part, pIdx) => {
            if (part.startsWith("`") && part.endsWith("`")) {
              return (
                <code
                  key={pIdx}
                  style={{
                    backgroundColor: isUser
                      ? "rgba(0, 0, 0, 0.2)"
                      : "rgba(255, 255, 255, 0.1)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontFamily: "monospace",
                    fontSize: "0.9em",
                  }}
                >
                  {part.slice(1, -1)}
                </code>
              );
            }
            return part;
          })}
        </span>
      );
    });
  };

  return (
    <BubbleContainer isUser={isUser}>
      <BubbleAvatar isUser={isUser}>
        {isUser ? <PersonRoundedIcon /> : <SmartToyRoundedIcon />}
      </BubbleAvatar>
      <Bubble isUser={isUser} elevation={0}>
        <Typography
          variant="body1"
          component="div"
          sx={{
            fontSize: { xs: "0.92rem", sm: "0.98rem" },
            lineHeight: 1.5,
            fontWeight: 400,
            whiteSpace: "pre-wrap",
            fontFamily: "inherit",
          }}
        >
          {formatText(message)}
        </Typography>
      </Bubble>
    </BubbleContainer>
  );
};

export default MessageBubble;
