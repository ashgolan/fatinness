import React from "react";
import { Paper, Typography, LinearProgress } from "@mui/material";
import { keyframes } from "@mui/system";
import { DateTime } from "luxon";
import { useTranslation } from "react-i18next";

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.015); }
  100% { transform: scale(1); }
`;

export default function SubscriptionStatusCard({
  subscriptionEnd,
  isDark,
  brandColors,
}) {
  const { t } = useTranslation();

  if (!subscriptionEnd) return null;

  const now = DateTime.now().startOf("day");
  const end = DateTime.fromISO(subscriptionEnd).startOf("day");

  const remainingDays = Math.ceil(end.diff(now, "days").days);

  // =========================
  // ⛔ إذا انتهى الاشتراك
  // =========================
  if (remainingDays <= 0) {
    return (
      <Paper
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 4,
          textAlign: "center",
          background: isDark ? "#2a1e2e" : "#ECEFF1",
          color: isDark ? "#ff8a80" : "#c62828",
          boxShadow: isDark
            ? "0 4px 20px rgba(0,0,0,0.4)"
            : "0 4px 15px rgba(0,0,0,0.08)",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t("subscription.expired")}
        </Typography>
      </Paper>
    );
  }

  // =========================
  // 🎨 تحديد الخلفية حسب الحالة
  // =========================
  let background;
  let barGradient;

  if (remainingDays > 5) {
    background = isDark ? "#231a2f" : "#F3E5F5";
    barGradient = isDark
      ? "linear-gradient(90deg,#9c27b0,#ce93d8)"
      : "linear-gradient(90deg,#ab47bc,#ce93d8)";
  } else if (remainingDays > 2) {
    background = isDark ? "#332515" : "#FFF3E0";
    barGradient = isDark
      ? "linear-gradient(90deg,#ff9800,#ffb74d)"
      : "linear-gradient(90deg,#ffa726,#fb8c00)";
  } else {
    background = isDark ? "#3a1c1c" : "#FFEBEE";
    barGradient = isDark
      ? "linear-gradient(90deg,#ef5350,#e53935)"
      : "linear-gradient(90deg,#e53935,#b71c1c)";
  }

  // حالياً البروجريس بصري فقط (100%)
  const progressValue = 100;

  return (
    <Paper
      sx={{
        p: 3,
        mb: 4,
        borderRadius: 4,
        textAlign: "center",
        background,
        animation: remainingDays <= 5 ? `${pulse} 1.8s infinite` : "none",
        transition: "all 0.3s ease",
        boxShadow: isDark
          ? "0 6px 25px rgba(0,0,0,0.4)"
          : "0 6px 20px rgba(0,0,0,0.08)",
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: isDark
            ? brandColors?.gold || "#fff"
            : "#7b1fa2",
          mb: 1,
        }}
      >
        {t("subscription.expiresOn")} {end.toFormat("dd/MM/yyyy")}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          mb: 2,
          color: isDark ? "#ddd" : "#444",
        }}
      >
        {t("subscription.daysRemaining", { count: remainingDays })}
      </Typography>

      <LinearProgress
        variant="determinate"
        value={progressValue}
        sx={{
          height: 10,
          borderRadius: 10,
          backgroundColor: isDark ? "#2f2438" : "#e0e0e0",
          "& .MuiLinearProgress-bar": {
            background: barGradient,
            borderRadius: 10,
          },
        }}
      />
    </Paper>
  );
}
