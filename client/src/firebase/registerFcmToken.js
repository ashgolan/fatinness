// 📁 client/src/firebase/registerFcmToken.js
import { getToken } from "firebase/messaging";
import { messaging } from "./config";
import { Api } from "../api/Api";
import { toast } from "react-toastify";

export const registerFcmToken = async () => {
  try {
    const token = await getToken(messaging, {
      vapidKey: "YOUR_PUBLIC_VAPID_KEY", // 🔹 من إعدادات مشروعك في Firebase Cloud Messaging
    });

    if (token) {
      await Api.post("/users/fcm", { token });
      console.log("✅ FCM Token Registered:", token);
    } else {
      console.warn("⚠️ لم يتم الحصول على رمز FCM");
    }
  } catch (err) {
    console.error("❌ خطأ في تسجيل FCM Token:", err);
    toast.error("تعذر تفعيل الإشعارات على هذا الجهاز.");
  }
};
