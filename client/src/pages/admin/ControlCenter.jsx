import React from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

// 🧭 الأيقونات لكل قسم
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

  // 🧩 الأقسام داخل لوحة الإدارة
  const sections = [
    {
      title: "إضافة مشتركة جديدة",
      icon: <PersonAddAltIcon />,
      path: "/register",
      color: "#42a5f5",
    },
    {
      title: "لوحة الإحصاءات العامة",
      icon: <AssessmentIcon />,
      path: "/admin/dashboard",
      color: "#1976d2",
    },
    {
      title: "قائمة المشتركات",
      icon: <GroupIcon />,
      path: "/admin/users",
      color: "#4caf50",
    },
    {
      title: "الحجوزات",
      icon: <EventNoteIcon />,
      path: "/admin/bookings",
      color: "#1976d2",
    },
    {
      title: "الجدول الأسبوعي",
      icon: <ScheduleIcon />,
      path: "/admin/slots",
      color: "#ab47bc",
    },
    {
      title: "القوالب الأسبوعية",
      icon: <LayersIcon />,
      path: "/admin/schedule",
      color: "#009688",
    },
    {
      title: "الإشعارات",
      icon: <NotificationsActiveIcon />,
      path: "/admin/notifications",
      color: "#f57c00",
    },
    {
      title: "التقارير والإحصاءات",
      icon: <AssessmentIcon />,
      path: "/admin/reports",
      color: "#0288d1",
    },
    {
      title: "الإعدادات العامة",
      icon: <SettingsIcon />,
      path: "/admin/settings",
      color: "#757575",
    },
  ];

  return (
    <Box
      dir="rtl"
      sx={{
        maxWidth: 1200,
        mx: "auto",
        mt: 6,
        px: 3,
        fontFamily: "Tajawal, Cairo, sans-serif",
      }}
    >
      {/* ✳️ العنوان */}
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          🎛️ مركز التحكم الإداري
        </Typography>
        <Typography variant="body1" color="text.secondary">
          اختاري القسم الذي ترغبين بإدارته من القائمة أدناه 👇
        </Typography>
      </Box>

      {/* 🔹 شبكة البطاقات */}
      <Grid container spacing={3} justifyContent="center">
        {sections.map((sec, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              onClick={() => navigate(sec.path)}
              sx={{
                p: 3,
                textAlign: "center",
                borderRadius: 3,
                cursor: "pointer",
                transition: "0.3s",
                boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
                "&:hover": {
                  transform: "scale(1.05)",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                },
              }}
            >
              <IconButton
                size="large"
                sx={{
                  backgroundColor: `${sec.color}22`,
                  color: sec.color,
                  mb: 1.5,
                }}
              >
                {sec.icon}
              </IconButton>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {sec.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* 🔸 بطاقة صغيرة في الأسفل */}
      <Paper
        sx={{
          mt: 6,
          p: 3,
          borderRadius: 3,
          background:
            theme.palette.mode === "light"
              ? "linear-gradient(180deg,#f5f5f5,#e3f2fd)"
              : "#333",
          textAlign: "center",
        }}
      >
        <DashboardCustomizeIcon
          sx={{ fontSize: 40, mb: 1, color: "#1976d2" }}
        />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          لوحة تحكم متكاملة لإدارة Fateness Studio
        </Typography>
        <Typography variant="body2" color="text.secondary">
          يمكنك العودة إلى هذه الصفحة في أي وقت لإدارة جميع جوانب النظام من مكان
          واحد.
        </Typography>
      </Paper>
    </Box>
  );
}
