import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Divider,
  Chip,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { Api } from "../api/Api";
import { toast } from "react-toastify";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // 📥 جلب الإشعارات
  const fetchNotifications = async () => {
    try {
      const { data } = await Api.get("/notifications");
      setNotifications(data);
    } catch (err) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ✅ تعليم إشعار كمقروء
  const markAsRead = async (id) => {
    try {
      await Api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        )
      );
    } catch (err) {
      toast.error("Error updating notification");
    }
  };

  // 📭 تعليم الكل كمقروء
  const markAllAsRead = async () => {
    try {
      await Api.put("/notifications/read-all");
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (err) {
      toast.error("Error updating notifications");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <NotificationsIcon />
          إشعاراتي
        </Typography>

        <Button variant="outlined" size="small" onClick={markAllAsRead}>
          تعليم الكل كمقروء
        </Button>
      </Box>

      {notifications.length === 0 && (
        <Typography color="text.secondary">
          لا توجد إشعارات حالياً
        </Typography>
      )}

      {notifications.map((n) => (
        <Paper
          key={n._id}
          onClick={() => !n.isRead && markAsRead(n._id)}
          sx={{
            p: 2,
            mb: 2,
            cursor: "pointer",
            backgroundColor: n.isRead ? "#fff" : "#f5f5f5",
            borderLeft: n.isRead ? "4px solid transparent" : "4px solid #1976d2",
            transition: "0.2s",
            "&:hover": {
              backgroundColor: "#eeeeee",
            },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {n.title}
            </Typography>

            {!n.isRead && (
              <Chip label="جديد" size="small" color="primary" />
            )}
          </Box>

          <Typography variant="body2" sx={{ mt: 1 }}>
            {n.body}
          </Typography>

          <Divider sx={{ my: 1 }} />

          <Typography variant="caption" color="text.secondary">
            {new Date(n.createdAt).toLocaleString()}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
