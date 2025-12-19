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

    if (!fcmToken) return res.status(400).json({ code: "FCM_TOKEN_REQUIRED" });

    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(404).json({ code: "FCM_TOKEN_USER_NOT_FOUND" });

    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
      await user.save();
    }

    res.json({ code: "FCM_TOKEN_SAVED" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: "FCM_TOKEN_ERROR" });
  }
};

/**
 * 🔹 تجديد الاشتراك يدويًا
 */
export const renewSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ code: "USER_SUBSCRIPTION_NOT_FOUND" });
    }

    const nowLocal = DateTime.now().setZone(ZONE);

    const startUTC = nowLocal.toUTC().toJSDate();
    const endUTC = nowLocal.plus({ months: 1 }).endOf("day").toUTC().toJSDate();

    user.subscription = {
      ...user.subscription,
      active: true,
      currentPeriodStart: startUTC,
      currentPeriodEnd: endUTC,
    };

    // ⭐ تحديث subscriptionEnd الرئيسي (مهم جدًا)
    user.subscriptionEnd = endUTC;
    user.isBlocked = false;

    await user.save();

    res.json({ code: "USER_SUBSCRIPTION_RENEWED" });
  } catch (err) {
    console.error("❌ renewSubscription error:", err);
    res.status(500).json({ code: "USER_SUBSCRIPTION_ERROR" });
  }
};
