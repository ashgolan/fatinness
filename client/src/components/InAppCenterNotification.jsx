import React from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Button,
  Fade,
} from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";

export default function InAppCenterNotification({
  open,
  notification,
  onClose,
  onOpenNotifications,
}) {
  if (!notification) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Fade}
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 3,
          minWidth: 320,
          textAlign: "center",
        },
      }}
    >
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <NotificationsActiveIcon
            sx={{ fontSize: 48, color: "#9B1D6F" }}
          />
        </Box>

        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {notification.title}
        </Typography>

        <Typography variant="body2" sx={{ opacity: 0.8, mb: 3 }}>
          {notification.body}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <Button variant="outlined" onClick={onClose}>
            إغلاق
          </Button>

          <Button
            variant="contained"
            onClick={() => {
              onClose();
              onOpenNotifications();
            }}
            sx={{
              background: "linear-gradient(135deg, #FFD93D, #9B1D6F)",
              fontWeight: 700,
            }}
          >
            عرض الإشعارات
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
