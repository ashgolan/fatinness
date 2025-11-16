import React from "react";
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
  const { mode } = useThemeMode();
  const isDark = mode === "dark";

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
            الحصص الموجودة:
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
                  {slot.startTime} - {slot.endTime}
                </Typography>

                <Tooltip title="حذف الحصة" arrow>
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => onDeleteExisting(slot._id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
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
        حصص جديدة:
      </Typography>

      {newSlots.map((slot, idx) => (
        <Paper
          key={idx}
          sx={{
            width: "100%", // ⬅⬅⬅ الحل الأساسي
            display: "block", // ⬅ لضمان التمدد بدون ضغط
            p: 1.5,
            mb: 1,
            borderRadius: 2,
            background: colors.newSlotBg,
            border: colors.newSlotBorder,
            boxSizing: "border-box", // ⬅ مهم لمنع الانكماش
          }}
        >
          {/* وقت البداية والنهاية */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              width: "100%",
              gap: 1,
            }}
          >
            <TextField
              label="من"
              type="time"
              value={slot.startTime}
              onChange={(e) => onUpdateNew(idx, "startTime", e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="إلى"
              type="time"
              value={slot.endTime}
              onChange={(e) => onUpdateNew(idx, "endTime", e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          {/* السعة */}
          <TextField
            label="السعة"
            value={slot.capacity}
            onChange={(e) => onUpdateNew(idx, "capacity", e.target.value)}
            type="number"
            fullWidth
            sx={{ mt: 1 }}
            InputLabelProps={{ shrink: true }}
          />

          {/* زر الحذف */}
          <Box sx={{ width: "100%", textAlign: "right", mt: 1 }}>
            <Tooltip title="حذف" arrow>
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

      {/* زر إضافة حصة */}
      {!isPast && (
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Tooltip title="إضافة حصة جديدة" arrow>
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
