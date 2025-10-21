import express from "express";
import { registerUser, loginUser } from "../controllers/auth.controller.js";
import { validateRegistration } from "../middlewares/validate.middleware.js";
import { apiLimiter, loginLimiter } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

// 🔹 تسجيل مستخدم جديد
router.post("/register", apiLimiter, validateRegistration, registerUser);

// 🔹 تسجيل الدخول (بحماية أقوى ضد محاولات التخمين)
router.post("/login", loginLimiter, loginUser);

export default router;
