import { pubsub, https } from "firebase-functions/v1";
import admin from "firebase-admin";
import { DateTime } from "luxon";
import { CloudTasksClient } from "@google-cloud/tasks";

// =====================================
// 🔧 تهيئة Firebase Admin (مرة واحدة فقط)
// =====================================
admin.initializeApp();

// =====================================
// 🔧 Cloud Tasks Client (مرة واحدة فقط)
// =====================================
const tasksClient = new CloudTasksClient();

// =====================================
// 🔔 اختبار حياة Cloud Scheduler (اختياري)
// =====================================
export const pingScheduler = pubsub
  .schedule("* * * * *") // كل دقيقة
  .timeZone("UTC")
  .onRun(() => {
    console.log("⏱ Firebase Scheduler alive:", DateTime.utc().toISO());
    return null;
  });

// =====================================
// 🔔 إنشاء مهمة تذكير قبل ساعتين
// =====================================
export const scheduleBookingReminder = https.onRequest(async (req, res) => {
  try {
    const { bookingId, userFcmToken, startAt } = req.body;

    if (!bookingId || !userFcmToken || !startAt) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // ⏱️ حساب وقت التذكير (UTC صريح)
    const reminderAt = DateTime
      .fromISO(startAt, { zone: "utc" })
      .minus({ hours: 2 })
      .toUTC();

    // إذا فات وقت التذكير لا ننشئ Task
    if (reminderAt <= DateTime.utc()) {
      return res.json({
        skipped: true,
        reason: "reminder time passed",
        reminderAt: reminderAt.toISO(),
      });
    }

    // ⚠️ المتغير الصحيح داخل Firebase Functions
    const project = process.env.GCLOUD_PROJECT;
    const location = "us-central1";
    const queue = "booking-reminders";

    const parent = tasksClient.queuePath(project, location, queue);

    // اسم task فريد لمنع التكرار
    const taskId = `booking-${bookingId}-reminder`;
    const taskName = tasksClient.taskPath(project, location, queue, taskId);

    const task = {
      name: taskName,
      httpRequest: {
        httpMethod: "POST",
        url: `https://us-central1-${project}.cloudfunctions.net/sendBookingReminder`,
        headers: {
          "Content-Type": "application/json",
        },
        body: Buffer.from(
          JSON.stringify({ bookingId, userFcmToken, startAt })
        ).toString("base64"),
      },
      scheduleTime: {
        seconds: Math.floor(reminderAt.toSeconds()),
      },
    };

    await tasksClient.createTask({ parent, task });

    return res.json({
      ok: true,
      bookingId,
      reminderAt: reminderAt.toISO(),
    });
  } catch (err) {
    // task موجود مسبقًا (idempotency)
    if (err.code === 6) {
      return res.json({ ok: true, duplicated: true });
    }

    console.error("❌ scheduleBookingReminder error:", err);
    return res.status(500).json({ error: "Failed to schedule reminder" });
  }
});

// =====================================
// 🔔 إرسال إشعار FCM عند تنفيذ المهمة
// =====================================
export const sendBookingReminder = https.onRequest(async (req, res) => {
  try {
    const { bookingId, userFcmToken, startAt } = req.body;

    if (!userFcmToken) {
      return res.status(400).json({ error: "Missing FCM token" });
    }

    await admin.messaging().send({
      token: userFcmToken,
      notification: {
        title: "⏰ تذكير بالحصة",
        body: "تبقّى ساعتان على حصتك، نراك قريبًا 💪",
      },
      data: {
        bookingId: bookingId || "",
        startAt: startAt || "",
      },
    });

    return res.json({ sent: true });
  } catch (err) {
    console.error("❌ sendBookingReminder error:", err);
    return res.status(500).json({ error: "Failed to send FCM" });
  }
});
