import Slot from "../models/Slot.js";
import Booking from "../models/Booking.js";

/**
 * 🔹 جلب جميع الحصص بشكل مرتب حسب التاريخ
 */
export const getAllSlots = async (req, res) => {
  try {
    const slots = await Slot.find().sort({ date: 1, startTime: 1 }).lean();

    const enriched = await Promise.all(
      slots.map(async (s) => {
        const booked = await Booking.countDocuments({
          slot: s._id,
          status: "booked",
        });
        return {
          ...s,
          booked,
          remaining: (s.capacity || 0) - booked,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching slots" });
  }
};

/**
 * 🔹 تعطيل أو تفعيل حصة
 */
export const toggleSlotBlock = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    slot.isBlocked = !slot.isBlocked;
    await slot.save();

    res.json({
      message: slot.isBlocked
        ? "تم تعطيل الحصة بنجاح"
        : "تم تفعيل الحصة بنجاح",
      slot,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error toggling slot block" });
  }
};

export const deleteSlot = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    await slot.deleteOne();
    res.json({ message: "تم حذف الحصة بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting slot" });
  }
};