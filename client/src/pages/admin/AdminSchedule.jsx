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
  useMediaQuery,
  useTheme,
} from "@mui/material";
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
import { Api } from "../../api/Api";
import { toast } from "react-toastify";
import { useThemeMode } from "../../context/ThemeContext";
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

export default function AdminSchedule() {
  const { mode, BRAND } = useThemeMode();
  const isDark = mode === "dark";
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { t } = useTranslation();

  const dayNames = [
    t("days.0"),
    t("days.1"),
    t("days.2"),
    t("days.3"),
    t("days.4"),
    t("days.5"),
    t("days.6"),
  ];

  // 🎨 ألوان التصميم
  const COLORS = {
    primary: isDark ? "#B794F6" : "#9B6FD6",
    secondary: isDark ? "#F6C86E" : "#E8B54D",
    bgMain: isDark ? "#1a1a1f" : "#FAFAFA",
    bgCard: isDark ? "#25252b" : "#FFFFFF",
    bgSoft: isDark ? "#2d2d35" : "#F5F5F7",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    borderAccent: isDark ? "rgba(183,148,246,0.25)" : "rgba(155,111,214,0.25)",
    text: isDark ? "#E5E5E5" : "#2D2D2D",
    textSoft: isDark ? "#A0A0A0" : "#666666",
    error: isDark ? "#D57373" : "#E57373",
  };

  // ===================== الحالة =====================
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
      toast.error(t("adminSchedule.errors.fetchCurrent"));
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
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCurrentWeek();
    fetchNextWeek();

    setNextWeek(
      Array.from({ length: 7 }, (_, i) => ({
        dayOffset: i,
        items: [],
      }))
    );
  }, []);

  // ===================== إدارة الأسبوع الحالي =====================
  const addSlot = (dayIndex) => {
    const key = fmt(addDays(weekStart, dayIndex));
    setCurrentEdits((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), { startTime: "", endTime: "", capacity: "20" }],
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
      fetchCurrentWeek();
    } catch {
      toast.error(t("adminSchedule.errors.deleteFailed"));
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

    if (!changes.length) return toast.info(t("adminSchedule.info.noValidChanges"));

    try {
      await Promise.all(changes.map((c) => Api.post("/admin/slots", c)));
      toast.success(t("adminSchedule.success.saved"));
      setCurrentEdits({});
      fetchCurrentWeek();
    } catch {
      toast.error(t("adminSchedule.errors.saveFailed"));
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

    if (!items.length) return toast.warn(t("adminSchedule.info.addValid"));

    try {
      const { data } = await Api.post("/admin/slots/next-week/bulk", { items });
      toast.success(t("adminSchedule.success.createdNext", { count: data.created }));
      fetchNextWeek();

      setNextWeek(
        Array.from({ length: 7 }, (_, i) => ({ dayOffset: i, items: [] }))
      );
      setTab(1);
    } catch {
      toast.error(t("adminSchedule.errors.createNextFailed"));
    }
  };

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
        {/* حصص قديمة */}
        {!!existing.length && (
          <Stack spacing={1.5}>
            {existing.map((s) => (
              <Paper
                key={s._id}
                elevation={0}
                sx={{
                  p: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderRadius: 2,
                  background: COLORS.bgSoft,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <AccessTimeIcon sx={{ color: COLORS.primary }} />

                  <Typography sx={{ fontWeight: 600, color: COLORS.text }}>
                    {s.startTime} - {s.endTime}
                  </Typography>

                  <Chip
                    size="small"
                    label={`${t("adminSchedule.capacity")} ${s.capacity}`}
                    sx={{
                      background: isDark
                        ? "rgba(183,148,246,0.15)"
                        : "rgba(155,111,214,0.1)",
                      color: COLORS.primary,
                      fontWeight: 600,
                    }}
                  />

                  {s.isBlocked && (
                    <Chip
                      size="small"
                      label={t("adminSchedule.blocked")}
                      sx={{
                        background: isDark
                          ? "rgba(213,115,115,0.15)"
                          : "rgba(229,115,115,0.1)",
                        color: COLORS.error,
                        fontWeight: 600,
                      }}
                    />
                  )}
                </Box>

                {/* زر حذف */}
                {!isNextWeek && (
                  <Tooltip
                    title={
                      isPast
                        ? t("adminSchedule.noDeletePast")
                        : t("adminSchedule.deleteSlot")
                    }
                  >
                    <span>
                      <IconButton
                        disabled={isPast}
                        onClick={() => !isPast && deleteSlot(s._id)}
                        sx={{
                          background: isPast ? COLORS.textSoft : COLORS.error,
                          color: "#fff",
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              </Paper>
            ))}
          </Stack>
        )}

        {/* حصص جديدة */}
        {!!pending.length && (
          <Stack spacing={1.5}>
            {pending.map((s, idx) => (
              <Paper
                key={idx}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: isDark
                    ? "rgba(183,148,246,0.08)"
                    : "rgba(155,111,214,0.05)",
                  border: `1px dashed ${COLORS.borderAccent}`,
                }}
              >
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      type="time"
                      size="small"
                      fullWidth
                      value={s.startTime}
                      onChange={(e) =>
                        isNextWeek
                          ? updateNextSlot(dayIndex, idx, "startTime", e.target.value)
                          : updateSlot(dayKey, idx, "startTime", e.target.value)
                      }
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
                          ? updateNextSlot(dayIndex, idx, "endTime", e.target.value)
                          : updateSlot(dayKey, idx, "endTime", e.target.value)
                      }
                    />
                  </Grid>

                  <Grid item xs={8} sm={3}>
                    <TextField
                      type="number"
                      size="small"
                      fullWidth
                      placeholder={t("adminSchedule.capacity")}
                      value={s.capacity}
                      onChange={(e) =>
                        isNextWeek
                          ? updateNextSlot(dayIndex, idx, "capacity", e.target.value)
                          : updateSlot(dayKey, idx, "capacity", e.target.value)
                      }
                    />
                  </Grid>

                  <Grid item xs={4} sm={1}>
                    <IconButton
                      onClick={() =>
                        isNextWeek
                          ? removeNextSlot(dayIndex, idx)
                          : removeSlot(dayKey, idx)
                      }
                      sx={{
                        background: COLORS.error,
                        color: "#fff",
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>
        )}

        {/* زر إضافة */}
        <Button
          variant="outlined"
          fullWidth
          disabled={isPast}
          onClick={() =>
            isNextWeek ? addNextSlot(dayIndex) : addSlot(dayIndex)
          }
          startIcon={<AddCircleIcon />}
        >
          {t("adminSchedule.addSlot")}
        </Button>
      </Box>
    );

    return (
      <>
        {/* بطاقة اليوم */}
        <Paper
          sx={{
            borderRadius: 2,
            minHeight: 260,
            background: COLORS.bgCard,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {isTodayFlag && (
            <Box
              sx={{
                height: 4,
                background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})`,
              }}
            />
          )}

          <Box
            sx={{
              p: 2,
              borderBottom: `1px solid ${COLORS.border}`,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 700 }}>
                {dayNames[dayIndex]}
              </Typography>
              <Typography sx={{ color: COLORS.textSoft, fontSize: 12 }}>
                {new Date(dayKey).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </Typography>
            </Box>

            <Tooltip title={t("adminSchedule.expand")}>
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
                sx={{ color: COLORS.primary }}
              >
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ p: 2, flex: 1, overflowY: "auto" }}>
            {cardContent}
          </Box>
        </Paper>
      </>
    );
  };

  // ===================== واجهة الصفحة الأساسية =====================
  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        py: 3,
        px: 2,
        background: COLORS.bgMain,
      }}
    >
      <Box sx={{ maxWidth: 1600, mx: "auto" }}>
        {/* العنوان + Tabs */}
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            background: COLORS.bgCard,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <CalendarTodayIcon sx={{ color: COLORS.primary, fontSize: 30 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {t("adminSchedule.title")}
              </Typography>
              <Typography sx={{ color: COLORS.textSoft }}>
                {t("adminSchedule.subtitle")}
              </Typography>
            </Box>
          </Box>

          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            TabIndicatorProps={{
              style: {
                height: 3,
                background: COLORS.primary,
              },
            }}
          >
            <Tab label={t("adminSchedule.currentWeek")} />
            <Tab label={t("adminSchedule.nextWeek")} />
          </Tabs>
        </Paper>

        {/* الأسبوع الحالي */}
        {tab === 0 && (
          <>
            {loading ? (
              <Box sx={{ textAlign: "center", py: 5 }}>
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
                    mb: 2,
                    color: COLORS.textSoft,
                    fontWeight: 600,
                  }}
                >
                  <NavigateBeforeIcon />
                  <Typography>
                    {weekData?.weekStart} → {weekData?.weekEnd}
                  </Typography>
                  <Chip
                    label={t("adminSchedule.current")}
                    sx={{
                      background: COLORS.primary,
                      color: "#fff",
                      ml: "auto",
                    }}
                  />
                </Box>

                <Grid container spacing={2}>
                  {Array.from({ length: 7 }, (_, i) => {
                    const d = addDays(weekStart, i);
                    const key = fmt(d);

                    return (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                        <DayCard
                          dayIndex={i}
                          dayKey={key}
                          existing={weekData?.days?.[key] || []}
                          pending={currentEdits[key] || []}
                          isPast={isPastDay(d)}
                        />
                      </Grid>
                    );
                  })}
                </Grid>

                <Box sx={{ textAlign: "center", mt: 3 }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={saveChanges}
                    sx={{
                      background: COLORS.primary,
                      color: "#fff",
                      px: 4,
                      py: 1.5,
                      fontWeight: 700,
                    }}
                  >
                    {t("adminSchedule.saveAll")}
                  </Button>
                </Box>
              </>
            )}
          </>
        )}

        {/* الأسبوع القادم */}
        {tab === 1 && (
          <>
            {/* نطاق الأسبوع القادم */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 2,
                color: COLORS.textSoft,
                fontWeight: 600,
              }}
            >
              <NavigateNextIcon />
              <Typography>
                {nextWeekData?.weekStart} → {nextWeekData?.weekEnd}
              </Typography>

              <Chip
                label={t("adminSchedule.next")}
                sx={{
                  background: COLORS.secondary,
                  color: isDark ? "#2D2D2D" : "#fff",
                  ml: "auto",
                }}
              />
            </Box>

            <Grid container spacing={2}>
              {Array.from({ length: 7 }, (_, i) => {
                const date = fmt(addDays(addDays(weekStart, 7), i));

                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                    <DayCard
                      dayIndex={i}
                      dayKey={date}
                      existing={nextWeekData?.days?.[date] || []}
                      pending={nextWeek[i]?.items || []}
                      isPast={false}
                      isNextWeek={true}
                    />
                  </Grid>
                );
              })}
            </Grid>

            <Box sx={{ textAlign: "center", mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveNextWeek}
                sx={{
                  background: COLORS.secondary,
                  color: isDark ? "#2D2D2D" : "#fff",
                  px: 4,
                  py: 1.5,
                  fontWeight: 700,
                }}
              >
                {t("adminSchedule.saveNextWeek")}
              </Button>
            </Box>
          </>
        )}

        {/* نافذة تكبير اليوم */}
        <Dialog
          open={!!expandedDay}
          onClose={() => setExpandedDay(null)}
          fullWidth
          maxWidth="md"
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              background: COLORS.bgCard,
              borderRadius: isMobile ? 0 : 2,
            },
          }}
        >
          {expandedDay && (
            <>
              <DialogTitle
                sx={{
                  borderBottom: `1px solid ${COLORS.border}`,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>
                    {dayNames[expandedDay.dayIndex]}
                  </Typography>

                  <Typography sx={{ fontSize: 13, color: COLORS.textSoft }}>
                    {new Date(expandedDay.dayKey).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Typography>
                </Box>

                <IconButton onClick={() => setExpandedDay(null)}>
                  <CloseIcon />
                </IconButton>
              </DialogTitle>

              <DialogContent sx={{ p: 3 }}>
                <DayCard
                  dayIndex={expandedDay.dayIndex}
                  dayKey={expandedDay.dayKey}
                  existing={expandedDay.existing}
                  pending={expandedDay.pending}
                  isPast={expandedDay.isPast}
                  isNextWeek={expandedDay.isNextWeek}
                />
              </DialogContent>
            </>
          )}
        </Dialog>
      </Box>
    </Box>
  );
}
