import React from "react";
import { useTranslation } from "react-i18next";

import {
  Box,
  Paper,
  Typography,
  IconButton,
  TextField,
  Tooltip,
  Divider,
} from "@mui/material";

import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import { useThemeMode } from "../../context/ThemeContext";

export default function DaySection({
  dayName,
  date,
  existingSlots = [],
  newSlots = [],
  isPast,
  isToday,
  onAddSlot,
  onUpdateNew,
  onRemoveNew,
  onDeleteExisting,
}) {
  function fmtTime(date) {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const { t } = useTranslation();

  const colors = {
    bg: isDark ? "#1f1f1f" : "#fff",
    card: isDark ? "#2a2a2a" : "#F3F4F6",
    text: isDark ? "#e5e7eb" : "#111827",
    subtext: isDark ? "#9ca3af" : "rgba(0,0,0,0.6)",
    border: isDark ? "1px solid #444" : "1px solid rgba(0,0,0,0.08)",
    todayBorder: "2px solid #EC4899",
    pastBorder: isDark ? "2px solid #333" : "2px solid #e5e7eb",
    newSlotBg: isDark ? "#3b3342" : "#fff7ff",
    newSlotBorder: isDark ? "1px solid #5c4666" : "1px solid #f3c1df",
  };

  // 🔥 تحديد انتهاء الحصة بناءً على تاريخ ووقت النهاية
  function isSlotPast(slot) {
    if (!slot?.endAt) return false;
    return new Date(slot.endAt) < new Date();
  }

  return (
    <Paper
      elevation={isDark ? 1 : 3}
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        p: 2.5,
        borderRadius: 3,
        background: colors.bg,
        border: isToday
          ? colors.todayBorder
          : isPast
            ? colors.pastBorder
            : colors.border,
        opacity: isPast ? 0.7 : 1,
        transition: "all 0.25s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: isDark
            ? "0 8px 24px rgba(0,0,0,0.4)"
            : "0 8px 24px rgba(0,0,0,0.1)",
        },
      }}
    >
      {/* ===== عنوان اليوم ===== */}
      <Box sx={{ mb: 2, width: "100%", textAlign: "center" }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            mb: 0.5,
            color: isToday ? "#EC4899" : colors.text,
            fontSize: 18,
          }}
        >
          {dayName}
        </Typography>

        <Typography
          sx={{
            color: colors.subtext,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {date}
        </Typography>
      </Box>

      <Divider sx={{ mb: 2, borderColor: isDark ? "#444" : "#ddd" }} />

      {/* ===== الحصص الموجودة ===== */}
      {existingSlots.length > 0 && (
        <>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 700,
              color: colors.text,
              mb: 1,
            }}
          >
            {t("schedule.existing")}
          </Typography>

          {existingSlots.map((slot) => (
            <Paper
              key={slot._id}
              sx={{
                p: 1.5,
                mb: 1,
                borderRadius: 2,
                background: colors.card,
                border: isDark ? "1px solid #555" : "1px solid rgba(0,0,0,0.1)",
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    color: colors.text,
                    fontSize: 15,
                  }}
                >
                  {fmtTime(slot.startAt)} - {fmtTime(slot.endAt)}
                </Typography>

                {/* 🔥 زر الحذف فقط إذا لم تنتهِ الحصة */}
                {!isSlotPast(slot) && (
                  <Tooltip title={t("schedule.delete")} arrow>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => onDeleteExisting(slot._id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Paper>
          ))}

          <Divider sx={{ my: 2, borderColor: isDark ? "#444" : "#ddd" }} />
        </>
      )}

      {/* ===== الحصص الجديدة ===== */}
      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 700,
          color: colors.text,
          mb: 1,
        }}
      >
        {t("schedule.new")}
      </Typography>

      {newSlots.map((slot, idx) => (
        <Paper
          key={idx}
          sx={{
            width: "100%",
            display: "block",
            p: 1.5,
            mb: 1,
            borderRadius: 2,
            background: colors.newSlotBg,
            border: colors.newSlotBorder,
            boxSizing: "border-box",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              width: "100%",
              gap: 1,
            }}
          >
            <TextField
              label={t("schedule.from")}
              type="time"
              value={slot.startTime}
              onChange={(e) => onUpdateNew(idx, "startTime", e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label={t("schedule.to")}
              type="time"
              value={slot.endTime}
              onChange={(e) => onUpdateNew(idx, "endTime", e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <TextField
            label={t("schedule.capacity")}
            value={slot.capacity}
            type="number"
            fullWidth
            sx={{ mt: 1 }}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: 1,     // ⛔ يمنع 0 بالسهم
              step: 1,
            }}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val < 1) return; // ⛔ يمنع 0 والسلبي
              onUpdateNew(idx, "capacity", val);
            }}
          />


          <Box sx={{ width: "100%", textAlign: "right", mt: 1 }}>
            <Tooltip title={t("schedule.delete")} arrow>
              <IconButton
                color="error"
                size="small"
                onClick={() => onRemoveNew(idx)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>
      ))}

      {/* ===== زر إضافة حصة جديدة ===== */}
      {!isPast && (
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Tooltip title={t("schedule.add")} arrow>
            <IconButton
              onClick={onAddSlot}
              sx={{
                color: "#9B6FD6",
                "&:hover": { color: "#7C3AED" },
              }}
            >
              <AddCircleIcon sx={{ fontSize: 32 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Paper>
  );
}
