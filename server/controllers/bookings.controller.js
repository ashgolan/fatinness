import Booking from "../models/Booking.js";
import Slot from "../models/Slot.js";

import { scheduleReminder } from "../utils/scheduler.js";
import {
  createGoogleEvent,
  deleteGoogleEvent,
} from "../utils/googleCalendar.js";
import { toLocal } from "../utils/date.js";

/**
 * 🔹 إنشاء حجز جديد
 */
export const createBooking = async (req, res) => {
  try {
    const user = req.user;
    const { slotId, paymentRef } = req.body;

    const slot = await Slot.findById(slotId);
    if (!slot || slot.isBlocked)
      return res.status(400).json({ code: "ADMIN_BOOKING_SLOT_NOT_AVAILABLE" });

    const now = new Date();
    const sessionStart = toLocal(slot.date);

    if (slot.startTime) {
      const [sh, sm] = slot.startTime.split(":").map(Number);
      sessionStart.setHours(sh, sm, 0, 0);
    }

    if (sessionStart <= now) {
      return res
        .status(400)
        .json({ code: "ADMIN_BOOKING_SLOT_PAST" });
    }

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
      return res
        .status(403)
        .json({ code: "ADMIN_BOOKING_WEEKLY_LIMIT" });

    const slotBookingsCount = await Booking.countDocuments({
      slot: slot._id,
      status: "booked",
    });

    if (slotBookingsCount >= (slot.capacity || 9999))
      return res.status(400).json({ code: "ADMIN_BOOKING_SLOT_FULL" });

    const booking = await Booking.create({
      user: user._id,
      slot: slot._id,
      paymentRef,
    });

    if (user.google?.accessToken) {
      try {
        await createGoogleEvent(user, booking);
      } catch (err) {
        console.warn("⚠️ Google Calendar skipped:", err.message);
      }
    }

    if (slot?.date) {
      try {
        await scheduleReminder(
          booking._id,
          slot.date,
          slot.startTime,
          slot.endTime
        );
      } catch (err) {
        console.warn("⚠️ Reminder scheduling failed:", err.message);
      }
    }

    res.status(201).json({
      code: "ADMIN_BOOKING_CREATED",
      booking,
    });
  } catch (error) {
    console.error("❌ Error in createBooking:", error);
    res.status(500).json({ code: "ADMIN_BOOKING_CREATE_ERROR" });
  }
};

/**
 * 🔹 إلغاء الحجز
 */
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("slot user");
    if (!booking)
      return res.status(404).json({ code: "ADMIN_BOOKING_NOT_FOUND" });

    if (!booking.user._id.equals(req.user._id) && req.user.role !== "admin")
      return res.status(403).json({ code: "ADMIN_BOOKING_FORBIDDEN" });

    const now = new Date();
    const slotDate = new Date(booking.slot.date);
    const twelveHoursBefore = new Date(
      slotDate.getTime() - 12 * 60 * 60 * 1000
    );

    if (req.user.role !== "admin" && now > twelveHoursBefore) {
      return res
        .status(403)
        .json({ code: "ADMIN_BOOKING_CANCEL_TOO_LATE" });
    }

    booking.status = "cancelled";
    await booking.save();

    if (booking.calendarEventId && booking.user.google?.accessToken) {
      try {
        await deleteGoogleEvent(booking.user, booking.calendarEventId);
      } catch (e) {
        console.error("⚠️ Failed to delete calendar event:", e.message);
      }
    }

    res.json({ code: "ADMIN_BOOKING_CANCELLED" });
  } catch (error) {
    console.error("❌ Error cancelling booking:", error);
    res.status(500).json({ code: "ADMIN_BOOKING_CANCEL_ERROR" });
  }
};

/**
 * 🔹 عرض جميع الحجوزات (مدير فقط)
 */
export const getAllBookings = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ code: "ADMIN_BOOKING_FETCH_FORBIDDEN" });
    }

    const bookings = await Booking.find()
      .populate("user", "username email role")
      .populate("slot", "date startTime capacity")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("❌ Error fetching all bookings:", error);
    res.status(500).json({ code: "ADMIN_BOOKING_FETCH_ERROR" });
  }
};

/**
 * 🔹 عرض حجوزات المستخدم
 */
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("slot", "date startTime endTime capacity")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("❌ Error fetching user bookings:", error);
    res.status(500).json({ code: "ADMIN_BOOKING_MY_FETCH_ERROR" });
  }
};
