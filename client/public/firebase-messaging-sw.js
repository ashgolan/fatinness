/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */

importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCyoxmVKLzHdgibJ0GXhk5JMevenP8_vAY",
  authDomain: "fateness-364c3.firebaseapp.com",
  projectId: "fateness-364c3",
  storageBucket: "fateness-364c3.appspot.com",
  messagingSenderId: "282672405307",
  appId: "1:282672405307:web:1a52b192177662997d351e",
  measurementId: "G-EEGVQVCRH8",
});

const messaging = firebase.messaging();

/*
  🟢 قاعدة مهمة:
  - نتجاهل أي إشعار فيه notification لأن FCM سيعرضه (ويظهر حرف F)
  - نعرض نحن فقط إشعارات Data لنعرض معها الأيقونة الخاصة بنا
*/

messaging.onBackgroundMessage((payload) => {
  // ❌ إذا فيها notification → تجاهل كي لا يظهر حرف F
  if (payload.notification) {
    return;
  }

  // ✔ Data Only → نحن نعرض الإشعار مع الأيقونة الصحيحة
  const notificationTitle = payload.data?.title || "Fatinness Studio";
  const notificationBody = payload.data?.body || "";
  const icon = payload.data?.icon || "/icons/logo192.png";

  self.registration.showNotification(notificationTitle, {
    body: notificationBody,
    icon: icon,
    badge: icon,        // مهم للمتصفحات لتثبيت الصورة بدلاً من حرف F
    data: { url: payload.data?.url || "/" },
  });
});

// فتح رابط عند الضغط
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
