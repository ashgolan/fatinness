import { agenda } from '../config/agenda.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { sendPushNotification } from './fcm.js'; // سننشئه لاحقًا

// 🔹 جدولة تذكير قبل ساعتين من موعد التدريب
export async function scheduleReminder(bookingId) {
  const booking = await Booking.findById(bookingId).populate('user slot');
  if (!booking || booking.status !== 'booked') return;

  const slotDate = new Date(booking.slot.date);
  const reminderTime = new Date(slotDate.getTime() - 2 * 60 * 60 * 1000); // ساعتين قبل

  await agenda.schedule(reminderTime, 'sendBookingReminder', { bookingId });
}

// 🔹 تعريف مهمة التذكير (يتم تنفيذها من Agenda)
export function defineSchedulerJobs() {
  agenda.define('sendBookingReminder', async (job) => {
    const { bookingId } = job.attrs.data;
    const booking = await Booking.findById(bookingId).populate('user slot');
    if (!booking || booking.status !== 'booked') return;

    const user = await User.findById(booking.user._id);

    // 🔔 إرسال إشعار للمستخدم
    if (user?.fcmToken) {
      await sendPushNotification(
        user.fcmToken,
        '⏰ Reminder: Training Session Soon!',
        `Your session starts at ${new Date(booking.slot.date).toLocaleTimeString()}.`
      );
    }

    console.log(`Reminder sent to ${user?.email || 'unknown user'}`);
  });
}
