import express from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";

import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/userNotifications.controller.js";

const router = express.Router();

// 🔒 حماية جميع المسارات للمستخدم المسجل فقط
router.use(authMiddleware);

// 📥 جلب إشعارات المستخدم
router.get("/", getMyNotifications);

// ✅ تعليم إشعار كمقروء
router.put("/:id/read", markNotificationAsRead);

// 📭 تعليم جميع الإشعارات كمقروءة
router.put("/read-all", markAllNotificationsAsRead);

export default router;
