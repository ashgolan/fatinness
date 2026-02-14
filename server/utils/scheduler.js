// import Agenda from "agenda";
// import { DateTime } from "luxon";
// import Booking from "../models/Booking.js";
// import User from "../models/User.js";
// import { sendSmartNotification } from "../utils/notify.js";
// import { ZONE } from "../utils/time.js";
// import UserNotification from "../models/UserNotification.js";

// // ======================================================
// // 🔧 إنشاء المجدول (كما كان)
// // ======================================================
// export const agenda = new Agenda({
//   db: { address: process.env.MONGO_URI, collection: "agendaJobs" },
//   processEvery: "1 minute",
// });

// // ======================================================
// // 🟣 عنوان ثابت
// // ======================================================
// const NOTIFICATION_TITLE = "Fatinness Studio";

// // ======================================================
// // 🌍 لغة المستخدم
// // ======================================================
// function getLocale(lang) {
//   if (lang === "en") return "en-US";
//   if (lang === "he") return "he-IL";
//   return "ar-EG";
// }

// // ======================================================
// // 🧹 عند الإقلاع (كما كان)
// // ======================================================
// agenda.on("ready", async () => {
//   console.log("✨ Agenda ready");
//   await agenda.every("0 2 * * *", "check-subscriptions-daily");
// });


// // ======================================================
// // ⭐ فحص الاشتراكات
// // ======================================================
// agenda.define("check-subscriptions-daily", async () => {
//   console.log("🔁 Running daily subscription check");

//   const users = await User.find({
//     subscriptionEnd: { $ne: null },
//   });

//   const now = DateTime.utc();

//   for (const user of users) {
//     try {
//       const endUTC = DateTime.fromJSDate(user.subscriptionEnd, { zone: "utc" });

//       // الفرق بالأيام (تقريبي)
//       const diffDays = Math.floor(endUTC.diff(now, "days").days);
//       const lang = user.preferredLanguage || "he";

//       // ===============================
//       // 🔔 تذكير قبل 5 أيام
//       // ===============================
//       if (diffDays === 5 && !user.notified5Days) {
//         const { title, body } = getNotificationText(
//           "subscriptionExpiring5Days",
//           lang
//         );

//         // 📝 حفظ في Inbox
//         await UserNotification.create({
//           user: user._id,
//           title,
//           body,
//           type: "subscription",
//           targetType: "user",
//         });

//         // 🔔 إرسال Push
//         await sendSmartNotification({
//           user,
//           title,
//           body,
//           channel: "push",
//           data: {
//             type: "subscription",
//             event: "SUBSCRIPTION_EXPIRING_5_DAYS",
//           },
//         });


//         user.notified5Days = true;
//         await user.save();
//         continue;
//       }

//       // ===============================
//       // 🔔 تذكير قبل يومين
//       // ===============================
//       if (diffDays === 2 && !user.notified2Days) {
//         const { title, body } = getNotificationText(
//           "subscriptionExpiring2Days",
//           lang
//         );

//         await UserNotification.create({
//           user: user._id,
//           title,
//           body,
//           type: "subscription",
//           targetType: "user",
//         });

//         await sendSmartNotification({
//           user,
//           title,
//           body,
//           channel: "push",
//           data: {
//             type: "subscription",
//             event: "SUBSCRIPTION_EXPIRING_2_DAYS",
//           },
//         });


//         user.notified2Days = true;
//         await user.save();
//         continue;
//       }

//       // ===============================
//       // ⛔ انتهاء الاشتراك (بعد 02:00)
//       // ===============================
//       const afterTwoAM = now.hour >= 2;

//       if (
//         now >= endUTC &&
//         afterTwoAM &&
//         user.subscriptionStatus !== "expired"
//       ) {
//         user.subscriptionStatus = "expired";
//         await user.save();

//         const { title, body } = getNotificationText(
//           "subscriptionExpired",
//           lang
//         );

//         await UserNotification.create({
//           user: user._id,
//           title,
//           body,
//           type: "subscription",
//           targetType: "user",
//         });

//         await sendSmartNotification({
//           user,
//           title,
//           body,
//           channel: "push",
//           data: {
//             type: "subscription",
//             event: "SUBSCRIPTION_EXPIRED",
//           },
//         });

//       }
//     } catch (err) {
//       console.error(
//         `⚠️ Failed subscription check for user ${user._id}`,
//         err.message
//       );
//     }
//   }

//   console.log("✅ Daily subscription check completed");
// });


// // ======================================================
// // 🚀 بدء المجدول (كما كان)
// // ======================================================
// export const startScheduler = async () => {
//   await agenda.start();
//   console.log("🚀 Scheduler started");
// };
import Agenda from "agenda";
import { DateTime } from "luxon";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { sendSmartNotification } from "../utils/notify.js";
import { ZONE } from "../utils/time.js";
import UserNotification from "../models/UserNotification.js";

// ======================================================
// 🔧 إنشاء المجدول
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
// 🧹 عند الإقلاع
// ======================================================
agenda.on("ready", async () => {
  console.log("✨ Agenda ready");

  await agenda.every(
    "0 2 * * *",
    "check-subscriptions-daily",
    {},
    { timezone: ZONE } // ✅ مهم جداً
  );
});

// ======================================================
// ⭐ فحص الاشتراكات
// ======================================================
agenda.define("check-subscriptions-daily", async () => {
  console.log("🔁 Running daily subscription check");

  const users = await User.find({
    subscriptionEnd: { $ne: null },
  });

  // ✅ الآن حسب توقيت إسرائيل وبداية اليوم
  const now = DateTime.now().setZone(ZONE).startOf("day");

  for (const user of users) {
    try {
      const end = DateTime.fromJSDate(user.subscriptionEnd)
        .setZone(ZONE)
        .startOf("day");

      const diffDays = end.diff(now, "days").days;
      const lang = user.preferredLanguage || "he";

      // ======================================================
      // 🔔 تذكير قبل 5 أيام
      // ======================================================
      if (diffDays === 5 && !user.notified5Days) {
        const { title, body } = getNotificationText(
          "subscriptionExpiring5Days",
          lang
        );

        await UserNotification.create({
          user: user._id,
          title,
          body,
          type: "subscription",
          targetType: "user",
        });

        await sendSmartNotification({
          user,
          title,
          body,
          channel: "push",
          data: {
            type: "subscription",
            event: "SUBSCRIPTION_EXPIRING_5_DAYS",
          },
        });

        user.notified5Days = true;
        await user.save();
        continue;
      }

      // ======================================================
      // 🔔 تذكير قبل يومين
      // ======================================================
      if (diffDays === 2 && !user.notified2Days) {
        const { title, body } = getNotificationText(
          "subscriptionExpiring2Days",
          lang
        );

        await UserNotification.create({
          user: user._id,
          title,
          body,
          type: "subscription",
          targetType: "user",
        });

        await sendSmartNotification({
          user,
          title,
          body,
          channel: "push",
          data: {
            type: "subscription",
            event: "SUBSCRIPTION_EXPIRING_2_DAYS",
          },
        });

        user.notified2Days = true;
        await user.save();
        continue;
      }

      // ======================================================
      // ⛔ انتهاء الاشتراك
      // ======================================================
      const afterTwoAM =
        DateTime.now().setZone(ZONE).hour >= 2;

      if (
        now >= end &&
        afterTwoAM &&
        user.subscriptionStatus !== "expired"
      ) {
        user.subscriptionStatus = "expired";
        await user.save();

        const { title, body } = getNotificationText(
          "subscriptionExpired",
          lang
        );

        await UserNotification.create({
          user: user._id,
          title,
          body,
          type: "subscription",
          targetType: "user",
        });

        await sendSmartNotification({
          user,
          title,
          body,
          channel: "push",
          data: {
            type: "subscription",
            event: "SUBSCRIPTION_EXPIRED",
          },
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
// 🚀 بدء المجدول
// ======================================================
export const startScheduler = async () => {
  await agenda.start();
  console.log("🚀 Scheduler started");
};
