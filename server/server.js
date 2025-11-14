import "dotenv/config";
process.env.TZ = process.env.TZ || "Asia/Jerusalem";
import express from "express";
import cors from "cors";
import "./config/firebase.js";
import { connectDB } from "./config/db.js";
import { handleWebhook } from "./controllers/payments.controller.js";
import mainRoutes from "./routes/index.js";
import maintenanceRoutes from "./routes/maintenance.routes.js";
import { startScheduler } from "./utils/scheduler.js";

const app = express();

// ✅ تفعيل CORS
// ✅ تفعيل CORS للسماح للفرونت من Render بالوصول للسيرفر في Railway
app.use(
  cors({
    origin: [
      "http://localhost:3000", // أثناء التطوير
      "https://fateness.onrender.com", // الموقع المنشور في Render
    ],
    credentials: true,
  })
);
// ✅ زيادة حجم body المسموح (حتى 10 MB للروابط الكبيرة أو الصور)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ Stripe Webhook قبل JSON middleware
app.post(
  "/payments/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    req.rawBody = req.body;
    if (Buffer.isBuffer(req.rawBody)) {
      req.rawBody = req.rawBody;
    } else if (typeof req.rawBody === "string") {
      req.rawBody = Buffer.from(req.rawBody);
    }
    next();
  },
  handleWebhook
);

// ✅ تفعيل JSON لباقي المسارات
app.use(express.json());

// ✅ Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});
// ✅ عرض ملفات الصور الثابتة
app.use("/uploads", express.static("uploads"));

// ✅ جميع المسارات عبر index.js
app.use("/maintenance", maintenanceRoutes);
app.use("/", mainRoutes);
// ✅ منع توقف السيرفر عند أي خطأ غير متوقع
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});

// 🟢 تشغيل السيرفر فقط (بدون React)
const PORT = process.env.PORT || 4000;

(async () => {
  try {
    // 1️⃣ الاتصال بقاعدة البيانات
    await connectDB();

    // 2️⃣ تعريف وظائف المجدول (reminder + completed)

    // 3️⃣ تشغيل المجدول (Agenda)
    await startScheduler();

    // 4️⃣ تشغيل السيرفر
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
})();
