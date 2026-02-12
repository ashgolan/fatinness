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
// agenda.define("send-reminder", async (job) => {
//   const { bookingId } = job.attrs.data;

//   const booking = await Booking.findById(bookingId).populate("user slot");
//   if (!booking || booking.status !== "booked") return;
//   if (booking.reminderSent) return;

//   const lang = booking.user.preferredLanguage || "ar";
//   const locale = getLocale(lang);

//   const startUTC = DateTime.fromJSDate(booking.slot.startAt, { zone: "utc" });

//   const dateStr = startUTC
//     .setZone(ZONE)
//     .toLocaleString(DateTime.DATE_FULL, { locale });

//   const timeStr = startUTC.setZone(ZONE).toFormat("HH:mm");

//   await sendSmartNotification({
//     user: booking.user,
//     title: NOTIFICATION_TITLE,
//     body:
//       lang === "en"
//         ? `You have training today ${dateStr} at ${timeStr}`
//         : lang === "he"
//         ? `יש לך אימון היום ${dateStr} בשעה ${timeStr}`
//         : `لديكِ تدريب اليوم ${dateStr} الساعة ${timeStr}`,
//   });

//   booking.reminderSent = true;
//   await booking.save();

//   console.log("🔔 Reminder sent");
// });

// ======================================================
// 🏁 إنهاء الحصة
// ======================================================
// agenda.define("mark-completed", async (job) => {
//   const { bookingId } = job.attrs.data;

//   const booking = await Booking.findById(bookingId).populate("user slot");
//   if (!booking || booking.status !== "booked") return;

//   const nowUTC = DateTime.utc();
//   const endUTC = DateTime.fromJSDate(booking.slot.endAt, { zone: "utc" });
//   if (nowUTC < endUTC) return;

//   booking.status = "completed";
//   await booking.save();

//   const lang = booking.user.preferredLanguage || "ar";

//   await sendSmartNotification({
//     user: booking.user,
//     title: NOTIFICATION_TITLE,
//     body:
//       lang === "en"
//         ? "You completed your training 💪"
//         : lang === "he"
//         ? "סיימת את האימון שלך 💪"
//         : "لقد أنهيتِ تدريبك 💪",
//   });
// });

// ======================================================
// ⭐ فحص الاشتراكات
// ======================================================
agenda.define("check-subscriptions-daily", async () => {
  console.log("🔁 Running daily subscription check");

  const users = await User.find({
    subscriptionEnd: { $ne: null },
  });

  const now = DateTime.utc();

  for (const user of users) {
    try {
      const endUTC = DateTime.fromJSDate(user.subscriptionEnd, { zone: "utc" });

      // الفرق بالأيام (تقريبي)
      const diffDays = Math.floor(endUTC.diff(now, "days").days);
      const lang = user.preferredLanguage || "he";

      // ===============================
      // 🔔 تذكير قبل 5 أيام
      // ===============================
      if (diffDays === 5 && !user.notified5Days) {
        const { title, body } = getNotificationText(
          "subscriptionExpiring5Days",
          lang
        );

        await sendSmartNotification({
          user,
          title,
          body,
          channel: "push",
          data: { type: "SUBSCRIPTION_EXPIRING_5_DAYS" },
        });

        user.notified5Days = true;
        await user.save();
        continue;
      }

      // ===============================
      // 🔔 تذكير قبل يومين
      // ===============================
      if (diffDays === 2 && !user.notified2Days) {
        const { title, body } = getNotificationText(
          "subscriptionExpiring2Days",
          lang
        );

        await sendSmartNotification({
          user,
          title,
          body,
          channel: "push",
          data: { type: "SUBSCRIPTION_EXPIRING_2_DAYS" },
        });

        user.notified2Days = true;
        await user.save();
        continue;
      }

      // ===============================
      // ⛔ انتهاء الاشتراك (بعد 02:00)
      // ===============================
      const afterTwoAM = now.hour >= 2;

      if (
        now >= endUTC &&
        afterTwoAM &&
        user.subscriptionStatus !== "expired"
      ) {
        user.subscriptionStatus = "expired";
        await user.save();

        const { title, body } = getNotificationText(
          "subscriptionExpired",
          lang
        );

        await sendSmartNotification({
          user,
          title,
          body,
          channel: "push",
          data: { type: "SUBSCRIPTION_EXPIRED" },
        });
      }
    } catch (err) {
      console.error(
        `⚠️ Failed subscription check for user ${user._id}`,
        err.message
      );
    }
  }

  console.log("✅ Daily subscription check completed");
});


// ======================================================
// 🕒 جدولة الحجز (✨ التحسين الوحيد ✨)
// ======================================================
// export const scheduleReminder = async (bookingId, startAt, endAt) => {
//   await agenda.cancel({ "data.bookingId": bookingId });

//   const startUTC = DateTime.fromJSDate(startAt, { zone: "utc" });
//   const endUTC = DateTime.fromJSDate(endAt, { zone: "utc" });
//   const reminderAt = startUTC.minus({ hours: 2 });
//   const now = DateTime.utc();

//   // ⭐ التحسين المهم
//   if (reminderAt <= now) {
//     await agenda.now("send-reminder", { bookingId });
//   } else {
//     await agenda.schedule(reminderAt.toJSDate(), "send-reminder", {
//       bookingId,
//     });
//   }

//   await agenda.schedule(
//     endUTC.plus({ minutes: 1 }).toJSDate(),
//     "mark-completed",
//     { bookingId }
//   );

//   console.log("⏱ Scheduler set for booking:", bookingId);
// };

// ======================================================
// 🚀 بدء المجدول (كما كان)
// ======================================================
export const startScheduler = async () => {
  await agenda.start();
  console.log("🚀 Scheduler started");
};
