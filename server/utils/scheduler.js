import Agenda from "agenda";
import Booking from "../models/Booking.js";
import Slot from "../models/Slot.js";
import { sendSmartNotification } from "./notify.js";

// 🔹 إنشاء مجدول Agenda
export const agenda = new Agenda({
  db: { address: process.env.MONGO_URI, collection: "agendaJobs" },
});

// ======================================================
// 🔹 تعريف الوظائف التي ينفذها المجدول
// ======================================================
export const defineSchedulerJobs = () => {
  // 🕓 وظيفة إرسال التذكير
  agenda.define("send-reminder", async (job) => {
    const { bookingId } = job.attrs.data;
    const booking = await Booking.findById(bookingId).populate("user slot");

    if (!booking) {
      console.warn(`⚠️ Reminder skipped: booking not found (${bookingId})`);
      return;
    }
    if (!booking.slot || !booking.slot.date) {
      console.warn(`⚠️ Reminder skipped: slot not found for booking ${bookingId}`);
      return;
    }
    if (booking.status !== "booked" || booking.reminderSent) return;

    const title = "تذكير: تدريبك بعد ساعتين 💪";
    const body = `لديك تدريب اليوم ${booking.slot.date.toLocaleDateString(
      "ar-EG"
    )} الساعة ${booking.slot.startTime || ""}`;

    try {
  await sendSmartNotification({
  user: booking.user,
  title,
  body,
});

      booking.reminderSent = true;
      await booking.save();
      console.log(`✅ Reminder sent for booking ${bookingId}`);
    } catch (err) {
      console.error(`❌ Failed to send reminder for ${bookingId}:`, err.message);
    }
  });

  // ======================================================
  // 🕕 وظيفة جديدة: تحديد الحجز كـ "منجز" بعد انتهاء الحصة + إشعار تهنئة
  // ======================================================
  agenda.define("mark-completed", async (job) => {
    const { bookingId } = job.attrs.data;
    const booking = await Booking.findById(bookingId).populate("user slot");

    if (!booking) {
      console.warn(`⚠️ mark-completed skipped: booking not found (${bookingId})`);
      return;
    }

    if (booking.status !== "booked") {
      console.log(`ℹ️ Booking ${bookingId} already ${booking.status}`);
      return;
    }

    const slotDate = booking.slot?.date;
    if (!slotDate) {
      console.warn(`⚠️ mark-completed skipped: missing slotDate for ${bookingId}`);
      return;
    }

    const now = new Date();
    if (now >= slotDate) {
      booking.status = "completed";
      await booking.save();
      console.log(`✅ Booking ${bookingId} marked as completed automatically`);

      // 🎉 إرسال إشعار تهنئة
      try {
        if (booking.user?.fcmTokens?.length) {
          const title = "🎉 أحسنتِ!";
          const body = `لقد أنجزتِ تدريبك بتاريخ ${slotDate.toLocaleDateString(
            "ar-EG"
          )}. استمري نحو هدفك 💪`;
await sendSmartNotification({
  user: booking.user,
  title,
  body,
});
          console.log(`🎊 Completion notification sent for booking ${bookingId}`);
        }
      } catch (err) {
        console.error(`❌ Failed to send completion notification:`, err.message);
      }
    } else {
      console.log(`⏳ Booking ${bookingId} not finished yet`);
    }
  });
};

// ======================================================
// 🔹 بدء تشغيل المجدول
// ======================================================
export const startScheduler = async () => {
  try {
    await agenda.start();
    console.log("🚀 Scheduler started successfully");
  } catch (err) {
    console.error("❌ Failed to start scheduler:", err.message);
  }
};

// ======================================================
// 🔹 وظيفة مساعد لتحديد وقت التذكير + التحديث التلقائي بعد الحصة
// ======================================================
export const scheduleReminder = async (bookingId, slotDate) => {
  try {
    if (!slotDate || !(slotDate instanceof Date)) {
      console.warn(`⚠️ Reminder skipped: invalid slotDate for booking ${bookingId}`);
      return;
    }

    // 🕓 برمجة التذكير قبل ساعتين
    const reminderTime = new Date(slotDate.getTime() - 2 * 60 * 60 * 1000);
    if (reminderTime > new Date()) {
      await agenda.schedule(reminderTime, "send-reminder", { bookingId });
      console.log(
        `⏰ Reminder scheduled for booking ${bookingId} at ${reminderTime.toLocaleString(
          "ar-EG"
        )}`
      );
    }

    // 🕕 برمجة تحديث الحالة بعد نهاية الحصة + إشعار تهنئة
    const completeTime = new Date(slotDate.getTime() + 1 * 60 * 1000); // بعد دقيقة من نهاية الحصة
    await agenda.schedule(completeTime, "mark-completed", { bookingId });
    console.log(
      `🏁 Completion scheduled for booking ${bookingId} at ${completeTime.toLocaleString(
        "ar-EG"
      )}`
    );
  } catch (err) {
    console.error(`❌ Failed to schedule reminder for ${bookingId}:`, err.message);
  }
};
