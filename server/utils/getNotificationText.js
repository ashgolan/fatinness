import { NOTIFICATION_MESSAGES } from "./notificationMessages.js";

export function getNotificationText(type, preferredLanguage = "ar") {
  const lang = ["ar", "he", "en"].includes(preferredLanguage)
    ? preferredLanguage
    : "ar";

  return NOTIFICATION_MESSAGES[type]?.[lang]
    || NOTIFICATION_MESSAGES[type]?.ar;
}
