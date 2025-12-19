import Booking from "../models/Booking.js";
import Slot from "../models/Slot.js";
import { DateTime } from "luxon";
import { ZONE } from "../utils/time.js";

export const checkWeeklyBookingLimit = async (req, res, next) => {
  try {
    const user = req.user;
    const { slotId } = req.body;

    if (!slotId) {
      return res.status(400).json({
        code: "ADMIN_BOOKING_SLOT_ID_REQUIRED",
      });
    }

    // 🟢 السماح غير المحدود
    if (user.allowExtraBookings) {
      return next();
    }

    // =============================================
    // 🧠 حساب حدود الأسبوع (الأحد → السبت) محليًا
    // =============================================
    const nowLocal = DateTime.now().setZone(ZONE);

    const weekStartLocal = nowLocal
      .startOf("week")
      .minus({ days: 0 }); // Luxon: week يبدأ الاثنين → نعدله

    // نضمن أن البداية أحد
    const sundayStart =
      weekStartLocal.weekday === 7
        ? weekStartLocal
        : weekStartLocal.minus({ days: weekStartLocal.weekday });

    const weekEndLocal = sundayStart.plus({ days: 6 }).endOf("day");

    // تحويل إلى UTC للاستعلام
    const weekStartUTC = sundayStart.toUTC().toJSDate();
    const weekEndUTC = weekEndLocal.toUTC().toJSDate();

    // =============================================
    // 🔍 LOGS (مهمة أثناء الاختبار)
    // =============================================
    console.log("\n================ WEEKLY LIMIT CHECK ================");
    console.log("User:", user.username);
    console.log("Week start (local):", sundayStart.toISO());
    console.log("Week end   (local):", weekEndLocal.toISO());
    console.log("Week start (UTC):", weekStartUTC.toISOString());
    console.log("Week end   (UTC):", weekEndUTC.toISOString());
    console.log("===================================================\n");

    // =============================================
    // 🧮 العد الحقيقي: حسب وقت الحصة
    // =============================================
    const bookingsThisWeek = await Booking.aggregate([
      {
        $match: {
          user: user._id,
          status: "booked",
        },
      },
      {
        $lookup: {
          from: "slots",
          localField: "slot",
          foreignField: "_id",
          as: "slot",
        },
      },
      { $unwind: "$slot" },
      {
        $match: {
          "slot.startAt": {
            $gte: weekStartUTC,
            $lte: weekEndUTC,
          },
        },
      },
      { $count: "count" },
    ]);

    const weeklyCount = bookingsThisWeek[0]?.count || 0;

    const MAX_BOOKINGS_PER_WEEK = 4;

    if (weeklyCount >= MAX_BOOKINGS_PER_WEEK) {
      return res.status(403).json({
        code: "ADMIN_BOOKING_WEEKLY_LIMIT",
      });
    }

    next();
  } catch (error) {
    console.error("❌ Weekly booking limit error:", error);
    res.status(500).json({
      code: "ADMIN_BOOKING_WEEKLY_LIMIT_ERROR",
    });
  }
};
