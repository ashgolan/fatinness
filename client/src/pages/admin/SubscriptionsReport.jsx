import React, { useEffect, useState } from "react";
import { Api } from "../../api/Api";
import {
  Box,
  Typography,
  Paper,
  Divider,
  CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";

export default function SubscriptionsReport() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      const res = await Api.get("/admin/subscriptions/report");
      setData(res.data);

    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  const sections = [
    {
      title: t("subscriptions.activeSoon"),
      color: "#facc15",
      list: data.activeSoon,
    },
    {
      title: t("subscriptions.expired"),
      color: "#ef4444",
      list: data.expired,
    },
    {
      title: t("subscriptions.active"),
      color: "#22c55e",
      list: data.active,
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        {t("subscriptions.title")}
      </Typography>

      {sections.map((sec, idx) => (
        <Paper
          key={idx}
          sx={{
            p: 2,
            mb: 3,
            borderLeft: `6px solid ${sec.color}`,
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            {sec.title} ({sec.list.length})
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {sec.list.length === 0 ? (
            <Typography sx={{ opacity: 0.6 }}>
              {t("subscriptions.empty")}
            </Typography>
          ) : (
            sec.list.map((u) => (
<Box
  sx={{
    p: 1.5,
    mb: 1,
    borderRadius: "8px",
    backgroundColor: (theme) =>
      theme.palette.mode === "dark" ? "#2a2a2a" : "#f5f5f5",
    color: (theme) =>
      theme.palette.mode === "dark" ? "#fff" : "#000",
  }}
>
  <Typography sx={{ fontWeight: "bold", color: "inherit" }}>
    {u.username}
  </Typography>

  <Typography
    sx={{
      fontSize: "14px",
      opacity: 0.8,
      color: "inherit", // ← الحل الأساسي هنا
    }}
  >
    {t("subscriptions.endDate")}:{" "}
    {new Date(u.subscriptionEnd).toLocaleDateString(
      i18n.language === "ar"
        ? "ar-EG"
        : i18n.language === "he"
        ? "he-IL"
        : "en-US"
    )}
  </Typography>
</Box>
              
            ))
          )}
        </Paper>
      ))}
    </Box>
  );
}
