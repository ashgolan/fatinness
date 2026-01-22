import React, { useState, useContext } from "react";
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
import { useTranslation } from "react-i18next";
import useServerError from "../../hooks/useServerError";
import { UserContext } from "../../context/UserContext";

export default function AdminReports() {
  const handleServerError = useServerError();
  const { t, i18n } = useTranslation();
  const { user } = useContext(UserContext);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  // ❌ ليس Super Admin
  if (!user?.isSuperAdmin) {
    return (
      <Box dir={i18n.dir()} p={3}>
        <Typography
          color="error"
          variant="h6"
          align="center"
          fontWeight={600}
        >
          {t("adminReports.noPermission")}
        </Typography>
      </Box>
    );
  }

  const handleExport = async () => {
    // 🛑 تحقق من صحة المدى
    if (startDate && endDate && startDate > endDate) {
      toast.error(t("adminReports.invalidRange"));
      return;
    }

    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await Api.get(
        `/admin/reports/attendance?${params.toString()}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      const filename = `attendance_${startDate || "all"}_${endDate || "now"}.csv`;

      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(t("adminReports.success"));
    } catch (err) {
      handleServerError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box dir={i18n.dir()} sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom fontWeight={700}>
        {t("adminReports.title")}
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography sx={{ mb: 2 }}>
          {t("adminReports.description")}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            type="date"
            label={t("adminReports.from")}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            type="date"
            label={t("adminReports.to")}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        <Button
          variant="contained"
          sx={{ mt: 3 }}
          onClick={handleExport}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            t("adminReports.download")
          )}
        </Button>
      </Paper>
    </Box>
  );
}
