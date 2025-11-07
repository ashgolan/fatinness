// client/src/pages/admin/AdminSettings.jsx
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
  Divider,
} from "@mui/material";
import { uploadBrandImage } from "../../firebase/uploadImage";
import { Api } from "../../api/Api";
import { toast } from "react-toastify";
import BuildIcon from "@mui/icons-material/Build";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);

  // 🔹 جلب الإعدادات العامة
  const fetchSettings = async () => {
    console.log("🚀 بدء تحميل الإعدادات...");
    try {
      const { data } = await Api.get("/admin/settings");
      console.log("📦 البيانات القادمة من السيرفر:", data);
      
      const settingsData = Array.isArray(data) ? data[0] : data.settings || data;
      console.log("🧩 رابط الكارت من السيرفر:", settingsData.cardUrl || settingsData.CardUrl);


      // ✅ توحيد الأسماء (LogoUrl/CardUrl → logoUrl/cardUrl)
      const normalized = {
        ...settingsData,
        logoUrl: settingsData.logoUrl || settingsData.LogoUrl,
        cardUrl: settingsData.cardUrl || settingsData.CardUrl,
      };

      setSettings(normalized);
    } catch (error) {
      console.error("❌ فشل تحميل الإعدادات:", error);
      toast.error("فشل تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 جلب حالة الصيانة
  const fetchMaintenance = async () => {
    try {
      const { data } = await Api.get("/maintenance/status");
      setMaintenance(data.maintenanceMode);
    } catch {
      toast.error("فشل تحميل حالة النظام");
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchMaintenance();
  }, []);

  // 💾 حفظ الإعدادات
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

  // 🔹 دالة عامة لرفع أي نوع من الصور (logo أو card)
  const handleImageUpload = async (type) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // ✅ عرض معاينة فورية
      const preview = URL.createObjectURL(file);
      setSettings((prev) => ({
        ...prev,
        [type === "logo" ? "previewLogo" : "previewCard"]: preview,
      }));

      setUploading(true);
      try {
        console.log(`🔥 رفع ${type} إلى Firebase:`, file.name);

        // ✅ رفع الصورة إلى Firebase
        const downloadURL = await uploadBrandImage(file, type);

        // ✅ تحديث قاعدة البيانات
        await Api.put("/admin/settings", {
          [`${type}Url`]: downloadURL,
        });

        // ✅ تحديث الحالة لعرض الصورة فورًا
        setSettings((prev) => ({
          ...prev,
          [`${type}Url`]: downloadURL,
          [`preview${type === "logo" ? "Logo" : "Card"}`]: null,
        }));

        toast.success(`✅ تم رفع ${type === "logo" ? "الشعار" : "صورة الكارت"} بنجاح`);
      } catch (error) {
        console.error(error);
        toast.error(`❌ فشل رفع ${type === "logo" ? "الشعار" : "صورة الكارت"}`);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  // ⚙️ تبديل وضع الصيانة
  const toggleMaintenance = async () => {
    const confirmMsg = maintenance
      ? "هل ترغبين في إيقاف وضع الصيانة وتشغيل النظام؟"
      : "هل ترغبين في تفعيل وضع الصيانة؟ سيتم حظر جميع المشتركات مؤقتًا.";
    if (!window.confirm(confirmMsg)) return;

    setLoadingMaintenance(true);
    try {
      const { data } = await Api.put("/maintenance/toggle");
      setMaintenance(data.maintenanceMode);
      toast.success(data.message);
    } catch {
      toast.error("فشل تبديل وضع الصيانة ❌");
    } finally {
      setLoadingMaintenance(false);
    }
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
        {/* 🪪 صورة الكارت */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            🪪 صورة الكارت
          </Typography>

          <Fade in={!!(settings.previewCard || settings.cardUrl)} timeout={500}>
            <Box
              sx={{
                width: 220,
                height: 140,
                mx: "auto",
                mb: 1.5,
                borderRadius: 2,
                overflow: "hidden",
                border: "2px solid #ddd",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                backgroundColor: "#f9f9f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {settings.previewCard || settings.cardUrl ? (
                <img
                  src={settings.previewCard || settings.cardUrl}
                  alt="Card Preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  لا توجد صورة حالية
                </Typography>
              )}
            </Box>
          </Fade>

          <Button
            variant="outlined"
            disabled={uploading}
            onClick={() => handleImageUpload("card")}
          >
            {uploading ? <CircularProgress size={22} /> : "🪪 تغيير صورة الكارت"}
          </Button>
        </Box>

        {/* 🖼️ شعار النادي */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Fade in={!!(settings.previewLogo || settings.logoUrl)} timeout={500}>
            <Avatar
              src={settings.previewLogo || settings.logoUrl || ""}
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

          <Button
            variant="outlined"
            disabled={uploading}
            onClick={() => handleImageUpload("logo")}
          >
            {uploading ? <CircularProgress size={22} /> : "📸 تغيير الشعار"}
          </Button>
        </Box>

        {/* 🧾 الإعدادات العامة */}
        <TextField
          fullWidth
          label="🏷️ اسم النادي"
          value={settings.clubName || ""}
          onChange={(e) => setSettings({ ...settings, clubName: e.target.value })}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="📞 رقم التواصل"
          value={settings.contactNumber || ""}
          onChange={(e) => setSettings({ ...settings, contactNumber: e.target.value })}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="💬 الرسالة التلقائية"
          value={settings.autoMessage || ""}
          onChange={(e) => setSettings({ ...settings, autoMessage: e.target.value })}
          sx={{ mb: 2 }}
        />

        {/* 🧩 السماح بالحجوزات الإضافية */}
        <Box sx={{ textAlign: "center", mt: 4, mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={!!settings.allowExtraBookingsByDefault}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    allowExtraBookingsByDefault: e.target.checked,
                  })
                }
                color="primary"
              />
            }
            label="السماح بالحجوزات الإضافية افتراضيًا"
            sx={{
              textAlign: "center",
              "& .MuiFormControlLabel-label": {
                fontWeight: 600,
                fontSize: "1rem",
              },
            }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* ⚙️ وضع الصيانة */}
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography
            variant="subtitle1"
            sx={{
              mb: 2,
              fontWeight: 600,
              color: maintenance ? "#d32f2f" : "#2e7d32",
            }}
          >
            حالة النظام الحالية:{" "}
            {maintenance ? (
              <span style={{ color: "#d32f2f" }}>🚧 تحت الصيانة</span>
            ) : (
              <span style={{ color: "#2e7d32" }}>✅ يعمل بشكل طبيعي</span>
            )}
          </Typography>

          <Button
            variant="outlined"
            onClick={toggleMaintenance}
            disabled={loadingMaintenance}
            startIcon={maintenance ? <CheckCircleIcon /> : <BuildIcon />}
            sx={{
              px: 4,
              py: 1.3,
              borderRadius: "40px",
              textTransform: "none",
              fontWeight: 800,
              letterSpacing: "0.5px",
              fontSize: "1rem",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.4s ease",
              borderWidth: 2,
              borderStyle: "solid",
              borderColor: maintenance ? "#d32f2f" : "#1976d2",
              color: maintenance ? "#d32f2f" : "#1976d2",
              background: "transparent",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                width: 0,
                height: "100%",
                background: maintenance
                  ? "linear-gradient(90deg, #d32f2f, #ff9800)"
                  : "linear-gradient(90deg, #1976d2, #42a5f5)",
                zIndex: 0,
                transition: "width 0.4s ease",
                borderRadius: "40px",
              },
              "&:hover::before": { width: "100%" },
              "&:hover": {
                color: "#fff",
                boxShadow: maintenance
                  ? "0 0 12px rgba(211,47,47,0.4)"
                  : "0 0 12px rgba(25,118,210,0.4)",
              },
              "& .MuiButton-startIcon": { zIndex: 1 },
              "& span": { zIndex: 1 },
            }}
          >
            {loadingMaintenance ? (
              <CircularProgress size={24} color="inherit" sx={{ zIndex: 1 }} />
            ) : maintenance ? (
              "🔓 إيقاف وضع الصيانة"
            ) : (
              "🚧 تفعيل وضع الصيانة"
            )}
          </Button>
        </Box>

        {/* 💾 زر الحفظ */}
        <Box sx={{ textAlign: "center", mt: 5 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={saving}
            sx={{
              px: 4,
              py: 1.2,
              borderRadius: 3,
              textTransform: "none",
              fontWeight: 900,
              background: "linear-gradient(135deg, #9B1D6F, #FFD93D)",
              "&:hover": { filter: "brightness(1.08)" },
            }}
          >
            {saving ? <CircularProgress size={24} /> : "💾 حفظ التغييرات"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
