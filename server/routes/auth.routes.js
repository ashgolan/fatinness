import express from "express";
import { registerUser, loginUser } from "../controllers/auth.controller.js";
import { validateRegistration } from "../middlewares/validate.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  apiLimiter,
  loginLimiter,
} from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post(
  "/register",
  authMiddleware, // ✅ أضف هذا السطر
  apiLimiter,
  validateRegistration,
  registerUser
);

// 🔹 تسجيل الدخول (بحماية أقوى ضد محاولات التخمين)
router.post("/login", loginLimiter, loginUser);

export default router;
