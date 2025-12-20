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

// 🕒 Scheduler
import { startScheduler } from "./utils/scheduler.js";
import { exec } from "child_process";
const app = express();

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
  const secret = req.headers["x-deploy-secret"];

  if (!secret || secret !== process.env.DEPLOY_SECRET) {
    return res.status(401).send("Unauthorized");
  }

  console.log("🚀 Deploy request received");

  exec(
    "bash /var/www/fateness-server/deploy.sh",
    { timeout: 5 * 60 * 1000 }, // 5 minutes
    (error, stdout, stderr) => {
      if (error) {
        console.error("❌ DEPLOY ERROR:", error);
        console.error(stderr);
        return res.status(500).send("Deploy failed");
      }

      console.log("✅ DEPLOY OUTPUT:");
      console.log(stdout);

      res.send("Deployment completed successfully");
    }
  );
});

// ============================
// 🚀 Start Server
// ============================
const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await connectDB();
    await startScheduler();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
})();
