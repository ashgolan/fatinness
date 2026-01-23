

import jwt from "jsonwebtoken";
import User from "../models/User.js";

// =====================================================
// 🔐 Auth Middleware (Cookie-based only)
// =====================================================
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.JWT;

    if (!token) {
      return res.status(401).json({
        code: "UNAUTHORIZED_NO_TOKEN",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({
        code: "UNAUTHORIZED_INVALID_TOKEN",
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        code: "UNAUTHORIZED_USER_NOT_FOUND",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        code: "AUTH_LOGIN_BLOCKED",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({
      code: "UNAUTHORIZED_INVALID_TOKEN",
    });
  }
};

// =====================================================
// 👑 Admin Middleware
// =====================================================
export const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      code: "ADMIN_ONLY_ACCESS",
    });
  }
  next();
};
