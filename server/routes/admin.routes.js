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
} from "../controllers/admin.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import { admin } from "googleapis/build/src/apis/admin/index.js";

const router = express.Router();

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
// ⚙️ الإعدادات
//
router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.post("/settings/logo", upload.single("logo"), uploadLogo);

router.get("/bookings/summary", authMiddleware, adminMiddleware, getBookingsSummary);
router.get("/bookings/user/:id", authMiddleware, adminMiddleware, getUserBookings);

//
// 🔔 الإشعارات
//
router.post("/notify", sendCustomNotification);
router.get("/notifications", getNotificationsHistory);

//
// 🕓 حالة المجدول (Scheduler)
//
router.get("/scheduler/status", getSchedulerStatus);

router.put("/users/:id", authMiddleware, adminMiddleware, updateUserByAdmin);

export default router;
