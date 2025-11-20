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
    username: { type: "String" },
    email: { type: String, unique: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, unique: true },
    gender: { type: String, enum: ["female", "male"], default: "female" },
    height: Number,
    weight: Number,
    age: Number,
    isBlocked: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    allowExtraBookings: { type: Boolean, default: false },
    fcmTokens: [String],
    weightHistory: [weightHistorySchema],
    subscription: subscriptionSchema,
    google: {
      accessToken: String,
      refreshToken: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
