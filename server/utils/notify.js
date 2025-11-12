// 📁 server/utils/notify.js
import { sendFcmToTokens } from "./fcm.js";
import { sendWhatsAppMessage } from "./whatsapp.js";

/**
 * 🔹 تنسيق رقم الهاتف إلى صيغة دولية (مثلاً 0521234567 → 972521234567)
 */
function normalizePhone(phone) {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "972" + digits.slice(1);
  return digits;
}

/**
 * 🔹 إرسال إشعار ذكي (Push → WhatsApp fallback)
 * @param {object} user - كائن المستخدم من قاعدة البيانات
 * @param {string} title - عنوان الإشعار
 * @param {string} body - نص الإشعار
 * @param {string} channel - "auto" | "push" | "whatsapp"
 * @returns {Promise<{via: string, successCount: number, failureCount: number}>}
 */
export async function sendSmartNotification({ user, title, body, channel = "auto" }) {
  try {
    const tokens = Array.isArray(user.fcmTokens) ? user.fcmTokens.filter(Boolean) : [];
    const phone = normalizePhone(user.phone);
    const message = `${title}\n${body}`;

    // 🟢 الحالة: إرسال Push فقط
    if (channel === "push") {
      await sendFcmToTokens(tokens, { title, body });
      return { via: "push", successCount: tokens.length, failureCount: 0 };
    }

    // 🟢 الحالة: إرسال WhatsApp فقط
    if (channel === "whatsapp") {
      if (!phone) return { via: "whatsapp", successCount: 0, failureCount: 1 };
      await sendWhatsAppMessage(phone, message);
      return { via: "whatsapp", successCount: 1, failureCount: 0 };
    }

    // 🟢 الحالة: Auto (يحاول Push أولاً ثم WhatsApp)
    let pushSuccess = 0;
    if (tokens.length) {
      const res = await sendFcmToTokens(tokens, { title, body });
      pushSuccess = res?.successCount || 0;
      if (pushSuccess > 0)
        return { via: "push", successCount: pushSuccess, failureCount: 0 };
    }

    // ⚠️ fallback إلى WhatsApp إن فشل Push
    if (phone) {
      await sendWhatsAppMessage(phone, message);
      return { via: "whatsapp", successCount: 1, failureCount: 0 };
    }

    return { via: "none", successCount: 0, failureCount: tokens.length };
  } catch (err) {
    console.error("❌ Error in sendSmartNotification:", err.message);
    return { via: "error", successCount: 0, failureCount: 1 };
  }
}
