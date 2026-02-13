
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
    // 3️⃣ Service Worker
    let registration = await navigator.serviceWorker.getRegistration();

    if (!registration) {
      registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );
    }

    // تأكد أن الـ SW جاهز بالكامل
    await navigator.serviceWorker.ready;

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



  // 🟣 الحدث الحالي يبقى كما هو
  window.dispatchEvent(
    new CustomEvent(FCM_EVENT, { detail: payload.data })
  );


});
