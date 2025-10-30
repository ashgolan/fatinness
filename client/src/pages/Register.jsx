import React, { useState } from "react";
import { Box, Button, Paper, TextField, Typography, MenuItem } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { Api } from "../api/Api";
import { toast } from "react-toastify";

export default function Register() {
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

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Api.post("/auth/register", form);
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
            name="username"
            value={form.username}
            onChange={handleChange}
            required
          />
          <TextField
            label="البريد الإلكتروني"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <TextField
            label="كلمة المرور"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <TextField
            label="رقم الهاتف"
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />
          <TextField
            select
            label="الجنس"
            name="gender"
            value={form.gender}
            onChange={handleChange}
          >
            <MenuItem value="female">أنثى</MenuItem>
            <MenuItem value="male">ذكر</MenuItem>
          </TextField>
          <TextField
            label="الطول (سم)"
            name="height"
            type="number"
            value={form.height}
            onChange={handleChange}
          />
          <TextField
            label="الوزن (كغ)"
            name="weight"
            type="number"
            value={form.weight}
            onChange={handleChange}
          />
          <TextField
            label="العمر"
            name="age"
            type="number"
            value={form.age}
            onChange={handleChange}
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
