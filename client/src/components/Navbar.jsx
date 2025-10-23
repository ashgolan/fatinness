import React, { useContext } from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { clearToken } from "../utils/tokensStorage";

export default function Navbar() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const logout = () => {
    clearToken();
    setUser(null);
    navigate("/login");
  };

  // 🎨 إعداد الألوان حسب نوع المستخدم
  const isAdmin = user?.role === "admin";
  const navbarStyle = {
    backgroundColor: isAdmin ? "#1a1a1a" : "white",
    color: isAdmin ? "gold" : "black",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  };

  const buttonStyle = {
    color: isAdmin ? "gold" : "black",
    fontWeight: 600,
  };

  return (
    <AppBar position="static" elevation={1} sx={navbarStyle}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            fontWeight: 700,
            color: isAdmin ? "gold" : "inherit",
          }}
        >
          Fateness Studio
          {isAdmin && (
            <Typography
              component="span"
              sx={{
                fontSize: "0.8rem",
                color: "goldenrod",
                marginLeft: "8px",
                fontWeight: "400",
              }}
            >
              (وضع الإدارة)
            </Typography>
          )}
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          {user ? (
            <>
              {/* 🔹 روابط المديرة */}
              {isAdmin ? (
                <>
                  <Button component={Link} to="/admin/dashboard" sx={buttonStyle}>
                    لوحة الإحصاءات
                  </Button>
                  <Button component={Link} to="/admin/templates" sx={buttonStyle}>
                    القوالب الأسبوعية
                  </Button>
                  <Button component={Link} to="/admin/slots" sx={buttonStyle}>
                    الجدول الأسبوعي
                  </Button>
                  <Button component={Link} to="/admin/bookings" sx={buttonStyle}>
                    حجوزات المشتركات
                  </Button>
                </>
              ) : (
                /* 🔹 روابط المشتركة */
                <>
                  <Button component={Link} to="/dashboard" sx={buttonStyle}>
                    لوحة التحكم
                  </Button>
                  <Button component={Link} to="/profile" sx={buttonStyle}>
                    الملف الشخصي
                  </Button>
                  <Button component={Link} to="/bookings" sx={buttonStyle}>
                    الحجوزات
                  </Button>
                  <Button component={Link} to="/my-bookings" sx={buttonStyle}>
                    حجوزاتي
                  </Button>
                </>
              )}

              <Button onClick={logout} color="error">
                تسجيل الخروج
              </Button>
            </>
          ) : (
            <>
              <Button component={Link} to="/login" sx={buttonStyle}>
                تسجيل الدخول
              </Button>
              <Button component={Link} to="/register" sx={buttonStyle}>
                إنشاء حساب
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
