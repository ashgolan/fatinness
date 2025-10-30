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

  // 🔹 جلب ملخص الحجوزات
  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data } = await Api.get("/admin/bookings/summary");

      // ✅ ترتيب المشتركين: من لديهم حجوزات نشطة أولًا، ثم أبجديًا
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

  // 🔹 جلب تفاصيل مشتركة
  const openDetails = async (userId, username) => {
    setSelectedUser({ id: userId, name: username });
    setLoadingDetails(true);
    try {
      const { data } = await Api.get(`/admin/bookings/user/${userId}`);

      const sorted = [...data].sort((a, b) => {
        const order = { booked: 1, completed: 2, cancelled: 3 };
        const statusDiff = order[a.status] - order[b.status];
        if (statusDiff !== 0) return statusDiff;
        return new Date(a.slot?.date || 0) - new Date(b.slot?.date || 0);
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

  const filteredBookings =
    filter === "all"
      ? bookings
      : bookings.filter((b) => b.status === filter);

  // 🔹 حساب الإحصاءات داخل النافذة
  const stats = {
    booked: bookings.filter((b) => b.status === "booked").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    blocked: bookings.filter((b) => b.slot?.isBlocked).length, // ⚠️ معطلة
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        📋 جميع المشتركات وحجوزاتهن
      </Typography>

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
              {/* 🔹 العداد الموجز */}
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

              {/* 🔹 أزرار الفلترة */}
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
                    backgroundColor: b.slot?.isBlocked
                      ? "#eeeeee"
                      : b.status === "booked"
                      ? "#e8f5e9"
                      : b.status === "cancelled"
                      ? "#ffebee"
                      : "#fffde7",
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
                    <b>⚙️ الحالة:</b>{" "}
                    {b.slot?.isBlocked
                      ? "معطلة ⚠️"
                      : b.status === "booked"
                      ? "نشطة ✅"
                      : b.status === "cancelled"
                      ? "ملغاة ❌"
                      : "منجزة 🏁"}
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
