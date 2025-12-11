// 📁 server/scheduler/scheduler.js
import Agenda from "agenda";
import Booking from "../models/Booking.js";
import User from "../models/User.js"; // ⭐ مهم لإدارة الاشتراكات
import { sendSmartNotification } from "./notify.js";
import { toLocal } from "./date.js";

// ======================================================
// 🔧 إنشاء المجدول
// ======================================================
export const agenda = new Agenda({
  db: { address: process.env.MONGO_URI, collection: "agendaJobs" },
  processEvery: "1 minute",
});

// 🟣 عنوان ثابت لكل الإشعارات
const NOTIFICATION_TITLE = "Fatinness Studio";

// ======================================================
// 🌍 دوال الترجمة
// ======================================================
function getLocale(lang) {
  if (lang === "en") return "en-US";
  if (lang === "he") return "he-IL";
  return "ar-EG";
}

// 🎯 نصوص التدريب
function getReminderText(lang, dateStr, time) {
  const texts = {
    ar: `لديكِ تدريب اليوم ${dateStr} الساعة ${time}`,
    en: `You have training today ${dateStr} at ${time}`,
    he: `יש לך אימון היום ${dateStr} בשעה ${time}`,
  };
  return texts[lang] || texts.ar;
}

function getCompletionText(lang, dateStr) {
  const texts = {
    ar: `لقد أنهيتِ تدريبك بتاريخ ${dateStr} 💪`,
    en: `You completed your session on ${dateStr} 💪`,
    he: `סיימת את האימון שלך בתאריך ${dateStr} 💪`,
  };
  return texts[lang] || texts.ar;
}

// 🎯 نصوص انتهاء الاشتراك
function subscriptionEndsIn5(lang) {
  return {
    ar: "تبقّى 5 أيام على انتهاء اشتراكك. يرجى التجديد قريبًا.",
    en: "Your membership will expire in 5 days. Please renew soon.",
    he: "המנוי שלך יסתיים בעוד 5 ימים. נא לחדש בהקדם.",
  }[lang];
}

function subscriptionEndsIn2(lang) {
  return {
    ar: "تبقّى يومان على انتهاء اشتراكك. يُرجى عدم التأخير.",
    en: "Your membership will expire in 2 days. Don’t delay.",
    he: "המנוי שלך יסתיים בעוד יומיים. נא לא לאחר.",
  }[lang];
}

function subscriptionExpired(lang) {
  return {
    ar: "انتهى اشتراكك. تم إيقاف إمكانية الحجز حتى التجديد.",
    en: "Your membership has expired. Booking is blocked until renewal.",
    he: "המנוי שלך הסתיים. לא ניתן להזמין שיעורים עד חידוש.",
  }[lang];
}

// ======================================================
// 🧹 عند تشغيل السيرفر → امسح جميع المهام القديمة
// ======================================================
agenda.on("ready", async () => {
  console.log("🧹 Cleaning old agenda jobs...");
  await agenda.cancel({});
  console.log("✨ Agenda ready with zero duplicates.");

  // ⭐ شغّل وظيفة الاشتراكات اليومية
  await agenda.every("0 2 * * *", "check-subscriptions-daily"); // الساعة 02:00
});

// ======================================================
// 🔔 تذكير قبل ساعتين
// ======================================================
agenda.define("send-reminder", async (job) => {
  const { bookingId } = job.attrs.data;

  const booking = await Booking.findById(bookingId).populate("user slot");
  if (!booking || !booking.slot) return;

  if (booking.status !== "booked" || booking.reminderSent) return;

  const lang = booking.user.preferredLanguage || "ar";
  const locale = getLocale(lang);

  const localDate = toLocal(booking.slot.date);
  const dateStr = localDate.toLocaleDateString(locale);

  const body = getReminderText(lang, dateStr, booking.slot.startTime);

  try {
    await sendSmartNotification({
      user: booking.user,
      title: NOTIFICATION_TITLE,
      body,
    });

    booking.reminderSent = true;
    await booking.save();

    console.log(`🔔 Reminder sent to ${booking.user.username} (${lang})`);
  } catch (err) {
    console.error("❌ Reminder send error:", err.message);
  }
});

// ======================================================
// 🏁 إشعار انتهاء الحصة
// ======================================================
agenda.define("mark-completed", async (job) => {
  const { bookingId } = job.attrs.data;

  const booking = await Booking.findById(bookingId).populate("user slot");
  if (!booking || !booking.slot) return;

  if (booking.status !== "booked") return;

  const lang = booking.user.preferredLanguage || "ar";
  const locale = getLocale(lang);

  const localDate = toLocal(booking.slot.date);
  const dateStr = localDate.toLocaleDateString(locale);

  const body = getCompletionText(lang, dateStr);

  const [eh, em] = booking.slot.endTime.split(":").map(Number);
  const end = toLocal(localDate);
  end.setHours(eh, em, 0, 0);

  if (new Date() >= end) {
    booking.status = "completed";
    await booking.save();

    try {
      await sendSmartNotification({
        user: booking.user,
        title: NOTIFICATION_TITLE,
        body,
      });

      console.log(`🏁 Session completed for ${booking.user.username}`);
    } catch (err) {
      console.error("⚠️ Completion notification failed:", err.message);
    }
  }
});

// ======================================================
// ⭐⭐ وظيفة التذكير بانتهاء الاشتراك ⭐⭐
// ======================================================
agenda.define("check-subscriptions-daily", async () => {
  console.log("🔍 Checking subscriptions...");

  const users = await User.find({
    subscriptionEnd: { $ne: null },
  });

  const now = new Date();

  for (const u of users) {
    const lang = u.preferredLanguage || "ar";

    const end = new Date(u.subscriptionEnd);
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

    // قبل 5 أيام
    if (diffDays === 5) {
      await sendSmartNotification({
        user: u,
        title: NOTIFICATION_TITLE,
        body: subscriptionEndsIn5(lang),
      });
      console.log(`📢 Sent 5-day reminder to ${u.username}`);
    }

    // قبل يومين
    if (diffDays === 2) {
      await sendSmartNotification({
        user: u,
        title: NOTIFICATION_TITLE,
        body: subscriptionEndsIn2(lang),
      });
      console.log(`📢 Sent 2-day reminder to ${u.username}`);
    }

    // يوم الانتهاء → حظر المستخدم
    if (diffDays <= 0 && !u.isBlocked) {
      u.isBlocked = true;
      await u.save();

      await sendSmartNotification({
        user: u,
        title: NOTIFICATION_TITLE,
        body: subscriptionExpired(lang),
      });

      console.log(`⛔ Blocked expired user: ${u.username}`);
    }
  }
});

// ======================================================
// 🕒 جدولة تذكير الحصص
// ======================================================
export const scheduleReminder = async (bookingId, slotDate, startTime, endTime) => {
  try {
    if (!slotDate || !startTime || !endTime) return;

    await agenda.cancel({ "data.bookingId": bookingId });

    const localDate = toLocal(slotDate);

    const [sh, sm] = startTime.split(":").map(Number);
    const start = new Date(localDate);
    start.setHours(sh, sm, 0, 0);

    const reminderTime = new Date(start.getTime() - 2 * 60 * 60 * 1000);
    if (reminderTime > new Date())
      await agenda.schedule(reminderTime, "send-reminder", { bookingId });

    const [eh, em] = endTime.split(":").map(Number);
    const end = new Date(localDate);
    end.setHours(eh, em, 0, 0);

    const completeTime = new Date(end.getTime() + 1 * 60 * 1000);
    await agenda.schedule(completeTime, "mark-completed", { bookingId });

    console.log("⏱ Job scheduled for booking:", bookingId);
  } catch (err) {
    console.error("❌ Scheduler error:", err.message);
  }
};

// ======================================================
// 🚀 بدء المجدول
// ======================================================
export const startScheduler = async () => {
  try {
    await agenda.start();
    console.log("🚀 Scheduler started");
  } catch (err) {
    console.error("❌ Scheduler start failed:", err.message);
  }
};
