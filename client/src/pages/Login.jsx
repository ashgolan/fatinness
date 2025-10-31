import React, { useContext, useState } from "react";
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
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LoginIcon from "@mui/icons-material/Login";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const BASE_URL = process.env.VITE_API_URL || "http://localhost:4000";
  const logoUrl = `${BASE_URL}/uploads/logo.jpg`;
  const fallbackLogo = "https://via.placeholder.com/80x80.png?text=F";
  const [imgSrc, setImgSrc] = React.useState(logoUrl);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await Api.post("/auth/login", { email, password });
      if (data?.token) setToken(data.token);
      const me = await Api.get("/users/me");
      setUser(me.data);
      toast.success("تم تسجيل الدخول بنجاح");
      navigate(me.data.role === "admin" ? "/admin/adminDashboard" : from, {
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
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 20% 20%, rgba(255,206,84,0.25), transparent 60%), radial-gradient(circle at 80% 80%, rgba(160,24,96,0.25), transparent 60%), #fff",
      }}
    >
      {/* خلفيات ضبابية ناعمة */}
      <Box
        sx={{
          position: "absolute",
          top: "10%",
          left: "15%",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "rgba(160,24,96,0.1)",
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
          background: "rgba(255,206,84,0.15)",
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
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 8px 30px rgba(160,24,96,0.15)",
          animation: "fadeIn 0.7s ease-out",
          "@keyframes fadeIn": {
            from: { opacity: 0, transform: "translateY(20px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
        }}
      >
        {/* الشعار والعنوان */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
              position: "relative",
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
                border: "3px solid #fff",
                boxShadow: "0 6px 20px rgba(160,24,96,0.25)",
              }}
            />
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.8rem", sm: "2rem" },
              background:
                "linear-gradient(135deg, #A01860 0%, #FFCE54 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Fateness Studio
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "#555",
              mt: 1,
              fontWeight: 500,
            }}
          >
            مرحباً بعودتك 💪
          </Typography>
        </Box>

        {/* النموذج */}
        <Box
          component="form"
          onSubmit={onSubmit}
          sx={{ display: "grid", gap: 2.5 }}
        >
          {/* البريد */}
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
                  <EmailIcon sx={{ color: "#A01860" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              backgroundColor: "rgba(160, 24, 96, 0.05)",
              borderRadius: "10px",
              transition: "all 0.3s ease",
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#ddd" },
                "&:hover fieldset": { borderColor: "#A01860" },
                "&.Mui-focused fieldset": {
                  borderColor: "#A01860",
                  borderWidth: 2,
                  boxShadow: "0 0 8px rgba(160,24,96,0.25)", // ✨ ظل ناعم عند التركيز
                },
              },
              "& .MuiInputLabel-root.Mui-focused": { color: "#A01860" },
            }}
          />

          {/* كلمة المرور */}
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
                  <LockIcon sx={{ color: "#A01860" }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: "#A01860" }}
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              backgroundColor: "rgba(160, 24, 96, 0.05)",
              borderRadius: "10px",
              transition: "all 0.3s ease",
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#ddd" },
                "&:hover fieldset": { borderColor: "#A01860" },
                "&.Mui-focused fieldset": {
                  borderColor: "#A01860",
                  borderWidth: 2,
                  boxShadow: "0 0 8px rgba(160,24,96,0.25)",
                },
              },
              "& .MuiInputLabel-root.Mui-focused": { color: "#A01860" },
            }}
          />

          {/* الزر */}
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
    backgroundColor: "#A01860",
    color: "#fff",
    textTransform: "none",
    transition: "0.3s",
    "&:hover": { backgroundColor: "#FFCE54", color: "#000" },
    "& .MuiButton-startIcon": { marginLeft: "8px", marginRight: "12px" }, // ← هذه تضبط المسافة ✨
  }}
>
  {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
</Button>
          {/* رابط التسجيل */}
          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              mt: 3,
              color: "#666",
              lineHeight: 1.6,
            }}
          >
            ليس لديكِ حساب؟{" "}
            <Link
              to="/register"
              style={{
                color: "#A01860",
                fontWeight: 700,
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
            >
              أنشئي حسابًا جديدًا
            </Link>
          </Typography>
        </Box>
      </Paper>

      {/* الفوتر */}
      <Typography
        variant="body2"
        sx={{
          position: "absolute",
          bottom: 14,
          color: "rgba(0,0,0,0.55)",
          fontSize: "0.85rem",
          textAlign: "center",
          width: "100%",
          letterSpacing: "0.3px",
          lineHeight: 1.6,
        }}
      >
        © 2025 &nbsp;
        <b style={{ color: "#A01860" }}>Fateness Studio</b>
        &nbsp; - استوديو اللياقة النسائي
      </Typography>
    </Box>
  );
}
