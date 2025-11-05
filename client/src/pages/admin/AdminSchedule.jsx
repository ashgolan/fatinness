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
  TextField,
  Chip,
  CircularProgress,
  Stack,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  Tooltip,
} from "@mui/material";

import { Api } from "../../api/Api";
import { toast } from "react-toastify";
import { useThemeMode } from "../../context/ThemeContext";

// Icons
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import CloseIcon from "@mui/icons-material/Close";

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

const dayNames = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

export default function AdminSchedule() {
  const { mode, BRAND } = useThemeMode();
  const isDark = mode === "dark";

  // 🎨 ألوان هادئة ومريحة
  const COLORS = {
    // ألوان أساسية هادئة
    primary: isDark ? "#B794F6" : "#9B6FD6",
    secondary: isDark ? "#F6C86E" : "#E8B54D",

    // خلفيات
    bgMain: isDark ? "#1a1a1f" : "#FAFAFA",
    bgCard: isDark ? "#25252b" : "#FFFFFF",
    bgSoft: isDark ? "#2d2d35" : "#F5F5F7",

    // حدود
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    borderAccent: isDark ? "rgba(183,148,246,0.25)" : "rgba(155,111,214,0.25)",

    // نصوص
    text: isDark ? "#E5E5E5" : "#2D2D2D",
    textSoft: isDark ? "#A0A0A0" : "#666666",

    // حالات هادئة
    success: isDark ? "#6EAF87" : "#4CAF50",
    warning: isDark ? "#D4A76A" : "#FFB74D",
    error: isDark ? "#D57373" : "#E57373",
  };

  // ===================== الحالة العامة =====================
  const [tab, setTab] = useState(0);
  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const [weekData, setWeekData] = useState(null);
  const [nextWeekData, setNextWeekData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentEdits, setCurrentEdits] = useState({});
  const [nextWeek, setNextWeek] = useState([]);
  const [expandedDay, setExpandedDay] = useState(null);

  // ===================== جلب البيانات =====================
  const fetchCurrentWeek = async () => {
    setLoading(true);
    try {
      const { data } = await Api.get("/admin/slots/week", {
        params: { start: fmt(weekStart) },
      });
      setWeekData(data);
    } catch {
      toast.error("تعذّر جلب حصص الأسبوع الحالي");
    } finally {
      setLoading(false);
    }
  };

  const fetchNextWeek = async () => {
    try {
      const nextStart = addDays(weekStart, 7);
      const { data } = await Api.get("/admin/slots/week", {
        params: { start: fmt(nextStart) },
      });
      setNextWeekData(data);
    } catch (e) {
      console.error("❌ Error fetching next week slots:", e);
    }
  };

  useEffect(() => {
    fetchCurrentWeek();
    fetchNextWeek();
    const arr = Array.from({ length: 7 }, (_, i) => ({
      dayOffset: i,
      items: [],
    }));
    setNextWeek(arr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===================== إدارة الأسبوع الحالي =====================
  const addSlot = (dayIndex) => {
    const key = fmt(addDays(weekStart, dayIndex));
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
    if (!window.confirm("هل تريدين حذف هذه الحصة؟")) return;
    try {
      await Api.delete(`/admin/slots/${id}`);
      toast.success("تم الحذف بنجاح");
      fetchCurrentWeek();
    } catch {
      toast.error("فشل الحذف");
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
    if (!changes.length) return toast.info("لا توجد تغييرات صالحة للحفظ");
    try {
      await Promise.all(changes.map((c) => Api.post("/admin/slots", c)));
      toast.success("✅ تم حفظ التغييرات بنجاح");
      setCurrentEdits({});
      fetchCurrentWeek();
    } catch {
      toast.error("❌ فشل الحفظ");
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
    if (!items.length) return toast.warn("أضيفي حصصاً صالحة قبل الحفظ");
    try {
      const { data } = await Api.post("/admin/slots/next-week/bulk", { items });
      toast.success(`✅ تم إنشاء ${data.created} حصة للأسبوع القادم`);
      await fetchNextWeek();
      setNextWeek(
        Array.from({ length: 7 }, (_, i) => ({ dayOffset: i, items: [] }))
      );
      setTab(1);
    } catch {
      toast.error("❌ فشل إنشاء الأسبوع القادم");
    }
  };

  // ===================== بطاقة اليوم =====================
  // ===================== بطاقة اليوم =====================
  const DayCard = ({
    dayIndex,
    dayKey,
    existing,
    pending,
    isPast,
    isNextWeek = false,
  }) => {
    const isTodayFlag = isToday(new Date(dayKey));

    const cardContent = (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* الحصص الموجودة */}
        {!!existing.length && (
          <Stack spacing={1.5}>
            {existing.map((s) => (
              <Paper
                key={s._id}
                elevation={0}
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 2,
                  background: COLORS.bgSoft,
                  border: `1px solid ${COLORS.border}`,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: COLORS.borderAccent,
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <AccessTimeIcon
                    sx={{ fontSize: 18, color: COLORS.primary }}
                  />
                  <Typography
                    sx={{ fontWeight: 600, fontSize: 14, color: COLORS.text }}
                  >
                    {s.startTime} - {s.endTime}
                  </Typography>
                  <Chip
                    size="small"
                    label={`سعة ${s.capacity}`}
                    sx={{
                      height: 22,
                      fontSize: 11,
                      background: isDark
                        ? "rgba(183,148,246,0.15)"
                        : "rgba(155,111,214,0.1)",
                      color: COLORS.primary,
                      fontWeight: 600,
                      border: "none",
                    }}
                  />
                  {s.isBlocked && (
                    <Chip
                      size="small"
                      label="معطلة"
                      sx={{
                        height: 22,
                        fontSize: 11,
                        background: isDark
                          ? "rgba(213,115,115,0.15)"
                          : "rgba(229,115,115,0.1)",
                        color: COLORS.error,
                        fontWeight: 600,
                        border: "none",
                      }}
                    />
                  )}
                </Box>

                {!isNextWeek && (
                  <Tooltip
                    title={isPast ? "لا يمكن حذف حصة منتهية" : "حذف الحصة"}
                  >
                    <span>
                      <IconButton
                        onClick={() => !isPast && deleteSlot(s._id)}
                        size="small"
                        disabled={isPast}
                        sx={{
                          color: "#fff",
                          backgroundColor: isPast
                            ? COLORS.textSoft
                            : COLORS.error,
                          "&:hover": {
                            backgroundColor: isPast
                              ? COLORS.textSoft
                              : "#C62828",
                          },
                          opacity: isPast ? 0.5 : 1,
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              </Paper>
            ))}
          </Stack>
        )}

        {/* الحصص الجديدة */}
        {!!pending.length && (
          <Stack spacing={1.5}>
            {pending.map((s, idx) => (
              <Paper
                key={idx}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: isDark
                    ? "rgba(183,148,246,0.08)"
                    : "rgba(155,111,214,0.05)",
                  border: `1px dashed ${COLORS.borderAccent}`,
                }}
              >
                <Grid container spacing={1.5} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      type="time"
                      size="small"
                      fullWidth
                      value={s.startTime}
                      onChange={(e) =>
                        isNextWeek
                          ? updateNextSlot(
                              dayIndex,
                              idx,
                              "startTime",
                              e.target.value
                            )
                          : updateSlot(dayKey, idx, "startTime", e.target.value)
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
                          backgroundColor: COLORS.bgCard,
                          "& fieldset": { borderColor: COLORS.border },
                          "&:hover fieldset": {
                            borderColor: COLORS.borderAccent,
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      type="time"
                      size="small"
                      fullWidth
                      value={s.endTime}
                      onChange={(e) =>
                        isNextWeek
                          ? updateNextSlot(
                              dayIndex,
                              idx,
                              "endTime",
                              e.target.value
                            )
                          : updateSlot(dayKey, idx, "endTime", e.target.value)
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
                          backgroundColor: COLORS.bgCard,
                          "& fieldset": { borderColor: COLORS.border },
                          "&:hover fieldset": {
                            borderColor: COLORS.borderAccent,
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={8} sm={3}>
                    <TextField
                      type="number"
                      size="small"
                      fullWidth
                      value={s.capacity}
                      onChange={(e) =>
                        isNextWeek
                          ? updateNextSlot(
                              dayIndex,
                              idx,
                              "capacity",
                              e.target.value
                            )
                          : updateSlot(dayKey, idx, "capacity", e.target.value)
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
                          backgroundColor: COLORS.bgCard,
                          "& fieldset": { borderColor: COLORS.border },
                          "&:hover fieldset": {
                            borderColor: COLORS.borderAccent,
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={4} sm={1}>
                    <IconButton
                      onClick={() =>
                        isNextWeek
                          ? removeNextSlot(dayIndex, idx)
                          : removeSlot(dayKey, idx)
                      }
                      size="small"
                      sx={{
                        color: "#fff",
                        backgroundColor: COLORS.error,
                        "&:hover": { backgroundColor: "#C62828" },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>
        )}

        {/* زر الإضافة */}
        <Button
          variant="outlined"
          fullWidth
          onClick={() =>
            isNextWeek ? addNextSlot(dayIndex) : addSlot(dayIndex)
          }
          disabled={isPast}
          startIcon={<AddCircleIcon />}
          sx={{
            mt: 0.5,
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            py: 1.2,
            gap: 1,
            borderColor: COLORS.borderAccent,
            color: COLORS.primary,
            "&:hover": {
              borderColor: COLORS.primary,
              background: isDark
                ? "rgba(183,148,246,0.08)"
                : "rgba(155,111,214,0.05)",
            },
            "&:disabled": { opacity: 0.4 },
          }}
        >
          إضافة حصة جديدة
        </Button>
      </Box>
    );

    return (
      <>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            height: "100%",
            minHeight: 400,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: COLORS.bgCard,

            /* 👇 إطار ناعم لكل البطاقات + إطار متدرج مميز لليوم الحالي */
            border: isTodayFlag
  ? "2px solid transparent"
  : `1.3px solid ${isDark ? COLORS.border : "rgba(0,0,0,0.15)"}`,
backgroundImage: isTodayFlag
  ? isDark
    ? `linear-gradient(${COLORS.bgCard}, ${COLORS.bgCard}), linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})`
    : `linear-gradient(${COLORS.bgCard}, ${COLORS.bgCard}), linear-gradient(90deg, #9B6FD6, #E8B54D)`
  : "none",

            backgroundOrigin: "border-box",
            backgroundClip: isTodayFlag
              ? "content-box, border-box"
              : "border-box",

            /* 👇 ظل راقي */
            boxShadow: isTodayFlag
              ? `0 0 14px ${COLORS.primary}50`
              : isDark
              ? "0 2px 8px rgba(0,0,0,0.3)"
              : "0 2px 8px rgba(0,0,0,0.05)",

            transition: "all 0.35s ease",
            "&:hover": {
              transform: "translateY(-3px)",
              boxShadow: isTodayFlag
                ? `0 0 18px ${COLORS.primary}70`
                : isDark
                ? "0 6px 16px rgba(0,0,0,0.35)"
                : "0 6px 16px rgba(0,0,0,0.08)",
            },
            opacity: isPast ? 0.6 : 1,
          }}
        >
          {/* شريط علوي لليوم الحالي */}
          {isTodayFlag && (
            <Box
              sx={{
                height: 4,
                background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})`,
              }}
            />
          )}

          {/* رأس اليوم */}
          <Box
            sx={{
              p: 2,
              borderBottom: `1px solid ${COLORS.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: isTodayFlag
                ? isDark
                  ? "rgba(183,148,246,0.06)"
                  : "rgba(155,111,214,0.04)"
                : "transparent",
            }}
          >
            <Box>
              <Typography
                sx={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}
              >
                {dayNames[dayIndex]}
              </Typography>
              <Typography
                sx={{ fontSize: 11, color: COLORS.textSoft, mt: 0.3 }}
              >
                {new Date(dayKey).toLocaleDateString("ar-EG", {
                  day: "numeric",
                  month: "short",
                })}
              </Typography>
            </Box>

            <Tooltip title="عرض موسّع">
              <IconButton
                onClick={() =>
                  setExpandedDay({
                    dayIndex,
                    dayKey,
                    existing,
                    pending,
                    isPast,
                    isNextWeek,
                  })
                }
                size="small"
                sx={{
                  color: COLORS.primary,
                  "&:hover": {
                    background: isDark
                      ? "rgba(183,148,246,0.1)"
                      : "rgba(155,111,214,0.08)",
                  },
                }}
              >
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* المحتوى */}
          <Box sx={{ p: 2, flex: 1, overflowY: "auto" }}>{cardContent}</Box>
        </Paper>

        {/* نافذة التكبير */}
        <Dialog
          open={expandedDay?.dayKey === dayKey}
          onClose={() => setExpandedDay(null)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, background: COLORS.bgCard } }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            <Box>
              <Typography
                sx={{ fontWeight: 800, fontSize: 18, color: COLORS.text }}
              >
                {dayNames[dayIndex]}
              </Typography>
              <Typography sx={{ fontSize: 12, color: COLORS.textSoft }}>
                {new Date(dayKey).toLocaleDateString("ar-EG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Typography>
            </Box>
            <IconButton
              onClick={() => setExpandedDay(null)}
              sx={{ color: COLORS.textSoft }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>{cardContent}</DialogContent>
        </Dialog>
      </>
    );
  };

  // ===================== الواجهة =====================
  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        py: 4,
        px: { xs: 2, sm: 3, md: 4 },
        background: COLORS.bgMain,
      }}
    >
      <Box sx={{ maxWidth: 1600, mx: "auto" }}>
        {/* العنوان + Tabs */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2.5,
            background: COLORS.bgCard,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          {/* العنوان */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isDark
                  ? "rgba(183,148,246,0.15)"
                  : "rgba(155,111,214,0.1)",
              }}
            >
              <CalendarTodayIcon sx={{ color: COLORS.primary, fontSize: 24 }} />
            </Box>
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, mb: 0.5, color: COLORS.text }}
              >
                الرزنامة الأسبوعية
              </Typography>
              <Typography sx={{ color: COLORS.textSoft, fontSize: 13 }}>
                إدارة وتنظيم جدول الحصص الرياضية
              </Typography>
            </Box>
          </Box>

          {/* Tabs */}
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            TabIndicatorProps={{
              style: {
                height: 3,
                borderRadius: 3,
                background: COLORS.primary,
              },
            }}
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: 14,
                minHeight: 44,
                mr: 2,
                color: COLORS.textSoft,
              },
              "& .Mui-selected": {
                color: COLORS.primary,
              },
            }}
          >
            <Tab
              icon={<EventAvailableIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label="الأسبوع الحالي"
            />
            <Tab
              icon={<NavigateNextIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label="الأسبوع القادم"
            />
          </Tabs>
        </Paper>

        {/* الأسبوع الحالي */}
        {tab === 0 && (
          <>
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 400,
                }}
              >
                <CircularProgress sx={{ color: COLORS.primary }} />
              </Box>
            ) : (
              <>
                {/* نطاق الأسبوع */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 3,
                    color: COLORS.textSoft,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <NavigateBeforeIcon fontSize="small" />
                  <Typography>
                    {weekData?.weekStart} → {weekData?.weekEnd}
                  </Typography>
                  <Chip
                    label="الحالي"
                    size="small"
                    sx={{
                      ml: "auto",
                      background: COLORS.primary,
                      color: "#fff",
                      fontWeight: 600,
                      border: "none",
                    }}
                  />
                </Box>

                {/* البطاقات */}
                <Grid container spacing={2.5} sx={{ mb: 3 }}>
                  {Array.from({ length: 7 }, (_, i) => {
                    const d = addDays(weekStart, i);
                    const key = fmt(d);
                    const existing = weekData?.days?.[key] || [];
                    const pending = currentEdits[key] || [];
                    const past = isPastDay(d);
                    return (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={key}>
                        <DayCard
                          dayIndex={i}
                          dayKey={key}
                          existing={existing}
                          pending={pending}
                          isPast={past}
                        />
                      </Grid>
                    );
                  })}
                </Grid>

                {/* زر الحفظ */}
                <Box sx={{ textAlign: "center" }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={saveChanges}
                    startIcon={<SaveIcon />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      px: 5,
                      py: 1.5,
                      gap: 1,
                      borderRadius: 2,
                      background: COLORS.primary,
                      color: "#fff",
                      boxShadow: "none",
                      "&:hover": {
                        background: isDark ? "#9F7BD9" : "#8058C2",
                        boxShadow: "none",
                      },
                    }}
                  >
                    حفظ جميع التغييرات
                  </Button>
                </Box>
              </>
            )}
          </>
        )}

        {/* الأسبوع القادم */}
        {tab === 1 && (
          <>
            {/* نطاق الأسبوع */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 3,
                color: COLORS.textSoft,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <NavigateNextIcon fontSize="small" />
              <Typography>
                {nextWeekData?.weekStart} → {nextWeekData?.weekEnd}
              </Typography>
              <Chip
                label="القادم"
                size="small"
                sx={{
                  ml: "auto",
                  background: COLORS.secondary,
                  color: isDark ? "#2D2D2D" : "#fff",
                  fontWeight: 600,
                  border: "none",
                }}
              />
            </Box>

            {/* البطاقات */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              {Array.from({ length: 7 }, (_, i) => {
                const date = fmt(addDays(addDays(weekStart, 7), i));
                const slots = nextWeekData?.days?.[date] || [];
                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                    <DayCard
                      dayIndex={i}
                      dayKey={date}
                      existing={slots}
                      pending={nextWeek[i]?.items || []}
                      isPast={false}
                      isNextWeek={true}
                    />
                  </Grid>
                );
              })}
            </Grid>

            {/* زر الحفظ */}
            <Box sx={{ textAlign: "center" }}>
              <Button
                variant="contained"
                size="large"
                onClick={saveNextWeek}
                startIcon={<SaveIcon />}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  px: 5,
                  py: 1.5,
                  borderRadius: 2,
                  background: COLORS.secondary,
                  color: isDark ? "#2D2D2D" : "#fff",
                  boxShadow: "none",
                  "&:hover": {
                    background: isDark ? "#DEB05A" : "#D4A043",
                    boxShadow: "none",
                  },
                }}
              >
                حفظ الأسبوع القادم
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
