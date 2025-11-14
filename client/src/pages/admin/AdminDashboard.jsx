import React, { useEffect, useState } from "react";
import { Box, Paper, Typography, CircularProgress } from "@mui/material";
import { Line } from "react-chartjs-2";
import { toast } from "react-toastify";
import { Api } from "../../api/Api";
import { useThemeMode } from "../../context/ThemeContext";
import { useBrand } from "../../context/BrandContext"; // ✅ شعار النادي
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useTranslation } from "react-i18next"; // ✅ الترجمة

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// 🎯 البطاقات
const cards = [
  { key: "totalUsers", label: "إجمالي المشتركات", icon: "💖" },
  { key: "activeUsers", label: "المشتركات النشِطات", icon: "🌸" },
  { key: "blockedUsers", label: "المشتركات المحظورات", icon: "🚷" },
  { key: "totalBookings", label: "إجمالي الحجوزات", icon: "📅" },
  { key: "activeBookings", label: "الحجوزات النشطة", icon: "💪" },
  { key: "completedBookings", label: "الحجوزات المنجزة", icon: "🏆" },
  { key: "cancelled", label: "الحجوزات الملغاة", icon: "💔" },
  { key: "totalSlots", label: "عدد الجلسات", icon: "🧘‍♀️" },
  { key: "todaySessions", label: "جلسات اليوم", icon: "☀️" },
  { key: "upcomingWeekSessions", label: "جلسات الأسبوع القادم", icon: "🌈" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePercentAnim, setActivePercentAnim] = useState(0);
  const [cancelledPercentAnim, setCancelledPercentAnim] = useState(0);
  const { mode, BRAND } = useThemeMode();
  const { logoUrl, loading: loadingBrand } = useBrand(); // ✅ الشعار من السياق
  const isDark = mode === "dark";

  const fallbackLogo = "/uploads/fatiness_logo.png";
  const [imgSrc, setImgSrc] = useState(fallbackLogo);

  const { t, i18n } = useTranslation(); // ✅ الترجمة

  // ✅ عند توفر الشعار من السياق نحدّث الصورة
  // ✅ عند توفر الشعار من السياق نحدّث الصورة فورًا
  useEffect(() => {
    if (!loadingBrand && logoUrl) {
      setImgSrc(logoUrl);
    }
  }, [logoUrl, loadingBrand]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data } = await Api.get("/admin/dashboard");
        setStats(data);
      } catch {
        toast.error(t("adminDashboard.errors.fetchStats"));
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [t]);

  // 🌀 التحريك
  useEffect(() => {
    if (stats?.dailyBookings) {
      const totalActive = stats.dailyBookings.reduce((a, b) => a + b.active, 0);
      const totalCancelled = stats.dailyBookings.reduce(
        (a, b) => a + b.cancelled,
        0
      );
      const total = totalActive + totalCancelled;
      const activePercent = total
        ? ((totalActive / total) * 100).toFixed(1)
        : 0;
      const cancelledPercent = total
        ? ((totalCancelled / total) * 100).toFixed(1)
        : 0;

      let progress = 0;
      const interval = setInterval(() => {
        progress += 2;
        setActivePercentAnim(Math.min(progress, activePercent));
        setCancelledPercentAnim(Math.min(progress, cancelledPercent));
        if (progress >= Math.max(activePercent, cancelledPercent))
          clearInterval(interval);
      }, 20);
      return () => clearInterval(interval);
    }
  }, [stats]);

  // ⚙️ تحديد الـ locale حسب اللغة المختارة
  const chartLocale =
    i18n.language === "he"
      ? "he-IL"
      : i18n.language === "en"
      ? "en-US"
      : "ar-EG";

  // 🎨 الرسم البياني
  const chartData = stats?.dailyBookings
    ? {
        labels: stats.dailyBookings.map((d) =>
          new Date(d.date).toLocaleDateString(chartLocale, {
            weekday: "short",
          })
        ),
        datasets: [
          {
            label: t("adminDashboard.chart.activeBookingsLabel"),
            data: stats.dailyBookings.map((d) => d.active),
            borderColor: isDark ? "#ab47bc" : "#ab47bc",
            backgroundColor: isDark
              ? "rgba(206, 147, 216, 0.25)"
              : "rgba(244, 143, 177, 0.25)",
            tension: 0.4,
            fill: true,
          },
          {
            label: t("adminDashboard.chart.cancelledBookingsLabel"),
            data: stats.dailyBookings.map((d) => d.cancelled),
            borderColor: isDark ? "#ffb74d" : "#ffb74d",
            backgroundColor: isDark
              ? "rgba(244,143,177,0.25)"
              : "rgba(255,183,77,0.25)",
            tension: 0.4,
            fill: true,
          },
        ],
      }
    : null;

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: { color: isDark ? "#f3e5f5" : "#444" },
      },
      tooltip: {
        backgroundColor: isDark ? "#2a2139" : "#fff8fc",
        titleColor: isDark ? BRAND.gold : "#9c27b0",
        bodyColor: isDark ? "#fff" : "#000",
        borderColor: isDark ? "#4a148c" : "#f8bbd0",
        borderWidth: 1,
        cornerRadius: 10,
      },
    },
    scales: {
      x: { ticks: { color: isDark ? "#ddd" : "#555" } },
      y: { ticks: { color: isDark ? "#ddd" : "#555" } },
    },
  };

  return (
    <Box
      sx={{
        maxWidth: 1100,
        mx: "auto",
        mt: 4,
        pb: 6,
        px: 2,
        background: isDark
          ? `linear-gradient(180deg, ${BRAND.bgDarkTop}, ${BRAND.bgDarkBottom})`
          : "linear-gradient(180deg, #fff9fb, #fffaf5, #f9f2ff)",
        borderRadius: 4,
        transition: "all 0.4s ease",
      }}
    >
      {/* 🌸 بطاقة الترحيب */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          textAlign: "center",
          background: isDark
            ? `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.gold})`
            : "linear-gradient(135deg, #f48fb1, #ce93d8, #fff176)",
          color: "#fff",
          borderRadius: 4,
          boxShadow: isDark
            ? "0 4px 20px rgba(0,0,0,0.4)"
            : "0 4px 15px rgba(240,120,200,0.3)",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          {/* 👋 مرحبًا {stats?.adminName || "آلاء"}! */}
          {t("adminDashboard.welcomeTitle", {
            name: stats?.adminName || "آلاء",
          })}
        </Typography>
        <Typography variant="body1" sx={{ fontSize: "1.05rem" }}>
          {/* لديكِ اليوم X جلسات نشطة و Y مشتركات جديدات 💪 */}
          {t("adminDashboard.welcomeMessage", {
            sessions: stats?.todaySessions || 0,
            newUsers: stats?.newUsersToday || 0,
          })}
        </Typography>

        <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
          <img
            src={imgSrc}
            alt="Fateness Logo"
            onError={() => setImgSrc(fallbackLogo)}
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              objectFit: "cover",
              backgroundColor: "#fff",
              boxShadow: "0 0 10px rgba(255,255,255,0.5)",
              opacity: loadingBrand ? 0.5 : 1,
              transition: "opacity 0.6s ease",
            }}
          />
        </Box>
      </Paper>

      <Typography
        variant="h5"
        gutterBottom
        sx={{
          color: isDark ? BRAND.gold : "#7b1fa2",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        {t("adminDashboard.mainTitle")}
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress sx={{ color: isDark ? BRAND.gold : "#ce93d8" }} />
        </Box>
      ) : stats ? (
        <>
          {/* 🧁 البطاقات */}
          <Box
            sx={{
              mt: 2,
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(4, 1fr)",
              },
            }}
          >
            {cards.map((card) => (
              <Paper
                key={card.key}
                sx={{
                  p: 2.5,
                  textAlign: "center",
                  borderRadius: 3,
                  background: isDark
                    ? BRAND.paperDark
                    : "linear-gradient(180deg,#ffffff,#fff8fc,#fffef5)",
                  borderTop: "4px solid",
                  borderImage:
                    "linear-gradient(90deg,#f48fb1,#ce93d8,#fff176) 1",
                  boxShadow: isDark
                    ? "0 2px 8px rgba(0,0,0,0.5)"
                    : "0 2px 8px rgba(200,150,255,0.2)",
                  transition: "all .3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: isDark
                      ? "0 6px 15px rgba(0,0,0,0.6)"
                      : "0 6px 15px rgba(200,150,255,0.3)",
                  },
                }}
              >
                <Typography variant="h3">{card.icon}</Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: isDark ? BRAND.gold : "#9c27b0",
                  }}
                >
                  {t(`adminDashboard.cards.${card.key}`)}
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    mt: 0.5,
                    fontWeight: "bold",
                    color: isDark ? "#fff" : "#4a148c",
                  }}
                >
                  {stats[card.key] ?? 0}
                </Typography>
              </Paper>
            ))}
          </Box>

          {/* 📈 المخطط */}
          {chartData && (
            <Box sx={{ mt: 6, position: "relative", pt: 4, mb: 10 }}>
              {/* 🖼️ شعار صغير في الزاوية العليا */}
              <Box
                sx={{
                  position: "absolute",
                  top: 25,
                  right: 12,
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: isDark
                    ? "rgba(30, 20, 40, 0.6)"
                    : "rgba(255, 255, 255, 0.85)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isDark
                    ? "0 0 10px rgba(0,0,0,0.6)"
                    : "0 0 8px rgba(200,150,255,0.3)",
                  backdropFilter: "blur(6px)",
                  zIndex: 2,
                }}
              >
                <img
                  src={imgSrc}
                  alt="Brand Logo"
                  onError={() => setImgSrc(fallbackLogo)}
                  style={{
                    width: "84%",
                    height: "84%",
                    borderRadius: "50%",
                    objectFit: "cover",
                    backgroundColor: "#fff",
                  }}
                />
              </Box>

              <Typography
                variant="h6"
                sx={{
                  color: isDark ? BRAND.gold : "#8e24aa",
                  fontWeight: "bold",
                  mb: 2,
                }}
              >
                {t("adminDashboard.chart.title")}
              </Typography>

              <Paper
                sx={{
                  p: 3,
                  borderRadius: 4,
                  background: isDark ? BRAND.paperDark : "#fff",
                  boxShadow: isDark
                    ? "0 4px 20px rgba(0,0,0,0.5)"
                    : "0 4px 15px rgba(200,150,255,0.15)",
                  height: { xs: 280, sm: 350, md: 420 },
                }}
              >
                <Line
                  data={chartData}
                  options={chartOptions}
                  height={180}
                  style={{
                    maxHeight: 400,
                    marginTop: "10px",
                  }}
                />
                {/* 🔸 شريط النسبة */}
                <Box sx={{ mt: 4 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 1, color: isDark ? BRAND.gold : "#7b1fa2" }}
                  >
                    {t("adminDashboard.chart.weekRatioTitle")}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      height: 22,
                      borderRadius: 12,
                      overflow: "hidden",
                      backgroundColor: isDark ? "#3a2d4f" : "#f3e5f5",
                    }}
                  >
                    <Box
                      sx={{
                        width: `${activePercentAnim}%`,
                        background: isDark
                          ? "linear-gradient(90deg,#ba68c8,#f48fb1)"
                          : "linear-gradient(90deg,#f48fb1,#ce93d8)",
                        height: "100%",
                        transition: "width 0.3s ease",
                      }}
                    />
                    <Box
                      sx={{
                        width: `${cancelledPercentAnim}%`,
                        background: isDark
                          ? "linear-gradient(90deg,#fff59d,#fbc02d)"
                          : "linear-gradient(90deg,#fff176,#ffd54f)",
                        height: "100%",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mt: 1,
                      color: isDark ? "#ccc" : "#555",
                    }}
                  >
                    <Typography variant="body2">
                      {t("adminDashboard.chart.activePercentLabel", {
                        value: Number(activePercentAnim).toFixed(1),
                      })}
                    </Typography>
                    <Typography variant="body2">
                      {t("adminDashboard.chart.cancelledPercentLabel", {
                        value: Number(cancelledPercentAnim).toFixed(1),
                      })}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          )}
        </>
      ) : (
        <Typography sx={{ mt: 3 }}>
          {t("adminDashboard.noData")}
        </Typography>
      )}
    </Box>
  );
}
