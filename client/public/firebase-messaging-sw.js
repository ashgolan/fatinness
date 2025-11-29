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
  const appName = payload.data.appName || "Fatinness Studio";
  const title = payload.data.title || "";
  const body = payload.data.body || "";
  const icon = payload.data.icon || "/logo192x192.png";

  const finalTitle = appName; // ← يظهر كعنوان رئيسي
  const finalBody = `${ " 🔥 " + title}\n${body}`; // ← تحت الاسم مباشرة

  self.registration.showNotification(finalTitle, {
    body: finalBody,
    icon,
    badge: icon,
    data: { url: payload.data.url },
  });
});

