import jwt from "jsonwebtoken";
import User from "../models/User.js";

// =====================================================
// 🔐 Auth Middleware (Bearer + Cookie)
// =====================================================
export async function authMiddleware(req, res, next) {
  try {
    let token = null;

    // 1️⃣ Bearer Token (Postman / Local)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // 2️⃣ Cookie Token (Production)
    if (!token && req.cookies?.JWT) {
      token = req.cookies.JWT;
    }

    if (!token) {
      return res.status(401).json({ code: "UNAUTHORIZED_NO_TOKEN" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id;

    if (!userId) {
      return res.status(401).json({ code: "UNAUTHORIZED_INVALID_TOKEN" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ code: "UNAUTHORIZED_USER_NOT_FOUND" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ code: "AUTH_LOGIN_BLOCKED" });
    }

    // ⏳ انتهاء الاشتراك (معلومة فقط)
    const now = new Date();
    const isSubscriptionExpired =
      user.subscriptionEnd && new Date(user.subscriptionEnd) < now;

    req.user = {
      ...user.toObject(),
      isSubscriptionExpired,
    };

    next();
  } catch (error) {
    return res.status(401).json({ code: "UNAUTHORIZED_INVALID_TOKEN" });
  }
}

// =====================================================
// 👑 Admin Only Middleware
// =====================================================
export function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ code: "ADMIN_ONLY_ACCESS" });
  }
  next();
}
