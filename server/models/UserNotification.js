import mongoose from "mongoose";

const userNotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    notification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification",
      // required: true,
    },

    // UI state
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    type: {
      type: String,
      enum: ["system", "admin", "security", "subscription"],
      default: "system",
    },
    // اختياري: يساعد بالـ deep link
    targetType: { type: String, enum: ["all", "user", "slot"], default: "all" },
    targetSlot: { type: mongoose.Schema.Types.ObjectId, ref: "Slot", default: null },

    // لقطة نصية (حتى لو حذفنا Notification بالمستقبل يبقى عنده نسخة)
    title: { type: String, required: true },
    body: { type: String, required: true },
  },
  { timestamps: true }
);

// مهم: يمنع تكرار نفس الإشعار لنفس المستخدم
userNotificationSchema.index({ user: 1 });

export default mongoose.model("UserNotification", userNotificationSchema);
