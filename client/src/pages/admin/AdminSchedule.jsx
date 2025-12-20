// client/src/pages/admin/AdminSchedule.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
  Stack,
} from "@mui/material";

import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SaveIcon from "@mui/icons-material/Save";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import { Api } from "../../api/Api";
import { toast } from "react-toastify";
import DaySection from "../../components/schedule/DaySection";
import { useThemeMode } from "../../context/ThemeContext";
import useServerError from "../../hooks/useServerError";
import { useTranslation } from "react-i18next";

// ===================== أدوات التاريخ =====================
function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmt(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function isPastDay(date) {
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

function isToday(date) {
  const d = new Date(date);
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

// 🔤 مفاتيح أيام الأسبوع من ملفات الترجمة
const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export default function AdminSchedule() {
  const handleServerError = useServerError();
  const [serverWeekStart, setServerWeekStart] = useState(null);
  const [serverNextWeekStart, setServerNextWeekStart] = useState(null);

  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const { t } = useTranslation();

  // ألوان وهوية فاخرة
  const BRAND = {
    purple: "#9B6FD6",
    pink: "#EC4899",
    gold: "#F59E0B",
  };

  // ===================== الحالة =====================
  const [tab, setTab] = useState(0);
  // const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const [weekData, setWeekData] = useState(null);
  const [nextWeekData, setNextWeekData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentEdits, setCurrentEdits] = useState({});
  const [nextWeek, setNextWeek] = useState([]);
  const [saving, setSaving] = useState(false);

  // ===================== جلب البيانات =====================
  const fetchCurrentWeek = async () => {
    setLoading(true);
    try {
      const { data } = await Api.get("/admin/slots/week");
      setWeekData(data);
      setServerWeekStart(new Date(data.weekStart));
    } catch (err) {
      handleServerError(err);
    } finally {
      setLoading(false);
    }
  };

const fetchNextWeek = async () => {
  try {
    const { data } = await Api.get("/admin/slots/week", {
      params: {
        start: fmt(addDays(serverWeekStart, 7)), // ✅ هذا الصحيح
      },
    });

    console.log("NEXT WEEK DATA:", data);

    setNextWeekData(data);
    setServerNextWeekStart(new Date(data.weekStart));
  } catch (err) {
    handleServerError(err);
  }
};


useEffect(() => {
  fetchCurrentWeek();

  setNextWeek(
    Array.from({ length: 7 }, (_, i) => ({
      dayOffset: i,
      items: [],
    }))
  );
}, []);
useEffect(() => {
  if (!serverWeekStart) return;
  fetchNextWeek();
}, [serverWeekStart]);


  const addSlot = (dayIndex) => {
    if (!serverWeekStart) return;

    const key = fmt(addDays(serverWeekStart, dayIndex));

    setCurrentEdits((prev) => ({
      ...prev,
      [key]: [
        ...(prev[key] || []),
        { startTime: "", endTime: "", capacity: "20" },
      ],
    }));
  };

  const updateSlot = (dayKey, idx, field, value) => {
    setCurrentEdits((prev) => {
      const list = [...(prev[dayKey] || [])];
      list[idx][field] = value;
      return { ...prev, [dayKey]: list };
    });
  };

  const removeSlot = (dayKey, idx) => {
    setCurrentEdits((prev) => {
      const list = [...(prev[dayKey] || [])];
      list.splice(idx, 1);
      if (list.length === 0) {
        const copy = { ...prev };
        delete copy[dayKey];
        return copy;
      }
      return { ...prev, [dayKey]: list };
    });
  };

  const deleteSlot = async (id) => {
    if (!window.confirm(t("adminSchedule.confirm.deleteSlot"))) return;

    try {
      await Api.delete(`/admin/slots/${id}`);
      toast.success(t("adminSchedule.success.deleted"));

      // إعادة تحميل الأسابيع
      await fetchCurrentWeek();
      await fetchNextWeek();
    } catch (err) {
      handleServerError(err);
    }
  };

  const saveChanges = async () => {
    const changes = [];

    Object.keys(currentEdits).forEach((key) => {
      currentEdits[key].forEach((s) => {
        if (s.startTime && s.endTime) {
          changes.push({
            date: key,
            startTime: s.startTime,
            endTime: s.endTime,
            capacity: Number(s.capacity) || 20,
          });
        }
      });
    });

    if (!changes.length) {
      return toast.info(t("adminSchedule.info.noValidChanges"));
    }

    setSaving(true);
    try {
      await Promise.all(changes.map((c) => Api.post("/admin/slots", c)));

      toast.success(
        t("adminSchedule.success.createdSlots", {
          count: changes.length,
        })
      );

      setCurrentEdits({});
      await fetchCurrentWeek();
    } catch (err) {
      handleServerError(err);
    } finally {
      setSaving(false);
    }
  };

  // ===================== إدارة الأسبوع القادم =====================
  const addNextSlot = (dayIndex) => {
    const copy = [...nextWeek];
    copy[dayIndex].items.push({ startTime: "", endTime: "", capacity: "20" });
    setNextWeek(copy);
  };

  const updateNextSlot = (dayIndex, idx, field, value) => {
    const copy = [...nextWeek];
    copy[dayIndex].items[idx][field] = value;
    setNextWeek(copy);
  };

  const removeNextSlot = (dayIndex, idx) => {
    const copy = [...nextWeek];
    copy[dayIndex].items.splice(idx, 1);
    setNextWeek(copy);
  };

  const saveNextWeek = async () => {
    const items = nextWeek.flatMap((d) =>
      d.items
        .filter((s) => s.startTime && s.endTime)
        .map((s) => ({
          dayOffset: d.dayOffset,
          startTime: s.startTime,
          endTime: s.endTime,
          capacity: Number(s.capacity) || 20,
        }))
    );

    if (!items.length) {
      return toast.warn(t("adminSchedule.info.addValid"));
    }

    setSaving(true);
    try {
      const { data } = await Api.post("/admin/slots/next-week/bulk", { items });

      toast.success(
        t("adminSchedule.success.createdNext", {
          count: data?.created ?? items.length,
        })
      );

      fetchNextWeek();

      setNextWeek(
        Array.from({ length: 7 }, (_, i) => ({ dayOffset: i, items: [] }))
      );
      setTab(1);
    } catch (err) {
      handleServerError(err);
    } finally {
      setSaving(false);
    }
  };

  // ===================== واجهة الصفحة =====================
  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        py: 4,
        px: { xs: 1, sm: 2, md: 3 },
        background: isDark
          ? "radial-gradient(circle at top, #111827 0%, #020617 40%, #000 100%)"
          : "linear-gradient(135deg, #fdfbff 0%, #f3f4ff 40%, #fee2f2 100%)",
        transition: "all 0.3s ease",
      }}
    >
      <Box sx={{ width: "100%", mx: "auto" }}>
        {/* ===== عنوان + Tabs داخل كرت زجاجي فاخر ===== */}
        <Paper
          elevation={isDark ? 2 : 4}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 4,
            position: "relative",
            overflow: "hidden",
            background: isDark
              ? "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,64,175,0.85))"
              : "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(249,250,251,0.9))",
            border: isDark
              ? "1px solid rgba(148,163,184,0.25)"
              : "1px solid rgba(0,0,0,0.06)",
            backdropFilter: "blur(18px)",
            boxShadow: isDark
              ? "0 24px 60px rgba(0,0,0,0.7)"
              : "0 20px 50px rgba(148,163,184,0.45)",
          }}
        >
          {/* دوائر خلفية ديكورية */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                width: 180,
                height: 180,
                borderRadius: "50%",
                top: -60,
                left: -40,
                background: `radial-gradient(circle, ${BRAND.pink}40, transparent 70%)`,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                width: 220,
                height: 220,
                borderRadius: "50%",
                bottom: -80,
                right: -60,
                background: `radial-gradient(circle, ${BRAND.purple}35, transparent 70%)`,
              }}
            />
          </Box>

          <Box sx={{ position: "relative" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                mb: 3,
                flexWrap: "wrap",
              }}
            >
              {/* أيقونة كبيرة */}
              <Box
                sx={{
                  width: 70,
                  height: 70,
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.pink})`,
                  boxShadow: "0 18px 45px rgba(236,72,153,0.45)",
                }}
              >
                <CalendarTodayIcon sx={{ color: "#fff", fontSize: 36 }} />
              </Box>

              {/* نص العنوان والوصف */}
              <Box sx={{ flex: 1, minWidth: 220 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 900,
                    letterSpacing: 0.5,
                    background: `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.pink})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    mb: 0.5,
                  }}
                >
                  {t("adminSchedule.title")}
                </Typography>
                <Typography
                  sx={{
                    color: isDark ? "#cbd5f5" : "rgba(15,23,42,0.7)",
                    fontWeight: 500,
                    fontSize: 15,
                  }}
                >
                  {t("adminSchedule.subtitle")}
                </Typography>
              </Box>

              {/* شريحة معلومات سريعة */}
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  background: isDark
                    ? "rgba(15,23,42,0.9)"
                    : "rgba(255,255,255,0.9)",
                  borderRadius: 999,
                  px: 2,
                  py: 0.7,
                  border: isDark
                    ? "1px solid rgba(148,163,184,0.5)"
                    : "1px solid rgba(148,163,184,0.35)",
                }}
              >
                <AccessTimeIcon
                  sx={{ fontSize: 18, color: isDark ? "#e5e7eb" : "#4b5563" }}
                />
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: isDark ? "#e5e7eb" : "#111827",
                  }}
                >
                  {weekData?.weekStart} ← {weekData?.weekEnd}
                </Typography>
              </Stack>
            </Box>

            {/* Tabs */}
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              TabIndicatorProps={{
                style: {
                  height: 4,
                  background: `linear-gradient(90deg, ${BRAND.purple}, ${BRAND.pink})`,
                  borderRadius: 999,
                },
              }}
              sx={{
                mt: 1,
                "& .MuiTab-root": {
                  fontWeight: 700,
                  fontSize: 15,
                  minHeight: 52,
                  color: isDark ? "#e5e7eb" : "#111827",
                  textTransform: "none",
                },
                "& .MuiTab-root.Mui-selected": {
                  color: isDark ? "#fff" : BRAND.pink,
                },
              }}
            >
              <Tab
                icon={<EventAvailableIcon />}
                iconPosition="start"
                label={t("adminSchedule.currentWeek")}
              />
              <Tab
                icon={<NavigateNextIcon />}
                iconPosition="start"
                label={t("adminSchedule.nextWeek")}
              />
            </Tabs>
          </Box>
        </Paper>

        {/* ===== محتوى الأسبوع الحالي ===== */}
        {tab === 0 && (
          <>
            {loading ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <CircularProgress
                  size={60}
                  sx={{
                    color: BRAND.purple,
                  }}
                />
              </Box>
            ) : (
              <>
                {/* نطاق الأسبوع الحالي */}
                <Paper
                  elevation={isDark ? 1 : 2}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    mb: 3,
                    p: 2.5,
                    borderRadius: 3,
                    background: isDark ? "#020617" : "#ffffff",
                    border: isDark
                      ? "1px solid rgba(148,163,184,0.5)"
                      : "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      color: isDark ? "#e5e7eb" : "#111827",
                    }}
                  >
                    <NavigateBeforeIcon sx={{ opacity: 0.6 }} />
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: 15,
                      }}
                    >
                      {weekData?.weekStart} ← {weekData?.weekEnd}
                    </Typography>
                  </Box>
                  <Chip
                    label={t("adminSchedule.current")}
                    icon={
                      <EventAvailableIcon sx={{ color: "#fff !important" }} />
                    }
                    sx={{
                      background: `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.pink})`,
                      color: "#fff",
                      fontWeight: 700,
                      px: 1.5,
                    }}
                  />
                </Paper>

                {/* كروت الأيام */}
                <Grid
                  container
                  spacing={3}
                  sx={{
                    width: "100%",
                    margin: 0,
                  }}
                >
                  {Array.from({ length: 7 }, (_, i) => {
                    if (!serverWeekStart) return null;
                    const d = addDays(serverWeekStart, i);
                    const key = fmt(d);

                    return (
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={4}
                        lg={3}
                        sx={{ width: "100%" }}
                        key={i}
                      >
                        <DaySection
                          style={{ width: "100%" }}
                          dayName={t(`weekdays.${DAY_KEYS[i]}`)}
                          date={key}
                          existingSlots={weekData?.days?.[key] || []}
                          newSlots={currentEdits[key] || []}
                          isPast={isPastDay(d)}
                          isToday={isToday(d)}
                          onAddSlot={() => addSlot(i)}
                          onUpdateNew={(idx, field, value) =>
                            updateSlot(key, idx, field, value)
                          }
                          onRemoveNew={(idx) => removeSlot(key, idx)}
                          onDeleteExisting={deleteSlot}
                        />
                      </Grid>
                    );
                  })}
                </Grid>

                {/* زر الحفظ */}
                <Box sx={{ textAlign: "center", mt: 4 }}>
                  <Button
                    variant="contained"
                    startIcon={
                      saving ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    onClick={saveChanges}
                    disabled={saving || Object.keys(currentEdits).length === 0}
                    sx={{
                      background: `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.pink})`,
                      color: "#fff",
                      px: 6,
                      py: 2,
                      fontSize: 15,
                      fontWeight: 800,
                      borderRadius: 999,
                      boxShadow: isDark
                        ? "0 18px 45px rgba(236,72,153,0.45)"
                        : "0 18px 45px rgba(155,111,214,0.45)",
                      "&:hover": {
                        background: `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.pink})`,
                        transform: "translateY(-2px)",
                        boxShadow: isDark
                          ? "0 24px 55px rgba(236,72,153,0.6)"
                          : "0 24px 55px rgba(155,111,214,0.6)",
                      },
                      "&:disabled": {
                        background: "rgba(148,163,184,0.5)",
                        boxShadow: "none",
                        transform: "none",
                      },
                      transition: "all 0.25s ease",
                    }}
                  >
                    {saving
                      ? t("adminSchedule.savingLabel", "جاري الحفظ...")
                      : t("adminSchedule.saveAll")}
                  </Button>
                </Box>
              </>
            )}
          </>
        )}

        {/* ===== محتوى الأسبوع القادم ===== */}
        {tab === 1 && (
          <>
            {/* نطاق الأسبوع القادم */}
            <Paper
              elevation={isDark ? 1 : 2}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                mb: 3,
                p: 2.5,
                borderRadius: 3,
                background: isDark ? "#020617" : "#ffffff",
                border: isDark
                  ? "1px solid rgba(248,250,252,0.25)"
                  : "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  color: isDark ? "#e5e7eb" : "#111827",
                }}
              >
                <NavigateNextIcon sx={{ opacity: 0.6 }} />
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: 15,
                  }}
                >
                  {nextWeekData?.weekStart} ← {nextWeekData?.weekEnd}
                </Typography>
              </Box>

              <Chip
                label={t("adminSchedule.next")}
                icon={<CalendarTodayIcon sx={{ color: "#fff !important" }} />}
                sx={{
                  background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.pink})`,
                  color: "#fff",
                  fontWeight: 700,
                  px: 1.5,
                }}
              />
            </Paper>

            {/* أيام الأسبوع القادم */}
            <Grid container spacing={3}>
              {Array.from({ length: 7 }, (_, i) => {
                if (!serverNextWeekStart) return null;

                const date = fmt(addDays(serverNextWeekStart, i));

                return (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    lg={3}
                    xl={3}
                    key={i}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                    }}
                  >
                    <DaySection
                      dayName={t(`weekdays.${DAY_KEYS[i]}`)}
                      date={date}
                      existingSlots={nextWeekData?.days?.[date] || []}
                      newSlots={nextWeek[i]?.items || []}
                      isPast={false}
                      isToday={false}
                      onAddSlot={() => addNextSlot(i)}
                      onUpdateNew={(idx, field, value) =>
                        updateNextSlot(i, idx, field, value)
                      }
                      onRemoveNew={(idx) => removeNextSlot(i, idx)}
                      onDeleteExisting={deleteSlot}
                    />
                  </Grid>
                );
              })}
            </Grid>

            {/* زر إنشاء الأسبوع القادم */}
            <Box sx={{ textAlign: "center", mt: 4 }}>
              <Button
                variant="contained"
                startIcon={
                  saving ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                onClick={saveNextWeek}
                disabled={saving}
                sx={{
                  background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.pink})`,
                  color: "#fff",
                  px: 6,
                  py: 2,
                  fontSize: 15,
                  fontWeight: 800,
                  borderRadius: 999,
                  boxShadow: isDark
                    ? "0 18px 45px rgba(245,158,11,0.45)"
                    : "0 18px 45px rgba(245,158,11,0.45)",
                  "&:hover": {
                    background: `linear-gradient(135deg, #D97706, #DB2777)`,
                    transform: "translateY(-2px)",
                    boxShadow: isDark
                      ? "0 24px 55px rgba(245,158,11,0.6)"
                      : "0 24px 55px rgba(245,158,11,0.6)",
                  },
                  "&:disabled": {
                    background: "rgba(148,163,184,0.5)",
                    boxShadow: "none",
                    transform: "none",
                  },
                  transition: "all 0.25s ease",
                }}
              >
                {saving
                  ? t("adminSchedule.creatingLabel", "جاري الإنشاء...")
                  : t("adminSchedule.saveNextWeek")}
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
