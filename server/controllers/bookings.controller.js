import Booking from "../models/Booking.js";
import Slot from "../models/Slot.js";
import { scheduleReminder } from "../utils/scheduler.js";
import { createGoogleEvent, deleteGoogleEvent } from "../utils/googleCalendar.js";

/**
 * 🔹 إنشاء حجز جديد (مع تحقق من الاشتراك الشهري)
 */
export const createBooking = async (req, res) => {
  try {
    const user = req.user;
    const { slotId, paymentRef } = req.body;

    // ✅ تحقق من الاشتراك الشهري
    if (user.role !== "admin") {
      if (!user.subscription?.active) {
        return res.status(403).json({
          message: "Your subscription is inactive. Please renew before booking.",
        });
      }
    }

    const slot = await Slot.findById(slotId);
    if (!slot || slot.isBlocked)
      return res.status(400).json({ message: "Slot not available" });

    const startOfWeek = new Date(slot.date);
    startOfWeek.setDate(slot.date.getDate() - slot.date.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const userBookingsThisWeek = await Booking.countDocuments({
      user: user._id,
      status: "booked",
      createdAt: { $gte: startOfWeek, $lte: endOfWeek },
    });

    const MAX_BOOKINGS = 4;
    const allowed = user.allowExtraBookings ? Infinity : MAX_BOOKINGS;
    if (userBookingsThisWeek >= allowed)
      return res.status(403).json({ message: "Weekly booking limit reached" });

    const slotBookingsCount = await Booking.countDocuments({
      slot: slot._id,
      status: "booked",
    });
    if (slotBookingsCount >= (slot.capacity || 9999))
      return res.status(400).json({ message: "This slot is full" });

    const booking = await Booking.create({
      user: user._id,
      slot: slot._id,
      paymentRef,
    });

    // ✅ إنشاء حدث في Google Calendar
    await createGoogleEvent(user, booking);

    // ✅ جدولة تذكير قبل ساعتين
    await scheduleReminder(booking._id);

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 🔹 إلغاء الحجز (مسموح قبل 12 ساعة فقط)
 */
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("slot user");
    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    if (
      !booking.user._id.equals(req.user._id) &&
      req.user.role !== "admin"
    )
      return res.status(403).json({ message: "Forbidden" });

    const now = new Date();
    const slotDate = new Date(booking.slot.date);
    const twelveHoursBefore = new Date(slotDate.getTime() - 12 * 60 * 60 * 1000);

    if (now > twelveHoursBefore)
      return res
        .status(403)
        .json({ message: "Cannot cancel within 12 hours of the slot" });

    booking.status = "cancelled";
    await booking.save();

    // ✅ حذف من Google Calendar إن وُجد
    if (booking.calendarEventId && booking.user.google?.accessToken) {
      try {
        await deleteGoogleEvent(booking.user, booking.calendarEventId);
      } catch (e) {
        console.error(e);
      }
    }

    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error cancelling booking" });
  }
};
