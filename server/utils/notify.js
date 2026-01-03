// 📁 server/utils/notify.js
import { sendFcmToTokens } from "./fcm.js";

/**
 * 🔹 إرسال إشعار عبر FCM فقط لمالك الجهاز
 * 🔹 مع تنظيف التوكنات الميتة
 */
export async function sendSmartNotification({ user, title, body, url }) {
  try {
    if (!user || !Array.isArray(user.fcmTokens)) {
      return {
        via: "none",
        successCount: 0,
        failureCount: 0,
      };
    }

    // ✅ نأخذ فقط التوكنات التي هذا المستخدم هو مالكها
    // const ownedTokens = user.fcmTokens.filter(
    //   (t) =>
    //     t &&
    //     t.token &&
    //     t.ownerUserId &&
    //     t.ownerUserId.equals(user._id)
    // );

    // const tokens = ownedTokens.map((t) => t.token);
// ✅ نأخذ كل التوكنات (مؤقتًا)
const tokens = user.fcmTokens
  .map((t) => (typeof t === "string" ? t : t.token))
  .filter(Boolean);

    if (!tokens.length) {
      console.log(
        `🔕 No owned FCM tokens for user (${user.username || user._id})`
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

    const invalidTokens = result?.invalidTokens || [];

    // 🧹 حذف التوكنات الميتة فقط من هذا المستخدم
    if (invalidTokens.length) {
      user.fcmTokens = user.fcmTokens.filter(
        (t) => !invalidTokens.includes(t.token)
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
