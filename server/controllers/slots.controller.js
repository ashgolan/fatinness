import Slot from "../models/Slot.js";
import Booking from "../models/Booking.js";
import { DateTime } from "luxon";
import { ZONE, getWeekRangeLocal } from "../utils/time.js";

// =====================================================
// 🔹 تجميع النتائج حسب اليوم (محلي)
// =====================================================
function groupByLocalDate(slots) {
  const grouped = {};
  slots.forEach((slot) => {
    const key = DateTime.fromJSDate(slot.startAt)
      .setZone(ZONE)
      .toFormat("yyyy-MM-dd");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(slot);
  });
  return grouped;
}

// =====================================================
// 🔹 إرجاع الأيام والساعات المتاحة لأسبوع (الأحد → السبت)
// =====================================================
export const getWeekSlots = async (req, res) => {
  try {
    const { startDate, start } = req.query;

    // ✅ نحدد التاريخ الأساسي بوضوح
    const baseDate = startDate || start || null;

    // 🧮 حساب الأسبوع (محلي → UTC)
    const {
      weekStartUTC,
      weekEndUTC,
      weekStartLocal,
      weekEndLocal,
    } = getWeekRangeLocal(baseDate);

    const slots = await Slot.find({
      startAt: { $gte: weekStartUTC, $lte: weekEndUTC },
      isDeleted: false, // 🆕 تجاهل الحصص المحذوفة
      isBlocked: false,
    }).sort({ startAt: 1 });

    const groupedSlots = groupByLocalDate(slots);

    res.json({
      weekStart: weekStartLocal.toFormat("yyyy-MM-dd"),
      weekEnd: weekEndLocal.toFormat("yyyy-MM-dd"),
      slots: groupedSlots,
    });
  } catch (error) {
    console.error("❌ getWeekSlots:", error);
    res.status(500).json({ code: "ADMIN_SLOTS_WEEK_FETCH_ERROR" });
  }
};

// =====================================================
// 🔹 إرجاع الساعات المتاحة ليوم معيّن (YYYY-MM-DD)
// =====================================================
export const getDaySlots = async (req, res) => {
  try {
    const { date } = req.params;

    const dayLocal = DateTime.fromISO(date, { zone: ZONE });
    if (!dayLocal.isValid) {
      return res.status(400).json({ code: "INVALID_DATE" });
    }

    const startUTC = dayLocal.startOf("day").toUTC().toJSDate();
    const endUTC = dayLocal.endOf("day").toUTC().toJSDate();

    const slots = await Slot.find({
      startAt: { $gte: weekStartUTC, $lte: weekEndUTC },
      isDeleted: false, // 🆕 تجاهل الحصص المحذوفة
      isBlocked: false,

    }).sort({ startAt: 1 });

    const nowUTC = DateTime.now().setZone(ZONE).toUTC().toJSDate();

    const enrichedSlots = await Promise.all(
      slots.map(async (slot) => {
        const bookedCount = await Booking.countDocuments({
          slot: slot._id,
          status: "booked",
        });

        return {
          ...slot.toObject(),
          available: Math.max((slot.capacity || 0) - bookedCount, 0),
          isBooked: bookedCount > 0,
          time: `${DateTime.fromJSDate(slot.startAt)
            .setZone(ZONE)
            .toFormat("HH:mm")}
 - ${DateTime.fromJSDate(slot.endAt).setZone(ZONE).toFormat("HH:mm")}`,
          isPast: slot.startAt <= nowUTC,
        };
      })
    );

    res.json(enrichedSlots);
  } catch (error) {
    console.error("❌ getDaySlots:", error);
    res.status(500).json({ code: "ADMIN_SLOTS_DAY_FETCH_ERROR" });
  }
};

// =====================================================
// 🔹 جلب الحصص القادمة للأسبوعين القادمين
// =====================================================
export const getUpcomingSlots = async (req, res) => {
  try {
    const nowLocal = DateTime.now().setZone(ZONE);
    const startUTC = nowLocal.startOf("day").toUTC().toJSDate();
    const endUTC = nowLocal.plus({ days: 14 }).endOf("day").toUTC().toJSDate();

    // 1️⃣ جلب الحصص
    const slots = await Slot.find({
      startAt: { $gte: startUTC, $lte: endUTC },
      isDeleted: false, // 🗑️ تجاهل المحذوف
      isBlocked: false, // 🚫 تجاهل المغلق
    })
      .sort({ startAt: 1 })
      .lean();

    if (!slots.length) {
      return res.json({
        start: nowLocal.toFormat("yyyy-MM-dd"),
        end: nowLocal.plus({ days: 14 }).toFormat("yyyy-MM-dd"),
        slots: {},
      });
    }

    // 2️⃣ جلب عدد الحجوزات لكل Slot
    const bookingCounts = await Booking.aggregate([
      {
        $match: {
          slot: { $in: slots.map((s) => s._id) },
          status: "booked",
        },
      },
      {
        $group: {
          _id: "$slot",
          count: { $sum: 1 },
        },
      },
    ]);

    const countsMap = new Map();
    bookingCounts.forEach((b) => countsMap.set(b._id.toString(), b.count));

    const slotsWithCount = slots.map((slot) => ({
      ...slot,
      bookedCount: countsMap.get(slot._id.toString()) || 0,
      time: `${DateTime.fromJSDate(slot.startAt)
        .setZone(ZONE)
        .toFormat("HH:mm")}
 - ${DateTime.fromJSDate(slot.endAt).setZone(ZONE).toFormat("HH:mm")}`,
    }));

    const grouped = groupByLocalDate(slotsWithCount);

    res.json({
      start: nowLocal.toFormat("yyyy-MM-dd"),
      end: nowLocal.plus({ days: 14 }).toFormat("yyyy-MM-dd"),
      slots: grouped,
    });
  } catch (error) {
    console.error("❌ getUpcomingSlots:", error);
    res.status(500).json({ code: "ADMIN_SLOTS_UPCOMING_FETCH_ERROR" });
  }
};
