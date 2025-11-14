import Slot from "../models/Slot.js";
import { toLocal } from "../utils/date.js"; // مهم جداً لمنع مشاكل UTC

export const checkSlotTimeValidity = async (req, res, next) => {
  try {
    const { slotId } = req.body;
    if (!slotId) {
      return res.status(400).json({ message: "Slot ID is required." });
    }

    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: "Slot not found." });
    }

    // 🟣 تحويل تاريخ Mongo إلى Local Date
    const date = toLocal(slot.date);

    // 🕒 دمج الوقت مع التاريخ (startTime)
    const [h, m] = slot.startTime.split(":").map(Number);
    date.setHours(h, m, 0, 0);

    const now = new Date();

    // 🔥 المقارنة الحقيقية للوقت
    if (date.getTime() <= now.getTime()) {
      return res.status(400).json({
        message: "This slot has already passed or is in progress.",
      });
    }

    // مرر البيانات لإعادة استعمالها
    req.slot = slot;

    next();
  } catch (error) {
    console.error("Slot time check error:", error);
    res.status(500).json({ message: "Error verifying slot time." });
  }
};
