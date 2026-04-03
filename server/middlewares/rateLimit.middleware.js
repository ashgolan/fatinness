// import rateLimit from "express-rate-limit";

// // 🔹 محدد عام لأي API
// export const apiLimiter = rateLimit({
//   windowMs: 60 * 1000, // دقيقة واحدة
//   max: 5, // أقصى 5 طلبات في الدقيقة لكل IP
//   message: {
//     message: "Too many requests, please try again later.",
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// // 🔹 محدد خاص لمحاولات تسجيل الدخول
// export const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 دقيقة
//   max: 10, // 10 محاولات تسجيل دخول فقط
//   message: {
//     message:
//       "Too many login attempts from this IP, please try again after 15 minutes.",
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// import rateLimit from "express-rate-limit";

// // عام لكل API
// export const apiLimiter = rateLimit({
//   windowMs: 60 * 1000,
//   max: 100,
//   message: {
//     message: "Too many requests, please try again later.",
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// // خاص بتسجيل الدخول
// export const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 10,
//   skip: (req) => req.method === "OPTIONS",
//   message: {
//     message: "Too many login attempts, please try again after 15 minutes.",
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// import rateLimit from "express-rate-limit";

// /**
//  * 🧠 Helper: استخراج هوية المستخدم إن وُجدت (username/email/phone)
//  */
// const getUserIdentifier = (req) => {
//   const raw =
//     req.body?.identifier ??
//     req.body?.username ??
//     req.body?.email ??
//     req.body?.phone ??
//     "";

//   const normalized = String(raw).trim().toLowerCase();
//   return normalized || null;
// };
// /**
//  * 🌐 API Limiter (عام)
//  * - يحمي باقي الـ endpoints من spam
//  * - لا يشمل /auth/login (نتركه لـ loginLimiter)
//  */
// export const apiLimiter = rateLimit({
//   windowMs: 60 * 1000, // دقيقة
//   max: 100, // 100 طلب/دقيقة لكل IP
//   standardHeaders: true,
//   legacyHeaders: false,

//   // تجاهل preflight
//   skip: (req) => req.method === "OPTIONS",

//   message: {
//     message: "Too many requests, please try again later.",
//   },
// });

// /**
//  * 🔐 Login Limiter (احترافي)
//  * - يمنع brute force
//  * - يعتمد على IP + هوية المستخدم إن وُجدت
//  * - يتجاهل OPTIONS
//  */
// export const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 دقيقة
//   max: 10, // 10 محاولات لكل نافذة

//   standardHeaders: true,
//   legacyHeaders: false,
//   // لا نحسب OPTIONS
//   skip: (req) => req.method === "OPTIONS",
//   skipSuccessfulRequests: true,

//   /**
//    * 🔑 توليد مفتاح آمن
//    * - إن وُجد username/email → IP + identifier
//    * - إن لم يوجد → IP فقط
//    */
//   keyGenerator: (req) => {
//     const identifier = getUserIdentifier(req);

//     if (identifier) {
//       return `login:${identifier}`;
//     }

//     return `login-ip:${req.ip}`;
//   },

//   /**
//    * 📢 رسالة الحظر
//    */
//   message: {
//     message: "Too many login attempts, please try again after 15 minutes.",
//   },

//   /**
//    * 🧾 Handler مخصص (مفيد للتتبع)
//    */
//   handler: (req, res, next, options) => {
//     // يمكنك إبقاؤه أو إزالته في الإنتاج
//     console.warn("🚫 LOGIN BLOCKED", {
//       ip: req.ip,
//       identifier: getUserIdentifier(req),
//       method: req.method,
//       path: req.originalUrl,
//       xff: req.headers["x-forwarded-for"],
//     });

//     return res.status(options.statusCode).json(options.message);
//   },
// });

import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/**
 * 🧠 Helper: استخراج هوية المستخدم إن وُجدت
 */
const getUserIdentifier = (req) => {
  const raw =
    req.body?.identifier ??
    req.body?.username ??
    req.body?.email ??
    req.body?.phone ??
    "";

  const normalized = String(raw).trim().toLowerCase();
  return normalized || null;
};

/**
 * 🌐 API Limiter (عام)
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: {
    message: "Too many requests, please try again later.",
  },
});

/**
 * 🔐 Login Limiter
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  skipSuccessfulRequests: true,

  keyGenerator: (req) => {
    const identifier = getUserIdentifier(req);

    if (identifier) {
      return `login:${identifier}`;
    }

    return `login-ip:${ipKeyGenerator(req)}`;
  },

  message: {
    message: "Too many login attempts, please try again after 15 minutes.",
  },

  handler: (req, res, next, options) => {
    console.warn("🚫 LOGIN BLOCKED", {
      ip: req.ip,
      identifier: getUserIdentifier(req),
      method: req.method,
      path: req.originalUrl,
      xff: req.headers["x-forwarded-for"],
    });

    return res.status(options.statusCode).json(options.message);
  },
});