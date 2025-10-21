import User from "../models/User.js";
import Booking from "../models/Booking.js";

/**
 * 🔹 الحصول على الملف الشخصي للمستخدم
 * يعيد جميع بياناته الأساسية وسجل الأوزان والتقدم
 */
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -__v")
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    // حساب الإحصائيات العامة للمستخدم
    const totalBookings = await Booking.countDocuments({ user: user._id });
    const activeBookings = await Booking.countDocuments({
      user: user._id,
      status: "booked",
    });

    // ✅ استخراج آخر نقطة وزن (إن وُجدت)
    const lastWeight =
      user.weightHistory?.length > 0
        ? user.weightHistory[user.weightHistory.length - 1]
        : null;

    res.json({
      ...user,
      stats: {
        totalBookings,
        activeBookings,
        lastWeight: lastWeight?.weight || null,
        lastWeightNote: lastWeight?.note || null,
        lastWeightDate: lastWeight?.date || null,
      },
      // ✅ مصفوفة الأوزان الكاملة لعرضها في الرسم البياني
      weightHistory: user.weightHistory || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 🔹 تحديث الملف الشخصي
 * يسمح للمستخدم بتعديل الاسم، الهاتف، البريد، إلخ
 */
export const updateUserProfile = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "phone",
      "email",
      "height",
      "age",
      "gender",
    ];

    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    }).select("-password -__v");

    res.json({ message: "Profile updated", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 🔹 إضافة نقطة وزن جديدة لسجل المستخدم
 * تُستخدم لعرض تقدم المستخدم في الرسم البياني
 */
export const addWeightPoint = async (req, res) => {
  try {
    const { weight, note } = req.body;
    if (!weight) return res.status(400).json({ message: "Weight required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.weightHistory.push({ weight, note, date: new Date() });
    user.weight = weight;

    await user.save();
    res.json({
      message: "Weight updated",
      weightHistory: user.weightHistory,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 🔹 جلب سجل الأوزان لعرضه في المخطط البياني
 */
export const getWeightHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("weightHistory");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.weightHistory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 🔹 تحديث رمز FCM Token الخاص بالمستخدم
 * (حتى نرسل له إشعارات من الخادم)
 */
export const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken)
      return res.status(400).json({ message: "fcmToken is required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // نحفظ التوكن داخل المصفوفة لتعدد الأجهزة
    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
      await user.save();
    }

    res.json({ message: "FCM token saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
