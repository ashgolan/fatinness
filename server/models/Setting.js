import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    clubName: { type: String, default: "Fatinness Club" },
    contactNumber: { type: String, default: "" },
    autoMessage: { type: String, default: "مرحباً بك في نادينا الرياضي 💪" },
    logoUrl: { type: String, default: "" },
    cardUrl: { type: String, default: "" }, // ✅ تمت إضافته هنا
    allowExtraBookingsByDefault: { type: Boolean, default: false },
    minimumGapBetweenBookings: {
      type: Number,
      default: 1, // الافتراضي: منع التلاصق فقط
    },
    preventCloseBookings: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Setting", settingSchema);
