// client/src/pages/Dashboard.jsx
import React from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Container,
  CircularProgress,
} from "@mui/material";

import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

import { useNavigate } from "react-router-dom";
import { keyframes } from "@mui/system";

import { useThemeMode } from "../context/ThemeContext";
import { useBrand } from "../context/BrandContext";

import { useTranslation } from "react-i18next";
import SubscriptionStatusCard from "../components/SubscriptionStatusCard";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";


const float = keyframes`
0%, 100% { transform: translateY(0px); }
50% { transform: translateY(-10px); }
`;

export default function Dashboard() {

  const navigate = useNavigate();
  const { t } = useTranslation();

  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const { cardUrl, loading: loadingBrand } = useBrand();

  const fallbackCard = "/uploads/DEFAULT_CARD.jpg";
  const imgSrc = loadingBrand ? null : cardUrl || fallbackCard;

  const { user } = useContext(UserContext);

  // 🔹 الاختصارات مع الترجمة
  const shortcuts = [
    {
      title: t("dashboard.profile_title"),
      desc: t("dashboard.profile_desc"),
      icon: <AccountCircleIcon sx={{ fontSize: 50 }} />,
      path: "/profile",
      gradient: "linear-gradient(135deg, #9B6FD6 0%, #E8B54D 100%)",
      bgGlow: "rgba(155, 111, 214, 0.25)",
    },
    {
      title: t("dashboard.booking_title"),
      desc: t("dashboard.booking_desc"),
      icon: <CalendarMonthIcon sx={{ fontSize: 50 }} />,
      path: "/bookings-hub",
      gradient: "linear-gradient(135deg, #EC407A 0%, #9B6FD6 100%)",
      bgGlow: "rgba(236, 64, 122, 0.3)",
    },
  ];

  return (
    <Box
      dir={t("dir")}
      sx={{
        minHeight: "100vh",
        py: { xs: 4, md: 8 },
        px: 2,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Tajawal', 'Cairo', sans-serif",
        transition: "background 0.4s ease",
        background: isDark
          ? "linear-gradient(135deg, #1A1523 0%, #2B2139 100%)"
          : "linear-gradient(135deg, #FFF9E6 0%, #FCE4EC 30%, #F3E5F5 70%, #FFF8E1 100%)",
      }}
    >
      {/* دوائر خلفية */}
      <Box
        sx={{
          position: "absolute",
          top: "-100px",
          right: "-100px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: isDark
            ? "radial-gradient(circle, rgba(155,111,214,0.15) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(155,111,214,0.12) 0%, transparent 70%)",
          animation: `${float} 6s ease-in-out infinite`,
        }}
      />

      <Box
        sx={{
          position: "absolute",
          bottom: "-150px",
          left: "-150px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: isDark
            ? "radial-gradient(circle, rgba(255,217,61,0.1) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(255,217,61,0.12) 0%, transparent 70%)",
          animation: `${float} 8s ease-in-out infinite`,
          animationDelay: "1s",
        }}
      />


      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        {/* صورة الغلاف */}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: { xs: 240, sm: 300, md: 360 },
            borderRadius: 4,
            overflow: "hidden",
            mb: 6,
            boxShadow: isDark
              ? "0 12px 40px rgba(0,0,0,0.5)"
              : "0 12px 40px rgba(155,111,214,0.25)",
          }}
        >
          {loadingBrand ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                background: isDark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box
                component="img"
                src={imgSrc}
                alt=""
                onError={(e) => (e.target.src = fallbackCard)}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "brightness(0.75)",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.2))",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: { xs: 24, sm: 36, md: 48 },
                  left: "50%",
                  transform: "translateX(-50%)",
                  textAlign: "center",
                  color: "#fff",
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    mb: 1,
                    fontSize: { xs: "1.6rem", sm: "2.2rem", md: "2.6rem" },
                    textShadow: "0 3px 10px rgba(0,0,0,0.7)",
                  }}
                >
                  {t("dashboard.welcome")}
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 500,
                    color: "#f5f5f5",
                    fontSize: { xs: "1rem", sm: "1.1rem", md: "1.2rem" },
                    textShadow: "0 2px 6px rgba(0,0,0,0.6)",
                  }}
                >
                  {t("dashboard.subtitle")}
                </Typography>
              </Box>
            </>
          )}
        </Box>


        {user && !user.isSuperAdmin && (
          <SubscriptionStatusCard
            subscriptionStart={user.subscriptionStart}
            subscriptionEnd={user.subscriptionEnd}
            isDark={isDark}
          />
        )}


        {/* البطاقات */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 3,
            justifyContent: "center",
            mb: 8,
            maxWidth: "900px",
            mx: "auto",
          }}
        >
          {shortcuts.map((item, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: { xs: 4, md: 5 },
                borderRadius: 4,
                textAlign: "center",
                width: { xs: "100%", sm: "400px" },
                minHeight: "420px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                background: isDark ? "#1F1B2D" : "#FFFFFF",
                border: isDark
                  ? "2px solid rgba(255,255,255,0.05)"
                  : "2px solid rgba(155,111,214,0.15)",
                transition: "all 0.4s ease",
                cursor: "pointer",
                "&:hover": {
                  transform: "translateY(-10px)",
                  boxShadow: isDark
                    ? "0 15px 35px rgba(155,111,214,0.3)"
                    : `0 24px 60px ${item.bgGlow}`,
                  borderColor: "#9B6FD6",
                },
              }}
              onClick={() => navigate(item.path)}
            >
              <Box>
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: item.gradient,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                    color: "#fff",
                  }}
                >
                  {item.icon}
                </Box>

                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    color: isDark ? "#fff" : "#2D2D2D",
                  }}
                >
                  {item.title}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: isDark ? "#ccc" : "#666",
                    mb: 4,
                    lineHeight: 1.7,
                  }}
                >
                  {item.desc}
                </Typography>
              </Box>

              <Button
                variant="contained"
                sx={{
                  background: item.gradient,
                  color: "#fff",
                  fontWeight: 700,
                  py: 1.5,
                  borderRadius: 3,
                  textTransform: "none",
                  "&:hover": {
                    transform: "scale(1.05)",
                  },
                }}
              >
                {t("dashboard.enter_now")}
              </Button>
            </Paper>
          ))}
        </Box>

        {/* رسالة تحفيزية */}
        <Box
          sx={{
            mt: 8,
            textAlign: "center",
            animation: `${float} 4s ease-in-out infinite`,
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 2,
              background: "linear-gradient(135deg, #9B6FD6 0%, #EC407A 100%)",
              color: "#fff",
              px: { xs: 4, md: 6 },
              py: { xs: 2.5, md: 3 },
              borderRadius: 50,
              fontWeight: 600,
              fontSize: { xs: "1rem", md: "1.2rem" },
            }}
          >
            <TrendingUpIcon />
            <span>{t("dashboard.keep_going")}</span>
            <span>💪</span>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
