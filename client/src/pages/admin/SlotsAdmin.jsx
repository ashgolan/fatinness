import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Chip,
  Tooltip,
  useTheme,
  TextField,
} from "@mui/material";

import { useTranslation } from "react-i18next";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PeopleIcon from "@mui/icons-material/People";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { Api } from "../../api/Api";
import { toast } from "react-toastify";
import useServerError from "../../hooks/useServerError";

export default function SlotsAdmin() {
  const handleServerError = useServerError();

  const theme = useTheme();
  const mode = theme.palette.mode;
  const { t, i18n } = useTranslation();
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyBody, setNotifyBody] = useState("");
  const [sendingNotification, setSendingNotification] = useState(false);
  const dir = i18n.dir(); // RTL / LTR

  // 🎨 Colors
  const BRAND = {
    gold: "#FFD93D",
    goldDark: "#FFC300",
    purple: "#9B1D6F",
    purpleDark: "#7A1558",
    fuchsia: "#C2185B",
    pink: "#EC407A",
    line: mode === "dark" ? "rgba(255,217,61,0.15)" : "rgba(155,29,111,0.12)",
    bgSoft: mode === "dark" ? "#0f1115" : "#FFF9E6",
    card: mode === "dark" ? "rgba(18,20,28,.95)" : "rgba(255,255,255,.95)",
    text: mode === "dark" ? "#FFFFFF" : "#1a1a1a",
    sub: mode === "dark" ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.6)",
    green: "#4CAF50",
    red: "#E2445C",
    amber: "#FFB300",
    blue: "#AB47BC",
  };

  // 🧠 State
  const [slots, setSlots] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [now, setNow] = useState(new Date());
  const [weekRange, setWeekRange] = useState({ start: "", end: "" });
  const [filter, setFilter] = useState("active");

  // ⏱️ Update time
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // 🗓️ Generate weeks
  const generateWeeks = () => {
    const today = new Date();

    const pad = (n) => String(n).padStart(2, "0");
    const fmtShort = (d) =>
      `${d.getDate()}/${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`;
    const toLocalISO = (d) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const sunday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const dow = sunday.getDay();
    sunday.setDate(sunday.getDate() - dow);

    const list = [];

    for (let i = -2; i <= 2; i++) {
      const weekStart = new Date(sunday);
      weekStart.setDate(sunday.getDate() + i * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      list.push({
        label: `${fmtShort(weekStart)} - ${fmtShort(weekEnd)}`,
        start: toLocalISO(weekStart),
        end: toLocalISO(weekEnd),
      });
    }

    setWeeks(list);

    const current = list.find(
      (w) => new Date(w.start) <= today && today <= new Date(w.end)
    );

    setSelectedWeek(current ? current.start : list[2].start);
  };

  useEffect(() => {
    generateWeeks();
  }, []);

  // 📥 Fetch Slots
  const fetchSlots = async () => {
    if (!selectedWeek) return;
    setLoading(true);
    try {
      const { data } = await Api.get("/admin/slots/week", {
        params: { start: selectedWeek },
      });
      const allSlots = Object.values(data.days || {}).flat();
      setSlots(allSlots);
      setWeekRange({ start: data.weekStart || "", end: data.weekEnd || "" });
    } catch (err) {
      handleServerError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedWeek]);

  // 🧩 Slot Status
  const getSlotStatus = (slot) => {
    if (!slot)
      return {
        label: t("slotsAdmin.status.unknown"),
        color: BRAND.sub,
        type: "unknown",
      };

    if (slot.isBlocked)
      return {
        label: t("slotsAdmin.status.blocked"),
        color: BRAND.amber,
        type: "blocked",
      };

    const start = new Date(slot.date);
    const [sh, sm] = slot.startTime.split(":");
    start.setHours(Number(sh), Number(sm), 0, 0);

    const end = new Date(slot.date);
    const [eh, em] = slot.endTime
      ? slot.endTime.split(":")
      : [Number(sh) + 1, Number(sm)];
    end.setHours(Number(eh), Number(em), 0, 0);

    if (now > end)
      return {
        label: t("slotsAdmin.status.ended"),
        color: BRAND.red,
        type: "ended",
      };

    if (now >= start && now <= end)
      return {
        label: t("slotsAdmin.status.running"),
        color: BRAND.fuchsia,
        type: "running",
      };

    return {
      label: t("slotsAdmin.status.upcoming"),
      color: BRAND.green,
      type: "upcoming",
    };
  };

  // ⏱️ Time Diff
  const getTimeDiff = (slot) => {
    const start = new Date(slot.date);
    const [sh, sm] = slot.startTime.split(":");
    start.setHours(Number(sh), Number(sm), 0, 0);

    const diffMs = start - now;
    const diffSec = Math.floor(diffMs / 1000);
    const absSec = Math.abs(diffSec);

    const days = Math.floor(absSec / 86400);
    const hours = Math.floor((absSec % 86400) / 3600);
    const minutes = Math.floor((absSec % 3600) / 60);

    // 🧩 نبني أجزاء الزمن فقط إذا كانت > 0
    const parts = [];
    if (days > 0) parts.push(t("slotsAdmin.time.days", { count: days }));
    if (hours > 0) parts.push(t("slotsAdmin.time.hours", { count: hours }));
    if (minutes > 0 || parts.length === 0)
      parts.push(t("slotsAdmin.time.minutes", { count: minutes }));

    const timeText = parts.join(" ");

    // 🟢 لم تبدأ بعد
    if (diffSec > 0) {
      return t("slotsAdmin.time.startsInSmart", { time: timeText });
    }

    // 🟡 بدأت منذ أقل من ساعة
    if (absSec < 3600) {
      return t("slotsAdmin.time.startedAgoSmart", { time: timeText });
    }

    // 🔴 انتهت
    return t("slotsAdmin.time.endedAgoSmart", { time: timeText });
  };

  // 📊 Quick Stats
  const total = slots.length || 1;
  const activeCount = slots.filter(
    (s) =>
      !s.isBlocked &&
      (getSlotStatus(s).type === "upcoming" ||
        getSlotStatus(s).type === "running")
  ).length;

  const endedCount = slots.filter(
    (s) => !s.isBlocked && getSlotStatus(s).type === "ended"
  ).length;

  const blockedCount = slots.filter((s) => s.isBlocked).length;

  const activePercent = Math.round((activeCount / total) * 100);
  const endedPercent = Math.round((endedCount / total) * 100);
  const blockedPercent = Math.round((blockedCount / total) * 100);

  // 🧹 Filtered Slots
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      const status = getSlotStatus(slot);
      if (filter === "active")
        return status.type === "upcoming" || status.type === "running";
      if (filter === "ended") return status.type === "ended";
      if (filter === "blocked") return status.type === "blocked";
      return true;
    });
  }, [slots, filter, now, mode]);

  // Group by day
  const groupedByDay = useMemo(() => {
    return filteredSlots.reduce((acc, slot) => {
      const dayKey = new Date(slot.date).toLocaleDateString(i18n.language, {
        weekday: "long",
        month: "short",
        day: "numeric",
      });

      if (!acc[dayKey]) acc[dayKey] = [];
      acc[dayKey].push(slot);
      return acc;
    }, {});
  }, [filteredSlots, i18n.language]);

  // Dialog open handler
  const handleSlotClick = async (slot) => {
    setSelectedSlot(slot);
    try {
      const { data } = await Api.get(`/admin/slots/${slot._id}/bookings`);
      setBookings(data.bookings || data);
    } catch {
      setBookings([]);
    }
    setOpen(true);
  };

  // Toggle block
  const handleToggleBlock = async () => {
    if (!selectedSlot) return;

    const slotDateTime = new Date(selectedSlot.date);
    const [hour, minute] = selectedSlot.startTime.split(":");
    slotDateTime.setHours(hour, minute, 0, 0);

    if (slotDateTime < now) {
      toast.warn(t("slotsAdmin.toast.blockEndedSlot"));
      return;
    }

    const confirmMsg = selectedSlot.isBlocked
      ? t("slotsAdmin.dialog.confirmActivate")
      : t("slotsAdmin.dialog.confirmDeactivate");

    if (!window.confirm(confirmMsg)) return;

    try {
      const { data } = await Api.put(`/admin/slots/${selectedSlot._id}/block`);
      toast.success(data.message);
      setOpen(false);
      fetchSlots();
    } catch (err) {
      handleServerError(err);
    }
  };
  // 🌌 Dynamic background
  const pageBackground =
    mode === "dark"
      ? `
        radial-gradient(1100px 520px at 110% -10%, rgba(255,217,61,.12) 0%, transparent 60%),
        radial-gradient(1000px 500px at -10% 110%, rgba(155,29,111,.15) 0%, transparent 60%),
        linear-gradient(180deg, #0b0d12 0%, #12151c 100%)
      `
      : `
        radial-gradient(1200px 600px at 110% -10%, rgba(255,217,61,.25) 0%, transparent 60%),
        radial-gradient(1000px 500px at -10% 110%, rgba(194,24,91,.15) 0%, transparent 60%),
        linear-gradient(180deg, #FFF9E6 0%, #FCE4EC 100%)
      `;

  return (
    <Box
      dir={dir}
      sx={{
        minHeight: "100vh",
        py: 4,
        px: { xs: 2, sm: 4 },
        backgroundImage: pageBackground,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 1440,
          mx: "auto",
          p: { xs: 2, sm: 3.5 },
          borderRadius: 3,
          border: `1px solid ${BRAND.line}`,
          boxShadow:
            mode === "dark"
              ? "0 10px 30px rgba(0,0,0,.4)"
              : "0 10px 30px rgba(155,29,111,.08)",
          background: BRAND.card,
          backdropFilter: "saturate(120%) blur(8px)",
        }}
      >
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3.5,
            borderRadius: 3,
            border: `1px solid ${BRAND.line}`,
            background:
              mode === "dark"
                ? "linear-gradient(145deg, rgba(255,217,61,0.08), rgba(155,29,111,0.08))"
                : "linear-gradient(145deg, rgba(255,217,61,0.15), rgba(194,24,91,0.08))",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.fuchsia})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 8px 24px ${BRAND.fuchsia}44`,
                }}
              >
                <CalendarMonthIcon sx={{ fontSize: 28, color: "#fff" }} />
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 800, color: BRAND.text, mb: 0.5 }}
                >
                  {t("slotsAdmin.header.title")}
                </Typography>
                <Typography sx={{ fontSize: 14, color: BRAND.sub }}>
                  {t("slotsAdmin.header.subtitle")}
                </Typography>
              </Box>
            </Box>
            <TrendingUpIcon
              sx={{ fontSize: 44, color: BRAND.purple, opacity: 0.3 }}
            />
          </Box>
        </Paper>

        {/* Stats */}
        {!loading && slots.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 4,
              borderRadius: 3,
              border: `1px solid ${BRAND.line}`,
              background: BRAND.card,
              boxShadow:
                mode === "dark"
                  ? "0 0 25px rgba(255,217,61,0.05)"
                  : "0 0 20px rgba(155,29,111,0.05)",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                mb: 3,
                color: BRAND.text,
                textAlign: "center",
              }}
            >
              {t("slotsAdmin.stats.title")}
            </Typography>

            {/* Active */}
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: `radial-gradient(circle, ${BRAND.green} 40%, transparent 70%)`,
                      boxShadow: `0 0 10px ${BRAND.green}`,
                    }}
                  />
                  <Typography sx={{ fontWeight: 700, color: BRAND.text }}>
                    {t("slotsAdmin.stats.active")}
                  </Typography>
                </Box>
                <Typography sx={{ color: BRAND.sub }}>
                  {activeCount} ({activePercent}%)
                </Typography>
              </Box>
              <Box
                sx={{
                  height: 14,
                  borderRadius: "999px",
                  backgroundColor: `${BRAND.green}22`,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${activePercent}%`,
                    background: BRAND.green,
                    height: "100%",
                    transition: "width 0.6s ease",
                  }}
                />
              </Box>
            </Box>

            {/* Ended */}
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: `radial-gradient(circle, ${BRAND.red} 40%, transparent 70%)`,
                      boxShadow: `0 0 10px ${BRAND.red}`,
                    }}
                  />
                  <Typography sx={{ fontWeight: 700, color: BRAND.text }}>
                    {t("slotsAdmin.stats.ended")}
                  </Typography>
                </Box>
                <Typography sx={{ color: BRAND.sub }}>
                  {endedCount} ({endedPercent}%)
                </Typography>
              </Box>
              <Box
                sx={{
                  height: 14,
                  borderRadius: "999px",
                  backgroundColor: `${BRAND.red}22`,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${endedPercent}%`,
                    background: BRAND.red,
                    height: "100%",
                    transition: "width 0.6s ease",
                  }}
                />
              </Box>
            </Box>

            {/* Blocked */}
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: `radial-gradient(circle, ${BRAND.amber} 40%, transparent 70%)`,
                      boxShadow: `0 0 10px ${BRAND.amber}`,
                    }}
                  />
                  <Typography sx={{ fontWeight: 700, color: BRAND.text }}>
                    {t("slotsAdmin.stats.blocked")}
                  </Typography>
                </Box>
                <Typography sx={{ color: BRAND.sub }}>
                  {blockedCount} ({blockedPercent}%)
                </Typography>
              </Box>
              <Box
                sx={{
                  height: 14,
                  borderRadius: "999px",
                  backgroundColor: `${BRAND.amber}22`,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${blockedPercent}%`,
                    background: BRAND.amber,
                    height: "100%",
                    transition: "width 0.6s ease",
                  }}
                />
              </Box>
            </Box>

            {/* Total */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: `radial-gradient(circle, ${BRAND.purple} 40%, transparent 70%)`,
                      boxShadow: `0 0 10px ${BRAND.purple}`,
                    }}
                  />
                  <Typography sx={{ fontWeight: 700, color: BRAND.text }}>
                    {t("slotsAdmin.stats.total")}
                  </Typography>
                </Box>
                <Typography sx={{ color: BRAND.sub }}>
                  {slots.length}
                </Typography>
              </Box>
              <Box
                sx={{
                  height: 14,
                  borderRadius: "999px",
                  backgroundColor: `${BRAND.purple}22`,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    background: `linear-gradient(90deg, ${BRAND.purple}, ${BRAND.fuchsia})`,
                    height: "100%",
                  }}
                />
              </Box>
            </Box>
          </Paper>
        )}

        {/* Filters + Week */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3.5,
            borderRadius: 3,
            border: `1px solid ${BRAND.line}`,
            background:
              mode === "dark"
                ? "linear-gradient(145deg, rgba(255,217,61,0.05), rgba(155,29,111,0.05))"
                : "linear-gradient(145deg, rgba(255,217,61,0.12), rgba(252,228,236,0.5))",
            boxShadow:
              mode === "dark"
                ? "0 0 15px rgba(255,217,61,0.08)"
                : "0 0 12px rgba(155,29,111,0.08)",
          }}
        >
          <Grid
            container
            spacing={2}
            alignItems="center"
            justifyContent="center"
          >
            {/* Week Selector */}
            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor:
                      mode === "dark" ? "rgba(255,255,255,.04)" : BRAND.bgSoft,
                    "& fieldset": { border: `1px solid ${BRAND.line}` },
                    "&:hover fieldset": { borderColor: BRAND.gold },
                    "&.Mui-focused fieldset": {
                      borderColor: BRAND.fuchsia,
                      borderWidth: 2,
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: BRAND.fuchsia,
                  },
                }}
              >
                <InputLabel>{t("slotsAdmin.filters.selectWeek")}</InputLabel>
                <Select
                  value={selectedWeek}
                  label={t("slotsAdmin.filters.selectWeek")}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        mt: 1,
                        border: `1px solid ${BRAND.line}`,
                        backgroundColor: BRAND.card,
                      },
                    },
                  }}
                >
                  {weeks.map((w, i) => (
                    <MenuItem key={i} value={w.start}>
                      {w.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Filters */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: { xs: "center", md: "flex-end" },
                  width: "100%",
                }}
              >
                <ToggleButtonGroup
                  value={filter}
                  exclusive
                  onChange={(e, val) => val && setFilter(val)}
                  sx={{
                    borderRadius: 3,
                    gap: 1,
                    flexWrap: "wrap",
                    justifyContent: { xs: "center", md: "flex-end" },
                    "& .MuiToggleButton-root": {
                      textTransform: "none",
                      fontWeight: 900,
                      fontSize: { xs: 14, sm: 13 },
                      px: { xs: 3, sm: 2.5 },
                      py: { xs: 1.2, sm: 0.9 },
                      borderRadius: 2.5,
                      border: `2px solid ${BRAND.line}`,
                      color: BRAND.sub,
                      backgroundColor:
                        mode === "dark"
                          ? "rgba(255,255,255,0.03)"
                          : BRAND.bgSoft,
                      transition: "all .25s ease-in-out",
                      "&:hover": {
                        borderColor: BRAND.gold,
                        color: BRAND.text,
                        backgroundColor:
                          mode === "dark"
                            ? "rgba(255,217,61,0.08)"
                            : "rgba(255,217,61,0.15)",
                        transform: "translateY(-2px)",
                      },
                      "&.Mui-selected": {
                        borderColor: BRAND.fuchsia,
                        background:
                          mode === "dark"
                            ? "linear-gradient(145deg, rgba(194,24,91,0.25), rgba(255,217,61,0.08))"
                            : "linear-gradient(145deg, rgba(194,24,91,0.15), rgba(255,217,61,0.08))",
                        color: BRAND.fuchsia,
                        boxShadow: `0 0 12px ${BRAND.fuchsia}44`,
                        "&:hover": {
                          borderColor: BRAND.gold,
                          background:
                            mode === "dark"
                              ? "linear-gradient(145deg, rgba(255,217,61,0.25), rgba(194,24,91,0.15))"
                              : "linear-gradient(145deg, rgba(255,217,61,0.25), rgba(194,24,91,0.15))",
                          transform: "translateY(-2px)",
                        },
                      },
                    },
                  }}
                >
                  <ToggleButton value="active">
                    {t("slotsAdmin.filters.active")}
                  </ToggleButton>
                  <ToggleButton value="ended">
                    {t("slotsAdmin.filters.ended")}
                  </ToggleButton>
                  <ToggleButton value="blocked">
                    {t("slotsAdmin.filters.blocked")}
                  </ToggleButton>
                  <ToggleButton value="all">
                    {t("slotsAdmin.filters.all")}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Slots Display */}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 400,
            }}
          >
            <CircularProgress
              sx={{ color: BRAND.fuchsia }}
              size={50}
              thickness={4}
            />
          </Box>
        ) : Object.keys(groupedByDay).length ? (
          Object.keys(groupedByDay).map((day) => (
            <Box key={day} sx={{ mb: 3.5 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 2,
                  border: `1px solid ${BRAND.line}`,
                  background: BRAND.card,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: BRAND.text,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.4,
                  }}
                >
                  <Box
                    sx={{
                      width: 7,
                      height: 24,
                      background: `linear-gradient(180deg, ${BRAND.gold}, ${BRAND.fuchsia})`,
                      borderRadius: "4px",
                    }}
                  />
                  {day}
                  <Chip
                    label={t("slotsAdmin.day.sessionsCount", {
                      count: groupedByDay[day].length,
                    })}
                    size="small"
                    sx={{
                      backgroundColor: `${BRAND.purple}15`,
                      color: BRAND.purple,
                      fontWeight: 800,
                      fontSize: 12,
                      height: 24,
                      border: `1px solid ${BRAND.line}`,
                    }}
                  />
                </Typography>
              </Paper>

              <Grid container spacing={2.2} justifyContent="center">
                {groupedByDay[day].map((slot) => {
                  const status = getSlotStatus(slot);
                  return (
                    <Grid
                      item
                      xs={12}
                      sm={10}
                      md={6}
                      lg={4}
                      key={slot._id}
                      sx={{ display: "flex", justifyContent: "center" }}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          cursor: "pointer",
                          borderRadius: 2,
                          background: BRAND.card,
                          border: `1px solid ${BRAND.line}`,
                          position: "relative",
                          overflow: "hidden",
                          width: "100%",
                          transition: "all .3s ease",
                          "&:hover": {
                            transform: "translateY(-6px)",
                            boxShadow: `0 12px 28px ${status.color}22`,
                            borderColor: status.color,
                          },
                          "&:before": {
                            content: '""',
                            position: "absolute",
                            inset: 0,
                            background: `${status.color}08`,
                          },
                          "&:after": {
                            content: '""',
                            position: "absolute",
                            right: dir === "rtl" ? 0 : "auto",
                            left: dir === "ltr" ? 0 : "auto",
                            top: 0,
                            bottom: 0,
                            width: "5px",
                            background: status.color,
                          },
                        }}
                        onClick={() => handleSlotClick(slot)}
                      >
                        <Box
                          sx={{
                            position: "relative",
                            zIndex: 1,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              mb: 2.5,
                              gap: 2,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 1.5,
                                  backgroundColor: `${status.color}22`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <AccessTimeIcon
                                  sx={{ fontSize: 24, color: status.color }}
                                />
                              </Box>
                              <Box>
                                <Typography
                                  sx={{
                                    fontSize: 16,
                                    fontWeight: 900,
                                    color: BRAND.text,
                                    mb: 0.3,
                                  }}
                                >
                                  {slot.startTime} - {slot.endTime}
                                </Typography>
                                <Typography
                                  sx={{ fontSize: 12, color: BRAND.sub }}
                                >
                                  {getTimeDiff(slot)}
                                </Typography>
                              </Box>
                            </Box>

                            <Chip
                              label={status.label}
                              size="small"
                              sx={{
                                backgroundColor: `${status.color}15`,
                                color: status.color,
                                border: `1px solid ${status.color}55`,
                                fontSize: 12,
                                fontWeight: 900,
                                height: 28,
                              }}
                            />
                          </Box>

                          <Divider sx={{ my: 2 }} />

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 2,
                              flexWrap: "wrap",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <PeopleIcon
                                sx={{ fontSize: 20, color: BRAND.sub }}
                              />
                              <Typography
                                sx={{ fontSize: 13, color: BRAND.sub }}
                              >
                                {t("slotsAdmin.card.capacityLabel")}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: 15,
                                  fontWeight: 900,
                                  color: BRAND.text,
                                }}
                              >
                                {slot.capacity}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                px: 1.6,
                                py: 0.6,
                                borderRadius: "10px",
                                border: `1px solid ${BRAND.line}`,
                                backgroundColor:
                                  slot.available > 0
                                    ? `${BRAND.green}1A`
                                    : `${BRAND.red}1A`,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: 12,
                                  fontWeight: 800,
                                  color: BRAND.sub,
                                }}
                              >
                                {t("slotsAdmin.card.availableLabel")}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: 15,
                                  fontWeight: 900,
                                  color:
                                    slot.available > 0
                                      ? BRAND.green
                                      : BRAND.red,
                                }}
                              >
                                {slot.available}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          ))
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: 8,
              textAlign: "center",
              background: BRAND.card,
              borderRadius: 2,
              border: `1px dashed ${BRAND.line}`,
            }}
          >
            <CalendarMonthIcon
              sx={{ fontSize: 80, color: BRAND.line, mb: 2 }}
            />
            <Typography
              sx={{ fontSize: 16, color: BRAND.sub, fontWeight: 900 }}
            >
              {t("slotsAdmin.empty.title")}
            </Typography>
            <Typography sx={{ fontSize: 13, color: BRAND.sub, mt: 1 }}>
              {t("slotsAdmin.empty.range", {
                start: weekRange.start,
                end: weekRange.end,
              })}
            </Typography>
          </Paper>
        )}

        {/* Details Dialog */}
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 3,
              border: `1px solid ${BRAND.line}`,
              background: BRAND.card,
            },
          }}
        >
          <DialogTitle
            sx={{
              background:
                mode === "dark"
                  ? "rgba(255,217,61,0.05)"
                  : "rgba(255,249,230,0.8)",
              borderBottom: `1px solid ${BRAND.line}`,
              fontWeight: 900,
              color: BRAND.text,
              fontSize: 18,
              p: 3,
            }}
          >
            {t("slotsAdmin.dialog.title")}
          </DialogTitle>

          <DialogContent sx={{ p: 3, mt: 2 }}>
            {selectedSlot && (
              <>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    mb: 3,
                    background:
                      mode === "dark" ? "rgba(255,217,61,0.05)" : BRAND.bgSoft,
                    borderRadius: 2,
                    border: `1px solid ${BRAND.line}`,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <CalendarMonthIcon
                      sx={{ fontSize: 22, color: BRAND.fuchsia }}
                    />
                    <Typography
                      sx={{
                        fontSize: 14,
                        color: BRAND.text,
                        fontWeight: 900,
                      }}
                    >
                      {new Date(selectedSlot.date).toLocaleDateString(
                        i18n.language,
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 22, color: BRAND.gold }} />
                    <Typography
                      sx={{
                        fontSize: 14,
                        color: BRAND.text,
                        fontWeight: 900,
                      }}
                    >
                      {selectedSlot.startTime} - {selectedSlot.endTime}
                    </Typography>
                  </Box>
                </Paper>

                <Typography
                  sx={{
                    fontSize: 15,
                    fontWeight: 900,
                    color: BRAND.text,
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <PeopleIcon sx={{ fontSize: 20, color: BRAND.purple }} />
                  {t("slotsAdmin.dialog.membersTitle", {
                    count: bookings.length,
                  })}
                </Typography>

                {bookings.length ? (
                  <Box
                    sx={{
                      border: `1px solid ${BRAND.line}`,
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    {bookings.map((b, index) => (
                      <Box
                        key={b._id}
                        sx={{
                          p: 2,
                          backgroundColor:
                            index % 2 === 0
                              ? BRAND.card
                              : mode === "dark"
                              ? "rgba(255,217,61,0.03)"
                              : BRAND.bgSoft,
                          borderBottom:
                            index < bookings.length - 1
                              ? `1px solid ${BRAND.line}`
                              : "none",
                          "&:hover": {
                            backgroundColor:
                              mode === "dark"
                                ? "rgba(255,217,61,0.06)"
                                : "rgba(155,29,111,0.04)",
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 14,
                            fontWeight: 900,
                            color: BRAND.text,
                            mb: 0.5,
                          }}
                        >
                          {b.user?.name ||
                            b.user?.username ||
                            t("slotsAdmin.common.unknownUser")}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          <Typography sx={{ fontSize: 12, color: BRAND.sub }}>
                            {b.user?.phone || t("slotsAdmin.common.noPhone")}
                          </Typography>
                          <Box
                            sx={{
                              width: 4,
                              height: 4,
                              backgroundColor: BRAND.line,
                              borderRadius: "50%",
                            }}
                          />
                          <Chip
                            label={
                              b.status === "booked"
                                ? t("slotsAdmin.dialog.status.booked")
                                : t("slotsAdmin.dialog.status.cancelled")
                            }
                            size="small"
                            sx={{
                              backgroundColor:
                                b.status === "booked"
                                  ? `${BRAND.green}1A`
                                  : `${BRAND.red}1A`,
                              color:
                                b.status === "booked" ? BRAND.green : BRAND.red,
                              fontSize: 11,
                              fontWeight: 900,
                              height: 22,
                              border: `1px solid ${
                                b.status === "booked" ? BRAND.green : BRAND.red
                              }66`,
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      textAlign: "center",
                      background: BRAND.bgSoft,
                      borderRadius: 2,
                      border: `1px dashed ${BRAND.line}`,
                    }}
                  >
                    <PeopleIcon
                      sx={{ fontSize: 50, color: BRAND.line, mb: 1 }}
                    />
                    <Typography sx={{ color: BRAND.sub, fontSize: 14 }}>
                      {t("slotsAdmin.dialog.noMembers")}
                    </Typography>
                  </Paper>
                )}
              </>
            )}
          </DialogContent>

          <DialogActions
            sx={{
              px: 3,
              py: 2.2,
              background: BRAND.bgSoft,
              borderTop: `1px solid ${BRAND.line}`,
              gap: 1.2,
              flexDirection: dir === "rtl" ? "row-reverse" : "row",
            }}
          >
            <Button
              onClick={() => setNotifyOpen(true)}
              sx={{
                textTransform: "none",
                background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.purple})`,
                color: "#fff",
                fontWeight: 900,
                px: 3,
                py: 1,
                borderRadius: 2,
                boxShadow: `0 6px 18px ${BRAND.purple}55`,
                "&:hover": { filter: "brightness(.95)" },
              }}
            >
              📩 {t("slotsAdmin.dialog.sendNotification")}
            </Button>

            <Button
              onClick={() => setOpen(false)}
              sx={{
                textTransform: "none",
                color: BRAND.sub,
                fontWeight: 900,
                px: 3,
                py: 1,
                borderRadius: 2,
                border: `1px solid ${BRAND.line}`,
                "&:hover": { backgroundColor: BRAND.card },
              }}
            >
              {t("slotsAdmin.dialog.close")}
            </Button>
            {selectedSlot && !isNaN(new Date(selectedSlot.date)) && (
              <Button
                onClick={handleToggleBlock}
                sx={{
                  textTransform: "none",
                  background: selectedSlot.isBlocked
                    ? `linear-gradient(135deg, ${BRAND.green}, #66bb6a)`
                    : `linear-gradient(135deg, ${BRAND.red}, #ef5350)`,
                  color: "#fff",
                  fontWeight: 900,
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: selectedSlot.isBlocked
                    ? `0 6px 18px ${BRAND.green}44`
                    : `0 6px 18px ${BRAND.red}44`,
                  "&:hover": { filter: "brightness(.95)" },
                }}
              >
                {selectedSlot.isBlocked
                  ? t("slotsAdmin.dialog.activate")
                  : t("slotsAdmin.dialog.deactivate")}
              </Button>
            )}
          </DialogActions>
        </Dialog>
        <Dialog
          open={notifyOpen}
          onClose={() => setNotifyOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 3,
              border: `1px solid ${BRAND.line}`,
              background: BRAND.card,
            },
          }}
        >
          <DialogTitle
            sx={{
              textAlign: dir === "rtl" ? "right" : "left",
              fontWeight: 900,
              color: BRAND.text,
              borderBottom: `1px solid ${BRAND.line}`,
            }}
          >
            {t("slotsAdmin.notify.title")}
          </DialogTitle>

          <DialogContent sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label={t("slotsAdmin.notify.notificationTitle")}
              value={notifyTitle}
              onChange={(e) => setNotifyTitle(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              minRows={3}
              label={t("slotsAdmin.notify.notificationBody")}
              value={notifyBody}
              onChange={(e) => setNotifyBody(e.target.value)}
              sx={{ mb: 1 }}
            />
          </DialogContent>

          <DialogActions
            sx={{
              px: 3,
              pb: 2,
              justifyContent: dir === "rtl" ? "flex-start" : "flex-end",
            }}
          >
            <Button
              onClick={() => setNotifyOpen(false)}
              sx={{
                textTransform: "none",
                px: 3,
                py: 1,
                borderRadius: 2,
                border: `1px solid ${BRAND.line}`,
                color: BRAND.sub,
              }}
            >
              {t("slotsAdmin.notify.cancel")}
            </Button>

            <Button
              onClick={async () => {
                if (!notifyTitle.trim() || !notifyBody.trim()) {
                  toast.error(t("slotsAdmin.notify.emptyFields"));
                  return;
                }

                setSendingNotification(true);

                try {
                  const { data } = await Api.post("/admin/notify", {
                    title: notifyTitle,
                    body: notifyBody,
                    target: "slot:" + selectedSlot._id,
                  });

                  toast.success(t("slotsAdmin.notify.sent"));
                  setNotifyOpen(false);
                  setNotifyTitle("");
                  setNotifyBody("");
                } catch (err) {
                  handleServerError(err);
                } finally {
                  setSendingNotification(false);
                }
              }}
              disabled={sendingNotification}
              sx={{
                textTransform: "none",
                px: 3,
                py: 1,
                borderRadius: 2,
                fontWeight: 900,
                background: `linear-gradient(135deg, ${BRAND.fuchsia}, ${BRAND.gold})`,
                color: "#fff",
                "&:hover": { filter: "brightness(.95)" },
              }}
            >
              {sendingNotification ? (
                <CircularProgress size={22} sx={{ color: "#fff" }} />
              ) : (
                t("slotsAdmin.notify.send")
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
}
