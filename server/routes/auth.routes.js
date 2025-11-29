import express from "express";
import { registerUser, loginUser } from "../controllers/auth.controller.js";
import { validateRegistration } from "../middlewares/validate.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  apiLimiter,
  loginLimiter,
} from "../middlewares/rateLimit.middleware.js";
import jwt from "jsonwebtoken";

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



// 🌟 إنشاء مدير رئيسي لأول مرة
router.post("/register-superadmin", async (req, res) => {
  try {
    const { username, email, phone, pin } = req.body;

    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return res.status(400).json({ code: "SETUP_ALREADY_DONE" });
    }

    const hashedPIN = await bcrypt.hash(pin, 10);

    const superAdmin = await User.create({
      username,
      email,
      phone,
      password: hashedPIN,
      role: "admin",
      isSuperAdmin: true,
    });

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




// 🔍 فحص هل النظام يحتوي مدير رئيسي أم لا
router.get("/check-first-run", async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({ needsSetup: userCount === 0 });
  } catch (error) {
    console.error("❌ check-first-run error:", error);
    res.status(500).json({ code: "SERVER_ERROR" });
  }
});

export default router;

