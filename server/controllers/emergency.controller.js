import AdmZip from "adm-zip";
import User             from "../models/User.js";
import Booking          from "../models/Booking.js";
import Slot             from "../models/Slot.js";
import Setting          from "../models/Setting.js";
import Notification     from "../models/Notification.js";
import UserNotification from "../models/UserNotification.js";
import WeekTemplate     from "../models/WeekTemplate.js";
import Payment          from "../models/Payment.js";
import GalleryImage     from "../models/GalleryImage.js";

const COLLECTIONS = [
  { name: "users",             Model: User             },
  { name: "bookings",          Model: Booking          },
  { name: "slots",             Model: Slot             },
  { name: "settings",          Model: Setting          },
  { name: "notifications",     Model: Notification     },
  { name: "userNotifications", Model: UserNotification },
  { name: "weekTemplates",     Model: WeekTemplate     },
  { name: "payments",          Model: Payment          },
  { name: "galleryImages",     Model: GalleryImage     },
];

// ── Check key ──────────────────────────────────────────────────
export const checkEmergencyKey = (req, res) => {
  const { emergencyKey } = req.body;
  if (!emergencyKey || emergencyKey !== process.env.EMERGENCY_RESTORE_KEY) {
    return res.status(401).json({ message: "مفتاح غير صحيح" });
  }
  return res.json({ ok: true });
};

// ── Restore from ZIP ───────────────────────────────────────────
export const restoreFromZip = async (req, res) => {
  try {
    const { emergencyKey } = req.body;
    if (!emergencyKey || emergencyKey !== process.env.EMERGENCY_RESTORE_KEY) {
      return res.status(401).json({ message: "مفتاح غير صحيح" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "لم يتم رفع ملف" });
    }

    const zip     = new AdmZip(req.file.buffer);
    const dataMap = {};

    for (const entry of zip.getEntries()) {
      if (entry.entryName === "meta.json") continue;
      const name = entry.entryName.replace(".json", "");
      try {
        dataMap[name] = JSON.parse(entry.getData().toString("utf8"));
      } catch {
        dataMap[name] = [];
      }
    }

    const results = {};

    for (const { name, Model } of COLLECTIONS) {
      const docs = dataMap[name];
      if (!docs || !Array.isArray(docs)) { results[name] = 0; continue; }

      await Model.deleteMany({});

      if (docs.length > 0) {
        try {
          await Model.insertMany(docs, { ordered: false });
        } catch (e) {
          console.warn(`⚠️ insertMany warning for ${name}:`, e.message);
        }
      }

      results[name] = await Model.countDocuments();
    }

    console.log("✅ Emergency restore completed:", results);
    return res.json({ ok: true, restored: results });

  } catch (err) {
    console.error("❌ Emergency restore error:", err);
    return res.status(500).json({ message: "خطأ في الاستعادة" });
  }
};
