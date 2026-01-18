import { initializeApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, "us-central1");

export const scheduleBookingReminderCall = httpsCallable(
  functions,
  "scheduleBookingReminder"
);
