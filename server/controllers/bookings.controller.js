import Booking from "../models/Booking.js";
import Slot from "../models/Slot.js";
import { scheduleReminder } from "../utils/scheduler.js";
import {
  createGoogleEvent,
  deleteGoogleEvent,
} from "../utils/googleCalendar.js";

/**
 * 🔹 إنشاء حجز جديد (مع تحقق من الاشتراك الشهري)
 */
export const createBooking = async (req, res) => {
  try {
    const user = req.user;
    const { slotId, paymentRef } = req.body;

    // ✅ تحقق من الاشتراك الشهري (معلق مؤقتًا)
    // if (user.role !== "admin") {
    //   if (!user.subscription?.active) {
    //     return res.status(403).json({
    //       message:
    //         "Your subscription is inactive. Please renew before booking.",
    //     });
    //   }
    // }

    // ✅ التحقق من وجود الفتحة وصلاحيتها
    const slot = await Slot.findById(slotId);
    if (!slot || slot.isBlocked)
      return res.status(400).json({ message: "Slot not available" });

    // ✅ لا يمكن الحجز في مواعيد منتهية
    const now = new Date();
    const slotDateTime = new Date(slot.date);
    if (slotDateTime < now) {
      return res
        .status(400)
        .json({ message: "لا يمكن حجز فترات انتهى موعدها." });
    }

    // ✅ حساب بداية ونهاية الأسبوع
    const startOfWeek = new Date(slot.date);
    startOfWeek.setDate(slot.date.getDate() - slot.date.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // ✅ التحقق من الحد الأسبوعي للمستخدم
    const userBookingsThisWeek = await Booking.countDocuments({
      user: user._id,
      status: "booked",
      createdAt: { $gte: startOfWeek, $lte: endOfWeek },
    });

    const MAX_BOOKINGS = 4;
    const allowed = user.allowExtraBookings ? Infinity : MAX_BOOKINGS;
    if (userBookingsThisWeek >= allowed)
      return res.status(403).json({ message: "لقد وصلت إلى الحد الأقصى للحجوزات الأسبوعية." });

    // ✅ التحقق من سعة الحصة
    const slotBookingsCount = await Booking.countDocuments({
      slot: slot._id,
      status: "booked",
    });
    if (slotBookingsCount >= (slot.capacity || 9999))
      return res.status(400).json({ message: "هذه الحصة ممتلئة بالفعل." });

    // ✅ إنشاء الحجز الجديد
    const booking = await Booking.create({
      user: user._id,
      slot: slot._id,
      paymentRef,
    });

    // ✅ إنشاء حدث في Google Calendar إذا كان المستخدم موصولًا
    if (user.google?.accessToken) {
      try {
        await createGoogleEvent(user, booking);
      } catch (err) {
        console.warn("⚠️ Google Calendar skipped:", err.message);
      }
    }

    // ✅ جدولة التذكير قبل ساعتين من موعد الحصة
    if (slot?.date) {
      try {
        const slotDate = new Date(slot.date);
        await scheduleReminder(booking._id, slotDate);
        console.log(`⏰ Reminder scheduled for booking ${booking._id} (${slotDate.toISOString()})`);
      } catch (err) {
        console.warn("⚠️ Reminder scheduling failed:", err.message);
      }
    } else {
      console.warn(`⚠️ Skipped reminder: slot.date missing for booking ${booking._id}`);
    }

    // ✅ الرد النهائي للواجهة
    res.status(201).json({
      message: "تم إنشاء الحجز بنجاح ✅",
      booking,
    });
  } catch (error) {
    console.error("❌ Error in createBooking:", error);
    res.status(500).json({ message: "حدث خطأ في إنشاء الحجز" });
  }
};

/**
 * 🔹 إلغاء الحجز (مسموح قبل 12 ساعة فقط)
 */
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("slot user");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // السماح فقط لصاحب الحجز أو المدير
    if (!booking.user._id.equals(req.user._id) && req.user.role !== "admin")
      return res.status(403).json({ message: "Forbidden" });

    const now = new Date();
    const slotDate = new Date(booking.slot.date);
    const twelveHoursBefore = new Date(
      slotDate.getTime() - 12 * 60 * 60 * 1000
    );

    // 🔹 لا تسمح بالإلغاء خلال 12 ساعة إلا للمسؤول
    if (req.user.role !== "admin" && now > twelveHoursBefore) {
      return res
        .status(403)
        .json({ message: "لا يمكن إلغاء الحجز خلال آخر 12 ساعة قبل الحصة." });
    }

    booking.status = "cancelled";
    await booking.save();

    // ✅ حذف من Google Calendar إن وُجد
    if (booking.calendarEventId && booking.user.google?.accessToken) {
      try {
        await deleteGoogleEvent(booking.user, booking.calendarEventId);
      } catch (e) {
        console.error("⚠️ Failed to delete calendar event:", e.message);
      }
    }

    res.json({ message: "تم إلغاء الحجز بنجاح ❌" });
  } catch (error) {
    console.error("❌ Error cancelling booking:", error);
    res.status(500).json({ message: "تعذر إلغاء الحجز" });
  }
};

/**
 * 🔹 عرض جميع الحجوزات (للمشرفة فقط)
 */
export const getAllBookings = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const bookings = await Booking.find()
      .populate("user", "username email role")
      .populate("slot", "date startTime capacity")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("❌ Error fetching all bookings:", error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
};

/**
 * 🔹 عرض حجوزات المستخدم الحالية
 */
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("slot", "date startTime endTime capacity")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("❌ Error fetching user bookings:", error);
    res.status(500).json({ message: "Error fetching your bookings" });
  }
};
