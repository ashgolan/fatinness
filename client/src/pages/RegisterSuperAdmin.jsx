import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useThemeMode } from "../context/ThemeContext";
import { Api } from "../api/Api";

export default function RegisterSuperAdmin() {
  const { t } = useTranslation();
  const { mode, BRAND } = useThemeMode();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    pin: "",
    confirmPin: "",
  });

  const [needsSetup, setNeedsSetup] = useState(false);

  // 🌟 فحص أول تشغيل
  useEffect(() => {
    const check = async () => {
      try {
        const res = await Api.get("/check-first-run");
        setNeedsSetup(res.data.needsSetup);

        if (!res.data.needsSetup) {
          navigate("/login");
        }
      } catch (err) {
        console.error(err);
      }
    };

    check();
  }, [navigate]);

  if (!needsSetup) return null;

  const handleSubmit = async () => {
    if (form.pin.length < 4) {
      alert("PIN must be at least 4 digits");
      return;
    }

    if (form.pin !== form.confirmPin) {
      alert("PIN codes do not match");
      return;
    }

    try {
      const res = await Api.post("/register-superadmin", {
        username: form.username,
        email: form.email,
        phone: form.phone,
        pin: form.pin,
      });

  if (res.data.code === "SUPERADMIN_CREATED") {
  alert("Super Admin created successfully!");
  navigate("/admin/dashboard");
}

    } catch (err) {
      console.error(err);
      alert("Error creating Super Admin");
    }
  };

  const isDark = mode === "dark";

  return (
    <Box
      dir={t("dir")}
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isDark
          ? `linear-gradient(180deg, ${BRAND.bgDarkTop}, ${BRAND.bgDarkBottom})`
          : "linear-gradient(135deg, #f3e5f5 0%, #fff 50%, #fef7ff 100%)",
        p: 3,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          p: 4,
          maxWidth: 480,
          width: "100%",
          borderRadius: 4,
          background: isDark ? BRAND.paperDark : "#fff",
        }}
      >
        <Typography
          variant="h4"
          textAlign="center"
          sx={{
            mb: 3,
            fontWeight: 800,
            background: `linear-gradient(135deg, ${
              isDark ? BRAND.gold : BRAND.purple
            }, ${isDark ? BRAND.purple : BRAND.gold})`,
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Register Super Admin
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Username"
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value }))
              }
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Phone"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              type="password"
              label="PIN"
              value={form.pin}
              onChange={(e) =>
                setForm((f) => ({ ...f, pin: e.target.value }))
              }
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              type="password"
              label="Confirm PIN"
              value={form.confirmPin}
              onChange={(e) =>
                setForm((f) => ({ ...f, confirmPin: e.target.value }))
              }
            />
          </Grid>

          <Grid item xs={12} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              fullWidth
              color="primary"
              sx={{ py: 1.2, fontSize: "1rem", fontWeight: 600 }}
              onClick={handleSubmit}
            >
              Create Super Admin
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
