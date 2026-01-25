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
import ReplayIcon from "@mui/icons-material/Replay";

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
  onReactivateExisting, // ✅ جديد

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

          {existingSlots.map((slot) => {
            const isDeleted = slot.isDeleted === true;

            return (
              <Paper
                key={slot._id}
                sx={{
                  p: 1.5,
                  mb: 1,
                  borderRadius: 2,
                  background: isDeleted
                    ? "rgba(148,163,184,0.15)"
                    : colors.card,
                  border: isDeleted
                    ? "1px dashed rgba(148,163,184,0.6)"
                    : isDark
                      ? "1px solid #555"
                      : "1px solid rgba(0,0,0,0.1)",
                  opacity: isDeleted ? 0.6 : 1,
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "nowrap",          // ⭐ يمنع التقسيم
                    gap: 1,
                    overflow: "hidden",          // ⭐ يمنع النزول
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "nowrap",
                        overflow: "hidden",
                        minWidth: 0,                // ⭐ مهم جدًا مع ellipsis
                      }}
                    >
                      {/* ⏰ الوقت */}
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: 15,
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {fmtTime(slot.startAt)} – {fmtTime(slot.endAt)}
                      </Typography>

                      {/* ✨ العنوان */}
                      {slot.title && (
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: "#EC4899",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 120,             // ⭐ حتى لا يزاحم الأزرار
                          }}
                        >
                          ✨ {slot.title}
                        </Typography>
                      )}

                    </Box>



                    {isDeleted && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#6b7280",
                          fontWeight: 700,
                          ml: 1,
                        }}
                      >
                        {t("adminSchedule.cancelled")}
                      </Typography>
                    )}

                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      flexShrink: 0,              // ⭐ لا تنكمش أبدًا
                    }}
                  >
                    {/* ♻️ إعادة تفعيل */}
                    {isDeleted && !isSlotPast(slot) && (
                      <Tooltip title={t("adminSchedule.reactivate")} arrow>
                        <IconButton
                          size="small"
                          onClick={() => onReactivateExisting(slot._id)}
                          sx={{ color: "#10b981" }}
                        >
                          <ReplayIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {/* 🗑️ حذف */}
                    {!isSlotPast(slot) && (
                      <Tooltip title={t("schedule.delete")} arrow>
                        <IconButton
                          size="small"
                          disabled={isDeleted}
                          onClick={() => onDeleteExisting(slot._id)}
                          sx={{ color: isDeleted ? "#9ca3af" : "#ef4444" }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>


                </Box>
              </Paper>
            );
          })}


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
              label={t("adminSchedule.slotTitle")}
              placeholder={t("adminSchedule.slotTitlePlaceholder")}
              value={slot.title || ""}
              onChange={(e) => onUpdateNew(idx, "title", e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 1 }}
            />

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
