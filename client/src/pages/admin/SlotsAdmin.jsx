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
  ToggleButton,
  ToggleButtonGroup,
  Divider,
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
  const [weekRange, setWeekRange] = useState({ start: "", end: "" });
  const [filter, setFilter] = useState("active");

  // ⏰ تحديث الوقت كل دقيقة
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // 📅 توليد قائمة الأسابيع
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
    if (!selectedWeek) setSelectedWeek(arr[2].start);
  };

  useEffect(() => {
    generateWeeks();
  }, []);

  // 📥 تحميل الحصص
  const fetchSlots = async () => {
    if (!selectedWeek) return;
    setLoading(true);
    try {
      const { data } = await Api.get("/admin/slots/week", {
        params: { start: selectedWeek },
      });

      const allSlots = Object.values(data.days || {}).flat();
      setSlots(allSlots);
      setWeekRange({ start: data.weekStart || "", end: data.weekEnd || "" });
    } catch {
      toast.error("حدث خطأ أثناء تحميل الحصص");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedWeek]);

  // 📊 تحديد حالة الحصة
  const getSlotStatus = (slot) => {
    if (!slot) return { label: "غير معروفة", color: "#999", type: "unknown" };
    if (slot.isBlocked) return { label: "معطّلة", color: "#ff9800", type: "blocked" };

    const start = new Date(slot.date);
    const [sh, sm] = slot.startTime.split(":");
    start.setHours(sh, sm, 0, 0);

    const end = new Date(slot.date);
    const [eh, em] = slot.endTime.split(":");
    end.setHours(eh, em, 0, 0);

    if (end < now) return { label: "منتهية", color: "#f44336", type: "ended" };
    if (start <= now && end >= now)
      return { label: "جارية الآن", color: "#ed6c02", type: "running" };
    return { label: "قادمة", color: "#4caf50", type: "upcoming" };
  };

  // 🧮 حساب الفروق الزمنية
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

  // 📈 الإحصاءات العامة
  const total = slots.length || 1;
  const activeCount = slots.filter(
    (s) => !s.isBlocked && (getSlotStatus(s).type === "upcoming" || getSlotStatus(s).type === "running")
  ).length;
  const endedCount = slots.filter(
    (s) => !s.isBlocked && getSlotStatus(s).type === "ended"
  ).length;
  const blockedCount = slots.filter((s) => s.isBlocked).length;

  const activePercent = Math.round((activeCount / total) * 100);
  const endedPercent = Math.round((endedCount / total) * 100);
  const blockedPercent = Math.round((blockedCount / total) * 100);

  // 🔍 الفلترة حسب النوع
  const filteredSlots = slots.filter((slot) => {
    const status = getSlotStatus(slot);
    if (filter === "active")
      return status.type === "upcoming" || status.type === "running";
    if (filter === "ended") return status.type === "ended";
    if (filter === "blocked") return status.type === "blocked";
    return true;
  });

  // 🗓️ تجميع حسب الأيام
  const groupedByDay = filteredSlots.reduce((acc, slot) => {
    const dayKey = new Date(slot.date).toLocaleDateString("ar-EG", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    if (!acc[dayKey]) acc[dayKey] = [];
    acc[dayKey].push(slot);
    return acc;
  }, {});

  // 📌 عند النقر على حصة
  const handleSlotClick = async (slot) => {
    setSelectedSlot(slot);
    try {
      const { data } = await Api.get(`/admin/slots/${slot._id}/bookings`);
      setBookings(data);
    } catch {
      setBookings([]);
    }
    setOpen(true);
  };

  // 🚫 تعطيل / تفعيل حصة
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

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        🗓️ إدارة الجدول الأسبوعي
      </Typography>

      {/* 🔹 شريط التقدم Dashboard */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: "#fafafa", boxShadow: 2 }}>
        <Typography sx={{ mb: 1, fontWeight: 600 }}>
          📊 ملخص الأسبوع ({weekRange.start} → {weekRange.end})
        </Typography>

        {/* شريط الألوان */}
        <Box sx={{ position: "relative", height: 24, borderRadius: 1, overflow: "hidden" }}>
          <Box sx={{ position: "absolute", left: 0, width: `${activePercent}%`, bgcolor: "#4caf50", height: "100%" }} />
          <Box sx={{ position: "absolute", left: `${activePercent}%`, width: `${endedPercent}%`, bgcolor: "#f44336", height: "100%" }} />
          <Box sx={{ position: "absolute", left: `${activePercent + endedPercent}%`, width: `${blockedPercent}%`, bgcolor: "#ff9800", height: "100%" }} />
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
          <Typography color="green">✅ نشطة: {activeCount} ({activePercent}%)</Typography>
          <Typography color="red">❌ منتهية: {endedCount} ({endedPercent}%)</Typography>
          <Typography color="#ff9800">⚠️ معطلة: {blockedCount} ({blockedPercent}%)</Typography>
          <Typography color="text.primary">🔢 الإجمالي: {slots.length}</Typography>
        </Box>
      </Paper>

      {/* اختيار الأسبوع */}
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

      {/* فلتر الحالات */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(e, val) => val && setFilter(val)}
        >
          <ToggleButton value="active">🟢 النشطة فقط</ToggleButton>
          <ToggleButton value="ended">🔴 المنتهية</ToggleButton>
          <ToggleButton value="blocked">⚠️ المعطلة فقط</ToggleButton>
          <ToggleButton value="all">⚪ الكل</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* عرض الحصص */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredSlots.length ? (
        Object.keys(groupedByDay).map((day) => (
          <Box key={day} sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1, color: "#1976d2" }}>
              {day}
            </Typography>
            <Grid container spacing={2}>
              {groupedByDay[day].map((slot) => {
                const status = getSlotStatus(slot);
                return (
                  <Grid item xs={12} md={6} lg={4} key={slot._id}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: "pointer",
                        borderLeft: `6px solid ${status.color}`,
                        transition: "0.2s",
                        "&:hover": {
                          boxShadow: `0 0 12px ${status.color}`,
                          transform: "scale(1.01)",
                        },
                      }}
                      onClick={() => handleSlotClick(slot)}
                    >
                      <Typography fontWeight={600}>
                        ⏰ {slot.startTime} - {slot.endTime}
                      </Typography>
                      <Typography>
                        السعة: {slot.capacity} / المتبقي: {slot.available}
                      </Typography>
                      <Typography sx={{ mt: 1, fontStyle: "italic", color: "#555" }}>
                        {status.label} — {getTimeDiff(slot)}
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
            <Divider sx={{ mt: 2 }} />
          </Box>
        ))
      ) : (
        <Typography sx={{ textAlign: "center", mt: 3 }}>
          لا توجد حصص في هذا الأسبوع ({weekRange.start} → {weekRange.end})
        </Typography>
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
                        primary={`🧍‍♀️ ${b.user?.name || "غير معروف"} — ${b.user?.phone || ""}`}
                        secondary={`الحالة: ${b.status === "booked" ? "محجوزة ✅" : "ألغيت ❌"}`}
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
          {selectedSlot && !isNaN(selectedSlot.date) && !selectedSlot.isBlocked && (
            <Button color={selectedSlot?.isBlocked ? "success" : "error"} onClick={handleToggleBlock}>
              {selectedSlot?.isBlocked ? "🔁 تفعيل الحصة" : "🚫 تعطيل الحصة"}
            </Button>
          )}
          <Button onClick={() => setOpen(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
