import express from "express";
import {
  createWeekTemplate,
  getWeekTemplates,
  deleteWeekTemplate,
  applyTemplate,
  setUserExtraBooking,
  exportAttendanceReport,
  getDashboardStats,
  getSchedulerStatus,
  getAllUsers,
  toggleUserBlock,
  sendCustomNotification,
  getNotificationsHistory,
  getSettings,
  updateSettings,
  uploadLogo,
  upload,
  updateUserByAdmin,
  getBookingsSummary,
  getUserBookings,
  deleteNotificationById,
  clearAllNotifications,
} from "../controllers/admin.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import { updateUserRole } from "../controllers/auth.controller.js";

const router = express.Router();

//
// ⚙️ الإعدادات (عام)
// 🔓 هذا المسار مسموح لأي مستخدم (حتى بدون تسجيل الدخول)
router.get("/settings", getSettings);

//
// 🧩 المسارات المحمية بعد تسجيل الدخول كأدمن
//
router.use(authMiddleware);
router.use(adminMiddleware);

//
// 🧩 إدارة القوالب الأسبوعية
//
router.get("/templates", getWeekTemplates);
router.post("/templates", createWeekTemplate);
router.delete("/templates/:id", deleteWeekTemplate);
router.post("/templates/apply", applyTemplate);

//
// 👥 إدارة المستخدمين
//
router.get("/users", getAllUsers);
router.put("/users/extra-booking", setUserExtraBooking);
router.put("/users/:id/block", toggleUserBlock);

//
// 📊 الإحصاءات والتقارير
//
router.get("/dashboard", getDashboardStats);
router.get("/reports/attendance", exportAttendanceReport);

//
// ⚙️ الإعدادات (محمي للتعديل فقط)
//
router.put("/settings", updateSettings);
router.post("/settings/logo", upload.single("logo"), uploadLogo);

router.get("/bookings/summary", getBookingsSummary);
router.get("/bookings/user/:id", getUserBookings);

//
// 🔔 الإشعارات
//
router.post("/notify", sendCustomNotification);
router.get("/notifications", getNotificationsHistory);

router.put("/users/role", updateUserRole);

//
// 🕓 حالة المجدول (Scheduler)
//
router.get("/scheduler/status", getSchedulerStatus);

router.put("/users/:id", updateUserByAdmin);

// 🗑️ حذف إشعار واحد
router.delete("/notifications/:id", deleteNotificationById);

// 🧹 مسح جميع الإشعارات
router.delete("/notifications", clearAllNotifications);
export default router;
