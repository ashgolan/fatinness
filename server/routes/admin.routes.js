import express from "express";
import {
  createWeekTemplate,
  getWeekTemplates,       // ✅ أضفنا هذه
  deleteWeekTemplate,    // ✅ وأضفنا هذه
  applyTemplate,
  setUserExtraBooking,
  exportAttendanceReport,
  getDashboardStats,
} from "../controllers/admin.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import { deleteSlot, getAllSlots, toggleSlotBlock } from "../controllers/adminSlots.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

// ✅ القوالب الأسبوعية
router.get("/templates", getWeekTemplates);             // 🔹 عرض كل القوالب
router.post("/templates", createWeekTemplate);          // 🔹 إنشاء قالب
router.delete("/templates/:id", deleteWeekTemplate);    // 🔹 حذف قالب
router.post("/templates/apply", applyTemplate);         // 🔹 تطبيق قالب

// ✅ صلاحيات المستخدمين والتقارير
router.put("/users/extra-booking", setUserExtraBooking);
router.get("/reports/attendance", exportAttendanceReport);
router.get("/dashboard", getDashboardStats);

router.get("/slots", getAllSlots);
router.put("/slots/:id/block", toggleSlotBlock);
router.delete("/slots/:id", deleteSlot);

export default router;
