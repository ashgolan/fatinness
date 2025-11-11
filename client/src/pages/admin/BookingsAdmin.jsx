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
  Chip,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search"; // 👈 أضف هذا الاستيراد بالأعلى
import { Api } from "../../api/Api";
import { toast } from "react-toastify";

export default function BookingsAdmin() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filter, setFilter] = useState("all");

  const [animated, setAnimated] = useState({
    active: 0,
    completed: 0,
    cancelled: 0,
    blocked: 0,
  });
  const [showAllCols, setShowAllCols] = useState(false);

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
      toast.error("حدث خطأ أثناء تحميل بيانات الحجوزات");
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
        return order[getDisplayStatus(a)] - order[getDisplayStatus(b)];
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
      : bookings.filter((b) => getDisplayStatus(b) === filter);

  const stats = {
    booked: bookings.filter((b) => getDisplayStatus(b) === "booked").length,
    completed: bookings.filter((b) => getDisplayStatus(b) === "completed")
      .length,
    cancelled: bookings.filter((b) => getDisplayStatus(b) === "cancelled")
      .length,
    blocked: bookings.filter((b) => getDisplayStatus(b) === "blocked").length,
  };

  const getLabelByStatus = (b) => {
    const s = getDisplayStatus(b);
    if (s === "blocked") return "معطلة";
    if (s === "booked") return "نشطة";
    if (s === "completed") return "منجزة";
    if (s === "cancelled") return "ملغاة";
    return "غير معروفة";
  };

  const getStatusChipStyle = (b) => {
    const s = getDisplayStatus(b);
    const base = {
      fontWeight: 600,
      border: "1px solid transparent",
    };
    if (s === "blocked")
      return { ...base, backgroundColor: "#fff3e0", color: "#e65100" };
    if (s === "booked")
      return { ...base, backgroundColor: "#e8f5e9", color: "#2e7d32" };
    if (s === "completed")
      return { ...base, backgroundColor: "#fff9c4", color: "#b8860b" };
    if (s === "cancelled")
      return { ...base, backgroundColor: "#ffebee", color: "#c62828" };
    return { ...base, backgroundColor: "#f5f5f5", color: "#757575" };
  };

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

  useEffect(() => {
    let frame = 0;
    const duration = 25;
    const animate = setInterval(() => {
      frame++;
      setAnimated({
        active: (activePercent / duration) * frame,
        completed: (completedPercent / duration) * frame,
        cancelled: (cancelledPercent / duration) * frame,
        blocked: (blockedPercent / duration) * frame,
      });
      if (frame >= duration) clearInterval(animate);
    }, 20);
    return () => clearInterval(animate);
  }, [activePercent, completedPercent, cancelledPercent, blockedPercent]);

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        background: isDark
          ? "linear-gradient(180deg, #0d1117, #1a1f25)"
          : "linear-gradient(180deg, #fdfcf8, #f5f5f5)",
        py: 4,
        px: { xs: 2, sm: 4 },
        transition: "background 0.5s ease",
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* العنوان */}
        <Typography
          variant="h5"
          sx={{
            mb: 3,
            fontWeight: 700,
            color: isDark ? "#FFD700" : "#A01860",
            textShadow: isDark
              ? "0 0 10px rgba(255,215,0,0.4)"
              : "0 0 6px rgba(160,24,96,0.2)",
          }}
        >
          📋 إدارة الحجوزات
        </Typography>

        {/* 🌈 شريط نسب الحجوزات المتطور */}
        {!loading && summary.length > 0 && (
          <Paper
            sx={{
              p: 3,
              mb: 4,
              borderRadius: "14px",
              background: isDark
                ? "linear-gradient(145deg, #11161b, #1e242b)"
                : "linear-gradient(145deg, #ffffff, #fafafa)",
              border: "1.5px solid rgba(255,215,0,0.3)",
              boxShadow: isDark
                ? "0 0 12px rgba(255,215,0,0.15)"
                : "0 2px 10px rgba(0,0,0,0.05)",
              overflow: "hidden",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                mb: 2,
                fontWeight: 700,
                color: isDark ? "#FFD700" : "#A01860",
                textAlign: "center",
              }}
            >
              🔸 نسب الحجوزات الإجمالية:
            </Typography>

            {/* 🟩 الشريط المتدرج */}
            <Box
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                height: 32,
                borderRadius: 16,
                overflow: "hidden",
                backgroundColor: isDark ? "#3a2d4f" : "#f3e5f5",
                boxShadow: "inset 0 0 8px rgba(0,0,0,0.1)",
              }}
            >
              {/* نشطة */}
              <Box
                sx={{
                  width: `${animated.active}%`,
                  background: isDark
                    ? "linear-gradient(90deg,#7b1fa2,#ce93d8)"
                    : "linear-gradient(90deg,#ec407a,#ab47bc)",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  transition: "width 0.4s ease",
                  borderRight:
                    animated.active > 0
                      ? "1px solid rgba(255,255,255,0.2)"
                      : "none",
                }}
              >
                {animated.active >= 8 && `${animated.active.toFixed(0)}%`}
              </Box>

              {/* منجزة */}
              <Box
                sx={{
                  width: `${animated.completed}%`,
                  background: isDark
                    ? "linear-gradient(90deg,#fff59d,#fbc02d)"
                    : "linear-gradient(90deg,#fff176,#ffd54f)",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isDark ? "#333" : "#333",
                  fontWeight: 700,
                  fontSize: 13,
                  transition: "width 0.4s ease",
                  borderRight:
                    animated.completed > 0
                      ? "1px solid rgba(255,255,255,0.3)"
                      : "none",
                }}
              >
                {animated.completed >= 8 && `${animated.completed.toFixed(0)}%`}
              </Box>

              {/* ملغاة */}
              <Box
                sx={{
                  width: `${animated.cancelled}%`,
                  background: isDark
                    ? "linear-gradient(90deg,#e57373,#ef5350)"
                    : "linear-gradient(90deg,#ef9a9a,#f44336)",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  transition: "width 0.4s ease",
                }}
              >
                {animated.cancelled >= 8 && `${animated.cancelled.toFixed(0)}%`}
              </Box>
            </Box>

            {/* 🔹 دلالات الألوان والنسب */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-around",
                mt: 2.5,
                flexWrap: "wrap",
                gap: 1.5,
                textAlign: "center",
              }}
            >
              {/* نشطة */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: "linear-gradient(90deg,#ec407a,#ab47bc)",
                    boxShadow: "0 0 5px rgba(236,64,122,0.5)",
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: isDark ? "#fff" : "#333",
                    fontWeight: 600,
                  }}
                >
                  ✅ نشطة ({animated.active.toFixed(1)}%)
                </Typography>
              </Box>

              {/* منجزة */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: "linear-gradient(90deg,#fff176,#ffd54f)",
                    boxShadow: "0 0 5px rgba(255,213,79,0.6)",
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: isDark ? "#fff" : "#333",
                    fontWeight: 600,
                  }}
                >
                  🏆 منجزة ({animated.completed.toFixed(1)}%)
                </Typography>
              </Box>

              {/* ملغاة */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: "linear-gradient(90deg,#ef5350,#f44336)",
                    boxShadow: "0 0 5px rgba(244,67,54,0.5)",
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: isDark ? "#fff" : "#333",
                    fontWeight: 600,
                  }}
                >
                  ❌ ملغاة ({animated.cancelled.toFixed(1)}%)
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}
        {/* 🔘 زر عرض / إخفاء الأعمدة */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowAllCols(!showAllCols)}
            startIcon={
              showAllCols ? (
                <span style={{ fontSize: 18 }}>👁️‍🗨️</span>
              ) : (
                <span style={{ fontSize: 18 }}>👁️</span>
              )
            }
            sx={{
              color: isDark ? "#FFD700" : "#A01860",
              borderColor: isDark ? "#FFD700" : "#A01860",
              borderRadius: "30px",
              px: 2,
              gap: 1.5, // 👈 هذا السطر يضيف المسافة
              textTransform: "none",
              fontWeight: 600,
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor: isDark
                  ? "rgba(255,215,0,0.1)"
                  : "rgba(160,24,96,0.08)",
                transform: "scale(1.05)",
              },
            }}
          >
            {showAllCols ? "إخفاء التفاصيل" : "عرض التفاصيل"}
          </Button>
        </Box>

        {/* الجدول الرئيسي */}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 400,
            }}
          >
            <CircularProgress sx={{ color: "#FFD700" }} />
          </Box>
        ) : summary.length ? (
          <Paper
            sx={{
              background: isDark
                ? "linear-gradient(145deg, #11161b, #1e242b)"
                : "linear-gradient(145deg, #ffffff, #fafafa)",
              borderRadius: "14px",
              border: "1.5px solid rgba(255,215,0,0.3)",
              boxShadow: isDark
                ? "0 0 14px rgba(255,215,0,0.15)"
                : "0 2px 10px rgba(0,0,0,0.05)",
              overflow: "hidden",
            }}
          >
            <Box
              dir="rtl"
              sx={{
                width: "100%",
                overflowX: showAllCols ? "auto" : "hidden", // ✅ تمرير فقط عند عرض التفاصيل
              }}
            >
              <Table
                sx={{
                  width: "100%",
                  tableLayout: "fixed", // ✅ يضغط الأعمدة بالتساوي
                  minWidth: showAllCols ? 700 : "100%", // ✅ توسيع بسيط عند التفاصيل فقط
                  "& th, & td": {
                    padding: showAllCols ? "8px 6px" : "6px 3px", // ✅ تقليل الفراغات في الوضع العادي
                    fontSize: showAllCols ? 14 : 13,
                    whiteSpace: "nowrap",
                  },
                }}
              >
                {" "}
                <TableHead>
                  <TableRow
                    sx={{ backgroundColor: isDark ? "#222831" : "#fdfdfd" }}
                  >
                    <TableCell
                      align="center"
                      sx={{
                        color: isDark ? "#FFD700" : "#444",
                        fontWeight: 600,
                      }}
                    >
                      المشتركة
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ color: "#4caf50", fontWeight: 600 }}
                    >
                      النشطة
                    </TableCell>

                    {/* ✅ الأعمدة الإضافية تظهر فقط عند تفعيل الزر */}
                    {showAllCols && (
                      <>
                        <TableCell
                          align="center"
                          sx={{ color: "#c62828", fontWeight: 600 }}
                        >
                          الملغاة
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ color: "#b8860b", fontWeight: 600 }}
                        >
                          المنجزة
                        </TableCell>
                      </>
                    )}

                    <TableCell
                      align="center"
                      sx={{
                        color: isDark ? "#FFD700" : "#A01860",
                        fontWeight: 600,
                      }}
                    >
                      الإجراءات
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.map((row) => (
                    <TableRow
                      key={row.userId}
                      sx={{
                        "&:hover": {
                          backgroundColor: isDark
                            ? "rgba(255,215,0,0.05)"
                            : "rgba(160,24,96,0.05)",
                        },
                        transition: "0.3s",
                      }}
                    >
                      <TableCell
                        align="center" // ✅ يوسّط الاسم أفقيًا داخل العمود
                        sx={{
                          color: isDark ? "#fff" : "#111",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {row.username}
                      </TableCell>
                      <TableCell align="center" sx={{ color: "#4caf50" }}>
                        {row.active}
                      </TableCell>
                      {showAllCols && (
                        <>
                          <TableCell align="center" sx={{ color: "#c62828" }}>
                            {row.cancelled}
                          </TableCell>
                          <TableCell align="center" sx={{ color: "#b8860b" }}>
                            {row.completed}
                          </TableCell>
                        </>
                      )}

                      <TableCell align="center">
                        <Button
                          onClick={() => openDetails(row.userId, row.username)}
                          sx={{
                            minWidth: 0,
                            p: 1,
                            borderRadius: "50%",
                            backgroundColor: isDark
                              ? "rgba(255,215,0,0.15)"
                              : "rgba(160,24,96,0.1)",
                            color: isDark ? "#FFD700" : "#A01860",
                            "&:hover": {
                              backgroundColor: isDark
                                ? "rgba(255,215,0,0.25)"
                                : "rgba(160,24,96,0.2)",
                              transform: "scale(1.1)",
                              transition: "all 0.2s ease",
                            },
                          }}
                        >
                          <SearchIcon sx={{ fontSize: 22 }} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        ) : (
          <Typography
            sx={{
              mt: 5,
              textAlign: "center",
              color: isDark ? "#999" : "#777",
            }}
          >
            لا توجد بيانات حاليًا
          </Typography>
        )}
      </Box>

      {/* نافذة التفاصيل */}
      <Dialog
        open={!!selectedUser}
        onClose={closeDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: "12px",
            background: isDark
              ? "linear-gradient(145deg, #11161b, #1e242b)"
              : "linear-gradient(145deg, #ffffff, #fafafa)",
            border: "1.5px solid rgba(255,215,0,0.3)",
            boxShadow: isDark
              ? "0 0 14px rgba(255,215,0,0.15)"
              : "0 2px 10px rgba(0,0,0,0.05)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: isDark ? "#FFD700" : "#A01860",
            borderBottom: "1px solid rgba(255,215,0,0.2)",
          }}
        >
          تفاصيل حجوزات {selectedUser?.name}
        </DialogTitle>
        <DialogContent sx={{ mt: 3, pb: 3 }}>
          {loadingDetails ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress sx={{ color: "#FFD700" }} />
            </Box>
          ) : bookings.length ? (
            <>
              {/* الإحصائيات */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-around",
                  mb: 3,
                  p: 2,
                  borderRadius: "8px",
                  background: isDark
                    ? "rgba(255,215,0,0.05)"
                    : "rgba(160,24,96,0.05)",
                }}
              >
                {[
                  { label: "نشطة", value: stats.booked, color: "#4caf50" },
                  { label: "منجزة", value: stats.completed, color: "#b8860b" },
                  { label: "ملغاة", value: stats.cancelled, color: "#c62828" },
                  { label: "معطلة", value: stats.blocked, color: "#e65100" },
                ].map((s) => (
                  <Box key={s.label} sx={{ textAlign: "center" }}>
                    <Typography
                      sx={{ fontSize: "22px", fontWeight: 700, color: s.color }}
                    >
                      {s.value}
                    </Typography>
                    <Typography sx={{ fontSize: "13px", color: "#888" }}>
                      {s.label}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* الفلاتر */}
              <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                <ToggleButtonGroup
                  value={filter}
                  exclusive
                  onChange={handleFilterChange}
                  size="small"
                  sx={{
                    "& .MuiToggleButton-root": {
                      textTransform: "none",
                      fontSize: "13px",
                      px: 2,
                      py: 0.5,
                      color: isDark ? "#ccc" : "#666",
                      borderColor: "rgba(255,215,0,0.3)",
                      "&.Mui-selected": {
                        backgroundColor: isDark ? "#FFD700" : "#A01860",
                        color: isDark ? "#111" : "#fff",
                        borderColor: isDark ? "#FFD700" : "#A01860",
                        "&:hover": {
                          backgroundColor: isDark ? "#e6c300" : "#8a1450",
                        },
                      },
                    },
                  }}
                >
                  <ToggleButton value="all">الكل</ToggleButton>
                  <ToggleButton value="booked">نشطة</ToggleButton>
                  <ToggleButton value="completed">منجزة</ToggleButton>
                  <ToggleButton value="cancelled">ملغاة</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* جدول الحجوزات */}
              <Paper
                sx={{
                  background: isDark
                    ? "linear-gradient(145deg, #11161b, #1e242b)"
                    : "linear-gradient(145deg, #ffffff, #fafafa)",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "1px solid rgba(255,215,0,0.2)",
                }}
              >
                {/* ✅ إصلاح الاتجاه واستخدام Box الصحيح */}
                <Box
                  dir="rtl"
                  sx={{
                    width: "100%",
                    overflowX: "hidden", // ✅ لا تمرير أبدًا
                  }}
                >
                  <Table
                    sx={{
                      width: "100%",
                      tableLayout: "fixed", // ✅ يضغط الأعمدة بالتساوي
                      "& th, & td": {
                        textAlign: "center",
                        direction: "rtl",
                        padding: "6px 4px", // ✅ يقلل المسافات
                        fontSize: 13,
                        whiteSpace: "nowrap",
                      },
                    }}
                  >
                    <TableHead>
                      <TableRow
                        sx={{
                          backgroundColor: isDark ? "#222831" : "#fdfdfd",
                        }}
                      >
                        <TableCell
                          align="center"
                          sx={{ fontWeight: 600, fontSize: 13 }}
                        >
                          التاريخ
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ fontWeight: 600, fontSize: 13 }}
                        >
                          الوقت
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ fontWeight: 600, fontSize: 13 }}
                        >
                          الحالة
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredBookings.map((b) => (
                        <TableRow
                          key={b._id}
                          sx={{
                            "&:hover": {
                              backgroundColor: isDark
                                ? "rgba(255,215,0,0.03)"
                                : "rgba(160,24,96,0.03)",
                            },
                          }}
                        >
                          <TableCell align="center" sx={{ fontSize: 14 }}>
                            {b.slot?.date
                              ? new Date(b.slot.date).toLocaleDateString(
                                  "ar-EG"
                                )
                              : "—"}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              fontSize: 14,
                              color: isDark ? "#FFD700" : "#A01860",
                              fontWeight: 600,
                            }}
                          >
                            {b.slot
                              ? `${b.slot.startTime || "—"}${
                                  b.slot.endTime ? ` - ${b.slot.endTime}` : ""
                                }`
                              : "—"}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={getLabelByStatus(b)}
                              size="small"
                              sx={{
                                ...getStatusChipStyle(b),
                                fontSize: 12,
                                height: 24,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Paper>
            </>
          ) : (
            <Typography sx={{ textAlign: "center", py: 4, color: "#999" }}>
              لا توجد حجوزات لهذه المشتركة
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
