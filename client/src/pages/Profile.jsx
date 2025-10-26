import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Grid,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Api } from "../api/Api";
import { toast } from "react-toastify";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newWeight, setNewWeight] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // 📦 تحميل بيانات المستخدم
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await Api.get("/users/me");
      setUser(data);
    } catch (err) {
      toast.error("حدث خطأ أثناء تحميل الملف الشخصي");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // 💾 إضافة وزن جديد
  const handleAddWeight = async () => {
    if (!newWeight) return toast.warning("الرجاء إدخال الوزن الجديد");
    setSaving(true);
    try {
      await Api.post("/users/me/weight", { weight: parseFloat(newWeight), note });
      toast.success("تم حفظ الوزن بنجاح ✅");
      setNewWeight("");
      setNote("");
      fetchProfile();
    } catch {
      toast.error("فشل حفظ الوزن");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={10}>
        <CircularProgress />
      </Box>
    );
  }

  // 🧮 بيانات الرسم البياني
  const weightHistory = user?.weightHistory || [];
  const chartData = {
    labels: weightHistory.map((w) => new Date(w.date).toLocaleDateString("ar-EG")),
    datasets: [
      {
        label: "الوزن (كغ)",
        data: weightHistory.map((w) => w.weight),
        fill: false,
        borderColor: "#1976d2",
        backgroundColor: "#1976d2",
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true, position: "top" },
    },
    scales: {
      y: { beginAtZero: false, grid: { color: "#eee" } },
      x: { grid: { color: "#eee" } },
    },
  };

  return (
    <Box
      dir="rtl"
      sx={{
        p: 3,
        maxWidth: 900,
        mx: "auto",
        fontFamily: "Tajawal, Cairo, sans-serif",
      }}
    >
      {/* 🔹 القسم العلوي */}
      <Paper
        sx={{
          p: 3,
          display: "flex",
          alignItems: "center",
          mb: 3,
          flexDirection: "row-reverse",
        }}
      >
        <Avatar sx={{ width: 80, height: 80, ml: 2 }} src={user?.avatar || ""}>
          {user?.username?.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="h6">{user?.username}</Typography>
          <Typography color="text.secondary">{user?.email}</Typography>
          <Typography color="text.secondary">{user?.phone}</Typography>
        </Box>
      </Paper>

      {/* 🔹 الإحصائيات */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="subtitle2" color="text.secondary">
              الوزن الحالي
            </Typography>
            <Typography variant="h6">{user?.weight || "-"}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="subtitle2" color="text.secondary">
              الطول
            </Typography>
            <Typography variant="h6">{user?.height || "-"}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="subtitle2" color="text.secondary">
              الحصص المنجزة
            </Typography>
            <Typography variant="h6">{user?.stats?.totalBookings || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="subtitle2" color="text.secondary">
              الاشتراك
            </Typography>
            <Typography
              variant="h6"
              color={user?.subscription?.active ? "green" : "red"}
            >
              {user?.subscription?.active ? "نشط ✅" : "منتهي ❌"}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* 🔹 الرسم البياني */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2}>
          تطور الوزن 📊
        </Typography>
        {weightHistory.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <Typography color="text.secondary">لا توجد بيانات وزن بعد</Typography>
        )}
      </Paper>

      {/* 🔹 إضافة وزن جديد */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" mb={2}>
          إضافة وزن جديد ⚖️
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="الوزن (كغ)"
              type="number"
              fullWidth
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="ملاحظة (اختياري)"
              fullWidth
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled={saving}
              onClick={handleAddWeight}
            >
              {saving ? <CircularProgress size={24} /> : "حفظ"}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
