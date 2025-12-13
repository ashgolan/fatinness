import React from "react";
import { Box, Typography, Paper, Divider } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useThemeMode } from "../context/ThemeContext";

export default function About() {
  const { t } = useTranslation();
  const { mode, BRAND } = useThemeMode();
  const isDark = mode === "dark";

  return (
    <Box sx={{ maxWidth: 850, mx: "auto", mt: 4, px: 2, mb: 5 }}>
      <Paper
        sx={{
          p: 4,
          borderRadius: "22px",
          background: isDark ? "rgba(28,28,30,0.95)" : "#ffffff",
          backdropFilter: "blur(8px)",
          boxShadow: isDark
            ? "0 0 30px rgba(255,215,0,0.08)"
            : "0 0 22px rgba(160,24,96,0.12)",
          transition: "0.3s",
        }}
      >
        {/* 🔹 عنوان الصفحة */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 900,
            mb: 3,
            textAlign: "center",
            letterSpacing: "0.8px",
            background: `linear-gradient(135deg, ${
              isDark ? BRAND.gold : BRAND.purple
            }, ${isDark ? BRAND.purple : BRAND.gold})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {t("about.title")}
        </Typography>

        {/* 🔹 الفقرة 1 */}
        <Typography sx={{ mb: 2, lineHeight: 1.8, fontSize: "1.05rem" }}>
          {t("about.description1")}
        </Typography>

        {/* 🔹 الفقرة 2 */}
        <Typography sx={{ mb: 3, lineHeight: 1.8, fontSize: "1.05rem" }}>
          {t("about.description2")}
        </Typography>

        <Divider sx={{ my: 4 }} />

        {/* 🔹 قسم التوقيع */}
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <img
            src="/brand/ashaalan-tech-gold.png"
            alt="A.Shaalan Tech"
            style={{
              height: 70,
              objectFit: "contain",
              marginBottom: 10,
              filter: isDark
                ? "drop-shadow(0 0 6px rgba(0,0,0,0.7))"
                : "drop-shadow(0 0 3px rgba(0,0,0,0.3))",
              transition: "0.3s",
            }}
          />

          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: isDark ? "#cfcfcf" : "#777",
              fontSize: "0.8rem",
              fontWeight: 600,
              mb: 0.5,
            }}
          >
            {t("about.developedBy")}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: isDark ? "#aaaaaa" : "#999",
              fontSize: "0.75rem",
              mb: 2,
            }}
          >
            {t("about.email")}
          </Typography>

          <Typography
            variant="caption"
            sx={{ color: isDark ? "#888" : "#aaa", fontSize: "0.75rem" }}
          >
            {t("about.version")}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
