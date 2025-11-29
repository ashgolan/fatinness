import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    clubName: { type: String, default: "Fatinness Club" },
    contactNumber: { type: String, default: "" },
    autoMessage: { type: String, default: "مرحباً بك في نادينا الرياضي 💪" },
    logoUrl: { type: String, default: "" },
    cardUrl: { type: String, default: "" }, // ✅ تمت إضافته هنا
    allowExtraBookingsByDefault: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Setting", settingSchema);
