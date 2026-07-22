import mongoose from "mongoose";

const weightHistorySchema = new mongoose.Schema({
  weight: Number,
  note: String,
  date: { type: Date, default: Date.now },
});

const subscriptionSchema = new mongoose.Schema({
  provider: String,
  providerCustomerId: String,
  planId: String,
  active: { type: Boolean, default: false },
  currentPeriodStart: Date,
});

const userSchema = new mongoose.Schema(
  {
    username: { type: String },
    email: {
      type: String, unique: true, sparse: true, // ⭐ مهم جدًا
    },
    passwordHash: { type: String, required: true },
    phone: { type: String, unique: true },

    gender: {
      type: String,
      enum: ["female", "male"],
      default: "female",
    },

    height: Number,
    weight: Number,
    age: Number,

    subscriptionStart: Date,
    subscriptionEnd: Date,

    subscriptionStatus: {
      type: String,
      enum: ["active", "expired"],
      default: "active",
    },
    expiredNotified: { type: Boolean, default: false },

    notified5Days: {
      type: Boolean,
      default: false,
    },

    notified2Days: {
      type: Boolean,
      default: false,
    },

    isBlocked: { type: Boolean, default: false },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isSuperAdmin: {
      type: Boolean,
      default: false,
      required: true,
    },

    preferredLanguage: {
      type: String,
      enum: ["ar", "en", "he"],
      default: "he",
    },

    allowExtraBookings: { type: Boolean, default: false },
    weeklyBookingLimit: { type: Number, default: null, min: 1 },
    weightHistory: [weightHistorySchema],
    subscription: subscriptionSchema,

    fcmTokens: [
      {
        token: { type: String, required: true },

        // أول مستخدم سجّل هذا التوكن = مالك الجهاز
        ownerUserId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    google: {
      accessToken: String,
      refreshToken: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
