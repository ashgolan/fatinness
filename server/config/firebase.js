// server/config/firebase.js
import admin from "firebase-admin";

// 🟢 قراءة بيانات الحساب من متغير البيئة في Railway
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// 🟢 تهيئة Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin initialized successfully");
}

export const firebaseAdmin = admin;
