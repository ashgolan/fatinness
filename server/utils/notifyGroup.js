import UserNotification from "../models/UserNotification.js";
import { sendFcmToTokens } from "./fcm.js";

export async function sendGroupNotification({
  users,
  title,
  body,
  type = "system",
  targetType = "slot",
  targetSlot = null,
  url = "/notifications",
}) {
  if (!users || !users.length) return;

  // ===============================
  // 📝 1️⃣ حفظ الإشعارات في DB دفعة واحدة
  // ===============================

  const notifications = users.map((user) => ({
    user: user._id,
    title,
    body,
    type,
    targetType,
    targetSlot,
  }));

  await UserNotification.insertMany(notifications);

  // ===============================
  // 🔔 2️⃣ جمع كل التوكنات
  // ===============================

  const allTokens = users.flatMap((user) =>
    (user.fcmTokens || []).map((t) => t.token)
  );

  if (!allTokens.length) return;

  // ===============================
  // 🚀 3️⃣ إرسال push مرة واحدة
  // ===============================

  await sendFcmToTokens(allTokens, {
    title,
    body,
    url,
    type: "SLOT_SYSTEM",
  });
}
