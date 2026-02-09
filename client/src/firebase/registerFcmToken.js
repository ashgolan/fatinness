// import { getMessaging, onMessage, getToken, isSupported } from "firebase/messaging";
// import { app } from "./config";
// import { Api } from "../api/Api";
// import { toast } from "react-toastify";
// import i18n from "i18next";
// export const FCM_EVENT = "fcm-foreground-message";

// let retryTimer = null;

// let refreshListenerAttached = false;

// export async function registerFcmToken({ silent = false,
//   assumePermissionGranted = false } = {}) {
//   try {
//     // 1️⃣ دعم المتصفح
//     if (!(await isSupported())) return null;
//     if (!("Notification" in window)) return null;
//     if (!navigator.serviceWorker) return null;

//     // 2️⃣ الإذن
//     if (!assumePermissionGranted) {
//       if (Notification.permission === "denied") {
//         if (!silent) toast.info(i18n.t("fcm.permission_denied"));
//         return null;
//       }

//       if (Notification.permission !== "granted") {
//         const perm = await Notification.requestPermission();
//         if (perm !== "granted") {
//           if (!silent) toast.info(i18n.t("fcm.permission_denied"));
//           return null;
//         }
//       }
//     } else {
//       // ✅ نحن متأكدين أنه granted من الـ Navbar
//       if (Notification.permission !== "granted") return null;
//     }

//     if (Notification.permission !== "granted") {
//       const perm = await Notification.requestPermission();
//       if (perm !== "granted") {
//         if (!silent) toast.info(i18n.t("fcm.permission_denied"));
//         return null;
//       }
//     }

//     // 3️⃣ Service Worker
//     let registration =
//       (await navigator.serviceWorker.getRegistration("/")) ||
//       (await navigator.serviceWorker.register("/firebase-messaging-sw.js"));

//     if (!registration.active) {
//       await new Promise((resolve) => {
//         const sw = registration.installing || registration.waiting;
//         if (!sw) return resolve();

//         sw.addEventListener("statechange", () => {
//           if (sw.state === "activated") resolve();
//         });
//       });
//     }

//     // 4️⃣ FCM
//     const messaging = getMessaging(app);
//     const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
//     if (!vapidKey) return null;

//     const token = await getToken(messaging, {
//       vapidKey,
//       serviceWorkerRegistration: registration,
//     });

//     if (!token) throw new Error("FCM_TOKEN_NOT_READY");

//     console.log("🔥 FCM TOKEN FROM DEVICE:", token);

//     // 5️⃣ إرسال دائم للسيرفر (حتى لو مكرر)
//     await Api.post("/users/fcm", { fcmToken: token });

//     // 6️⃣ 🔥 الاستماع لتغيير التوكن (مرة واحدة فقط)
//     if (!refreshListenerAttached) {
//       refreshListenerAttached = true;

//       onTokenRefresh(messaging, async (newToken) => {
//         console.log("🔄 FCM TOKEN REFRESHED:", newToken);

//         try {
//           await Api.post("/users/fcm", { fcmToken: newToken });
//         } catch (e) {
//           console.error("❌ Failed to sync refreshed token", e);
//         }
//       });
//     }

//     // if (!silent) {
//     //   toast.success(i18n.t("fcm.success"));
//     // }

//     return token;
//   } catch (err) {
//     console.log("FCM not ready yet:", err?.message);

//     // 🔁 Retry ذكي
//     if (!retryTimer) {
//       retryTimer = setTimeout(() => {
//         retryTimer = null;
//         registerFcmToken({ silent: true });
//       }, 60000);
//     }

//     return null;
//   }
// }



// const messaging = getMessaging(app);

// onMessage(messaging, (payload) => {
//   console.log("📩 FCM foreground message:", payload);

//   if (payload?.data?.type !== "BOOKING_REMINDER") return;

//   toast(
//     <div
//       style={{
//         display: "flex",
//         gap: 12,
//         alignItems: "flex-start",
//         padding: "12px 14px",
//       }}
//     >
//       {/* أيقونة */}
//       <div
//         style={{
//           fontSize: 22,
//           lineHeight: "22px",
//         }}
//       >
//         ⏰
//       </div>

//       {/* النص */}
//       <div style={{ flex: 1 }}>
//         <div
//           style={{
//             fontWeight: 700,
//             fontSize: 14,
//             marginBottom: 4,
//             color: "#fff",
//           }}
//         >
//           {payload.data.title}
//         </div>

//         <div
//           style={{
//             fontSize: 13,
//             opacity: 0.85,
//             color: "#eaeaea",
//             lineHeight: 1.4,
//           }}
//         >
//           {payload.data.body}
//         </div>
//       </div>
//     </div>,
//     {
//       containerId: "fcm",
//       autoClose: false,
//       closeOnClick: true,
//       style: {
//         background: "rgba(18,18,18,0.92)", // أسود شفاف راقي
//         borderRadius: 14,
//         boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
//         borderInlineStart: "4px solid #9c27b0", // بنفسجي الهوية
//         padding: 0,
//       },
//     }
//   );
// });

import {
  getMessaging,
  onMessage,
  getToken,
  isSupported,
} from "firebase/messaging";
import { app } from "./config";
import { Api } from "../api/Api";
import { toast } from "react-toastify";
import i18n from "i18next";

export const FCM_EVENT = "fcm-foreground-message";

let retryTimer = null;

export async function registerFcmToken({
  silent = false,
  assumePermissionGranted = false,
} = {}) {
  try {
    // 1️⃣ دعم المتصفح
    if (!(await isSupported())) return null;
    if (!("Notification" in window)) return null;
    if (!navigator.serviceWorker) return null;

    // 2️⃣ الإذن
    if (!assumePermissionGranted) {
      if (Notification.permission === "denied") {
        if (!silent) toast.info(i18n.t("fcm.permission_denied"));
        return null;
      }

      if (Notification.permission !== "granted") {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          if (!silent) toast.info(i18n.t("fcm.permission_denied"));
          return null;
        }
      }
    }

    if (Notification.permission !== "granted") return null;

    // 3️⃣ Service Worker
    let registration =
      (await navigator.serviceWorker.getRegistration("/")) ||
      (await navigator.serviceWorker.register("/firebase-messaging-sw.js"));

    // انتظر تفعيل الـ SW
    if (!registration.active) {
      await new Promise((resolve) => {
        const sw = registration.installing || registration.waiting;
        if (!sw) return resolve();

        sw.addEventListener("statechange", () => {
          if (sw.state === "activated") resolve();
        });
      });
    }

    // 4️⃣ FCM
    const messaging = getMessaging(app);
    const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
      console.warn("❌ Missing REACT_APP_FIREBASE_VAPID_KEY");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) throw new Error("FCM_TOKEN_NOT_READY");

    console.log("🔥 FCM TOKEN FROM DEVICE:", token);

    // 5️⃣ Sync token with server
    await Api.post("/users/fcm", { fcmToken: token });

    return token;
  } catch (err) {
    console.log("⚠️ FCM not ready:", err?.message);

    // 🔁 Retry ذكي
    if (!retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        registerFcmToken({ silent: true });
      }, 60000);
    }

    return null;
  }
}

// ======================================================
// 🔔 Foreground messages
// ======================================================

const messaging = getMessaging(app);

onMessage(messaging, (payload) => {
  if (!payload?.data) return;

  toast(
    <div style={{ display: "flex", gap: 12, padding: "12px 14px" }}>
      <div style={{ fontSize: 22 }}>⏰</div>
      <div>
        <div style={{ fontWeight: 700 }}>
          {payload.data.title}
        </div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          {payload.data.body}
        </div>
      </div>
    </div>,
    {
      containerId: "fcm",
      autoClose: false,
      closeOnClick: true,
    }
  );

  // 🟣 أرسل الحدث للتطبيق
  window.dispatchEvent(
    new CustomEvent(FCM_EVENT, { detail: payload.data })
  );
});
