import Agenda from "agenda";
import Booking from "../models/Booking.js";
import { sendSmartNotification } from "./notify.js";
import { toLocal } from "./date.js"; // ← الصحيح

// ======================================================
// 🔹 إنشاء مجدول Agenda
// ======================================================
export const agenda = new Agenda({
  db: { address: process.env.MONGO_URI, collection: "agendaJobs" },
});

// ======================================================
// 🔹 تعريف الوظائف التي ينفذها المجدول
// ======================================================
export const defineSchedulerJobs = () => {
  // ======================================================
  // 🕓 وظيفة إرسال التذكير قبل ساعتين
  // ======================================================
  agenda.define("send-reminder", async (job) => {
    const { bookingId } = job.attrs.data;

    const booking = await Booking.findById(bookingId).populate("user slot");
    if (!booking || !booking.slot) return;

    if (booking.status !== "booked" || booking.reminderSent) return;

    // تحويل التاريخ إلى Local
    const slotDate = toLocal(booking.slot.date);

    const title = "تذكير: تدريبك بعد ساعتين 💪";
    const body = `لديك تدريب اليوم ${slotDate.toLocaleDateString(
      "ar-EG"
    )} الساعة ${booking.slot.startTime}`;

    try {
      await sendSmartNotification({ user: booking.user, title, body });

      booking.reminderSent = true;
      await booking.save();

      console.log(`✅ Reminder sent for booking ${bookingId}`);
    } catch (err) {
      console.error(`❌ Reminder failed for ${bookingId}:`, err.message);
    }
  });

  // ======================================================
  // 🕕 وظيفة تحديد الحجز كـ "منجز" بعد نهاية الحصة
  // ======================================================
  agenda.define("mark-completed", async (job) => {
    const { bookingId } = job.attrs.data;

    const booking = await Booking.findById(bookingId).populate("user slot");
    if (!booking || !booking.slot) return;

    if (booking.status !== "booked") return;

    const slotDate = toLocal(booking.slot.date);

    // حساب وقت النهاية
    const [eh, em] = booking.slot.endTime.split(":").map(Number);
    const end = toLocal(slotDate);
    end.setHours(eh, em, 0, 0);

    const now = new Date();
    if (now >= end) {
      booking.status = "completed";
      await booking.save();

      try {
        const title = "🎉 أحسنتِ!";
        const body = `لقد أنجزتِ تدريبك بتاريخ ${slotDate.toLocaleDateString(
          "ar-EG"
        )}. استمري نحو هدفك 💪`;

        await sendSmartNotification({ user: booking.user, title, body });

        console.log(`🏁 Completed booking ${bookingId}`);
      } catch (err) {
        console.error("⚠️ Completion notification failed:", err.message);
      }
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
// 🔹 وظيفة جدولة التذكير + إنهاء الجلسة آليًا
// ======================================================
export const scheduleReminder = async (bookingId, slotDate, startTime, endTime) => {
  try {
    if (!slotDate || !startTime || !endTime) return;

    console.log("=======================================");
    console.log("🟦 New booking — Scheduling reminder");
    console.log("🕒 RAW slot.date from Mongo:", slotDate, " | ISO:", slotDate.toISOString());

    // 1) تحويل إلى Local
    const localDate = toLocal(slotDate);
    console.log("🟪 Local slot date (after toLocal):", localDate.toLocaleString("ar-EG"));

    // 2) ضبط وقت بداية الجلسة
    const [sh, sm] = startTime.split(":").map(Number);
    localDate.setHours(sh, sm, 0, 0);
    console.log("🟧 Slot start datetime (real session start):", localDate.toLocaleString("ar-EG"));

    // 3) حساب التذكير قبل ساعتين
    const reminderTime = new Date(localDate.getTime() - 2 * 60 * 60 * 1000);
    console.log("⏰ Reminder should be sent at:", reminderTime.toLocaleString("ar-EG"));

    if (reminderTime > new Date()) {
      await agenda.schedule(reminderTime, "send-reminder", { bookingId });
      console.log("⏳ Reminder scheduled successfully!");
    } else {
      console.log("⚠️ Reminder time already passed — Not scheduling.");
    }

    // 4) حساب نهاية الجلسة
    const [eh, em] = endTime.split(":").map(Number);
    const end = toLocal(slotDate);
    end.setHours(eh, em, 0, 0);

    console.log("🟩 Session end time:", end.toLocaleString("ar-EG"));

    const completeTime = new Date(end.getTime() + 60 * 1000);
    console.log("🏁 Completion scheduled at:", completeTime.toLocaleString("ar-EG"));

    await agenda.schedule(completeTime, "mark-completed", { bookingId });

    console.log("=======================================");

  } catch (err) {
    console.error("❌ Scheduler error:", err.message);
  }
};
