import { google } from 'googleapis';

export function getOAuthClient(user) {
  if (!user.google || !user.google.accessToken || !user.google.refreshToken) {
    throw new Error('User has not connected Google Calendar');
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  oauth2Client.setCredentials({
    access_token: user.google.accessToken,
    refresh_token: user.google.refreshToken,
  });

  return oauth2Client;
}

export async function createGoogleEvent(user, booking) {
  try {
    const oauth2Client = getOAuthClient(user);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const start = new Date(booking.slot.date);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const event = {
      summary: '🏋️‍♀️ Fitness Studio Session',
      description: 'Your booked training session.',
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 120 }],
      },
    };

    const result = await calendar.events.insert({ calendarId: 'primary', resource: event });
    return result.data.id;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return null;
  }
}

export async function deleteGoogleEvent(user, eventId) {
  try {
    const oauth2Client = getOAuthClient(user);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    await calendar.events.delete({ calendarId: 'primary', eventId });
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
  }
}
