import React, { useState } from "react";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { Api } from "../api/Api";
import { toast } from "react-toastify";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Api.post("/auth/register", { email, password, username }); // عدّل المسار إذا لزم
      toast.success("تم إنشاء الحساب — سجلي الدخول الآن");
      navigate("/login");
    } catch (err) {
      toast.error(err?.response?.data?.message || "فشل إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 520, mx: "auto", mt: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          إنشاء حساب جديد
        </Typography>
        <Box
          component="form"
          onSubmit={onSubmit}
          sx={{ display: "grid", gap: 2 }}
        >
          <TextField
            label="اسم المستخدم"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <TextField
            label="البريد الإلكتروني"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="كلمة المرور"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? "جارٍ التسجيل..." : "تسجيل"}
          </Button>

          <Typography variant="body2" sx={{ mt: 1 }}>
            لديك حساب؟ <Link to="/login">سجلي الدخول</Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
