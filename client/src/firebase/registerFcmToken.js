// src/firebase/registerFcmToken.js
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app } from "./config";
import { Api } from "../api/Api";
import { toast } from "react-toastify";
import { t } from "i18next";

export async function registerFcmToken() {
  try {
    const supported = await isSupported();
    if (!supported || !("Notification" in window) || !navigator.serviceWorker) {
      toast.info(t("fcm.not_supported"));
      return null;
    }

    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      toast.info(t("fcm.permission_denied"));
      return null;
    }

    const registration =
      (await navigator.serviceWorker.getRegistration("/")) ||
      (await navigator.serviceWorker.register("/firebase-messaging-sw.js"));

    const messaging = getMessaging(app);
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
      toast.error(t("fcm.missing_vapid"));
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) return null;

    await Api.post("/users/fcm", { fcmToken: token });

    toast.success(t("fcm.success"));
    return token;

  } catch (err) {
    console.error("FCM register error:", err);
    toast.info(t("fcm.error"));
    return null;
  }
}
