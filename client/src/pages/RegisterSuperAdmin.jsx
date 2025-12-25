import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  MenuItem,
  InputAdornment,
  IconButton,
  CssBaseline,
  Grid,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Api } from "../api/Api";
import { toast } from "react-toastify";
import { useThemeMode } from "../context/ThemeContext";
import { useBrand } from "../context/BrandContext";
import { useTranslation } from "react-i18next";

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
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

export default function RegisterSuperAdmin() {
  const { t } = useTranslation();
  const { mode, BRAND } = useThemeMode();
  const { logoUrl, loading: loadingBrand } = useBrand();
  const navigate = useNavigate();

  const [needsSetup, setNeedsSetup] = useState(undefined); // 👈 مهم جداً

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    gender: "female",
    height: "",
    weight: "",
    age: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const fallbackLogo = "/uploads/DEFAULT_LOGO.png";
  const [imgSrc, setImgSrc] = useState(fallbackLogo);

  useEffect(() => {
    if (!loadingBrand) setImgSrc(logoUrl || fallbackLogo);
  }, [logoUrl, loadingBrand]);

  // 🌟 فحص أول تشغيل
  useEffect(() => {
    const check = async () => {
      try {
        const res = await Api.get("/auth/check-first-run");
        setNeedsSetup(res.data.needsSetup);
      } catch {
        setNeedsSetup(false);
      }
    };
    check();
  }, []);

  // 🚦 إعادة التوجيه بعد معرفة القيمة الحقيقية only
  useEffect(() => {
    if (needsSetup === false) {
      navigate("/login");
    }
  }, [needsSetup, navigate]);

  // 👇 انتظار القيمة الحقيقية — لا نعرض الصفحة قبل ذلك
  if (needsSetup === undefined) return null;

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const cleanForm = {
      ...form,
      height: form.height ? Number(form.height) : null,
      weight: form.weight ? Number(form.weight) : null,
      age: form.age ? Number(form.age) : null,
      role: "superAdmin",
    };

    await Api.post("/auth/register-superadmin", cleanForm);

    toast.success(t("superAdminRegister.success"));

    // 🔥 1) تسجيل خروج من السيرفر (اختياري لكنه نظيف)
    try {
      await Api.post("/auth/logout");
    } catch (err) {
      console.log("Logout skipped", err);
    }

    // 🔥 2) حذف كعكة الجلسة القديمة
    document.cookie =
      "JWT=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";

    // 🔥 3) إعادة التوجيه إلى تسجيل الدخول
    setTimeout(() => {
      navigate("/login");
    }, 500);
  } catch (err) {
    toast.error(t("superAdminRegister.error"));
  } finally {
    setLoading(false);
  }
};


  const textFieldStyle = {
    backgroundColor:
      mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(160, 24, 96, 0.05)",
    borderRadius: "10px",
    "& .MuiOutlinedInput-root": {
      height: "56px",
      "& fieldset": { borderColor: "#ddd" },
      "&:hover fieldset": {
        borderColor: mode === "dark" ? BRAND.gold : BRAND.purple,
      },
      "&.Mui-focused fieldset": {
        borderColor: mode === "dark" ? BRAND.gold : BRAND.purple,
        borderWidth: 2,
      },
    },
  };

  return (
    <>
      <CssBaseline />
      <Box
        dir={t("dir")}
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          py: 4,
          backgroundImage:
            mode === "dark"
              ? `linear-gradient(180deg, ${BRAND.bgDarkTop}, ${BRAND.bgDarkBottom})`
              : "linear-gradient(180deg, #fff8fd, #fffdf7)",
        }}
      >
        <Paper
          elevation={12}
          sx={{
            maxWidth: 580,
            width: "100%",
            p: 4,
            borderRadius: "20px",
            background:
              mode === "dark" ? BRAND.paperDark : "rgba(255,255,255,0.95)",
          }}
        >
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <img
              src={imgSrc}
              onError={() => setImgSrc(fallbackLogo)}
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                objectFit: "cover",
              }}
              alt="logo"
            />

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                mt: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                background: `linear-gradient(135deg, ${
                  mode === "dark" ? BRAND.gold : BRAND.purple
                }, ${mode === "dark" ? BRAND.purple : BRAND.gold})`,
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              <AdminPanelSettingsIcon />
              {t("superAdminRegister.title")}
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
              {t("superAdminRegister.subtitle")}
            </Typography>
          </Box>

          {/* FORM */}
          <Box
            component="form"
            onSubmit={onSubmit}
            sx={{ display: "grid", gap: 2.2 }}
          >
            <TextField
              label={t("superAdminRegister.fields.username")}
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

            <TextField
              label={t("superAdminRegister.fields.email")}
              name="email"
              type="email"
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

            <TextField
              label={t("superAdminRegister.fields.password")}
              name="password"
              type={showPassword ? "text" : "password"}
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
                    <IconButton onClick={() => setShowPassword((p) => !p)}>
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={textFieldStyle}
            />

            <TextField
              label={t("superAdminRegister.fields.phone")}
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

            <TextField
              select
              label={t("superAdminRegister.fields.gender")}
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
              <MenuItem value="female">
                {t("superAdminRegister.fields.female")}
              </MenuItem>
              <MenuItem value="male">
                {t("superAdminRegister.fields.male")}
              </MenuItem>
            </TextField>

            <Grid container spacing={2}>
              {[
                {
                  name: "height",
                  label: t("superAdminRegister.fields.height"),
                  icon: <HeightIcon />,
                },
                {
                  name: "weight",
                  label: t("superAdminRegister.fields.weight"),
                  icon: <FitnessCenterIcon />,
                },
                {
                  name: "age",
                  label: t("superAdminRegister.fields.age"),
                  icon: <CakeIcon />,
                },
              ].map((field) => (
                <Grid item xs={12} sm={4} key={field.name}>
                  <TextField
                    fullWidth
                    type="number"
                    name={field.name}
                    label={field.label}
                    value={form[field.name]}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {field.icon}
                        </InputAdornment>
                      ),
                    }}
                    sx={textFieldStyle}
                  />
                </Grid>
              ))}
            </Grid>

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              startIcon={<AdminPanelSettingsIcon />}
              sx={{
                mt: 1,
                py: 1.4,
                fontSize: "1.05rem",
                fontWeight: 700,
                borderRadius: "10px",
                background: `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.gold})`,
                color: "#fff",
              }}
            >
              {loading
                ? t("superAdminRegister.submitting")
                : t("superAdminRegister.submit")}
            </Button>
          </Box>
        </Paper>
      </Box>
    </>
  );
}
