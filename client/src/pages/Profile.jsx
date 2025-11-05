// client/src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Api } from "../api/Api";
import { toast } from "react-toastify";
import { useThemeMode } from "../context/ThemeContext";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newWeight, setNewWeight] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const { mode } = useThemeMode();
  const isDark = mode === "dark";

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await Api.get("/users/me");
      setUser(data);
    } catch {
      toast.error("حدث خطأ أثناء تحميل الملف الشخصي");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleAddWeight = async () => {
    if (!newWeight) return toast.warning("الرجاء إدخال الوزن الجديد");
    setSaving(true);
    try {
      await Api.post("/users/me/weight", {
        weight: parseFloat(newWeight),
        note,
      });
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
      <div
        style={{
          minHeight: "100vh",
          background: isDark
            ? "linear-gradient(135deg, #1E1E2F 0%, #2B1D3A 50%, #201C29 100%)"
            : "linear-gradient(135deg, #e0e7ff 0%, #ffffff 50%, #fae8ff 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            border: "4px solid #e5e7eb",
            borderTopColor: "#a855f7",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isSubscriptionActive = user?.role === "admin" || user?.subscription?.active !== false;
  const weightHistory = user?.weightHistory || [];

  const chartData = {
    labels: weightHistory.map((w) =>
      new Date(w.date).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })
    ),
    datasets: [
      {
        label: "الوزن (كغ)",
        data: weightHistory.map((w) => w.weight),
        fill: true,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, isDark ? "rgba(168,85,247,0.3)" : "rgba(99,102,241,0.3)");
          gradient.addColorStop(1, "rgba(0,0,0,0)");
          return gradient;
        },
        borderColor: isDark ? "#C084FC" : "#6366f1",
        borderWidth: 3,
        pointBackgroundColor: isDark ? "#C084FC" : "#6366f1",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        align: "end",
        labels: {
          font: { size: 12, family: "Tajawal, Cairo, sans-serif" },
          color: isDark ? "#E5E7EB" : "#6b7280",
        },
      },
      tooltip: {
        backgroundColor: isDark ? "rgba(40,40,60,0.95)" : "rgba(255,255,255,0.95)",
        titleColor: isDark ? "#fff" : "#111827",
        bodyColor: isDark ? "#C084FC" : "#6366f1",
        borderColor: isDark ? "#444" : "#e5e7eb",
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => `${context.parsed.y} كجم`,
        },
      },
    },
    scales: {
      y: {
        grid: { color: isDark ? "#333" : "#f3f4f6" },
        ticks: { color: isDark ? "#BBB" : "#6b7280" },
      },
      x: {
        grid: { color: isDark ? "#333" : "#f3f4f6" },
        ticks: { color: isDark ? "#BBB" : "#6b7280" },
      },
    },
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const cardBg = isDark ? "#2B2B3D" : "#FFFFFF";
  const cardShadow = isDark
    ? "0 8px 24px rgba(0,0,0,0.4)"
    : "0 4px 6px -1px rgba(0,0,0,0.1)";
  const textMain = isDark ? "#FFF" : "#111827";
  const textSub = isDark ? "#AAA" : "#6b7280";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isDark
          ? "linear-gradient(135deg, #1E1E2F 0%, #2B1D3A 50%, #201C29 100%)"
          : "linear-gradient(135deg, #e0e7ff 0%, #ffffff 50%, #fae8ff 100%)",
        fontFamily: "Tajawal, Cairo, sans-serif",
        color: textMain,
        transition: "background 0.5s ease, color 0.3s ease",
      }}
      dir="rtl"
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 16px" }}>
        {/* رأس الصفحة */}
        <div
          style={{
            borderRadius: "24px",
            boxShadow: cardShadow,
            background: isDark
              ? "linear-gradient(135deg, #312E81 0%, #5B21B6 50%, #831843 100%)"
              : "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
            marginBottom: "32px",
            padding: "48px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.08,
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <h1
              style={{
                fontSize: "36px",
                fontWeight: "bold",
                color: "#fff",
                marginBottom: "8px",
              }}
            >
              {user?.username || "مستخدم"}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.9)" }}>
              👤 {user?.role === "admin" ? "مدير" : "عضو"} • {user?.email}
            </p>
          </div>
        </div>

        {/* الإحصائيات */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: window.innerWidth < 768 ? "repeat(2,1fr)" : "repeat(4,1fr)",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          {[
            {
              icon: "⚖️",
              label: "الوزن الحالي",
              value: user?.weight ? `${user.weight} كجم` : "-",
            },
            {
              icon: "📏",
              label: "الطول",
              value: user?.height ? `${user.height} سم` : "-",
            },
            {
              icon: "🏋️",
              label: "الحصص المنجزة",
              value: user?.stats?.completedBookings || 0,
            },
            {
              icon: isSubscriptionActive ? "✅" : "❌",
              label: "الاشتراك",
              value: isSubscriptionActive ? "نشط" : "منتهي",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: cardBg,
                borderRadius: "16px",
                boxShadow: cardShadow,
                padding: "24px",
                textAlign: "center",
                transition: "transform 0.3s, box-shadow 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>{stat.icon}</div>
              <p style={{ fontSize: "13px", color: textSub }}>{stat.label}</p>
              <p style={{ fontSize: "22px", fontWeight: "bold" }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* الرسم البياني */}
        <div
          style={{
            background: cardBg,
            borderRadius: "24px",
            boxShadow: cardShadow,
            padding: "24px",
            marginBottom: "32px",
          }}
        >
          <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>📊 تطور الوزن</h2>
          {weightHistory.length > 0 ? (
            <div style={{ height: "400px" }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <p style={{ textAlign: "center", color: textSub, padding: "64px 0" }}>
              لا توجد بيانات وزن بعد
            </p>
          )}
        </div>

        {/* إضافة وزن جديد */}
        <div
          style={{
            background: cardBg,
            borderRadius: "24px",
            boxShadow: cardShadow,
            padding: "24px",
          }}
        >
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>⚖️ إضافة قياس جديد</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddWeight();
            }}
          >
            <input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="مثال: 75.5"
              style={{
                width: "100%",
                height: "48px",
                fontSize: "18px",
                border: "1px solid",
                borderColor: isDark ? "#444" : "#e5e7eb",
                borderRadius: "8px",
                padding: "0 16px",
                background: isDark ? "#1E1E2E" : "#fff",
                color: textMain,
                marginBottom: "16px",
                outline: "none",
              }}
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ملاحظة (اختياري)"
              style={{
                width: "100%",
                height: "48px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: isDark ? "#444" : "#e5e7eb",
                padding: "12px 16px",
                background: isDark ? "#1E1E2E" : "#fff",
                color: textMain,
                resize: "none",
              }}
            />
            <button
              type="submit"
              disabled={saving || !newWeight}
              style={{
                width: "100%",
                height: "48px",
                marginTop: "16px",
                background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
                color: "#fff",
                fontWeight: "600",
                border: "none",
                borderRadius: "8px",
                cursor: saving || !newWeight ? "not-allowed" : "pointer",
                opacity: saving || !newWeight ? 0.5 : 1,
                transition: "all 0.3s",
              }}
            >
              {saving ? "⏳ جاري الحفظ..." : "➕ حفظ القياس"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
