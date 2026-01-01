import React, { useContext, useEffect, useState } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  InputAdornment,
  Avatar,
  Divider,
  useTheme,
} from "@mui/material";
import { Api } from "../../api/Api";
import { toast } from "react-toastify";

import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/material/IconButton";

import { useTranslation } from "react-i18next";
import useServerError from "../../hooks/useServerError";
import { UserContext } from "../../context/UserContext";

export default function UsersAdmin() {
  const handleServerError = useServerError();
  const [showPassword, setShowPassword] = useState(false);

  const theme = useTheme();
  const { t } = useTranslation();

  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [newRoleValue, setNewRoleValue] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editData, setEditData] = useState({
    username: "",
    email: "",
    phone: "",
    height: "",
    weight: "",
    age: "",
    gender: "female",
    role: "user",
    password: "", // ⭐ جديد
  });

  const [pendingRoleChange, setPendingRoleChange] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);
  const { user: currentUser } = useContext(UserContext);

  const openDeleteConfirm = (user) => {
    // منع حذف المدير الرئيسي
    if (user.isSuperAdmin) {
      toast.error(t("usersAdmin.errors.cannotDeleteSuperAdmin"));
      return;
    }

    setDeleteUser(user);
    setDeleteConfirmOpen(true);
  };
  const confirmDeleteUser = async () => {
    try {
      await Api.delete(`/admin/users/${deleteUser._id}`);

      toast.success(t("usersAdmin.messages.deleted"));

      // إغلاق النافذة
      setDeleteConfirmOpen(false);

      // تحديث القائمة
      setUsers((prev) => prev.filter((u) => u._id !== deleteUser._id));
      setFiltered((prev) => prev.filter((u) => u._id !== deleteUser._id));
    } catch (err) {
      handleServerError(err);
    }
  };

  // ---------------------------
  // 🔹 جلب المشتركات
  // ---------------------------
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await Api.get("/admin/users");
      console.warn(data);
      setUsers(data);
      setFiltered(data);
    } catch (err) {
      handleServerError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ---------------------------
  // 🔍 البحث
  // ---------------------------
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

  // ---------------------------
  // 🟢 السماح بالحجز الإضافي
  // ---------------------------
  const toggleExtraBooking = async (user) => {
    try {
      const { data } = await Api.put("/admin/users/extra-booking", {
        userId: user._id,
        allow: !user.allowExtraBookings,
      });

      toast.success(data.message || t("usersAdmin.extraBooking.updated"));

      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id
            ? { ...u, allowExtraBookings: !u.allowExtraBookings }
            : u
        )
      );
    } catch (err) {
      handleServerError(err);
    }
  };

  // ---------------------------
  // 🚫 حظر / إلغاء حظر
  // ---------------------------
  const toggleUserBlock = async (user) => {
    if (user.role === "admin") {
      toast.error(t("usersAdmin.errors.cannotBlockAdmin"));
      return;
    }

    const confirmMsg = user.isBlocked
      ? t("usersAdmin.confirm.unblock")
      : t("usersAdmin.confirm.block");

    if (!window.confirm(confirmMsg)) return;

    try {
      const { data } = await Api.put(`/admin/users/${user._id}/block`);

      toast.success(
        data?.message ||
          (user.isBlocked
            ? t("usersAdmin.messages.unblocked")
            : t("usersAdmin.messages.blocked"))
      );

      await fetchUsers();
    } catch (err) {
      handleServerError(err);
    }
  };

  // ---------------------------
  // ✏️ تعديل بيانات
  // ---------------------------
  const handleEdit = (user) => {
    setEditUser(user);
    setEditData({
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      height: user.height || "",
      weight: user.weight || "",
      age: user.age || "",
      gender: user.gender || "female",
      role: user.role || "user",
      password: "", // ⭐ لا نملأها
      subscriptionStart: user.subscriptionStart || "",
      subscriptionEnd: user.subscriptionEnd || "",
    });

    setEditOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...editData,
        height: editData.height ? Number(editData.height) : null,
        weight: editData.weight ? Number(editData.weight) : null,
        age: editData.age ? Number(editData.age) : null,
        subscriptionStart: editData.subscriptionStart || null,
        subscriptionEnd: editData.subscriptionEnd || null,
      };

      // ⭐ إذا لم تُكتب كلمة مرور → لا نرسلها
      if (!payload.password) {
        delete payload.password;
      }

      const { data } = await Api.put(`/admin/users/${editUser._id}`, payload);

      toast.success(t("usersAdmin.messages.updated"));
      setEditOpen(false);

      setUsers((prev) =>
        prev.map((u) => (u._id === editUser._id ? data.user : u))
      );
      setFiltered((prev) =>
        prev.map((u) => (u._id === editUser._id ? data.user : u))
      );
    } catch (err) {
      handleServerError(err);
    }
  };

  // ---------------------------
  // 🎨 أنماط الحقول
  // ---------------------------
  const textFieldStyle = {
    backgroundColor: theme.palette.background.paper,
    borderRadius: "10px",
    "& .MuiOutlinedInput-root": {
      height: "56px",
      "& fieldset": { borderColor: theme.palette.divider },
      "&:hover fieldset": { borderColor: "#1976d2" },
      "&.Mui-focused fieldset": {
        borderColor: "#1976d2",
        borderWidth: 2,
      },
    },
    "& .MuiInputLabel-root.Mui-focused": { color: "#1976d2" },
  };
  // ---------------------------
  // 🗑️ حذف مشتركة
  // ---------------------------
  const handleDeleteUser = async () => {
    if (!editUser) return;

    // منع حذف المدير الرئيسي
    if (editUser.isSuperAdmin) {
      toast.error(t("usersAdmin.errors.cannotDeleteSuperAdmin"));
      return;
    }

    // نافذة تأكيد
    if (!window.confirm(t("usersAdmin.confirm.deleteUser"))) return;

    try {
      await Api.delete(`/admin/users/${editUser._id}`);

      toast.success(t("usersAdmin.messages.deleted"));

      setEditOpen(false);

      // تحديث القائمة
      setUsers((prev) => prev.filter((u) => u._id !== editUser._id));
      setFiltered((prev) => prev.filter((u) => u._id !== editUser._id));
    } catch (err) {
      handleServerError(err);
    }
  };

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        py: 4,
        px: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* ---------------------------------- */}
        {/* 🔵 رأس الصفحة */}
        {/* ---------------------------------- */}
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: "12px",
            background: "linear-gradient(90deg,#1976d2,#42a5f5)",
            color: "#fff",
            boxShadow: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ width: 56, height: 56, backgroundColor: "#fff" }}>
              <PersonIcon sx={{ fontSize: 30, color: "#1976d2" }} />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {t("usersAdmin.title")}
              </Typography>
              <Typography variant="body2">
                {t("usersAdmin.subtitle")}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* ---------------------------------- */}
        {/* 🔍 شريط البحث */}
        {/* ---------------------------------- */}
        <Paper
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: "12px",
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <TextField
            fullWidth
            placeholder={t("usersAdmin.search.placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#1976d2" }} />
                </InputAdornment>
              ),
            }}
            sx={textFieldStyle}
          />
        </Paper>

        {/* ---------------------------------- */}
        {/* 🟣 قائمة المشتركات */}
        {/* ---------------------------------- */}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 300,
            }}
          >
            <CircularProgress sx={{ color: "#1976d2" }} size={50} />
          </Box>
        ) : filtered.length ? (
          <Grid container spacing={2.5} justifyContent="center">
            {filtered.map((user) => (
              <Grid item xs={12} sm={6} lg={4} key={user._id}>
                <Paper
                  sx={{
                    p: 2.5,
                    position: "relative",
                    borderRadius: "14px",
                    backgroundColor: theme.palette.background.paper,
                    border: "1.5px solid rgba(255, 215, 0, 0.4)",
                    boxShadow: "0 2px 10px rgba(255, 215, 0, 0.08)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      boxShadow: "0 3px 14px rgba(255, 215, 0, 0.2)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  {/* 👑 تاج المديرة */}
                  {user.role === "admin" && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: -10,
                        right: -13,
                        backgroundColor: "#fff",
                        borderRadius: "50%",
                        border: "2px solid #ffeb3b",
                        padding: "5px 5px",
                        boxShadow: "0 0 12px rgba(255, 215, 0, 0.8)",
                        fontSize: "20px",
                        zIndex: 3,
                      }}
                    >
                      {user.isSuperAdmin ? "🛡️" : "👑"}
                    </Box>
                  )}
                  {/* --------------------------- */}
                  {/* 👤 رأس البطاقة */}
                  {/* --------------------------- */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: theme.palette.text.primary,
                        }}
                      >
                        {user.username}
                      </Typography>

                      {user.isBlocked ? (
                        <Typography
                          title={t("usersAdmin.card.blocked")}
                          sx={{ fontSize: 22, lineHeight: 1 }}
                        >
                          👩‍🦰❌
                        </Typography>
                      ) : (
                        <Typography
                          title={t("usersAdmin.card.active")}
                          sx={{ fontSize: 22, lineHeight: 1 }}
                        >
                          👩‍🦰✅
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* --------------------------- */}
                  {/* 📌 معلومات المشتركة */}
                  {/* --------------------------- */}
                  <Box sx={{ mb: 2.5, display: "grid", gap: 1.2 }}>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <EmailIcon sx={{ fontSize: 18, color: "#1976d2" }} />
                      <Typography
                        variant="body2"
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        {user.email || "—"}
                      </Typography>
                    </Box>

                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <PhoneIcon sx={{ fontSize: 18, color: "#1976d2" }} />
                      <Typography
                        variant="body2"
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        {user.phone || "—"}
                      </Typography>
                    </Box>

                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <EventAvailableIcon
                        sx={{ fontSize: 18, color: "#1976d2" }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontWeight: 600,
                        }}
                      >
                        {t("usersAdmin.totalBookings")}:{" "}
                        {user.totalBookings || 0}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* --------------------------- */}
                  {/* ⚡ السماح بالحجز الإضافي */}
                  {/* --------------------------- */}
                  <FormControlLabel
                    control={
                      <Switch
                        checked={user.allowExtraBookings}
                        onChange={() => toggleExtraBooking(user)}
                        disabled={user.isBlocked || user.role === "admin"}
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: "#FFD700",
                            filter:
                              "drop-shadow(0 0 6px rgba(255, 215, 0, 0.7))",
                          },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                            {
                              backgroundColor: "#ffeb3b",
                            },
                        }}
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        {t("usersAdmin.extraBooking.label")}
                      </Typography>
                    }
                    sx={{ mb: 2 }}
                  />

                  {/* --------------------------- */}
                  {/* 🔘 أزرار التحكم */}
                  {/* --------------------------- */}
                  {/* إخفاء كل الأزرار إذا كان هذا المستخدم هو السوبر أدمن */}
                  <Box sx={{ display: "grid", gap: 1.5 }}>
                    {/* زر التعديل */}
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => handleEdit(user)}
                      disabled={
                        (user.isSuperAdmin || user.role === "admin") &&
                        !currentUser.isSuperAdmin
                      }
                      sx={{
                        borderColor: "#1976d2",
                        color: "#1976d2",
                        fontWeight: 600,
                        borderRadius: "8px",
                        textTransform: "none",
                        gap: 0.6,
                      }}
                    >
                      <EditIcon sx={{ fontSize: 18 }} />
                      {t("usersAdmin.buttons.edit")}
                    </Button>

                    {/* زر الحظر */}
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => toggleUserBlock(user)}
                      disabled={
                        (user.isSuperAdmin || user.role === "admin") &&
                        !currentUser.isSuperAdmin
                      }
                      sx={{
                        fontWeight: 600,
                        gap: 0.6,
                        borderRadius: "8px",
                        textTransform: "none",
                        backgroundColor: user.isBlocked ? "#66bb6a" : "#ef5350",
                        "&:hover": {
                          backgroundColor: user.isBlocked
                            ? "#57a95b"
                            : "#d32f2f",
                        },
                      }}
                    >
                      <BlockIcon sx={{ fontSize: 18 }} />
                      {user.isBlocked
                        ? t("usersAdmin.buttons.unblock")
                        : t("usersAdmin.buttons.block")}
                    </Button>

                    {/* زر الحذف — ممنوع حذف السوبر أدمن */}
                    <Button
                      fullWidth
                      variant="contained"
                      color="error"
                      onClick={() => openDeleteConfirm(user)}
                      disabled={
                        (user.isSuperAdmin || user.role === "admin") &&
                        !currentUser.isSuperAdmin
                      }
                      sx={{
                        fontWeight: 600,
                        gap: 0.6,
                        borderRadius: "8px",
                        textTransform: "none",
                        backgroundColor: "#d32f2f",
                        "&:hover": { backgroundColor: "#b71c1c" },
                      }}
                    >
                      🗑️ {t("usersAdmin.buttons.delete")}
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper
            sx={{
              p: 6,
              textAlign: "center",
              borderRadius: "12px",
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <SearchIcon sx={{ fontSize: 64, color: "#999", mb: 2 }} />
            <Typography
              variant="h6"
              sx={{ color: theme.palette.text.secondary }}
            >
              {t("usersAdmin.noResults")}
            </Typography>
          </Paper>
        )}

        {/* --------------------------- */}
        {/* 🟣 نافذة تعديل بيانات المشتركة */}
        {/* --------------------------- */}
        <Dialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{ sx: { borderRadius: "12px", p: 1 } }}
        >
          <DialogTitle sx={{ fontWeight: 700, color: "#1976d2" }}>
            {t("usersAdmin.editUser")}
          </DialogTitle>

          <DialogContent sx={{ display: "grid", gap: 2, mt: 1 }}>
            <TextField
              label={t("usersAdmin.fields.name")}
              name="username"
              value={editData.username}
              onChange={handleChange}
              sx={textFieldStyle}
            />

            <TextField
              label={t("usersAdmin.fields.email")}
              name="email"
              value={editData.email}
              onChange={handleChange}
              sx={textFieldStyle}
            />

            <TextField
              label={t("usersAdmin.fields.phone")}
              name="phone"
              value={editData.phone}
              onChange={handleChange}
              sx={textFieldStyle}
            />
            {currentUser?.isSuperAdmin && (
              <TextField
                label={t("usersAdmin.fields.newPassword")}
                name="password"
                type={showPassword ? "text" : "password"}
                value={editData.password}
                onChange={handleChange}
                placeholder={t("usersAdmin.placeholders.newPassword")}
                sx={textFieldStyle}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((p) => !p)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}

            <TextField
              label={t("usersAdmin.fields.height")}
              name="height"
              type="number"
              value={editData.height}
              onChange={handleChange}
              sx={textFieldStyle}
            />

            <TextField
              label={t("usersAdmin.fields.weight")}
              name="weight"
              type="number"
              value={editData.weight}
              onChange={handleChange}
              sx={textFieldStyle}
            />

            <TextField
              label={t("usersAdmin.fields.age")}
              name="age"
              type="number"
              value={editData.age}
              onChange={handleChange}
              sx={textFieldStyle}
            />

            <TextField
              select
              label={t("usersAdmin.fields.gender")}
              name="gender"
              value={editData.gender}
              onChange={handleChange}
              sx={textFieldStyle}
            >
              <MenuItem value="female">
                {t("usersAdmin.gender.female")}
              </MenuItem>
              <MenuItem value="male">{t("usersAdmin.gender.male")}</MenuItem>
            </TextField>

            {/* --------------------------- */}
            {/* 🟣 حقل الدور + نافذة تأكيد */}
            {/* --------------------------- */}
            <TextField
              select
              label={t("usersAdmin.fields.role")}
              name="role"
              value={editData.role || "user"}
              onChange={(e) => {
                const newRole = e.target.value;

                // منع المديرات من ترقية أحد
                if (newRole === "admin" && !currentUser?.isSuperAdmin) {
                  toast.error(t("usersAdmin.errors.onlySuperAdminCanPromote"));
                  return;
                }

                setNewRoleValue(newRole); // 👈 خزّنت الدور مؤقتًا
                setPendingRoleChange(true); // 👈 افتح النافذة
              }}
              sx={textFieldStyle}
            >
              <MenuItem value="user">{t("usersAdmin.roles.user")}</MenuItem>

              {/* ✨ خيار المدير يظهر فقط للسوبر أدمن */}
              {currentUser?.isSuperAdmin && (
                <MenuItem value="admin">{t("usersAdmin.roles.admin")}</MenuItem>
              )}
            </TextField>
            {/* 🗓️ تواريخ الاشتراك — تظهر فقط للأدمن العادي */}
            {/* 🗓️ تواريخ الاشتراك — للسوبر أدمن فقط */}
            {currentUser?.isSuperAdmin && (
              <>
                <TextField
                  label={t("usersAdmin.fields.subscriptionStart")}
                  name="subscriptionStart"
                  type="date"
                  value={
                    editData.subscriptionStart
                      ? editData.subscriptionStart.substring(0, 10)
                      : ""
                  }
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  sx={textFieldStyle}
                />

                <TextField
                  label={t("usersAdmin.fields.subscriptionEnd")}
                  name="subscriptionEnd"
                  type="date"
                  value={
                    editData.subscriptionEnd
                      ? editData.subscriptionEnd.substring(0, 10)
                      : ""
                  }
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  sx={textFieldStyle}
                />
              </>
            )}

            {/* نافذة تأكيد ترقية المديرة */}
            <Dialog
              open={pendingRoleChange}
              onClose={() => setPendingRoleChange(false)}
              PaperProps={{
                sx: { borderRadius: 3, p: 1, textAlign: "center" },
              }}
            >
              <DialogTitle sx={{ fontWeight: 700, color: "#d32f2f" }}>
                {t("usersAdmin.confirmRole.title")}
              </DialogTitle>

              <DialogContent>
                <Typography sx={{ fontSize: "1rem", mb: 1 }}>
                  {t("usersAdmin.confirmRole.text")}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {t("usersAdmin.confirmRole.note")}
                </Typography>
              </DialogContent>

              <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
                {/* ❌ إلغاء – نغلق النافذة ولا نغيّر الدور */}
                <Button
                  variant="outlined"
                  onClick={() => {
                    setPendingRoleChange(false);
                    setNewRoleValue(null); // نلغي التغيير
                  }}
                  sx={{ color: "#666", borderColor: "#ccc" }}
                >
                  {t("common.cancel")}
                </Button>

                {/* ✔ موافقة – نطبق الدور الجديد */}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    setPendingRoleChange(false);

                    // هنا يتم التغيير الفعلي
                    setEditData((prev) => ({
                      ...prev,
                      role: newRoleValue,
                    }));

                    setNewRoleValue(null);

                    toast.info(t("usersAdmin.messages.tempAdmin"));
                  }}
                  sx={{
                    fontWeight: 600,
                    backgroundColor: "#1976d2",
                    "&:hover": { backgroundColor: "#1565c0" },
                  }}
                >
                  {t("usersAdmin.confirmRole.confirm")}
                </Button>
              </DialogActions>
            </Dialog>
          </DialogContent>

          <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
            {/* ❌ زر حذف المشتركة */}
            <Button
              color="error"
              onClick={handleDeleteUser}
              sx={{ fontWeight: 600 }}
            >
              {t("usersAdmin.buttons.delete")}
            </Button>

            {/* ❌ زر إلغاء */}
            <Button
              onClick={() => setEditOpen(false)}
              sx={{ color: "#777", fontWeight: 600 }}
            >
              {t("common.cancel")}
            </Button>

            {/* ✔️ زر حفظ */}
            <Button
              variant="contained"
              onClick={handleSave}
              sx={{
                backgroundColor: "#1976d2",
                "&:hover": { backgroundColor: "#1565c0" },
                fontWeight: 600,
              }}
            >
              {t("common.save")}
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          fullWidth
          maxWidth="xs"
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        >
          <DialogTitle
            sx={{ color: "#d32f2f", fontWeight: 700, textAlign: "center" }}
          >
            {t("usersAdmin.confirm.deleteTitle")}
          </DialogTitle>

          <DialogContent>
            <Typography align="center" sx={{ mb: 1.5 }}>
              {t("usersAdmin.confirm.deleteUser")}
            </Typography>
            <Typography
              align="center"
              variant="body2"
              sx={{ color: "text.secondary" }}
            >
              {deleteUser?.username}
            </Typography>
          </DialogContent>

          <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setDeleteConfirmOpen(false)}
              sx={{ color: "#555", borderColor: "#bbb", textTransform: "none" }}
            >
              {t("common.cancel")}
            </Button>

            <Button
              variant="contained"
              color="error"
              onClick={confirmDeleteUser}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              {t("usersAdmin.buttons.delete")}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
