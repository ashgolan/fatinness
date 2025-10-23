import React, { useContext, useState } from "react";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Api } from "../api/Api";
import { setToken } from "../utils/tokensStorage";
import { UserContext } from "../context/UserContext";
import { toast } from "react-toastify";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await Api.post("/auth/login", { email, password }); // عدّل المسار إذا لزم
      if (data?.token) setToken(data.token);
      const me = await Api.get("/users/me");
      setUser(me.data);
      toast.success("تم تسجيل الدخول بنجاح");
      if (me.data.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 420, mx: "auto", mt: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          تسجيل الدخول
        </Typography>

        <Box
          component="form"
          onSubmit={onSubmit}
          sx={{ display: "grid", gap: 2 }}
        >
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
            {loading ? "جارٍ تسجيل الدخول..." : "دخول"}
          </Button>

          <Typography variant="body2" sx={{ mt: 1 }}>
            ليس لديك حساب؟ <Link to="/register">أنشئي حسابًا جديدًا</Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
