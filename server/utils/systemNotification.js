import UserNotification from "../models/UserNotification.js";

export async function createSystemNotification({
  userId,
  title,
  body,
  targetType = "all",
  targetSlot = null,
}) {
  try {
    await UserNotification.create({
      user: userId,
      title,
      body,
      type: "system",
      targetType,
      targetSlot,
    });
  } catch (err) {
    console.error("❌ Failed to create system notification:", err.message);
  }
}
