import React, { useState, useRef } from "react";
import { Box, TextField, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";

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
  flexDirection: "column",
  width: "100%",
  maxWidth: "900px",
  margin: "0 auto",
  background: "rgba(255, 255, 255, 0.03)",
  borderRadius: "24px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  transition: "border-color 0.2s, box-shadow 0.2s",
  "&:focus-within": {
    borderColor: "#7c4dff",
    boxShadow: "0 0 15px rgba(124, 77, 255, 0.15)",
    background: "rgba(255, 255, 255, 0.05)",
  },
}));

const InputRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  width: "100%",
  paddingRight: theme.spacing(0.75),
}));

const PreviewArea = styled(Box)(({ theme }) => ({
  position: "relative",
  padding: theme.spacing(2, 2, 0, 2),
  display: "inline-block",
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

const MicButton = styled(IconButton)(({ theme, islistening }) => ({
  color: islistening === "true" ? "#ff5252" : "rgba(255,255,255,0.5)",
  marginLeft: theme.spacing(1),
  transition: "all 0.3s ease",
  ...(islistening === "true" && {
    animation: "micpulse 1.5s infinite",
  }),
  "@keyframes micpulse": {
    "0%": { boxShadow: "0 0 0 0 rgba(255, 82, 82, 0.4)", borderRadius: "50%" },
    "70%": { boxShadow: "0 0 0 10px rgba(255, 82, 82, 0)", borderRadius: "50%" },
    "100%": { boxShadow: "0 0 0 0 rgba(255, 82, 82, 0)", borderRadius: "50%" }
  }
}));

export const ChatInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [docPreview, setDocPreview] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  const handleMicClick = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Try Chrome.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setMessage(transcript);
    };
    
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(",")[1];
        setImagePreview({ url: reader.result, rawBase64: base64String });
        setDocPreview(null);
      };
      reader.readAsDataURL(file);
    } else if (file.type === "application/pdf" || file.type === "text/plain" || file.type === "text/csv") {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(",")[1];
        setDocPreview({ name: file.name, type: file.type, base64: base64String });
        setImagePreview(null);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Unsupported file type. Please upload images, PDFs, CSVs, or text files.");
    }
  };

  const removeFile = () => {
    setImagePreview(null);
    setDocPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = () => {
    if ((message.trim() || imagePreview || docPreview) && !disabled) {
      onSendMessage(
        message.trim() || (docPreview ? `Analyze this document: ${docPreview.name}` : ""), 
        imagePreview ? imagePreview.rawBase64 : null,
        docPreview
      );
      setMessage("");
      removeFile();
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
        {(imagePreview || docPreview) && (
          <PreviewArea>
            <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 1, p: 1, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 2, background: "rgba(0,0,0,0.5)" }}>
              {imagePreview ? (
                <img
                  src={imagePreview.url}
                  alt="Upload preview"
                  style={{ height: 60, borderRadius: 4, objectFit: "contain" }}
                />
              ) : (
                <>
                  <InsertDriveFileRoundedIcon sx={{ fontSize: 32, color: "#00b0ff" }} />
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)", maxWidth: 150, whiteSpace: "nowrap", textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {docPreview.name}
                  </Typography>
                </>
              )}
              <IconButton
                size="small"
                onClick={removeFile}
                sx={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  background: "rgba(255,82,82,0.9)",
                  color: "#fff",
                  "&:hover": { background: "rgba(255,82,82,1)" },
                }}
              >
                <CloseRoundedIcon fontSize="small" sx={{ width: 14, height: 14 }} />
              </IconButton>
            </Box>
          </PreviewArea>
        )}
        <InputRow>
          <input
            type="file"
            accept="image/*,.pdf,.txt,.csv"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <IconButton
            sx={{ color: "rgba(255,255,255,0.5)", ml: 1 }}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={disabled}
          >
            <AttachFileRoundedIcon />
          </IconButton>
          <MicButton
            islistening={isListening.toString()}
            onClick={handleMicClick}
            disabled={disabled}
          >
            <MicRoundedIcon />
          </MicButton>
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
            disabled={(!message.trim() && !imagePreview && !docPreview) || disabled}
            aria-label="send message"
          >
            <SendRoundedIcon fontSize="small" />
          </SendButton>
        </InputRow>
      </InnerContainer>
    </InputWrapper>
  );
};

export default ChatInput;
