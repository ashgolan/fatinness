// client/src/firebase/config.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// ✅ نمنع تشغيل Analytics على السيرفر أو بيئات بدون نافذة
import { getAnalytics, isSupported } from "firebase/analytics";

// 🔹 إعدادات Firebase (من واجهة Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyCyoxmVKLzHdgibJ0GXhk5JMevenP8_vAY",
  authDomain: "fateness-364c3.firebaseapp.com",
  projectId: "fateness-364c3",
storageBucket: "fateness-364c3.appspot.com",
  messagingSenderId: "282672405307",
  appId: "1:282672405307:web:1a52b192177662997d351e",
  measurementId: "G-EEGVQVCRH8",
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Analytics فقط في المتصفح وليس في SSR/Node
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((yes) => {
    if (yes) analytics = getAnalytics(app);
  });
}

// ✅ خدمات Firebase التي تحتاجها في الواجهة
export const storage = getStorage(app);
export const auth = getAuth(app);

export { app, analytics };
