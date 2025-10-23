import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
} from "@mui/material";
import { Api } from "../../api/Api";
import { toast } from "react-toastify";

export default function SlotsAdmin() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const { data } = await Api.get("/admin/slots");
      setSlots(data);
    } catch (err) {
      toast.error("حدث خطأ أثناء جلب الحصص");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  // 🔹 تفعيل / تعطيل الحصة
  const toggleBlock = async (id) => {
    try {
      const { data } = await Api.put(`/admin/slots/${id}/block`);
      toast.info(data.message);
      fetchSlots();
    } catch {
      toast.error("تعذر تحديث حالة الحصة");
    }
  };

  // 🔹 حذف الحصة نهائيًا
  const deleteSlot = async (id) => {
    if (!window.confirm("هل أنتِ متأكدة من حذف هذه الحصة نهائيًا؟")) return;
    try {
      await Api.delete(`/admin/slots/${id}`);
      toast.success("تم حذف الحصة بنجاح");
      fetchSlots();
    } catch {
      toast.error("تعذر حذف الحصة");
    }
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        إدارة الجدول الأسبوعي
      </Typography>

      <Grid container spacing={2}>
        {slots.map((s) => (
          <Grid item xs={12} md={6} key={s._id}>
            <Paper
              sx={{
                p: 2,
                opacity: s.isBlocked ? 0.5 : 1,
                borderLeft: s.isBlocked ? "4px solid red" : "4px solid green",
              }}
            >
              <Typography variant="subtitle1">
                📅 {new Date(s.date).toLocaleDateString("ar-EG")} — {s.startTime} - {s.endTime}
              </Typography>
              <Typography variant="body2">
                السعة: {s.capacity} — المحجوز: {s.booked} — المتبقي:{" "}
                {s.remaining}
              </Typography>

              <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  color={s.isBlocked ? "success" : "error"}
                  onClick={() => toggleBlock(s._id)}
                >
                  {s.isBlocked ? "تفعيل الحصة" : "تعطيل الحصة"}
                </Button>

                {/* 🔹 زر الحذف الجديد */}
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => deleteSlot(s._id)}
                >
                  حذف الحصة
                </Button>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
