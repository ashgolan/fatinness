import { getMessaging, getToken } from "firebase/messaging";
import { app } from "./config";
import { Api } from "../api/Api";
import { toast } from "react-toastify";

export async function registerFcmToken() {
  try {
    const messaging = getMessaging(app);

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("🔇 إشعارات FCM مرفوضة من المستخدم");
      return null;
    }

    const fcmToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    if (!fcmToken) {
      console.warn("⚠️ لم يتم الحصول على FCM token");
      return null;
    }

    // 🔹 أرسل التوكن إلى السيرفر لربطه بالمستخدم
    await Api.post("/users/register-fcm", { token: fcmToken });
    console.log("✅ تم تسجيل FCM Token بنجاح:", fcmToken);
    return fcmToken;
  } catch (err) {
    console.error("❌ خطأ أثناء تسجيل FCM:", err.message);
    // ⚠️ لا نرمي الخطأ للخارج حتى لا يُكسر الـ login flow
    toast.info("⚠️ لم يتم تفعيل الإشعارات (اختياري)");
    return null;
  }
}
