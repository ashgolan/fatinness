import express from "express";
import {
  createWeekTemplate,
  getWeekTemplates,       // ✅ أضفنا هذه
  deleteWeekTemplate,    // ✅ وأضفنا هذه
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
} from "../controllers/admin.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import { cancelUserBookingInSlot, deleteSlot, getAllSlots, getAvailableWeeks, getSlotBookings, sendSlotReminder, toggleSlotBlock } from "../controllers/adminSlots.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

// ✅ القوالب الأسبوعية
router.get("/templates", getWeekTemplates);             // 🔹 عرض كل القوالب
router.post("/templates", createWeekTemplate);          // 🔹 إنشاء قالب
router.delete("/templates/:id", deleteWeekTemplate);    // 🔹 حذف قالب
router.post("/templates/apply", applyTemplate);         // 🔹 تطبيق قالب

router.get("/users", getAllUsers);

// ✅ صلاحيات المستخدمين والتقارير
router.put("/users/extra-booking", setUserExtraBooking);
router.get("/reports/attendance", exportAttendanceReport);
router.get("/dashboard", getDashboardStats);

router.get("/slots", getAllSlots);
router.get("/slots/weeks", getAvailableWeeks);
router.put("/slots/:id/block", toggleSlotBlock);
router.delete("/slots/:id", deleteSlot);

router.get("/slots/:id/bookings", getSlotBookings);
router.put("/slots/:slotId/bookings/:userId/cancel", cancelUserBookingInSlot);

router.post("/slots/:id/reminder", sendSlotReminder);

router.put("/users/:id/block", toggleUserBlock);

router.post("/notify", sendCustomNotification);
router.get("/notifications", getNotificationsHistory);

router.get("/reports/attendance", exportAttendanceReport);

router.get("/settings", getSettings);
router.put("/settings", updateSettings);

router.post("/settings/logo", upload.single("logo"), uploadLogo);

router.get("/scheduler/status", getSchedulerStatus);
export default router;
