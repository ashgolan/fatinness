import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Api } from "../../api/Api";
import { toast } from "react-toastify";

export default function TemplatesAdmin() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // إنشاء القالب
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slots, setSlots] = useState([]);

  // تطبيق القالب
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [startDate, setStartDate] = useState("");

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await Api.get("/admin/templates");
      setTemplates(data);
    } catch (err) {
      toast.error("حدث خطأ أثناء جلب القوالب");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreate = async () => {
    if (!name || !slots.length)
      return toast.error("يجب إدخال اسم القالب وإضافة ساعات");

    const validSlots = slots.filter(
      (s) =>
        s.startTime &&
        s.endTime &&
        s.capacity &&
        typeof s.dateOffset === "number"
    );

    if (!validSlots.length) return toast.error("أدخلي بيانات صحيحة لكل ساعة");

    try {
      await Api.post("/admin/templates", { name, slots: validSlots });
      toast.success("تم إنشاء القالب بنجاح");
      setOpen(false);
      setName("");
      setSlots([]);
      fetchTemplates();
    } catch (err) {
      toast.error(err?.response?.data?.message || "تعذر إنشاء القالب");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنتِ متأكدة من حذف هذا القالب؟")) return;
    try {
      await Api.delete(`/admin/templates/${id}`);
      toast.success("تم حذف القالب");
      fetchTemplates();
    } catch {
      toast.error("تعذر الحذف");
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        إدارة القوالب الأسبوعية
      </Typography>

      <Button variant="contained" sx={{ mb: 2 }} onClick={() => setOpen(true)}>
        إنشاء قالب جديد
      </Button>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : templates.length ? (
        <Grid container spacing={2}>
          {templates.map((t) => (
            <Grid item xs={12} md={6} key={t._id}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6">{t.name}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  🕓 عدد الساعات: {t.slots.length}
                </Typography>

                <Box sx={{ mt: 1, mb: 1 }}>
                  {t.slots.map((s, i) => {
                    const days = [
                      "الأحد",
                      "الاثنين",
                      "الثلاثاء",
                      "الأربعاء",
                      "الخميس",
                      "الجمعة",
                      "السبت",
                    ];
                    return (
                      <Typography key={i} variant="body2" color="text.secondary">
                        {days[s.dateOffset]}: {s.startTime} - {s.endTime} (سعة:{" "}
                        {s.capacity || "∞"})
                      </Typography>
                    );
                  })}
                </Box>

                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  sx={{ mt: 2 }}
                  onClick={() => handleDelete(t._id)}
                >
                  حذف
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ mt: 2, ml: 1 }}
                  onClick={() => {
                    setSelectedTemplate(t);
                    setApplyOpen(true);
                  }}
                >
                  تطبيق القالب
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography>لا توجد قوالب بعد.</Typography>
      )}

      {/* 🔹 نافذة إنشاء قالب جديد */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>إنشاء قالب أسبوعي جديد</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <TextField
            label="اسم القالب"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />

          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            الساعات داخل القالب:
          </Typography>

          {slots.map((slot, i) => (
            <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <TextField
                select
                label="اليوم"
                SelectProps={{ native: true }}
                value={slot.dateOffset}
                onChange={(e) => {
                  const updated = [...slots];
                  updated[i].dateOffset = Number(e.target.value);
                  setSlots(updated);
                }}
                sx={{ width: "140px" }}
              >
                <option value={0}>الأحد</option>
                <option value={1}>الاثنين</option>
                <option value={2}>الثلاثاء</option>
                <option value={3}>الأربعاء</option>
                <option value={4}>الخميس</option>
                <option value={5}>الجمعة</option>
                <option value={6}>السبت</option>
              </TextField>

              <TextField
                label="من"
                type="time"
                value={slot.startTime}
                onChange={(e) => {
                  const updated = [...slots];
                  updated[i].startTime = e.target.value;
                  setSlots(updated);
                }}
                sx={{ flex: 1 }}
              />

              <TextField
                label="إلى"
                type="time"
                value={slot.endTime}
                onChange={(e) => {
                  const updated = [...slots];
                  updated[i].endTime = e.target.value;
                  setSlots(updated);
                }}
                sx={{ flex: 1 }}
              />

              <TextField
                label="السعة"
                type="number"
                value={slot.capacity}
                onChange={(e) => {
                  const updated = [...slots];
                  updated[i].capacity = e.target.value;
                  setSlots(updated);
                }}
                sx={{ width: "100px" }}
              />

              <Button
                color="error"
                onClick={() => setSlots(slots.filter((_, idx) => idx !== i))}
              >
                حذف
              </Button>
            </Box>
          ))}

          <Button
            variant="outlined"
            onClick={() =>
              setSlots([
                ...slots,
                { startTime: "", endTime: "", capacity: "", dateOffset: 0 },
              ])
            }
          >
            إضافة ساعة جديدة
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>إلغاء</Button>
          <Button variant="contained" onClick={handleCreate}>
            إنشاء
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🔹 نافذة تطبيق القالب */}
      <Dialog open={applyOpen} onClose={() => setApplyOpen(false)}>
        <DialogTitle>تطبيق القالب على أسبوع</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <Typography variant="body2">
            القالب المختار: <b>{selectedTemplate?.name}</b>
          </Typography>
          <TextField
            label="تاريخ بداية الأسبوع"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyOpen(false)}>إلغاء</Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!startDate) return toast.error("اختاري تاريخ البداية أولاً");
              try {
                const { data } = await Api.post("/admin/templates/apply", {
                  templateId: selectedTemplate._id,
                  startDate,
                });
                toast.success(
                  `تم تطبيق القالب وإنشاء ${data.created} حصة جديدة 🎉`
                );
                setApplyOpen(false);
                setStartDate("");
              } catch (err) {
                toast.error(
                  err?.response?.data?.message ||
                    "حدث خطأ أثناء تطبيق القالب"
                );
              }
            }}
          >
            تطبيق
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
