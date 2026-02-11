import UserNotification from "../models/UserNotification.js";

// 📥 جلب إشعارات المستخدم
export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await UserNotification.find({ user: userId })
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    console.error("Get notifications error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ تعليم إشعار كمقروء
export const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const updated = await UserNotification.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Mark notification error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// 📭 تعليم جميع الإشعارات كمقروءة
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await UserNotification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Read all notifications error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
