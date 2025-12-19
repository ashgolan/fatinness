// 📁 server/scheduler/scheduler.js
import Agenda from "agenda";
import { DateTime } from "luxon";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { sendSmartNotification } from "../utils/notify.js";
import { ZONE } from "../utils/time.js";

// ======================================================
// 🔧 إنشاء المجدول
// ======================================================
export const agenda = new Agenda({
  db: { address: process.env.MONGO_URI, collection: "agendaJobs" },
  processEvery: "1 minute",
});

// 🟣 عنوان ثابت
const NOTIFICATION_TITLE = "Fatinness Studio";

// ======================================================
// 🌍 لغة المستخدم
// ======================================================
function getLocale(lang) {
  if (lang === "en") return "en-US";
  if (lang === "he") return "he-IL";
  return "ar-EG";
}

// ======================================================
// 🧹 تنظيف عند الإقلاع
// ======================================================
agenda.on("ready", async () => {
  console.log("🧹 Cleaning old agenda jobs...");
  await agenda.cancel({});
  console.log("✨ Agenda ready");

  await agenda.every("0 2 * * *", "check-subscriptions-daily");
});

// ======================================================
// 🔔 تذكير قبل ساعتين
// ======================================================
agenda.define("send-reminder", async (job) => {
  const { bookingId } = job.attrs.data;

  const booking = await Booking.findById(bookingId).populate("user slot");
  if (!booking || booking.status !== "booked") return;

  const lang = booking.user.preferredLanguage || "ar";
  const locale = getLocale(lang);

  const startUTC = DateTime.fromJSDate(booking.slot.startAt, { zone: "utc" });

  const dateStr = startUTC
    .setZone(ZONE)
    .toLocaleString(DateTime.DATE_FULL, { locale });

  const timeStr = startUTC
    .setZone(ZONE)
    .toFormat("HH:mm");

  await sendSmartNotification({
    user: booking.user,
    title: NOTIFICATION_TITLE,
    body:
      lang === "en"
        ? `You have training today ${dateStr} at ${timeStr}`
        : lang === "he"
        ? `יש לך אימון היום ${dateStr} בשעה ${timeStr}`
        : `لديكِ تدريب اليوم ${dateStr} الساعة ${timeStr}`,
  });

  booking.reminderSent = true;
  await booking.save();

  console.log(`🔔 Reminder sent to ${booking.user.username}`);
});

// ======================================================
// 🏁 إنهاء الحصة
// ======================================================
agenda.define("mark-completed", async (job) => {
  const { bookingId } = job.attrs.data;

  const booking = await Booking.findById(bookingId).populate("user slot");
  if (!booking || booking.status !== "booked") return;

  const nowUTC = DateTime.utc();
  const endUTC = DateTime.fromJSDate(booking.slot.endAt, { zone: "utc" });

  if (nowUTC < endUTC) return;

  booking.status = "completed";
  await booking.save();

  const lang = booking.user.preferredLanguage || "ar";

  await sendSmartNotification({
    user: booking.user,
    title: NOTIFICATION_TITLE,
    body:
      lang === "en"
        ? "You completed your training 💪"
        : lang === "he"
        ? "סיימת את האימון שלך 💪"
        : "لقد أنهيتِ تدريبك 💪",
  });

  console.log(`🏁 Session completed for ${booking.user.username}`);
});

// ======================================================
// ⭐ تذكير الاشتراكات
// ======================================================
agenda.define("check-subscriptions-daily", async () => {
  const users = await User.find({ subscriptionEnd: { $ne: null } });
  const nowUTC = DateTime.utc();

  for (const u of users) {
    const endUTC = DateTime.fromJSDate(u.subscriptionEnd, { zone: "utc" });
    const diffDays = Math.ceil(endUTC.diff(nowUTC, "days").days);

    const lang = u.preferredLanguage || "ar";

    if ([5, 2].includes(diffDays)) {
      await sendSmartNotification({
        user: u,
        title: NOTIFICATION_TITLE,
        body:
          diffDays === 5
            ? "تبقّى 5 أيام على انتهاء اشتراكك"
            : "تبقّى يومان على انتهاء اشتراكك",
      });
    }

    if (diffDays <= 0 && !u.isBlocked) {
      u.isBlocked = true;
      await u.save();

      await sendSmartNotification({
        user: u,
        title: NOTIFICATION_TITLE,
        body: "انتهى اشتراكك وتم إيقاف الحجز",
      });
    }
  }
});

// ======================================================
// 🕒 جدولة الحصص
// ======================================================
export const scheduleReminder = async (bookingId, startAt, endAt) => {
  try {
    await agenda.cancel({ "data.bookingId": bookingId });

    const startUTC = DateTime.fromJSDate(startAt, { zone: "utc" });
    const endUTC = DateTime.fromJSDate(endAt, { zone: "utc" });

    const reminderAt = startUTC.minus({ hours: 2 });
    if (reminderAt > DateTime.utc()) {
      await agenda.schedule(reminderAt.toJSDate(), "send-reminder", {
        bookingId,
      });
    }

    await agenda.schedule(
      endUTC.plus({ minutes: 1 }).toJSDate(),
      "mark-completed",
      { bookingId }
    );

    console.log("⏱ Scheduler set for booking:", bookingId);
  } catch (err) {
    console.error("❌ Scheduler error:", err.message);
  }
};

// ======================================================
// 🚀 بدء المجدول
// ======================================================
export const startScheduler = async () => {
  await agenda.start();
  console.log("🚀 Scheduler started");
};
