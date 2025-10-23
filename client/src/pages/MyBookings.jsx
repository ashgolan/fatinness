import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Grid, Button, CircularProgress } from "@mui/material";
import { Api } from "../api/Api";
import { toast } from "react-toastify";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data } = await Api.get("/bookings/me");
      setBookings(data);
    } catch (err) {
      toast.error("حدث خطأ أثناء جلب الحجوزات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id) => {
    try {
      await Api.delete(`/bookings/${id}`);
      toast.success("تم إلغاء الحجز بنجاح");
      fetchBookings();
    } catch (err) {
      toast.error(err?.response?.data?.message || "تعذر إلغاء الحجز");
    }
  };

  return (
    <Box sx={{ maxWidth: 950, mx: "auto", mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        حجوزاتي
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : bookings.length ? (
        <Grid container spacing={2}>
          {bookings.map((b) => {
            const slotDate = new Date(b.slot.date);
            const isPast = slotDate < new Date();
            return (
              <Grid item xs={12} md={6} key={b._id}>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: isPast ? "#eee" : "#dfd",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="h6">
                      {slotDate.toLocaleDateString("ar-EG")}
                    </Typography>
                    <Typography variant="body2">
                      الساعة: {b.slot.startTime}
                    </Typography>
                    <Typography variant="body2">
                      الحالة: {b.status === "booked" ? "محجوزة" : "ملغاة"}
                    </Typography>
                  </Box>
                  {!isPast && b.status === "booked" && (
                    <Button
                      color="error"
                      variant="contained"
                      size="small"
                      onClick={() => handleCancel(b._id)}
                    >
                      إلغاء
                    </Button>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Typography sx={{ textAlign: "center", mt: 3 }}>
          لا توجد حجوزات بعد.
        </Typography>
      )}
    </Box>
  );
}
