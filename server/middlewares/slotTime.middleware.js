import Slot from "../models/Slot.js";

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

    const now = new Date();
    const slotDate = new Date(slot.date);

    // 🔹 إذا كان الوقت الحالي بعد وقت الحصة فلا يُسمح بالحجز
    if (slotDate.getTime() <= now.getTime()) {
      return res
        .status(400)
        .json({ message: "This slot has already passed or is in progress." });
    }

    // مرر بيانات الجلسة لو احتجناها لاحقًا
    req.slot = slot;
    next();
  } catch (error) {
    console.error("Slot time check error:", error);
    res.status(500).json({ message: "Error verifying slot time." });
  }
};
