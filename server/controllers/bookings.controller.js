import Booking from "../models/Booking.js";
import Slot from "../models/Slot.js";
import { scheduleReminder } from "../utils/scheduler.js";
import {
  createGoogleEvent,
  deleteGoogleEvent,
} from "../utils/googleCalendar.js";
import { DateTime } from "luxon";
import { ZONE } from "../utils/time.js";

/**
 * 🔹 إنشاء حجز جديد (UTC-safe)
 */
export const createBooking = async (req, res) => {
  try {
    const user = req.user;
    const { slotId, paymentRef } = req.body;
    if (user.subscriptionStatus === "expired") {
      return res.status(403).json({
        code: "SUBSCRIPTION_EXPIRED",
      });
    }
    const slot = await Slot.findById(slotId);
    if (!slot || slot.isBlocked) {
      return res.status(400).json({ code: "ADMIN_BOOKING_SLOT_NOT_AVAILABLE" });
    }

    // ⏱️ الآن
    const nowUTC = DateTime.now().setZone(ZONE).toUTC().toJSDate();

    // ⛔ لا يمكن حجز حصة ماضية
    if (!slot.startAt || slot.startAt <= nowUTC) {
      return res.status(400).json({ code: "ADMIN_BOOKING_SLOT_PAST" });
    }

    // ============================
    // 📅 حد الحجوزات الأسبوعية (الأحد)
    // ============================
    const slotLocal = DateTime.fromJSDate(slot.startAt).setZone(ZONE);
    const weekStartLocal = slotLocal.startOf("week").minus({ days: 1 });
    const weekEndLocal = weekStartLocal.plus({ days: 6 }).endOf("day");

    const userBookingsThisWeek = await Booking.countDocuments({
      user: user._id,
      status: "booked",
      createdAt: {
        $gte: weekStartLocal.toUTC().toJSDate(),
        $lte: weekEndLocal.toUTC().toJSDate(),
      },
    });

    const MAX_BOOKINGS = 4;
    const allowed = user.allowExtraBookings ? Infinity : MAX_BOOKINGS;

    if (userBookingsThisWeek >= allowed) {
      return res.status(403).json({ code: "ADMIN_BOOKING_WEEKLY_LIMIT" });
    }

    // ============================
    // 🪑 سعة الحصة
    // ============================
    const slotBookingsCount = await Booking.countDocuments({
      slot: slot._id,
      status: "booked",
    });

    if (slotBookingsCount >= (slot.capacity || 9999)) {
      return res.status(400).json({ code: "ADMIN_BOOKING_SLOT_FULL" });
    }

    // ============================
    // ✅ إنشاء الحجز
    // ============================
    const booking = await Booking.create({
      user: user._id,
      slot: slot._id,
      paymentRef,
    });

    // ============================
    // 📅 Google Calendar
    // ============================
    if (user.google?.accessToken) {
      try {
        await createGoogleEvent(user, booking);
      } catch (err) {
        console.warn("⚠️ Google Calendar skipped:", err.message);
      }
    }

    // ============================
    // 🔔 Reminder (يعتمد على startAt)
    // ============================
    try {
      await scheduleReminder(booking._id, slot.startAt);
    } catch (err) {
      console.warn("⚠️ Reminder scheduling failed:", err.message);
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
 * 🔹 إلغاء الحجز (UTC-safe)
 */
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("slot user");
    if (!booking) {
      return res.status(404).json({ code: "ADMIN_BOOKING_NOT_FOUND" });
    }

    if (!booking.user._id.equals(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ code: "ADMIN_BOOKING_FORBIDDEN" });
    }

    if (!booking.slot?.startAt) {
      return res.status(400).json({ code: "ADMIN_BOOKING_INVALID_SLOT" });
    }

    // ⏱️ الآن
    const nowUTC = DateTime.now().setZone(ZONE).toUTC();

    // 🕒 مهلة الإلغاء: 12 ساعة قبل البداية
    const cancelDeadlineUTC = DateTime.fromJSDate(booking.slot.startAt)
      .minus({ hours: 12 })
      .toUTC();

    if (req.user.role !== "admin" && nowUTC > cancelDeadlineUTC) {
      return res.status(403).json({ code: "BOOKING_CANCEL_TOO_LATE" });
    }

    // 🟢 تنفيذ الإلغاء
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
      .populate("slot", "startAt endAt capacity isBlocked")
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
      .populate("slot", "startAt endAt capacity isBlocked")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("❌ Error fetching user bookings:", error);
    res.status(500).json({ code: "ADMIN_BOOKING_MY_FETCH_ERROR" });
  }
};
