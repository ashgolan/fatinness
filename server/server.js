import "dotenv/config";
process.env.TZ = process.env.TZ || "Asia/Jerusalem";
import cookieParser from "cookie-parser";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// 🔧 Internal configs
import "./config/firebase.js";
import { connectDB } from "./config/db.js";

// 🛣 Routes
import mainRoutes from "./routes/index.js";
import authRoutes from "./routes/auth.routes.js";
import maintenanceRoutes from "./routes/maintenance.routes.js";
import galleryRoutes from "./routes/gallery.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import crypto from "crypto";

// 🕒 Scheduler
import { startScheduler } from "./utils/scheduler.js";
import { exec } from "child_process";
const app = express();

// GitHub webhook raw body
// app.use("/deploy", express.raw({ type: "application/json" }));

// ============================
// ⚠️ Stripe Webhook (raw body)
// ============================
app.use("/webhook", webhookRoutes);

// ============================
// 🛡 Helmet Security
// ============================
app.use(helmet());
app.set("trust proxy", 1);

// ============================
// 🔐 CORS
// ============================

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://fatinness.com",
        "https://www.fatinness.com", // 👈 هذا كان ناقص
        "https://api.fatinness.cloud",
      ];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(cookieParser());



// ============================
// 🚦 Rate Limit
// ============================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,

});
app.use("/api", apiLimiter);

// ============================
// JSON & Form Parsing
// ============================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============================
// 🩺 Health Check
// ============================
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// ============================
// 🔐 Auth & Static
// ============================
app.use("/auth", authRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/gallery", galleryRoutes);

// ============================
// 🧭 Main Routes
// ============================
app.use("/", mainRoutes);
app.use("/maintenance", maintenanceRoutes);

app.post("/deploy", express.json(), (req, res) => {
  console.log("🔔 Deploy webhook received");

  const signature = req.headers["x-hub-signature-256"];
  if (!signature) {
    return res.status(401).send("No signature");
  }

  const hmac = crypto
    .createHmac("sha256", process.env.DEPLOY_SECRET)
    .update(JSON.stringify(req.body))
    .digest("hex");

  const expected = `sha256=${hmac}`;

  if (signature !== expected) {
    console.log("❌ Signature mismatch");
    return res.status(401).send("Invalid signature");
  }

  console.log("✅ Signature OK");

  exec("bash /var/www/fatinness/deploy.sh", (err) => {
    if (err) {
      console.error("❌ Deploy error", err);
      return res.status(500).send("Deploy failed");
    }
    res.send("Deploy OK");
  });
});

app.post("/logout", (req, res) => {
  res.clearCookie("JWT", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  return res.json({ code: "LOGOUT_SUCCESS" });
});


// ============================
// 🚀 Start Server
// ============================
const PORT = process.env.PORT || 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 AUTO DEPLOY TEST – Server running on port", PORT);
});

// init async stuff بعد التشغيل
(async () => {
  try {
    await connectDB();
    await startScheduler();
    console.log("🟢 DB & Scheduler ready");
  } catch (err) {
    console.error("❌ Init failed:", err);
  }
})();
