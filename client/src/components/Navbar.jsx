import React, { useContext, useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  CircularProgress,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { clearToken } from "../utils/tokensStorage";
import { Api } from "../api/Api";

export default function Navbar() {
  const { user, setUser, loadingUser } = useContext(UserContext); // ✅ نضيف حالة التحميل من الـ context
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const BASE_URL = process.env.VITE_API_URL || "http://localhost:4000";

  // ✅ مسار الصورة الثابت
  const logoUrl = `${BASE_URL}/uploads/logo.jpg`;

  // ✅ شعار افتراضي إذا لم توجد الصورة
  const fallbackLogo = "https://via.placeholder.com/36x36.png?text=F";

  const [imgSrc, setImgSrc] = React.useState(logoUrl);

  // ✅ فحص حالة نظام التذكيرات (للأدمن فقط)
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

  // ✅ تسجيل الخروج
  const logout = () => {
    clearToken();
    setUser(null);
    navigate("/login");
  };

  // ✅ منطق الألوان حسب الدور
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

  // ✅ أثناء تحميل بيانات المستخدم من الـ context
  if (loadingUser) {
    return (
      <AppBar position="static" elevation={1} sx={navbarStyle}>
        <Toolbar sx={{ display: "flex", justifyContent: "center" }}>
          <CircularProgress size={22} />
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <>
      {/* 🔔 شريط حالة نظام التذكيرات (للأدمن فقط) */}
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

      {/* 🎛️ الـ Navbar الرئيسي */}
      <AppBar position="static" elevation={1} sx={navbarStyle}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* 🟡 الشعار + النص */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <img
              src={imgSrc}
              alt="Fatiness Logo"
              onError={() => setImgSrc(fallbackLogo)} // 👈 في حال لم توجد الصورة
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                objectFit: "cover",
                backgroundColor: "#fff",
                boxShadow: "0 0 5px rgba(0,0,0,0.1)",
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: isAdmin ? "gold" : "inherit",
              }}
            >
              Fatiness Studio{" "}
              {isAdmin && (
                <Typography
                  component="span"
                  sx={{
                    fontSize: "0.8rem",
                    color: "goldenrod",
                    marginLeft: "8px",
                    fontWeight: 400,
                  }}
                >
                  (وضع الإدارة)
                </Typography>
              )}
            </Typography>
          </Box>

          {/* 🔹 الأزرار */}
          {/* 🔹 الأزرار */}
          <Box sx={{ display: "flex", gap: 1 }}>
            {loadingUser ? (
              <CircularProgress size={20} />
            ) : user ? (
              <>
                {isAdmin ? (
                  <Button component={Link} to="/admin/control" sx={buttonStyle}>
                    🎛️ لوحة الإدارة
                  </Button>
                ) : (
                  <Button component={Link} to="/dashboard" sx={buttonStyle}>
                    لوحة التحكم
                  </Button>
                )}
                <Button onClick={logout} color="error">
                  تسجيل الخروج
                </Button>
              </>
            ) : (
              <Button component={Link} to="/login" sx={buttonStyle}>
                تسجيل الدخول
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
}
