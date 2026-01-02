// client/src/pages/Login.jsx
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

import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LoginIcon from "@mui/icons-material/Login";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { Api } from "../api/Api";
import { UserContext } from "../context/UserContext";
import { toast } from "react-toastify";
import { useThemeMode } from "../context/ThemeContext";
import { useBrand } from "../context/BrandContext";

import { registerFcmToken } from "../firebase/registerFcmToken";
import { useTranslation } from "react-i18next";
import useServerError from "../hooks/useServerError";

export default function Login() {
  const handleServerError = useServerError();
  const fallbackLogo = "/brand/DEFAULT_LOGO.png";

  const { mode, BRAND } = useThemeMode();
  const isDark = mode === "dark";
  const { logoUrl, loading: loadingBrand } = useBrand();
  const { t } = useTranslation();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [identifier, setIdentifier] = useState("");

  // شعار افتراضي
  const [imgSrc, setImgSrc] = useState(fallbackLogo);
  useEffect(() => {
    Api.get("/auth/check-first-run")
      .then((res) => {
        if (res.data?.needsSetup) {
          navigate("/register-superadmin", { replace: true });
        }
      })
      .catch(() => {
        // تجاهل الخطأ (مثلاً لو السيرفر غير متاح)
      });
  }, [navigate]);

  useEffect(() => {
    if (!loadingBrand) setImgSrc(logoUrl || fallbackLogo);
  }, [logoUrl, loadingBrand]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const { data } = await Api.post("/auth/login", {
        identifier,
        password,
      });

      // ✅ السيرفر يعيد user جاهز
      if (data?.user) {
        setUser(data.user);

        toast.success(t("login.success.login"));

        // 🔔 تفعيل الإشعارات (اختياري – لا يكسر تسجيل الدخول)
        registerFcmToken().catch(() => {
          toast.info(t("login.success.fcmOptional"));
        });

        // 🔄 تحديث بيانات المستخدم بدون await
        Api.get("/auth/me")
          .then((me) => {
            if (me.data?.user) {
              setUser(me.data.user);
            }
          })
          .catch(() => {
            // ❌ لا نفعل شيئًا لو فشل
          });

        const lang = localStorage.getItem("appLanguage") || "ar";
        Api.put("/auth/language", { preferredLanguage: lang }).catch(() => {});

        navigate(data.user.role === "admin" ? "/admin/control" : from, {
          replace: true,
        });
      } else {
        toast.error(t("login.errors.loginFailed"));
      }
    } catch (err) {
      handleServerError(err);
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
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "center",
        px: 2,
        py: 4,
        pt: { xs: 4, sm: 4 },
        position: "relative",
        overflow: "hidden",
        background: isDark
          ? `linear-gradient(180deg, ${BRAND.bgDarkTop}, ${BRAND.bgDarkBottom})`
          : "linear-gradient(135deg, #fff8fd, #fffdf7)",
        transition: "all 0.4s ease",
      }}
    >
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
          }
        

  input:focus, 
  .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: transparent !important;
    box-shadow: none !important;
    outline: none !important;
  }

  .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline {
    border-color: transparent !important;
  }

  .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
    border-color: transparent !important;
  }
`}
      </style>
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
        {/* الشعار */}
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
            {t("login.title")}
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: isDark ? BRAND.subDark : "#555",
              mt: 1,
              fontWeight: 500,
            }}
          >
            {t("login.welcome")}
          </Typography>
        </Box>

        {/* نموذج تسجيل الدخول */}
        <Box
          component="form"
          onSubmit={onSubmit}
          sx={{ display: "grid", gap: 2.5 }}
        >
          {/* 🟣 اسم المستخدم / الهاتف */}
          <TextField
            fullWidth
            label={t("login.identifier")}
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon
                    sx={{ color: isDark ? BRAND.gold : BRAND.purple }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{
              backgroundColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(160,24,96,0.05)",
              borderRadius: "10px",
            }}
          />

          {/* 🟣 كلمة المرور */}
          <TextField
            fullWidth
            label={t("login.password")}
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
            }}
          />

          {/* زر الدخول */}
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
            }}
          >
            {loading ? t("login.buttonLoading") : t("login.button")}
          </Button>

          {/* إنشاء حساب */}
          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              mt: 3,
              color: isDark ? BRAND.subDark : "#666",
            }}
          >
            {t("login.noAccount")}{" "}
            <Link
              to="#"
              onClick={(e) => {
                e.preventDefault();
                toast.info(t("login.contactAdmin"), {
                  position: "top-center",
                  autoClose: 4000,
                });
              }}
              style={{
                color: isDark ? BRAND.gold : BRAND.purple,
                fontWeight: 700,
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              {t("login.createAccount")}
            </Link>
          </Typography>
        </Box>
        {/* توقيع المطوّر A.Shaalan Tech */}
        <Box
          sx={{
            mt: 4,
            textAlign: "center",
            opacity: 0.9,
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 0.5,
            }}
          >
            <img
              src="/brand/ashaalan-tech-gold.png"
              alt="A.Shaalan Tech"
              style={{
                height: 60,
                objectFit: "contain",
                filter: isDark
                  ? "drop-shadow(0 0 6px rgba(0,0,0,0.7))"
                  : "drop-shadow(0 0 4px rgba(0,0,0,0.25))",
              }}
            />
          </Box>

          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: isDark ? BRAND.subDark : "#999",
              fontSize: "0.7rem",
            }}
          >
            {t("common.developedBy")}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: isDark ? BRAND.subDark : "#b0b0b0",
              fontSize: "0.65rem",
            }}
          >
            alaa.t.shaalan@gmail.com
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
