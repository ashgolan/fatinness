import React, { useContext, useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { clearToken } from "../utils/tokensStorage";
import { Api } from "../api/Api";

export default function Navbar() {
  const { user, setUser } = useContext(UserContext);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🕓 جلب حالة المجدول
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

  // 🎨 ألوان الـ Navbar
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
    <>
      {/* 🔔 تنبيه حالة المجدول يظهر فقط للمديرة */}
      {isAdmin && !loading && (
        <Box
          sx={{
            width: "100%",
            backgroundColor: status?.active ? "#2e7d32" : "#d32f2f",
            color: "white",
            textAlign: "center",
            py: 0.5,
            fontSize: "0.9rem",
          }}
        >
          {status?.active ? (
            <>
              🔔 نظام التذكيرات التلقائي يعمل الآن
              {status?.lastRun && (
                <span style={{ marginRight: "8px", fontSize: "0.8rem" }}>
                  (آخر تشغيل: {new Date(status.lastRun).toLocaleString("ar-EG")}
                  )
                </span>
              )}
            </>
          ) : (
            "⚠️ نظام التذكيرات التلقائي غير فعّال حالياً"
          )}
        </Box>
      )}

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
            Fateness Studio{" "}
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
                {isAdmin ? (
                  <>
                    {/* 🔸 روابط المديرة */}
                    <Button
                  
                      onClick={() => navigate("/admin/settings")}
                    >
                      ⚙️ الإعدادات
                    </Button>
                    <Button
                      component={Link}
                      to="/admin/dashboard"
                      sx={buttonStyle}
                    >
                      لوحة التحكم
                    </Button>
                    <Button
                      component={Link}
                      to="/admin/templates"
                      sx={buttonStyle}
                    >
                      القوالب الأسبوعية
                    </Button>
                    <Button component={Link} to="/admin/slots" sx={buttonStyle}>
                      الجدول الأسبوعي
                    </Button>
                    <Button
                      component={Link}
                      to="/admin/bookings"
                      sx={buttonStyle}
                    >
                      حجوزات المشتركات
                    </Button>
                    <Button component={Link} to="/admin/users" sx={buttonStyle}>
                      قائمة المشتركات
                    </Button>
                    <Button
                      sx={buttonStyle}
                      onClick={() => navigate("/admin/notifications")}
                    >
                      🔔 الإشعارات
                    </Button>
                    <Button
                      sx={buttonStyle}
                      onClick={() => navigate("/admin/reports")}
                    >
                      📊 التقارير
                    </Button>
                  </>
                ) : (
                  <>
                    {/* 🔸 روابط المشتركة */}
                    <Button component={Link} to="/profile" sx={buttonStyle}>
                      الملف الشخصي
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
    </>
  );
}
