import User from "../models/User.js";
import Booking from "../models/Booking.js";
import { DateTime } from "luxon";
import { ZONE } from "../utils/time.js";
/**
 * 🔹 الحصول على الملف الشخصي للمستخدم
 */
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -__v")
      .lean();

    if (!user) return res.status(404).json({ code: "USER_PROFILE_NOT_FOUND" });

    const completedBookings = await Booking.countDocuments({
      user: user._id,
      status: "completed",
    });

    const cancelledBookings = await Booking.countDocuments({
      user: user._id,
      status: "cancelled",
    });

    const activeBookings = await Booking.countDocuments({
      user: user._id,
      status: "booked",
    });

    const lastWeight =
      user.weightHistory?.length > 0
        ? user.weightHistory[user.weightHistory.length - 1]
        : null;

    return res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      age: user.age,

      // 🔥 أهم نقطة:
      role: user.role,
      isSuperAdmin: user.isSuperAdmin || false,
      allowExtraBookings: user.allowExtraBookings || false,

      stats: {
        completedBookings,
        cancelledBookings,
        activeBookings,
        lastWeight: lastWeight?.weight || null,
        lastWeightNote: lastWeight?.note || null,
        lastWeightDate: lastWeight?.date || null,
      },

      weightHistory: user.weightHistory || [],
    });
  } catch (err) {
    console.error("❌ getUserProfile Error:", err);
    res.status(500).json({ code: "USER_PROFILE_FETCH_ERROR" });
  }
};

/**
 * 🔹 تحديث الملف الشخصي
 */
export const updateUserProfile = async (req, res) => {
  try {
    const allowedFields = ["name", "phone", "email", "height", "age", "gender"];
    const updates = {};

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    }).select("-password -__v");

    res.json({ code: "USER_PROFILE_UPDATED", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: "USER_PROFILE_UPDATE_ERROR" });
  }
};

/**
 * 🔹 إضافة نقطة وزن جديدة
 */

export const addWeightPoint = async (req, res) => {
  try {
    const { weight, note } = req.body;

    if (!weight) {
      return res.status(400).json({ code: "USER_WEIGHT_REQUIRED" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ code: "USER_WEIGHT_NOT_FOUND" });
    }
    if (
      user.subscriptionStatus === "expired" ||
      (user.subscriptionEnd && user.subscriptionEnd < new Date())
    ) {
      return res.status(403).json({
        code: "SUBSCRIPTION_EXPIRED",
      });
    }

    const nowUTC = DateTime.now().setZone(ZONE).toUTC().toJSDate();

    user.weightHistory.push({
      weight,
      note,
      date: nowUTC,
    });

    user.weight = weight;
    await user.save();

    res.json({
      code: "USER_WEIGHT_UPDATED",
      weightHistory: user.weightHistory,
    });
  } catch (err) {
    console.error("❌ Error in addWeightPoint:", err);
    res.status(500).json({ code: "USER_WEIGHT_ERROR" });
  }
};

/**
 * 🔹 جلب سجل الأوزان
 */
export const getWeightHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("weightHistory weight")
      .lean();

    if (!user)
      return res.status(404).json({ code: "USER_WEIGHT_HISTORY_NOT_FOUND" });

    res.json({
      success: true,
      weightHistory: user.weightHistory,
      currentWeight: user.weight,
    });
  } catch (err) {
    console.error("❌ Error in getWeightHistory:", err);
    res.status(500).json({ code: "USER_WEIGHT_HISTORY_ERROR" });
  }
};

/**
 * 🔹 تحديث رمز FCM
 */
export const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ code: "FCM_TOKEN_REQUIRED" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ code: "FCM_TOKEN_USER_NOT_FOUND" });
    }

    // 🟢 أول مرة → هذا المستخدم هو مالك الجهاز
    if (!user.deviceOwnerId) {
      user.deviceOwnerId = user._id;
      user.fcmTokens = [fcmToken];
      await user.save();

      return res.json({
        code: "FCM_TOKEN_SAVED_AS_OWNER",
        isOwner: true,
      });
    }

    // 🔴 جهاز مملوك لمستخدم آخر
    if (!user.deviceOwnerId.equals(user._id)) {
      return res.json({
        code: "FCM_TOKEN_IGNORED_DEVICE_OWNED",
        isOwner: false,
      });
    }

    // 🟡 نفس المستخدم لكن جهاز جديد → ننقل الملكية
    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens = [fcmToken];
      await user.save();

      return res.json({
        code: "FCM_TOKEN_TRANSFERRED_NEW_DEVICE",
        isOwner: true,
      });
    }

    return res.json({
      code: "FCM_TOKEN_ALREADY_REGISTERED",
      isOwner: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: "FCM_TOKEN_ERROR" });
  }
};

export const renewSubscription = async (req, res) => {
  try {
    // ⛔ السوبر أدمن فقط
    if (!req.user.isSuperAdmin) {
      return res.status(403).json({
        code: "ONLY_SUPERADMIN_CAN_RENEW_SUBSCRIPTION",
      });
    }

    const user = await User.findById(req.body.userId);
    if (!user) {
      return res.status(404).json({ code: "USER_SUBSCRIPTION_NOT_FOUND" });
    }

    const nowLocal = DateTime.now().setZone(ZONE);

    const startUTC = nowLocal.toUTC().toJSDate();
    const endUTC = nowLocal.plus({ months: 1 }).endOf("day").toUTC().toJSDate();

    // 🔁 تحديث الاشتراك
    user.subscriptionEnd = endUTC;
    user.subscriptionStatus = "active";
    user.isBlocked = false;

    // 🔔 إعادة ضبط الإشعارات
    user.notified5Days = false;
    user.notified2Days = false;

    // (اختياري) مزامنة مع subscription object
    user.subscription = {
      ...user.subscription,
      active: true,
      currentPeriodStart: startUTC,
      currentPeriodEnd: endUTC,
    };

    await user.save();

    res.json({ code: "USER_SUBSCRIPTION_RENEWED" });
  } catch (err) {
    console.error("❌ renewSubscription error:", err);
    res.status(500).json({ code: "USER_SUBSCRIPTION_ERROR" });
  }
};
// 🔁 نقل الإشعارات إلى هذا الجهاز
export const transferFcmToThisDevice = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ code: "FCM_TOKEN_REQUIRED" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ code: "USER_NOT_FOUND" });
    }

    // 🧹 حذف كل التوكنات القديمة
    user.fcmTokens = [
      {
        token: fcmToken,
        ownerUserId: user._id,
        createdAt: new Date(),
      },
    ];

    // 🟢 هذا المستخدم هو مالك الجهاز
    user.deviceOwnerId = user._id;

    await user.save();

    return res.json({
      code: "FCM_TRANSFERRED",
    });
  } catch (err) {
    console.error("❌ transferFcmToThisDevice error:", err);
    res.status(500).json({ code: "FCM_TRANSFER_ERROR" });
  }
};
