import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Divider,
} from "@mui/material";
import { Api } from "../api/Api";
import { toast } from "react-toastify";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CancelIcon from "@mui/icons-material/Cancel";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 🔹 جلب الحجوزات
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data } = await Api.get("/bookings/me");
      setBookings(data);
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء جلب الحجوزات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // 🔹 إلغاء الحجز
  const handleCancel = async (id) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في إلغاء هذا الحجز؟")) return;
    setRefreshing(true);
    try {
      await Api.delete(`/bookings/${id}`);
      toast.success("تم إلغاء الحجز بنجاح ✅");
      fetchBookings();
    } catch (err) {
      toast.error(err?.response?.data?.message || "تعذر إلغاء الحجز");
    } finally {
      setRefreshing(false);
    }
  };

  // 🔹 تقسيم الحجوزات إلى قادمة وسابقة
  const now = new Date();
  const upcoming = bookings.filter(
    (b) =>
      new Date(b.slot.date) >= now && b.status === "booked" && !b.slot.isBlocked
  );
  const past = bookings.filter(
    (b) =>
      new Date(b.slot.date) < now || b.status === "cancelled" || b.slot.isBlocked
  );

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
        📅 حجوزاتي
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* 🔹 الحجوزات القادمة */}
          <Section
            title="الحجوزات القادمة"
            emptyText="لا توجد حجوزات قادمة."
            color="#e3f2fd"
            bookings={upcoming}
            handleCancel={handleCancel}
            refreshing={refreshing}
          />

          <Divider sx={{ my: 4 }} />

          {/* 🔹 الحجوزات السابقة */}
          <Section
            title="الحجوزات السابقة"
            emptyText="لا توجد حجوزات سابقة."
            color="#f5f5f5"
            bookings={past}
            isPast
          />
        </>
      )}
    </Box>
  );
}

// 🔸 مكوّن فرعي لعرض مجموعة من الحجوزات
function Section({
  title,
  bookings,
  emptyText,
  color,
  handleCancel,
  isPast = false,
  refreshing,
}) {
  return (
    <Box>
      <Typography variant="h6" mb={2}>
        {title}
      </Typography>
      {bookings.length === 0 ? (
        <Typography color="text.secondary">{emptyText}</Typography>
      ) : (
        <Grid container spacing={2}>
          {bookings.map((b) => {
            const slotDate = new Date(b.slot.date);
            const date = slotDate.toLocaleDateString("ar-EG");
            const time = b.slot.startTime;
            const isCancelled = b.status === "cancelled";
            return (
              <Grid item xs={12} md={6} key={b._id}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    backgroundColor: color,
                    borderRight: "5px solid #1976d2",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      <EventAvailableIcon
                        fontSize="small"
                        sx={{ verticalAlign: "middle", ml: 0.5 }}
                      />
                      {date}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <AccessTimeIcon
                        fontSize="small"
                        sx={{ verticalAlign: "middle", ml: 0.5 }}
                      />
                      الساعة: {time}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {isCancelled ? (
                        <>
                          <CancelIcon
                            fontSize="small"
                            sx={{
                              verticalAlign: "middle",
                              ml: 0.5,
                              color: "red",
                            }}
                          />
                          <span style={{ color: "red" }}>ملغاة</span>
                        </>
                      ) : isPast ? (
                        <>
                          <DoneAllIcon
                            fontSize="small"
                            sx={{
                              verticalAlign: "middle",
                              ml: 0.5,
                              color: "green",
                            }}
                          />
                          <span style={{ color: "green" }}>منتهية</span>
                        </>
                      ) : (
                        <span>محجوزة ✅</span>
                      )}
                    </Typography>
                  </Box>

                  {!isPast && !isCancelled && (
                    <Button
                      color="error"
                      variant="contained"
                      size="small"
                      disabled={refreshing}
                      onClick={() => handleCancel(b._id)}
                    >
                      {refreshing ? "..." : "إلغاء"}
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
