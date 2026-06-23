import React, { useState } from "react";
import { Box, Typography, Avatar, Paper, IconButton, Tooltip, TextField, Button } from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import ThumbUpRoundedIcon from "@mui/icons-material/ThumbUpRounded";
import ThumbDownRoundedIcon from "@mui/icons-material/ThumbDownRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

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

export const MessageBubble = ({ message, isUser, toolStatus, imageBase64, index, onRegenerate, onEdit }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'up' | 'down' | null
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFeedback = (type) => {
    setFeedback(prev => (prev === type ? null : type));
  };

  const handleTTS = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      if (message) {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    }
  };

  const handleEditSubmit = () => {
    if (editText.trim() && editText !== message) {
      onEdit(index, editText);
    }
    setIsEditing(false);
  };

  return (
    <BubbleContainer isUser={isUser}>
      <BubbleAvatar isUser={isUser}>
        {isUser ? <PersonRoundedIcon /> : <SmartToyRoundedIcon />}
      </BubbleAvatar>
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        {toolStatus && !isUser && (
          <Typography variant="caption" sx={{ color: '#00b0ff', mb: 0.5, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 1 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#00b0ff', animation: 'pulse 1s infinite' }} />
            {toolStatus}
          </Typography>
        )}
        {(message || isUser || imageBase64) && (
          <Box sx={{ width: '100%', display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', '&:hover .edit-btn': { opacity: 1 } }}>
            {isEditing ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: { xs: '250px', sm: '400px', md: '500px' }, p: 2, borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                <TextField
                  multiline
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: 1,
                    '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: '#7c4dff' } }
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 0.5 }}>
                  <Button size="small" sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#fff' } }} onClick={() => { setIsEditing(false); setEditText(message); }}>Cancel</Button>
                  <Button size="small" variant="contained" sx={{ bgcolor: '#7c4dff', '&:hover': { bgcolor: '#651fff' }, borderRadius: '8px', textTransform: 'none', px: 2 }} onClick={handleEditSubmit}>Save & Resubmit</Button>
                </Box>
              </Box>
            ) : (
              <React.Fragment>
                {isUser && onEdit && (
                  <IconButton 
                    className="edit-btn"
                    size="small" 
                    onClick={() => setIsEditing(true)} 
                    sx={{ 
                      position: 'absolute', 
                      left: -36,
                      opacity: 0, 
                      transition: 'opacity 0.2s',
                      color: 'rgba(255,255,255,0.5)', 
                      '&:hover': { color: '#fff' },
                      zIndex: 10
                    }}
                  >
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                )}
                <Bubble isUser={isUser} elevation={0}>
                  {imageBase64 && (
                    <Box sx={{ mb: message ? 1.5 : 0 }}>
                      <img
                        src={`data:image/jpeg;base64,${imageBase64}`}
                        alt="Uploaded media"
                        style={{ maxWidth: "100%", borderRadius: "8px", maxHeight: "300px", objectFit: "contain" }}
                      />
                    </Box>
                  )}
                  {message && (
                    <Box
                      sx={{
                        "& p": { margin: 0, marginBottom: "0.5rem", "&:last-child": { marginBottom: 0 } },
                        "& pre": { margin: 0, borderRadius: "6px", overflow: "hidden" },
                        "& code": { fontFamily: "monospace", fontSize: "0.9em" },
                        "& ul, & ol": { marginTop: "0.25rem", marginBottom: "0.5rem", paddingLeft: "1.5rem" },
                        "& li": { marginBottom: "0.25rem" },
                        fontSize: { xs: "0.92rem", sm: "0.98rem" },
                        lineHeight: 1.5,
                        fontWeight: 400,
                        fontFamily: "inherit",
                      }}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || "");
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                            ) : (
                              <code
                                className={className}
                                style={{
                                  backgroundColor: isUser ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.1)",
                                  padding: "0.1em 0.3em",
                                  borderRadius: "4px"
                                }}
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {message}
                      </ReactMarkdown>
                    </Box>
                  )}
                </Bubble>
              </React.Fragment>
            )}
          </Box>
          </Box>
        )}
        
        {/* Action Toolbar for AI Messages */}
        {!isUser && message && (
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, ml: 1, opacity: 0.7, '&:hover': { opacity: 1 }, transition: 'opacity 0.2s' }}>
            <Tooltip title={isCopied ? "Copied!" : "Copy"}>
              <IconButton size="small" onClick={handleCopy} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#fff" } }}>
                {isCopied ? <CheckRoundedIcon fontSize="small" sx={{ color: "#00e676" }} /> : <ContentCopyRoundedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Read Aloud">
              <IconButton size="small" onClick={handleTTS} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#fff" } }}>
                {isSpeaking ? <StopRoundedIcon fontSize="small" sx={{ color: "#ff5252" }} /> : <VolumeUpRoundedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Good response">
              <IconButton size="small" onClick={() => handleFeedback('up')} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#fff" } }}>
                {feedback === 'up' ? <ThumbUpRoundedIcon fontSize="small" /> : <ThumbUpOutlinedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Bad response">
              <IconButton size="small" onClick={() => handleFeedback('down')} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#fff" } }}>
                {feedback === 'down' ? <ThumbDownRoundedIcon fontSize="small" /> : <ThumbDownOutlinedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Regenerate">
              <IconButton size="small" onClick={() => onRegenerate(index)} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#fff" } }}>
                <ReplayRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </BubbleContainer>
  );
};

export default MessageBubble;
