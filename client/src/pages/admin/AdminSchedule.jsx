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
} from "@mui/material";
import { Api } from "../../api/Api";
import { toast } from "react-toastify";

// 🗓️ أدوات التاريخ
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
  const [tab, setTab] = useState(0);
  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const [weekData, setWeekData] = useState(null);
  const [nextWeekData, setNextWeekData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentEdits, setCurrentEdits] = useState({});
  const [nextWeek, setNextWeek] = useState([]);

  // === تحميل الأسبوع الحالي ===
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

  // === تحميل الأسبوع القادم ===
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
  }, []);

  // === إضافة أو تعديل ===
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
    if (!window.confirm("هل تريد حذف هذه الحصة؟")) return;
    try {
      await Api.delete(`/admin/slots/${id}`);
      toast.success("تم الحذف بنجاح");
      fetchCurrentWeek();
    } catch {
      toast.error("فشل الحذف");
    }
  };

  // === حفظ الأسبوع الحالي ===
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

  // === إدارة الأسبوع القادم ===
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

      await fetchNextWeek(); // ✅ عرضها مباشرة
      setNextWeek(Array.from({ length: 7 }, (_, i) => ({ dayOffset: i, items: [] })));
      setTab(1);
    } catch {
      toast.error("❌ فشل إنشاء الأسبوع القادم");
    }
  };

  // === العرض ===
  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 3, mb: 6 }}>
      <Typography variant="h5" gutterBottom>
        🗓️ إدارة الجدول الأسبوعي
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="الأسبوع الحالي" />
        <Tab label="الأسبوع القادم" />
      </Tabs>

      {/* الأسبوع الحالي */}
      {tab === 0 && (
        <>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3} rowGap={4}>
              {Array.from({ length: 7 }, (_, i) => {
                const d = addDays(weekStart, i);
                const key = fmt(d);
                const existing = weekData?.days?.[key] || [];
                const pending = currentEdits[key] || [];
                const past = isPastDay(d);

                return (
                  <Grid item xs={12} sm={6} md={4} key={key}>
                    <Paper
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        minHeight: 220,
                        backgroundColor: past ? "#f2f2f2" : "white",
                        opacity: past ? 0.7 : 1,
                      }}
                    >
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, textAlign: "center" }}>
                        {dayNames[i]} — {key}
                      </Typography>

                      <Stack spacing={0.6} sx={{ mb: 2 }}>
                        {existing.map((s) => (
                          <Chip
                            key={s._id}
                            label={`${s.startTime} - ${s.endTime} (سعة ${s.capacity})`}
                            onDelete={() => deleteSlot(s._id)}
                            color="primary"
                            sx={{ fontSize: 13 }}
                          />
                        ))}

                        {pending.map((s, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr 0.7fr auto",
                              gap: 0.3,
                              alignItems: "center",
                            }}
                          >
                            <TextField
                              type="time"
                              size="small"
                              value={s.startTime}
                              onChange={(e) => updateSlot(key, idx, "startTime", e.target.value)}
                              sx={{ "& input": { fontSize: 13, py: 0.3 } }}
                            />
                            <TextField
                              type="time"
                              size="small"
                              value={s.endTime}
                              onChange={(e) => updateSlot(key, idx, "endTime", e.target.value)}
                              sx={{ "& input": { fontSize: 13, py: 0.3 } }}
                            />
                            <TextField
                              type="number"
                              size="small"
                              value={s.capacity}
                              onChange={(e) => updateSlot(key, idx, "capacity", e.target.value)}
                              sx={{ "& input": { fontSize: 13, py: 0.3, textAlign: "center" } }}
                            />
                            <Button
                              color="error"
                              size="small"
                              onClick={() => removeSlot(key, idx)}
                              sx={{ minWidth: 25 }}
                            >
                              ✕
                            </Button>
                          </Box>
                        ))}
                      </Stack>

                      <Button variant="outlined" fullWidth onClick={() => addSlot(i)} disabled={past}>
                        + أضف ساعة
                      </Button>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Button variant="contained" color="success" onClick={saveChanges}>
              💾 حفظ التغييرات
            </Button>
          </Box>
        </>
      )}

      {/* الأسبوع القادم */}
      {tab === 1 && (
        <>
          <Grid container spacing={3} rowGap={4}>
            {Array.from({ length: 7 }, (_, i) => {
              const date = fmt(addDays(addDays(weekStart, 7), i));
              const slots = nextWeekData?.days?.[date] || [];
              return (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Paper sx={{ p: 2, borderRadius: 2, minHeight: 220 }}>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, textAlign: "center" }}>
                      {dayNames[i]} — {date}
                    </Typography>

                    <Stack spacing={0.6} sx={{ mb: 2 }}>
                      {slots.map((s) => (
                        <Chip
                          key={s._id}
                          label={`${s.startTime} - ${s.endTime} (سعة ${s.capacity})`}
                          color="primary"
                          sx={{ fontSize: 13 }}
                        />
                      ))}

                      {nextWeek[i]?.items.map((s, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 0.7fr auto",
                            gap: 0.3,
                            alignItems: "center",
                          }}
                        >
                          <TextField
                            type="time"
                            size="small"
                            value={s.startTime}
                            onChange={(e) =>
                              updateNextSlot(i, idx, "startTime", e.target.value)
                            }
                            sx={{ "& input": { fontSize: 13, py: 0.3 } }}
                          />
                          <TextField
                            type="time"
                            size="small"
                            value={s.endTime}
                            onChange={(e) =>
                              updateNextSlot(i, idx, "endTime", e.target.value)
                            }
                            sx={{ "& input": { fontSize: 13, py: 0.3 } }}
                          />
                          <TextField
                            type="number"
                            size="small"
                            value={s.capacity}
                            onChange={(e) =>
                              updateNextSlot(i, idx, "capacity", e.target.value)
                            }
                            sx={{ "& input": { fontSize: 13, py: 0.3, textAlign: "center" } }}
                          />
                          <Button
                            color="error"
                            size="small"
                            onClick={() => removeNextSlot(i, idx)}
                            sx={{ minWidth: 25 }}
                          >
                            ✕
                          </Button>
                        </Box>
                      ))}
                    </Stack>

                    <Button variant="outlined" fullWidth onClick={() => addNextSlot(i)}>
                      + أضف ساعة
                    </Button>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>

          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Button variant="contained" color="success" onClick={saveNextWeek}>
              💾 حفظ الأسبوع القادم
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
