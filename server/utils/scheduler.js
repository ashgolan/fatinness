import Agenda from "agenda";
import Booking from "../models/Booking.js";
import Slot from "../models/Slot.js";
import { sendFcmToTokens } from "./fcm.js";

// 🔹 إنشاء مجدول Agenda
export const agenda = new Agenda({
  db: { address: process.env.MONGO_URI, collection: "agendaJobs" },
});

// 🔹 تعريف الوظائف التي ينفذها المجدول
export const defineSchedulerJobs = () => {
  // 🕓 وظيفة إرسال التذكير
  agenda.define("send-reminder", async (job) => {
    const { bookingId } = job.attrs.data;
    const booking = await Booking.findById(bookingId).populate("user slot");

    if (!booking || booking.status !== "booked" || booking.reminderSent) return;

    const title = "تذكير: تدريبك بعد ساعتين 💪";
    const body = `لديك تدريب اليوم ${booking.slot.date.toLocaleDateString(
      "ar-EG"
    )} الساعة ${booking.slot.startTime}`;

    if (booking.user?.fcmTokens?.length) {
      await sendFcmToTokens(booking.user.fcmTokens, { title, body });
    }

    booking.reminderSent = true;
    await booking.save();
    console.log(`✅ Reminder sent for booking ${bookingId}`);
  });
};

// 🔹 بدء تشغيل المجدول
export const startScheduler = async () => {
  await agenda.start();
  console.log("🚀 Scheduler started successfully");
};

// 🔹 وظيفة مساعد لتحديد وقت التذكير
export const scheduleReminder = async (bookingId, slotDate) => {
  const reminderTime = new Date(slotDate.getTime() - 2 * 60 * 60 * 1000); // ساعتين قبل الموعد
  await agenda.schedule(reminderTime, "send-reminder", { bookingId });
  console.log(`⏰ Reminder scheduled for booking ${bookingId} at ${reminderTime}`);
};
