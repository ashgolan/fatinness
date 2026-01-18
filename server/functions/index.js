import { pubsub, https } from "firebase-functions/v1";
import admin from "firebase-admin";
import { DateTime } from "luxon";
import { CloudTasksClient } from "@google-cloud/tasks";
import { onCall } from "firebase-functions/https";

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
export const scheduleBookingReminder = https.onCall(async (data, context) => {
    try {
        const { bookingId, userFcmToken, startAt } = data;

        if (!bookingId || !startAt || !userFcmToken) {
            throw new https.HttpsError(
                "invalid-argument",
                "Missing fields"
            );
        }

        // ⏱️ حساب وقت التذكير
        const reminderAt = DateTime
            .fromISO(startAt, { zone: "utc" })
            .minus({ hours: 2 })
            .toUTC();

        if (reminderAt <= DateTime.utc()) {
            return {
                skipped: true,
                reason: "reminder time passed",
                reminderAt: reminderAt.toISO(),
            };
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
                headers: { "Content-Type": "application/json" },
                body: Buffer.from(
                    JSON.stringify({ bookingId, userFcmToken, startAt })
                ).toString("base64"),
            },
            scheduleTime: {
                seconds: Math.floor(reminderAt.toSeconds()),
            },
        };

        await tasksClient.createTask({ parent, task });

        return {
            ok: true,
            bookingId,
            reminderAt: reminderAt.toISO(),
        };
    } catch (err) {
        if (err.code === 6) {
            return { ok: true, duplicated: true };
        }

        console.error("❌ scheduleBookingReminder error:", err);
        throw new https.HttpsError("internal", "Failed to schedule reminder");
    }
});

// =====================================
// 🔔 إرسال إشعار FCM عند تنفيذ المهمة
// =====================================
export const sendBookingReminder = https.onRequest(async (req, res) => {
    try {

        const { userFcmToken } = req.body;

        if (!userFcmToken) {
            console.warn("⚠️ sendBookingReminder called without FCM token");
            return res.status(200).json({ skipped: true });
        }

        await admin.messaging().send({
            token: userFcmToken,

            // 🟢 זה יעבוד כשהאפליקציה פתוחה
            data: {
                type: "BOOKING_REMINDER",
                title: "⏰ תזכורת לאימון",
                body: "נותרו שעתיים עד לאימון שלך 💪",
            },

            // 🟢 זה יעבוד כשהאפליקציה סגורה
            notification: {
                title: "⏰ תזכורת לאימון",
                body: "נותרו שעתיים עד לאימון שלך 💪",
            },
        });


        res.status(200).json({ ok: true });
    } catch (e) {
        console.error("❌ sendBookingReminder failed", e);
        res.status(500).json({ error: "FCM failed" });
    }
});
