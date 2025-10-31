import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Api } from "../../api/Api";
import { toast } from "react-toastify";
import { Line } from "react-chartjs-2";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const cards = [
  { key: "totalUsers", label: "إجمالي المشتركات", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", icon: "👩‍💼" },
  { key: "activeUsers", label: "المشتركات النشِطات", gradient: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)", icon: "✅" },
  { key: "blockedUsers", label: "المشتركات المحظورات", gradient: "linear-gradient(135deg, #ef5350 0%, #c62828 100%)", icon: "🚫" },
  { key: "totalBookings", label: "إجمالي الحجوزات", gradient: "linear-gradient(135deg, #29b6f6 0%, #0288d1 100%)", icon: "📅" },
  { key: "activeBookings", label: "الحجوزات النشطة", gradient: "linear-gradient(135deg, #ab47bc 0%, #8e24aa 100%)", icon: "📌" },
  { key: "completedBookings", label: "الحجوزات المنجزة", gradient: "linear-gradient(135deg, #26a69a 0%, #00897b 100%)", icon: "🏁" },
  { key: "cancelled", label: "الحجوزات الملغاة", gradient: "linear-gradient(135deg, #ff7043 0%, #f4511e 100%)", icon: "❌" },
  { key: "totalSlots", label: "عدد الجلسات", gradient: "linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%)", icon: "🏋️" },
  { key: "todaySessions", label: "جلسات اليوم", gradient: "linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)", icon: "☀️" },
  { key: "upcomingWeekSessions", label: "جلسات الأسبوع القادم", gradient: "linear-gradient(135deg, #66bb6a 0%, #43a047 100%)", icon: "📆" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePercentAnim, setActivePercentAnim] = useState(0);
  const [cancelledPercentAnim, setCancelledPercentAnim] = useState(0);
  
  const BASE_URL = process.env.VITE_API_URL || "http://localhost:4000";
  const logoUrl = `${BASE_URL}/uploads/logo.jpg`;
  const fallbackLogo = "https://via.placeholder.com/36x36.png?text=F";
  const [imgSrc, setImgSrc] = React.useState(logoUrl);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await Api.get("/admin/dashboard");
      setStats(data);
    } catch (err) {
      toast.error("فشل تحميل الإحصاءات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (stats?.dailyBookings) {
      const totalActive = stats.dailyBookings.reduce((a, b) => a + b.active, 0);
      const totalCancelled = stats.dailyBookings.reduce((a, b) => a + b.cancelled, 0);
      const total = totalActive + totalCancelled;
      const activePercent = total ? ((totalActive / total) * 100).toFixed(1) : 0;
      const cancelledPercent = total ? ((totalCancelled / total) * 100).toFixed(1) : 0;

      let progress = 0;
      const interval = setInterval(() => {
        progress += 2;
        setActivePercentAnim(Math.min(progress, activePercent));
        setCancelledPercentAnim(Math.min(progress, cancelledPercent));
        if (progress >= Math.max(activePercent, cancelledPercent)) clearInterval(interval);
      }, 20);
    }
  }, [stats]);

  const chartData = stats?.dailyBookings
    ? {
        labels: stats.dailyBookings.map((d) =>
          new Date(d.date).toLocaleDateString("ar-EG", {
            weekday: "short",
          })
        ),
        datasets: [
          {
            label: "الحجوزات النشطة",
            data: stats.dailyBookings.map((d) => d.active),
            fill: true,
            borderColor: "#667eea",
            backgroundColor: "rgba(102, 126, 234, 0.1)",
            pointBackgroundColor: "#667eea",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            tension: 0.4,
            borderWidth: 3,
          },
          {
            label: "الحجوزات الملغاة",
            data: stats.dailyBookings.map((d) => d.cancelled),
            fill: true,
            borderColor: "#ff7043",
            backgroundColor: "rgba(255, 112, 67, 0.1)",
            pointBackgroundColor: "#ff7043",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            tension: 0.4,
            borderWidth: 3,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: { size: 14, weight: "600" },
          padding: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#333",
        bodyColor: "#666",
        borderColor: "#ddd",
        borderWidth: 1,
        cornerRadius: 10,
        padding: 12,
        displayColors: true,
        titleFont: { size: 14, weight: "bold" },
        bodyFont: { size: 13 },
      },
    },
    scales: {
      x: {
        ticks: { 
          color: "#666",
          font: { size: 12, weight: "500" },
        },
        grid: { display: false },
      },
      y: {
        ticks: { 
          color: "#666",
          font: { size: 12 },
        },
        grid: { color: "rgba(0,0,0,0.05)" },
        beginAtZero: true,
      },
    },
  };

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 50%, #fce4ec 100%)",
        py: { xs: 3, sm: 4, md: 6 },
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: { xs: 3, sm: 4, md: 5 } }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.75rem" },
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 1,
            }}
          >
            📊 لوحة الإحصاءات العامة
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              fontSize: { xs: "0.95rem", sm: "1rem" },
            }}
          >
            نظرة شاملة على أداء Fateness Studio
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
            <CircularProgress size={60} thickness={4} sx={{ color: "#667eea" }} />
          </Box>
        ) : stats ? (
          <>
            {/* Welcome Card */}
            <Box sx={{ position: "relative", mb: 4 }}>
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: 4,
                  filter: "blur(20px)",
                  opacity: 0.3,
                  transform: "scale(0.98)",
                }}
              />
              <Paper
                elevation={0}
                sx={{
                  position: "relative",
                  p: { xs: 3, sm: 4 },
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  borderRadius: 4,
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "300px",
                    height: "300px",
                    background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
                    borderRadius: "50%",
                    transform: "translate(30%, -30%)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                  <Box sx={{ zIndex: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: "1.5rem", sm: "2rem" } }}>
                      👋 مرحبًا {stats?.adminName || "آلاء"}!
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.95, fontSize: { xs: "0.95rem", sm: "1.1rem" }, fontWeight: 500 }}>
                      لديكِ اليوم <strong>{stats?.todaySessions || 0}</strong> جلسة نشطة و{" "}
                      <strong>{stats?.newUsersToday || 0}</strong> مشتركة جديدة 💪
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        inset: -2,
                        background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                        borderRadius: "50%",
                        filter: "blur(10px)",
                        opacity: 0.6,
                      }}
                    />
                    <img
                      src={imgSrc}
                      alt="Fateness Logo"
                      onError={() => setImgSrc(fallbackLogo)}
                      style={{
                        position: "relative",
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "4px solid rgba(255,255,255,0.3)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                      }}
                    />
                  </Box>
                </Box>
              </Paper>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: 5 }}>
              {cards.map((card, index) => (
                <Grid item xs={12} sm={6} md={4} lg={2.4} key={card.key}>
                  <Box
                    sx={{
                      position: "relative",
                      height: "100%",
                      animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                      "@keyframes fadeInUp": {
                        from: { opacity: 0, transform: "translateY(20px)" },
                        to: { opacity: 1, transform: "translateY(0)" },
                      },
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        background: card.gradient,
                        borderRadius: 3,
                        filter: "blur(15px)",
                        opacity: 0.2,
                        transition: "opacity 0.3s",
                      }}
                    />
                    <Paper
                      elevation={0}
                      sx={{
                        position: "relative",
                        p: { xs: 2.5, sm: 3 },
                        height: "100%",
                        textAlign: "center",
                        background: "rgba(255, 255, 255, 0.95)",
                        backdropFilter: "blur(10px)",
                        borderRadius: 3,
                        border: "1px solid rgba(255,255,255,0.3)",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        "&:hover": {
                          transform: "translateY(-8px)",
                          boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
                          "& .icon-box": {
                            transform: "scale(1.1) rotate(5deg)",
                          },
                        },
                      }}
                    >
                      <Box
                        className="icon-box"
                        sx={{
                          width: { xs: 60, sm: 70 },
                          height: { xs: 60, sm: 70 },
                          mx: "auto",
                          mb: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: card.gradient,
                          borderRadius: 3,
                          fontSize: { xs: "1.75rem", sm: "2rem" },
                          transition: "transform 0.3s ease",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        }}
                      >
                        {card.icon}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          fontSize: { xs: "0.85rem", sm: "0.9rem" },
                          fontWeight: 600,
                          mb: 1,
                        }}
                      >
                        {card.label}
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 800,
                          fontSize: { xs: "1.75rem", sm: "2rem" },
                          background: card.gradient,
                          backgroundClip: "text",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        {stats[card.key]}
                      </Typography>
                    </Paper>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Chart Section */}
            {chartData && (
              <Box sx={{ position: "relative" }}>
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: 4,
                    filter: "blur(20px)",
                    opacity: 0.15,
                    transform: "scale(0.98)",
                  }}
                />
                <Paper
                  elevation={0}
                  sx={{
                    position: "relative",
                    p: { xs: 3, sm: 4 },
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(10px)",
                    borderRadius: 4,
                    border: "1px solid rgba(255,255,255,0.3)",
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      mb: 3,
                      fontSize: { xs: "1.25rem", sm: "1.5rem" },
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    📈 عدد الحجوزات خلال آخر 7 أيام
                  </Typography>

                  <Box sx={{ position: "relative", height: { xs: 250, sm: 300 }, mb: 4 }}>
                    <Line data={chartData} options={chartOptions} />
                  </Box>

                  {/* Progress Bar */}
                  {stats.dailyBookings && (
                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          mb: 2,
                          fontWeight: 600,
                          color: "text.primary",
                        }}
                      >
                        🔸 نسبة الحجوزات خلال الأسبوع الأخير
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          height: 28,
                          borderRadius: 20,
                          overflow: "hidden",
                          backgroundColor: "#f5f5f5",
                          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.08)",
                        }}
                      >
                        <Box
                          sx={{
                            width: `${activePercentAnim}%`,
                            background: "linear-gradient(90deg, #667eea, #764ba2)",
                            height: "100%",
                            transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                            position: "relative",
                            "&::after": {
                              content: '""',
                              position: "absolute",
                              top: 0,
                              right: 0,
                              bottom: 0,
                              width: "50%",
                              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3))",
                            },
                          }}
                        />
                        <Box
                          sx={{
                            width: `${cancelledPercentAnim}%`,
                            background: "linear-gradient(90deg, #ff7043, #f4511e)",
                            height: "100%",
                            transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                            position: "relative",
                            "&::after": {
                              content: '""',
                              position: "absolute",
                              top: 0,
                              right: 0,
                              bottom: 0,
                              width: "50%",
                              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3))",
                            },
                          }}
                        />
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mt: 2,
                          gap: 2,
                          flexWrap: "wrap",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: 1,
                              background: "linear-gradient(135deg, #667eea, #764ba2)",
                            }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                            نشطة: {activePercentAnim.toFixed(1)}%
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: 1,
                              background: "linear-gradient(135deg, #ff7043, #f4511e)",
                            }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                            ملغاة: {cancelledPercentAnim.toFixed(1)}%
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Paper>
              </Box>
            )}
          </>
        ) : (
          <Paper
            sx={{
              p: 6,
              textAlign: "center",
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: 4,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              لا توجد بيانات متاحة حالياً
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}