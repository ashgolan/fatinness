import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { Replay } from "@mui/icons-material";
import { Api } from "../../api/Api";
import { toast } from "react-toastify";

export default function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("all");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [users, setUsers] = useState([]);

  // 🔹 للحوار التأكيدي مع التحرير
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [notificationToResend, setNotificationToResend] = useState(null);
  const [resending, setResending] = useState(false);

  // 🔹 جلب السجل والمشتركات
  const fetchHistory = async () => {
    try {
      const [{ data: historyData }, { data: usersData }] = await Promise.all([
        Api.get("/admin/notifications"),
        Api.get("/admin/users"),
      ]);
      setHistory(historyData);
      setUsers(usersData);
    } catch {
      toast.error("فشل جلب البيانات");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // 🔹 إرسال إشعار جديد
  const handleSend = async () => {
    if (!title.trim() || !body.trim())
      return toast.error("أدخل عنوانًا ومحتوى قبل الإرسال.");

    setLoading(true);
    try {
      const { data } = await Api.post("/admin/notify", { title, body, target });
      toast.success(data.message || "تم الإرسال بنجاح");
      setTitle("");
      setBody("");
      fetchHistory();
    } catch (err) {
      toast.error(err?.response?.data?.message || "فشل الإرسال");
    } finally {
      setLoading(false);
    }
  };

  // 🔁 فتح حوار التأكيد مع إمكانية التحرير
  const confirmResend = (n) => {
    setNotificationToResend(n);
    setEditTitle(n.title);
    setEditBody(n.body);
    setConfirmOpen(true);
  };

  // ✅ تأكيد إعادة الإرسال (بعد التحرير)
  const handleConfirmResend = async () => {
    if (!notificationToResend) return;
    if (!editTitle.trim() || !editBody.trim())
      return toast.error("يجب إدخال عنوان ومحتوى قبل الإرسال.");

    setResending(true);
    try {
      const { data } = await Api.post("/admin/notify", {
        title: editTitle,
        body: editBody,
        target:
          notificationToResend.targetType === "all"
            ? "all"
            : notificationToResend.targetUser?._id,
      });
      toast.success(data.message || "تمت إعادة الإرسال بنجاح");
      fetchHistory();
    } catch (err) {
      toast.error(err?.response?.data?.message || "فشل إعادة الإرسال");
    } finally {
      setResending(false);
      setConfirmOpen(false);
      setNotificationToResend(null);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        🔔 إرسال إشعار مخصص
      </Typography>

      {/* 📤 مربع إنشاء إشعار */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <TextField
          fullWidth
          label="عنوان الإشعار"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="محتوى الإشعار"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>الفئة المستهدفة</InputLabel>
          <Select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            MenuProps={{ PaperProps: { style: { maxHeight: 350 } } }}
          >
            <MenuItem value="all">📢 جميع المشتركات</MenuItem>
            <Divider sx={{ my: 1 }} />
            {users.length > 0 ? (
              users.map((u) => (
                <MenuItem key={u._id} value={u._id}>
                  👩 {u.username}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>لا يوجد مشتركات</MenuItem>
            )}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "إرسال الإشعار"}
        </Button>
      </Paper>

      <Divider sx={{ mb: 3 }} />

      {/* 🕘 سجل الإشعارات */}
      <Typography variant="h6" gutterBottom>
        🕘 سجل آخر الإشعارات
      </Typography>

      <Paper sx={{ maxHeight: 400, overflowY: "auto" }}>
        <List>
          {history.map((n) => (
            <ListItem
              key={n._id}
              divider
              secondaryAction={
                <Tooltip title="إعادة الإرسال مع تعديل">
                  <IconButton
                    edge="end"
                    color="primary"
                    onClick={() => confirmResend(n)}
                  >
                    <Replay />
                  </IconButton>
                </Tooltip>
              }
            >
              <ListItemText
                primary={`${n.title} (${
                  n.targetType === "all"
                    ? "جميع المشتركات"
                    : n.targetUser?.username
                })`}
                secondary={
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {n.body}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", mt: 0.5 }}
                    >
                      📅 {new Date(n.createdAt).toLocaleString("ar-EG")} — 👑{" "}
                      {n.sentBy?.username}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
          {!history.length && (
            <Typography sx={{ p: 2, textAlign: "center" }}>
              لا يوجد إشعارات بعد.
            </Typography>
          )}
        </List>
      </Paper>

      {/* 🧩 نافذة التأكيد مع التحرير */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>🔁 إعادة إرسال الإشعار</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            يمكنك تعديل العنوان أو المحتوى قبل إعادة الإرسال:
          </Typography>

          <TextField
            fullWidth
            label="عنوان الإشعار"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="محتوى الإشعار"
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            disabled={resending}
            color="inherit"
          >
            إلغاء
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmResend}
            disabled={resending}
          >
            {resending ? <CircularProgress size={22} /> : "📤 تأكيد الإرسال"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
