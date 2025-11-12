import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app } from "./config";
import { Api } from "../api/Api";
import { toast } from "react-toastify";

export async function registerFcmToken() {
  try {
    console.log("🚀 بدء عملية تسجيل FCM Token...");

    // ✅ تحقق أن Firebase Messaging مدعوم
    const supported = await isSupported();
    if (!supported) {
      console.warn("⚠️ المتصفح لا يدعم Firebase Messaging");
      toast.info("جهازك لا يدعم الإشعارات.");
      return null;
    }

    // ✅ تهيئة Messaging
    const messaging = getMessaging(app);
    console.log("✅ تم تهيئة Firebase Messaging");

    // ✅ طلب الإذن
    const permission = await Notification.requestPermission();
    console.log("📜 حالة الإذن:", permission);

    if (permission !== "granted") {
      toast.info("⚠️ لم يتم منح الإذن للإشعارات (اختياري)");
      return null;
    }

    // ✅ الحصول على التوكن
    console.log("🔄 جارٍ توليد FCM Token...");
    const fcmToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready, // ⚠️ هذا مهم جدًا للموبايل
    });

    if (!fcmToken) {
      console.warn("⚠️ لم يتم توليد FCM Token");
      return null;
    }

    console.log("🎯 تم الحصول على FCM Token:", fcmToken);

    // ✅ إرسال التوكن للسيرفر
    console.log("📤 إرسال التوكن إلى السيرفر...");
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
