import React from "react";
import { Paper, Typography, LinearProgress } from "@mui/material";
import { keyframes } from "@mui/system";
import { DateTime } from "luxon";
import { useTranslation } from "react-i18next";

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
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

  // لو انتهى
  if (remainingDays <= 0) {
    return (
      <Paper
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 4,
          textAlign: "center",
          background: "#ECEFF1",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t("subscription.expired")}
        </Typography>
      </Paper>
    );
  }

  // نعتبر أول يوم هو 100%
  const maxDays = remainingDays;
  const progressValue =
    remainingDays > 0
      ? Math.min(100, (remainingDays / maxDays) * 100)
      : 0;

  return (
    <Paper
      sx={{
        p: 3,
        mb: 4,
        borderRadius: 4,
        textAlign: "center",
        background:
          remainingDays > 5
            ? isDark
              ? "#2b2139"
              : "#F3E5F5"
            : remainingDays > 2
            ? "#FFF3E0"
            : "#FFEBEE",
        animation:
          remainingDays <= 5
            ? `${pulse} 1.8s infinite`
            : "none",
        transition: "all 0.3s ease",
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

      <Typography variant="body2" sx={{ mb: 2 }}>
        {t("subscription.daysRemaining", { count: remainingDays })}
      </Typography>

      <LinearProgress
        variant="determinate"
        value={progressValue}
        sx={{
          height: 10,
          borderRadius: 10,
          backgroundColor: isDark ? "#3a2d4f" : "#e0e0e0",
          "& .MuiLinearProgress-bar": {
            background:
              remainingDays > 5
                ? "linear-gradient(90deg,#ab47bc,#ce93d8)"
                : remainingDays > 2
                ? "linear-gradient(90deg,#ffa726,#fb8c00)"
                : "linear-gradient(90deg,#e53935,#b71c1c)",
            borderRadius: 10,
          },
        }}
      />
    </Paper>
  );
}
