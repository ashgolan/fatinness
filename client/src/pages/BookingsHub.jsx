import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Api } from "../api/Api";
import { toast } from "react-toastify";
import { useThemeMode } from "../context/ThemeContext";

export default function BookingsHub() {
  const { mode, BRAND } = useThemeMode();

  // 📦 الحالة العامة
  const [activeTab, setActiveTab] = useState("available"); // available | mybookings
  const [loading, setLoading] = useState(true);
  const [animateIn, setAnimateIn] = useState(false);

  // 🗓️ الحجوزات المتاحة
  const [slotsByDay, setSlotsByDay] = useState({});
  const [myBookings, setMyBookings] = useState([]);
  const [bookingId, setBookingId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState("month");
  const [hoveredDay, setHoveredDay] = useState(null); // (غير مستخدم الآن لكن لا يضر)

  // 📋 حجوزاتي
  const [allBookings, setAllBookings] = useState([]);
  const [bookingsFilter, setBookingsFilter] = useState("upcoming");
  const [refreshing, setRefreshing] = useState(false);

  const dayNames = [
    "الأحد",
    "الاثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ];

  const toLocalKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  // 🎯 تحميل البيانات
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [slotsRes, bookingsRes] = await Promise.all([
        Api.get("/slots/upcoming"),
        Api.get("/bookings/me"),
      ]);

      const grouped = slotsRes.data?.slots || {};
      const now = new Date();
      const filtered = {};

      Object.keys(grouped).forEach((dateKey) => {
        const validSlots = grouped[dateKey].filter((slot) => {
          const slotEnd = new Date(slot.date);
          const [h, m] = slot.endTime.split(":");
          slotEnd.setHours(h, m, 0, 0);
          return slotEnd > now;
        });
        if (validSlots.length > 0) filtered[dateKey] = validSlots;
      });

      setSlotsByDay(filtered);
      const myActive = bookingsRes.data
        .filter((b) => b.status === "booked")
        .map((b) => b.slot._id);
      setMyBookings(myActive);
      setAllBookings(bookingsRes.data);
    } catch {
      toast.error("فشل تحميل البيانات");
    } finally {
      setLoading(false);
      setTimeout(() => setAnimateIn(true), 150);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 🧩 دوال الحجز والإلغاء
  const handleBook = useCallback(
    async (slotId) => {
      setBookingId(slotId);
      try {
        await Api.post("/bookings", { slotId });
        toast.success("تم الحجز بنجاح ✅");
        await fetchData();
      } catch (err) {
        toast.error(err?.response?.data?.message || "فشل الحجز");
      } finally {
        setBookingId(null);
      }
    },
    [fetchData]
  );

  const handleCancel = useCallback(
    async (slotId, fromMyBookings = false, bookingIdDirect = null) => {
      setBookingId(slotId);
      setRefreshing(true);
      try {
        let bookingId = bookingIdDirect;
        if (!bookingId) {
          const { data } = await Api.get("/bookings/me");
          const booking = data.find(
            (b) => b.slot._id === slotId && b.status === "booked"
          );
          if (!booking) {
            toast.error("لم يتم العثور على الحجز لإلغائه");
            return;
          }
          bookingId = booking._id;
        }

        if (
          !fromMyBookings &&
          !window.confirm("هل أنتِ متأكدة من إلغاء هذا الحجز؟")
        ) {
          return;
        }

        await Api.delete(`/bookings/${bookingId}`);
        toast.success("تم الإلغاء ❌");
        await fetchData();
      } catch (err) {
        toast.error(err?.response?.data?.message || "تعذر الإلغاء");
      } finally {
        setBookingId(null);
        setRefreshing(false);
      }
    },
    [fetchData]
  );

  const handleRebook = async (slotId) => {
    try {
      await Api.post("/bookings", { slotId });
      toast.success("تمت إعادة الحجز بنجاح 🔁");
      await fetchData();
    } catch {
      toast.error("فشل إعادة الحجز");
    }
  };

  // 🧮 تصنيفات الحجوزات
  const now = new Date();
  const upcomingBookings = allBookings.filter(
    (b) =>
      new Date(b.slot.date) >= now && b.status === "booked" && !b.slot.isBlocked
  );
  const pastBookings = allBookings.filter(
    (b) =>
      new Date(b.slot.date) < now &&
      b.status !== "cancelled" &&
      !b.slot.isBlocked
  );
  const cancelledBookings = allBookings.filter(
    (b) => b.status === "cancelled" || b.slot.isBlocked
  );

  const filteredBookings = useMemo(() => {
    if (bookingsFilter === "upcoming") return upcomingBookings;
    if (bookingsFilter === "past") return pastBookings;
    return cancelledBookings;
  }, [bookingsFilter, upcomingBookings, pastBookings, cancelledBookings]);

  // 🗓️ حساب التواريخ
  const today = new Date();
  const todayKey = toLocalKey(today);
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthDates = Array.from(
    { length: daysInMonth },
    (_, i) => new Date(year, month, i + 1)
  );
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });
  const gridDates = view === "week" ? weekDates : monthDates;

  const baseCard = (color) => ({
    borderRadius: 20,
    border: `1.6px solid ${color}55`,
    backdropFilter: "blur(6px)",
    background:
      mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)",
    boxShadow: `0 4px 14px ${color}22`,
    transition: "all 0.3s ease",
  });

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding: "20px",
        background:
          mode === "dark"
            ? `linear-gradient(135deg, ${BRAND.bgDarkTop}, ${BRAND.bgDarkBottom})`
            : "linear-gradient(135deg, #f8f9ff, #fff8f4)",
        color: mode === "dark" ? "#f3f3f3" : "#111",
        fontFamily: "Tajawal, Cairo, sans-serif",
        transition: "all 0.4s ease",
      }}
    >
      {/* keyframes للأنيميشن المستخدمة */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(25px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* 🧮 شريط الإحصاءات */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 16,
          margin: "10px auto 24px",
          maxWidth: "800px",
        }}
      >
        {[
          {
            label: "القادمة",
            count: upcomingBookings.length,
            color: BRAND.purple,
          },
          { label: "المنتهية", count: pastBookings.length, color: "#10b981" },
          {
            label: "الملغاة",
            count: cancelledBookings.length,
            color: "#ef4444",
          },
        ].map((s, i) => (
          <div key={i} style={baseCard(s.color)}>
            <div
              style={{
                padding: "10px 18px",
                minWidth: 100,
                textAlign: "center",
                color: s.color,
                fontWeight: 700,
              }}
            >
              {s.label}: {s.count}
            </div>
          </div>
        ))}
      </div>

      {/* 🔘 التبويبات */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 32,
        }}
      >
        {[
          { value: "available", label: "🗓️ الحجوزات المتاحة" },
          { value: "mybookings", label: "📋 حجوزاتي" },
        ].map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              style={{
                padding: "12px 26px",
                borderRadius: 40,
                border: isActive ? "none" : `1.5px solid ${BRAND.purple}33`,
                background: isActive
                  ? `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.gold})`
                  : "transparent",
                color: isActive ? "#fff" : BRAND.purple,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: isActive ? `0 4px 14px ${BRAND.purple}55` : "none",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 🔄 التحميل */}
      {loading ? (
        <div style={{ textAlign: "center", marginTop: 100 }}>
          <div
            style={{
              width: 60,
              height: 60,
              margin: "auto",
              border: "4px solid transparent",
              borderTopColor: BRAND.purple,
              borderRightColor: BRAND.gold,
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <p style={{ color: "#999", marginTop: 20 }}>جاري تحميل البيانات...</p>
        </div>
      ) : (
        <>
          {activeTab === "available" && (
            <AvailableView
              {...{
                mode,
                BRAND,
                animateIn,
                gridDates,
                todayKey,
                dayNames,
                selectedDate,
                setSelectedDate,
                view,
                setView,
                slotsByDay,
                myBookings,
                handleBook,
                handleCancel,
                bookingId,
                toLocalKey,
              }}
            />
          )}
          {activeTab === "mybookings" && (
            <MyBookingsView
              {...{
                mode,
                BRAND,
                animateIn,
                filteredBookings,
                bookingsFilter,
                setBookingsFilter,
                refreshing,
                handleCancel,
                handleRebook,
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

// 🟣 الحجوزات المتاحة
function AvailableView({
  mode,
  BRAND,
  animateIn,
  gridDates,
  todayKey,
  dayNames,
  selectedDate,
  setSelectedDate,
  view,
  setView,
  slotsByDay,
  myBookings,
  handleBook,
  handleCancel,
  bookingId,
  toLocalKey,
}) {
  return (
    <div style={{ animation: "fadeInUp 0.5s ease forwards" }}>
      {/* 🔘 أزرار التبديل بين الأسبوع والشهر */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 24,
          display: "flex",
          justifyContent: "center",
          gap: 10,
        }}
      >
        {[
          { value: "week", label: "📅 الأسبوع" },
          { value: "month", label: "🗓️ الشهر الكامل" },
        ].map((btn) => (
          <button
            key={btn.value}
            onClick={() => {
              setView(btn.value);
              setSelectedDate(null);
            }}
            style={{
              padding: "10px 22px",
              borderRadius: 30,
              border:
                view === btn.value ? "none" : `1.5px solid ${BRAND.purple}44`,
              background:
                view === btn.value
                  ? `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.gold})`
                  : "transparent",
              color: view === btn.value ? "#fff" : BRAND.purple,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* 🗓️ شبكة الأيام */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(75px, 1fr))",
          gap: 12,
          maxWidth: 900,
          margin: "0 auto 32px",
        }}
      >
        {gridDates.map((d) => {
          const key = toLocalKey(d);
          const isToday = key === todayKey;
          const isAvailable = !!slotsByDay[key];
          const isSelected = selectedDate === key;
          const slotsCount = slotsByDay[key]?.length || 0;
          const hasMyBooking = slotsByDay[key]?.some((s) =>
            myBookings.includes(s._id)
          );

          return (
            <div
              key={key}
              onClick={() =>
                isAvailable && setSelectedDate(isSelected ? null : key)
              }
              style={{
                aspectRatio: "1",
                borderRadius: 18,
                border: `2px solid ${
                  isSelected
                    ? BRAND.gold
                    : isAvailable
                    ? `${BRAND.purple}CC`
                    : mode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : "#ddd"
                }`,
                background:
                  mode === "dark"
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(255,255,255,0.8)",
                color: isAvailable ? BRAND.purple : "#999",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                cursor: isAvailable ? "pointer" : "default",
                boxShadow: isSelected
                  ? `0 0 14px ${BRAND.gold}88`
                  : isAvailable
                  ? `0 0 10px ${BRAND.purple}55`
                  : mode === "dark"
                  ? "0 0 6px rgba(255,255,255,0.06)"
                  : "0 0 4px rgba(0,0,0,0.05)",
                transition: "all 0.25s ease",
                position: "relative",
              }}
            >
              {/* 🔹 رقم اليوم */}
              {/* 🔹 اليوم أعلى المربع */}
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: mode === "dark" ? "#ccc" : "#333",
                  marginBottom: 4,
                }}
              >
                {dayNames[d.getDay()]} {/* يعرض مثل: الأحد */}
              </div>

              {/* 🔹 التاريخ بصيغة رقم/شهر */}
              <strong
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: isAvailable ? BRAND.purple : "#999",
                }}
              >
                {`${d.getDate()}/${d.getMonth() + 1}`}
              </strong>

              {/* 🔹 عدد الحصص أسفل التاريخ */}
              {isAvailable && (
                <span
                  style={{
                    fontSize: 12,
                    opacity: 0.8,
                    marginTop: 2,
                    color: mode === "dark" ? "#ddd" : "#555",
                    fontWeight: 600,
                  }}
                >
                  {slotsCount} حصة
                </span>
              )}

              {/* 🔴 نقطة اليوم الحالي */}
              {isToday && (
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#ef4444",
                    marginTop: 3,
                  }}
                />
              )}

              {/* ✅ رمز الحجز في الزاوية اليمنى العليا */}
              {hasMyBooking && (
                <div
                  style={{
                    position: "absolute",
                    top: 5,
                    right: 5,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, #10b981, #059669)`,
                    color: "white",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 6px rgba(16,185,129,0.6)",
                  }}
                >
                  ✓
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 💜 المواعيد عند تحديد يوم */}
      {selectedDate && slotsByDay[selectedDate] && (
        <div
          style={{
            opacity: animateIn ? 1 : 0,
            transform: animateIn ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.5s ease 0.3s",
          }}
        >
          <div
            style={{
              background: mode === "dark" ? "rgba(255,255,255,0.05)" : "white",
              borderRadius: "20px",
              padding: "20px",
              marginBottom: 24,
              boxShadow:
                mode === "dark"
                  ? "0 8px 24px rgba(0,0,0,0.3)"
                  : "0 8px 24px rgba(0,0,0,0.08)",
              border:
                mode === "dark" ? "1px solid rgba(255,255,255,0.1)" : "none",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                color: BRAND.purple,
                fontWeight: 800,
                fontSize: "clamp(18px, 4vw, 22px)",
              }}
            >
              {dayNames[new Date(selectedDate).getDay()]} - {selectedDate}
            </h3>
          </div>

          {/* 🕓 بطاقات المواعيد */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                window.innerWidth < 768
                  ? "1fr"
                  : "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
              maxWidth: "1000px",
              margin: "0 auto",
            }}
          >
            {slotsByDay[selectedDate].map((slot, idx) => {
              const isBooked = myBookings.includes(slot._id);
              const isFull = slot.bookedCount >= slot.capacity;
              const isProcessing = bookingId === slot._id;

              return (
                <div
                  key={slot._id}
                  style={{
                    background:
                      mode === "dark"
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(255,255,255,0.95)",
                    borderRadius: 18,
                    padding: 16,
                    border: isBooked
                      ? "2px solid #10b981"
                      : isFull
                      ? `2px solid ${mode === "dark" ? "#444" : "#ddd"}`
                      : `2px solid ${BRAND.purple}`,
                    boxShadow: isBooked
                      ? "0 8px 24px rgba(16,185,129,0.25)"
                      : `0 4px 16px ${BRAND.purple}22`,
                    transition: "all 0.3s ease",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "16px",
                      marginBottom: 8,
                    }}
                  >
                    🕒 {slot.startTime} - {slot.endTime}
                  </div>

                  <div
                    style={{
                      color: isFull ? "#ef4444" : "#10b981",
                      fontWeight: 600,
                      marginBottom: 12,
                    }}
                  >
                    المقاعد: {slot.bookedCount}/{slot.capacity}
                  </div>

                  <button
                    onClick={() =>
                      isBooked ? handleCancel(slot._id) : handleBook(slot._id)
                    }
                    disabled={isProcessing || (isFull && !isBooked)}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      borderRadius: 12,
                      border: "none",
                      fontWeight: 700,
                      fontSize: 15,
                      color: "#fff",
                      background: isProcessing
                        ? "#999"
                        : isFull && !isBooked
                        ? "#999"
                        : isBooked
                        ? "linear-gradient(135deg, #10b981, #059669)"
                        : `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.gold})`,
                      cursor:
                        isProcessing || (isFull && !isBooked)
                          ? "not-allowed"
                          : "pointer",
                      boxShadow: isBooked
                        ? "0 6px 16px rgba(16,185,129,0.4)"
                        : `0 6px 16px ${BRAND.purple}44`,
                      transition: "all 0.3s ease",
                    }}
                  >
                    {isProcessing
                      ? "⏳ جاري التنفيذ..."
                      : isBooked
                      ? "✅ محجوز - اضغطي للإلغاء"
                      : isFull
                      ? "🔒 ممتلئة"
                      : "🎯 احجزي الآن"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// 🟡 حجوزاتي
function MyBookingsView({
  mode,
  BRAND,
  animateIn,
  filteredBookings,
  bookingsFilter,
  setBookingsFilter,
  refreshing,
  handleCancel,
  handleRebook,
}) {
  const now = new Date();

  return (
    <div style={{ animation: "fadeInUp 0.5s ease forwards" }}>
      <div
        style={{
          textAlign: "center",
          marginBottom: 24,
          display: "flex",
          justifyContent: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        {[
          { value: "upcoming", label: "📆 القادمة" },
          { value: "past", label: "✅ السابقة" },
          { value: "cancelled", label: "❌ الملغاة" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setBookingsFilter(f.value)}
            style={{
              padding: "10px 22px",
              borderRadius: 30,
              border:
                bookingsFilter === f.value
                  ? "none"
                  : `1.5px solid ${BRAND.purple}33`,
              background:
                bookingsFilter === f.value
                  ? `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.gold})`
                  : "transparent",
              color: bookingsFilter === f.value ? "#fff" : BRAND.purple,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredBookings.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: 80, opacity: 0.7 }}>
          <p>لا توجد حجوزات في هذا القسم</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              window.innerWidth < 768 ? "1fr" : "repeat(2, 1fr)",
            gap: 16,
            maxWidth: 1000,
            margin: "auto",
          }}
        >
          {filteredBookings.map((b) => {
            const isCancelled = b.status === "cancelled" || b.slot.isBlocked;
            const isPast = new Date(b.slot.date) < now;

            return (
              <div
                key={b._id}
                style={{
                  borderRadius: 18,
                  border: `1.6px solid ${
                    isCancelled ? "#f44336" : isPast ? "#999" : BRAND.purple
                  }55`,
                  background:
                    mode === "dark"
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(255,255,255,0.9)",
                  boxShadow: `0 4px 14px ${BRAND.purple}22`,
                  padding: 16,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 8 }}>
                  📅 {new Date(b.slot.date).toLocaleDateString("ar-EG")}
                </div>
                <div style={{ opacity: 0.8, marginBottom: 12 }}>
                  🕒 {b.slot.startTime}
                </div>

                {/* زر الإلغاء */}
                {!isPast && !isCancelled && (
                  <button
                    onClick={() => handleCancel(b.slot._id, true, b._id)}
                    disabled={refreshing}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      borderRadius: 12,
                      background: `linear-gradient(135deg, #ef4444, #dc2626)`,
                      color: "#fff",
                      border: "none",
                      fontWeight: 700,
                      cursor: refreshing ? "not-allowed" : "pointer",
                      marginBottom: 8,
                    }}
                  >
                    🗑️ إلغاء الحجز
                  </button>
                )}

                {/* زر إعادة الحجز */}
                {isPast && !isCancelled && (
                  <button
                    onClick={() => handleRebook(b.slot._id)}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      borderRadius: 12,
                      border: `1.5px solid ${BRAND.purple}`,
                      background: "transparent",
                      color: BRAND.purple,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    🔁 إعادة الحجز
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
