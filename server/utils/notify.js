// 📁 server/utils/notify.js
import { sendFcmToTokens } from "./fcm.js";

/**
 * 🔹 إرسال إشعار عبر FCM فقط (لا يوجد واتساب ولا fallback)
 * @param {object} user - كائن المستخدم من قاعدة البيانات
 * @param {string} title - عنوان الإشعار
 * @param {string} body - نص الإشعار
 * @returns {Promise<{via: string, successCount: number, failureCount: number}>}
 */
export async function sendSmartNotification({ user, title, body }) {
  try {
    // التأكد من وجود توكنات
    const tokens = Array.isArray(user.fcmTokens)
      ? user.fcmTokens.filter(Boolean)
      : [];

    if (!tokens.length) {
      console.log(
        `⚠️ لا توجد FCM Tokens لدى المستخدم (${user.username || user._id}).`
      );
      return { via: "none", successCount: 0, failureCount: 1 };
    }

    // 🔸 عنوان ثابت للنادي
    const fixedTitle = title || "Fatinness Studio";

    // 🔥 إرسال الإشعار عبر FCM فقط
    const result = await sendFcmToTokens(tokens, {
      title: fixedTitle,
      body: body || "",
    });

    const successCount = result?.successCount || 0;
    const failureCount = result?.failureCount || 0;

    console.log(
      `📨 [FCM] ${fixedTitle} -> ${user.username}: نجاح ${successCount} | فشل ${failureCount}`
    );

    return {
      via: "push",
      successCount,
      failureCount,
    };
  } catch (err) {
    console.error("❌ Error in sendSmartNotification:", err.message);
    return { via: "error", successCount: 0, failureCount: 1 };
  }
}
