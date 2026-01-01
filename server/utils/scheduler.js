import Agenda from "agenda";
import { DateTime } from "luxon";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { sendSmartNotification } from "../utils/notify.js";
import { ZONE } from "../utils/time.js";

// ======================================================
// 🔧 إنشاء المجدول (كما كان)
// ======================================================
export const agenda = new Agenda({
  db: { address: process.env.MONGO_URI, collection: "agendaJobs" },
  processEvery: "1 minute",
});

// ======================================================
// 🟣 عنوان ثابت
// ======================================================
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
// 🧹 عند الإقلاع (كما كان)
// ======================================================
agenda.on("ready", async () => {
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
  if (booking.reminderSent) return;

  const lang = booking.user.preferredLanguage || "ar";
  const locale = getLocale(lang);

  const startUTC = DateTime.fromJSDate(booking.slot.startAt, { zone: "utc" });

  const dateStr = startUTC
    .setZone(ZONE)
    .toLocaleString(DateTime.DATE_FULL, { locale });

  const timeStr = startUTC.setZone(ZONE).toFormat("HH:mm");

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

  console.log("🔔 Reminder sent");
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
});

// ======================================================
// ⭐ فحص الاشتراكات
// ======================================================
agenda.define("check-subscriptions-daily", async () => {
  const users = await User.find({
    subscriptionEnd: { $ne: null },
  });

  const now = DateTime.utc();

  for (const u of users) {
    const endUTC = DateTime.fromJSDate(u.subscriptionEnd, { zone: "utc" });

    // الفرق بالأيام (تقريبي لليوم)
    const diffDays = Math.floor(endUTC.diff(now, "days").days);

    // ======================================================
    // 🔔 تذكير قبل 5 أيام
    // ======================================================
    if (diffDays === 5 && !u.notified5Days) {
      await sendSmartNotification({
        user: u,
        title: NOTIFICATION_TITLE,
        body:
          u.preferredLanguage === "en"
            ? "Your subscription will expire in 5 days"
            : u.preferredLanguage === "he"
            ? "המנוי שלך יסתיים בעוד 5 ימים"
            : "يتبقى 5 أيام على انتهاء اشتراكك",
      });

      u.notified5Days = true;
      await u.save();
    }

    // ======================================================
    // 🔔 تذكير قبل يومين
    // ======================================================
    if (diffDays === 2 && !u.notified2Days) {
      await sendSmartNotification({
        user: u,
        title: NOTIFICATION_TITLE,
        body:
          u.preferredLanguage === "en"
            ? "Your subscription will expire in 2 days"
            : u.preferredLanguage === "he"
            ? "המנוי שלך יסתיים בעוד יומיים"
            : "يتبقى يومان على انتهاء اشتراكك",
      });

      u.notified2Days = true;
      await u.save();
    }

    // ======================================================
    // ⛔ إنهاء الاشتراك (بعد 02:00 ليلًا)
    // ======================================================
    const afterTwoAM = now.hour >= 2;

    if (now >= endUTC && afterTwoAM && u.subscriptionStatus !== "expired") {
      u.subscriptionStatus = "expired";
      await u.save();

      await sendSmartNotification({
        user: u,
        title: NOTIFICATION_TITLE,
        body:
          u.preferredLanguage === "en"
            ? "Your subscription has expired. Booking is disabled."
            : u.preferredLanguage === "he"
            ? "המנוי שלך הסתיים. לא ניתן להזמין אימונים."
            : "انتهى اشتراكك وتم إيقاف الحجز",
      });
    }
  }
});


// ======================================================
// 🕒 جدولة الحجز (✨ التحسين الوحيد ✨)
// ======================================================
export const scheduleReminder = async (bookingId, startAt, endAt) => {
  await agenda.cancel({ "data.bookingId": bookingId });

  const startUTC = DateTime.fromJSDate(startAt, { zone: "utc" });
  const endUTC = DateTime.fromJSDate(endAt, { zone: "utc" });
  const reminderAt = startUTC.minus({ hours: 2 });
  const now = DateTime.utc();

  // ⭐ التحسين المهم
  if (reminderAt <= now) {
    await agenda.now("send-reminder", { bookingId });
  } else {
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
};

// ======================================================
// 🚀 بدء المجدول (كما كان)
// ======================================================
export const startScheduler = async () => {
  await agenda.start();
  console.log("🚀 Scheduler started");
};
