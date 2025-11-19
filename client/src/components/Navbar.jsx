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
} from "@mui/material";
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
import { clearToken } from "../utils/tokensStorage";
import { Api } from "../api/Api";
import { useThemeMode } from "../context/ThemeContext";
import { useBrand } from "../context/BrandContext";
import { useTranslation } from "react-i18next"; // 🟣 الترجمة

export default function Navbar() {
  const { t } = useTranslation(); // 🟣

  const { user, setUser, loadingUser } = useContext(UserContext);
  const { mode, toggleMode, BRAND } = useThemeMode();
  const { logoUrl, loading: loadingBrand } = useBrand();

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const fallbackLogo = "/uploads/fatiness_logo.png";
  const [imgSrc, setImgSrc] = useState(fallbackLogo);
  const location = useLocation();

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

  const logout = () => {
    clearToken();
    setUser(null);
    navigate("/login");
  };

  const isAdmin = user?.role === "admin";

  // =========================
  // الروابط
  // =========================
  const navLinks = useMemo(() => {
    if (loadingUser) return [];

    if (!user) {
      const currentPath = location.pathname;
      const isAuthPage =
        currentPath === "/login" || currentPath === "/register";

      return isAuthPage
        ? []
        : [{ label: t("navbar.login"), to: "/login", icon: <LogoutIcon /> }];
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
  }, [user, loadingUser, t]);

  if (loadingUser) {
    return (
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: mode === "dark" ? BRAND.paperDark : "#fff",
          color: mode === "dark" ? BRAND.textDark : "#333",
          borderBottom: `1px solid ${
            mode === "dark" ? BRAND.lineDark : "#ddd"
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
      {/* شريط حالة النظام للأدمن */}
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

      {/* THE NAVBAR */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: mode === "dark" ? BRAND.paperDark : "#ffffff",
          color: mode === "dark" ? BRAND.textDark : "#222",
          borderBottom: `1px solid ${
            mode === "dark" ? BRAND.lineDark : "#ddd"
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
                    ? "0 0 10px rgba(255, 255, 255, 0.15)"
                    : "0 0 8px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1rem", sm: "1.2rem" },
                background: `linear-gradient(90deg, ${
                  mode === "dark" ? BRAND.gold : BRAND.purple
                }, ${mode === "dark" ? BRAND.purple : BRAND.gold})`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Fatiness Studio
            </Typography>
          </Box>

          {/* Theme Switch */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mr: 2,
              "@keyframes rotate": {
                "0%": { transform: "rotate(0deg)" },
                "50%": { transform: "rotate(15deg)" },
                "100%": { transform: "rotate(0deg)" },
              },
            }}
          >
            <LightModeIcon
              sx={{
                color: mode === "dark" ? "#777" : BRAND.gold,
                fontSize: 22,
                animation: mode === "light" ? "rotate 1s ease-in-out" : "none",
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
                      ? "linear-gradient(90deg, #FBC02D, #A01860)"
                      : "linear-gradient(90deg, #A01860, #FBC02D)",
                },
              }}
            />
            <DarkModeIcon
              sx={{
                color: mode === "dark" ? BRAND.gold : "#777",
                fontSize: 22,
                animation: mode === "dark" ? "rotate 1s ease-in-out" : "none",
              }}
            />
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
                    border:
                      link.to === "/bookings-hub"
                        ? `2px solid ${BRAND.purple}55`
                        : "2px solid transparent",
                    "&:hover": {
                      backgroundColor:
                        link.to === "/bookings-hub"
                          ? mode === "dark"
                            ? "rgba(255,255,255,0.06)"
                            : "#f7f3ff"
                          : mode === "dark"
                          ? "rgba(255,255,255,0.08)"
                          : "#f5f5f5",
                    },
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
                    boxShadow:
                      mode === "dark"
                        ? `0 6px 16px ${BRAND.gold}33`
                        : `0 6px 16px ${BRAND.purple}33`,
                    "&:hover": {
                      backgroundColor:
                        mode === "dark" ? BRAND.goldDark : BRAND.purpleDark,
                    },
                  }}
                >
                  {link.label}
                </Button>
              )
            )}
          </Box>

          {/* Mobile Menu */}
          <IconButton
            onClick={() => setDrawerOpen(true)}
            sx={{
              display: { xs: "flex", md: "none" },
              color: mode === "dark" ? BRAND.textDark : "#333",
            }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer mobile */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "75%", sm: "320px" },
            backgroundColor: mode === "dark" ? BRAND.paperDark : "#fafafa",
            color: mode === "dark" ? BRAND.textDark : "#333",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Drawer HEADER */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
              pb: 1,
            }}
          >
            <img
              src={imgSrc}
              alt="MiniLogo"
              onError={() => setImgSrc(fallbackLogo)}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                objectFit: "cover",
                opacity: loadingBrand ? 0.5 : 1,
                transition: "opacity 0.5s ease",
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: mode === "dark" ? BRAND.gold : BRAND.purple,
              }}
            >
              Fateness
            </Typography>

            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon
                sx={{ color: mode === "dark" ? BRAND.textDark : "#333" }}
              />
            </IconButton>
          </Box>

          <Divider
            sx={{
              mb: 1.5,
              borderColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "#ddd",
            }}
          />

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
                    borderRadius: "8px",
                    "&:hover": {
                      backgroundColor:
                        mode === "dark" ? "rgba(255,255,255,0.08)" : "#f2f2f2",
                    },
                  }}
                >
                  <Box
                    sx={{
                      mr: 1.5,
                      color:
                        link.to === "/bookings-hub"
                          ? mode === "dark"
                            ? BRAND.gold
                            : BRAND.purple
                          : mode === "dark"
                          ? BRAND.textDark
                          : "#555",
                    }}
                  >
                    {link.icon}
                  </Box>
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
          </List>
        </Box>
      </Drawer>
    </>
  );
}
