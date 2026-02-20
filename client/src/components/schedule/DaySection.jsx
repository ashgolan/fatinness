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
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { useThemeMode } from "../../context/ThemeContext";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
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
  onToggleBlockExisting,
  onUpdateExistingCapacity
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
  const [editingId, setEditingId] = React.useState(null);
  const colors = {
    bg: isDark ? "#1f1f1f" : "#fff",
    text: isDark ? "#e5e7eb" : "#111827",
    subtext: isDark ? "#9ca3af" : "rgba(0,0,0,0.6)",
    border: isDark ? "1px solid #444" : "1px solid rgba(0,0,0,0.08)",
    todayBorder: "2px solid #EC4899",
    pastBorder: isDark ? "2px solid #333" : "2px solid #e5e7eb",
    newSlotBg: isDark ? "#3b3342" : "#fff7ff",
    newSlotBorder: isDark ? "1px solid #5c4666" : "1px solid #f3c1df",
  };

  // ✅ الحصة منتهية؟
  function isSlotPast(slot) {
    if (!slot?.endAt) return false;
    return new Date(slot.endAt) < new Date();
  }

  const handleSaveCapacity = (value, slot) => {
    const newVal = Number(value);

    if (!newVal || newVal < 1) {
      return toast.error(t("adminSchedule.errors.invalidCapacity"));
    }

    if (newVal < slot.bookedCount) {
      return toast.error(t("adminSchedule.errors.capacityTooSmall"));
    }

    onUpdateExistingCapacity(
      slot._id,
      newVal,
      slot.bookedCount
    );

    setEditingId(null);
  };


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
            const blocked = slot.isBlocked === true;

            return (
              <Paper
                key={slot._id}
                elevation={0}
                sx={{
                  p: 1.4,
                  mb: 1,
                  borderRadius: 2,
                  background: "transparent",
                  border: blocked
                    ? "1px dashed rgba(245,158,11,0.75)"
                    : isDark
                      ? "1px solid rgba(148,163,184,0.25)"
                      : "1px solid rgba(15,23,42,0.12)",
                  opacity: blocked ? 0.6 : 1,
                  borderLeft: `3px solid ${slot.bookedCount >= slot.capacity ? "#ef4444" : "#6bd391"
                    }`,
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  {/* يسار: الوقت والعنوان */}
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: 15,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmtTime(slot.startAt)} – {fmtTime(slot.endAt)}
                    </Typography>

                    {/* عدد الحجوزات */}
                    {/* عدد الحجوزات */}
                    {editingId !== slot._id && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography
                          sx={{
                            fontSize: 11,
                            fontWeight: 800,
                            color:
                              slot.bookedCount >= slot.capacity
                                ? "#ef4444"
                                : slot.bookedCount >= slot.capacity * 0.8
                                  ? "#f59e0b"
                                  : "#30b561",
                          }}
                        >
                          {slot.bookedCount}/{slot.capacity}
                        </Typography>

                        {!isSlotPast(slot) && !blocked && (
                          <Tooltip title={t("adminSchedule.editCapacity")} arrow>
                            <IconButton
                              size="small"
                              onClick={() => setEditingId(slot._id)}
                              sx={{
                                background: "rgba(155,111,214,0.12)",
                                "&:hover": {
                                  background: "rgba(155,111,214,0.25)",
                                },
                                width: 28,
                                height: 28,
                              }}
                            >
                              <EditRoundedIcon sx={{ fontSize: 16, color: "#9B6FD6" }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    )}

                    {/* وضع التعديل */}
                    {editingId === slot._id && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>

                        <TextField
                          size="small"
                          type="number"
                          autoFocus
                          defaultValue={slot.capacity}
                          inputProps={{
                            min: slot.bookedCount || 1,
                            style: { width: 60, textAlign: "center" }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveCapacity(e.target.value, slot);
                            }
                          }}
                        />

                        <IconButton
                          size="small"
                          onClick={(e) => {
                            const input = e.currentTarget.parentElement.querySelector("input");
                            handleSaveCapacity(input.value, slot);
                          }}
                          sx={{ color: "#10b981" }}
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>

                        <IconButton
                          size="small"
                          onClick={() => setEditingId(null)}
                          sx={{
                            color: "#ef4444",
                            background: "rgba(239,68,68,0.08)",
                            "&:hover": {
                              background: "rgba(239,68,68,0.18)",
                            },
                            width: 28,
                            height: 28,
                          }}
                        >
                          <CloseRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>

                      </Box>
                    )}

                    {slot.title && (
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: "#EC4899",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 160,
                        }}
                      >
                        ✨ {slot.title}
                      </Typography>
                    )}

                    {blocked && (
                      <Typography
                        variant="caption"
                        sx={{ color: "#f59e0b", fontWeight: 800 }}
                      >
                        {t("slotsAdmin.status.blocked")}
                      </Typography>
                    )}
                  </Box>

                  {/* يمين: الأزرار */}
                  <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                    {/* ✅ زر تعطيل/تفعيل */}
                    {!isSlotPast(slot) && (
                      <Tooltip
                        title={
                          slot.isBlocked
                            ? t("slotsAdmin.dialog.activate")
                            : t("slotsAdmin.dialog.deactivate")
                        }
                        arrow
                      >
                        <IconButton
                          size="small"
                          onClick={() => onToggleBlockExisting(slot)}
                          sx={{ color: slot.isBlocked ? "#10b981" : "#ef4444" }}
                        >
                          {slot.isBlocked ? (
                            <CheckCircleIcon fontSize="small" />
                          ) : (
                            <BlockIcon fontSize="small" />
                          )}
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
          <Box sx={{ display: "flex", flexWrap: "wrap", width: "100%", gap: 1 }}>
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
            inputProps={{ min: 1, step: 1 }}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val < 1) return;
              onUpdateNew(idx, "capacity", val);
            }}
          />

          <Box sx={{ width: "100%", textAlign: "right", mt: 1 }}>
            <Tooltip title={t("schedule.delete")} arrow>
              <IconButton color="error" size="small" onClick={() => onRemoveNew(idx)}>
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
            <IconButton onClick={onAddSlot} sx={{ color: "#9B6FD6" }}>
              <AddCircleIcon sx={{ fontSize: 32 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Paper>
  );
}
