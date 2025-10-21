import Slot from "../models/Slot.js";
import Booking from "../models/Booking.js";

// ✅ التحقق من أن السعة لم تُستنفد
export const checkSlotCapacity = async (req, res, next) => {
  try {
    const { slotId } = req.body;
    if (!slotId) {
      return res.status(400).json({ message: "Slot ID is required." });
    }

    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: "Slot not found." });
    }

    const currentBookings = await Booking.countDocuments({
      slot: slotId,
      status: "booked",
    });

    if (currentBookings >= (slot.capacity || 9999)) {
      return res.status(400).json({ message: "This slot is already full." });
    }

    // مرّر البيانات إلى الكنترولر في حال الحاجة
    req.slot = slot;
    next();
  } catch (error) {
    console.error("Capacity check error:", error);
    res.status(500).json({ message: "Error verifying slot capacity." });
  }
};
