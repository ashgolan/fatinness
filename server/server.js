// 🌟 تحميل المتغيرات من .env
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// 🔥 تهيئة Firebase Admin
import "./config/firebase.js";

// 🧠 الاتصال بقاعدة البيانات + الجدولة
import { connectDB } from "./config/db.js";
import { agenda } from "./config/agenda.js";
import { defineSchedulerJobs, startScheduler } from "./utils/scheduler.js";

// 💳 Webhook للدفع
import { handleWebhook } from "./controllers/payments.controller.js";

// 📦 المسارات العامة
import mainRoutes from "./routes/index.js";
import maintenanceRoutes from "./routes/maintenance.routes.js";

const app = express();

// ✅ تفعيل CORS
app.use(cors());

// ✅ Stripe Webhook قبل JSON middleware
app.post(
  "/payments/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    req.rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(req.body || "");
    next();
  },
  handleWebhook
);

// ✅ تفعيل JSON لباقي المسارات
app.use(express.json());

// ✅ Health Check بسيط للتأكد أن السيرفر حي
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Server running fine 🚀", time: new Date() });
});

// ✅ تقديم ملفات الصور الثابتة
app.use("/uploads", express.static("uploads"));

// ✅ ربط المسارات العامة
app.use("/maintenance", maintenanceRoutes);
app.use("/", mainRoutes);

// ✅ إعدادات لتقديم واجهة React في الإنتاج فقط
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === "production") {
  const clientPath = path.join(__dirname, "../client/build");
  app.use(express.static(clientPath));

  // 🟢 أي مسار غير API → يرجع index.html (يدعم React Router)
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("🚧 Fateness API running in development mode...");
  });
}

// ✅ تشغيل السيرفر
const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await connectDB();
    defineSchedulerJobs();
    await agenda.start();
    startScheduler();

    // 🔹 مهم جدًا لعمل السيرفر على Railway
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
})();
