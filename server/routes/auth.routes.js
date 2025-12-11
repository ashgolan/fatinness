import express from "express";
import { registerUser, loginUser, updatePreferredLanguage } from "../controllers/auth.controller.js";
import { validateRegistration } from "../middlewares/validate.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  apiLimiter,
  loginLimiter,
} from "../middlewares/rateLimit.middleware.js";

import User from "../models/User.js";   // ✅ مفقودة ومهمة جداً
import bcrypt from "bcrypt";            // ✅ كان مفقود
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
router.post("/register-superadmin", async (req, res) => {
  try {
    const { username, email, phone, password, gender, height, weight, age } =
      req.body;

    // هل يوجد مستخدم واحد على الأقل؟
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return res.status(400).json({ code: "SETUP_ALREADY_DONE" });
    }

    // تشفير الباسوورد
    const hashedPassword = await bcrypt.hash(password, 10);

    // إنشاء السوبر أدمن
    const superAdmin = await User.create({
      username,
      email,
      phone,
      passwordHash: hashedPassword,
      gender,
      height,
      weight,
      age,
      role: "admin",        // 👑 أدمن
      isSuperAdmin: true,   // 👑 سوبر أدمن
    });

    // إنشاء JWT
    const token = jwt.sign(
      {
        _id: superAdmin._id,
        role: "admin",
        isSuperAdmin: true,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("JWT", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.json({
      code: "SUPERADMIN_CREATED",
      user: {
        id: superAdmin._id,
        username: superAdmin.username,
        isSuperAdmin: true,
        role: "admin",
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
