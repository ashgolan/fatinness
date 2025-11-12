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
import { Replay } from "@mui/icons-material";
import { Api } from "../../api/Api";
import { toast } from "react-toastify";

export default function AdminNotifications() {
  const theme = useTheme();
  const mode = theme.palette.mode;

  // 🎨 ألوان الهوية البصرية (Fatiness)
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

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [notificationToResend, setNotificationToResend] = useState(null);
  const [resending, setResending] = useState(false);

  const [notificationType, setNotificationType] = useState("smart"); // "fcm" أو "smart"

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
        mode: notificationType,
      });
      toast.success(
        data.message ||
          (notificationType === "smart"
            ? "✅ تم الإرسال بالإشعار الذكي"
            : "📱 تم الإرسال عبر التطبيق فقط")
      );
      setTitle("");
      setBody("");
      fetchHistory();
    } catch (err) {
      toast.error(err?.response?.data?.message || "فشل الإرسال");
    } finally {
      setLoading(false);
    }
  };

  const confirmResend = (n) => {
    setNotificationToResend(n);
    setEditTitle(n.title);
    setEditBody(n.body);
    setConfirmOpen(true);
  };

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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 900, color: BRAND.text, display: "flex", gap: 1 }}
          >
            🔔 إرسال إشعار مخصص
          </Typography>
        </Box>

        {/* 📤 إنشاء إشعار */}
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
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel
              shrink
              sx={{
                right: 14,
                left: "auto",
                background: mode === "dark" ? BRAND.card : "#fff",
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
              MenuProps={{
                PaperProps: {
                  sx: {
                    borderRadius: 2,
                    mt: 1,
                    border: `1px solid ${BRAND.line}`,
                    backgroundColor: BRAND.card,
                  },
                },
              }}
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
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel
              shrink
              sx={{
                right: 14,
                left: "auto",
                background: mode === "dark" ? BRAND.card : "#fff",
                px: 1,
                fontWeight: 600,
              }}
            >
              نوع الإشعار
            </InputLabel>
            <Select
              value={notificationType}
              onChange={(e) => setNotificationType(e.target.value)}
              sx={{ textAlign: "right" }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    borderRadius: 2,
                    mt: 1,
                    border: `1px solid ${BRAND.line}`,
                    backgroundColor: BRAND.card,
                  },
                },
              }}
            >
              <MenuItem value="smart">🤖 إشعار ذكي (FCM + WhatsApp)</MenuItem>
              <MenuItem value="fcm">📱 عبر التطبيق فقط (FCM)</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
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
                background: "transparent",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: 1,
                "&:hover": {
                  background: `${BRAND.purple}10`, // خلفية شفافة خفيفة من البنفسجي
                  borderColor: BRAND.gold,
                  color: BRAND.gold,
                  boxShadow: `0 0 8px ${BRAND.gold}40`,
                },
                "&:disabled": {
                  opacity: 0.6,
                },
              }}
            >
              {loading ? (
                <CircularProgress size={22} sx={{ color: BRAND.purple }} />
              ) : (
                <>
                  🔔{" "}
                  <Typography sx={{ fontWeight: 800 }}>
                    إرسال الإشعار
                  </Typography>
                </>
              )}
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* 🕘 سجل الإشعارات */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 900,
            color: BRAND.text,
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          🕘 سجل آخر الإشعارات
        </Typography>

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
                secondaryAction={
                  <Tooltip title="إعادة الإرسال مع تعديل">
                    <IconButton
                      edge="start"
                      onClick={() => confirmResend(n)}
                      sx={{
                        color: BRAND.purple,
                        "&:hover": { color: BRAND.fuchsia },
                      }}
                    >
                      <Replay />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemText
                  primaryTypographyProps={{
                    sx: {
                      textAlign: "right",
                      fontWeight: 800,
                      color: BRAND.text,
                    },
                  }}
                  secondaryTypographyProps={{
                    sx: { textAlign: "right", color: BRAND.sub },
                  }}
                  primary={`${n.title} (${
                    n.targetType === "all"
                      ? "جميع المشتركات"
                      : n.targetUser?.username
                  })`}
                  secondary={
                    <>
                      <Typography
                        variant="body2"
                        sx={{ textAlign: "right", color: BRAND.sub }}
                      >
                        {n.body}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ display: "block", mt: 0.5, textAlign: "right" }}
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

      {/* 🧩 نافذة التأكيد مع التحرير */}
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
        <DialogTitle
          sx={{ textAlign: "right", fontWeight: 900, color: BRAND.text }}
        >
          🔁 إعادة إرسال الإشعار
        </DialogTitle>
        <DialogContent sx={{ textAlign: "right" }}>
          <Typography sx={{ mb: 2, color: BRAND.sub }}>
            يمكنك تعديل العنوان أو المحتوى قبل إعادة الإرسال:
          </Typography>
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
            disabled={resending}
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
              "&:hover": { filter: "brightness(1.1)" },
            }}
          >
            {resending ? <CircularProgress size={22} /> : "📤 تأكيد الإرسال"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
