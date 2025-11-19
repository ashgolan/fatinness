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
  IconButton,
  Dialog,
  DialogContent,
} from "@mui/material";

import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
import BuildIcon from "@mui/icons-material/Build";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { uploadBrandImage } from "../../firebase/uploadImage";
import { Api } from "../../api/Api";
import { toast } from "react-toastify";
import { useBrand } from "../../context/BrandContext";
import { useTranslation } from "react-i18next";
import CloseIcon from "@mui/icons-material/Close";

export default function AdminSettings() {
  const { t } = useTranslation();
  const { updateBrand } = useBrand();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // =============================
  //   جلب الإعدادات
  // =============================
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

      const gallery = await Api.get("/gallery");
      normalized.galleryImages = gallery.data;

      setSettings(normalized);
    } catch (error) {
      toast.error(t("adminSettings.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const fetchMaintenance = async () => {
    try {
      const { data } = await Api.get("/maintenance/status");
      setMaintenance(data.maintenanceMode);
    } catch {
      toast.error(t("adminSettings.errors.maintenanceLoadFailed"));
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchMaintenance();
  }, []);

  // =============================
  //      حفظ الإعدادات
  // =============================
  const handleSave = async () => {
    if (!settings.clubName?.trim() || !settings.contactNumber?.trim()) {
      toast.error(t("adminSettings.errors.required"));
      return;
    }

    try {
      setSaving(true);
      await Api.put("/admin/settings", settings);
      toast.success(t("adminSettings.success.saved"));
    } catch {
      toast.error(t("adminSettings.errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  // =============================
  //   رفع صورة للألبوم
  // =============================
  const uploadGalleryImage = () => {
    if ((settings.galleryImages?.length || 0) >= 10)
      return toast.error(t("adminSettings.gallery.maxImages"));

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setUploading(true);
      try {
        const url = await uploadBrandImage(file, "gallery");
        const { data } = await Api.post("/gallery", { url });

        setSettings((prev) => ({
          ...prev,
          galleryImages: [...prev.galleryImages, data],
        }));

        toast.success(t("adminSettings.gallery.uploadSuccess"));
      } catch {
        toast.error(t("adminSettings.gallery.uploadFailed"));
      } finally {
        setUploading(false);
      }
    };

    input.click();
  };

  // =============================
  //   رفع اللوغو أو الكارت
  // =============================
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

      setUploading(true);
      try {
        const downloadURL = await uploadBrandImage(file, type);
        await Api.put("/admin/settings", {
          [`${type}Url`]: downloadURL,
        });

        setSettings((prev) => ({
          ...prev,
          [`${type}Url`]: downloadURL,
          [`preview${type === "logo" ? "Logo" : "Card"}`]: null,
        }));

        updateBrand((prev) => ({
          ...prev,
          [`${type}Url`]: downloadURL,
        }));

        toast.success(t("adminSettings.success.imageUpdated"));
      } catch {
        toast.error(t("adminSettings.errors.uploadFailed"));
      } finally {
        setUploading(false);
      }
    };

    input.click();
  };

  // =============================
  //   وضع الصيانة
  // =============================
  const toggleMaintenance = async () => {
    if (
      !window.confirm(
        maintenance
          ? t("adminSettings.maintenance.confirmDisable")
          : t("adminSettings.maintenance.confirmEnable")
      )
    )
      return;

    setLoadingMaintenance(true);
    try {
      const { data } = await Api.put("/maintenance/toggle");
      setMaintenance(data.maintenanceMode);
      toast.success(data.message);
    } catch {
      toast.error(t("adminSettings.errors.maintenanceToggleFailed"));
    } finally {
      setLoadingMaintenance(false);
    }
  };

  if (loading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ maxWidth: 850, mx: "auto", mt: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        {t("adminSettings.title")}
      </Typography>

      <Paper sx={{ p: 3, borderRadius: "20px" }}>
        {/* ألبوم الصور */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          {t("adminSettings.gallery.title")} ({settings.galleryImages.length}/10)
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: 2,
            mb: 3,
          }}
        >
          {settings.galleryImages.map((img) => (
            <Box
              key={img._id}
              sx={{
                position: "relative",
                borderRadius: 2,
                overflow: "hidden",
                cursor: "pointer",
                "&:hover img": { opacity: 0.85 },
              }}
            >
              <img
                src={img.url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onClick={() => {
                  setPreviewImage(img.url);
                  setGalleryOpen(true);
                }}
              />

              <Button
                variant="contained"
                color="error"
                size="small"
                sx={{
                  position: "absolute",
                  top: 5,
                  right: 5,
                  minWidth: "32px",
                  height: "32px",
                  borderRadius: "50%",
                }}
                onClick={async () => {
                  if (!window.confirm(t("adminSettings.gallery.confirmDelete")))
                    return;

                  try {
                    await Api.delete(`/gallery/${img._id}`);
                    setSettings((prev) => ({
                      ...prev,
                      galleryImages: prev.galleryImages.filter(
                        (g) => g._id !== img._id
                      ),
                    }));
                    toast.success(t("adminSettings.gallery.deleteSuccess"));
                  } catch {
                    toast.error(t("adminSettings.gallery.deleteFailed"));
                  }
                }}
              >
                <DeleteIcon fontSize="small" />
              </Button>
            </Box>
          ))}
        </Box>

        <Button
          variant="outlined"
          startIcon={<AddPhotoAlternateIcon />}
          onClick={uploadGalleryImage}
          disabled={uploading || settings.galleryImages.length >= 10}
          sx={{ mb: 3 }}
        >
          {uploading ? (
            <CircularProgress size={22} />
          ) : (
            t("adminSettings.gallery.addImage")
          )}
        </Button>

        <Divider sx={{ my: 3 }} />

        {/* الكارت */}
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          {t("adminSettings.card.title")}
        </Typography>

        <Fade in={!!(settings.previewCard || settings.cardUrl)}>
          <Box
            sx={{
              width: 220,
              height: 140,
              mx: "auto",
              mb: 2,
              borderRadius: 2,
              overflow: "hidden",
              border: "2px solid #ddd",
            }}
          >
            <img
              src={settings.previewCard || settings.cardUrl}
              alt="Card Preview"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Box>
        </Fade>

        <Button
          variant="outlined"
          onClick={() => handleImageUpload("card")}
          sx={{ mb: 4 }}
        >
          {t("adminSettings.card.change")}
        </Button>

        {/* اللوغو */}
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          {t("adminSettings.logo.title")}
        </Typography>

        <Avatar
          src={settings.previewLogo || settings.logoUrl}
          sx={{
            width: 120,
            height: 120,
            mx: "auto",
            mb: 2,
            border: "3px solid #ccc",
          }}
        />

        <Button
          variant="outlined"
          onClick={() => handleImageUpload("logo")}
          sx={{ mb: 4 }}
        >
          {t("adminSettings.logo.change")}
        </Button>

        <Divider sx={{ my: 3 }} />

        {/* نصوص الإعدادات */}
        <TextField
          fullWidth
          label={t("adminSettings.fields.clubName")}
          value={settings.clubName}
          onChange={(e) =>
            setSettings({ ...settings, clubName: e.target.value })
          }
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label={t("adminSettings.fields.contactNumber")}
          value={settings.contactNumber}
          onChange={(e) =>
            setSettings({ ...settings, contactNumber: e.target.value })
          }
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label={t("adminSettings.fields.autoMessage")}
          multiline
          minRows={3}
          value={settings.autoMessage}
          onChange={(e) =>
            setSettings({ ...settings, autoMessage: e.target.value })
          }
          sx={{ mb: 2 }}
        />

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
            />
          }
          label={t("adminSettings.fields.allowExtraBookings")}
        />

        <Divider sx={{ my: 3 }} />

        {/* وضع الصيانة */}
        <Typography
          sx={{
            mb: 2,
            fontWeight: 700,
            color: maintenance ? "#d32f2f" : "#2e7d32",
          }}
        >
          {maintenance
            ? t("adminSettings.maintenance.enabled")
            : t("adminSettings.maintenance.disabled")}
        </Typography>

        <Button
          variant="outlined"
          onClick={toggleMaintenance}
          disabled={loadingMaintenance}
          startIcon={maintenance ? <CheckCircleIcon /> : <BuildIcon />}
          sx={{ mb: 3 }}
        >
          {loadingMaintenance ? (
            <CircularProgress size={22} />
          ) : maintenance ? (
            t("adminSettings.maintenance.disable")
          ) : (
            t("adminSettings.maintenance.enable")
          )}
        </Button>

        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Button
            variant="outlined"
            onClick={handleSave}
            disabled={saving}
            sx={{ px: 4, py: 1.2, fontWeight: 800 }}
          >
            {saving ? (
              <CircularProgress size={22} />
            ) : (
              t("adminSettings.actions.save")
            )}
          </Button>
        </Box>
      </Paper>

      {/* Lightbox */}
      <Dialog
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        maxWidth="lg"
        PaperProps={{
          sx: {
            background: "rgba(0,0,0,0.85)",
            boxShadow: "none",
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            position: "relative",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <IconButton
            onClick={() => setGalleryOpen(false)}
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              color: "#fff",
              zIndex: 10,
            }}
          >
            <CloseIcon sx={{ fontSize: 32 }} />
          </IconButton>

          <img
            src={previewImage}
            alt="preview"
            style={{
              maxWidth: "900px",
              maxHeight: "90vh",
              borderRadius: "8px",
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
