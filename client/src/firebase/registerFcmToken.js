// src/firebase/registerFcmToken.js
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app } from "./config";
import { Api } from "../api/Api";
import { toast } from "react-toastify";
import { t } from "i18next";

export async function registerFcmToken({ silent = false } = {}) {
  try {
    const supported = await isSupported();
    if (!supported || !("Notification" in window) || !navigator.serviceWorker) {
      return null;
    }

    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      if (!silent) toast.info(t("fcm.permission_denied"));
      return null;
    }

    const registration =
      (await navigator.serviceWorker.getRegistration("/")) ||
      (await navigator.serviceWorker.register("/firebase-messaging-sw.js"));

    const messaging = getMessaging(app);
    const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
      if (!silent) toast.error(t("fcm.missing_vapid"));
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) return null;

    const res = await Api.post("/users/fcm", { fcmToken: token });

    // 🟢 نجاح حقيقي
    if (
      res.data?.code === "FCM_TOKEN_SAVED" ||
      res.data?.code === "FCM_TOKEN_SAVED_AS_OWNER"
    ) {
      if (!silent) toast.success(t("fcm.success"));
      return token;
    }

    // 🔵 جهاز مملوك لمستخدم آخر
    if (res.data?.code === "FCM_TOKEN_IGNORED_DEVICE_OWNED") {
      if (!silent)
        toast.info(t("fcm.deviceOwnedByAnother"), { autoClose: 6000 });
      return null;
    }

    // fallback
    if (!silent) toast.success(t("fcm.success"));
    return token;
  } catch (err) {
    console.error("FCM register error:", err);
    if (!silent) toast.info(t("fcm.error"));
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
