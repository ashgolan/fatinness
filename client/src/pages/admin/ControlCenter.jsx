import React from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useThemeMode } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

// Icons
import GroupIcon from "@mui/icons-material/Group";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SettingsIcon from "@mui/icons-material/Settings";
import AssessmentIcon from "@mui/icons-material/Assessment";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import LayersIcon from "@mui/icons-material/Layers";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";

export default function ControlCenter() {
  const navigate = useNavigate();
  const { mode, BRAND } = useThemeMode();
  const { t } = useTranslation();

  const isDark = mode === "dark";

  const sections = [
    {
      title: t("controlCenter.sections.newUser"),
      icon: <PersonAddAltIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/register",
      gradient: "linear-gradient(135deg, #A01860 0%, #FBC02D 100%)",
      iconBg: "linear-gradient(135deg, rgba(160,24,96,0.15), rgba(251,192,45,0.15))",
      iconColor: "#A01860",
    },
    {
      title: t("controlCenter.sections.dashboard"),
      icon: <AssessmentIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/dashboard",
      gradient: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
      iconBg: "linear-gradient(135deg, rgba(118,75,162,0.15), rgba(102,126,234,0.15))",
      iconColor: "#764ba2",
    },
    {
      title: t("controlCenter.sections.users"),
      icon: <GroupIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/users",
      gradient: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
      iconBg: "linear-gradient(135deg, rgba(76,175,80,0.15), rgba(46,125,50,0.15))",
      iconColor: "#4caf50",
    },
    {
      title: t("controlCenter.sections.bookings"),
      icon: <EventNoteIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/bookings",
      gradient: "linear-gradient(135deg, #0288d1 0%, #26c6da 100%)",
      iconBg: "linear-gradient(135deg, rgba(2,136,209,0.15), rgba(38,198,218,0.15))",
      iconColor: "#0288d1",
    },
    {
      title: t("controlCenter.sections.weeklySlots"),
      icon: <ScheduleIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/slots",
      gradient: "linear-gradient(135deg, #8e24aa 0%, #ab47bc 100%)",
      iconBg: "linear-gradient(135deg, rgba(171,71,188,0.15), rgba(142,36,170,0.15))",
      iconColor: "#ab47bc",
    },
    {
      title: t("controlCenter.sections.templates"),
      icon: <LayersIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/schedule",
      gradient: "linear-gradient(135deg, #00acc1 0%, #26c6da 100%)",
      iconBg: "linear-gradient(135deg, rgba(0,172,193,0.15), rgba(38,198,218,0.15))",
      iconColor: "#00acc1",
    },
    {
      title: t("controlCenter.sections.notifications"),
      icon: <NotificationsActiveIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/notifications",
      gradient: "linear-gradient(135deg, #f4511e 0%, #ff7043 100%)",
      iconBg: "linear-gradient(135deg, rgba(244,81,30,0.15), rgba(255,112,67,0.15))",
      iconColor: "#f4511e",
    },
    {
      title: t("controlCenter.sections.settings"),
      icon: <SettingsIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/settings",
      gradient: "linear-gradient(135deg, #546e7a 0%, #78909c 100%)",
      iconBg: "linear-gradient(135deg, rgba(84,110,122,0.15), rgba(120,144,156,0.15))",
      iconColor: "#546e7a",
    },
    {
  title: t("controlCenter.sections.systemReset"),
  icon: <CleaningServicesIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
  path: "/admin/system-reset",
  gradient: "linear-gradient(135deg, #d50000 0%, #ff8a80 100%)",
  iconBg: "linear-gradient(135deg, rgba(213,0,0,0.15), rgba(255,138,128,0.15))",
  iconColor: "#d50000",
}
  ];

  return (
    <Box
      dir={t("dir")}
      sx={{
        minHeight: "100vh",
        background: isDark
          ? `linear-gradient(180deg, ${BRAND.bgDarkTop}, ${BRAND.bgDarkBottom})`
          : "linear-gradient(135deg, #fdf7ff 0%, #fffaf5 50%, #fef9ff 100%)",
        py: { xs: 4, sm: 6, md: 8 },
        px: { xs: 2, sm: 3, md: 4 },
        transition: "all 0.4s ease",
      }}
    >
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        {/* Title */}
        <Box sx={{ textAlign: "center", mb: { xs: 4, sm: 6, md: 8 }, px: 2 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.75rem", sm: "2.5rem", md: "3rem" },
              background: `linear-gradient(135deg, ${
                isDark ? BRAND.gold : BRAND.purple
              }, ${isDark ? BRAND.purple : BRAND.gold})`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 1.5,
            }}
          >
            {t("controlCenter.title")}
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: isDark ? BRAND.subDark : "#555",
              fontWeight: 500,
              maxWidth: 700,
              mx: "auto",
            }}
          >
            {t("controlCenter.subtitle")}
          </Typography>
        </Box>

        {/* Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: { xs: 1.5, sm: 2.5, md: 3.5 },
            justifyItems: "center",
          }}
        >
          {sections.map((section, index) => (
            <Box
              key={index}
              sx={{
                width: "100%",
                maxWidth: 320,
                minHeight: 200,
                borderRadius: 3,
                overflow: "hidden",
                p: "2px",
                background: section.gradient,
                cursor: "pointer",
                transition: "0.3s",
                "&:hover": {
                  transform: "translateY(-6px) scale(1.02)",
                },
              }}
              onClick={() => navigate(section.path)}
            >
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  borderRadius: 3,
                  background: isDark ? BRAND.paperDark : "#fff",
                  textAlign: "center",
                  height: "100%",
                }}
              >
                <Box
                  sx={{
                    width: 70,
                    height: 70,
                    borderRadius: 2,
                    background: section.iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  <Box sx={{ color: section.iconColor }}>{section.icon}</Box>
                </Box>

                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {section.title}
                </Typography>
              </Paper>
            </Box>
          ))}
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 8, p: "3px", borderRadius: 5 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 5 },
              borderRadius: 5,
              background: isDark ? BRAND.paperDark : "#fff",
              textAlign: "center",
            }}
          >
            <DashboardCustomizeIcon
              sx={{
                fontSize: { xs: 40, sm: 50 },
                color: isDark ? BRAND.gold : BRAND.purple,
                mb: 2,
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {t("controlCenter.footerTitle")}
            </Typography>

            <Typography variant="body1" sx={{ mt: 1 }}>
              {t("controlCenter.footerText")}
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
