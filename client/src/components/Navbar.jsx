import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Switch,
  Divider,
  Menu,
  MenuItem,
} from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import StarHalfIcon from "@mui/icons-material/StarHalf";
import { toast } from "react-toastify";

import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";

import { useLocation } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import HomeIcon from "@mui/icons-material/Home";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { Api } from "../api/Api";
import { useThemeMode } from "../context/ThemeContext";
import { useBrand } from "../context/BrandContext";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const { t, i18n } = useTranslation();

  const { user, setUser, loadingUser } = useContext(UserContext);
  const { mode, toggleMode, BRAND } = useThemeMode();
  const { logoUrl, loading: loadingBrand } = useBrand();
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const [langMenuAnchor, setLangMenuAnchor] = useState(null);
  const LANGUAGES = [
    { code: "ar", label: "العربية", flag: "🇸🇦", dir: "rtl" },
    { code: "he", label: "עברית", flag: "🇮🇱", dir: "rtl" },
    { code: "en", label: "English", flag: "🇺🇸", dir: "ltr" },
  ];
  const drawerAnchor = i18n.dir() === "rtl" ? "right" : "left";
  const changeLanguage = async (lang) => {
    console.log("🌍 changeLanguage clicked:", lang);

    // 1️⃣ تغيير الواجهة فورًا
    i18n.changeLanguage(lang);
    localStorage.setItem("appLanguage", lang);

    const selected = LANGUAGES.find((l) => l.code === lang);
    document.documentElement.dir = selected?.dir || "ltr";

    setLangMenuAnchor(null);

    console.log("👤 current user:", user);
    console.log("🗣️ current preferredLanguage:", user?.preferredLanguage);

    // 2️⃣ مزامنة مع السيرفر فقط إذا المستخدم مسجّل دخول
    if (!user?._id) {
      console.warn("⚠️ No user logged in → skip server sync");
      return;
    }


    if (user.preferredLanguage === lang) {
      console.warn("ℹ️ Same language, no need to update server");
      return;
    }

    console.log("📡 Sending PUT /auth/language", {
      preferredLanguage: lang,
    });

    try {
      const { data } = await Api.put("/auth/language", {
        preferredLanguage: lang,
      });

      console.log("✅ Server responded:", data);

      // 3️⃣ تحديث الـ context (مهم)
      setUser((prev) => {
        const updated = prev
          ? { ...prev, preferredLanguage: data.preferredLanguage }
          : prev;

        console.log("🔄 Updated user in context:", updated);
        return updated;
      });
    } catch (e) {
      console.error("❌ Failed to sync language with server");
      console.error("status:", e?.response?.status);
      console.error("data:", e?.response?.data);
    }
  };



  const fallbackLogo = "/brand/DEFAULT_LOGO.png";
  const [imgSrc, setImgSrc] = useState(fallbackLogo);
  const location = useLocation();
  const minimalNavbarRoutes = ["/login", "/register", "/register-superadmin"];
  const isMinimalNavbar = minimalNavbarRoutes.includes(location.pathname);
  useEffect(() => {
    if (
      user &&
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      setShowNotificationBanner(true);
    } else {
      setShowNotificationBanner(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loadingBrand) setImgSrc(logoUrl || fallbackLogo);
  }, [logoUrl, loadingBrand]);

  const fetchStatus = async () => {
    try {
      const { data } = await Api.get("/admin/scheduler/status");
      setStatus(data);
    } catch {
      setStatus({ active: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") fetchStatus();
  }, [user]);

  const logout = async () => {
    try {
      await Api.post("/logout");
    } catch (err) {
      // حتى لو فشل، نكمل الخروج
    } finally {
      setUser(null);
      navigate("/login");
    }
  };


  const isAdmin = user?.role === "admin";

  const navLinks = useMemo(() => {
    if (loadingUser) return [];

    // 🔒 Navbar محدود (Login / Super Admin Register)
    if (isMinimalNavbar) {
      return user
        ? [
          {
            label: t("navbar.logout"),
            action: logout,
            icon: <LogoutIcon />,
          },
        ]
        : [];
    }

    // ======= الوضع الطبيعي =======

    if (!user) {
      return [{ label: t("navbar.login"), to: "/login", icon: <LogoutIcon /> }];
    }

    if (user.role === "admin") {
      return [
        {
          label: t("navbar.admin_panel"),
          to: "/admin/control",
          icon: <DashboardIcon />,
        },
        { label: t("navbar.logout"), action: logout, icon: <LogoutIcon /> },
      ];
    }

    return [
      { label: t("navbar.home"), to: "/dashboard", icon: <HomeIcon /> },
      {
        label: t("navbar.bookings_hub"),
        to: "/bookings-hub",
        icon: <CalendarMonthIcon />,
      },
      {
        label: t("navbar.gallery"),
        to: "/gallery",
        icon: <PhotoLibraryIcon />,
      },
      { label: t("navbar.logout"), action: logout, icon: <LogoutIcon /> },
    ];
  }, [user, loadingUser, t, isMinimalNavbar]);


  if (loadingUser) {
    return (
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: mode === "dark" ? BRAND.paperDark : "#fff",
          color: mode === "dark" ? BRAND.textDark : "#333",
          borderBottom: `1px solid ${mode === "dark" ? BRAND.lineDark : "#ddd"
            }`,
        }}
      >
        <Toolbar sx={{ justifyContent: "center" }}>
          <CircularProgress
            size={22}
            sx={{ color: mode === "dark" ? BRAND.gold : BRAND.purple }}
          />
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <>
      {/* Admin Status Bar */}
      {isAdmin && !loading && (
        <Box
          sx={{
            width: "100%",
            backgroundColor: status?.active ? "#22C55E" : "#d32f2f",
            color: "#fff",
            textAlign: "center",
            py: 0.5,
            fontSize: { xs: "0.75rem", sm: "0.85rem" },
            fontWeight: 500,
          }}
        >
          {status?.active
            ? t("navbar.reminder_system_on")
            : t("navbar.reminder_system_off")}
        </Box>
      )}
      {showNotificationBanner && (
        <Box
          sx={{
            width: "100%",
            backgroundColor: "#f59e0b",
            color: "#000",
            px: { xs: 1.5, sm: 2 },
            py: { xs: 1, sm: 1.2 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            fontSize: { xs: "0.8rem", sm: "0.9rem" },
            fontWeight: 600,
            flexWrap: "wrap",
          }}
        >
          {/* 📝 النص */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.25,
              minWidth: 0,
              flex: 1,
            }}
          >
            <Typography
              component="div"
              sx={{
                fontWeight: 800,
                fontSize: { xs: "0.85rem", sm: "0.95rem" },
                lineHeight: 1.2,
              }}
            >
              {t("notifications.title")}
            </Typography>

            <Typography
              component="div"
              sx={{
                fontSize: { xs: "0.75rem", sm: "0.85rem" },
                opacity: 0.85,
                lineHeight: 1.3,
              }}
            >
              {t("notifications.description")}
            </Typography>
          </Box>

          {/* 🔘 زر التفعيل */}
          <Button
            size="small"
            variant="contained"
            onClick={async () => {
              try {
                const token = await registerFcmToken({ silent: false });

                if (token && Notification.permission === "granted") {
                  toast.success(t("notifications.enabled"));
                  setShowNotificationBanner(false);
                } else if (Notification.permission === "denied") {
                  toast.info(t("notifications.denied"));
                }
              } catch (e) {
                console.error(e);
              }
            }}
            sx={{
              backgroundColor: "#000",
              color: "#fff",
              fontWeight: 800,
              borderRadius: "999px",
              px: { xs: 1.8, sm: 2.2 },
              py: 0.6,
              whiteSpace: "nowrap",
              flexShrink: 0,
              "&:hover": { backgroundColor: "#111" },
            }}
          >
            {t("notifications.enable")}
          </Button>
        </Box>
      )}


      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: mode === "dark" ? BRAND.paperDark : "#ffffff",
          color: mode === "dark" ? BRAND.textDark : "#222",
          borderBottom: `1px solid ${mode === "dark" ? BRAND.lineDark : "#ddd"
            }`,
          transition: "all 0.3s ease",
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            px: { xs: 2, sm: 3, md: 6 },
            minHeight: { xs: 56, sm: 64 },
          }}
        >
          {/* Logo */}
          <Box
            component={Link}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <img
              src={imgSrc}
              onError={() => setImgSrc(fallbackLogo)}
              alt="Logo"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                objectFit: "cover",
                transition: "opacity 0.5s ease",
                opacity: loadingBrand ? 0.5 : 1,
                boxShadow:
                  mode === "dark"
                    ? "0 0 10px rgba(255,255,255,0.15)"
                    : "0 0 8px rgba(0,0,0,0.1)",
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1rem", sm: "1.2rem" },
                background:
                  mode === "dark"
                    ? `linear-gradient(90deg, ${BRAND.gold}, #f3e3b0)`
                    : `linear-gradient(90deg, ${BRAND.purple}, ${BRAND.gold})`,

                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Fatinness Studio
            </Typography>
          </Box>

          {/* Theme Switch */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mr: 2,
            }}
          >
            <LightModeIcon
              sx={{
                color: mode === "dark" ? "#777" : BRAND.gold,
                fontSize: 22,
              }}
            />
            <Switch
              checked={mode === "dark"}
              onChange={toggleMode}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: BRAND.gold },
                "& .MuiSwitch-track": {
                  background:
                    mode === "dark"
                      ? "linear-gradient(90deg, #FBC02D, #E6C87A)"
                      : "linear-gradient(90deg, #A01860, #FBC02D)",
                },

              }}
            />
            <DarkModeIcon
              sx={{
                color: mode === "dark" ? BRAND.gold : "#777",
                fontSize: 22,
              }}
            />

            {/* 🌐 LANGUAGE ICON — DESKTOP */}
            <IconButton
              onClick={(e) => setLangMenuAnchor(e.currentTarget)}
              sx={{
                color: mode === "dark" ? BRAND.textDark : "#555",
                ml: 1,
                transition: "color 0.25s ease, transform 0.2s ease",
                "&:hover": {
                  color: mode === "dark" ? BRAND.gold : BRAND.purple,
                  transform: "scale(1.1)",
                },
              }}

            >
              <LanguageIcon />
            </IconButton>

            <Menu
              anchorEl={langMenuAnchor}
              open={Boolean(langMenuAnchor)}
              onClose={() => setLangMenuAnchor(null)}
              PaperProps={{
                sx: {
                  borderRadius: "14px",
                  minWidth: 180,
                  mt: 1,
                },
              }}
            >
              {LANGUAGES.map((lang) => (
                <MenuItem
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    fontWeight: 600,
                    backgroundColor:
                      i18n.language === lang.code
                        ? mode === "dark"
                          ? "rgba(251,192,45,0.14)"   // 🟡 ذهبي ناعم مريح لليل
                          : "rgba(160,24,96,0.08)"   // 🟣 بنفسجي خفيف للنهار
                        : "transparent",

                    "&:hover": {
                      backgroundColor:
                        mode === "dark"
                          ? "rgba(251,192,45,0.20)"  // 🟡 Hover ذهبي أوضح قليلًا
                          : "rgba(160,24,96,0.12)",  // 🟣 Hover بنفسجي ناعم
                    },

                  }}
                >
                  <span style={{ fontSize: "1.25rem" }}>{lang.flag}</span>
                  {lang.label}
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Desktop Links */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1.5 }}>
            {navLinks.map((link, index) =>
              link.to ? (
                <Button
                  key={index}
                  component={Link}
                  to={link.to}
                  startIcon={link.icon}
                  sx={{
                    color: mode === "dark" ? BRAND.textDark : "#333",
                    fontWeight: 600,
                    px: 2.2,
                    py: 0.9,
                    borderRadius: "999px",
                  }}
                >
                  {link.label}
                </Button>
              ) : (
                <Button
                  key={index}
                  onClick={link.action}
                  startIcon={link.icon}
                  sx={{
                    color: "#fff",
                    backgroundColor:
                      mode === "dark" ? BRAND.gold : BRAND.purple,
                    fontWeight: 700,
                    px: 2.5,
                    py: 0.9,
                    borderRadius: "999px",
                  }}
                >
                  {link.label}
                </Button>
              )
            )}
            <Button
              component={Link}
              to="/about"
              startIcon={<StarHalfIcon />} // سنغيرها بعد قليل لأيقونة مناسبة إذا تريد
              sx={{
                color: mode === "dark" ? BRAND.textDark : "#333",
                fontWeight: 600,
                px: 2.2,
                py: 0.9,
                borderRadius: "999px",
              }}
            >
              {t("navbar.about")}
            </Button>
          </Box>

          {/* Mobile Menu Button */}
          <IconButton
            onClick={() => setDrawerOpen(true)}
            sx={{
              display: { xs: "flex", md: "none" }, // ✅ هذا هو السطر المهم
              color: mode === "dark" ? BRAND.textDark : "#333",
              "&:hover": {
                backgroundColor:
                  mode === "dark"
                    ? "rgba(251,192,45,0.12)"
                    : "rgba(160,24,96,0.08)",
              },
            }}
          >
            <MenuIcon />
          </IconButton>

        </Toolbar>
      </AppBar>

      {/* Drawer Menu (Mobile) */}
      <Drawer
        anchor={drawerAnchor}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "78%", sm: "340px" },
            backgroundColor: mode === "dark" ? BRAND.paperDark : "#ffffff",
            color: mode === "dark" ? BRAND.textDark : "#333",
            paddingTop: 2,
            borderTopLeftRadius: "16px",
            borderBottomLeftRadius: "16px",
          },
        }}
      >
        <Box sx={{ px: 2 }}>
          {/* HEADER */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <img
                src={imgSrc}
                alt="appLogo"
                onError={() => setImgSrc(fallbackLogo)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  background:
                    mode === "dark"
                      ? `linear-gradient(90deg, ${BRAND.gold}, #f3e3b0)`
                      : `linear-gradient(90deg, ${BRAND.purple}, ${BRAND.gold})`,

                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Fatinness Studio
              </Typography>
            </Box>

            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon sx={{ color: mode === "dark" ? "#fff" : "#333" }} />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 2, opacity: 0.5 }} />

          {/* LANGUAGES */}
          <Typography sx={{ fontWeight: 700, mb: 1.5 }}>
            {t("navbar.language")}
          </Typography>

          {[
            { code: "ar", label: "العربية", flag: "🇸🇦" },
            { code: "he", label: "עברית", flag: "🇮🇱" },
            { code: "en", label: "English", flag: "🇺🇸" },
          ].map((lang) => (
            <Button
              key={lang.code}
              fullWidth
              onClick={() => changeLanguage(lang.code)}
              sx={{
                justifyContent: "flex-start",
                fontWeight: 600,
                textTransform: "none",
                px: 2,
                py: 1.2,
                borderRadius: "10px",
                mb: 1,
                display: "flex",
                alignItems: "center",
                gap: 1.4,

                // ✅ لون النص
                color:
                  i18n.language === lang.code
                    ? mode === "dark"
                      ? BRAND.gold        // المختار في الليل
                      : BRAND.purple     // المختار في النهار
                    : mode === "dark"
                      ? BRAND.textDark   // غير مختار في الليل
                      : "#333",          // غير مختار في النهار

                // ✅ الخلفية
                backgroundColor:
                  i18n.language === lang.code
                    ? mode === "dark"
                      ? "rgba(251,192,45,0.14)"
                      : "rgba(160,24,96,0.08)"
                    : "transparent",

                "&:hover": {
                  backgroundColor:
                    mode === "dark"
                      ? "rgba(251,192,45,0.20)"
                      : "rgba(160,24,96,0.12)",
                },
              }}

            >
              <span style={{ fontSize: "1.25rem" }}>{lang.flag}</span>
              {lang.label}
            </Button>
          ))}

          <Divider sx={{ my: 2, opacity: 0.4 }} />

          {/* NAVIGATION LINKS */}
          <List>
            {navLinks.map((link, index) => (
              <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => {
                    if (link.action) link.action();
                    else navigate(link.to);
                    setDrawerOpen(false);
                  }}
                  sx={{
                    borderRadius: "10px",
                    px: 2,
                    py: 1.4,
                    "&:hover": {
                      backgroundColor:
                        mode === "dark"
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.05)",
                    },
                  }}
                >
                  <Box sx={{ mr: 1.5 }}>{link.icon}</Box>
                  <ListItemText
                    primary={link.label}
                    primaryTypographyProps={{
                      fontWeight: 600,
                      fontSize: "1rem",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}

            {/* ABOUT PAGE */}
            <ListItem disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => {
                  navigate("/about");
                  setDrawerOpen(false);
                }}
                sx={{
                  borderRadius: "10px",
                  px: 2,
                  py: 1.4,
                  "&:hover": {
                    backgroundColor:
                      mode === "dark"
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.05)",
                  },
                }}
              >
                <Box sx={{ mr: 1.5 }}>
                  <StarHalfIcon />
                </Box>
                <ListItemText
                  primary={t("navbar.about")}
                  primaryTypographyProps={{
                    fontWeight: 600,
                    fontSize: "1rem",
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>

          <Divider sx={{ my: 2, opacity: 0.4 }} />
        </Box>
      </Drawer>
    </>
  );
}
