import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import { Api } from "../../api/Api";
import { toast } from "react-toastify";

export default function AdminReports() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate && endDate) {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      }

      const response = await Api.get(`/admin/reports/attendance?${params}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "bookings-report.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("تم تنزيل التقرير بنجاح ✅");
    } catch (error) {
      toast.error("فشل تنزيل التقرير ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        📤 تصدير تقارير الحجوزات
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography sx={{ mb: 2 }}>
          حددي الفترة الزمنية لتصدير تقرير الحجوزات، أو اتركي الحقول فارغة لتصدير كل البيانات:
        </Typography>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            type="date"
            label="من"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            label="إلى"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 3 }}
          onClick={handleExport}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "📥 تنزيل التقرير"}
        </Button>
      </Paper>
    </Box>
  );
}
