import { DateTime } from "luxon";
import { agenda } from "./agenda.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { sendSmartNotification } from "../utils/notify.js";
import { ZONE } from "../utils/time.js";

// ======================================================
// 🌍 لغة المستخدم
// ======================================================
function getLocale(lang) {
  if (lang === "en") return "en-US";
  if (lang === "he") return "he-IL";
  return "ar-EG";
}

// ======================================================
// 🟣 عنوان الإشعارات
// ======================================================
const NOTIFICATION_TITLE = "Fatinness Studio";

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
// ⭐ فحص الاشتراكات (مرة يوميًا)
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
          lang === "en"
            ? diffDays === 5
              ? "5 days left until your subscription ends"
              : "2 days left until your subscription ends"
            : lang === "he"
            ? diffDays === 5
              ? "נותרו 5 ימים לסיום המנוי שלך"
              : "נותרו יומיים לסיום המנוי שלך"
            : diffDays === 5
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
        body:
          lang === "en"
            ? "Your subscription has ended and booking is disabled"
            : lang === "he"
            ? "המנוי שלך הסתיים והאפשרות להזמנה הושבתה"
            : "انتهى اشتراكك وتم إيقاف الحجز",
      });
    }
  }
});

// ======================================================
// 🕒 جدولة الحجز
// ======================================================
export const scheduleReminder = async (bookingId, startAt, endAt) => {
  await agenda.cancel({ "data.bookingId": bookingId });

  const startUTC = DateTime.fromJSDate(startAt, { zone: "utc" });
  const endUTC = DateTime.fromJSDate(endAt, { zone: "utc" });

  const reminderAt = startUTC.minus({ hours: 2 });
  const now = DateTime.utc();

  // 🔔 إذا فات وقت التذكير → أرسل الآن
  if (reminderAt <= now) {
    await agenda.now("send-reminder", { bookingId });
  } else {
    await agenda.schedule(reminderAt.toJSDate(), "send-reminder", {
      bookingId,
    });
  }

  // 🏁 إنهاء الحصة
  await agenda.schedule(
    endUTC.plus({ minutes: 1 }).toJSDate(),
    "mark-completed",
    { bookingId }
  );

  console.log("⏱ Scheduler set for booking:", bookingId);
};
