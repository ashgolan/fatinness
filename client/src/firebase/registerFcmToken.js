import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app } from "./config";
import { Api } from "../api/Api";
import { toast } from "react-toastify";
import { t, i18n } from "i18next";

export async function registerFcmToken({ silent = false } = {}) {
  try {
    const supported = await isSupported();
    if (!supported || !("Notification" in window) || !navigator.serviceWorker) {
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const registration =
      (await navigator.serviceWorker.getRegistration(
        "/firebase-messaging-sw.js"
      )) ||
      (await navigator.serviceWorker.register("/firebase-messaging-sw.js"));

    const messaging = getMessaging(app);
    const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
    if (!vapidKey) return null;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) return null;

    await Api.post("/users/fcm", { fcmToken: token });

    if (!silent) toast.success(i18n.t("fcm.success"));
    return token;
  } catch (err) {
    console.warn("FCM skipped:", err);
    return null;
  }
}

export async function transferFcmToThisDevice() {
  try {
    const messaging = getMessaging(app);
    const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;

    const registration =
      (await navigator.serviceWorker.getRegistration("/")) ||
      (await navigator.serviceWorker.register("/firebase-messaging-sw.js"));

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      toast.error(t("fcm.error"));
      return;
    }

    await Api.post("/users/fcm/transfer", { fcmToken: token });

    toast.success(t("fcm.transferred"));
  } catch (err) {
    console.error(err);
    toast.error(t("fcm.error"));
  }
}
