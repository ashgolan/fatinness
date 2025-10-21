import Slot from "../models/Slot.js";
import Booking from "../models/Booking.js";

// 🔹 تجميع النتائج حسب اليوم
function groupByDate(slots) {
  const grouped = {};
  slots.forEach((slot) => {
    const dateKey = new Date(slot.date).toISOString().split("T")[0];
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(slot);
  });
  return grouped;
}

// 🔹 إرجاع الأيام والساعات المتاحة للأسبوع الحالي أو المحدد
export const getWeekSlots = async (req, res) => {
  try {
    const { startDate } = req.query; // YYYY-MM-DD
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const slots = await Slot.find({
      date: { $gte: start, $lte: end },
      isBlocked: false,
    }).sort({ date: 1, startTime: 1 });

    const groupedSlots = groupByDate(slots);

    res.json({ weekStart: start, weekEnd: end, slots: groupedSlots });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching week slots" });
  }
};

// 🔹 إرجاع الساعات المتاحة ليوم معين
export const getDaySlots = async (req, res) => {
  try {
    const { date } = req.params; // YYYY-MM-DD
    const day = new Date(date);

    const slots = await Slot.find({ date: day, isBlocked: false }).sort({
      startTime: 1,
    });

    // حساب السعة المتبقية في كل ساعة
    const enrichedSlots = await Promise.all(
      slots.map(async (slot) => {
        const bookedCount = await Booking.countDocuments({
          slot: slot._id,
          status: "booked",
        });
        return {
          ...slot.toObject(),
          available: Math.max((slot.capacity || 0) - bookedCount, 0),
        };
      })
    );

    res.json(enrichedSlots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching day slots" });
  }
};
