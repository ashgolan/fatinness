import { pubsub, https } from "firebase-functions/v1";
import admin from "firebase-admin";
import { DateTime } from "luxon";
import { CloudTasksClient } from "@google-cloud/tasks";

// =====================================
// 🔧 Firebase Admin (مرة واحدة فقط)
// =====================================
admin.initializeApp();

// =====================================
// 🔧 Cloud Tasks Client
// =====================================
const tasksClient = new CloudTasksClient();

// =====================================
// 🔔 Ping Scheduler (اختياري)
// =====================================
export const pingScheduler = pubsub
    .schedule("* * * * *")
    .timeZone("UTC")
    .onRun(() => {
        console.log("⏱ Scheduler alive:", DateTime.utc().toISO());
        return null;
    });

// =====================================
// 🔔 إنشاء تذكير قبل ساعتين (HTTP + Secret)
// =====================================
export const scheduleBookingReminder = https.onRequest(async (req, res) => {
    try {
        // 🔐 حماية داخلية
       

        const { bookingId, userFcmToken, startAt } = req.body;

        if (!bookingId || !startAt || !userFcmToken) {
            return res.status(400).json({ error: "Missing fields" });
        }

        // ⏱️ حساب وقت التذكير (UTC)
        const reminderAt = DateTime
            .fromISO(startAt, { zone: "utc" })
            .minus({ hours: 2 })
            .toUTC();

        if (reminderAt <= DateTime.utc()) {
            return res.json({
                skipped: true,
                reason: "reminder time passed",
                reminderAt: reminderAt.toISO(),
            });
        }

        const project = process.env.GCLOUD_PROJECT;
        const location = "us-central1";
        const queue = "booking-reminders";

        const parent = tasksClient.queuePath(project, location, queue);

        const taskId = `booking-${bookingId}-reminder`;
        const taskName = tasksClient.taskPath(project, location, queue, taskId);

        const task = {
            name: taskName,
            httpRequest: {
                httpMethod: "POST",
                url: `https://us-central1-${project}.cloudfunctions.net/sendBookingReminder`,
                headers: {
                    "Content-Type": "application/json",
                    "x-internal-secret": process.env.INTERNAL_TASK_SECRET,
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
        if (err.code === 6) {
            return res.json({ ok: true, duplicated: true });
        }

        console.error("❌ scheduleBookingReminder error:", err);
        return res.status(500).json({ error: "Failed to schedule reminder" });
    }
});

// =====================================
// 🔔 إرسال إشعار FCM (محمي بالـ Secret)
// =====================================
export const sendBookingReminder = https.onRequest(async (req, res) => {
    try {
        // 🔐 تحقق من السر الداخلي
        const secret = req.headers["x-internal-secret"];

        if (secret !== process.env.INTERNAL_TASK_SECRET) {
            console.error("❌ Invalid internal secret");
            return res.status(403).json({ error: "Forbidden" });
        }

        const { userFcmToken } = req.body;

        if (!userFcmToken) {
            console.warn("⚠️ sendBookingReminder called without FCM token");
            return res.status(200).json({ skipped: true });
        }

        await admin.messaging().send({
            token: userFcmToken,

            // 🟢 يعمل عندما التطبيق مفتوح
            data: {
                type: "BOOKING_REMINDER",
                title: "⏰ תזכורת לאימון",
                body: "נותרו שעתיים עד לאימון שלך 💪",
            },

            // 🟢 يعمل عندما التطبيق مغلق
            notification: {
                title: "⏰ תזכורת לאימון",
                body: "נותרו שעתיים עד לאימון שלך 💪",
            },
        });

        return res.status(200).json({ ok: true });
    } catch (e) {
        console.error("❌ sendBookingReminder failed", e);
        return res.status(500).json({ error: "FCM failed" });
    }
});
