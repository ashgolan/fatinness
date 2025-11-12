import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app } from "./config";
import { Api } from "../api/Api";
import { toast } from "react-toastify";

export async function registerFcmToken() {
  try {
    console.log("🚀 بدء عملية تسجيل FCM Token...");

    // ✅ تحقق من دعم المتصفح
    const supported = await isSupported();
    if (!supported) {
      console.warn("⚠️ المتصفح لا يدعم Firebase Messaging");
      toast.info("جهازك لا يدعم الإشعارات.");
      return null;
    }

    // ✅ تأكد من وجود Service Worker
    if (!("serviceWorker" in navigator)) {
      console.warn("❌ المتصفح لا يدعم Service Workers");
      return null;
    }

    console.log("📦 تسجيل Service Worker...");
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("✅ تم تسجيل Service Worker:", registration);

    // ✅ تهيئة Messaging
    const messaging = getMessaging(app);

    // ✅ طلب الإذن من المستخدم
    const permission = await Notification.requestPermission();
    console.log("📜 حالة الإذن:", permission);

    if (permission !== "granted") {
      toast.info("⚠️ لم يتم منح الإذن للإشعارات (اختياري)");
      return null;
    }

    // ✅ الحصول على الـ Token
    console.log("🔄 جارٍ توليد FCM Token...");
    const fcmToken = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!fcmToken) {
      console.warn("⚠️ لم يتم توليد FCM Token");
      return null;
    }

    console.log("🎯 تم الحصول على FCM Token:", fcmToken);

    // ✅ إرسال التوكن إلى السيرفر
    const { data } = await Api.post("/users/fcm", { fcmToken });
    console.log("✅ استجابة السيرفر:", data);

    toast.success("تم تفعيل الإشعارات بنجاح 🎉");
    return fcmToken;
  } catch (err) {
    console.error("❌ خطأ أثناء تسجيل FCM:", err);
    toast.info("⚠️ لم يتم تفعيل الإشعارات (اختياري)");
    return null;
  }
}
