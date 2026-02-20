import React, { useEffect, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useThemeMode } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

// Icons
import GroupIcon from "@mui/icons-material/Group";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SettingsIcon from "@mui/icons-material/Settings";
import AssessmentIcon from "@mui/icons-material/Assessment";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import LayersIcon from "@mui/icons-material/Layers";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import SubscriptionStatusCard from "../../components/SubscriptionStatusCard";
import { useContext } from "react";
import { UserContext } from "../../context/UserContext";
import { Api } from "../../api/Api";
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function ControlCenter() {
  const navigate = useNavigate();
  const { mode, BRAND } = useThemeMode();
  const { t, i18n } = useTranslation();

  const { user } = useContext(UserContext);
  const isDark = mode === "dark";

  const [missingFcm, setMissingFcm] = useState([]);
  const [loadingFcm, setLoadingFcm] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  useEffect(() => {
    const fetchMissingFcm = async () => {
      try {
        const { data } = await Api.get("/admin/users/missing-fcm");
        console.log("Missing FCM:", data);

        setMissingFcm(data.users || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingFcm(false);
      }
    };

    fetchMissingFcm();
  }, []);



  const sections = [
    {
      title: t("controlCenter.sections.newUser"),
      icon: <PersonAddAltIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/register",
      gradient: "linear-gradient(135deg, #A01860 0%, #FBC02D 100%)",
      iconBg: "linear-gradient(135deg, rgba(160,24,96,0.15), rgba(251,192,45,0.15))",
      iconColor: "#A01860",
    },
    {
      title: t("controlCenter.sections.dashboard"),
      icon: <AssessmentIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/dashboard",
      gradient: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
      iconBg: "linear-gradient(135deg, rgba(118,75,162,0.15), rgba(102,126,234,0.15))",
      iconColor: "#764ba2",
    },
    {
      title: t("controlCenter.sections.users"),
      icon: <GroupIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/users",
      gradient: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
      iconBg: "linear-gradient(135deg, rgba(76,175,80,0.15), rgba(46,125,50,0.15))",
      iconColor: "#4caf50",
    },
    {
      title: t("controlCenter.sections.bookings"),
      icon: <EventNoteIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/bookings",
      gradient: "linear-gradient(135deg, #0288d1 0%, #26c6da 100%)",
      iconBg: "linear-gradient(135deg, rgba(2,136,209,0.15), rgba(38,198,218,0.15))",
      iconColor: "#0288d1",
    },
    {
      title: t("controlCenter.sections.weeklySlots"),
      icon: <ScheduleIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/slots",
      gradient: "linear-gradient(135deg, #8e24aa 0%, #ab47bc 100%)",
      iconBg: "linear-gradient(135deg, rgba(171,71,188,0.15), rgba(142,36,170,0.15))",
      iconColor: "#ab47bc",
    },
    {
      title: t("controlCenter.sections.reports"),
      hint: t("controlCenter.sections.reportsHint"),
      icon: <AssessmentIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/reports",
      gradient: "linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)",
      iconBg: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(56,189,248,0.15))",
      iconColor: "#2563eb",
    }

    ,
    {
      title: t("controlCenter.sections.templates"),
      icon: <LayersIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/schedule",
      gradient: "linear-gradient(135deg, #00acc1 0%, #26c6da 100%)",
      iconBg: "linear-gradient(135deg, rgba(0,172,193,0.15), rgba(38,198,218,0.15))",
      iconColor: "#00acc1",
    },
    {
      title: t("controlCenter.sections.notifications"),
      icon: <NotificationsActiveIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/notifications",
      gradient: "linear-gradient(135deg, #f4511e 0%, #ff7043 100%)",
      iconBg: "linear-gradient(135deg, rgba(244,81,30,0.15), rgba(255,112,67,0.15))",
      iconColor: "#f4511e",
    },
    {
      title: t("controlCenter.sections.settings"),
      icon: <SettingsIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/settings",
      gradient: "linear-gradient(135deg, #546e7a 0%, #78909c 100%)",
      iconBg: "linear-gradient(135deg, rgba(84,110,122,0.15), rgba(120,144,156,0.15))",
      iconColor: "#546e7a",
    },
    {
      title: t("controlCenter.sections.subscriptionsReport"),
      icon: <HourglassEmptyIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/subscriptions-report",
      gradient: "linear-gradient(135deg, #d97706 0%, #fbbf24 100%)",
      iconBg: "linear-gradient(135deg, rgba(217,119,6,0.15), rgba(251,191,36,0.15))",
      iconColor: "#d97706",
    },
    {
      title: t("controlCenter.sections.systemReset"),
      icon: <CleaningServicesIcon sx={{ fontSize: { xs: 32, sm: 36, md: 40 } }} />,
      path: "/admin/system-reset",
      gradient: "linear-gradient(135deg, #d50000 0%, #ff8a80 100%)",
      iconBg: "linear-gradient(135deg, rgba(213,0,0,0.15), rgba(255,138,128,0.15))",
      iconColor: "#d50000",
    }
  ];
  console.log("USER:", user);

  return (
    <Box
      dir={i18n.dir()}
      sx={{
        minHeight: "100vh",
        background: isDark
          ? `linear-gradient(180deg, ${BRAND.bgDarkTop}, ${BRAND.bgDarkBottom})`
          : "linear-gradient(135deg, #fdf7ff 0%, #fffaf5 50%, #fef9ff 100%)",
        py: { xs: 4, sm: 6, md: 8 },
        px: { xs: 2, sm: 3, md: 4 },
        transition: "all 0.4s ease",
      }}
    >

      {!loadingFcm && missingFcm.length > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <IconButton
              color="inherit"
              size="small"
              onClick={() => setOpenDialog(true)}
            >
              <SearchIcon />
            </IconButton>
          }

        >
          {t("controlCenter.missingFcm.message", { count: missingFcm.length })}

        </Alert>
      )}



      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        {/* Title */}
        <Box sx={{ textAlign: "center", mb: { xs: 4, sm: 6, md: 8 }, px: 2 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.75rem", sm: "2.5rem", md: "3rem" },
              background: `linear-gradient(135deg, ${isDark ? BRAND.gold : BRAND.purple
                }, ${isDark ? BRAND.purple : BRAND.gold})`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 1.5,
            }}
          >
            {t("controlCenter.title")}
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: isDark ? BRAND.subDark : "#555",
              fontWeight: 500,
              maxWidth: 700,
              mx: "auto",
            }}
          >
            {t("controlCenter.subtitle")}
          </Typography>
        </Box>
        {/* Subscription Status (Admin only, not SuperAdmin) */}
        {user && !user.isSuperAdmin && (
          <Box sx={{ maxWidth: 600, mx: "auto", mb: 6 }}>
            <SubscriptionStatusCard
              subscriptionStart={user.subscriptionStart}
              subscriptionEnd={user.subscriptionEnd}
              isDark={isDark}
              brandColors={BRAND}
            />
          </Box>
        )}


        {/* Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: { xs: 1.5, sm: 2.5, md: 3.5 },
            justifyItems: "center",
          }}
        >
          {sections.map((section, index) => (
            <Box
              key={index}
              sx={{
                width: "100%",
                maxWidth: 320,
                minHeight: 200,
                borderRadius: 3,
                overflow: "hidden",
                p: "2px",
                background: section.gradient,
                cursor: "pointer",
                transition: "0.3s",
                "&:hover": {
                  transform: "translateY(-6px) scale(1.02)",
                },
              }}
              onClick={() => navigate(section.path)}
            >
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  borderRadius: 3,
                  background: isDark ? BRAND.paperDark : "#fff",
                  textAlign: "center",
                  height: "100%",
                }}
              >
                <Box
                  sx={{
                    width: 70,
                    height: 70,
                    borderRadius: 2,
                    background: section.iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  <Box sx={{ color: section.iconColor }}>{section.icon}</Box>
                </Box>

                {/* العنوان */}
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {section.title}
                </Typography>

                {/* 👇 الوصف الصغير هنا */}
                {section.hint && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: isDark ? BRAND.subDark : "#777",
                      mt: 0.5,
                      display: "block",
                    }}
                  >
                    {section.hint}
                  </Typography>
                )}
              </Paper>

            </Box>
          ))}
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 8, p: "3px", borderRadius: 5 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 5 },
              borderRadius: 5,
              background: isDark ? BRAND.paperDark : "#fff",
              textAlign: "center",
            }}
          >
            <DashboardCustomizeIcon
              sx={{
                fontSize: { xs: 40, sm: 50 },
                color: isDark ? BRAND.gold : BRAND.purple,
                mb: 2,
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {t("controlCenter.footerTitle")}
            </Typography>

            <Typography variant="body1" sx={{ mt: 1 }}>
              {t("controlCenter.footerText")}
            </Typography>
          </Paper>
        </Box>
      </Box>
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: isDark ? BRAND.paperDark : "#ffffff",
            color: isDark ? "#ffffff" : "#000000",
            borderRadius: 3,
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: "blur(6px)",
            backgroundColor: isDark
              ? "rgba(0,0,0,0.6)"
              : "rgba(0,0,0,0.3)"
          }
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#eee"}`
          }}
        >
          {t("controlCenter.missingFcm.title")}
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            p: 0,
            background: isDark ? BRAND.paperDark : "#fff"
          }}
        >
          <List>
            {missingFcm.map((userItem, index) => {
              console.log("FCM USER:", userItem);
              console.log("GENDER VALUE:", userItem?.gender);

              return (
                <React.Fragment key={userItem._id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.05)",
                          fontSize: 25
                        }}
                      >
                        {userItem?.gender?.toLowerCase() === "male"
                          ? "👨‍🦱"
                          : "👩‍🦰"}
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={userItem.username}
                      secondary={userItem.phone || ""}
                      primaryTypographyProps={{
                        fontWeight: 600,
                      }}
                      secondaryTypographyProps={{
                        fontSize: "0.85rem",
                        color: "text.secondary",
                      }}
                    />
                  </ListItem>

                  {index < missingFcm.length - 1 && (
                    <Divider
                      sx={{
                        borderColor: isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.08)"
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </List>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>{t("controlCenter.missingFcm.close")}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
