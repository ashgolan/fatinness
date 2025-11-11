import React, { useContext, useState, useEffect } from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Api } from "../api/Api";
import { setToken } from "../utils/tokensStorage";
import { UserContext } from "../context/UserContext";
import { toast } from "react-toastify";
import { useThemeMode } from "../context/ThemeContext";
import { useBrand } from "../context/BrandContext";

import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LoginIcon from "@mui/icons-material/Login";
import { registerFcmToken } from "../firebase/registerFcmToken";

export default function Login() {
  const { mode, BRAND } = useThemeMode();
  const isDark = mode === "dark";
  const { logoUrl, loading: loadingBrand } = useBrand(); // ✅ نأخذ الشعار وحالة التحميل

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  // ✅ شعار افتراضي فوري
  const fallbackLogo = "/uploads/logo-placeholder.png";
  const [imgSrc, setImgSrc] = useState(fallbackLogo);

  // ✅ عند تحديث الشعار من BrandContext، نحدّث الصورة فوراً
  useEffect(() => {
    if (!loadingBrand) setImgSrc(logoUrl || fallbackLogo);
  }, [logoUrl, loadingBrand]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await Api.post("/auth/login", { email, password });
      if (data?.token) setToken(data.token);
      const me = await Api.get("/users/me");
      setUser(me.data);
      toast.success("تم تسجيل الدخول بنجاح");
      setToken(response.data.accessToken);
      await registerFcmToken(); // ✅ تسجيل FCM token بعد الدخول
      navigate(me.data.role === "admin" ? "/admin/control" : from, {
        replace: true,
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" }, // ✅ الأعلى في الموبايل، المنتصف في الشاشات الكبيرة
        justifyContent: "center",
        px: 2,
        py: 4,
        pt: { xs: 4, sm: 4 }, // ✅ مسافة من الأعلى في الموبايل
        position: "relative",
        overflow: "hidden",
        background: isDark
          ? `linear-gradient(180deg, ${BRAND.bgDarkTop}, ${BRAND.bgDarkBottom})`
          : "linear-gradient(135deg, #fff8fd, #fffdf7)",
        transition: "all 0.4s ease",
      }}
    >
      {/* خلفيات ضبابية */}
      <Box
        sx={{
          position: "absolute",
          top: "10%",
          left: "15%",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: isDark ? "rgba(251,192,45,0.07)" : "rgba(160,24,96,0.08)",
          filter: "blur(60px)",
          animation: "float 8s ease-in-out infinite",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "10%",
          right: "15%",
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: isDark ? "rgba(160,24,96,0.08)" : "rgba(251,192,45,0.1)",
          filter: "blur(60px)",
          animation: "float 10s ease-in-out infinite reverse",
        }}
      />
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
          }
        `}
      </style>

      {/* البطاقة */}
      <Paper
        elevation={10}
        sx={{
          position: "relative",
          maxWidth: 440,
          width: "100%",
          p: { xs: 3, sm: 4 },
          borderRadius: "20px",
          background: isDark
            ? "rgba(25,25,28,0.95)"
            : "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(12px)",
          boxShadow: isDark
            ? "0 8px 25px rgba(251,192,45,0.1)"
            : "0 8px 30px rgba(160,24,96,0.15)",
          animation: "fadeIn 0.7s ease-out",
          "@keyframes fadeIn": {
            from: { opacity: 0, transform: "translateY(20px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
        }}
      >
        {/* ✅ الشعار */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
              transition: "transform 0.6s ease",
              "&:hover": { transform: "scale(1.05) rotate(5deg)" },
            }}
          >
            <img
              src={imgSrc}
              alt="Logo"
              onError={() => setImgSrc(fallbackLogo)}
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                objectFit: "cover",
                transition: "opacity 0.6s ease",
                opacity: loadingBrand ? 0.5 : 1,
                border: isDark ? "3px solid #222" : "3px solid #fff",
                boxShadow: isDark
                  ? "0 6px 20px rgba(251,192,45,0.3)"
                  : "0 6px 20px rgba(160,24,96,0.25)",
              }}
            />
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.8rem", sm: "2rem" },
              background: `linear-gradient(135deg, ${
                isDark ? BRAND.gold : BRAND.purple
              } 0%, ${isDark ? BRAND.purple : BRAND.gold} 100%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Fatinness Studio
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: isDark ? BRAND.subDark : "#555",
              mt: 1,
              fontWeight: 500,
            }}
          >
            مرحباً بعودتك 💪
          </Typography>
        </Box>

        {/* نموذج تسجيل الدخول */}
        <Box
          component="form"
          onSubmit={onSubmit}
          sx={{ display: "grid", gap: 2.5 }}
        >
          <TextField
            fullWidth
            label="البريد الإلكتروني"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon
                    sx={{ color: isDark ? BRAND.gold : BRAND.purple }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{
              backgroundColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(160, 24, 96, 0.05)",
              borderRadius: "10px",
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: isDark ? "#444" : "#ddd" },
                "&:hover fieldset": {
                  borderColor: isDark ? BRAND.gold : BRAND.purple,
                },
                "&.Mui-focused fieldset": {
                  borderColor: isDark ? BRAND.gold : BRAND.purple,
                  borderWidth: 2,
                  boxShadow: `0 0 8px ${
                    isDark ? "rgba(251,192,45,0.25)" : "rgba(160,24,96,0.25)"
                  }`,
                },
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: isDark ? BRAND.gold : BRAND.purple,
              },
            }}
          />

          <TextField
            fullWidth
            label="كلمة المرور"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon
                    sx={{ color: isDark ? BRAND.gold : BRAND.purple }}
                  />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: isDark ? BRAND.gold : BRAND.purple }}
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              backgroundColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(160, 24, 96, 0.05)",
              borderRadius: "10px",
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: isDark ? "#444" : "#ddd" },
                "&:hover fieldset": {
                  borderColor: isDark ? BRAND.gold : BRAND.purple,
                },
                "&.Mui-focused fieldset": {
                  borderColor: isDark ? BRAND.gold : BRAND.purple,
                  borderWidth: 2,
                  boxShadow: `0 0 8px ${
                    isDark ? "rgba(251,192,45,0.25)" : "rgba(160,24,96,0.25)"
                  }`,
                },
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: isDark ? BRAND.gold : BRAND.purple,
              },
            }}
          />

          <Button
            type="submit"
            fullWidth
            disabled={loading}
            startIcon={<LoginIcon />}
            sx={{
              mt: 1,
              py: 1.4,
              fontSize: "1.05rem",
              fontWeight: 700,
              borderRadius: "10px",
              background: `linear-gradient(135deg, ${
                isDark ? BRAND.gold : BRAND.purple
              }, ${isDark ? BRAND.purple : BRAND.gold})`,
              color: "#fff",
              textTransform: "none",
              gap: "10px",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: isDark
                  ? "0 6px 15px rgba(251,192,45,0.25)"
                  : "0 6px 15px rgba(160,24,96,0.25)",
              },
            }}
          >
            {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
          </Button>

          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              mt: 3,
              color: isDark ? BRAND.subDark : "#666",
            }}
          >
            ليس لديكِ حساب؟{" "}
            <Link
              to="#"
              onClick={(e) => {
                e.preventDefault();
                toast.info("يرجى التواصل مع الإدارة لإنشاء حساب جديد 🙏", {
                  position: "top-center",
                  autoClose: 4000,
                  style: {
                    fontSize: "1rem",
                    fontWeight: "bold",
                    direction: "rtl",
                    background: isDark ? "#333" : "#fff8e1",
                    color: isDark ? BRAND.gold : "#a01860",
                    border: `2px solid ${isDark ? BRAND.gold : BRAND.purple}`,
                    borderRadius: "10px",
                  },
                });
              }}
              style={{
                color: isDark ? BRAND.gold : BRAND.purple,
                fontWeight: 700,
                textDecoration: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.target.style.textDecoration = "underline")
              }
              onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
            >
              أنشئي حسابًا جديدًا
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
