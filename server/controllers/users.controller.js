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
    const notificationsOwned =
      user.fcmTokens?.length > 0 &&
      user.fcmTokens[0].ownerUserId?.toString() === user._id.toString();

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
      notificationsOwned,
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
      return res.status(404).json({ code: "USER_NOT_FOUND" });
    }

    // 🔍 هل هذا التوكن مسجل عند أي مستخدم؟
    // 🧹 إزالة هذا التوكن من أي مستخدم آخر
    await User.updateMany(
      {
        _id: { $ne: user._id },
        "fcmTokens.token": fcmToken,
      },
      {
        $pull: { fcmTokens: { token: fcmToken } },
      }
    );

    // ✅ استبدال كل التوكنات بتوكن واحد فقط
    user.fcmTokens = [
      {
        token: fcmToken,
        ownerUserId: user._id,
        createdAt: new Date(),
      },
    ];

    await user.save();

    return res.json({
      code: "FCM_TOKEN_REGISTERED",
      isOwner: true,
    });


  } catch (err) {
    console.error("❌ updateFcmToken error:", err);
    res.status(500).json({ code: "FCM_TOKEN_ERROR" });
  }
};

export const transferFcmOwnership = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ code: "FCM_TOKEN_REQUIRED" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ code: "USER_NOT_FOUND" });
    }

    // 🔍 المستخدم الحالي الذي يملك التوكن
    await User.updateMany(
      {
        _id: { $ne: req.user._id },
        "fcmTokens.token": fcmToken,
      },
      {
        $pull: { fcmTokens: { token: fcmToken } },
      }
    );

    // 🧹 إزالة التوكن من أي مستخدم آخر
    // if (ownerUser && !ownerUser._id.equals(user._id)) {
    //   ownerUser.fcmTokens = ownerUser.fcmTokens.filter(
    //     (t) => t.token !== fcmToken
    //   );
    //   await ownerUser.save();
    // }

    // ✅ نضيف التوكن لهذا المستخدم فقط
    user.fcmTokens = [
      {
        token: fcmToken,
        ownerUserId: user._id,
        createdAt: new Date(),
      },
    ];

    await user.save();

    return res.json({
      code: "FCM_TRANSFERRED",
      notificationsOwned: true,
    });
  } catch (err) {
    console.error("❌ transferFcmOwnership error:", err);
    return res.status(500).json({ code: "FCM_TRANSFER_ERROR" });
  }
};
// 🔍 فحص ملكية FCM Token (قراءة فقط)
export const checkFcmOwnership = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    // لا يوجد توكن أصلاً
    if (!fcmToken) {
      return res.json({ hasToken: false });
    }

    const userId = req.user._id;

    // البحث عن أي مستخدم يملك هذا التوكن
    const owner = await User.findOne({
      "fcmTokens.token": fcmToken,
    }).select("_id");

    // التوكن غير مسجل عند أي مستخدم
    if (!owner) {
      return res.json({
        hasToken: true,
        ownedByCurrentUser: false,
      });
    }

    // التوكن يخص المستخدم الحالي
    if (owner._id.toString() === userId.toString()) {
      return res.json({
        hasToken: true,
        ownedByCurrentUser: true,
      });
    }

    // التوكن يخص مستخدم آخر
    return res.json({
      hasToken: true,
      ownedByCurrentUser: false,
    });
  } catch (err) {
    console.error("❌ checkFcmOwnership error:", err);
    return res.json({ hasToken: false });
  }
};
