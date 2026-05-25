import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, TextField, Switch,
  Button, CircularProgress, Avatar, Fade, IconButton,
  Dialog, DialogContent, Grid, Chip, useMediaQuery,
  BottomNavigation, BottomNavigationAction,
} from "@mui/material";
import { useTheme } from "@mui/material";

import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import BuildIcon             from "@mui/icons-material/Build";
import CheckCircleIcon       from "@mui/icons-material/CheckCircle";
import BackupIcon            from "@mui/icons-material/Backup";
import SendIcon              from "@mui/icons-material/Send";
import SaveIcon              from "@mui/icons-material/Save";
import CloseIcon             from "@mui/icons-material/Close";
import StorefrontIcon        from "@mui/icons-material/Storefront";
import ImageIcon             from "@mui/icons-material/Image";
import CollectionsIcon       from "@mui/icons-material/Collections";
import TuneIcon              from "@mui/icons-material/Tune";
import WarningAmberIcon      from "@mui/icons-material/WarningAmber";
import StorageIcon           from "@mui/icons-material/Storage";

import { uploadBrandImage } from "../../firebase/uploadImage";
import { Api }              from "../../api/Api";
import { toast }            from "react-toastify";
import { useBrand }         from "../../context/BrandContext";
import { useTranslation }   from "react-i18next";
import useServerError       from "../../hooks/useServerError";

const NAV = [
  { key: "identity",    icon: <StorefrontIcon   sx={{ fontSize: 20 }} /> },
  { key: "visuals",     icon: <ImageIcon        sx={{ fontSize: 20 }} /> },
  { key: "gallery",     icon: <CollectionsIcon  sx={{ fontSize: 20 }} /> },
  { key: "booking",     icon: <TuneIcon         sx={{ fontSize: 20 }} /> },
  { key: "maintenance", icon: <WarningAmberIcon sx={{ fontSize: 20 }} /> },
  { key: "backup",      icon: <StorageIcon      sx={{ fontSize: 20 }} /> },
];

function SectionHeading({ children }) {
  return (
    <Typography variant="subtitle2" sx={{
      fontWeight: 700, mb: 2.5, color: "text.secondary",
      textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.68rem",
    }}>
      {children}
    </Typography>
  );
}

export default function AdminSettings() {
  const DEFAULT_LOGO = "/brand/DEFAULT_LOGO.png";
  const DEFAULT_CARD = "/brand/DEFAULT_CARD.jpg";

  const handleServerError = useServerError();
  const { t, i18n }     = useTranslation();
  const theme           = useTheme();
  const isDark          = theme.palette.mode === "dark";
  const { updateBrand } = useBrand();

  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isTablet  = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isMobile  = useMediaQuery(theme.breakpoints.down("sm"));

  const PURPLE = "#9B6FD6";
  const GOLD   = "#FFD93D";

  const [activeTab, setActiveTab]                   = useState("identity");
  const [settings, setSettings]                     = useState(null);
  const [loading, setLoading]                       = useState(true);
  const [saving, setSaving]                         = useState(false);
  const [uploading, setUploading]                   = useState(false);
  const [maintenance, setMaintenance]               = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  const [galleryOpen, setGalleryOpen]               = useState(false);
  const [previewImage, setPreviewImage]             = useState(null);
  const [backupLoading, setBackupLoading]           = useState(false);

  const fetchSettings = async () => {
    try {
      const [{ data: sd }, { data: gd }] = await Promise.all([
        Api.get("/admin/settings"),
        Api.get("/gallery"),
      ]);
      const raw = Array.isArray(sd) ? sd[0] : sd.settings || sd;
      setSettings({
        ...raw,
        logoUrl: raw.logoUrl || DEFAULT_LOGO,
        cardUrl: raw.cardUrl || DEFAULT_CARD,
        allowExtraBookingsByDefault: !!raw.allowExtraBookingsByDefault,
        preventCloseBookings: raw.preventCloseBookings ?? true,
        minimumGapBetweenBookings: Number(raw.minimumGapBetweenBookings ?? 60),
        galleryImages: gd || [],
      });
    } catch (err) { handleServerError(err); }
    finally { setLoading(false); }
  };

  const fetchMaintenance = async () => {
    try {
      const { data } = await Api.get("/maintenance/status");
      setMaintenance(data.maintenanceMode);
    } catch (err) { handleServerError(err); }
  };

  useEffect(() => { fetchSettings(); fetchMaintenance(); }, []);

  const handleSave = async () => {
    if (!settings.clubName?.trim() || !settings.contactNumber?.trim()) {
      toast.error(t("adminSettings.errors.required")); return;
    }
    try {
      setSaving(true);
      await Api.put("/admin/settings", settings);
      toast.success(t("adminSettings.success.saved"));
    } catch (err) { handleServerError(err); }
    finally { setSaving(false); }
  };

  const uploadGalleryImage = () => {
    if ((settings?.galleryImages?.length || 0) >= 10)
      return toast.error(t("adminSettings.gallery.maxImages"));
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      setUploading(true);
      try {
        const url = await uploadBrandImage(file, "gallery");
        const { data } = await Api.post("/gallery", { url });
        setSettings(p => ({ ...p, galleryImages: [...(p.galleryImages || []), data] }));
        toast.success(t("adminSettings.gallery.uploadSuccess"));
      } catch (err) { handleServerError(err); }
      finally { setUploading(false); }
    };
    input.click();
  };

  const handleImageUpload = async (type) => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      const preview = URL.createObjectURL(file);
      setSettings(p => ({ ...p, [type === "logo" ? "previewLogo" : "previewCard"]: preview }));
      setUploading(true);
      try {
        const url = await uploadBrandImage(file, type);
        await Api.put("/admin/settings", { [`${type}Url`]: url });
        setSettings(p => ({ ...p, [`${type}Url`]: url, [`preview${type === "logo" ? "Logo" : "Card"}`]: null }));
        updateBrand(p => ({ ...p, [`${type}Url`]: url }));
        URL.revokeObjectURL(preview);
        toast.success(t("adminSettings.success.imageUpdated"));
      } catch (err) { handleServerError(err); }
      finally { setUploading(false); }
    };
    input.click();
  };

  const toggleMaintenance = async () => {
    if (!window.confirm(maintenance
      ? t("adminSettings.maintenance.confirmDisable")
      : t("adminSettings.maintenance.confirmEnable"))) return;
    setLoadingMaintenance(true);
    try {
      const { data } = await Api.put("/maintenance/toggle");
      setMaintenance(data.maintenanceMode);
      toast.success(maintenance
        ? t("adminSettings.maintenance.disabled")
        : t("adminSettings.maintenance.enabled"));
    } catch (err) { handleServerError(err); }
    finally { setLoadingMaintenance(false); }
  };

  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await Api.get("/admin/backup/download", { responseType: "blob" });
      const now = new Date().toISOString().slice(0,16).replace("T","_").replace(":","–");
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url; a.setAttribute("download", `fatinness-backup-${now}.zip`);
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t("adminSettings.backup.downloadSuccess"));
    } catch (err) { handleServerError(err); }
    finally { setBackupLoading(false); }
  };

  if (loading || !settings)
    return <Box sx={{ display:"flex", justifyContent:"center", mt: 10 }}>
      <CircularProgress sx={{ color: PURPLE }} />
    </Box>;

  const outlineBtn = (color) => ({
    borderColor: color, color,
    "&:hover": { borderColor: color, backgroundColor: `${color}12` },
  });

  const tabLabel = {
    identity:    t("adminSettings.nav.identity")    || "هوية النادي",
    visuals:     t("adminSettings.nav.visuals")     || "الهوية البصرية",
    gallery:     t("adminSettings.nav.gallery")     || "ألبوم الصور",
    booking:     t("adminSettings.nav.booking")     || "إعدادات الحجز",
    maintenance: t("adminSettings.nav.maintenance") || "الصيانة",
    backup:      t("adminSettings.nav.backup")      || "النسخ الاحتياطية",
  };

  const cardBorder = `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`;

  const renderContent = () => (
    <Paper elevation={0} sx={{
      borderRadius: "16px", p: { xs: 2, sm: 3 },
      border: cardBorder,
      mb: isMobile ? 10 : 0,
      height: "100%",
    }}>

      {/* ── هوية النادي ── */}
      {activeTab === "identity" && (
        <Box>
          <SectionHeading>{tabLabel.identity}</SectionHeading>
          <TextField fullWidth label={t("adminSettings.fields.clubName")}
            value={settings.clubName || ""}
            onChange={e => setSettings({ ...settings, clubName: e.target.value })}
            sx={{ mb: 2 }} />
          <TextField fullWidth label={t("adminSettings.fields.contactNumber")}
            value={settings.contactNumber || ""}
            onChange={e => setSettings({ ...settings, contactNumber: e.target.value })}
            sx={{ mb: 2 }} />
          <TextField fullWidth multiline minRows={3}
            label={t("adminSettings.fields.autoMessage")}
            value={settings.autoMessage || ""}
            onChange={e => setSettings({ ...settings, autoMessage: e.target.value })} />
        </Box>
      )}

      {/* ── الهوية البصرية ── */}
      {activeTab === "visuals" && (
        <Box>
          <SectionHeading>{tabLabel.visuals}</SectionHeading>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Paper elevation={0} sx={{ p: 3, borderRadius:"12px", textAlign:"center", border: cardBorder }}>
                <Typography variant="caption" color="text.secondary" sx={{ display:"block", mb: 2, fontWeight: 600 }}>
                  {t("adminSettings.logo.title")}
                </Typography>
                <Avatar src={settings.previewLogo || settings.logoUrl}
                  sx={{ width: 100, height: 100, mx:"auto", mb: 2,
                    border: `3px solid ${isDark ? PURPLE+"55" : "#E8E0F5"}` }} />
                <Button variant="outlined" size="small" disabled={uploading}
                  onClick={() => handleImageUpload("logo")} sx={outlineBtn(PURPLE)}>
                  {t("adminSettings.logo.change")}
                </Button>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper elevation={0} sx={{ p: 3, borderRadius:"12px", textAlign:"center", border: cardBorder }}>
                <Typography variant="caption" color="text.secondary" sx={{ display:"block", mb: 2, fontWeight: 600 }}>
                  {t("adminSettings.card.title")}
                </Typography>
                <Fade in={!!(settings.previewCard || settings.cardUrl)}>
                  <Box sx={{ width:"100%", height: 110, borderRadius:"10px", overflow:"hidden",
                    border: `1px solid ${isDark?"rgba(255,255,255,0.1)":"#eee"}`, mb: 2 }}>
                    <img src={settings.previewCard || settings.cardUrl} alt="card"
                      style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  </Box>
                </Fade>
                <Button variant="outlined" size="small" disabled={uploading}
                  onClick={() => handleImageUpload("card")} sx={outlineBtn(PURPLE)}>
                  {t("adminSettings.card.change")}
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ── ألبوم الصور ── */}
      {activeTab === "gallery" && (
        <Box>
          <Box sx={{ display:"flex", alignItems:"center", justifyContent:"space-between", mb: 2.5, flexWrap:"wrap", gap: 1 }}>
            <SectionHeading>
              {t("adminSettings.gallery.title")} ({settings.galleryImages.length}/10)
            </SectionHeading>
            <Button variant="outlined" size="small"
              startIcon={uploading ? <CircularProgress size={14}/> : <AddPhotoAlternateIcon/>}
              disabled={uploading || settings.galleryImages.length >= 10}
              onClick={uploadGalleryImage} sx={outlineBtn(PURPLE)}>
              {t("adminSettings.gallery.addImage")}
            </Button>
          </Box>

          {settings.galleryImages.length === 0 ? (
            <Box sx={{ textAlign:"center", py: 6, color:"text.secondary" }}>
              <CollectionsIcon sx={{ fontSize: 52, opacity: 0.25, mb: 1.5 }}/>
              <Typography variant="body2">{t("adminSettings.gallery.empty")}</Typography>
            </Box>
          ) : (
            <Box sx={{
              display:"grid",
              gridTemplateColumns: { xs:"repeat(2,1fr)", sm:"repeat(3,1fr)", md:"repeat(4,1fr)" },
              gap: 1.5,
            }}>
              {settings.galleryImages.map((img) => (
                <Box key={img._id} sx={{
                  position:"relative", borderRadius:"10px", overflow:"hidden",
                  aspectRatio:"1", cursor:"pointer",
                  "&:hover .del-overlay": { opacity: 1 },
                  "&:hover img": { transform:"scale(1.06)" },
                }}>
                  <img src={img.url} alt=""
                    onClick={() => { setPreviewImage(img.url); setGalleryOpen(true); }}
                    style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.2s" }} />
                  <Box className="del-overlay" sx={{
                    position:"absolute", inset:0, background:"rgba(0,0,0,0.4)",
                    opacity:0, transition:"opacity 0.2s",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    <IconButton size="small"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!window.confirm(t("adminSettings.gallery.confirmDelete"))) return;
                        try {
                          await Api.delete(`/gallery/${img._id}`);
                          setSettings(p => ({ ...p, galleryImages: p.galleryImages.filter(g => g._id !== img._id) }));
                          toast.success(t("adminSettings.gallery.deleteSuccess"));
                        } catch (err) { handleServerError(err); }
                      }}
                      sx={{ background:"rgba(220,38,38,0.9)", color:"#fff",
                        "&:hover":{ background:"rgb(220,38,38)" } }}>
                      <CloseIcon sx={{ fontSize: 16 }}/>
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* ── إعدادات الحجز ── */}
      {activeTab === "booking" && (
        <Box>
          <SectionHeading>{tabLabel.booking}</SectionHeading>
          <Paper elevation={0} sx={{ borderRadius:"12px", overflow:"hidden", mb: 2, border: cardBorder }}>
            {[
              {
                label: t("adminSettings.fields.allowExtraBookings"),
                sub:   t("adminSettings.booking.allowExtraBookingsSub"),
                key:   "allowExtraBookingsByDefault",
                color: "#4CAF50",
              },
              {
                label: t("adminSettings.fields.preventCloseBookings"),
                sub:   t("adminSettings.booking.preventCloseBookingsSub"),
                key:   "preventCloseBookings",
                color: "#FF9800",
              },
            ].map(({ label, sub, key, color }, i) => (
              <Box key={key} sx={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                px: 2.5, py: 2,
                borderBottom: i === 0 ? cardBorder : "none",
              }}>
                <Box sx={{ flex:1, minWidth:0, mr: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight:500 }}>{label}</Typography>
                  <Typography variant="caption" color="text.secondary">{sub}</Typography>
                </Box>
                <Switch checked={!!settings[key]}
                  onChange={e => setSettings({ ...settings, [key]: e.target.checked })}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": { color },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: color },
                  }} />
              </Box>
            ))}
          </Paper>
          <TextField fullWidth type="number"
            label={t("adminSettings.fields.minimumGapBetweenBookings")}
            value={settings.minimumGapBetweenBookings ?? 60}
            onChange={e => setSettings({ ...settings, minimumGapBetweenBookings: Math.max(0, Number(e.target.value)) })}
            disabled={!settings.preventCloseBookings}
            inputProps={{ min: 0 }}
            helperText={t("adminSettings.fields.minimumGapBetweenBookingsHelper")} />
        </Box>
      )}

      {/* ── الصيانة ── */}
      {activeTab === "maintenance" && (
        <Box>
          <SectionHeading>{tabLabel.maintenance}</SectionHeading>
          <Paper elevation={0} sx={{
            p: 3, borderRadius:"12px",
            border: `1px solid ${maintenance ? "rgba(239,68,68,0.3)" : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
            background: maintenance ? "rgba(239,68,68,0.04)" : "transparent",
          }}>
            <Box sx={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap: 2 }}>
              <Box>
                <Chip
                  label={maintenance ? t("adminSettings.maintenance.enabled") : t("adminSettings.maintenance.disabled")}
                  size="small"
                  sx={{ mb: 1, fontWeight:700,
                    backgroundColor: maintenance ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
                    color: maintenance ? "#DC2626" : "#16A34A",
                    border: `1px solid ${maintenance ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
                  }} />
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth:300 }}>
                  {maintenance ? t("adminSettings.maintenanceOn") : t("adminSettings.maintenanceOff")}
                </Typography>
              </Box>
              <Button variant="outlined"
                onClick={toggleMaintenance} disabled={loadingMaintenance}
                startIcon={loadingMaintenance ? <CircularProgress size={16}/> : maintenance ? <CheckCircleIcon/> : <BuildIcon/>}
                sx={outlineBtn(maintenance ? "#16A34A" : "#DC2626")}>
                {maintenance ? t("adminSettings.maintenance.disable") : t("adminSettings.maintenance.enable")}
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* ── النسخ الاحتياطية ── */}
      {activeTab === "backup" && (
        <Box>
          <SectionHeading>{tabLabel.backup}</SectionHeading>
          <Paper elevation={0} sx={{
            p: 2.5, borderRadius:"12px", mb: 2.5, border: cardBorder,
            display:"flex", alignItems:"center", gap: 2, flexWrap:"wrap",
          }}>
            <Box sx={{ width:42, height:42, borderRadius:"10px", background:`${PURPLE}18`,
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <StorageIcon sx={{ color:PURPLE, fontSize:22 }}/>
            </Box>
            <Box sx={{ flex:1, minWidth:0 }}>
              <Typography variant="body2" sx={{ fontWeight:600 }}>
                {t("adminSettings.backup.autoTitle")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("adminSettings.backup.description")}
              </Typography>
            </Box>
          </Paper>
<Paper elevation={0} sx={{
  p: 2.5, borderRadius:"12px", textAlign:"center", border: cardBorder,
  display:"flex", flexDirection:"column", alignItems:"center",
}}>
  <BackupIcon sx={{ fontSize:36, color: isDark ? GOLD : "#854F0B", mb:1 }}/>
  <Typography variant="body2" sx={{ fontWeight:600, mb:0.5 }}>
    {t("adminSettings.backup.downloadTitle")}
  </Typography>
  <Typography variant="caption" color="text.secondary" sx={{ display:"block", mb:2 }}>
    {t("adminSettings.backup.downloadDesc")}
  </Typography>
  <Button variant="outlined" fullWidth
    startIcon={backupLoading ? <CircularProgress size={16}/> : <BackupIcon/>}
    onClick={handleDownloadBackup}
    disabled={backupLoading}
    sx={outlineBtn(isDark ? GOLD : "#854F0B")}>
    {backupLoading ? t("adminSettings.backup.downloading") : t("adminSettings.backup.download")}
  </Button>
</Paper>
        </Box>
      )}

      {/* ── Save button ── */}
      {!["backup","gallery","maintenance"].includes(activeTab) && (
        <Box sx={{ mt: 3, display:"flex", justifyContent:"flex-end" }}>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            startIcon={saving ? <CircularProgress size={16} sx={{ color:"#fff" }}/> : <SaveIcon/>}
            sx={{
              px: 4, py: 1.2, fontWeight:700, borderRadius:"10px",
              background:`linear-gradient(135deg, ${PURPLE}, #C084FC)`,
              boxShadow:"none", "&:hover":{ boxShadow:"none", opacity:0.9 },
            }}>
            {saving ? t("adminSettings.actions.saving") : t("adminSettings.actions.save")}
          </Button>
        </Box>
      )}
    </Paper>
  );

  // ── Sidebar nav item ──────────────────────────────────────
  const SidebarItem = ({ navKey, icon }) => {
    const active = activeTab === navKey;
    return (
      <Box onClick={() => setActiveTab(navKey)} sx={{
        display:"flex", alignItems:"center", gap:1.2,
        px: 2, py: 1.5, cursor:"pointer",
        borderRight: active ? `3px solid ${PURPLE}` : "3px solid transparent",
        background: active ? `${PURPLE}12` : "transparent",
        color: active ? PURPLE : "text.secondary",
        fontWeight: active ? 700 : 400, fontSize:"0.85rem",
        transition:"all 0.15s",
        "&:hover":{ background:`${PURPLE}08`, color:PURPLE },
      }}>
        <Box sx={{ color: active ? PURPLE : "inherit", display:"flex" }}>{icon}</Box>
        {tabLabel[navKey]}
      </Box>
    );
  };

  return (
    <Box dir={i18n.dir()} sx={{ maxWidth: 920, mx:"auto", mt: 3, px: { xs: 1, sm: 2 }, pb: 6 }}>

      <Typography variant="h5" sx={{ fontWeight:800, mb: 3, color: isDark ? GOLD : PURPLE }}>
        {t("adminSettings.title")}
      </Typography>

      {/* ── DESKTOP: sidebar + content همطول متساوي ── */}
      {isDesktop && (
        <Box sx={{ display:"flex", gap: 2, alignItems:"stretch" }}>
          {/* Sidebar — يأخذ طول المحتوى */}
          <Box sx={{ width: 210, flexShrink:0 }}>
            <Paper elevation={0} sx={{
              borderRadius:"16px", overflow:"hidden",
              border: cardBorder,
              height:"100%",
              display:"flex", flexDirection:"column",
            }}>
              {NAV.map(({ key, icon }) => (
                <SidebarItem key={key} navKey={key} icon={icon} />
              ))}
              <Box sx={{ flex:1 }} />
            </Paper>
          </Box>

          {/* Content */}
          <Box sx={{ flex:1, minWidth:0, display:"flex", flexDirection:"column" }}>
            {renderContent()}
            <Box sx={{ mt:3, textAlign:"center", opacity:0.45 }}>
              <img src="/brand/ashaalan-tech-gold.png" alt="A.Shaalan Tech"
                style={{ height:42, objectFit:"contain" }}/>
              <Typography variant="caption" sx={{ display:"block", color:"text.secondary", fontSize:"0.7rem", mt:0.5 }}>
                {t("common.developedBy")} — alaa.t.shaalan@gmail.com
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* ── TABLET: horizontal scrollable tabs ── */}
      {isTablet && (
        <Box>
          <Box sx={{
            display:"flex", overflowX:"auto", gap:1, mb:2, pb:1,
            "&::-webkit-scrollbar":{ height:3 },
            "&::-webkit-scrollbar-thumb":{ borderRadius:2, background:`${PURPLE}44` },
          }}>
            {NAV.map(({ key, icon }) => {
              const active = activeTab === key;
              return (
                <Box key={key} onClick={() => setActiveTab(key)} sx={{
                  display:"flex", flexDirection:"column", alignItems:"center", gap:0.5,
                  px:2, py:1.2, borderRadius:"12px", cursor:"pointer", flexShrink:0,
                  background: active ? `${PURPLE}14` : "transparent",
                  color: active ? PURPLE : "text.secondary",
                  border: `1px solid ${active ? PURPLE+"44" : "transparent"}`,
                  fontWeight: active ? 700 : 400, fontSize:"0.75rem",
                  transition:"all 0.15s",
                }}>
                  <Box sx={{ color: active ? PURPLE : "inherit", display:"flex" }}>{icon}</Box>
                  {tabLabel[key]}
                </Box>
              );
            })}
          </Box>
          {renderContent()}
        </Box>
      )}

      {/* ── MOBILE: bottom nav ── */}
      {isMobile && (
        <Box>
          {renderContent()}
          <Paper elevation={3} sx={{
            position:"fixed", bottom:0, left:0, right:0, zIndex:1000,
            borderTop:`1px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)"}`,
          }}>
            <BottomNavigation
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              sx={{ background: isDark ? "#1e1e2e" : "#fff" }}
            >
              {NAV.map(({ key, icon }) => (
                <BottomNavigationAction key={key} value={key}
                  icon={React.cloneElement(icon, { sx:{ fontSize:22 } })}
                  sx={{
                    minWidth:0,
                    color: activeTab === key ? PURPLE : "text.secondary",
                    "&.Mui-selected": { color: PURPLE },
                    "& .MuiBottomNavigationAction-label":{ fontSize:"0.6rem" },
                  }}
                />
              ))}
            </BottomNavigation>
          </Paper>
        </Box>
      )}

      {/* Lightbox */}
      <Dialog open={galleryOpen} onClose={() => setGalleryOpen(false)} maxWidth="lg"
        PaperProps={{ sx:{ background:"rgba(0,0,0,0.92)", boxShadow:"none" } }}>
        <DialogContent sx={{ p:0, position:"relative", display:"flex", justifyContent:"center" }}>
          <IconButton onClick={() => setGalleryOpen(false)}
            sx={{ position:"absolute", top:10, right:10, color:"#fff", zIndex:10 }}>
            <CloseIcon sx={{ fontSize:30 }}/>
          </IconButton>
          {previewImage && (
            <img src={previewImage} alt="preview"
              style={{ maxWidth:"900px", maxHeight:"90vh", borderRadius:"8px" }}/>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
