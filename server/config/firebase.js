// server/config/firebase.js
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!serviceAccountPath) {
  console.error("❌ FIREBASE_SERVICE_ACCOUNT_PATH is missing in .env");
} else {
  const absolutePath = path.resolve(serviceAccountPath);

  if (!fs.existsSync(absolutePath)) {
    console.error(
      "❌ Firebase service account file not found:",
      absolutePath
    );
  } else {
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(absolutePath, "utf8")
      );

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log("✅ Firebase Admin initialized successfully (file)");
    }
  }
}

export default admin;
