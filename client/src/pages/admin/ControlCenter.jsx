import React from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import GroupIcon from "@mui/icons-material/Group";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SettingsIcon from "@mui/icons-material/Settings";
import AssessmentIcon from "@mui/icons-material/Assessment";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import LayersIcon from "@mui/icons-material/Layers";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";

export default function ControlCenter() {
  const navigate = useNavigate();
  const theme = useTheme();

  const sections = [
    {
      title: "إضافة مشتركة جديدة",
      icon: <PersonAddAltIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/register",
      gradient: "linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%)",
      iconBg: "linear-gradient(135deg, rgba(66,165,245,0.1) 0%, rgba(30,136,229,0.1) 100%)",
      iconColor: "#42a5f5",
    },
    {
      title: "لوحة الإحصاءات العامة",
      icon: <AssessmentIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/dashboard",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      iconBg: "linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)",
      iconColor: "#667eea",
    },
    {
      title: "قائمة المشتركات",
      icon: <GroupIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/users",
      gradient: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
      iconBg: "linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(46,125,50,0.1) 100%)",
      iconColor: "#4caf50",
    },
    {
      title: "الحجوزات",
      icon: <EventNoteIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/bookings",
      gradient: "linear-gradient(135deg, #29b6f6 0%, #0288d1 100%)",
      iconBg: "linear-gradient(135deg, rgba(41,182,246,0.1) 0%, rgba(2,136,209,0.1) 100%)",
      iconColor: "#29b6f6",
    },
    {
      title: "الجدول الأسبوعي",
      icon: <ScheduleIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/slots",
      gradient: "linear-gradient(135deg, #ab47bc 0%, #8e24aa 100%)",
      iconBg: "linear-gradient(135deg, rgba(171,71,188,0.1) 0%, rgba(142,36,170,0.1) 100%)",
      iconColor: "#ab47bc",
    },
    {
      title: "القوالب الأسبوعية",
      icon: <LayersIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/schedule",
      gradient: "linear-gradient(135deg, #26c6da 0%, #00acc1 100%)",
      iconBg: "linear-gradient(135deg, rgba(38,198,218,0.1) 0%, rgba(0,172,193,0.1) 100%)",
      iconColor: "#26c6da",
    },
    {
      title: "الإشعارات",
      icon: <NotificationsActiveIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/notifications",
      gradient: "linear-gradient(135deg, #ff7043 0%, #f4511e 100%)",
      iconBg: "linear-gradient(135deg, rgba(255,112,67,0.1) 0%, rgba(244,81,30,0.1) 100%)",
      iconColor: "#ff7043",
    },
    {
      title: "التقارير والإحصاءات",
      icon: <AssessmentIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/reports",
      gradient: "linear-gradient(135deg, #26a69a 0%, #00897b 100%)",
      iconBg: "linear-gradient(135deg, rgba(38,166,154,0.1) 0%, rgba(0,137,123,0.1) 100%)",
      iconColor: "#26a69a",
    },
    {
      title: "الإعدادات العامة",
      icon: <SettingsIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/settings",
      gradient: "linear-gradient(135deg, #78909c 0%, #546e7a 100%)",
      iconBg: "linear-gradient(135deg, rgba(120,144,156,0.1) 0%, rgba(84,110,122,0.1) 100%)",
      iconColor: "#78909c",
    },
  ];

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 50%, #fce4ec 100%)",
        py: { xs: 4, sm: 6, md: 8 },
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        <Box sx={{ textAlign: "center", mb: { xs: 4, sm: 6, md: 8 }, px: 2 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.75rem", sm: "2.5rem", md: "3rem", lg: "3.5rem" },
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 1.5,
              letterSpacing: "-0.5px",
            }}
          >
            🎛️ مركز التحكم الإداري
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "text.secondary",
              fontSize: { xs: "0.95rem", sm: "1.1rem", md: "1.25rem" },
              fontWeight: 500,
              maxWidth: 700,
              mx: "auto",
            }}
          >
            اختاري القسم الذي ترغبين بإدارته من القائمة أدناه 👇
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mb: { xs: 4, sm: 6, md: 8 } }}>
          {sections.map((section, index) => (
            <Grid item xs={6} sm={6} md={4} lg={3} key={index}>
              <Box
                sx={{
                  position: "relative",
                  p: "2px",
                  borderRadius: 4,
                  background: section.gradient,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "pointer",
                  "&:hover": {
                    transform: "translateY(-8px) scale(1.02)",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                  },
                }}
                onClick={() => navigate(section.path)}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, sm: 3, md: 3.5 },
                    borderRadius: 4,
                    background: "#fff",
                    textAlign: "center",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 60, sm: 70, md: 80 },
                      height: { xs: 60, sm: 70, md: 80 },
                      borderRadius: 3,
                      background: section.iconBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 2,
                      transition: "all 0.3s ease",
                      boxShadow: `0 4px 12px ${section.iconColor}22`,
                      "&:hover": {
                        transform: "rotate(10deg) scale(1.1)",
                      },
                    }}
                  >
                    <Box sx={{ color: section.iconColor }}>
                      {section.icon}
                    </Box>
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "0.85rem", sm: "0.95rem", md: "1rem" },
                      color: "text.primary",
                      lineHeight: 1.4,
                    }}
                  >
                    {section.title}
                  </Typography>
                </Paper>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box
          sx={{
            position: "relative",
            p: "3px",
            borderRadius: 5,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
            boxShadow: "0 10px 40px rgba(102,126,234,0.3)",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 5, md: 6 },
              borderRadius: 5,
              background: "#fff",
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <Box
                sx={{
                  background: "linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)",
                  p: { xs: 2, sm: 2.5, md: 3 },
                  borderRadius: 3,
                  boxShadow: "0 4px 20px rgba(102,126,234,0.2)",
                }}
              >
                <DashboardCustomizeIcon
                  sx={{
                    fontSize: { xs: 36, sm: 42, md: 48 },
                    color: "#667eea",
                  }}
                />
              </Box>
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
                mb: 1.5,
                color: "text.primary",
              }}
            >
              لوحة تحكم متكاملة لإدارة Fateness Studio
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
                fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
                maxWidth: 800,
                mx: "auto",
                lineHeight: 1.7,
              }}
            >
              يمكنك العودة إلى هذه الصفحة في أي وقت لإدارة جميع جوانب النظام من
              مكان واحد.
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}