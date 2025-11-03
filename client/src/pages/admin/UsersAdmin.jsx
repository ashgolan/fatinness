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
import WcIcon from "@mui/icons-material/Wc";
import HeightIcon from "@mui/icons-material/Height";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import CakeIcon from "@mui/icons-material/Cake";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";

export default function UsersAdmin() {
  const theme = useTheme();

  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
  });

  // 🔹 جلب المشتركات
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

  // 🟢 السماح بالحجز الإضافي
  const toggleExtraBooking = async (user) => {
    try {
      const { data } = await Api.put("/admin/users/extra-booking", {
        userId: user._id,
        allow: !user.allowExtraBookings,
      });

      toast.success(data.message || "تم تحديث حالة الحجز الإضافي");
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

  // 🚫 حظر / إلغاء حظر
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

      const updatedUser = {
        ...user,
        isBlocked: !user.isBlocked,
        ...(data.user || {}),
      };

      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...updatedUser } : u))
      );
      setFiltered((prev) =>
        prev.map((u) => (u._id === user._id ? { ...updatedUser } : u))
      );
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء تعديل حالة الحظر");
    }
  };

  // ✏️ تعديل بيانات
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
      role: user.role || "user", // 👈 تمت الإضافة هنا
    });
    setEditOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const { data } = await Api.put(`/admin/users/${editUser._id}`, editData);
      toast.success("تم تحديث بيانات المشتركة بنجاح ✅");
      setEditOpen(false);
      setUsers((prev) =>
        prev.map((u) => (u._id === editUser._id ? data.user : u))
      );
      setFiltered((prev) =>
        prev.map((u) => (u._id === editUser._id ? data.user : u))
      );
    } catch (err) {
      console.error(err);
      toast.error("فشل تحديث بيانات المشتركة");
    }
  };

  // 🎨 أنماط الحقول
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

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        py: 4,
        px: { xs: 2, sm: 3 },
        transition: "background-color 0.3s ease, color 0.3s ease",
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* رأس الصفحة */}
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: "12px",
            background: "linear-gradient(90deg,#1976d2,#42a5f5)",
            color: "#fff",
            boxShadow: 3,
            transition: "0.3s",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ width: 56, height: 56, backgroundColor: "#fff" }}>
              <PersonIcon sx={{ fontSize: 30, color: "#1976d2" }} />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                إدارة المشتركات
              </Typography>
              <Typography variant="body2">
                إدارة بيانات وحجوزات المشتركات في الاستوديو
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* شريط البحث */}
        <Paper
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: "12px",
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            transition: "0.3s",
          }}
        >
          <TextField
            fullWidth
            placeholder="ابحثي بالاسم أو البريد الإلكتروني أو رقم الهاتف..."
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

        {/* قائمة المشتركات */}
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
          <Grid
            container
            spacing={2.5}
            justifyContent="center"
            alignItems="stretch"
          >
            {filtered.map((user) => (
              <Grid item xs={12} sm={6} lg={4} key={user._id}>
                <Paper
                  sx={{
                    p: 2.5,
                    position: "relative", // ✅ أضف هذا
                    borderRadius: "14px",
                    backgroundColor: theme.palette.background.paper,
                    border: "1.5px solid rgba(255, 215, 0, 0.4)", // ذهبي خفيف جدًا
                    boxShadow: "0 2px 10px rgba(255, 215, 0, 0.08)", // ظل ناعم جدًا
                    transition: "all 0.3s ease",
                    "&:hover": {
                      boxShadow: "0 3px 14px rgba(255, 215, 0, 0.2)", // توهج خفيف عند المرور
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  {user.role === "admin" && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: -10,
                        right: -10,
                        backgroundColor: "#fff",
                        borderRadius: "50%",
                        border: "2px solid #ffeb3b",
                        padding: "4px 6px",
                        boxShadow: "0 0 10px rgba(255, 215, 0, 0.6)",
                        fontSize: "18px",
                        zIndex: 3,
                      }}
                    >
                      👑
                    </Box>
                  )}
                  {/* رأس البطاقة */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    {/* 👤 اسم المشتركة */}
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

                      {/* 🔹 رمز الحالة */}
                      {user.isBlocked ? (
                        <Typography
                          title="محظورة"
                          sx={{ fontSize: 22, lineHeight: 1, opacity: 0.9 }}
                        >
                          👩‍🦰❌
                        </Typography>
                      ) : (
                        <Typography
                          title="نشطة"
                          sx={{ fontSize: 22, lineHeight: 1, opacity: 0.9 }}
                        >
                          👩‍🦰✅
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  {/* معلومات المشتركة */}
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
                        عدد الحجوزات: {user.totalBookings || 0}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  {/* السماح بالحجز الإضافي */}
                  <FormControlLabel
                    control={
                      <Switch
                        checked={user.allowExtraBookings}
                        onChange={() => toggleExtraBooking(user)}
                        disabled={user.isBlocked}
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: "#FFD700", // ذهبي رئيسي
                            filter:
                              "drop-shadow(0 0 6px rgba(255, 215, 0, 0.7))",
                          },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                            {
                              backgroundColor: "#ffeb3b", // ذهبي فاتح للمسار
                              boxShadow: "0 0 8px rgba(255, 215, 0, 0.5)",
                            },
                          "& .MuiSwitch-track": {
                            backgroundColor: "#e0e0e0",
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
                        السماح بالحجز الإضافي
                      </Typography>
                    }
                    sx={{ mb: 2 }}
                  />
                  {/* الأزرار */}
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => handleEdit(user)}
                      sx={{
                        borderColor: "#1976d2",
                        color: "#1976d2",
                        fontWeight: 600,
                        borderRadius: "8px",
                        textTransform: "none",
                        "&:hover": {
                          backgroundColor: "rgba(25,118,210,0.04)",
                        },
                      }}
                    >
                      <EditIcon sx={{ fontSize: 18, mr: 0.5 }} />
                      تعديل
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => toggleUserBlock(user)}
                      sx={{
                        backgroundColor: user.isBlocked ? "#66bb6a" : "#ef5350",
                        fontWeight: 600,
                        borderRadius: "8px",
                        textTransform: "none",
                        "&:hover": {
                          backgroundColor: user.isBlocked
                            ? "#57a95b"
                            : "#e53935",
                        },
                      }}
                    >
                      <BlockIcon sx={{ fontSize: 18, mr: 0.5 }} />
                      {user.isBlocked ? "إلغاء الحظر" : "حظر"}
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
              لا توجد مشتركات مطابقة للبحث
            </Typography>
          </Paper>
        )}

        {/* نافذة تعديل بيانات المشتركة */}
        <Dialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: { borderRadius: "12px", p: 1 },
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, color: "#1976d2" }}>
            تعديل بيانات المشتركة
          </DialogTitle>
          <DialogContent sx={{ display: "grid", gap: 2, mt: 1 }}>
            <TextField
              label="الاسم"
              name="username"
              value={editData.username}
              onChange={handleChange}
              sx={textFieldStyle}
            />
            <TextField
              label="البريد الإلكتروني"
              name="email"
              value={editData.email}
              onChange={handleChange}
              sx={textFieldStyle}
            />
            <TextField
              label="رقم الهاتف"
              name="phone"
              value={editData.phone}
              onChange={handleChange}
              sx={textFieldStyle}
            />
            <TextField
              label="الطول (سم)"
              name="height"
              type="number"
              value={editData.height}
              onChange={handleChange}
              sx={textFieldStyle}
            />
            <TextField
              label="الوزن (كغ)"
              name="weight"
              type="number"
              value={editData.weight}
              onChange={handleChange}
              sx={textFieldStyle}
            />
            <TextField
              label="العمر"
              name="age"
              type="number"
              value={editData.age}
              onChange={handleChange}
              sx={textFieldStyle}
            />
            <TextField
              select
              label="الجنس"
              name="gender"
              value={editData.gender}
              onChange={handleChange}
              sx={textFieldStyle}
            >
              <MenuItem value="female">أنثى</MenuItem>
              <MenuItem value="male">ذكر</MenuItem>
            </TextField>
            <TextField
              select
              label="الدور"
              name="role"
              value={editData.role || "user"}
              onChange={handleChange}
              sx={textFieldStyle}
            >
              <MenuItem value="user">مشتركة</MenuItem>
              <MenuItem value="admin">مديرة</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
            <Button
              onClick={() => setEditOpen(false)}
              sx={{ color: "#777", fontWeight: 600 }}
            >
              إلغاء
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              sx={{
                backgroundColor: "#1976d2",
                "&:hover": { backgroundColor: "#1565c0" },
                fontWeight: 600,
              }}
            >
              حفظ التغييرات
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
