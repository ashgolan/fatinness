import express from "express";
import {
  createBooking,
  cancelBooking,
  getAllBookings,
  getMyBookings, // ✅ أضف هذا
} from "../controllers/bookings.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { apiLimiter } from "../middlewares/rateLimit.middleware.js";
import { verifyActiveSubscription } from "../middlewares/subscription.middleware.js";
import { checkSlotCapacity } from "../middlewares/capacity.middleware.js";
import { checkSlotTimeValidity } from "../middlewares/slotTime.middleware.js";

const router = express.Router();

// ✅ تفعيل التوثيق لجميع المسارات
router.use(authMiddleware);

// 🔹 عرض حجوزات المستخدم نفسه
router.get("/me", getMyBookings); // ✅ المسار الجديد للمشتركة

// 🔹 عرض جميع الحجوزات (للأدمن فقط)
router.get("/", getAllBookings);

// ✅ إنشاء حجز جديد مع الحماية الكاملة
router.post(
  "/",
  apiLimiter,
  // verifyActiveSubscription, // يمكن تفعيلها لاحقًا
  checkSlotTimeValidity,
  checkSlotCapacity,
  createBooking
);

// ✅ إلغاء الحجز
router.delete("/:id", cancelBooking);

export default router;
