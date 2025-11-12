/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */

// ✅ firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCyoxmVKLzHdgibJ0GXhk5JMevenP8_vAY",
  authDomain: "fateness-364c3.firebaseapp.com",
  projectId: "fateness-364c3",
  storageBucket: "fateness-364c3.appspot.com", // ✅ للـ FCM
  messagingSenderId: "282672405307",
  appId: "1:282672405307:web:1a52b192177662997d351e",
  measurementId: "G-EEGVQVCRH8",
});

const messaging = firebase.messaging();

// إشعار الخلفية
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "إشعار", {
    body: body || "",
    icon: "/logo192.png",
    // رابط يفتح عند النقر (اختياري لكنه مفيد)
    data: { url: "/" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
