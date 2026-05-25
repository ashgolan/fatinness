import AdmZip from "adm-zip";
import nodemailer from "nodemailer";
import { DateTime } from "luxon";
import { ZONE } from "../utils/time.js";

import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Slot from "../models/Slot.js";
import Setting from "../models/Setting.js";
import Notification from "../models/Notification.js";
import UserNotification from "../models/UserNotification.js";
import WeekTemplate from "../models/WeekTemplate.js";
import GalleryImage from "../models/GalleryImage.js";
import Payment from "../models/Payment.js";

const COLLECTIONS = [
    { name: "users", Model: User },
    { name: "bookings", Model: Booking },
    { name: "slots", Model: Slot },
    { name: "settings", Model: Setting },
    { name: "notifications", Model: Notification },
    { name: "userNotifications", Model: UserNotification },
    { name: "weekTemplates", Model: WeekTemplate },
    { name: "payments", Model: Payment },
    { name: "galleryImages", Model: GalleryImage },

];

// ─── Create ZIP buffer ─────────────────────────────────────────
export async function createBackupZip() {
    const zip = new AdmZip();

    const meta = {
        createdAt: new Date().toISOString(),
        version: "1.0",
        app: "Fatinness",
        collections: COLLECTIONS.map(c => c.name),
    };
    zip.addFile("meta.json", Buffer.from(JSON.stringify(meta, null, 2)));

    for (const { name, Model } of COLLECTIONS) {
        const data = await Model.find().lean();
        zip.addFile(`${name}.json`, Buffer.from(JSON.stringify(data, null, 2)));
    }

    return zip.toBuffer();
}

// ─── Send backup email ─────────────────────────────────────────
export async function sendBackupEmail() {
    try {
        const zipBuffer = await createBackupZip();

        const date = DateTime.now().setZone(ZONE).toFormat("dd/MM/yyyy HH:mm");

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.BACKUP_EMAIL_USER,
                pass: process.env.BACKUP_EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"Fatinness Backup" <${process.env.BACKUP_EMAIL_USER}>`,
            to: process.env.BACKUP_EMAIL_TO || process.env.BACKUP_EMAIL_USER,
            subject: `💾 גיבוי אוטומטי — Fatinness | ${date}`,
            html: `
        <div dir="rtl" style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
          <h2 style="color:#9B6FD6;">💪 Fatinness Studio</h2>
          <p>גיבוי אוטומטי מתאריך ${date}</p>
          <p style="color:#6b7280;font-size:12px;">הקובץ המצורף מכיל את כל נתוני המערכת.</p>
        </div>
      `,
            attachments: [{
                filename: `fatinness-backup-${new Date().toISOString().split("T")[0]}.zip`,
                content: zipBuffer,
                contentType: "application/zip",
            }],
        });

        console.log("✅ Backup email sent");
        return true;
    } catch (err) {
        console.error("❌ Backup failed:", err.message);
        return false;
    }
}

// ─── For manual download ───────────────────────────────────────
export async function buildBackupZip() {
    const label = DateTime.now().setZone(ZONE).toFormat("yyyy-MM-dd_HH-mm");
    const zipBuffer = await createBackupZip();
    return { zipBuffer, label };
}

// ─── For runBackup (called from scheduler) ─────────────────────
export async function runBackup() {
    const label = DateTime.now().setZone(ZONE).toFormat("yyyy-MM-dd_HH-mm");
    const success = await sendBackupEmail();
    return { label, success };
}