// 📁 server/utils/fcm.js
import admin from "firebase-admin";
import fs from "fs";

// ======================================================
// 🔥 تحميل بيانات Firebase Admin
// ======================================================
if (!admin.apps.length) {
  let serviceAccount = null;

  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (raw && raw.trim() !== "{}") {
      serviceAccount = JSON.parse(raw);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

      if (fs.existsSync(path)) {
        const content = fs.readFileSync(path, "utf8");
        serviceAccount = JSON.parse(content);
      } else {
        console.error(`❌ Service account file not found at: ${path}`);
        process.exit(1);
      }
    } else {
      console.error("❌ Missing Firebase service account configuration");
      process.exit(1);
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("✅ Firebase Admin initialized");
  } catch (err) {
    console.error("❌ Firebase init error:", err.message);
    process.exit(1);
  }
}

// ======================================================
// 🔥 إرسال إشعار إلى عدة أجهزة — Notification Message
// ======================================================
export async function sendFcmToTokens(tokens = [], message = {}) {
  if (!tokens.length) {
    return { successCount: 0, failureCount: 1 };
  }

  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens,

      // ✨ إشعار رسمي يظهر حتى الشاشة مغلقة
      notification: {
        title: message.title || "Fatinness Studio",
        body: message.body || "",
      },

      // 📌 Data فقط للضغط وفتح رابط
      data: {
        url: message.url || "https://fateness.onrender.com",
        ...message.data,
      },

      android: {
        priority: "high",
        notification: {
          sound: "default",
        },
      },

      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    });

    console.log(
      `📢 FCM: success=${response.successCount}, failed=${response.failureCount}`
    );

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      success: response.successCount > 0,
    };
  } catch (error) {
    console.error("❌ FCM send error:", error.message);
    return { successCount: 0, failureCount: tokens.length };
  }
}

// ======================================================
// 🔥 إرسال إشعار لجهاز واحد — Notification Message
// ======================================================
export async function sendPushNotification(token, title, body, data = {}) {
  try {
    const messageObj = {
      token,

      // ✨ إشعار رسمي يظهر حتى والشاشة مغلقة
      notification: {
        title: "",
        body: body || "",
      },

      data: {
        url: data.url || "https://fateness.onrender.com",
        ...data,
      },

      android: {
        priority: "high",
        notification: { sound: "default" },
      },

      apns: {
        payload: { aps: { sound: "default" } },
      },
    };

    return await admin.messaging().send(messageObj);
  } catch (err) {
    console.error("❌ Single push error:", err.message);
  }
}

export default admin;
