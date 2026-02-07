// import admin from "firebase-admin";
// import fs from "fs";

// // ======================================================
// // 🔥 تحميل بيانات Firebase Admin
// // ======================================================
// if (!admin.apps.length) {
//   let serviceAccount = null;

//   try {
//     const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

//     if (raw && raw.trim() !== "{}") {
//       serviceAccount = JSON.parse(raw);
//     } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
//       const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

//       if (fs.existsSync(path)) {
//         const content = fs.readFileSync(path, "utf8");
//         serviceAccount = JSON.parse(content);
//       } else {
//         console.error(`❌ Service account file not found at: ${path}`);
//         process.exit(1);
//       }
//     } else {
//       console.error("❌ Missing Firebase service account configuration");
//       process.exit(1);
//     }

//     admin.initializeApp({
//       credential: admin.credential.cert(serviceAccount),
//     });

//     console.log("✅ Firebase Admin initialized");
//   } catch (err) {
//     console.error("❌ Firebase init error:", err.message);
//     process.exit(1);
//   }
// }

// // ======================================================
// // 🔥 إرسال إشعار إلى عدة أجهزة (DATA-ONLY)
// // ======================================================
// export async function sendFcmToTokens(tokens = [], message = {}) {
//   if (!tokens.length) {
//     return { successCount: 0, failureCount: 0, invalidTokens: [] };
//   }

//   try {
//     const response = await admin.messaging().sendEachForMulticast({
//       tokens,

//       // ❌ لا notification هنا نهائياً
//       // ✅ Data-only message (يعمل في foreground + background)
//       data: {
//         type: message.type || "BOOKING_REMINDER",
//         title: message.title || "Fatinness Studio",
//         body: message.body || "",
//         url: message.url || process.env.CLIENT_URL || "/",
//         ...message.data,
//       },

//       android: {
//         priority: "high",
//       },

//       apns: {
//         payload: {
//           aps: {
//             sound: "default",
//           },
//         },
//       },
//     });

//     const invalidTokens = [];

//     response.responses.forEach((res, index) => {
//       if (!res.success) {
//         const code = res.error?.code || "";

//         if (
//           code === "messaging/registration-token-not-registered" ||
//           code === "messaging/invalid-registration-token"
//         ) {
//           invalidTokens.push(tokens[index]);
//         }
//       }
//     });

//     console.log(
//       `📢 FCM: success=${response.successCount}, failed=${response.failureCount}, invalid=${invalidTokens.length}`
//     );

//     return {
//       successCount: response.successCount,
//       failureCount: response.failureCount,
//       invalidTokens,
//     };
//   } catch (error) {
//     console.error("❌ FCM send error:", error.message);
//     return {
//       successCount: 0,
//       failureCount: tokens.length,
//       invalidTokens: [],
//     };
//   }
// }

// // ======================================================
// // 🔥 إرسال إشعار لجهاز واحد (DATA-ONLY)
// // ======================================================
// export async function sendPushNotification(token, title, body, data = {}) {
//   try {
//     return await admin.messaging().send({
//       token,

//       // ❌ بدون notification
//       data: {
//         type: data.type || "BOOKING_REMINDER",
//         title: title || "Fatinness Studio",
//         body: body || "",
//         url: data.url || process.env.CLIENT_URL || "/",
//         ...data,
//       },

//       android: {
//         priority: "high",
//       },

//       apns: {
//         payload: {
//           aps: {
//             sound: "default",
//           },
//         },
//       },
//     });
//   } catch (err) {
//     console.error("❌ Single push error:", err.message);
//   }
// }

// export default admin;
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
// 🔔 إرسال إشعار إلى عدة أجهزة (Notification + Data)
// ======================================================
export async function sendFcmToTokens(tokens = [], message = {}) {
  if (!tokens.length) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens,

      // ✅ Notification (للوصول الفوري حتى مع Doze)
      notification: {
        title: message.title || "Fatinness Studio",
        body: message.body || "",
      },

      // ✅ Data (لاستخدامها داخل التطبيق)
      data: {
        type: message.type || "GENERAL",
        url: message.url || process.env.CLIENT_URL || "/",
        ...message.data,
      },

      android: {
        priority: "high",
        ttl: 60 * 60 * 1000, // ⏱️ ساعة واحدة
        notification: {
          sound: "default",
          channelId: "high_priority",
        },
      },

      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    });

    const invalidTokens = [];

    response.responses.forEach((res, index) => {
      if (!res.success) {
        const code = res.error?.code || "";

        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        ) {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    console.log(
      `📢 FCM: success=${response.successCount}, failed=${response.failureCount}, invalid=${invalidTokens.length}`
    );

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens,
    };
  } catch (error) {
    console.error("❌ FCM send error:", error.message);
    return {
      successCount: 0,
      failureCount: tokens.length,
      invalidTokens: [],
    };
  }
}

// ======================================================
// 🔔 إرسال إشعار لجهاز واحد (Notification + Data)
// ======================================================
export async function sendPushNotification(token, title, body, data = {}) {
  try {
    return await admin.messaging().send({
      token,

      notification: {
        title: title || "Fatinness Studio",
        body: body || "",
      },

      data: {
        type: data.type || "GENERAL",
        url: data.url || process.env.CLIENT_URL || "/",
        ...data,
      },

      android: {
        priority: "high",
        ttl: 60 * 60 * 1000,
        notification: {
          sound: "default",
          channelId: "high_priority",
        },
      },

      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    });
  } catch (err) {
    console.error("❌ Single push error:", err.message);
  }
}

export default admin;
