// src/firebase/registerFcmToken.js
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app } from "./config";
import { Api } from "../api/Api";
import { toast } from "react-toastify";
import { t } from "i18next";

export async function registerFcmToken() {
  try {
    // 1️⃣ تحقق من الدعم
    const supported = await isSupported();
    if (!supported || !("Notification" in window) || !navigator.serviceWorker) {
      toast.info(t("fcm.not_supported"));
      return null;
    }

    // 2️⃣ طلب الإذن
    // 🛑 إذا كان الإذن مرفوض مسبقًا (Blocked)
    if (Notification.permission === "denied") {
      toast.error(t("fcm.permission_blocked_help"), {
        autoClose: 8000,
      });
      return null;
    }

    // 🔔 نطلب الإذن فقط إذا لم يُطلب سابقًا
    if (Notification.permission === "default") {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast.info(t("fcm.permission_denied"));
        return null;
      }
    }

    // 3️⃣ Service Worker
    const registration =
      (await navigator.serviceWorker.getRegistration("/")) ||
      (await navigator.serviceWorker.register("/firebase-messaging-sw.js"));

    // 4️⃣ Messaging + VAPID
    const messaging = getMessaging(app);
    const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
      toast.error(t("fcm.missing_vapid"));
      return null;
    }

    // 5️⃣ الحصول على التوكن
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) return null;

    // 6️⃣ إرسال التوكن للسيرفر
    const res = await Api.post("/users/fcm", { fcmToken: token });

    // 🔴 الجهاز مملوك لمستخدم آخر
    if (res.data?.code === "FCM_TOKEN_IGNORED_DEVICE_OWNED") {
      toast.info(t("fcm.deviceOwnedByAnother"), { autoClose: 6000 });
      return null;
    }

    // 🟡 تم نقل الإشعارات لجهاز جديد لنفس المستخدم
    if (res.data?.code === "FCM_TOKEN_TRANSFERRED_NEW_DEVICE") {
      toast.success(t("fcm.transferred"));
      return token;
    }

    // 🟢 أول تسجيل / نفس الجهاز
    if (
      res.data?.code === "FCM_TOKEN_SAVED_AS_OWNER" ||
      res.data?.code === "FCM_TOKEN_ALREADY_REGISTERED"
    ) {
      toast.success(t("fcm.success"));
      return token;
    }

    // 🟢 أي نجاح افتراضي
    toast.success(t("fcm.success"));
    return token;
  } catch (err) {
    console.error("FCM register error:", err);
    toast.info(t("fcm.error"));
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
