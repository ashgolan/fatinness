import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import "./config/firebase.js";
import { connectDB } from "./config/db.js";
import { agenda } from "./config/agenda.js";
import { defineSchedulerJobs, startScheduler } from "./utils/scheduler.js";
import { handleWebhook } from "./controllers/payments.controller.js";
import mainRoutes from "./routes/index.js";
import maintenanceRoutes from "./routes/maintenance.routes.js";

const app = express();

// ✅ CORS
app.use(cors());

// ✅ Stripe webhook (raw)
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

// ✅ JSON middleware
app.use(express.json());

// ✅ Health check route — ضروري يكون فوق أي شيء آخر
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    message: "Server running fine 🚀",
    time: new Date(),
  });
});

// ✅ Static uploads folder
app.use("/uploads", express.static("uploads"));

// ✅ App routes
app.use("/maintenance", maintenanceRoutes);
app.use("/", mainRoutes);

// ✅ React frontend serving (Production only)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === "production") {
  const clientPath = path.join(__dirname, "../client/build");
  app.use(express.static(clientPath));

  // ✅ catch-all route for React
  app.get("/*", (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
} else {
  // ✅ development mode message
  app.get("/", (req, res) => {
    res.send("🚧 Fateness API running in development mode...");
  });
}

// ✅ Start server
const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await connectDB();
    defineSchedulerJobs();
    await agenda.start();
    startScheduler();

    // ✅ مهم جداً: استخدم 0.0.0.0 بدلاً من localhost
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
})();
