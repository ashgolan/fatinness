// =======================
// 📊 Subscription Report (UTC-safe)
// =======================

import { DateTime } from "luxon";
import { ZONE } from "../utils/time.js";
import User from "../models/User.js";

export const getSubscriptionReport = async (req, res) => {
  try {
    // ⏱️ الآن (محلي → UTC)
    const nowLocal = DateTime.now().setZone(ZONE);
    const nowUTC = nowLocal.toUTC();

    // ⏳ بعد 5 أيام (محلي → UTC)
    const fiveDaysAheadUTC = nowLocal
      .plus({ days: 5 })
      .endOf("day")
      .toUTC();

    // فقط من لديه تاريخ نهاية
    const users = await User.find({
      subscriptionEnd: { $exists: true, $ne: null },
    }).select("username phone subscriptionEnd isBlocked");

    const activeSoon = [];
    const expired = [];
    const active = [];

    for (const u of users) {
      if (!u.subscriptionEnd) continue;

      const endUTC = DateTime.fromJSDate(u.subscriptionEnd);

      if (endUTC < nowUTC) {
        expired.push(u);                 // منتهٍ
      } else if (endUTC <= fiveDaysAheadUTC) {
        activeSoon.push(u);              // ينتهي خلال 5 أيام
      } else {
        active.push(u);                  // نشط
      }
    }

    res.json({
      activeSoon,
      expired,
      active,
    });
  } catch (err) {
    console.error("❌ Subscription report error:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
};
