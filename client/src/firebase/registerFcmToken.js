// src/firebase/registerFcmToken.js
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app } from "./config";
import { Api } from "../api/Api";
import { toast } from "react-toastify";
import { i18n } from "../i18n/i18n"; // ← مهم لجلب الترجمة
import { t } from "i18next"; // يمكنك استخدام t مباشرة

export async function registerFcmToken() {
  try {
    const supported = await isSupported();
    if (!supported || !("Notification" in window) || !navigator.serviceWorker) {
      console.warn("Web Push not supported.");
      toast.info(t("fcm.not_supported"));
      return null;
    }

    // 1) طلب الإذن
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      toast.info(t("fcm.permission_denied"));
      return null;
    }

    // 2) تسجيل الـ Service Worker الجذري
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    await navigator.serviceWorker.ready;

    const messaging = getMessaging(app);
    const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
      console.error("Missing REACT_APP_FIREBASE_VAPID_KEY");
      toast.error(t("fcm.missing_vapid"));
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.warn("No FCM token returned.");
      return null;
    }

    // 3) حفظ التوكن في السيرفر
    await Api.post("/users/fcm", { fcmToken: token });

    console.log("FCM token saved:", token.slice(0, 12) + "…");
    toast.success(t("fcm.success"));
    return token;

  } catch (err) {
    console.error("FCM register error:", err);
    toast.info(t("fcm.error"));
    return null;
  }
}
