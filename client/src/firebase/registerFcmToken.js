import { getMessaging, onMessage, getToken, isSupported } from "firebase/messaging";
import { app } from "./config";
import { Api } from "../api/Api";
import { toast } from "react-toastify";
import i18n from "i18next";

let retryTimer = null;

export async function registerFcmToken({ silent = false } = {}) {
  try {
    // 1️⃣ دعم المتصفح
    if (!(await isSupported())) return null;
    if (!("Notification" in window)) return null;
    if (!navigator.serviceWorker) return null;

    // 2️⃣ الإذن
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

    // 3️⃣ Service Worker (والانتظار حتى يصبح active)
    let registration =
      (await navigator.serviceWorker.getRegistration("/")) ||
      (await navigator.serviceWorker.register("/firebase-messaging-sw.js"));

    if (!registration.active) {
      await new Promise((resolve) => {
        const sw = registration.installing || registration.waiting;
        if (!sw) return resolve();

        sw.addEventListener("statechange", () => {
          if (sw.state === "activated") resolve();
        });
      });
    }

    // 4️⃣ FCM Token
    const messaging = getMessaging(app);
    const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
    if (!vapidKey) return null;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) throw new Error("FCM_TOKEN_NOT_READY");

    // 5️⃣ إرسال للسيرفر
    await Api.post("/users/fcm", { fcmToken: token });

    if (!silent) {
      toast.success(i18n.t("fcm.success"));
    }

    return token;
  } catch (err) {
    console.log("FCM not ready yet:", err?.message);

    // 🔁 Retry ذكي (مرة واحدة)
    if (!retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        registerFcmToken({ silent: true });
      }, 60000); // بعد دقيقة
    }

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

  if (!payload?.notification?.title) return;

  const isDark = document.body.classList.contains("dark");

  toast.info(
    <div style={{ textAlign: "start", lineHeight: "1.4" }}>
      <div
        style={{
          fontWeight: 700,
          marginBottom: 4,
          color: isDark ? "#fbbf24" : "#7c3aed",
        }}
      >
        🔔 {payload.notification.title}
      </div>

      <div style={{ color: isDark ? "#eee" : "#333" }}>
        {payload.notification.body || ""}
      </div>
    </div>,
    {
      containerId: "fcm",   // 🔥 المفتاح
      autoClose: false,
      closeButton: true,
    }
  );
});
