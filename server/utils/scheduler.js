// 📁 server/scheduler/scheduler.js
import Agenda from "agenda";
import Booking from "../models/Booking.js";
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
// 🧹 عند تشغيل السيرفر → امسح جميع المهام القديمة لمنع التكرار
// ======================================================
agenda.on("ready", async () => {
  console.log("🧹 Cleaning old agenda jobs...");
  await agenda.cancel({});
  console.log("✨ Agenda ready with zero duplicates.");
});

// ======================================================
// 🔔 تذكير قبل ساعتين
// ======================================================
agenda.define("send-reminder", async (job) => {
  const { bookingId } = job.attrs.data;

  const booking = await Booking.findById(bookingId).populate("user slot");
  if (!booking || !booking.slot) return;

  if (booking.status !== "booked" || booking.reminderSent) return;

  const localDate = toLocal(booking.slot.date);
  const body = `لديكِ تدريب اليوم ${localDate.toLocaleDateString("ar-EG")} الساعة ${booking.slot.startTime}`;

  try {
    await sendSmartNotification({
      user: booking.user,
      title: NOTIFICATION_TITLE,
      body,
    });

    booking.reminderSent = true;
    await booking.save();

    console.log(`🔔 Reminder sent to ${booking.user.username}`);
  } catch (err) {
    console.error("❌ Reminder send error:", err.message);
  }
});

// ======================================================
// 🏁 إشعار انتهاء الحصة + تحويل الحالة إلى "completed"
// ======================================================
agenda.define("mark-completed", async (job) => {
  const { bookingId } = job.attrs.data;

  const booking = await Booking.findById(bookingId).populate("user slot");
  if (!booking || !booking.slot) return;

  if (booking.status !== "booked") return;

  const localDate = toLocal(booking.slot.date);

  const [eh, em] = booking.slot.endTime.split(":").map(Number);
  const end = toLocal(localDate);
  end.setHours(eh, em, 0, 0);

  if (new Date() >= end) {
    booking.status = "completed";
    await booking.save();

    try {
      const body = `لقد أنهيتِ تدريبك بتاريخ ${localDate.toLocaleDateString("ar-EG")} 💪`;
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
// 🕒 وظيفة جدولة التذكير + إنهاء الجلسة
// ======================================================
export const scheduleReminder = async (bookingId, slotDate, startTime, endTime) => {
  try {
    if (!slotDate || !startTime || !endTime) return;

    // مسح أي مهام قديمة لنفس الحجز لتجنب التكرار
    await agenda.cancel({ "data.bookingId": bookingId });

    const localDate = toLocal(slotDate);

    // بداية الحصة
    const [sh, sm] = startTime.split(":").map(Number);
    const start = new Date(localDate);
    start.setHours(sh, sm, 0, 0);

    // التذكير قبل ساعتين
    const reminderTime = new Date(start.getTime() - 2 * 60 * 60 * 1000);
    if (reminderTime > new Date()) {
      await agenda.schedule(reminderTime, "send-reminder", { bookingId });
    }

    // نهاية الحصة
    const [eh, em] = endTime.split(":").map(Number);
    const end = new Date(localDate);
    end.setHours(eh, em, 0, 0);

    // جدولة إكمال الحصة
    const completeTime = new Date(end.getTime() + 1 * 60 * 1000);
    await agenda.schedule(completeTime, "mark-completed", { bookingId });

    console.log("⏱ Jobs scheduled:", {
      bookingId,
      reminder: reminderTime.toLocaleString("ar-EG"),
      completion: completeTime.toLocaleString("ar-EG"),
    });

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
