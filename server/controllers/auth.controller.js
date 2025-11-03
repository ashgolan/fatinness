import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { maintenanceMode } from "./maintenance.controller.js";

// 🔹 توليد التوكن
function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "12h",
  });
}

// 🔹 تسجيل مستخدم جديد
// 🔹 تسجيل مستخدم جديد (فقط المدير أو أول حساب)
export const registerUser = async (req, res) => {
  try {
    // ✅ إذا لم يكن هناك أي مستخدم بعد → هذا أول حساب (سيصبح مدير تلقائيًا)
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    // ✅ إن لم يكن أول مستخدم، تأكد أن الطلب من مدير حالي فقط
    if (!isFirstUser) {
      if (!req.user || req.user.role?.toString() !== "admin") {
        return res
          .status(403)
          .json({ message: "Only admins can create new users" });
      }
    }

    const {
      username,
      password,
      email,
      name,
      phone,
      gender,
      height,
      weight,
      age,
      role: requestedRole, // 👈 المدير يستطيع تحديد نوع الحساب الجديد
    } = req.body;

    // ✅ التحقق من الحقول الأساسية
    if (!username || !password || !email) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ التحقق من وجود المستخدم مسبقًا
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    // ✅ تشفير كلمة المرور
    const passwordHash = await bcrypt.hash(password, 10);

    // ✅ تحديد الدور (الوظيفة)
    let role = "user";
    if (isFirstUser) {
      role = "admin"; // أول حساب في النظام 👑
    } else if (req.user?.role === "admin" && requestedRole === "admin") {
      role = "admin"; // المدير يستطيع إنشاء مدير آخر 👩‍💼
    }

    // ✅ إنشاء المستخدم الجديد
    const newUser = await User.create({
      username,
      passwordHash,
      email,
      name,
      phone,
      gender: gender || "female",
      height: height || null,
      weight: weight || null,
      age: age || null,
      role, // 👈 تم تحديده بدقة
      subscription: {
        active: false,
        planId: null,
        provider: null,
        providerCustomerId: null,
      },
    });

    // ✅ توليد التوكن (اختياري حسب الاستخدام)
    const token = generateToken(newUser);

    // ✅ الرد النهائي
    res.status(201).json({
      message:
        role === "admin"
          ? "✅ Admin account created successfully"
          : "User created successfully by admin",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
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
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 تسجيل الدخول
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ فحص المدخلات
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // ✅ البحث عن المستخدم حسب البريد الإلكتروني (غير حساس لحالة الأحرف)
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email.trim()}$`, "i") },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🚫 فحص إذا كان المستخدم محظورًا
    if (user.isBlocked) {
      return res
        .status(403)
        .json({
          message: "تم حظر حسابك مؤقتًا 🚫، الرجاء التواصل مع الإدارة.",
        });
    }
    if (maintenanceMode && user.role !== "admin") {
      return res.status(503).json({
        message: "🚧 النظام تحت الصيانة مؤقتًا، يرجى المحاولة لاحقًا.",
      });
    }
    // ✅ تأكد أن كلمة المرور محفوظة
    if (!user.passwordHash) {
      console.error("⚠️ user.passwordHash is missing in DB for user:", email);
      return res
        .status(500)
        .json({ message: "User record invalid (missing password hash)" });
    }

    // ✅ المقارنة الآمنة بين كلمة المرور المدخلة والمحفوظة
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ توليد التوكن
    const token = generateToken(user);

    // ✅ الرد بالبيانات الأساسية
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 ترقية مستخدم إلى مدير أو العكس
export const updateUserRole = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { userId, role } = req.body;

    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: `Role updated to ${role}`, user });
  } catch (err) {
    console.error("Role update error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
