import React, { useState } from "react";
import { Box, Typography, Button, IconButton, List, ListItem, ListItemButton, ListItemText, Tooltip, TextField } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import ViewSidebarRoundedIcon from "@mui/icons-material/ViewSidebarRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";

const Sidebar = ({ sessions, currentSessionId, onNewChat, onSelectSession, onDeleteSession, isOpen, toggleSidebar, onRenameSession, onSearch, themeMode, toggleTheme }) => {
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const startEditing = (e, session) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const handleEditSubmit = (e, session) => {
    e.preventDefault();
    e.stopPropagation();
    if (editTitle.trim() && editTitle !== session.title) {
      onRenameSession(session.id, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const handleEditKeyDown = (e, session) => {
    if (e.key === 'Enter') {
      handleEditSubmit(e, session);
    } else if (e.key === 'Escape') {
      setEditingSessionId(null);
    }
  };
  return (
    <Box
      sx={{
        width: isOpen ? { xs: 260, sm: 280 } : 0,
        height: "100%",
        backgroundColor: "#000000",
        borderRight: isOpen ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
        flexShrink: 0,
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-right 0.3s ease",
        overflow: "hidden",
        whiteSpace: "nowrap"
      }}
    >
      <Box sx={{ width: { xs: 260, sm: 280 }, p: 2, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<AddRoundedIcon />}
            onClick={onNewChat}
            sx={{
              flexGrow: 1,
              justifyContent: "flex-start",
              color: "#fff",
              borderColor: "rgba(255, 255, 255, 0.2)",
              textTransform: "none",
              fontWeight: 600,
              p: 1.5,
              borderRadius: 2,
              mr: 1,
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderColor: "rgba(255, 255, 255, 0.3)",
              },
            }}
          >
            New Chat
          </Button>
          <Tooltip title="Close sidebar">
            <IconButton onClick={toggleSidebar} sx={{ color: "rgba(255,255,255,0.7)" }}>
              <ViewSidebarRoundedIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ mb: 2 }}>
          <TextField
            placeholder="Search past chats..."
            variant="outlined"
            size="small"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsSearching(true);
                onSearch(searchQuery).finally(() => setIsSearching(false));
              }
            }}
            InputProps={{
              startAdornment: <SearchRoundedIcon sx={{ color: "rgba(255,255,255,0.5)", mr: 1, fontSize: 20 }} />,
              sx: {
                color: "rgba(255,255,255,0.9)",
                borderRadius: 2,
                background: "rgba(255,255,255,0.05)",
                "& fieldset": { border: "none" },
                "&:hover fieldset": { border: "none" },
                "&.Mui-focused fieldset": { border: "1px solid rgba(124,77,255,0.5)" },
              }
            }}
          />
        </Box>

      <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.5)", fontWeight: 600, mb: 1, pl: 1 }}>
        Recent
      </Typography>

      <List sx={{ flexGrow: 1, overflowY: "auto", p: 0, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px' } }}>
        {sessions.map((session) => (
          <ListItem
            key={session.id}
            disablePadding
            secondaryAction={
              <Box sx={{ display: 'flex', opacity: currentSessionId === session.id ? 1 : 0, transition: "opacity 0.2s" }} className="action-btns">
                {editingSessionId !== session.id && (
                  <Tooltip title="Edit Chat">
                    <IconButton 
                      size="small"
                      onClick={(e) => startEditing(e, session)}
                      sx={{ color: "rgba(255,255,255,0.3)", "&:hover": { color: "#fff" }, mr: 0.5 }}
                    >
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Delete Chat">
                  <IconButton 
                    size="small"
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                    sx={{ color: "rgba(255,255,255,0.3)", "&:hover": { color: "#ff5252" } }}
                  >
                    <DeleteRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            }
            sx={{
              "&:hover .action-btns": { opacity: 1 },
              mb: 0.5
            }}
          >
            <ListItemButton
              selected={currentSessionId === session.id}
              onClick={() => onSelectSession(session.id)}
              sx={{
                borderRadius: 2,
                "&.Mui-selected": {
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                },
                "&.Mui-selected:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                },
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                },
                py: 1,
                px: 1.5
              }}
            >
              <ChatBubbleOutlineRoundedIcon fontSize="small" sx={{ color: "rgba(255,255,255,0.7)", mr: 1.5 }} />
              {editingSessionId === session.id ? (
                <TextField
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => handleEditKeyDown(e, session)}
                  onBlur={(e) => handleEditSubmit(e, session)}
                  autoFocus
                  size="small"
                  variant="standard"
                  InputProps={{
                    disableUnderline: true,
                    sx: { color: "rgba(255,255,255,0.9)", fontSize: "0.9rem", p: 0, height: 'auto' }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <ListItemText 
                  primary={session.title} 
                  primaryTypographyProps={{ 
                    noWrap: true, 
                    fontSize: "0.9rem",
                    color: "rgba(255,255,255,0.9)",
                    fontWeight: currentSessionId === session.id ? 500 : 400
                  }} 
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ p: 2, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <Button
          fullWidth
          variant="text"
          onClick={toggleTheme}
          startIcon={themeMode === 'dark' ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
          sx={{
            color: "rgba(255, 255, 255, 0.7)",
            justifyContent: "flex-start",
            textTransform: "none",
            "&:hover": { color: "#fff", backgroundColor: "rgba(255, 255, 255, 0.05)" }
          }}
        >
          {themeMode === 'dark' ? "Light Mode" : "Dark Mode"}
        </Button>
      </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;
