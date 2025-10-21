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
      subscription: {
        active: false,
        planId: null,
        provider: null,
        providerCustomerId: null,
      },
    });

    const token = generateToken(newUser);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
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
    const { username, password } = req.body;

    // فحص المدخلات
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }
    // البحث عن المستخدم
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username.trim()}$`, "i") },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // تأكد أن الحقل موجود فعلاً في قاعدة البيانات
    if (!user.passwordHash) {
      console.error(
        "⚠️ user.passwordHash is missing in DB for user:",
        username
      );
      return res
        .status(500)
        .json({ message: "User record invalid (missing password hash)" });
    }

    // المقارنة الآمنة
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // توليد التوكن
    const token = generateToken(user);

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
