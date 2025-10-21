import express from "express";
import { createBooking, cancelBooking } from "../controllers/bookings.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { apiLimiter } from "../middlewares/rateLimit.middleware.js";
import { verifyActiveSubscription } from "../middlewares/subscription.middleware.js";
import { checkSlotCapacity } from "../middlewares/capacity.middleware.js";
import { checkWeeklyBookingLimit } from "../middlewares/weeklyLimit.middleware.js";
import { checkSlotTimeValidity } from "../middlewares/slotTime.middleware.js";

const router = express.Router();

router.use(authMiddleware);

// ✅ تسلسل كامل للحماية من جميع الحالات الممكنة
router.post(
  "/",
  apiLimiter,
//   verifyActiveSubscription,
  checkSlotTimeValidity,
  checkWeeklyBookingLimit,
  checkSlotCapacity,
  createBooking
);

// ✅ إلغاء الحجز
router.delete("/:id", cancelBooking);

export default router;
