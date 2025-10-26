import React from "react";
import { Box, Paper, Typography, Grid, Button } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const shortcuts = [
    {
      title: "الملف الشخصي",
      desc: "عرض بياناتك وتطور الوزن.",
      icon: <AccountCircleIcon sx={{ fontSize: 40, color: "#1976d2" }} />,
      path: "/profile",
    },
    {
      title: "الفترات المتاحة",
      desc: "احجزي موعدك القادم.",
      icon: <EventAvailableIcon sx={{ fontSize: 40, color: "#2e7d32" }} />,
      path: "/available-slots",
    },
    {
      title: "حجوزاتي",
      desc: "عرض وإدارة جميع حجوزاتك.",
      icon: <CalendarMonthIcon sx={{ fontSize: 40, color: "#f57c00" }} />,
      path: "/my-bookings",
    },
  ];

  return (
    <Box
      dir="rtl"
      sx={{
        maxWidth: 1000,
        mx: "auto",
        mt: 4,
        px: 2,
        fontFamily: "Tajawal, Cairo, sans-serif",
      }}
    >
      <Typography variant="h5" gutterBottom textAlign="center">
        لوحة التحكم
      </Typography>

      <Paper
        elevation={2}
        sx={{
          p: 3,
          textAlign: "center",
          mb: 4,
          background: "linear-gradient(90deg, #e3f2fd, #fce4ec)",
          borderRadius: 3,
        }}
      >
        <Typography variant="h6" mb={1}>
          مرحبًا بكِ في تطبيق <strong>Fateness</strong> 💪
        </Typography>
        <Typography color="text.secondary">
          من هنا يمكنك الوصول السريع إلى ملفك، حجوزاتك، والفترات المتاحة.
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {shortcuts.map((item, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                textAlign: "center",
                borderRadius: 3,
                transition: "all 0.3s",
                "&:hover": { transform: "translateY(-5px)", boxShadow: 6 },
              }}
            >
              {item.icon}
              <Typography variant="h6" mt={1} mb={1}>
                {item.title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                mb={2}
                minHeight={40}
              >
                {item.desc}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate(item.path)}
              >
                ادخلي الآن
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
