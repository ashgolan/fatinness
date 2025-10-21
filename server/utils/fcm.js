// 📁 server/utils/fcm.js
import admin from "firebase-admin";
import fs from "fs";

/**
 * ✅ تهيئة Firebase Admin باستخدام بيانات الخدمة من .env أو من ملف خارجي
 */
if (!admin.apps.length) {
  let serviceAccount = null;

  try {
    // نحاول أولاً قراءة JSON من متغير البيئة
const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (raw && raw.trim() !== "{}") {
      try {
        serviceAccount = JSON.parse(raw);
      } catch (err) {
        console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", err.message);
        process.exit(1);
      }
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // أو نقرأ من ملف خارجي إذا تم تحديد المسار
      const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

      if (fs.existsSync(path)) {
        const content = fs.readFileSync(path, "utf8");
        serviceAccount = JSON.parse(content);
      } else {
        console.error(`❌ Service account file not found at: ${path}`);
        process.exit(1);
      }
    } else {
      console.error("❌ Missing Firebase service account configuration in .env");
      console.error("Add either FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH");
      process.exit(1);
    }

    // ✅ التهيئة الفعلية
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("✅ Firebase Admin initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin:", error.message);
    process.exit(1);
  }
}

/**
 * 🔹 إرسال إشعار إلى جهاز واحد
 * @param {string} token - رمز FCM الخاص بالمستخدم
 * @param {string} title - عنوان الإشعار
 * @param {string} body - نص الإشعار
 * @param {object} data - بيانات إضافية (اختيارية)
 */
export async function sendPushNotification(token, title, body, data = {}) {
  try {
    const message = {
      token,
      notification: { title, body },
      data,
      android: { priority: "high" },
      apns: { payload: { aps: { sound: "default" } } },
    };

    const response = await admin.messaging().send(message);
    console.log("✅ Notification sent:", response);
    return response;
  } catch (error) {
    console.error("❌ Error sending notification:", error.message);
  }
}

/**
 * 🔹 إرسال إشعار إلى عدة أجهزة دفعة واحدة
 * @param {string[]} tokens - مجموعة الرموز (FCM Tokens)
 * @param {object} message - يحتوي على title, body, data
 */
export async function sendFcmToTokens(tokens = [], message = {}) {
  if (!tokens.length) return;
  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: message.title,
        body: message.body,
      },
      data: message.data || {},
    });
    console.log(`✅ FCM sent to ${response.successCount} devices`);
  } catch (error) {
    console.error("❌ Error in sendFcmToTokens:", error);
  }
}

export default admin;
