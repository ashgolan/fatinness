import Booking from "../models/Booking.js";
import admin from "../utils/fcm.js"; // أو firebaseAdmin عندك

export const internalSendBookingReminder = async (req, res) => {
    try {
        const { bookingId, userFcmToken, secret } = req.body;
        console.log("🚀 REMINDER REQUEST RECEIVED", req.body);

        // 🔐 حماية
        if (secret !== process.env.REMINDER_SECRET) {
            return res.status(401).json({ error: "UNAUTHORIZED" });
        }
        console.log("🔐 SECRET OK");

        if (!bookingId || !userFcmToken) {
            return res.status(400).json({ error: "Missing fields" });
        }

        const booking = await Booking.findById(bookingId).populate("slot");
        console.log("📘 BOOKING FOUND", {
            exists: !!booking,
            status: booking?.status,
        });

        if (!booking) {
            console.log("⛔ Booking not found – reminder skipped");
            return res.json({ skipped: true, reason: "BOOKING_NOT_FOUND" });
        }
        
        if (booking.status !== "booked") {
            console.log("⛔ Booking cancelled – reminder skipped");
            return res.json({ skipped: true, reason: "BOOKING_CANCELLED" });
        }
        console.log("🏋️ SLOT CHECK", {
            exists: !!booking?.slot,
            isDeleted: booking?.slot?.isDeleted,
            startAt: booking?.slot?.startAt,
        });
        
        if (
            !booking.slot ||
            booking.slot.isDeleted === true ||
            booking.slot.status === "cancelled"
        ) {
            console.log("⛔ Slot cancelled – reminder skipped");
            return res.json({ skipped: true, reason: "SLOT_CANCELLED" });
        }
console.log("📤 SENDING REMINDER NOW");

        // 🔔 إرسال الإشعار
        await admin.messaging().send({
            token: userFcmToken,
            data: {
                type: "BOOKING_REMINDER",
                title: "⏰ תזכורת לאימון",
                body: "נותרו שעתיים עד לאימון שלך 💪",
            },
            notification: {
                title: "⏰ תזכורת לאימון",
                body: "נותרו שעתיים עד לאימון שלך 💪",
            },
        });

        console.log("✅ Reminder sent", bookingId);
        return res.json({ ok: true });
    } catch (err) {
        console.error("❌ internalSendBookingReminder failed", err);
        return res.status(500).json({ error: "FAILED" });
    }
};
