import express from "express";
import {
  registerUser,
  loginUser,
  updatePreferredLanguage,
} from "../controllers/auth.controller.js";
import { validateRegistration } from "../middlewares/validate.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  apiLimiter,
  loginLimiter,
} from "../middlewares/rateLimit.middleware.js";

import User from "../models/User.js"; // ✅ مفقودة ومهمة جداً
import bcrypt from "bcrypt"; // ✅ كان مفقود
import jwt from "jsonwebtoken";

const router = express.Router();

// 🔹 تسجيل مستخدم جديد
router.post(
  "/register",
  authMiddleware,
  apiLimiter,
  validateRegistration,
  registerUser
);

// 🔹 تسجيل الدخول
router.post("/login", loginLimiter, loginUser);

// 🌟 إنشاء السوبر أدمن لأول مرة
// 🌟 إنشاء السوبر أدمن لأول مرة
// 🌟 إنشاء السوبر أدمن لأول مرة فقط
router.post("/register-superadmin", async (req, res) => {
  try {
    // 🔒 شرط وحيد وقاطع
    const userCount = await User.countDocuments();
    if (userCount !== 0) {
      return res.status(403).json({
        code: "SUPERADMIN_SETUP_NOT_ALLOWED",
      });
    }

    const { username, email, phone, password, gender, height, weight, age } =
      req.body;

    if (!username || !password) {
      return res.status(400).json({
        code: "SETUP_MISSING_FIELDS",
      });
    }

    // 🔐 تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // 👑 إنشاء السوبر أدمن
    const superAdmin = await User.create({
      username,
      email,
      phone,
      passwordHash: hashedPassword,
      gender,
      height,
      weight,
      age,
      role: "admin",
      isSuperAdmin: true,
    });

    // 🔑 JWT
    const token = jwt.sign(
      {
        id: superAdmin._id,
        role: "admin",
        isSuperAdmin: true,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 🍪 Cookie آمن
    res.cookie("JWT", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.json({
      code: "SUPERADMIN_CREATED",
      user: {
        id: superAdmin._id,
        username: superAdmin.username,
        role: "admin",
        isSuperAdmin: true,
      },
    });
  } catch (err) {
    console.error("❌ register-superadmin error:", err);
    res.status(500).json({ code: "SETUP_ERROR" });
  }
});

// 🔍 فحص هل النظام يحتاج إعداد أول مرة
router.get("/check-first-run", async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({ needsSetup: userCount === 0 });
  } catch (error) {
    console.error("❌ check-first-run error:", error);
    res.status(500).json({ code: "SERVER_ERROR" });
  }
});

router.put("/language", authMiddleware, updatePreferredLanguage);

export default router;
