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
import { useTranslation } from "react-i18next";
import useServerError from "../hooks/useServerError";
import { transferFcmToThisDevice } from "../firebase/registerFcmToken";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

export default function Profile() {
  const handleServerError = useServerError();
  const { t, i18n } = useTranslation();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newWeight, setNewWeight] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const { mode } = useThemeMode();
  const isDark = mode === "dark";

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await Api.get("/users/me");
      setUser(data);
    } catch (err) {
      handleServerError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleAddWeight = async () => {
    if (!newWeight) return toast.warning(t("profile.errors.weightRequired"));

    setSaving(true);
    try {
      await Api.post("/users/me/weight", {
        weight: parseFloat(newWeight),
        note,
      });
      toast.success(t("profile.messages.weightSaved"));
      setNewWeight("");
      setNote("");
      fetchProfile();
    } catch (err) {
      handleServerError(err);
    } finally {
      setSaving(false);
    }
  };

  // ===============================
  // ▶ BMI CALCULATIONS
  // ===============================
  const heightM = user?.height ? user.height / 100 : 0;
  const bmi =
    user?.weight && heightM
      ? (user.weight / (heightM * heightM)).toFixed(1)
      : null;

  let bmiStatus = "";
  let bmiColor = "";

  if (bmi) {
    if (bmi < 18.5) {
      bmiStatus = t("profile.bmi.underweight");
      bmiColor = "#3b82f6"; // blue
    } else if (bmi < 25) {
      bmiStatus = t("profile.bmi.normal");
      bmiColor = "#22c55e"; // green
    } else if (bmi < 30) {
      bmiStatus = t("profile.bmi.overweight");
      bmiColor = "#eab308"; // yellow
    } else {
      bmiStatus = t("profile.bmi.obese");
      bmiColor = "#ef4444"; // red
    }
  }

  const idealMin = user?.height ? (18.5 * heightM * heightM).toFixed(1) : null;
  const idealMax = user?.height ? (24.9 * heightM * heightM).toFixed(1) : null;

  // ===============================
  // ▶ CHART DATA
  // ===============================
  const weightHistory = user?.weightHistory || [];

  const chartData = {
    labels: weightHistory.map((w) =>
      new Date(w.date).toLocaleDateString(
        i18n.language === "ar"
          ? "ar-EG"
          : i18n.language === "he"
          ? "he-IL"
          : "en-US",
        { month: "short", day: "numeric" }
      )
    ),
    datasets: [
      {
        label: t("profile.chart.label"),
        data: weightHistory.map((w) => w.weight),
        fill: true,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(
            0,
            isDark ? "rgba(168,85,247,0.3)" : "rgba(99,102,241,0.3)"
          );
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

  const textMain = isDark ? "#FFF" : "#111827";
  const textSub = isDark ? "#AAA" : "#6b7280";
  const cardBg = isDark ? "#232334" : "#FFFFFF";

  // ===============================
  // ▶ PAGE LAYOUT
  // ===============================
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "nearest",
      intersect: true,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          // العنوان (التاريخ)
          title: (items) => {
            const index = items[0].dataIndex;
            const w = weightHistory[index];
            return new Date(w.date).toLocaleDateString(
              i18n.language === "ar"
                ? "ar-EG"
                : i18n.language === "he"
                ? "he-IL"
                : "en-US",
              {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            );
          },

          // السطر الرئيسي (الوزن)
          label: (item) => {
            const w = weightHistory[item.dataIndex];
            return `${t("profile.chart.weight")}: ${w.weight} ${t(
              "profile.units.kg"
            )}`;
          },

          // سطر إضافي: السبب / الملاحظة
          afterLabel: (item) => {
            const w = weightHistory[item.dataIndex];
            return w.note
              ? `${t("profile.chart.note")}: ${w.note}`
              : t("profile.chart.noNote");
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: isDark ? "#ccc" : "#444",
        },
      },
      y: {
        ticks: {
          color: isDark ? "#ccc" : "#444",
        },
      },
    },
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isDark
          ? "linear-gradient(135deg, #1E1E2F 0%, #2B1D3A 50%, #201C29 100%)"
          : "linear-gradient(135deg, #e0e7ff 0%, #ffffff 50%, #fae8ff 100%)",
        dir: i18n.language === "ar" ? "rtl" : "ltr",
      }}
    >
      <div
        style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 16px" }}
      >
        {/* ===============================
            HEADER
        =============================== */}
        <div
          style={{
            padding: "40px 24px",
            borderRadius: "24px",
            background: isDark
              ? "linear-gradient(135deg, #312E81 0%, #5B21B6 50%, #831843 100%)"
              : "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
            textAlign: "center",
            color: "#fff",
            marginBottom: "32px",
          }}
        >
          <h1 style={{ fontSize: "34px", marginBottom: "8px" }}>
            {user?.username || t("profile.labels.user")}
          </h1>
          <p>{user?.email}</p>
        </div>

        {/* ===============================
            BMI SECTION (OPTION 4)
        =============================== */}
        {bmi && (
          <div
            style={{
              background: cardBg,
              borderRadius: "24px",
              padding: "28px",
              marginBottom: "32px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ marginBottom: "16px", color: textMain }}>
              {t("profile.bmi.title")}
            </h2>

            <div
              style={{
                padding: "20px",
                borderRadius: "16px",
                background: bmiColor + "22",
                border: `2px solid ${bmiColor}`,
                textAlign: "center",
                marginBottom: "16px",
              }}
            >
              <h1 style={{ fontSize: "48px", margin: 0, color: bmiColor }}>
                {bmi}
              </h1>
              <p
                style={{ fontSize: "20px", color: bmiColor, fontWeight: "600" }}
              >
                {bmiStatus}
              </p>
            </div>

            <p style={{ color: textSub }}>
              {t("profile.bmi.healthyRange")}: <strong>18.5 – 24.9</strong>
            </p>

            {idealMin && idealMax && (
              <p style={{ color: textSub }}>
                {t("profile.bmi.idealWeight")}:{" "}
                <strong>
                  {idealMin}–{idealMax} {t("profile.units.kg")}
                </strong>
              </p>
            )}
          </div>
        )}

        {/* ===============================
            OTHER STATS (GRID)
        =============================== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          {/* وزن / طول / اشتراك ... */}
          {[
            {
              icon: "⚖️",
              label: t("profile.stats.currentWeight"),
              value: user?.weight
                ? `${user.weight} ${t("profile.units.kg")}`
                : "-",
            },
            {
              icon: "📏",
              label: t("profile.stats.height"),
              value: user?.height
                ? `${user.height} ${t("profile.units.cm")}`
                : "-",
            },
            {
              icon: "🏋️",
              label: t("profile.stats.completed"),
              value: user?.stats?.completedBookings || 0,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: cardBg,
                padding: "20px",
                borderRadius: "16px",
                textAlign: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ fontSize: "28px" }}>{stat.icon}</div>
              <p style={{ color: textSub }}>{stat.label}</p>
              <h3 style={{ color: textMain }}>{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* ===============================
    TRANSFER NOTIFICATIONS
=============================== */}

        {!user?.notificationsOwned && (
          <div
            style={{
              background: cardBg,
              borderRadius: "20px",
              padding: "20px",
              marginBottom: "32px",
              border: isDark
                ? "1px solid rgba(255,255,255,0.08)"
                : "1px solid rgba(0,0,0,0.05)",
              textAlign: "center",
            }}
          >
            <h3 style={{ color: textMain, marginBottom: "8px" }}>
              🔔 {t("profile.notifications.title")}
            </h3>

            <p
              style={{ color: textSub, fontSize: "14px", marginBottom: "16px" }}
            >
              {t("profile.notifications.description")}
            </p>

            <button
              disabled={transferring}
              onClick={async () => {
                if (!window.confirm(t("profile.notifications.confirmTransfer")))
                  return;

                setTransferring(true);
                try {
                  await transferFcmToThisDevice();
                  await fetchProfile(); // 🔄 تحديث البيانات
                  toast.success(t("profile.notifications.transferredSuccess"));
                } catch {
                  toast.error(t("profile.notifications.transferFailed"));
                } finally {
                  setTransferring(false);
                }
              }}
            >
              {transferring
                ? t("profile.notifications.transferring")
                : `🔁 ${t("profile.notifications.transferButton")}`}
            </button>
          </div>
        )}
        {/* ===============================
            CHART
        =============================== */}
        <div
          style={{
            background: cardBg,
            borderRadius: "24px",
            padding: "24px",
            marginBottom: "32px",
          }}
        >
          <h2>{t("profile.sections.weightProgress")}</h2>

          {weightHistory.length > 0 ? (
            <div
              style={{
                width: "100%",
                height: window.innerWidth < 600 ? "280px" : "480px", // ← هنا السحر
                position: "relative",
              }}
            >
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <p
              style={{ textAlign: "center", color: textSub, padding: "64px 0" }}
            >
              {t("profile.messages.noWeightData")}
            </p>
          )}
        </div>

        {/* ===============================
            ADD WEIGHT
        =============================== */}
        <div
          style={{
            background: cardBg,
            borderRadius: "24px",
            padding: "24px",
            marginBottom: "64px",
          }}
        >
          <h2>{t("profile.sections.addWeight")}</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddWeight();
            }}
          >
            <input
              type="number"
              step="0.1"
              placeholder={t("profile.fields.weightPlaceholder")}
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              style={{
                width: "100%",
                height: "48px",
                padding: "0 16px",
                marginBottom: "16px",
              }}
            />

            <textarea
              placeholder={t("profile.fields.notePlaceholder")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: "100%",
                height: "48px",
                padding: "12px 16px",
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
                borderRadius: "8px",
                fontWeight: "600",
                opacity: saving || !newWeight ? 0.6 : 1,
              }}
            >
              {saving ? t("profile.buttons.saving") : t("profile.buttons.save")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
