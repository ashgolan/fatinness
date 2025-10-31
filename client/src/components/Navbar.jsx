import React, { useContext, useEffect, useState } from "react";
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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import HomeIcon from "@mui/icons-material/Home";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { clearToken } from "../utils/tokensStorage";
import { Api } from "../api/Api";
import { colors } from "../theme/colors";

export default function Navbar() {
  const { user, setUser, loadingUser } = useContext(UserContext);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const BASE_URL = process.env.VITE_API_URL || "http://localhost:4000";
  const logoUrl = `${BASE_URL}/uploads/logo.jpg`;
  const fallbackLogo = "https://via.placeholder.com/36x36.png?text=F";
  const [imgSrc, setImgSrc] = useState(logoUrl);

  // 🔹 حالة النظام للأدمن
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

  const navLinks = user
    ? isAdmin
      ? [
          { label: "لوحة الإدارة", to: "/admin/control", icon: <DashboardIcon /> },
          { label: "تسجيل الخروج", action: logout, icon: <LogoutIcon /> },
        ]
      : [
          { label: "الرئيسية", to: "/dashboard", icon: <HomeIcon /> },
          { label: "تسجيل الخروج", action: logout, icon: <LogoutIcon /> },
        ]
    : [{ label: "تسجيل الدخول", to: "/login", icon: <LogoutIcon /> }];

  if (loadingUser) {
    return (
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: "#fff",
          color: "#333",
          borderBottom: "1px solid #ddd",
        }}
      >
        <Toolbar sx={{ justifyContent: "center" }}>
          <CircularProgress size={22} sx={{ color: colors.primary }} />
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
            backgroundColor: status?.active ? colors.success : "#d32f2f",
            color: "#fff",
            textAlign: "center",
            py: 0.5,
            fontSize: { xs: "0.75rem", sm: "0.85rem" },
            fontWeight: 500,
          }}
        >
          {status?.active
            ? "🔔 نظام التذكيرات يعمل الآن"
            : "⚠️ نظام التذكيرات غير فعّال حالياً"}
        </Box>
      )}

      {/* 🔹 الـ Navbar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: "#ffffff",
          color: "#222",
          borderBottom: "1px solid #ddd",
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            px: { xs: 2, sm: 3, md: 6 },
            minHeight: { xs: 56, sm: 64 },
          }}
        >
          {/* 🟡 الشعار */}
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
                width: 36,
                height: 36,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1rem", sm: "1.2rem" },
                color: colors.primary,
              }}
            >
              Fateness Studio
            </Typography>
          </Box>

          {/* روابط سطح المكتب */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1.5 }}>
            {navLinks.map((link, index) =>
              link.to ? (
                <Button
                  key={index}
                  component={Link}
                  to={link.to}
                  startIcon={link.icon}
                  sx={{
                    color: "#333",
                    fontWeight: 500,
                    px: 2,
                    py: 0.75,
                    borderRadius: "6px",
                    background: "transparent",
                    "&:hover": {
                      backgroundColor: "#f5f5f5",
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
                    backgroundColor: colors.primary,
                    fontWeight: 600,
                    px: 2.5,
                    py: 0.75,
                    borderRadius: "6px",
                    "&:hover": { backgroundColor: "#8a0f52" },
                  }}
                >
                  {link.label}
                </Button>
              )
            )}
          </Box>

          {/* زر القائمة للموبايل */}
          <IconButton
            onClick={() => setDrawerOpen(true)}
            sx={{
              display: { xs: "flex", md: "none" },
              color: "#333",
            }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* القائمة الجانبية للموبايل */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "75%", sm: "320px" },
            backgroundColor: "#fafafa",
            color: "#333",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* رأس القائمة */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
              pb: 1,
              borderBottom: "1px solid #ddd",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: colors.primary }}>
              Fateness
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* عناصر القائمة */}
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
                    borderRadius: "6px",
                    "&:hover": { backgroundColor: "#f2f2f2" },
                  }}
                >
                  <Box sx={{ mr: 1.5, color: colors.primary }}>{link.icon}</Box>
                  <ListItemText
                    primary={link.label}
                    primaryTypographyProps={{
                      fontWeight: 500,
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
