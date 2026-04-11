import Booking from "../models/Booking.js";
import Slot from "../models/Slot.js";
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
import Setting from "../models/Setting.js";
import { getSundayWeekRange } from "../utils/week.js";

export const createBooking = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = req.user;
    const settings = await Setting.findOne().session(session);
    const { slotId, paymentRef } = req.body;
    const preventCloseBookings = settings?.preventCloseBookings ?? true;
    const MIN_GAP_MINUTES = settings?.minimumGapBetweenBookings ?? 1;
    const minGapMs = MIN_GAP_MINUTES * 60 * 1000;
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
    const slot = await Slot.findOne({
      _id: slotId,
      isDeleted: false,
    }).session(session);




    if (!slot || slot.isBlocked) {
      await session.abortTransaction();
      return res.status(400).json({ code: "ADMIN_BOOKING_SLOT_NOT_AVAILABLE" });
    }
    if (user.subscriptionEnd) {
      const subscriptionEnd = DateTime.fromJSDate(user.subscriptionEnd)
        .setZone(ZONE)
        .endOf("day");

      const slotStart = DateTime.fromJSDate(slot.startAt).setZone(ZONE);

      if (slotStart > subscriptionEnd) {
        await session.abortTransaction();
        return res.status(403).json({
          code: "SUBSCRIPTION_EXPIRES_BEFORE_SLOT",
        });
      }
    }
    const nowUTC = DateTime.utc().toJSDate();
    if (!slot.startAt || slot.startAt <= nowUTC) {
      await session.abortTransaction();
      return res.status(400).json({ code: "ADMIN_BOOKING_SLOT_PAST" });
    }

    // ============================
    // 📅 weekKey (الحل الذهبي)
    // ============================
    // const slotWeekKey = DateTime
    //   .fromJSDate(slot.startAt)
    //   .setZone(ZONE)
    //   .toFormat("kkkk-'W'WW");
    // مثال: 2026-W03
    // ============================
    // 📅 حدود الأسبوع (لرسالة ذكية للمستخدم)
    // ============================
    const { weekStart, weekEnd } = getSundayWeekRange(slot.startAt, ZONE);

    const MAX_BOOKINGS = 4;
    const allowed = user.allowExtraBookings ? Infinity : MAX_BOOKINGS;


    const userBookings = await Booking.find({
      user: user._id,
      status: "booked",
    })
      .populate("slot", "startAt endAt isDeleted")
      .session(session);

    const bookingsThisWeek = userBookings.filter((b) => {
      const startAt = b.slot?.startAt;
      if (!startAt) return false;
      if (b.slot?.isDeleted) return false;

      const bookingLocal = DateTime.fromJSDate(
        startAt instanceof Date ? startAt : new Date(startAt),
        { zone: ZONE }
      );

      return bookingLocal >= weekStart && bookingLocal <= weekEnd;
    });

    const count = bookingsThisWeek.length;
    if (count >= allowed) {
      await session.abortTransaction();
      return res.status(403).json({
        code: "ADMIN_BOOKING_WEEKLY_LIMIT",
        max: allowed,
        weekStart: weekStart.toISODate(),
        weekEnd: weekEnd.toISODate(),    // مثال: 2026-01-27
      });
    }

    // ============================
    // 🪑 سعة الحصة
    // ============================
    const slotBookingsCount = await Booking.countDocuments({
      slot: slot._id,
      status: "booked",
    }).session(session);

    if (slotBookingsCount >= (slot.capacity || 9999)) {
      await session.abortTransaction();
      return res.status(400).json({ code: "ADMIN_BOOKING_SLOT_FULL" });
    }
    // ============================
    // 🚫 منع الحجز المتقارب لنفس المستخدمة
    // ============================
    if (preventCloseBookings) {
      const nearbyBookings = await Booking.aggregate([
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
            "slot.isDeleted": false,
          },
        },
        {
          $project: {
            slotStartAt: "$slot.startAt",
            slotEndAt: "$slot.endAt",
          },
        },
      ]).session(session);

      const newStartMs = new Date(slot.startAt).getTime();
      const newEndMs = new Date(slot.endAt).getTime();

      const hasTooCloseBooking = nearbyBookings.some((b) => {
        const existingStartMs = new Date(b.slotStartAt).getTime();
        const existingEndMs = new Date(b.slotEndAt).getTime();

        const overlaps = newStartMs < existingEndMs && newEndMs > existingStartMs;
        if (overlaps) return true;

        const gapAfterExisting = newStartMs - existingEndMs;
        const gapBeforeExisting = existingStartMs - newEndMs;

        const tooCloseAfter =
          gapAfterExisting >= 0 && gapAfterExisting < minGapMs;

        const tooCloseBefore =
          gapBeforeExisting >= 0 && gapBeforeExisting < minGapMs;

        return tooCloseAfter || tooCloseBefore;
      });

      if (hasTooCloseBooking) {
        await session.abortTransaction();
        return res.status(400).json({
          code: "ADMIN_BOOKING_TOO_CLOSE_NOT_ALLOWED",
          minGap: MIN_GAP_MINUTES,
        });
      }
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
      const reminderResponse = await axios.post(
        "https://us-central1-fateness-364c3.cloudfunctions.net/scheduleBookingReminder",
        {
          bookingId: booking[0]._id.toString(),
          userFcmToken: activeFcm.token,
          startAt: slot.startAt.toISOString(),
          secret: process.env.REMINDER_SECRET, // 🔐
        }
      );

      console.log("⏰ Reminder scheduled:", reminderResponse.data);
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
      .populate("slot", "startAt endAt capacity isBlocked isDeleted")
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
      .populate("slot", "startAt endAt capacity isBlocked isDeleted")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("❌ Error fetching user bookings:", error);
    res.status(500).json({ code: "ADMIN_BOOKING_MY_FETCH_ERROR" });
  }
};
