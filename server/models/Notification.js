import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },

    // أضفنا slot هنا
    targetType: { type: String, enum: ["all", "user", "slot"], default: "all" },

    // مستخدم واحد (عند targetType = user)
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // جلسة واحدة (عند targetType = slot)
    targetSlot: { type: mongoose.Schema.Types.ObjectId, ref: "Slot", default: null },

    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    successCount: Number,
    failureCount: Number,
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
