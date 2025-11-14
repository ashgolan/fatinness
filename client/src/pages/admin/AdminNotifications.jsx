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
  useTheme,
} from "@mui/material";

import ReplayIcon from "@mui/icons-material/Replay";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever"; // ← لحذف الكل
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep"; // ← لحذف واحد

import { Api } from "../../api/Api";
import { toast } from "react-toastify";

export default function AdminNotifications() {
  const theme = useTheme();
  const mode = theme.palette.mode;

  // 🎨 ألوان الهوية
  const BRAND = {
    gold: "#FFD93D",
    goldDark: "#FFC300",
    purple: "#9B1D6F",
    purpleDark: "#7A1558",
    fuchsia: "#C2185B",
    pink: "#EC407A",
    line: mode === "dark" ? "rgba(255,217,61,0.15)" : "rgba(155,29,111,0.12)",
    bgSoft: mode === "dark" ? "#0f1115" : "#FFF9E6",
    card: mode === "dark" ? "rgba(18,20,28,.95)" : "rgba(255,255,255,.95)",
    text: mode === "dark" ? "#FFFFFF" : "#1a1a1a",
    sub: mode === "dark" ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.6)",
  };

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("all");
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState([]);
  const [users, setUsers] = useState([]);

  // لإعادة الإرسال
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [notificationToResend, setNotificationToResend] = useState(null);
  const [resending, setResending] = useState(false);

  // 📥 جلب السجل والمشتركات
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

  // 🚀 إرسال إشعار جديد
  const handleSend = async () => {
    if (!title.trim() || !body.trim())
      return toast.error("أدخل عنوانًا ومحتوى قبل الإرسال.");

    setLoading(true);
    try {
      const { data } = await Api.post("/admin/notify", {
        title,
        body,
        target,
      });

      toast.success(data.message);
      setTitle("");
      setBody("");
      fetchHistory();
    } catch (err) {
      toast.error(err?.response?.data?.message || "فشل الإرسال");
    } finally {
      setLoading(false);
    }
  };

  // ♻️ إعادة إرسال
  const confirmResend = (n) => {
    setNotificationToResend(n);
    setEditTitle(n.title);
    setEditBody(n.body);
    setConfirmOpen(true);
  };

  const handleConfirmResend = async () => {
    if (!notificationToResend) return;

    if (!editTitle.trim() || !editBody.trim())
      return toast.error("يجب إدخال عنوان ومحتوى.");

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

      toast.success(data.message);
      fetchHistory();
    } catch (err) {
      toast.error("فشل إعادة الإرسال");
    } finally {
      setResending(false);
      setConfirmOpen(false);
      setNotificationToResend(null);
    }
  };

  // 🗑️ حذف واحد
  const handleDeleteNotification = async (id) => {
    if (!window.confirm("هل تريد حذف الإشعار نهائيًا؟")) return;

    try {
      await Api.delete(`/admin/notifications/${id}`);
      toast.success("🗑️ تم حذف الإشعار");
      setHistory((prev) => prev.filter((h) => h._id !== id));
    } catch {
      toast.error("فشل حذف الإشعار");
    }
  };

  // 🧹 مسح السجل بالكامل
  const handleClearAll = async () => {
    if (!window.confirm("هل أنت متأكد أنك تريد مسح كامل السجل؟")) return;

    try {
      await Api.delete("/admin/notifications");
      toast.success("🧹 تم مسح السجل بالكامل");
      setHistory([]);
    } catch {
      toast.error("فشل مسح السجل");
    }
  };

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        py: 4,
        px: { xs: 2, sm: 4 },
        backgroundImage:
          mode === "dark"
            ? `linear-gradient(180deg, #0b0d12, #12151c)`
            : `linear-gradient(180deg, #FFF9E6, #FCE4EC)`,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 900,
          mx: "auto",
          p: { xs: 2.5, sm: 4 },
          borderRadius: 4,
          border: `1px solid ${BRAND.line}`,
          background: BRAND.card,
          boxShadow:
            mode === "dark"
              ? "0 10px 30px rgba(0,0,0,.4)"
              : "0 10px 30px rgba(155,29,111,.08)",
        }}
      >
        {/* العنوان */}
        <Typography
          variant="h5"
          sx={{ fontWeight: 900, color: BRAND.text, mb: 3 }}
        >
          🔔 إرسال إشعار مخصص
        </Typography>

        {/* إنشاء إشعار */}
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            label="عنوان الإشعار"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
            inputProps={{ style: { textAlign: "right" } }}
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

          {/* الفئة */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel
              shrink
              sx={{
                right: 14,
                background: BRAND.card,
                px: 1,
                fontWeight: 600,
              }}
            >
              الفئة المستهدفة
            </InputLabel>

            <Select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              sx={{ textAlign: "right" }}
            >
              <MenuItem value="all">📢 جميع المشتركات</MenuItem>
              <Divider />
              {users.map((u) => (
                <MenuItem key={u._id} value={u._id}>
                  👩 {u.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* زر إرسال */}
          <Box sx={{ textAlign: "center" }}>
            <Button
              variant="outlined"
              onClick={handleSend}
              disabled={loading}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                px: 4,
                py: 1.2,
                borderRadius: 3,
                border: `2px solid ${BRAND.purple}`,
                color: BRAND.purple,
                "&:hover": {
                  background: `${BRAND.purple}10`,
                  borderColor: BRAND.gold,
                  color: BRAND.gold,
                },
              }}
            >
              {loading ? (
                <CircularProgress size={22} sx={{ color: BRAND.purple }} />
              ) : (
                "🔔 إرسال الإشعار"
              )}
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* سجل الإشعارات + زر مسح الكل */}
        <Box
          sx={{
            mb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 900, color: BRAND.text }}>
            🕘 سجل آخر الإشعارات
          </Typography>

          {history.length > 0 && (
            <Button
              variant="text"
              color="error"
              onClick={handleClearAll}
              startIcon={<DeleteForeverIcon />}
              sx={{ fontWeight: 800, gap: 1 }}
            >
              مسح الكل
            </Button>
          )}
        </Box>

        {/* قائمة السجل */}
        <Paper
          elevation={0}
          sx={{
            maxHeight: 400,
            overflowY: "auto",
            borderRadius: 3,
            border: `1px solid ${BRAND.line}`,
            background: BRAND.card,
          }}
        >
          <List>
            {history.map((n) => (
              <ListItem
                key={n._id}
                divider
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                {/* النص */}
                <ListItemText
                  primary={`${n.title} (${
                    n.targetType === "all"
                      ? "جميع المشتركات"
                      : n.targetUser?.username
                  })`}
                  secondary={
                    <>
                      <Typography sx={{ color: BRAND.sub }}>
                        {n.body}
                      </Typography>
                      <Typography variant="caption" sx={{ color: BRAND.sub }}>
                        📅 {new Date(n.createdAt).toLocaleString("ar-EG")}
                        {" — "}
                        👑 {n.sentBy?.username}
                      </Typography>
                    </>
                  }
                  primaryTypographyProps={{
                    sx: {
                      textAlign: "right",
                      fontWeight: 800,
                      color: BRAND.text,
                    },
                  }}
                  secondaryTypographyProps={{
                    sx: { textAlign: "right" },
                  }}
                />

                {/* الأزرار */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    alignItems: "center",
                  }}
                >
                  {/* إعادة إرسال */}
                  <Tooltip title="إعادة الإرسال">
                    <IconButton
                      onClick={() => confirmResend(n)}
                      sx={{ color: BRAND.purple }}
                    >
                      <ReplayIcon />
                    </IconButton>
                  </Tooltip>

                  {/* حذف */}
                  <Tooltip title="حذف نهائي">
                    <IconButton
                      onClick={() => handleDeleteNotification(n._id)}
                      sx={{ color: "#e53935" }}
                    >
                      <DeleteSweepIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItem>
            ))}

            {history.length === 0 && (
              <Typography
                sx={{
                  p: 2,
                  textAlign: "center",
                  color: BRAND.sub,
                  fontWeight: 700,
                }}
              >
                لا يوجد إشعارات بعد.
              </Typography>
            )}
          </List>
        </Paper>
      </Paper>

      {/* نافذة إعادة الإرسال */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: `1px solid ${BRAND.line}`,
            background: BRAND.card,
          },
        }}
      >
        <DialogTitle sx={{ textAlign: "right", fontWeight: 900 }}>
          🔁 إعادة إرسال الإشعار
        </DialogTitle>

        <DialogContent sx={{ textAlign: "right" }}>
          <TextField
            fullWidth
            label="عنوان الإشعار"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            sx={{ mb: 2 }}
            inputProps={{ style: { textAlign: "right" } }}
          />

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="محتوى الإشعار"
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            inputProps={{ style: { textAlign: "right" } }}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: "flex-start" }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            sx={{
              textTransform: "none",
              color: BRAND.sub,
              border: `1px solid ${BRAND.line}`,
              borderRadius: 2,
              px: 3,
            }}
          >
            إلغاء
          </Button>

          <Button
            variant="contained"
            onClick={handleConfirmResend}
            disabled={resending}
            sx={{
              textTransform: "none",
              fontWeight: 900,
              background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.purple})`,
              color: "#fff",
              borderRadius: 2,
              px: 3,
            }}
          >
            {resending ? <CircularProgress size={22} /> : "📤 تأكيد الإرسال"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
