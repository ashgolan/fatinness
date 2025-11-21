import Booking from "../models/Booking.js";

export const checkWeeklyBookingLimit = async (req, res, next) => {
  try {
    const user = req.user;
    const { slotId } = req.body;

    if (!slotId) {
      return res.status(400).json({ code: "ADMIN_BOOKING_SLOT_ID_REQUIRED" });
    }

    if (user.allowExtraBookings) {
      return next();
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weeklyBookings = await Booking.countDocuments({
      user: user._id,
      status: "booked",
      createdAt: { $gte: startOfWeek, $lte: endOfWeek },
    });

    const MAX_BOOKINGS_PER_WEEK = 4;

    if (weeklyBookings >= MAX_BOOKINGS_PER_WEEK) {
      return res.status(403).json({ code: "ADMIN_BOOKING_WEEKLY_LIMIT" });
    }

    next();
  } catch (error) {
    console.error("Weekly limit check error:", error);
    res.status(500).json({ code: "ADMIN_BOOKING_WEEKLY_LIMIT_ERROR" });
  }
};
