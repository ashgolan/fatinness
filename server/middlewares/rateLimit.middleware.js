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

import rateLimit from "express-rate-limit";

// عام لكل API
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// خاص بتسجيل الدخول
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: (req) => req.method === "OPTIONS",
  message: {
    message: "Too many login attempts, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});