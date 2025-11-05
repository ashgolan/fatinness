import React, { useEffect, useState } from "react";
import { Api } from "../api/Api";
import { toast } from "react-toastify";
import { useThemeMode } from "../context/ThemeContext";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CancelIcon from "@mui/icons-material/Cancel";

export default function MyBookings() {
  const { mode, BRAND } = useThemeMode();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("upcoming");

  // 🔹 جلب الحجوزات
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data } = await Api.get("/bookings/me");
      setBookings(data);
    } catch {
      toast.error("حدث خطأ أثناء جلب الحجوزات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // 🔹 إلغاء الحجز
  const handleCancel = async (id) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في إلغاء هذا الحجز؟")) return;
    setRefreshing(true);
    try {
      await Api.delete(`/bookings/${id}`);
      toast.success("تم إلغاء الحجز بنجاح ✅");
      fetchBookings();
    } catch (err) {
      toast.error(err?.response?.data?.message || "تعذر إلغاء الحجز");
    } finally {
      setRefreshing(false);
    }
  };

  // 🔹 تصنيف الحجوزات
  const now = new Date();
  const upcoming = bookings.filter(
    (b) =>
      new Date(b.slot.date) >= now && b.status === "booked" && !b.slot.isBlocked
  );
  const past = bookings.filter(
    (b) =>
      new Date(b.slot.date) < now &&
      b.status !== "cancelled" &&
      !b.slot.isBlocked
  );
  const cancelled = bookings.filter(
    (b) => b.status === "cancelled" || b.slot.isBlocked
  );

  const filteredBookings =
    filter === "upcoming" ? upcoming : filter === "past" ? past : cancelled;

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          mode === "dark"
            ? `linear-gradient(135deg, ${BRAND.bgDarkTop}, ${BRAND.bgDarkBottom})`
            : "linear-gradient(135deg, #fafaff, #fffdf9)",
        fontFamily: "Tajawal, Cairo, sans-serif",
        color: mode === "dark" ? "#f3f3f3" : "#111",
        padding: "20px",
        transition: "all 0.4s ease",
      }}
    >
      {/* 🔶 العنوان */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1
          style={{
            fontSize: "clamp(22px, 5vw, 30px)",
            fontWeight: "bold",
            background: mode === "dark"
              ? `linear-gradient(90deg, ${BRAND.gold}, ${BRAND.purple})`
              : `linear-gradient(90deg, ${BRAND.purple}, ${BRAND.gold})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          📅 حجوزاتي
        </h1>
        <p style={{ color: mode === "dark" ? "#aaa" : "#555", fontSize: "0.95rem" }}>
          استعرضي حجوزاتك القادمة، السابقة، أو الملغاة
        </p>
      </div>

      {/* 🔘 أزرار الفلترة */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "26px",
        }}
      >
        {[
          { value: "upcoming", label: "📆 القادمة" },
          { value: "past", label: "✅ السابقة" },
          { value: "cancelled", label: "❌ الملغاة" },
        ].map((btn) => (
          <button
            key={btn.value}
            onClick={() => setFilter(btn.value)}
            style={{
              padding: "10px 18px",
              borderRadius: "25px",
              border:
                filter === btn.value
                  ? "none"
                  : mode === "dark"
                  ? "1.5px solid #555"
                  : "1.5px solid #ddd",
              background:
                filter === btn.value
                  ? mode === "dark"
                    ? `linear-gradient(90deg, ${BRAND.gold}, ${BRAND.purple})`
                    : `linear-gradient(90deg, ${BRAND.purple}, ${BRAND.gold})`
                  : "transparent",
              color: filter === btn.value ? "#fff" : mode === "dark" ? "#ddd" : "#444",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s ease",
              minWidth: 120,
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* 🔄 تحميل */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
          <div
            style={{
              width: 50,
              height: 50,
              border: "4px solid #ddd",
              borderTopColor: BRAND.purple,
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filteredBookings.length === 0 ? (
        <p style={{ textAlign: "center", opacity: 0.7, marginTop: 40 }}>
          لا توجد حجوزات في هذا القسم.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              window.innerWidth < 768 ? "1fr" : "repeat(2, 1fr)",
            gap: 18,
          }}
        >
          {filteredBookings.map((b) => {
            const slotDate = new Date(b.slot.date);
            const date = slotDate.toLocaleDateString("ar-EG", {
              weekday: "long",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
            const time = b.slot.startTime;
            const isCancelled = b.status === "cancelled" || b.slot.isBlocked;
            const isPast = new Date(b.slot.date) < now && !isCancelled;

            // 🎨 الألوان حسب الحالة
            let borderColor = BRAND.purple;
            let glow = `${BRAND.purple}55`;
            if (isPast) {
              borderColor = "#9e9e9e";
              glow = "transparent";
            } else if (isCancelled) {
              borderColor = "#f44336";
              glow = "#f4433622";
            }

            return (
              <div
                key={b._id}
                style={{
                  border: `2.5px solid ${borderColor}`,
                  borderRadius: "20px",
                  padding: "18px",
                  background: mode === "dark"
                    ? BRAND.paperDark
                    : "#ffffffaa",
                  boxShadow: `0 0 8px ${glow}`,
                  transition: "all 0.3s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                      fontWeight: 700,
                      fontSize: "1rem",
                    }}
                  >
                    <EventAvailableIcon sx={{ color: BRAND.purple }} />
                    <span>{date}</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                      color: mode === "dark" ? "#ccc" : "#555",
                    }}
                  >
                    <AccessTimeIcon sx={{ color: BRAND.purple }} />
                    <span>الساعة: {time}</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 6,
                      fontWeight: 600,
                      fontSize: "0.95rem",
                    }}
                  >
                    {isCancelled ? (
                      <>
                        <CancelIcon sx={{ color: "#f44336" }} />
                        <span style={{ color: "#f44336" }}>ملغاة</span>
                      </>
                    ) : isPast ? (
                      <>
                        <DoneAllIcon sx={{ color: "#10b981" }} />
                        <span style={{ color: "#10b981" }}>منتهية</span>
                      </>
                    ) : (
                      <>
                        <DoneAllIcon sx={{ color: BRAND.purple }} />
                        <span style={{ color: BRAND.purple }}>محجوزة ✅</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 🔘 زر الإلغاء */}
                {!isPast && !isCancelled && (
                  <button
                    onClick={() => handleCancel(b._id)}
                    disabled={refreshing}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "12px",
                      border: `2px solid ${BRAND.gold}`,
                      background: "transparent",
                      color: BRAND.gold,
                      fontWeight: 700,
                      cursor: refreshing ? "not-allowed" : "pointer",
                      transition: "all 0.25s ease",
                    }}
                  >
                    {refreshing ? "..." : "إلغاء الحجز"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
