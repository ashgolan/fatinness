import { pubsub, https } from "firebase-functions/v1";
import admin from "firebase-admin";
import { DateTime } from "luxon";
import { CloudTasksClient } from "@google-cloud/tasks";
import { defineString } from "firebase-functions/params";

// =====================================
// 🔧 Firebase Admin (مرة واحدة فقط)
// =====================================
admin.initializeApp();

// =====================================
// 🔧 Cloud Tasks Client
// =====================================
const tasksClient = new CloudTasksClient();

// =====================================
// 🔐 Runtime Params (حل دائم)
// =====================================
const apiUrl = "https://api.fatinness.cloud";

export const REMINDER_SECRET = defineString("REMINDER_SECRET");


// =====================================
// 🔔 Ping Scheduler (اختياري)
// =====================================
export const pingScheduler = pubsub
    .schedule("* * * * *")
    .timeZone("UTC")
    .onRun(() => {
        console.log("⏱ Firebase Scheduler alive:", DateTime.utc().toISO());
        return null;
    });

// =====================================
// 🔔 إنشاء Cloud Task للتذكير
// =====================================
export const scheduleBookingReminder = https.onRequest(async (req, res) => {
    console.log("🚀 scheduleBookingReminder called", req.body);

    try {
        const { bookingId, userFcmToken, startAt } = req.body;

        if (!bookingId || !startAt) {
            return res.status(400).json({ error: "Missing fields" });
        }

        // ⏱️ حساب وقت التذكير (UTC)
        const reminderAt = DateTime
            .fromISO(startAt, { zone: "utc" })
            .minus({ hours: 2 })
            .toUTC();

        // ⛔ إذا فات وقت التذكير
        if (reminderAt <= DateTime.utc()) {
            return res.json({
                skipped: true,
                reason: "REMINDER_TIME_PASSED",
                reminderAt: reminderAt.toISO(),
            });
        }

        // 📍 Cloud Tasks config
        const project = process.env.GCLOUD_PROJECT;
        const location = "us-central1";
        const queue = "booking-reminders";

        const parent = tasksClient.queuePath(project, location, queue);

        // 🆔 Task ID ثابت (idempotent)
        const taskId = `booking-${bookingId}-reminder`;
        const taskName = tasksClient.taskPath(project, location, queue, taskId);

        // 🔐 Params (الدائم)
        const secret = REMINDER_SECRET.value();

        const task = {
            name: taskName,
            httpRequest: {
                httpMethod: "POST",
                url: `${apiUrl}/internal/send-booking-reminder`,
                headers: {
                    "Content-Type": "application/json",
                },
                body: Buffer.from(
                    JSON.stringify({
                        bookingId,
                        userFcmToken,
                        secret,
                    })
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
        // 🔁 Task موجود مسبقًا
        if (err.code === 6) {
            return res.json({ ok: true, duplicated: true });
        }

        console.error("❌ scheduleBookingReminder error:", err);
        return res.status(500).json({ error: "FAILED_TO_SCHEDULE_REMINDER" });
    }
});


// =====================================
// 🔔 إرسال إشعار FCM عند تنفيذ المهمة
// =====================================
// export const sendBookingReminder = https.onRequest(async (req, res) => {
//     try {

//         const { userFcmToken } = req.body;



//         await admin.messaging().send({
//             token: userFcmToken,

//             // 🟢 يعمل عندما التطبيق مفتوح
//             data: {
//                 type: "BOOKING_REMINDER",
//                 title: "⏰ תזכורת לאימון",
//                 body: "נותרו שעתיים עד לאימון שלך 💪",
//             },

//             // 🟢 يعمل عندما التطبيق مغلق
//             notification: {
//                 title: "⏰ תזכורת לאימון",
//                 body: "נותרו שעתיים עד לאימון שלך 💪",
//             },
//         });


//         res.status(200).json({ ok: true });
//     } catch (e) {
//         console.error("❌ sendBookingReminder failed", e);
//         res.status(500).json({ error: "FCM failed" });
//     }
// });
