import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  CircularProgress,
  Avatar,
  Fade,
} from "@mui/material";
import { Api } from "../../api/Api";
import { toast } from "react-toastify";

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);

  const fetchSettings = async () => {
    try {
      const { data } = await Api.get("/admin/settings");
      setSettings(data);
    } catch {
      toast.error("فشل تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await Api.put("/admin/settings", settings);
      toast.success("تم حفظ التغييرات بنجاح ✅");
    } catch {
      toast.error("فشل حفظ الإعدادات ❌");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async () => {
    // إنشاء input يدوي خارج React
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // 🔹 عرض فوري داخل نفس الدائرة
      const preview = URL.createObjectURL(file);
      setSettings((prev) => ({ ...prev, previewLogo: preview }));
      setFadeKey((prev) => prev + 1);

      // 🔹 رفع الصورة للسيرفر
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("logo", file);
        const { data } = await Api.post("/admin/settings/logo", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setSettings((prev) => ({
          ...prev,
          logoUrl: data.logoUrl,
          previewLogo: null,
        }));
        setFadeKey((prev) => prev + 1);
        toast.success("تم رفع الشعار بنجاح ✅");
      } catch {
        toast.error("فشل رفع الشعار ❌");
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        ⚙️ الإعدادات العامة للنادي
      </Typography>

      <Paper sx={{ p: 3 }}>
        {/* 🖼️ قسم الشعار */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Fade in key={fadeKey} timeout={500}>
            <Avatar
              src={
                settings.previewLogo
                  ? settings.previewLogo
                  : settings.logoUrl || ""
              }
              alt="Club Logo"
              sx={{
                width: 120,
                height: 120,
                mx: "auto",
                mb: 1,
                border: "3px solid #ccc",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                objectFit: "cover",
              }}
            />
          </Fade>

          {/* ✅ الزر يستدعي رفع الشعار */}
          <Button
            variant="outlined"
            disabled={uploading}
            onClick={handleLogoUpload}
          >
            {uploading ? <CircularProgress size={22} /> : "📸 تغيير الشعار"}
          </Button>
        </Box>

        {/* 🧾 باقي الإعدادات */}
        <TextField
          fullWidth
          label="🏷️ اسم النادي"
          value={settings.clubName}
          onChange={(e) =>
            setSettings({ ...settings, clubName: e.target.value })
          }
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="📞 رقم التواصل"
          value={settings.contactNumber}
          onChange={(e) =>
            setSettings({ ...settings, contactNumber: e.target.value })
          }
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="💬 الرسالة التلقائية"
          value={settings.autoMessage}
          onChange={(e) =>
            setSettings({ ...settings, autoMessage: e.target.value })
          }
          sx={{ mb: 2 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.allowExtraBookingsByDefault}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  allowExtraBookingsByDefault: e.target.checked,
                })
              }
            />
          }
          label="السماح بالحجوزات الإضافية افتراضيًا"
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          sx={{ mt: 3 }}
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} /> : "💾 حفظ التغييرات"}
        </Button>
      </Paper>
    </Box>
  );
}
