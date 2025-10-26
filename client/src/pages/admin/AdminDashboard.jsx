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

// ✅ تسجيل مكونات Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// 🎯 البطاقات العلوية
const cards = [
  { key: "totalUsers", label: "إجمالي المشتركات", color: "primary", icon: "👩‍💼" },
  { key: "activeUsers", label: "المشتركات النشِطات", color: "success", icon: "✅" },
  { key: "blockedUsers", label: "المشتركات المحظورات", color: "error", icon: "🚫" },
  { key: "totalBookings", label: "إجمالي الحجوزات", color: "info", icon: "📅" },
  { key: "activeBookings", label: "الحجوزات النشطة", color: "secondary", icon: "📌" },
  { key: "cancelled", label: "الحجوزات الملغاة", color: "error", icon: "❌" },
  { key: "totalSlots", label: "عدد الجلسات", color: "primary", icon: "🏋️" },
  { key: "todaySessions", label: "جلسات اليوم", color: "warning", icon: "☀️" },
  { key: "upcomingWeekSessions", label: "جلسات الأسبوع القادم", color: "success", icon: "📆" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePercentAnim, setActivePercentAnim] = useState(0);
  const [cancelledPercentAnim, setCancelledPercentAnim] = useState(0);
  const BASE_URL = process.env.VITE_API_URL || "http://localhost:4000";

  // ✅ مسار الصورة الثابت
  const logoUrl = `${BASE_URL}/uploads/logo.jpg`;

  // ✅ شعار افتراضي إذا لم توجد الصورة
  const fallbackLogo = "https://via.placeholder.com/36x36.png?text=F"; // أو يمكنك استبدالها بصورة من مجلد public

  const [imgSrc, setImgSrc] = React.useState(logoUrl);
  // 🔹 جلب البيانات
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

  // 🌀 تحريك شريط النسب تدريجيًا
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

  // 🔹 إعداد بيانات الرسم البياني بخطّين
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
            borderColor: "#1976d2",
            backgroundColor: "rgba(25, 118, 210, 0.15)",
            pointBackgroundColor: "#1976d2",
            tension: 0.4,
          },
          {
            label: "الحجوزات الملغاة",
            data: stats.dailyBookings.map((d) => d.cancelled),
            fill: true,
            borderColor: "#ff9800",
            backgroundColor: "rgba(255, 152, 0, 0.1)",
            pointBackgroundColor: "#ff9800",
            tension: 0.4,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: { font: { size: 13 } },
      },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#1976d2",
        bodyColor: "#000",
        borderColor: "#ccc",
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        ticks: { color: "#555" },
        grid: { display: false },
      },
      y: {
        ticks: { color: "#555" },
        grid: { color: "#eee" },
      },
    },
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", mt: 4, pb: 5 }}>
    {/* 🟢 بطاقة ترحيب المديرة */}
<Paper
  sx={{
    p: 3,
    mb: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "linear-gradient(90deg,#1976d2,#42a5f5)",
    color: "white",
    borderRadius: 3,
    boxShadow: 3,
  }}
>
  <Box>
    <Typography variant="h5" sx={{ fontWeight: 700 }}>
      👋 مرحبًا {stats?.adminName || "آلاء"}!
    </Typography>
    <Typography variant="body1">
      لديكِ اليوم {stats?.todaySessions || 0} جلسات نشطة و{" "}
      {stats?.newUsersToday || 0} مشتركات جديدات 💪
    </Typography>
  </Box>
            <img
              src={imgSrc}
              alt="Fateness Logo"
              onError={() => setImgSrc(fallbackLogo)} // 👈 في حال لم توجد الصورة
              style={{
                width: 70,
                height: 70,
                borderRadius: "50%",
                objectFit: "cover",
                backgroundColor: "#fff",
                boxShadow: "0 0 5px rgba(0,0,0,0.1)",
              }}
            />
</Paper>

      <Typography variant="h5" gutterBottom>
        📊 لوحة الإحصاءات العامة
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : stats ? (
        <>
          {/* 🔹 البطاقات */}
          <Grid container spacing={2}>
            {cards.map((card) => (
              <Grid item xs={12} sm={6} md={4} key={card.key}>
                <Paper
                  sx={{
                    p: 3,
                    textAlign: "center",
                    borderTop: `5px solid var(--mui-palette-${card.color}-main)`,
                    boxShadow: 2,
                    transition: "0.3s",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: 6,
                    },
                  }}
                >
                  <Typography variant="h3" sx={{ mb: 1 }}>
                    {card.icon}
                  </Typography>
                  <Typography variant="h6" color={`${card.color}.main`}>
                    {card.label}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ mt: 1, fontWeight: "bold", color: "text.primary" }}
                  >
                    {stats[card.key]}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* 🔹 المخطط البياني */}
          {chartData && (
            <Box sx={{ mt: 6 }}>
              <Typography variant="h6" gutterBottom>
                📈 عدد الحجوزات خلال آخر 7 أيام
              </Typography>

              <Paper sx={{ p: 3, boxShadow: 3, borderRadius: 3 }}>
                <Line data={chartData} options={chartOptions} height={90} />

                {/* 🔹 شريط النسبة المتحرك */}
                {stats.dailyBookings && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      🔸 نسبة الحجوزات خلال الأسبوع الأخير:
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        height: 22,
                        borderRadius: 12,
                        overflow: "hidden",
                        backgroundColor: "#eee",
                        boxShadow: "inset 0 2px 5px rgba(0,0,0,0.15)",
                      }}
                    >
                      <Box
                        sx={{
                          width: `${activePercentAnim}%`,
                          background: "linear-gradient(90deg, #2196f3, #42a5f5)",
                          height: "100%",
                          transition: "width 0.3s ease",
                        }}
                      />
                      <Box
                        sx={{
                          width: `${cancelledPercentAnim}%`,
                          background: "linear-gradient(90deg, #ffb74d, #ff9800)",
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
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        ✅ نشطة: {activePercentAnim.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ❌ ملغاة: {cancelledPercentAnim.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Paper>
            </Box>
          )}
        </>
      ) : (
        <Typography sx={{ mt: 3 }}>لا توجد بيانات متاحة حالياً.</Typography>
      )}
    </Box>
  );
}
