import Slot from "../models/Slot.js";
import { toLocal } from "../utils/date.js";

export const checkSlotTimeValidity = async (req, res, next) => {
  try {
    const { slotId } = req.body;

    if (!slotId) {
      return res.status(400).json({ message: "رقم الحصة غير موجود." });
    }

    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: "لم يتم العثور على الحصة." });
    }

    // 🟣 تحويل تاريخ Mongo إلى Local Time
    const dateOnly = toLocal(slot.date);

    // 🕑 دمج وقت بداية الجلسة
    const [h, m] = slot.startTime.split(":").map(Number);
    dateOnly.setHours(h, m, 0, 0);

    const now = new Date();

    // =============================================
    // 🔍 LOGS لنعرف أين المشكلة بالضبط
    // =============================================
    console.log("\n=============================================");
    console.log("🔍 فحص صلاحية وقت الحصة");
    console.log("⏱️ الآن:", now.toLocaleString("ar-EG"));
    console.log("📅 تاريخ الحصة (Mongo):", slot.date.toISOString());
    console.log("📅 تاريخ الحصة (محلي فقط):", toLocal(slot.date).toLocaleString("ar-EG"));
    console.log("⏰ وقت بداية الحصة:", slot.startTime);
    console.log("🕒 الوقت الكامل للحصة:", dateOnly.toLocaleString("ar-EG"));
    console.log(
      "📌 النتيجة:",
      dateOnly.getTime() <= now.getTime()
        ? "❌ الحصة انتهت أو بدأت"
        : "✅ الحصة مستقبلية ويمكن الحجز"
    );
    console.log("=============================================\n");

    // 🔥 الفحص الحقيقي
    if (dateOnly.getTime() <= now.getTime()) {
      return res.status(400).json({
        message: "لا يمكن حجز هذه الحصة لأنها بدأت أو انتهى موعدها.",
      });
    }

    req.slot = slot; // تمرير الحصة للعمليات التالية
    next();
    
  } catch (error) {
    console.error("❌ خطأ في التحقق من وقت الحصة:", error);
    res.status(500).json({
      message: "حدث خطأ أثناء التحقق من صلاحية موعد الحصة.",
    });
  }
};
