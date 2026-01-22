import { NOTIFICATION_MESSAGES } from "./notificationMessages.js";

export function getNotificationText(
  type,
  preferredLanguage = "ar",
  params = {}
) {
  const lang = ["ar", "he", "en"].includes(preferredLanguage)
    ? preferredLanguage
    : "ar";

  const fallbackLang = "ar";

  const message =
    NOTIFICATION_MESSAGES[type]?.[lang] ||
    NOTIFICATION_MESSAGES[type]?.[fallbackLang];

  if (!message) {
    return {
      title: "",
      body: "",
    };
  }

  const title =
    typeof message.title === "function"
      ? message.title(params)
      : message.title || "";

  const body =
    typeof message.body === "function"
      ? message.body(params)
      : message.body || "";

  return { title, body };
}
