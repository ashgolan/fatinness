import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
} from "@mui/material";
import { Api } from "../../api/Api";
import { toast } from "react-toastify";

export default function SlotsAdmin() {
  const [slots, setSlots] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [now, setNow] = useState(new Date());

  // ⏱️ تحديث الوقت كل دقيقة لتحديث العدادات
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // 🔹 توليد قائمة الأسابيع
  const generateWeeks = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const arr = [];

    for (let i = -2; i <= 2; i++) {
      const weekStart = new Date(monday);
      weekStart.setDate(monday.getDate() + i * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      arr.push({
        label: `${weekStart.toLocaleDateString("ar-EG")} → ${weekEnd.toLocaleDateString("ar-EG")}`,
        start: weekStart.toISOString().split("T")[0],
      });
    }

    setWeeks(arr);
    if (!selectedWeek)
      setSelectedWeek(arr.find((w) => w.start >= monday.toISOString().split("T")[0])?.start || arr[0].start);
  };

  useEffect(() => {
    generateWeeks();
  }, []);

  // 🔹 تحميل الحصص
  const fetchSlots = async () => {
    if (!selectedWeek) return;
    setLoading(true);
    try {
      const { data } = await Api.get("/admin/slots", { params: { startDate: selectedWeek } });
      setSlots(data || []);
    } catch {
      toast.error("حدث خطأ أثناء تحميل الحصص");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedWeek]);

  // 🔹 تحميل المشتركات في الحصة
  const fetchBookings = async (slotId) => {
    try {
      const { data } = await Api.get(`/admin/slots/${slotId}/bookings`);
      setBookings(data);
    } catch {
      setBookings([]);
    }
  };

  const handleSlotClick = async (slot) => {
    setSelectedSlot(slot);
    await fetchBookings(slot._id);
    setOpen(true);
  };

  const handleSendReminder = async () => {
    try {
      await Api.post(`/admin/slots/${selectedSlot._id}/reminder`);
      toast.success("✅ تم إرسال التذكير بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء إرسال التذكير");
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedSlot) return;
    const slotDateTime = new Date(selectedSlot.date);
    const [hour, minute] = selectedSlot.startTime.split(":");
    slotDateTime.setHours(hour, minute, 0, 0);
    if (slotDateTime < now) {
      toast.warn("لا يمكن تعطيل أو تفعيل حصة انتهى موعدها ❌");
      return;
    }

    const confirmMsg = selectedSlot.isBlocked
      ? "هل تريدين تفعيل هذه الحصة من جديد؟"
      : "هل تريدين تعطيل هذه الحصة؟";
    if (!window.confirm(confirmMsg)) return;

    try {
      const { data } = await Api.put(`/admin/slots/${selectedSlot._id}/block`);
      toast.success(data.message);
      setOpen(false);
      fetchSlots();
    } catch {
      toast.error("حدث خطأ أثناء تحديث حالة الحصة");
    }
  };

  // 🔹 تحديد الحالة ولون التدرج
  const getSlotStatus = (slot) => {
    if (!slot) return { label: "غير معروفة", gradient: "linear-gradient(to right, #ccc, #999)" };
    if (slot.isBlocked) return { label: "معطّلة", gradient: "linear-gradient(to right, #555, #777)" };

    const start = new Date(slot.date);
    const [sh, sm] = slot.startTime.split(":");
    start.setHours(sh, sm, 0, 0);

    const end = new Date(slot.date);
    const [eh, em] = slot.endTime.split(":");
    end.setHours(eh, em, 0, 0);

    if (end < now) return { label: "منتهية", gradient: "linear-gradient(to right, #b71c1c, #f44336)" };
    if (start <= now && end >= now) return { label: "جارية الآن", gradient: "linear-gradient(to right, #ed6c02, #ff9800)" };
    return { label: "قادمة", gradient: "linear-gradient(to right, #2e7d32, #66bb6a)" };
  };

  // 🔹 عداد الوقت الذكي
  const getTimeDiff = (slot) => {
    const start = new Date(slot.date);
    const [sh, sm] = slot.startTime.split(":");
    start.setHours(sh, sm, 0, 0);

    const diffMs = start - now;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin > 0) {
      const h = Math.floor(diffMin / 60);
      const m = diffMin % 60;
      return `⏳ بعد ${h ? `${h} ساعة و` : ""}${m} دقيقة`;
    } else if (diffMin > -60) {
      return `✅ بدأت منذ ${Math.abs(diffMin)} دقيقة`;
    } else {
      const h = Math.floor(Math.abs(diffMin) / 60);
      const m = Math.abs(diffMin) % 60;
      return `❌ انتهت منذ ${h ? `${h} ساعة و` : ""}${m} دقيقة`;
    }
  };

  const isSlotEnded = (slot) => {
    if (!slot) return true;
    const end = new Date(slot.date);
    if (slot.endTime) {
      const [h, m] = slot.endTime.split(":");
      end.setHours(h, m, 0, 0);
    }
    return end < now;
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        🗓️ إدارة الجدول الأسبوعي
      </Typography>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="week-select-label">اختاري أسبوع العرض</InputLabel>
        <Select
          labelId="week-select-label"
          value={selectedWeek}
          label="اختاري أسبوع العرض"
          onChange={(e) => setSelectedWeek(e.target.value)}
        >
          {weeks.map((w, i) => (
            <MenuItem key={i} value={w.start}>
              {w.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : slots.length ? (
        <Grid container spacing={2}>
          {slots.map((slot) => {
            const status = getSlotStatus(slot);
            return (
              <Grid item xs={12} md={6} lg={4} key={slot._id}>
                <Paper
                  sx={{
                    p: 2,
                    cursor: "pointer",
                    transition: "0.2s",
                    position: "relative",
                    border: "3px solid transparent",
                    background:
                      "linear-gradient(white, white) padding-box," +
                      `${status.gradient} border-box`,
                    borderRadius: "10px",
                    "&:hover": { boxShadow: `0 0 12px ${status.gradient}` },
                  }}
                  onClick={() => handleSlotClick(slot)}
                >
                  {/* 🔹 الكلمة على الإطار */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: "-12px",
                      right: "10px",
                      backgroundColor: "white",
                      color: "#333",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      px: 1,
                    }}
                  >
                    {status.label}
                  </Box>

                  <Typography variant="h6">
                    {new Date(slot.date).toLocaleDateString("ar-EG")}
                  </Typography>
                  <Typography variant="body2">
                    ⏰ {slot.startTime} - {slot.endTime}
                  </Typography>
                  <Typography variant="body2">
                    السعة: {slot.capacity} / المتبقي: {slot.available}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mt: 1, fontStyle: "italic", color: "#555" }}
                  >
                    {getTimeDiff(slot)}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Typography sx={{ mt: 3 }}>لا توجد حصص في هذا الأسبوع.</Typography>
      )}

      {/* نافذة التفاصيل */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>تفاصيل الحصة</DialogTitle>
        <DialogContent>
          {selectedSlot && (
            <>
              <Typography sx={{ mb: 1 }}>
                🗓️ {new Date(selectedSlot.date).toLocaleDateString("ar-EG")}
              </Typography>
              <Typography sx={{ mb: 2 }}>
                ⏰ {selectedSlot.startTime} - {selectedSlot.endTime}
              </Typography>

              {bookings.length ? (
                <List dense>
                  {bookings.map((b) => (
                    <ListItem key={b._id}>
                      <ListItemText
                        primary={`🧍‍♀️ ${b.user?.name || "غير معروف"} — ${
                          b.user?.phone || ""
                        }`}
                        secondary={`الحالة: ${
                          b.status === "booked" ? "محجوزة ✅" : "ألغيت ❌"
                        }`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  لا توجد مشتركات في هذه الحصة.
                </Typography>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          {!bookings.length || isSlotEnded(selectedSlot) ? null : (
            <Button onClick={handleSendReminder}>🔔 إرسال تذكير</Button>
          )}

          {!isSlotEnded(selectedSlot) && (
            <Button
              color={selectedSlot?.isBlocked ? "success" : "error"}
              onClick={handleToggleBlock}
            >
              {selectedSlot?.isBlocked ? "🔁 تفعيل الحصة" : "🚫 تعطيل الحصة"}
            </Button>
          )}

          <Button onClick={() => setOpen(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
