import "dotenv/config";
process.env.TZ = process.env.TZ || "Asia/Jerusalem";

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
app.use("/deploy", express.raw({ type: "application/json" }));

// ============================
// ⚠️ Stripe Webhook (raw body)
// ============================
app.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  webhookRoutes
);

// ============================
// 🛡 Helmet Security
// ============================
app.use(helmet());
app.set("trust proxy", 1);

// ============================
// 🔐 CORS
// ============================
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://fateness.onrender.com",
  "https://api.fatinness.cloud",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

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

app.post("/deploy", (req, res) => {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) {
    return res.status(401).send("No signature");
  }

  const hmac = crypto
    .createHmac("sha256", process.env.DEPLOY_SECRET)
    .update(req.body)
    .digest("hex");

  const expected = `sha256=${hmac}`;

  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expected);

  if (
    sigBuffer.length !== expBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expBuffer)
  ) {
    return res.status(401).send("Invalid signature");
  }

  exec("bash /var/www/fateness-server/deploy.sh", (err, stdout, stderr) => {
    if (err) {
      console.error("Deploy error:", err);
      console.error(stderr);
      return res.status(500).send("Deploy failed");
    }

    console.log(stdout);
    res.send("Deploy OK");
  });
});

// ============================
// 🚀 Start Server
// ============================
const PORT = process.env.PORT || 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
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
