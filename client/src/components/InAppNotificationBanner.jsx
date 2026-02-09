import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function InAppNotificationBanner({ data, onClose }) {
  if (!data) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2000,
        background: "linear-gradient(135deg,#9c27b0,#ec407a)",
        color: "#fff",
        px: 2,
        py: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Typography sx={{ fontWeight: 800 }}>
        ⏰ {data.title}
      </Typography>

      <Typography sx={{ opacity: 0.9, flex: 1 }}>
        {data.body}
      </Typography>

      <IconButton onClick={onClose} sx={{ color: "#fff" }}>
        <CloseIcon />
      </IconButton>
    </Box>
  );
}
