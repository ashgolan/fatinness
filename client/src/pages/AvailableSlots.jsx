import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
} from "@mui/material";
import { Api } from "../api/Api";
import { toast } from "react-toastify";
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupIcon from "@mui/icons-material/Group";
import LockIcon from "@mui/icons-material/Lock";

export default function AvailableSlots() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState(null);
  const [user, setUser] = useState(null);

  // 🔹 جلب بيانات المستخدم والفترات المتاحة
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1️⃣ جلب المستخدم لمعرفة حالة الاشتراك
      const userRes = await Api.get("/users/me");
      setUser(userRes.data);

      // 2️⃣ جلب الفترات القادمة
      const slotsRes = await Api.get("/slots/upcoming");
      const data = slotsRes.data;

      // دعم كلا الشكلين: مصفوفة مباشرة أو { slots: [...] }
      const normalized =
        Array.isArray(data) ? data : data.slots || Object.values(data.slots || {}).flat();

      setSlots(normalized);
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 إجراء الحجز
  const handleBook = async (slotId) => {
    if (!user?.subscription?.active) {
      toast.info("يرجى تجديد الاشتراك قبل الحجز");
      return;
    }

    setBookingId(slotId);
    try {
      await Api.post("/bookings", { slotId });
      toast.success("تم الحجز بنجاح ✅");
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "فشل الحجز");
    } finally {
      setBookingId(null);
    }
  };

  return (
    <Box
      dir="rtl"
      sx={{
        maxWidth: 950,
        mx: "auto",
        mt: 4,
        px: 2,
        fontFamily: "Tajawal, Cairo, sans-serif",
      }}
    >
      <Typography variant="h5" gutterBottom textAlign="center">
        🕓 الفترات المتاحة للحجز
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : slots.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" mt={4}>
          لا توجد فترات متاحة حاليًا.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {slots.map((slot) => {
            const slotDate = new Date(slot.date);
            const formattedDate = slotDate.toLocaleDateString("ar-EG");
            const isFull = slot.bookedCount >= slot.capacity;

            return (
              <Grid item xs={12} md={6} key={slot._id}>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: isFull ? "#f5f5f5" : "#e3f2fd",
                    borderRight: "5px solid #1976d2",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      <EventIcon
                        fontSize="small"
                        sx={{ verticalAlign: "middle", ml: 0.5 }}
                      />
                      {formattedDate}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <AccessTimeIcon
                        fontSize="small"
                        sx={{ verticalAlign: "middle", ml: 0.5 }}
                      />
                      من {slot.startTime} إلى {slot.endTime}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      <GroupIcon
                        fontSize="small"
                        sx={{ verticalAlign: "middle", ml: 0.5 }}
                      />
                      المقاعد: {slot.bookedCount}/{slot.capacity}
                    </Typography>
                  </Box>

                  {/* 🔹 الأزرار حسب الحالة */}
                  {isFull ? (
                    <Button
                      disabled
                      color="inherit"
                      startIcon={<LockIcon />}
                      variant="outlined"
                      size="small"
                    >
                      ممتلئة
                    </Button>
                  ) : !user?.subscription?.active ? (
                    <Button
                      color="secondary"
                      variant="contained"
                      size="small"
                      onClick={() =>
                        toast.info("يرجى تجديد الاشتراك قبل الحجز")
                      }
                    >
                      جدد الاشتراك
                    </Button>
                  ) : (
                    <Button
                      color="primary"
                      variant="contained"
                      size="small"
                      disabled={bookingId === slot._id}
                      onClick={() => handleBook(slot._id)}
                    >
                      {bookingId === slot._id ? (
                        <CircularProgress size={20} />
                      ) : (
                        "احجزي الآن"
                      )}
                    </Button>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
