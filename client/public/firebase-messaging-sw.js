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
  🟢 القاعدة الذهبية:
  إذا كانت الرسالة تحتوي على notification جاهز → FCM سيعرضه وحده → لا نعرض إشعار إضافي
  إذا كانت Data Only → نحن فقط نعرض الإشعار
*/

messaging.onBackgroundMessage((payload) => {
  // إذا كان الإشعار يحتوي على notification → FCM يعرضه تلقائياً
  if (payload.notification) {
    return; // ⛔️ إلغاء الإشعار المكرر
  }

  // 🟡 إشعارات Data فقط → نعرضها يدويًا
  const notificationTitle = payload.data?.title || "Fatinness Studio";
  const notificationBody = payload.data?.body || "";
  const icon = payload.data?.icon || "/logo192.png";

  self.registration.showNotification(notificationTitle, {
    body: notificationBody,
    icon: icon,
    data: { url: payload.data?.url || "/" },
  });
});

// فتح رابط عند الضغط على الإشعار
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
