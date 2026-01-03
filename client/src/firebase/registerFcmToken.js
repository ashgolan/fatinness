import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app } from "./config";
import { Api } from "../api/Api";
import { toast } from "react-toastify";
import { t } from "i18next";

export async function registerFcmToken() {
  try {
    // 1️⃣ هل الجهاز يدعم الإشعارات؟
    const supported = await isSupported();
    if (!supported || !("Notification" in window) || !navigator.serviceWorker) {
      return null; // صامت
    }

    // 2️⃣ طلب الإذن
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return null; // المستخدم رفض – لا خطأ
    }

    // 3️⃣ service worker
    const registration =
      (await navigator.serviceWorker.getRegistration()) ||
      (await navigator.serviceWorker.register("/firebase-messaging-sw.js"));

    // 4️⃣ Firebase messaging
    const messaging = getMessaging(app);
    const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
      console.warn("Missing VAPID key");
      return null;
    }

    // 5️⃣ الحصول على التوكن
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) return null;

    // 6️⃣ حفظ التوكن في السيرفر
    await Api.post("/users/fcm", { fcmToken: token });

    // ✅ نجاح حقيقي
    toast.success(t("fcm.success"));
    return token;
  } catch (err) {
    // ❗ مهم جدًا: لا نُظهر خطأ
    console.warn("FCM skipped:", err?.message);
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
