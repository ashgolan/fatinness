export const NOTIFICATION_MESSAGES = {
  bookingReminder: {
    ar: {
      title: "⏰ تذكير بالحصة",
      body: "لديك حصة بعد ساعتين، ننتظرك 💪",
    },
    he: {
      title: "⏰ תזכורת לאימון",
      body: "יש לך אימון בעוד שעתיים 💪",
    },
    en: {
      title: "⏰ Workout Reminder",
      body: "You have a workout in 2 hours 💪",
    },
  },

  slotCancelled: {
    ar: {
      title: "❌ تم إلغاء الحصة",
      body: ({ dateTime }) =>
        `نعتذر، تم إلغاء الحصة ${dateTime}`,
    },
    he: {
      title: "❌ האימון בוטל",
      body: ({ dateTime }) =>
        `מצטערים, האימון בתאריך ${dateTime} בוטל`,
    },
    en: {
      title: "❌ Session Cancelled",
      body: ({ dateTime }) =>
        `Sorry, the session on ${dateTime} has been cancelled`,
    },
  },

  slotReactivated: {
    ar: {
      title: "♻️ إعادة تفعيل الحصة",
      body: ({ dateTime }) =>
        `تمت إعادة تفعيل الحصة ${dateTime}`,
    },
    he: {
      title: "♻️ אימון הופעל מחדש",
      body: ({ dateTime }) =>
        `האימון בתאריך ${dateTime} הופעל מחדש`,
    },
    en: {
      title: "♻️ Session Reactivated",
      body: ({ dateTime }) =>
        `The session on ${dateTime} has been reactivated`,
    },
  },
};
