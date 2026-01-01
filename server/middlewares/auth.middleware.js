
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function authMiddleware(req, res, next) {
  try {
    let token = null;

    // 1️⃣ Bearer Token (لوكال / Postman)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // 2️⃣ Cookie Token (Production)
    if (!token && req.cookies?.JWT) {
      token = req.cookies.JWT;
    }

    // ❌ لا يوجد توكن
    if (!token) {
      return res.status(401).json({
        code: "UNAUTHORIZED_NO_TOKEN",
      });
    }

    // 🔐 فك التوكن
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ⚠️ دعم id و _id
    const userId = decoded.id || decoded._id;
    if (!userId) {
      return res.status(401).json({
        code: "UNAUTHORIZED_INVALID_TOKEN",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        code: "UNAUTHORIZED_USER_NOT_FOUND",
      });
    }

    // 🚫 حساب محظور
    if (user.isBlocked) {
      return res.status(403).json({
        code: "AUTH_LOGIN_BLOCKED",
      });
    }

    // ⏳ فحص انتهاء الاشتراك (بدون منع الدخول)
    const now = new Date();
    const isSubscriptionExpired =
      user.subscriptionEnd && new Date(user.subscriptionEnd) < now;

    // 🧠 إرفاق معلومات إضافية
    req.user = {
      ...user.toObject(),
      isSubscriptionExpired,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      code: "UNAUTHORIZED_INVALID_TOKEN",
    });
  }
}
