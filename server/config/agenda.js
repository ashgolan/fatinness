import Agenda from "agenda";
import { ZONE } from "../utils/time.js";
import cron from "node-cron";
import { sendBackupEmail } from "../services/backup.service.js";

export const agenda = new Agenda({
  db: {
    address: process.env.MONGO_URI,
    collection: "agendaJobs",
  },
  processEvery: "1 minute",
});

// ======================================================
// 🔌 عند الاتصال بـ MongoDB
// ======================================================
agenda.on("ready", async () => {
  console.log("📆 Agenda connected to MongoDB");
});

agenda.on("error", (err) => {
  console.error("❌ Agenda error:", err);
});

// ======================================================
// 🗄️ Nightly Backup — كل يوم 1:00 صباحاً
// ======================================================
if (process.env.BACKUP_EMAIL_USER && process.env.BACKUP_EMAIL_PASS) {
  cron.schedule("0 1 * * *", async () => {
    console.log("🕐 Running nightly backup...");
    await sendBackupEmail();
  }, { timezone: "Asia/Jerusalem" });

  console.log("✅ Nightly backup scheduler started — 01:00");
}