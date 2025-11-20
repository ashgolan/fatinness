import Slot from "../models/Slot.js";
import Booking from "../models/Booking.js";

// 🔹 تجميع النتائج حسب اليوم
import { fmtLocal } from "../utils/date.js";

// 🔹 دالة تجميع حسب التاريخ
function groupByDate(slots) {
  const grouped = {};
  slots.forEach((slot) => {
    const dateKey = fmtLocal(slot.date);
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(slot);
  });
  return grouped;
}

// =====================================================
// 🔹 إرجاع الأيام والساعات المتاحة للأسبوع الحالي أو المحدد
// =====================================================
export const getWeekSlots = async (req, res) => {
  try {
    const { startDate } = req.query;
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
    res.status(500).json({ code: "ADMIN_SLOTS_WEEK_FETCH_ERROR" });
  }
};

// =====================================================
// 🔹 إرجاع الساعات المتاحة ليوم معين
// =====================================================
export const getDaySlots = async (req, res) => {
  try {
    const { date } = req.params;
    const day = new Date(date);

    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);

    const slots = await Slot.find({
      date: { $gte: day, $lt: nextDay },
      isBlocked: false,
    }).sort({ startTime: 1 });

    const now = new Date();

    const enrichedSlots = await Promise.all(
      slots.map(async (slot) => {
        const bookedCount = await Booking.countDocuments({
          slot: slot._id,
          status: "booked",
        });

        const slotDate = new Date(slot.date);
        const [hour, minute] = slot.startTime.split(":").map(Number);
        slotDate.setHours(hour, minute, 0, 0);

        const isPast =
          slotDate.toDateString() === now.toDateString() &&
          slotDate.getTime() <= now.getTime();

        return {
          ...slot.toObject(),
          available: Math.max((slot.capacity || 0) - bookedCount, 0),
          isBooked: bookedCount > 0,
          time: slot.startTime,
          isPast,
        };
      })
    );

    res.json(enrichedSlots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "ADMIN_SLOTS_DAY_FETCH_ERROR" });
  }
};

// =====================================================
// 🔹 جلب الحصص القادمة للأسبوعين القادمين
// =====================================================
export const getUpcomingSlots = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(today);
    end.setDate(today.getDate() + 14);

    const slots = await Slot.find({
      date: { $gte: today, $lte: end },
      isBlocked: false,
    })
      .sort({ date: 1, startTime: 1 })
      .lean();

    const groupedSlots = groupByDate(slots);

    res.json({
      start: today,
      end,
      slots: groupedSlots,
    });
  } catch (error) {
    console.error("❌ Error in getUpcomingSlots:", error);
    res.status(500).json({ code: "ADMIN_SLOTS_UPCOMING_FETCH_ERROR" });
  }
};
