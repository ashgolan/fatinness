import User from "../models/User.js";

export const getSubscriptionReport = async (req, res) => {
  try {
    const now = new Date();
    const fiveDaysAhead = new Date();
    fiveDaysAhead.setDate(now.getDate() + 5); // 🔥 تغيير 7 أيام → 5 أيام

    // جلب فقط من لديه تاريخ نهاية اشتراك
    const users = await User.find({
      subscriptionEnd: { $exists: true, $ne: null }
    }).select("username phone subscriptionEnd isBlocked");

    // الأقسام
    const activeSoon = [];
    const expired = [];
    const active = [];

    for (const u of users) {
      const end = new Date(u.subscriptionEnd);

      if (end < now) {
        expired.push(u);                        // منتهٍ
      } 
      else if (end >= now && end <= fiveDaysAhead) {
        activeSoon.push(u);                    // ينتهي خلال 5 أيام
      } 
      else {
        active.push(u);                        // نشط
      }
    }

    res.json({
      activeSoon,
      expired,
      active,
    });
  } catch (err) {
    console.error("Subscription report error:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
};
