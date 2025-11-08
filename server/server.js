import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import { agenda } from "./config/agenda.js";
import { defineSchedulerJobs, startScheduler } from "./utils/scheduler.js";
import { handleWebhook } from "./controllers/payments.controller.js";
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
app.get("/health", (req, res) => res.json({ ok: true, time: new Date() }));

// ✅ عرض ملفات الصور الثابتة
app.use("/uploads", express.static("uploads"));

// ✅ جميع المسارات عبر index.js
app.use("/maintenance", maintenanceRoutes);
app.use("/", mainRoutes);

// ✅ إعدادات لتقديم واجهة React
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🟢 تقديم ملفات React من client/build
app.use(express.static(path.join(__dirname, "../client/build")));

// 🟢 في حال لم يُطابق أي مسار API → أعد index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

// ✅ تشغيل السيرفر
const PORT = process.env.PORT || 4000;

(async () => {
  try {
    // 🔹 الاتصال بقاعدة البيانات
    await connectDB();

    // 🔹 تعريف وتشغيل المهام المجدولة
    defineSchedulerJobs();
    await agenda.start();
    startScheduler();

    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
})();
