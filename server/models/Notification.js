import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    targetType: { type: String, enum: ["all", "user"], default: "all" },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // المديرة
    successCount: Number,
    failureCount: Number,
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
