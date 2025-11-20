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
import { useTranslation } from "react-i18next";
import useServerError from "../../hooks/useServerError";

export default function AdminReports() {
  const handleServerError = useServerError();

  const { t } = useTranslation();
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

      toast.success(t("adminReports.success"));
    } catch (err) {
      handleServerError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        {t("adminReports.title")}
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography sx={{ mb: 2 }}>{t("adminReports.description")}</Typography>

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
          color="primary"
          sx={{ mt: 3 }}
          onClick={handleExport}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            t("adminReports.download")
          )}
        </Button>
      </Paper>
    </Box>
  );
}
