import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Api } from "../../api/Api";
import { toast } from "react-toastify";

export default function BookingsAdmin() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filter, setFilter] = useState("all");

  // 🔹 نسب متحركة
  const [animated, setAnimated] = useState({
    active: 0,
    completed: 0,
    cancelled: 0,
    blocked: 0,
  });

  const getDisplayStatus = (b) => {
    if (!b.slot) return "unknown";
    if (b.slot.isBlocked) return "blocked";
    const now = new Date();
    const end = new Date(b.slot.date);
    if (b.slot.endTime) {
      const [h, m] = b.slot.endTime.split(":");
      end.setHours(Number(h), Number(m), 0, 0);
    }
    if (b.status === "booked" && now > end) return "completed";
    return b.status;
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data } = await Api.get("/admin/bookings/summary");
      const sorted = [...data].sort((a, b) => {
        if (a.active > 0 && b.active === 0) return -1;
        if (a.active === 0 && b.active > 0) return 1;
        const nameA = (a.username || "").trim().toLowerCase();
        const nameB = (b.username || "").trim().toLowerCase();
        return nameA.localeCompare(nameB, "ar");
      });
      setSummary(sorted);
    } catch {
      toast.error("حدث خطأ أثناء تحميل بيانات المشتركات");
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (userId, username) => {
    setSelectedUser({ id: userId, name: username });
    setLoadingDetails(true);
    try {
      const { data } = await Api.get(`/admin/bookings/user/${userId}`);
      const sorted = [...data].sort((a, b) => {
        const order = { booked: 1, completed: 2, cancelled: 3, blocked: 4 };
        const aStatus = getDisplayStatus(a);
        const bStatus = getDisplayStatus(b);
        return order[aStatus] - order[bStatus];
      });
      setBookings(sorted);
    } catch {
      toast.error("حدث خطأ أثناء جلب تفاصيل الحجوزات");
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeDialog = () => {
    setSelectedUser(null);
    setBookings([]);
    setFilter("all");
  };

  const handleFilterChange = (event, newFilter) => {
    if (newFilter) setFilter(newFilter);
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // 🔹 فلترة الحجوزات حسب الحالة
  const filteredBookings =
    filter === "all"
      ? bookings
      : bookings.filter((b) => getDisplayStatus(b) === filter);

  // 🔹 حساب الإحصاءات
  const stats = {
    booked: bookings.filter((b) => getDisplayStatus(b) === "booked").length,
    completed: bookings.filter((b) => getDisplayStatus(b) === "completed").length,
    cancelled: bookings.filter((b) => getDisplayStatus(b) === "cancelled").length,
    blocked: bookings.filter((b) => getDisplayStatus(b) === "blocked").length,
  };

  const getColorByStatus = (b) => {
    const s = getDisplayStatus(b);
    if (s === "blocked") return "#eeeeee";
    if (s === "booked") return "#e8f5e9";
    if (s === "completed") return "#fffde7";
    if (s === "cancelled") return "#ffebee";
    return "#fafafa";
  };

  const getLabelByStatus = (b) => {
    const s = getDisplayStatus(b);
    if (s === "blocked") return "معطلة ⚠️";
    if (s === "booked") return "نشطة ✅";
    if (s === "completed") return "منجزة 🏁";
    if (s === "cancelled") return "ملغاة ❌";
    return "غير معروفة";
  };

  // 🔹 حساب نسب الحالات من summary
  const totalAll = summary.reduce(
    (acc, s) => acc + s.active + s.cancelled + s.completed,
    0
  );
  const totalActive = summary.reduce((acc, s) => acc + s.active, 0);
  const totalCompleted = summary.reduce((acc, s) => acc + s.completed, 0);
  const totalCancelled = summary.reduce((acc, s) => acc + s.cancelled, 0);
  const totalBlocked = 0;

  const activePercent = totalAll ? (totalActive / totalAll) * 100 : 0;
  const completedPercent = totalAll ? (totalCompleted / totalAll) * 100 : 0;
  const cancelledPercent = totalAll ? (totalCancelled / totalAll) * 100 : 0;
  const blockedPercent = totalAll ? (totalBlocked / totalAll) * 100 : 0;

  // 🔸 تشغيل الأنيميشن التدريجي
  useEffect(() => {
    let frame = 0;
    const duration = 25; // عدد الإطارات
    const animate = setInterval(() => {
      frame++;
      setAnimated({
        active: (activePercent / duration) * frame,
        completed: (completedPercent / duration) * frame,
        cancelled: (cancelledPercent / duration) * frame,
        blocked: (blockedPercent / duration) * frame,
      });
      if (frame >= duration) clearInterval(animate);
    }, 25);
    return () => clearInterval(animate);
  }, [activePercent, completedPercent, cancelledPercent, blockedPercent]);

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        📋 جميع المشتركات وحجوزاتهن
      </Typography>

      {/* 🔹 شريط النسب المتحرك */}
      {summary.length > 0 && (
        <Paper
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            boxShadow: 3,
            background: "#fafafa",
          }}
        >
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            🔸 توزيع الحالات بين جميع الحجوزات:
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              height: 24,
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: "#eee",
              boxShadow: "inset 0 2px 5px rgba(0,0,0,0.15)",
            }}
          >
            <Box
              sx={{
                width: `${animated.active}%`,
                background: "linear-gradient(90deg, #4caf50, #81c784)",
                height: "100%",
                transition: "width 0.3s ease",
              }}
            />
            <Box
              sx={{
                width: `${animated.completed}%`,
                background: "linear-gradient(90deg, #fff176, #fbc02d)",
                height: "100%",
                transition: "width 0.3s ease",
              }}
            />
            <Box
              sx={{
                width: `${animated.cancelled}%`,
                background: "linear-gradient(90deg, #ef9a9a, #f44336)",
                height: "100%",
                transition: "width 0.3s ease",
              }}
            />
            <Box
              sx={{
                width: `${animated.blocked}%`,
                background: "linear-gradient(90deg, #ffb74d, #ff9800)",
                height: "100%",
                transition: "width 0.3s ease",
              }}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              ✅ نشطة: {animated.active.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              🏁 منجزة: {animated.completed.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ❌ ملغاة: {animated.cancelled.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ⚠️ معطلة: {animated.blocked.toFixed(1)}%
            </Typography>
          </Box>
        </Paper>
      )}

      {/* ✅ جدول ملخص الحجوزات */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : summary.length ? (
        <Paper sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell>المشتركة</TableCell>
                <TableCell align="center">النشطة ✅</TableCell>
                <TableCell align="center">الملغاة ❌</TableCell>
                <TableCell align="center">المنجزة 🏁</TableCell>
                <TableCell align="center">التفاصيل 🔍</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summary.map((row) => (
                <TableRow key={row.userId}>
                  <TableCell>{row.username}</TableCell>
                  <TableCell align="center">{row.active}</TableCell>
                  <TableCell align="center">{row.cancelled}</TableCell>
                  <TableCell align="center">{row.completed}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => openDetails(row.userId, row.username)}
                    >
                      عرض
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      ) : (
        <Typography sx={{ textAlign: "center", mt: 3 }}>
          لا توجد بيانات حاليًا.
        </Typography>
      )}

      {/* 🪟 نافذة تفاصيل المشتركة */}
      <Dialog open={!!selectedUser} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>
          📅 تفاصيل حجوزات {selectedUser?.name}
        </DialogTitle>
        <DialogContent>
          {loadingDetails ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
              <CircularProgress />
            </Box>
          ) : bookings.length ? (
            <>
              {/* 🔹 العداد */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-around",
                  mb: 2,
                  mt: 1,
                  background: "#f7f7f7",
                  p: 1.2,
                  borderRadius: 2,
                }}
              >
                <Typography>نشطة: ✅ {stats.booked}</Typography>
                <Typography>منجزة: 🏁 {stats.completed}</Typography>
                <Typography>ملغاة: ❌ {stats.cancelled}</Typography>
                <Typography sx={{ color: "#ff9800" }}>
                  معطلة: ⚠️ {stats.blocked}
                </Typography>
                <Typography sx={{ fontWeight: "bold" }}>
                  الإجمالي: {bookings.length}
                </Typography>
              </Box>

              {/* 🔹 الفلاتر */}
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <ToggleButtonGroup
                  value={filter}
                  exclusive
                  onChange={handleFilterChange}
                  size="small"
                  color="primary"
                >
                  <ToggleButton value="all">الكل</ToggleButton>
                  <ToggleButton value="booked">نشطة</ToggleButton>
                  <ToggleButton value="completed">منجزة</ToggleButton>
                  <ToggleButton value="cancelled">ملغاة</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* 🔹 عرض الحجوزات */}
              {filteredBookings.map((b) => (
                <Paper
                  key={b._id}
                  sx={{
                    p: 1.5,
                    mb: 1.5,
                    backgroundColor: getColorByStatus(b),
                  }}
                >
                  <Typography>
                    <b>📆 التاريخ:</b>{" "}
                    {b.slot?.date
                      ? new Date(b.slot.date).toLocaleDateString("ar-EG")
                      : "—"}
                  </Typography>
                  <Typography>
                    <b>🕒 الوقت:</b> {b.slot?.startTime || "—"}
                  </Typography>
                  <Typography>
                    <b>⚙️ الحالة:</b> {getLabelByStatus(b)}
                  </Typography>
                </Paper>
              ))}
            </>
          ) : (
            <Typography sx={{ my: 2 }}>لا توجد حجوزات لهذه المشتركة.</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
