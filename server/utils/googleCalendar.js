import { google } from "googleapis";
import { DateTime } from "luxon";
import { ZONE } from "../utils/time.js";

// =====================================================
// 🔹 OAuth Client
// =====================================================
export function getOAuthClient(user) {
  if (!user.google || !user.google.accessToken || !user.google.refreshToken) {
    throw new Error("User has not connected Google Calendar");
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: user.google.accessToken,
    refresh_token: user.google.refreshToken,
  });

  return oauth2Client;
}

// =====================================================
// 🔹 Create Google Calendar Event
// =====================================================
export async function createGoogleEvent(user, booking) {
  try {
    if (!booking.slot?.startAt || !booking.slot?.endAt) {
      console.warn("⚠️ Missing startAt/endAt — Google event skipped");
      return null;
    }

    const oauth2Client = getOAuthClient(user);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // 🟢 UTC times (source of truth)
    const startUTC = DateTime.fromJSDate(booking.slot.startAt, {
      zone: "utc",
    });
    const endUTC = DateTime.fromJSDate(booking.slot.endAt, {
      zone: "utc",
    });

    // =============================================
    // 🔍 LOGS (مهمة جدًا أثناء الاختبار)
    // =============================================
    console.log("\n========== GOOGLE EVENT ==========");
    console.log("Start UTC:", startUTC.toISO());
    console.log("End UTC  :", endUTC.toISO());
    console.log(
      "Start Local:",
      startUTC.setZone(ZONE).toFormat("yyyy-MM-dd HH:mm")
    );
    console.log(
      "End Local  :",
      endUTC.setZone(ZONE).toFormat("yyyy-MM-dd HH:mm")
    );
    console.log("=================================\n");

    const event = {
      summary: "🏋️‍♀️ Fitness Studio Session",
      description: "Your booked training session.",
      start: {
        dateTime: startUTC.toISO(),
      },
      end: {
        dateTime: endUTC.toISO(),
      },
      reminders: {
        useDefault: false,
        overrides: [{ method: "popup", minutes: 120 }],
      },
    };

    const result = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    return result.data.id;
  } catch (error) {
    console.error("❌ Error creating Google Calendar event:", error.message);
    return null;
  }
}

// =====================================================
// 🔹 Delete Google Calendar Event
// =====================================================
export async function deleteGoogleEvent(user, eventId) {
  try {
    if (!eventId) return;

    const oauth2Client = getOAuthClient(user);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    });
  } catch (error) {
    console.error("❌ Error deleting Google Calendar event:", error.message);
  }
}
