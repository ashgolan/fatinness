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
  console.log("[SW] Received:", payload);

  // لا نسمح أبداً بإشعارات notification
  if (payload.notification) return;

  const data = payload.data || {};

  const notificationTitle = data.title || "Fatinness Studio";
  const notificationBody = data.body || "";
  const icon = data.icon || "/logo192x192.png";
  const url = data.url || "/";

  self.registration.showNotification(notificationTitle, {
    body: notificationBody,
    icon,
    badge: icon,
    data: { url },
  });
});


// فتح رابط عند الضغط
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
