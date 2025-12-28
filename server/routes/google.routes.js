import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";
import User from "../models/User.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

dotenv.config();
const router = express.Router();

// =====================================================
// 🔐 Google OAuth Config
// =====================================================
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  BASE_URL,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !BASE_URL) {
  throw new Error("❌ Missing Google OAuth environment variables");
}

const redirectUri = `${BASE_URL}/google/callback`;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  redirectUri
);

// =====================================================
// 🔹 Step 1: Generate Google Auth URL (User must be logged in)
// =====================================================
router.get("/connect", authMiddleware, (req, res) => {
  try {
    const scopes = [
      "https://www.googleapis.com/auth/calendar.events",
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",          // 🔴 مهم للحصول على refreshToken
      scope: scopes,
      state: req.user.id,         // 🔐 ربط العملية بالمستخدم
    });

    res.json({ url });
  } catch (err) {
    console.error("❌ Google connect error:", err);
    res.status(500).json({ code: "GOOGLE_CONNECT_ERROR" });
  }
});

// =====================================================
// 🔹 Step 2: Google OAuth Callback (NO authMiddleware)
// =====================================================
router.get("/callback", async (req, res) => {
  const { code, state: userId } = req.query;

  if (!code || !userId) {
    return res.redirect(`${BASE_URL}/profile?google=missing_data`);
  }

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens?.access_token) {
      throw new Error("No access token returned from Google");
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect(`${BASE_URL}/profile?google=user_not_found`);
    }

    // Save tokens securely
    user.google = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || user.google?.refreshToken || null,
      scope: tokens.scope,
      tokenType: tokens.token_type,
      expiryDate: tokens.expiry_date,
      connectedAt: new Date(),
    };

    await user.save();

    return res.redirect(`${BASE_URL}/profile?google=connected`);
  } catch (error) {
    console.error("❌ Google OAuth callback error:", error);
    return res.redirect(`${BASE_URL}/profile?google=error`);
  }
});

// =====================================================
// 🔹 Optional: Disconnect Google Calendar
// =====================================================
router.post("/disconnect", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    user.google = undefined;
    await user.save();

    res.json({ code: "GOOGLE_DISCONNECTED" });
  } catch (err) {
    console.error("❌ Google disconnect error:", err);
    res.status(500).json({ code: "GOOGLE_DISCONNECT_ERROR" });
  }
});

export default router;
