import "dotenv/config";
process.env.TZ = process.env.TZ || "Asia/Jerusalem";

// ============================
// 🛡️ الحماية الأساسية
// ============================
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import express from "express";
import cors from "cors";

// ============================
// ⚙️ إعدادات داخلية
// ============================
import "./config/firebase.js";
import { connectDB } from "./config/db.js";
import { handleWebhook } from "./controllers/payments.controller.js";
import mainRoutes from "./routes/index.js";
import maintenanceRoutes from "./routes/maintenance.routes.js";
import galleryRoutes from "./routes/gallery.routes.js";
import { startScheduler } from "./utils/scheduler.js";

// ============================
// 🚀 إنشاء التطبيق
// ============================
const app = express();

// ============================
// 🛡️ Helmet – حماية الرؤوس
// ============================

// ============================
// 🔇 منع console.log في الإنتاج
// ============================
if (process.env.NODE_ENV === "production") {
  console.log = function () {};
  console.debug = function () {};
}

// ============================
// 🔐 CORS المسموح فقط
// ============================

app.set("trust proxy", 1);
app.use(helmet());

const allowedOrigins = [
  "https://fateness.onrender.com/",   // موقع الويب (React)
  "http://localhost:5173",            // للتطوير فقط
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // للسماح لتطبيقات الموبايل (Capacitor)
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ============================
// 🚦 Rate Limit – لمنع الهجوم
// ============================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 200, // 200 طلب في الربع ساعة
  message: "Too many requests, please try again later.",
});
app.use("/api", apiLimiter);

// ============================
// 📦 Body Parser
// ============================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============================
// 💳 Stripe Webhook – مهم جداً
// ============================
app.post(
  "/payments/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    req.rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body);

    next();
  },
  handleWebhook
);

// إعادة تفعيل JSON بعد الـ raw
app.use(express.json());

// ============================
// 🩺 Health Check
// ============================
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// ============================
// 🖼️ Static Files (الصور)
// ============================
app.use("/uploads", express.static("uploads"));
app.use("/gallery", galleryRoutes);

// ============================
// 🧭 Routing
// ============================
app.use("/maintenance", maintenanceRoutes);
app.use("/", mainRoutes);

// ============================
// 🔥 Catch all errors
// ============================
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});

// ============================
// 🚀 تشغيل السيرفر
// ============================
const PORT = process.env.PORT || 4000;

(async () => {
  try {
    // 1️⃣ الاتصال بقاعدة البيانات
    await connectDB();

    // 2️⃣ تشغيل المجدول
    await startScheduler();

    // 3️⃣ تشغيل السيرفر
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
})();
