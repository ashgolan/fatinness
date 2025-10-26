import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";

// 🔹 توليد التوكن
function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "12h",
  });
}

// 🔹 تسجيل مستخدم جديد
export const registerUser = async (req, res) => {
  try {

    // ✅ فقط المدير يستطيع إنشاء حسابات جديدة
if (!req.user || req.user.role?.toString() !== "admin") {
  return res.status(403).json({ message: "Only admins can create new users" });
}

    const { username, password, email, name, phone } = req.body;

    if (!username || !password || !email)
      return res.status(400).json({ message: "Missing required fields" });

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing)
      return res.status(409).json({ message: "User already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      passwordHash,
      email,
      name,
      phone,
      role: "user", // 🔹 كل مستخدم جديد يكون مشتركة افتراضيًا
      subscription: {
        active: false,
        planId: null,
        provider: null,
        providerCustomerId: null,
      },
    });

    // ✅ لا حاجة لإنشاء token للمشتركة الجديدة
    // لأنها لن تسجّل الدخول مباشرة من هنا

    res.status(201).json({
      message: "User created successfully by admin",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role,
      },
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

