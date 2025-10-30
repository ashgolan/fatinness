import express from "express";
import {
  adminGetWeekSlots,
  adminCreateSlot,
  adminDeleteSlot,
  adminCreateNextWeekBulk,
  adminToggleBlock,
} from "../controllers/adminSlots.controller.js";

// ✅ أضف هذين السطرين (هما المفقودان)
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";

const router = express.Router();

// 🔒 حماية جميع المسارات للمسؤول فقط
router.use(authMiddleware, adminMiddleware);

// 📅 جلب حصص أسبوع محدد (مثلاً start=YYYY-MM-DD لبداية الأحد)
router.get("/week", adminGetWeekSlots);

// ➕ إضافة حصة منفردة لأي تاريخ (تستخدم في تبويب "الأسبوع الحالي")
router.post("/", adminCreateSlot);

// ❌ حذف حصة معينة
router.delete("/:id", adminDeleteSlot);

// 📆 إنشاء حصص الأسبوع القادم دفعة واحدة
router.post("/next-week/bulk", adminCreateNextWeekBulk);

router.put("/:id/block", adminToggleBlock);

export default router;
