import React, { useState } from "react";
import { Box, TextField, IconButton, InputAdornment } from "@mui/material";
import { styled } from "@mui/material/styles";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

const InputWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-end",
  padding: theme.spacing(1.5),
  background: "rgba(15, 22, 41, 0.65)",
  backdropFilter: "blur(20px)",
  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
  position: "relative",
  zIndex: 2,
}));

const InnerContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  width: "100%",
  maxWidth: "900px",
  margin: "0 auto",
  background: "rgba(255, 255, 255, 0.03)",
  borderRadius: "24px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  paddingRight: theme.spacing(0.75),
  transition: "border-color 0.2s, box-shadow 0.2s",
  "&:focus-within": {
    borderColor: "#7c4dff",
    boxShadow: "0 0 15px rgba(124, 77, 255, 0.15)",
    background: "rgba(255, 255, 255, 0.05)",
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  flexGrow: 1,
  "& .MuiOutlinedInput-root": {
    color: "#ffffff",
    fontSize: "0.96rem",
    fontFamily: "inherit",
    "& fieldset": {
      border: "none",
    },
    "&:hover fieldset": {
      border: "none",
    },
    "&.Mui-focused fieldset": {
      border: "none",
    },
    padding: theme.spacing(1.5, 2.5),
  },
}));

const SendButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: "#7c4dff",
  color: "#ffffff",
  margin: theme.spacing(0.5),
  padding: theme.spacing(1.25),
  boxShadow: "0 4px 10px rgba(124, 77, 255, 0.3)",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "#651fff",
    boxShadow: "0 4px 15px rgba(101, 31, 255, 0.5)",
    transform: "scale(1.05)",
  },
  "&.Mui-disabled": {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    color: "rgba(255, 255, 255, 0.3)",
    boxShadow: "none",
  },
}));

export const ChatInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (event) => {
    // If Enter is pressed without Shift key, send message
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <InputWrapper>
      <InnerContainer>
        <StyledTextField
          placeholder="Message AI Assistant..."
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          variant="outlined"
          fullWidth
        />
        <SendButton
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          aria-label="send message"
        >
          <SendRoundedIcon fontSize="small" />
        </SendButton>
      </InnerContainer>
    </InputWrapper>
  );
};

export default ChatInput;
