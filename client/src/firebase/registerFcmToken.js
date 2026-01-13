import { getMessaging, onMessage, getToken, isSupported } from "firebase/messaging";
import { app } from "./config";
import { Api } from "../api/Api";
import { toast } from "react-toastify";
import i18n from "i18next";

export async function registerFcmToken({ silent = false } = {}) {
  try {
    // 1️⃣ دعم المتصفح
    if (!(await isSupported())) return null;
    if (!("Notification" in window)) return null;
    if (!navigator.serviceWorker) return null;

    // 2️⃣ طلب الإذن (لو مرفوض لا نكرر)
    if (Notification.permission === "denied") {
      if (!silent) toast.info(i18n.t("fcm.permission_denied"));
      return null;
    }

    if (Notification.permission !== "granted") {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        if (!silent) toast.info(i18n.t("fcm.permission_denied"));
        return null;
      }
    }

    // 3️⃣ تسجيل SW (مرة واحدة)
    const registration =
      (await navigator.serviceWorker.getRegistration("/")) ||
      (await navigator.serviceWorker.register("/firebase-messaging-sw.js"));

    // 4️⃣ FCM Token
    const messaging = getMessaging(app);
    const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error("❌ Missing VAPID key");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) return null;

    // 5️⃣ إرسال للسيرفر
    await Api.post("/users/fcm", { fcmToken: token });

    if (!silent) {
      setTimeout(() => {
        toast.success(i18n.t("fcm.success"));
      }, 300);
    }

    return token;
  } catch (err) {
    console.error("❌ FCM error:", err);
    if (!silent) toast.error(i18n.t("fcm.error"));
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
      toast.error(i18n.t("fcm.error"));
      return;
    }

    await Api.post("/users/fcm/transfer", { fcmToken: token });

    toast.success(i18n.t("fcm.transferred"));
  } catch (err) {
    console.error(err);
    toast.error(i18n.t("fcm.error"));
  }
}


export async function checkFcmOwnership() {
  try {
    // 1️⃣ تحقق من دعم الإشعارات
    if (!(await isSupported())) return { hasToken: false };
    if (!("Notification" in window)) return { hasToken: false };
    if (!navigator.serviceWorker) return { hasToken: false };

    // 2️⃣ لو لم يُمنح الإذن أصلاً
    if (Notification.permission !== "granted") {
      return { hasToken: false };
    }

    // 3️⃣ الحصول على Service Worker
    const registration =
      (await navigator.serviceWorker.getRegistration("/")) ||
      (await navigator.serviceWorker.register("/firebase-messaging-sw.js"));

    // 4️⃣ الحصول على token الحالي من الجهاز
    const messaging = getMessaging(app);
    const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;

    if (!vapidKey) return { hasToken: false };

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) return { hasToken: false };

    // 5️⃣ إرسال token للسيرفر (فحص فقط)
    const { data } = await Api.post("/users/fcm/check", {
      fcmToken: token,
    });

    // السيرفر يجب أن يعيد:
    // { hasToken: true, ownedByCurrentUser: true/false }

    return data;
  } catch (err) {
    console.warn("FCM ownership check failed");
    return { hasToken: false };
  }
}

const messaging = getMessaging(app);

onMessage(messaging, (payload) => {
  console.log("📩 FCM foreground message:", payload);

  if (payload?.notification?.title) {
    const isDark = document.body.classList.contains("dark");

    toast.info(
      <div style={{ textAlign: "start", lineHeight: "1.2" }}>
        <span style={{ fontWeight: 700, color: isDark ? "#fbbf24" : "#7c3aed" }}>
          🔔 {payload.notification.title}
        </span>
        <br />
        <span>:</span>
        <br />
        <span>:</span>
        <br />
        <span style={{ color: isDark ? "#eee" : "#333" }}>
          {payload.notification.body || ""}
        </span>
      </div>
    );

  }
});
