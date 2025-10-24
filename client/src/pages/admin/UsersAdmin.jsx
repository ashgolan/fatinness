import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Grid,
  Switch,
  FormControlLabel,
  Chip,
} from "@mui/material";
import { Api } from "../../api/Api";
import { toast } from "react-toastify";

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // 🔹 تحميل جميع المشتركات
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await Api.get("/admin/users");
      setUsers(data);
      setFiltered(data);
    } catch {
      toast.error("حدث خطأ أثناء جلب المشتركات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 🔍 البحث
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(users);
      return;
    }
    const term = search.toLowerCase();
    setFiltered(
      users.filter(
        (u) =>
          u.username?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          u.phone?.toLowerCase().includes(term)
      )
    );
  }, [search, users]);

  // ✅ تفعيل / تعطيل الحجز الإضافي
  const toggleExtraBooking = async (user) => {
    try {
      const { data } = await Api.put("/admin/users/extra-booking", {
        userId: user._id,
        allow: !user.allowExtraBookings,
      });

      toast.success(data.message || "تم تحديث حالة الحجز الإضافي");
      // تحديث المستخدم فقط
      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id
            ? { ...u, allowExtraBookings: !u.allowExtraBookings }
            : u
        )
      );
    } catch {
      toast.error("حدث خطأ أثناء تعديل حالة المشتركة");
    }
  };

  // 🚫 حظر / 🔓 إلغاء حظر المشتركة
  const toggleUserBlock = async (user) => {
    if (user.role === "admin")
      return toast.error("لا يمكن حظر مديرة النظام 👑");

    const confirmMsg = user.isBlocked
      ? "هل ترغبين في إلغاء الحظر عن هذه المشتركة؟"
      : "هل أنتِ متأكدة من حظر هذه المشتركة؟";
    if (!window.confirm(confirmMsg)) return;

    try {
      const { data } = await Api.put(`/admin/users/${user._id}/block`);
      toast.success(data.message);

      // ✅ استخدم نسخة جديدة تمامًا من المستخدم
      const updatedUser = {
        ...user,
        isBlocked: !user.isBlocked,
        ...(data.user || {}),
      };

      // ✅ أعد بناء state بمصفوفة جديدة بالكامل (إجبار React على rerender)
      setUsers((prev) => {
        const newArr = prev.map((u) =>
          u._id === user._id ? { ...updatedUser } : { ...u }
        );
        return [...newArr];
      });

      setFiltered((prev) => {
        const newArr = prev.map((u) =>
          u._id === user._id ? { ...updatedUser } : { ...u }
        );
        return [...newArr];
      });
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء تعديل حالة الحظر");
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        👩‍💼 إدارة المشتركات
      </Typography>

      <TextField
        fullWidth
        label="🔍 ابحثي بالاسم أو البريد أو الهاتف"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3 }}
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length ? (
        <Grid container spacing={2}>
          {filtered.map((user) => (
            <Grid item xs={12} md={6} key={`${user._id}-${user.isBlocked}`}>
              <Paper
                sx={{
                  p: 2,
                  borderLeft: user.allowExtraBookings
                    ? "5px solid #4caf50"
                    : "5px solid #ccc",
                  border: user.isBlocked
                    ? "2px solid #d32f2f"
                    : "1px solid #ddd",
                  opacity: user.isBlocked ? 0.7 : 1,
                  transition: "0.3s",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="h6">
                    {user.username}{" "}
                    {user.role === "admin" && (
                      <Chip
                        label="المديرة 👑"
                        size="small"
                        color="warning"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Typography>

                  {user.isBlocked ? (
                    <Chip label="محظورة 🚫" color="error" size="small" />
                  ) : (
                    <Chip label="نشطة ✅" color="success" size="small" />
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary">
                  📧 {user.email || "—"} | 📱 {user.phone || "—"}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  عدد الحجوزات: {user.totalBookings}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 2,
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={user.allowExtraBookings}
                        onChange={() => toggleExtraBooking(user)}
                        disabled={user.isBlocked}
                      />
                    }
                    label="الحجز الإضافي"
                  />
                  <Button
                    size="small"
                    variant="contained"
                    color={user.isBlocked ? "success" : "error"}
                    onClick={() => toggleUserBlock(user)}
                  >
                    {user.isBlocked ? "🔓 إلغاء الحظر" : "🚫 حظر"}
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography sx={{ mt: 3 }}>لا توجد مشتركات مطابقة للبحث.</Typography>
      )}
    </Box>
  );
}
