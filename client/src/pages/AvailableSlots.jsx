import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Api } from "../api/Api";
import { toast } from "react-toastify";
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupIcon from "@mui/icons-material/Group";
import LockIcon from "@mui/icons-material/Lock";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function AvailableSlots() {
  const [slotsByDay, setSlotsByDay] = useState({});
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState(null);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("week");

  const dayNames = [
    "الأحد",
    "الاثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ];

  const gradients = [
    "linear-gradient(90deg, #2196f3, #64b5f6)",
    "linear-gradient(90deg, #43a047, #81c784)",
    "linear-gradient(90deg, #ffb300, #ffcc80)",
    "linear-gradient(90deg, #8e24aa, #ce93d8)",
    "linear-gradient(90deg, #00bcd4, #4dd0e1)",
    "linear-gradient(90deg, #f57c00, #ffb74d)",
    "linear-gradient(90deg, #ec407a, #f48fb1)",
  ];

  // تحميل البيانات
  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, slotsRes, bookingsRes] = await Promise.all([
        Api.get("/users/me"),
        Api.get("/slots/upcoming"),
        Api.get("/bookings/me"),
      ]);

      setUser(userRes.data);
      let grouped = slotsRes.data?.slots || {};

      // ✅ فلترة الحصص: إخفاء المنتهية والإبقاء على الجارية أو القادمة فقط
      const now = new Date();
      const filteredGrouped = {};
      Object.keys(grouped).forEach((dateKey) => {
        const validSlots = grouped[dateKey].filter((slot) => {
          const slotEnd = new Date(slot.date);
          const [h, m] = slot.endTime.split(":");
          slotEnd.setHours(h, m, 0, 0);
          return slotEnd > now; // فقط التي لم تنته بعد
        });
        if (validSlots.length > 0) filteredGrouped[dateKey] = validSlots;
      });

      setSlotsByDay(filteredGrouped);

      const myActiveBookings = bookingsRes.data
        .filter((b) => b.status === "booked")
        .map((b) => b.slot._id);
      setMyBookings(myActiveBookings);
    } catch {
      toast.error("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ إنشاء حجز جديد
  const handleBook = async (slotId) => {
    setBookingId(slotId);
    try {
      await Api.post("/bookings", { slotId });
      toast.success("تم الحجز بنجاح ✅");
      await new Promise((r) => setTimeout(r, 1000));
      await fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "فشل الحجز");
    } finally {
      setBookingId(null);
    }
  };

  // ✅ إلغاء الحجز
  const handleCancel = async (slotId) => {
    setBookingId(slotId);
    try {
      const { data } = await Api.get("/bookings/me");
      const booking = data.find(
        (b) => b.slot._id === slotId && b.status === "booked"
      );
      if (!booking) return toast.error("لم يتم العثور على الحجز لإلغائه");
      await Api.delete(`/bookings/${booking._id}`);
      toast.success("تم إلغاء الحجز ❌");
      await fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "تعذر إلغاء الحجز");
    } finally {
      setBookingId(null);
    }
  };

  // فلترة الأيام حسب الفاصل الزمني المختار
  const filteredDays = Object.keys(slotsByDay).filter((date) => {
    const d = new Date(date);
    const today = new Date();

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const nextWeekStart = new Date(endOfWeek);
    nextWeekStart.setDate(endOfWeek.getDate() + 1);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

    if (filter === "day") {
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    } else if (filter === "next") {
      return d >= nextWeekStart && d <= nextWeekEnd;
    }
    return d >= startOfWeek && d <= endOfWeek;
  });

  // واجهة العرض
  return (
    <Box
      dir="rtl"
      sx={{
        maxWidth: 1200,
        mx: "auto",
        mt: 4,
        px: 2,
        pb: 6,
        fontFamily: "Tajawal, Cairo, sans-serif",
        backgroundColor: "#fafafa",
        minHeight: "100vh",
      }}
    >
      <Typography
        variant="h5"
        gutterBottom
        textAlign="center"
        sx={{ mb: 3, fontWeight: "bold" }}
      >
        🕓 الفترات المتاحة للحجز
      </Typography>

      {/* أزرار الفلترة */}
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(e, val) => val && setFilter(val)}
          aria-label="filter"
          sx={{
            borderRadius: "20px",
            boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          <ToggleButton
            value="day"
            sx={{
              fontWeight: "bold",
              px: 3,
              color: filter === "day" ? "#fff" : "#444",
              background:
                filter === "day"
                  ? "linear-gradient(90deg, #42a5f5, #1e88e5)"
                  : "#fff",
              "&:hover": { background: "#e3f2fd" },
            }}
          >
            📅 اليوم
          </ToggleButton>
          <ToggleButton
            value="week"
            sx={{
              fontWeight: "bold",
              px: 3,
              color: filter === "week" ? "#fff" : "#444",
              background:
                filter === "week"
                  ? "linear-gradient(90deg, #43a047, #66bb6a)"
                  : "#fff",
              "&:hover": { background: "#e8f5e9" },
            }}
          >
            🗓️ الأسبوع الحالي
          </ToggleButton>
          <ToggleButton
            value="next"
            sx={{
              fontWeight: "bold",
              px: 3,
              color: filter === "next" ? "#fff" : "#444",
              background:
                filter === "next"
                  ? "linear-gradient(90deg, #8e24aa, #ba68c8)"
                  : "#fff",
              "&:hover": { background: "#f3e5f5" },
            }}
          >
            🔮 الأسبوع القادم
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* أثناء التحميل */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : filteredDays.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" mt={4}>
          لا توجد فترات متاحة في هذا النطاق الزمني.
        </Typography>
      ) : (
        <Grid container spacing={2} justifyContent="center">
          {filteredDays.map((date) => {
            const dayNum = new Date(date).getDay();
            const slots = slotsByDay[date];
            if (!slots?.length) return null;

            return (
              <Grid item xs={12} sm={6} md={4} key={`day-${date}`}>
                <Paper
                  elevation={4}
                  sx={{
                    overflow: "hidden",
                    borderRadius: "14px",
                    transition: "0.3s",
                    "&:hover": {
                      transform: "translateY(-3px)",
                      boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      background: gradients[dayNum],
                      color: "white",
                      py: 1.2,
                      px: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      {dayNames[dayNum]}
                    </Typography>
                    <Typography sx={{ display: "flex", alignItems: "center" }}>
                      <EventIcon sx={{ ml: 0.5, fontSize: 20 }} />
                      {date}
                    </Typography>
                  </Box>

                  <Box sx={{ p: 1.5 }}>
                    <Stack direction="column" spacing={1.5}>
                      {slots.map((slot) => {
                        const isBookedByUser = myBookings.includes(slot._id);
                        const isFull = slot.bookedCount >= slot.capacity;
                        return (
                          <Paper
                            key={`${slot._id}-${slot.startTime}`}
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              backgroundColor: isBookedByUser
                                ? "#d0f0d6"
                                : isFull
                                ? "#f5f5f5"
                                : "white",
                              borderRight: isBookedByUser
                                ? "5px solid #2e7d32"
                                : isFull
                                ? "5px solid #aaa"
                                : "5px solid #1976d2",
                            }}
                          >
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              sx={{ mb: 0.5 }}
                            >
                              <AccessTimeIcon
                                fontSize="small"
                                sx={{ ml: 0.5, color: "#555" }}
                              />
                              {slot.startTime} - {slot.endTime}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <GroupIcon
                                fontSize="small"
                                sx={{ ml: 0.5, color: "#555" }}
                              />
                              المقاعد: {slot.bookedCount}/{slot.capacity}
                            </Typography>

                            {isFull ? (
                              <Button
                                disabled
                                color="inherit"
                                startIcon={<LockIcon />}
                                variant="outlined"
                                size="small"
                                fullWidth
                                sx={{ mt: 1 }}
                              >
                                ممتلئة
                              </Button>
                            ) : isBookedByUser ? (
                              <Button
                                color="success"
                                variant="contained"
                                size="small"
                                fullWidth
                                sx={{ mt: 1 }}
                                onClick={() => handleCancel(slot._id)}
                              >
                                إلغاء الحجز
                              </Button>
                            ) : (
                              <Button
                                color="primary"
                                variant="contained"
                                size="small"
                                fullWidth
                                sx={{ mt: 1 }}
                                onClick={() => handleBook(slot._id)}
                              >
                                {bookingId === slot._id
                                  ? "⏳ جاري الحجز..."
                                  : "احجزي الآن"}
                              </Button>
                            )}
                          </Paper>
                        );
                      })}
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
