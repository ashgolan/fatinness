import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Stack,
} from "@mui/material";
import { Api } from "../api/Api";
import { toast } from "react-toastify";
import { colors, labels } from "../theme/theme";
import { fmtLocal } from "../utils/date";

// 🔹 دالة مساعدة لتوليد الأيام السبعة القادمة
function getWeekDays(start = new Date()) {
  const days = [];
  const current = new Date(start);
  for (let i = 0; i < 7; i++) {
    const d = new Date(current);
    days.push({
      date: d,
      label: d.toLocaleDateString("ar-EG", {
        weekday: "long",
        day: "numeric",
        month: "short",
      }),
    });
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export default function Booking() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState(getWeekDays());

const fetchSlots = async (date) => {
  setLoading(true);
  try {
    // 🔹 نستخدم fmtLocal بدل toISOString لتفادي انزلاق اليوم
    const dateStr = fmtLocal(date);

    const { data } = await Api.get(`/slots/day/${dateStr}`);
    setSlots(data);
  } catch (err) {
    toast.error("حدث خطأ أثناء جلب المواعيد");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate]);

const handleBook = async (slotId) => {
  try {
    await Api.post("/bookings", { slotId });
    toast.success("تم حجز الموعد بنجاح");
    await fetchSlots(selectedDate); // ✅ انتظر حتى تكتمل إعادة التحميل
  } catch (err) {
    toast.error(err?.response?.data?.message || "حدث خطأ أثناء الحجز");
  }
};

  return (
    <Box sx={{ maxWidth: 950, mx: "auto", mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        جدول الحصص
      </Typography>

      {/* 🔹 شريط الأيام */}
      <Stack direction="row" spacing={1} sx={{ overflowX: "auto", mb: 2 }}>
        {weekDays.map((d) => {
          const isActive =
            d.date.toDateString() === selectedDate.toDateString();
          return (
            <Button
              key={d.label}
              variant={isActive ? "contained" : "outlined"}
              color={isActive ? "primary" : "inherit"}
              onClick={() => setSelectedDate(d.date)}
              sx={{ minWidth: 100 }}
            >
              {d.label}
            </Button>
          );
        })}
      </Stack>

      {/* 🔹 قائمة الساعات */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : slots.length ? (
        <Grid container spacing={2}>
          {slots.map((slot) => (
            <Grid item xs={6} md={4} key={slot._id}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: "center",
                  backgroundColor: slot.isPast
                    ? colors.past
                    : slot.isBooked
                    ? colors.danger
                    : slot.available === 0
                    ? colors.warning
                    : colors.success,
                }}
              >
                <Typography variant="h6">{slot.time}</Typography>
                <Typography variant="body2">
                  {slot.available > 0 ? `متاحة (${slot.available})` : "ممتلئة"}
                </Typography>

                {slot.isPast ? (
                  <Typography variant="caption" color="text.secondary">
                    انتهت الحصة
                  </Typography>
                ) : slot.available > 0 && !slot.isBooked ? (
                  <Button
                    size="small"
                    variant="contained"
                    sx={{ mt: 1, backgroundColor: colors.primary }}
                    onClick={() => handleBook(slot._id)}
                  >
                    حجز
                  </Button>
                ) : slot.available === 0 ? (
                  <Typography variant="caption">{labels.full}</Typography>
                ) : (
                  <Typography variant="caption">{labels.booked}</Typography>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography sx={{ textAlign: "center", mt: 3 }}>
          لا توجد حصص في هذا اليوم.
        </Typography>
      )}
    </Box>
  );
}
