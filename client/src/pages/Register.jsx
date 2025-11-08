import React, { useState } from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  MenuItem,
  InputAdornment,
  IconButton,
  Grid,
  CssBaseline,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { Api } from "../api/Api";
import { toast } from "react-toastify";
import { useThemeMode } from "../context/ThemeContext";
import { useBrand } from "../context/BrandContext";

// Icons
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import PhoneIcon from "@mui/icons-material/Phone";
import WcIcon from "@mui/icons-material/Wc";
import HeightIcon from "@mui/icons-material/Height";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import CakeIcon from "@mui/icons-material/Cake";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium"; // 👑 رمز الدور

export default function Register() {
  const { mode, BRAND } = useThemeMode();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    gender: "female",
    height: "",
    weight: "",
    age: "",
    role: "user", // 👈 الدور الافتراضي
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fallbackLogo = "https://via.placeholder.com/80x80.png?text=F";
  const [imgSrc, setImgSrc] = useState(fallbackLogo);
  const isDark = mode === "dark";
  const { loading: loadingBrand } = useBrand(); // ✅ نأخذ الشعار وحالة التحميل

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Api.post("/auth/register", form);
      toast.success("✅ تم إنشاء الحساب بنجاح");
      navigate("/admin/users"); // ⬅️ بعد الإنشاء يعود لقائمة المشتركات
    } catch (err) {
      toast.error(err?.response?.data?.message || "فشل إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  const textFieldStyle = {
    backgroundColor:
      mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(160, 24, 96, 0.05)",
    borderRadius: "10px",
    transition: "all 0.3s ease",
    "& .MuiOutlinedInput-root": {
      height: "56px",
      "& fieldset": { borderColor: "#ddd" },
      "&:hover fieldset": {
        borderColor: mode === "dark" ? BRAND.gold : BRAND.purple,
      },
      "&.Mui-focused fieldset": {
        borderColor: mode === "dark" ? BRAND.gold : BRAND.purple,
        borderWidth: 2,
        boxShadow:
          mode === "dark"
            ? "0 0 8px rgba(251,192,45,0.25)"
            : "0 0 8px rgba(160,24,96,0.25)",
      },
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: mode === "dark" ? BRAND.gold : BRAND.purple,
    },
  };

  return (
    <>
      <CssBaseline />
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
          backgroundImage:
            mode === "dark"
              ? `linear-gradient(180deg, ${BRAND.bgDarkTop}, ${BRAND.bgDarkBottom})`
              : "linear-gradient(180deg, #fff8fd, #fffdf7)",
          transition: "all 0.4s ease",
        }}
      >
        {/* إزالة تلوين autofill */}
        <style>{`
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0px 1000px transparent inset !important;
            box-shadow: 0 0 0px 1000px transparent inset !important;
            background-color: transparent !important;
            -webkit-text-fill-color: inherit !important;
            transition: background-color 5000s ease-in-out 0s !important;
          }
        `}</style>

        {/* البطاقة */}
        <Paper
          elevation={12}
          sx={{
            position: "relative",
            maxWidth: 580,
            width: "100%",
            p: { xs: 3, sm: 4 },
            borderRadius: "20px",
            background:
              mode === "dark" ? BRAND.paperDark : "rgba(255,255,255,0.95)",
            backdropFilter: "blur(12px)",
            boxShadow:
              mode === "dark"
                ? "0 8px 28px rgba(251,192,45,0.12)"
                : "0 8px 30px rgba(160,24,96,0.12)",
            transition: "all 0.3s ease",
          }}
        >
          {/* 🔶 الشريط العلوي */}
          <Box
            sx={{
              height: 4,
              borderTopLeftRadius: "inherit",
              borderTopRightRadius: "inherit",
              background:
                mode === "dark"
                  ? `linear-gradient(90deg, ${BRAND.gold}, ${BRAND.purple})`
                  : `linear-gradient(90deg, ${BRAND.purple}, ${BRAND.gold})`,
              mb: 2,
            }}
          />

          {/* 🪞 الشعار والعنوان */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
                transition: "all 0.3s ease",
                "&:hover": { transform: "scale(1.05) rotate(3deg)" },
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
                fontSize: { xs: "1.6rem", sm: "1.9rem" },
                background: `linear-gradient(135deg, ${
                  mode === "dark" ? BRAND.gold : BRAND.purple
                }, ${mode === "dark" ? BRAND.purple : BRAND.gold})`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              إنشاء حساب جديد
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: mode === "dark" ? BRAND.subDark : "#555",
                mt: 1,
                fontWeight: 500,
                fontSize: "0.95rem",
              }}
            >
              المدير فقط يمكنه إضافة مشتركات أو مديرات جديدة 👑
            </Typography>
          </Box>

          {/* النموذج */}
          <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2.5 }}>
            {/* اسم المستخدم */}
            <TextField
              label="اسم المستخدم"
              name="username"
              value={form.username}
              onChange={handleChange}
              
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: BRAND.purple }} />
                  </InputAdornment>
                ),
              }}
              sx={textFieldStyle}
            />

            {/* البريد */}
            <TextField
              label="البريد الإلكتروني"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: BRAND.purple }} />
                  </InputAdornment>
                ),
              }}
              sx={textFieldStyle}
            />

            {/* كلمة المرور */}
            <TextField
              label="كلمة المرور"
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: BRAND.purple }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: BRAND.purple }}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={textFieldStyle}
            />

            {/* الهاتف */}
            <TextField
              label="رقم الهاتف"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ color: BRAND.purple }} />
                  </InputAdornment>
                ),
              }}
              sx={textFieldStyle}
            />

            {/* الجنس */}
            <TextField
              select
              label="الجنس"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <WcIcon sx={{ color: BRAND.purple }} />
                  </InputAdornment>
                ),
              }}
              sx={textFieldStyle}
            >
              <MenuItem value="female">أنثى</MenuItem>
              <MenuItem value="male">ذكر</MenuItem>
            </TextField>

            {/* الدور 👑 */}
            <TextField
              select
              label="نوع الحساب"
              name="role"
              value={form.role}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <WorkspacePremiumIcon sx={{ color: BRAND.purple }} />
                  </InputAdornment>
                ),
              }}
              sx={textFieldStyle}
              helperText="اختاري ما إذا كانت مشتركة أو مديرة"
            >
              <MenuItem value="user">مشتركة</MenuItem>
              <MenuItem value="admin">مديرة</MenuItem>
            </TextField>

            {/* الطول والوزن والعمر */}
            <Grid container spacing={2}>
              {[
                { label: "الطول (سم)", name: "height", icon: <HeightIcon /> },
                { label: "الوزن (كغ)", name: "weight", icon: <FitnessCenterIcon /> },
                { label: "العمر", name: "age", icon: <CakeIcon /> },
              ].map((field) => (
                <Grid item xs={12} sm={4} key={field.name}>
                  <TextField
                    fullWidth
                    label={field.label}
                    name={field.name}
                    type="number"
                    value={form[field.name]}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {React.cloneElement(field.icon, {
                            sx: { color: BRAND.purple },
                          })}
                        </InputAdornment>
                      ),
                    }}
                    sx={textFieldStyle}
                  />
                </Grid>
              ))}
            </Grid>

            {/* زر الإرسال */}
            <Button
              type="submit"
              fullWidth
              disabled={loading}
              startIcon={<HowToRegIcon />}
              sx={{
                mt: 1,
                py: 1.4,
                fontSize: "1.05rem",
                fontWeight: 700,
                borderRadius: "10px",
                textTransform: "none",
                          display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px", // ✅ هذه تضبط المسافة بين الأيقونة والكلمة
                background: `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.gold})`,
                color: "#fff",
                "&:hover": {
                  background: `linear-gradient(135deg, ${BRAND.goldDark}, ${BRAND.purpleDark})`,
                },
              }}
            >
              {loading ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </>
  );
}
