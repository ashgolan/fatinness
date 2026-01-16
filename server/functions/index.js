import { pubsub } from "firebase-functions/v1";
import admin from "firebase-admin";
import { DateTime } from "luxon";
import { https } from "firebase-functions/v1";
import { CloudTasksClient } from "@google-cloud/tasks";


admin.initializeApp();

// 🔔 اختبار حياة Cloud Scheduler
export const pingScheduler = pubsub
    .schedule("* * * * *") // كل دقيقة
    .timeZone("UTC")
    .onRun(() => {
        console.log("⏱ Firebase Scheduler alive:", DateTime.utc().toISO());
        return null;
    });



// 🔔 إنشاء مهمة تذكير قبل ساعتين

const client = new CloudTasksClient();


admin.initializeApp();

const tasksClient = new CloudTasksClient();

export const scheduleBookingReminder = https.onRequest(async (req, res) => {
    try {
        const { bookingId, userFcmToken, startAt } = req.body;

        if (!bookingId || !userFcmToken || !startAt) {
            return res.status(400).json({ error: "Missing fields" });
        }

        // ⏱️ احسب وقت التذكير (UTC صريح)
        const reminderAt = DateTime
            .fromISO(startAt, { zone: "utc" })
            .minus({ hours: 2 })
            .toUTC();

        // لو الوقت فات، لا ننشئ Task
        if (reminderAt <= DateTime.utc()) {
            return res.json({ skipped: true, reason: "reminder time passed" });
        }

        const project = process.env.GCP_PROJECT;
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
                headers: { "Content-Type": "application/json" },
                body: Buffer.from(
                    JSON.stringify({ bookingId, userFcmToken, startAt })
                ).toString("base64"),
            },
            scheduleTime: {
                seconds: reminderAt.toSeconds(),
            },
        };

        await tasksClient.createTask({ parent, task });

        return res.json({
            ok: true,
            bookingId,
            reminderAt: reminderAt.toISO(),
        });
    } catch (err) {
        // لو كان التذكير موجود مسبقًا (idempotency)
        if (err.code === 6) {
            return res.json({ ok: true, duplicated: true });
        }

        console.error("❌ scheduleBookingReminder error:", err);
        return res.status(500).json({ error: "Failed to schedule reminder" });
    }
});

export const sendBookingReminder = https.onRequest(async (req, res) => {
    try {
        const { bookingId, userFcmToken, startAt } = req.body;

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

        res.json({ sent: true });
    } catch (err) {
        console.error("❌ sendBookingReminder error:", err);
        res.status(500).json({ error: "Failed to send FCM" });
    }
});
