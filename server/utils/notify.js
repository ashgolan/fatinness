// 📁 server/utils/notify.js
import { sendFcmToTokens } from "./fcm.js";

/**
 * 🔔 إرسال إشعار ذكي عبر FCM
 * - يرسل فقط إذا وُجدت توكنات
 * - ينظف التوكنات الميتة فقط
 * - لا يحذف توكنات صالحة بالخطأ
 */
export async function sendSmartNotification({
  user,
  title,
  body,
  url,
}) {
  try {
    // 🛑 تحقق أساسي
    if (!user || !Array.isArray(user.fcmTokens)) {
      return {
        via: "none",
        successCount: 0,
        failureCount: 0,
      };
    }

    // ✅ نستخدم شكلًا واحدًا فقط للتوكنات (objects)
    const tokens = user.fcmTokens
      .map((t) => t?.token)
      .filter(Boolean);

    if (!tokens.length) {
      console.log(
        `🔕 No FCM tokens for user (${user.username || user._id})`
      );
      return {
        via: "none",
        successCount: 0,
        failureCount: 0,
      };
    }

    const fixedTitle = title || "Fatinness Studio";

    // 🚀 إرسال الإشعار
    const result = await sendFcmToTokens(tokens, {
      title: fixedTitle,
      body: body || "",
      url: url || process.env.CLIENT_URL,
    });

    const invalidTokens = result?.invalidTokens || [];

    // 🧹 تنظيف التوكنات الميتة فقط
    if (invalidTokens.length) {
      user.fcmTokens = user.fcmTokens.filter(
        (t) => t?.token && !invalidTokens.includes(t.token)
      );

      await user.save();

      console.log(
        `🧹 Removed ${invalidTokens.length} dead FCM tokens for user ${user._id}`
      );
    }

    return {
      via: "push",
      successCount: result?.successCount || 0,
      failureCount: result?.failureCount || 0,
    };
  } catch (err) {
    console.error("❌ sendSmartNotification error:", err);
    return {
      via: "error",
      successCount: 0,
      failureCount: 0,
    };
  }
}
