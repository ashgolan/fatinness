import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { maintenanceMode } from "./maintenance.controller.js";

// 🔹 توليد التوكن
function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role ,isSuperAdmin: user.isSuperAdmin}, process.env.JWT_SECRET, {
    expiresIn: "12h",
  });
}

// =====================================================
// 🔹 تسجيل مستخدم جديد (فقط المدير أو أول حساب)
// =====================================================
export const registerUser = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    if (!isFirstUser) {
      if (!req.user || req.user.role?.toString() !== "admin") {
        return res.status(403).json({ code: "ADMIN_AUTH_ONLY_ADMIN" });
      }
    }

    const {
      username,
      password,
      email,
      phone,
      gender,
      height,
      weight,
      age,
      role: requestedRole,
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({ code: "ADMIN_AUTH_MISSING_FIELDS" });
    }

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(409).json({ code: "ADMIN_AUTH_USER_EXISTS" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let role = "user";
    if (isFirstUser) {
      role = "admin";
    } else if (req.user?.role === "admin" && requestedRole === "admin") {
      role = "admin";
    }

    const newUser = await User.create({
      username,
      passwordHash,
      email,
      phone,
      gender: gender || "female",
      height: height || null,
      weight: weight || null,
      age: age || null,
      role,
      subscription: {
        active: false,
        planId: null,
        provider: null,
        providerCustomerId: null,
      },
    });

    const token = generateToken(newUser);

    res.status(201).json({
      code:
        role === "admin"
          ? "ADMIN_AUTH_ADMIN_CREATED"
          : "ADMIN_AUTH_USER_CREATED",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        gender: newUser.gender,
        height: newUser.height,
        weight: newUser.weight,
        age: newUser.age,
        role: newUser.role,
      },
      token,
    });
  } catch (err) {
    console.error("❌ Register Error:", err);
    res.status(500).json({ code: "ADMIN_AUTH_SERVER_ERROR" });
  }
};

// =====================================================
// 🔹 تسجيل الدخول
// =====================================================
export const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        code: "ADMIN_LOGIN_MISSING_FIELDS",
      });
    }

    const user = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${identifier}$`, "i") } },
        { phone: { $regex: new RegExp(`^${identifier}$`) } },
      ],
    });

    if (!user) {
      return res.status(404).json({ code: "ADMIN_LOGIN_NOT_FOUND" });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        code: "ADMIN_LOGIN_BLOCKED",
      });
    }

    if (maintenanceMode && user.role !== "admin") {
      return res.status(503).json({
        code: "ADMIN_LOGIN_MAINTENANCE",
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ code: "ADMIN_LOGIN_WRONG_PASSWORD" });
    }

    const token = generateToken(user);

    res.json({
      code: "ADMIN_LOGIN_SUCCESS",
      token,
user: {
  id: user._id,
  username: user.username,
  phone: user.phone,
  role: user.role,
  isSuperAdmin: user.isSuperAdmin,
},
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ code: "ADMIN_LOGIN_SERVER_ERROR" });
  }
};

// =====================================================
// 🔹 تعديل دور مستخدم
// =====================================================
export const updateUserRole = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ code: "ADMIN_ROLE_UNAUTHORIZED" });
    }

    const { userId, role } = req.body;

    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ code: "ADMIN_ROLE_INVALID" });
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
    if (!user)
      return res.status(404).json({ code: "ADMIN_ROLE_USER_NOT_FOUND" });

    res.json({ code: "ADMIN_ROLE_UPDATED", user });
  } catch (err) {
    console.error("Role update error:", err);
    res.status(500).json({ code: "ADMIN_ROLE_SERVER_ERROR" });
  }
};
