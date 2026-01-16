import { CloudTasksClient } from "@google-cloud/tasks";

const client = new CloudTasksClient();

const PROJECT_ID = "fateness-364c3";
const LOCATION = "us-central1";
const QUEUE = "booking-reminders";

export async function createBookingReminderTask({
  bookingId,
  userFcmToken,
  startAt,
}) {
  const reminderAt = new Date(
    Date.parse(startAt) - 2 * 60 * 60 * 1000
  );

  const parent = client.queuePath(PROJECT_ID, LOCATION, QUEUE);

  const task = {
    httpRequest: {
      httpMethod: "POST",
      url: `https://us-central1-${PROJECT_ID}.cloudfunctions.net/sendBookingReminder`,
      headers: {
        "Content-Type": "application/json",
      },
      body: Buffer.from(
        JSON.stringify({
          bookingId,
          userFcmToken,
          startAt,
        })
      ).toString("base64"),
    },
    scheduleTime: {
      seconds: Math.floor(reminderAt.getTime() / 1000),
    },
  };

  await client.createTask({ parent, task });

  console.log("⏰ Cloud Task created for booking:", bookingId);
}
