// 📁 client/src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getMessaging } from "firebase/messaging"; // ✅ أضف هذه

const firebaseConfig = {
  apiKey: "AIzaSyCyoxmVKLzHdgibJ0GXhk5JMevenP8_vAY",
  authDomain: "fateness-364c3.firebaseapp.com",
  projectId: "fateness-364c3",
  storageBucket: "fateness-364c3.firebasestorage.app",
  messagingSenderId: "282672405307",
  appId: "1:282672405307:web:1a52b192177662997d351e",
  measurementId: "G-EEGVQVCRH8",
};

const app = initializeApp(firebaseConfig);

// ✅ Analytics فقط في المتصفح
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((yes) => {
    if (yes) analytics = getAnalytics(app);
  });
}

// ✅ الخدمات المطلوبة
export const storage = getStorage(app);
export const auth = getAuth(app);
export const messaging = getMessaging(app); // ✅ أضف هذه السطر

export { app, analytics };
