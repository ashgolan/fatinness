export const NOTIFICATION_MESSAGES = {
  // =========================
  // 🔔 تذكير الحصة
  // =========================
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

  // =========================
  // ❌ إلغاء الحصة
  // =========================
  slotCancelled: {
    ar: {
      title: "❌ تم إلغاء الحصة",
      body: ({ dateTime } = {}) =>
        `نعتذر، تم إلغاء الحصة${dateTime ? " " + dateTime : ""}`,
    },
    he: {
      title: "❌ האימון בוטל",
      body: ({ dateTime } = {}) =>
        `מצטערים, האימון${dateTime ? " בתאריך " + dateTime : ""} בוטל`,
    },
    en: {
      title: "❌ Session Cancelled",
      body: ({ dateTime } = {}) =>
        `Sorry, the session${dateTime ? " on " + dateTime : ""} has been cancelled`,
    },
  },

  // =========================
  // ♻️ إعادة تفعيل الحصة
  // =========================
  slotReactivated: {
    ar: {
      title: "♻️ إعادة تفعيل الحصة",
      body: ({ dateTime } = {}) =>
        `تمت إعادة تفعيل الحصة${dateTime ? " " + dateTime : ""}`,
    },
    he: {
      title: "♻️ אימון הופעל מחדש",
      body: ({ dateTime } = {}) =>
        `האימון${dateTime ? " בתאריך " + dateTime : ""} הופעל מחדש`,
    },
    en: {
      title: "♻️ Session Reactivated",
      body: ({ dateTime } = {}) =>
        `The session${dateTime ? " on " + dateTime : ""} has been reactivated`,
    },
  },

  // =========================
  // ⏳ الاشتراك – 5 أيام
  // =========================
  subscriptionExpiring5Days: {
    ar: {
      title: "⏳ اقتراب انتهاء الاشتراك",
      body: "يتبقى 5 أيام على انتهاء اشتراكك",
    },
    he: {
      title: "⏳ המנוי עומד להסתיים",
      body: "המנוי שלך יסתיים בעוד 5 ימים",
    },
    en: {
      title: "⏳ Subscription Expiring",
      body: "Your subscription will expire in 5 days",
    },
  },

  // =========================
  // ⏳ الاشتراك – يومان
  // =========================
  subscriptionExpiring2Days: {
    ar: {
      title: "⏳ اقتراب انتهاء الاشتراك",
      body: "يتبقى يومان على انتهاء اشتراكك",
    },
    he: {
      title: "⏳ המנוי עומד להסתיים",
      body: "המנוי שלך יסתיים בעוד יומיים",
    },
    en: {
      title: "⏳ Subscription Expiring",
      body: "Your subscription will expire in 2 days",
    },
  },

  // =========================
  // ⛔ انتهاء الاشتراك
  // =========================
  subscriptionExpired: {
    ar: {
      title: "⛔ انتهى الاشتراك",
      body: "انتهى اشتراكك وتم إيقاف الحجز",
    },
    he: {
      title: "⛔ המנוי הסתיים",
      body: "המנוי שלך הסתיים ולא ניתן להזמין אימונים",
    },
    en: {
      title: "⛔ Subscription Expired",
      body: "Your subscription has expired. Booking is disabled.",
    },
  },
  // =========================
  // 🔐 تغيير كلمة المرور
  // =========================
  passwordChanged: {
    ar: {
      title: "🔐 أمان الحساب",
      body:
        "تم تغيير كلمة المرور الخاصة بحسابك. إذا لم تقومي بهذا الإجراء، يرجى التواصل مع الإدارة فورًا.",
    },
    he: {
      title: "🔐 אבטחת חשבון",
      body:
        "סיסמת החשבון שלך שונתה. אם לא ביקשת שינוי זה, אנא פני לתמיכה בהקדם.",
    },
    en: {
      title: "🔐 Account security",
      body:
        "Your account password has been changed. If you did not request this change, please contact support immediately.",
    },
  },
  slotCustom: {
    ar: {
      title: "📩 رسالة من الإدارة",
      body: ({ body }) => body,
    },
    he: {
      title: "📩 הודעה מהנהלה",
      body: ({ body }) => body,
    },
    en: {
      title: "📩 Message from management",
      body: ({ body }) => body,
    },
  },
  adminSubscriptionExpired: {
    ar: {
      title: "انتهاء اشتراك مديرة",
      body: ({ name }) =>
        `انتهى اشتراك المديرة ${name}. يرجى مراجعة الحالة واتخاذ الإجراء المناسب.`,
    },
    he: {
      title: "פג תוקף המנוי של מנהלת",
      body: ({ name }) =>
        `המנוי של המנהלת ${name} הסתיים. נא לבדוק ולטפל בהתאם.`,
    },
    en: {
      title: "Admin Subscription Expired",
      body: ({ name }) =>
        `The subscription of admin ${name} has expired. Please review and take action.`,
    },
  },
};
