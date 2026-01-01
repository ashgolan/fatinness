const userSchema = new mongoose.Schema(
  {
    username: { type: String },
    email: { type: String, unique: true },
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
