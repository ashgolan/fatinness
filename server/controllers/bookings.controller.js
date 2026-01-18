import Booking from "../models/Booking.js";
import Slot from "../models/Slot.js";
import { scheduleReminder } from "../utils/scheduler.js";
import {
  createGoogleEvent,
  deleteGoogleEvent,
} from "../utils/googleCalendar.js";
import { DateTime } from "luxon";
import { ZONE } from "../utils/time.js";
import axios from "axios";

/**
 * 🔹 إنشاء حجز جديد (UTC-safe)
 */
import mongoose from "mongoose";

export const createBooking = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = req.user;
    const { slotId, paymentRef } = req.body;

    if (!slotId) {
      await session.abortTransaction();
      return res.status(400).json({ code: "BOOKING_SLOT_ID_REQUIRED" });
    }

    if (
      user.subscriptionStatus === "expired" ||
      (user.subscriptionEnd && user.subscriptionEnd < new Date())
    ) {
      await session.abortTransaction();
      return res.status(403).json({ code: "SUBSCRIPTION_EXPIRED" });
    }

    // ============================
    // 📌 جلب الحصة
    // ============================
    const slot = await Slot.findById(slotId).session(session);
    if (!slot || slot.isBlocked) {
      await session.abortTransaction();
      return res.status(400).json({ code: "ADMIN_BOOKING_SLOT_NOT_AVAILABLE" });
    }

    const nowUTC = DateTime.utc().toJSDate();
    if (!slot.startAt || slot.startAt <= nowUTC) {
      await session.abortTransaction();
      return res.status(400).json({ code: "ADMIN_BOOKING_SLOT_PAST" });
    }

    // ============================
    // 📅 weekKey (الحل الذهبي)
    // ============================
    const slotWeekKey = DateTime
      .fromJSDate(slot.startAt)
      .setZone(ZONE)
      .toFormat("kkkk-'W'WW"); // مثال: 2026-W03
    // ============================
    // 📅 حدود الأسبوع (لرسالة ذكية للمستخدم)
    // ============================
    const slotLocal = DateTime
      .fromJSDate(slot.startAt)
      .setZone(ZONE);

    const weekStartLocal = slotLocal.startOf("week");
    const weekEndLocal = slotLocal.endOf("week");

    const MAX_BOOKINGS = 4;
    const allowed = user.allowExtraBookings ? Infinity : MAX_BOOKINGS;


    const userBookingsThisWeek = await Booking.aggregate([
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
        $addFields: {
          weekKey: {
            $dateToString: {
              format: "%G-W%V", // ISO week-year + week number
              date: "$slot.startAt",
              timezone: ZONE,
            },
          },
        },
      },
      {
        $match: {
          weekKey: slotWeekKey,
        },
      },
      { $count: "count" },
    ]);

    const count = userBookingsThisWeek[0]?.count || 0;

    if (count >= allowed) {
      await session.abortTransaction();
      return res.status(403).json({
        code: "ADMIN_BOOKING_WEEKLY_LIMIT",
        max: allowed,
        weekStart: weekStartLocal.toISODate(), // مثال: 2026-01-21
        weekEnd: weekEndLocal.toISODate(),     // مثال: 2026-01-27
      });
    }

    // ============================
    // 🪑 سعة الحصة
    // ============================
    const slotBookingsCount = await Booking.countDocuments(
      { slot: slot._id, status: "booked" },
      { session }
    );

    if (slotBookingsCount >= (slot.capacity || 9999)) {
      await session.abortTransaction();
      return res.status(400).json({ code: "ADMIN_BOOKING_SLOT_FULL" });
    }

    // ============================
    // ✅ إنشاء الحجز
    // ============================
    const booking = await Booking.create(
      [
        {
          user: user._id,
          slot: slot._id,
          paymentRef,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // 🔔 عمليات غير حرجة
    if (user.google?.accessToken) {
      createGoogleEvent(user, booking[0]).catch(() => { });
    }
    // ✅ اختيار التوكن المملوك للجهاز الحالي فقط

    const activeFcm = user.fcmTokens?.[0];

    if (!activeFcm?.token) {
      console.log("⚠️ No FCM token for this user, skipping reminder");
      return res.status(201).json({
        code: "ADMIN_BOOKING_CREATED",
        booking: booking[0],
      });
    }



    try {
      await scheduleBookingReminderCall({
        bookingId: booking[0]._id.toString(),
        userFcmToken: activeFcm.token,
        startAt: slot.startAt.toISOString(),
      });

      console.log("⏰ Reminder scheduled (onCall)");
    } catch (e) {
      console.error("⚠️ Failed to schedule reminder:", e.message);
    }

    // ✅ هذا السطر كان ناقصًا
    return res.status(201).json({
      code: "ADMIN_BOOKING_CREATED",
      booking: booking[0],
    });


  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("❌ Error in createBooking:", error);

    return res.status(500).json({
      code: "ADMIN_BOOKING_CREATE_ERROR",
    });
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
