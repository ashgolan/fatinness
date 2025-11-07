import React from "react";
import { Box, Typography } from "@mui/material";
import { useThemeMode } from "../context/ThemeContext";

export default function Footer() {
  const { mode, BRAND } = useThemeMode();
  const isDark = mode === "dark";

  return (
    <Box component="footer" sx={{ textAlign: "center", py: 2, color: "#666" }}>
      {/* تذييل */}
      <Typography
        variant="body2"
        sx={{
          bottom: 14,
          color: isDark ? BRAND.subDark : "rgba(0,0,0,0.55)",
          fontSize: "0.85rem",
          textAlign: "center",
          width: "100%",
        }}
      >
        © 2025{" "}
        <b style={{ color: isDark ? BRAND.gold : BRAND.purple }}>
          Fateness Studio
        </b>{" "}
        - استوديو اللياقة النسائي
      </Typography>
    </Box>
  );
}
