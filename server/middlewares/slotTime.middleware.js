import Slot from "../models/Slot.js";
import { DateTime } from "luxon";
import { ZONE } from "../utils/time.js";

export const checkSlotTimeValidity = async (req, res, next) => {
  try {
    const { slotId } = req.body;

    if (!slotId) {
      return res.status(400).json({
        code: "SLOT_ID_REQUIRED",
      });
    }

    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        code: "SLOT_NOT_FOUND",
      });
    }

    // =============================================
    // 🧠 المعيار الذهبي
    // =============================================
    // slot.startAt مخزن UTC
    // nowUTC محسوب بطريقة موحدة
    // =============================================

    const slotStartUTC = DateTime.fromJSDate(slot.startAt, { zone: "utc" });
    const nowUTC = DateTime.now().toUTC();

    // =============================================
    // 🔍 LOGS (مفيدة جدًا أثناء الاختبار)
    // =============================================
    console.log("\n=============================================");
    console.log("🔍 SLOT TIME VALIDITY CHECK");
    console.log("🕒 Now (UTC):", nowUTC.toISO());
    console.log(
      "🕒 Now (Local):",
      nowUTC.setZone(ZONE).toFormat("yyyy-MM-dd HH:mm")
    );
    console.log("📅 Slot start (UTC):", slotStartUTC.toISO());
    console.log(
      "📅 Slot start (Local):",
      slotStartUTC.setZone(ZONE).toFormat("yyyy-MM-dd HH:mm")
    );
    console.log(
      "📌 RESULT:",
      slotStartUTC <= nowUTC
        ? "❌ SLOT STARTED / PASSED"
        : "✅ SLOT IS FUTURE"
    );
    console.log("=============================================\n");

    // =============================================
    // 🔥 الفحص الحقيقي
    // =============================================
    if (slotStartUTC <= nowUTC) {
      return res.status(400).json({
        code: "SLOT_ALREADY_STARTED",
      });
    }

    // تمرير الحصة للمرحلة التالية
    req.slot = slot;
    next();
  } catch (error) {
    console.error("❌ checkSlotTimeValidity error:", error);
    res.status(500).json({
      code: "SLOT_TIME_CHECK_ERROR",
    });
  }
};
