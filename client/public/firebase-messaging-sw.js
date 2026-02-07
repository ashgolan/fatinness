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
  ✔ إشعارات Notification فقط يتم عرضها تلقائياً من النظام
  ✔ لا نحتاج لعرض إشعار يدوي هنا
  ✔ لكن نحتاج دعم الضغط على الإشعار فقط
*/

messaging.onBackgroundMessage((payload) => {
  console.log("📩 Background message received:", payload);

  const title = payload.data?.title || "⏰ תזכורת";

  const options = {
    body: payload.data?.body || "",
    icon: "/logo192x192.png",
    data: {
      url: payload.data?.url || "/",
    },
  };

  self.registration.showNotification(title, options);
});



/* فتح الرابط عند الضغط */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification?.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // إذا هناك نافذة مفتوحة → نستخدمها
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      // وإلا → افتح صفحة جديدة
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
