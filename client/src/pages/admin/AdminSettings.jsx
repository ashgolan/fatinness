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
import { useBrand } from "../../context/BrandContext"; // ✅ لا نغيرها

export default function AdminSettings() {
  const { updateBrand } = useBrand(); // ✅ تحديث الشعار والكارت في كل التطبيق

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);

  // 🔹 جلب الإعدادات العامة
  const fetchSettings = async () => {
    try {
      const { data } = await Api.get("/admin/settings");
      const settingsData = Array.isArray(data)
        ? data[0]
        : data.settings || data;

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

  // 💾 حفظ الإعدادات النصية
// 💾 حفظ الإعدادات النصية (مع تحقق قبل الحفظ)
const handleSave = async () => {
  // 🛑 التحقق من الحقول الأساسية
  if (!settings.clubName?.trim() || !settings.contactNumber?.trim()) {
    toast.error("يرجى ملء اسم النادي ورقم التواصل قبل الحفظ ⚠️");
    return;
  }

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


  // 🔹 رفع الصور (الشعار أو الكارت)
  const handleImageUpload = async (type) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const preview = URL.createObjectURL(file);
      setSettings((prev) => ({
        ...prev,
        [type === "logo" ? "previewLogo" : "previewCard"]: preview,
      }));

      toast.info(`جارٍ رفع ${type === "logo" ? "الشعار" : "صورة الكارت"}...`, {
        autoClose: 1500,
      });

      setUploading(true);
      try {
        const downloadURL = await uploadBrandImage(file, type);

        // ✅ تحديث قاعدة البيانات
        await Api.put("/admin/settings", {
          [`${type}Url`]: downloadURL,
        });

        // ✅ تحديث الحالة محليًا
        setSettings((prev) => ({
          ...prev,
          [`${type}Url`]: downloadURL,
          [`preview${type === "logo" ? "Logo" : "Card"}`]: null,
        }));

        // ✅ تحديث الـ context العام (يُحدث كل الصفحات)
        updateBrand((prev) => ({
          ...prev,
          [`${type}Url`]: downloadURL,
        }));

        toast.success(
          `✅ تم رفع ${type === "logo" ? "الشعار" : "صورة الكارت"} بنجاح`
        );
      } catch (error) {
        console.error(error);
        toast.error(`❌ فشل رفع ${type === "logo" ? "الشعار" : "صورة الكارت"}`);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  // ⚙️ وضع الصيانة
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
                opacity: uploading ? 0.6 : 1,
                transition: "opacity 0.5s ease",
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
                opacity: uploading ? 0.6 : 1,
                transition: "opacity 0.5s ease",
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
          onChange={(e) =>
            setSettings({ ...settings, clubName: e.target.value })
          }
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="📞 رقم التواصل"
          value={settings.contactNumber || ""}
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
          value={settings.autoMessage || ""}
          onChange={(e) =>
            setSettings({ ...settings, autoMessage: e.target.value })
          }
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
              borderWidth: 2,
              borderStyle: "solid",
              borderColor: maintenance ? "#d32f2f" : "#1976d2",
              color: maintenance ? "#d32f2f" : "#1976d2",
              "&:hover": {
                backgroundColor: maintenance ? "#d32f2f" : "#1976d2",
                color: "#fff",
              },
            }}
          >
            {loadingMaintenance ? (
              <CircularProgress size={24} color="inherit" />
            ) : maintenance ? (
              "🔓 إيقاف وضع الصيانة"
            ) : (
              "🚧 تفعيل وضع الصيانة"
            )}
          </Button>
        </Box>

        {/* 💾 زر الحفظ */}
        <Box sx={{ textAlign: "center", mt: 5 }}>
          <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
            <Button
              variant="outlined"
              onClick={handleSave}
              disabled={saving}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                px: 4,
                py: 1.2,
                borderRadius: 3,
                border: "2px solid #9B1D6F", // بنفسجي الهوية
                color: "#9B1D6F",
                background: "transparent",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: 1,
                "&:hover": {
                  background: "#9B1D6F10", // شفافية خفيفة من البنفسجي
                  borderColor: "#FFD93D",
                  color: "#FFD93D",
                  boxShadow: "0 0 8px #FFD93D40",
                },
                "&:disabled": {
                  opacity: 0.6,
                },
              }}
            >
              {saving ? (
                <CircularProgress size={22} sx={{ color: "#9B1D6F" }} />
              ) : (
                <>
                  💾{" "}
                  <Typography sx={{ fontWeight: 800 }}>
                    حفظ التغييرات
                  </Typography>
                </>
              )}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
