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
import { useBrand } from "../../context/BrandContext";
import { useTranslation } from "react-i18next";

export default function AdminSettings() {
  const { t } = useTranslation();
  const { updateBrand } = useBrand();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);

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
      toast.error(t("adminSettings.errors.loadFail"));
    } finally {
      setLoading(false);
    }
  };

  const fetchMaintenance = async () => {
    try {
      const { data } = await Api.get("/maintenance/status");
      setMaintenance(data.maintenanceMode);
    } catch {
      toast.error(t("adminSettings.errors.maintenanceFail"));
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchMaintenance();
  }, []);

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
      toast.error(t("adminSettings.errors.saveFail"));
    } finally {
      setSaving(false);
    }
  };

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

      toast.info(
        t(
          type === "logo"
            ? "adminSettings.uploading.logo"
            : "adminSettings.uploading.card"
        ),
        { autoClose: 1500 }
      );

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

        toast.success(
          t(
            type === "logo"
              ? "adminSettings.success.logoUploaded"
              : "adminSettings.success.cardUploaded"
          )
        );
      } catch {
        toast.error(
          t(
            type === "logo"
              ? "adminSettings.errors.logoFail"
              : "adminSettings.errors.cardFail"
          )
        );
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const toggleMaintenance = async () => {
    const confirmMsg = maintenance
      ? t("adminSettings.confirm.disableMaintenance")
      : t("adminSettings.confirm.enableMaintenance");

    if (!window.confirm(confirmMsg)) return;

    setLoadingMaintenance(true);
    try {
      const { data } = await Api.put("/maintenance/toggle");
      setMaintenance(data.maintenanceMode);
      toast.success(data.message);
    } catch {
      toast.error(t("adminSettings.errors.maintenanceToggleFail"));
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
        {t("adminSettings.title")}
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            {t("adminSettings.cardImage")}
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
                backgroundColor: "#f9f9f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: uploading ? 0.6 : 1
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
                  {t("adminSettings.noImage")}
                </Typography>
              )}
            </Box>
          </Fade>

          <Button
            variant="outlined"
            disabled={uploading}
            onClick={() => handleImageUpload("card")}
          >
            {uploading ? (
              <CircularProgress size={22} />
            ) : (
              t("adminSettings.changeCard")
            )}
          </Button>
        </Box>

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
                objectFit: "cover",
                opacity: uploading ? 0.6 : 1
              }}
            />
          </Fade>

          <Button
            variant="outlined"
            disabled={uploading}
            onClick={() => handleImageUpload("logo")}
          >
            {uploading ? (
              <CircularProgress size={22} />
            ) : (
              t("adminSettings.changeLogo")
            )}
          </Button>
        </Box>

        <TextField
          fullWidth
          label={t("adminSettings.clubName")}
          value={settings.clubName || ""}
          onChange={(e) =>
            setSettings({ ...settings, clubName: e.target.value })
          }
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label={t("adminSettings.contactNumber")}
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
          label={t("adminSettings.autoMessage")}
          value={settings.autoMessage || ""}
          onChange={(e) =>
            setSettings({ ...settings, autoMessage: e.target.value })
          }
          sx={{ mb: 2 }}
        />

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
            label={t("adminSettings.allowExtraBookings")}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography
            variant="subtitle1"
            sx={{
              mb: 2,
              fontWeight: 600,
              color: maintenance ? "#d32f2f" : "#2e7d32",
            }}
          >
            {t("adminSettings.systemStatus")}{" "}
            {maintenance ? (
              <span style={{ color: "#d32f2f" }}>
                {t("adminSettings.status.maintenance")}
              </span>
            ) : (
              <span style={{ color: "#2e7d32" }}>
                {t("adminSettings.status.active")}
              </span>
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
              fontWeight: 800,
            }}
          >
            {loadingMaintenance ? (
              <CircularProgress size={24} color="inherit" />
            ) : maintenance ? (
              t("adminSettings.disableMaintenance")
            ) : (
              t("adminSettings.enableMaintenance")
            )}
          </Button>
        </Box>

        <Box sx={{ textAlign: "center", mt: 5 }}>
          <Button
            variant="outlined"
            onClick={handleSave}
            disabled={saving}
            sx={{
              px: 4,
              py: 1.2,
              fontWeight: 800,
            }}
          >
            {saving ? (
              <CircularProgress size={22} />
            ) : (
              t("adminSettings.saveChanges")
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
