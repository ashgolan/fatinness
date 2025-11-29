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
// 🔥 إرسال إشعار إلى عدة أجهزة (مع إرجاع عدد النجاح/الفشل)
// ======================================================
export async function sendFcmToTokens(tokens = [], message = {}) {
  if (!tokens.length) {
    return { successCount: 0, failureCount: 1 };
  }

  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens,

      // ✨ إشعار Android الرسمي (يُظهر اسم التطبيق)
      notification: {
        title: message.title || "Fatinness Studio 🔥",
        body: message.body || "",
      },

      // 🔥 Data فقط للتمرير للـ Service Worker
      data: {
        icon: message.icon || "/logo192x192.png",
        url: message.url || "https://fateness.onrender.com",
        ...message.data,
      },

      android: { priority: "high" },
      apns: { payload: { aps: { sound: "default" } } },
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
// 🔥 إرسال إشعار لجهاز واحد
// ======================================================
export async function sendPushNotification(token, title, body, data = {}) {
  try {
    const message = {
      token,

      // ✨ Android Notification (يُظهر اسم التطبيق)
      notification: {
        title: title || "Fatinness Studio 🔥",
        body: body || "",
      },

      // 🔥 Data فقط للـ SW
      data: {
        icon: data.icon || "/logo192x192.png",
        url: data.url || "https://fateness.onrender.com",
        ...data,
      },

      android: { priority: "high" },
      apns: { payload: { aps: { sound: "default" } } },
    };

    return await admin.messaging().send(message);
  } catch (err) {
    console.error("❌ Single push error:", err.message);
  }
}

export default admin;
