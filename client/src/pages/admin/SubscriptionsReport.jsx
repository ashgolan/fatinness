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
import useServerError from "../../hooks/useServerError";

export default function SubscriptionsReport() {
  const { t, i18n } = useTranslation();
  const handleServerError = useServerError();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      const res = await Api.get("/admin/subscriptions/report");
      setData(res.data);
    } catch (err) {
      handleServerError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ textAlign: "center", mt: 6 }}>
        <Typography sx={{ opacity: 0.7 }}>
          {t("subscriptions.empty")}
        </Typography>
      </Box>
    );
  }

  const sections = [
    {
      title: t("subscriptions.activeSoon"),
      color: "#facc15",
      list: data.activeSoon || [],
    },
    {
      title: t("subscriptions.expired"),
      color: "#ef4444",
      list: data.expired || [],
    },
    {
      title: t("subscriptions.active"),
      color: "#22c55e",
      list: data.active || [],
    },
  ];

  return (
    <Box dir={i18n.dir()} sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography
        variant="h4"
        sx={{ mb: 4, fontWeight: 800, textAlign: "center" }}
      >
        {t("subscriptions.title")}
      </Typography>

      {sections.map((section, idx) => (
        <Paper
          key={idx}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 2,
            borderInlineStart: `6px solid ${section.color}`,
          }}
        >
          <Typography
            variant="h6"
            sx={{ mb: 1.5, fontWeight: 700 }}
          >
            {section.title} ({section.list.length})
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {section.list.length === 0 ? (
            <Typography sx={{ opacity: 0.6 }}>
              {t("subscriptions.empty")}
            </Typography>
          ) : (
            section.list.map((user) => (
              <Box
                key={user._id}
                sx={{
                  p: 1.8,
                  mb: 1.2,
                  borderRadius: 2,
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.06)"
                      : "#f5f5f5",
                }}
              >
                <Typography sx={{ fontWeight: 700 }}>
                  {user.username}
                </Typography>

                <Typography
                  sx={{
                    fontSize: 14,
                    opacity: 0.8,
                  }}
                >
                  {t("subscriptions.endDate")}:{" "}
                  {new Date(user.subscriptionEnd).toLocaleDateString(
                    i18n.language
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
