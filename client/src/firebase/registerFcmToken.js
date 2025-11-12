// src/firebase/registerFcmToken.js (CRA)
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app } from "./config";
import { Api } from "../api/Api";
import { toast } from "react-toastify";

export async function registerFcmToken() {
  try {
    const supported = await isSupported();
    if (!supported || !("Notification" in window) || !navigator.serviceWorker) {
      console.warn("Web Push not supported on this browser.");
      toast.info("⚠️ جهازك/المتصفح لا يدعم الإشعارات.");
      return null;
    }

    // 1) طلب الإذن
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      toast.info("⚠️ لم يتم تفعيل الإشعارات (اختياري).");
      return null;
    }

    // 2) انتظر تسجيل الـ SW الجذري ثم مرّره لـ getToken
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    await navigator.serviceWorker.ready; // احتياط

    const messaging = getMessaging(app);
    const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
      console.error("Missing REACT_APP_FIREBASE_VAPID_KEY");
      toast.error("مفتاح VAPID غير مضبوط في الواجهة.");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration, // ← أهم سطر
    });

    if (!token) {
      console.warn("No FCM token returned.");
      return null;
    }

    // 3) أرسل التوكن للسيرفر
    await Api.post("/users/fcm", { fcmToken: token });

    console.log("FCM token saved:", token.slice(0, 12) + "…");
    toast.success("تم تفعيل الإشعارات بنجاح 🎉");
    return token;
  } catch (err) {
    console.error("FCM register error:", err);
    // لو ظهر messaging/unsupported-browser هنا، السبب أحد البنود بالأعلى
    toast.info("⚠️ لم يتم تفعيل الإشعارات (اختياري).");
    return null;
  }
}
