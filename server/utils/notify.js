// 📁 server/utils/notify.js
import { sendFcmToTokens } from "./fcm.js";

/**
 * 🔹 إرسال إشعار عبر FCM فقط
 */
export async function sendSmartNotification({ user, title, body, url }) {
  try {
    const tokens = Array.isArray(user.fcmTokens)
      ? user.fcmTokens.filter(Boolean)
      : [];

    if (!tokens.length) {
      console.log(
        `⚠️ No FCM tokens for user (${user.username || user._id})`
      );
      return {
        via: "none",
        successCount: 0,
        failureCount: 0,
      };
    }

    const fixedTitle = title || "Fatinness Studio";

    const result = await sendFcmToTokens(tokens, {
      title: fixedTitle,
      body: body || "",
      url: url || process.env.CLIENT_URL,
    });

    const successCount = result?.successCount || 0;
    const failureCount = result?.failureCount || 0;

    console.log(
      `📨 [FCM] ${fixedTitle} -> ${user.username}: success=${successCount}, fail=${failureCount}`
    );

    return {
      via: "push",
      successCount,
      failureCount,
    };
  } catch (err) {
    console.error("❌ sendSmartNotification error:", err.message);
    return {
      via: "error",
      successCount: 0,
      failureCount: 0,
    };
  }
}
