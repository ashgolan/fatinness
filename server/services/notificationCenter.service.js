import UserNotification from "../models/UserNotification.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js"; // إذا عندكم حجز للجلسات
// إذا اسم الموديل مختلف عدّله عندك

export async function createUserInboxFromNotification(notificationDoc) {
  const { _id, title, body, targetType, targetUser, targetSlot } = notificationDoc;

  let userIds = [];

  if (targetType === "all") {
    const users = await User.find({ isDeleted: { $ne: true } }).select("_id");
    userIds = users.map((u) => u._id);
  }

  if (targetType === "user" && targetUser) {
    userIds = [targetUser];
  }

  if (targetType === "slot" && targetSlot) {
    // ✅ اجلب كل المستخدمين الذين لديهم حجز للجلسة (عدّل حسب منطقك)
    const bookings = await Booking.find({ slot: targetSlot, isCancelled: { $ne: true } })
      .select("user");
    userIds = bookings.map((b) => b.user);
  }

  if (!userIds.length) return { created: 0 };

  const docs = userIds.map((userId) => ({
    user: userId,
    notification: _id,
    isRead: false,
    readAt: null,
    targetType,
    targetSlot: targetSlot || null,
    title,
    body,
  }));

  // ✅ upsert بدون كسر: يمنع التكرار
  const bulk = docs.map((d) => ({
    updateOne: {
      filter: { user: d.user, notification: d.notification },
      update: { $setOnInsert: d },
      upsert: true,
    },
  }));

  const res = await UserNotification.bulkWrite(bulk);
  const created = (res.upsertedCount || 0);

  return { created };
}
