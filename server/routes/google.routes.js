// import express from "express";
// import { google } from "googleapis";
// import User from "../models/User.js";
// import { authMiddleware } from "../middlewares/auth.middleware.js";

// const router = express.Router();

// // =====================================================
// // 💤 Google OAuth DISABLED (safe mode)
// // =====================================================
// const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BASE_URL } = process.env;

// // إذا لم تتوفر المتغيرات → نوقف Google OAuth بهدوء
// const isGoogleEnabled = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && BASE_URL;

// if (!isGoogleEnabled) {
//   console.warn("⚠️ Google OAuth disabled (missing env variables)");
// }

// // =====================================================
// // 🔹 Step 1: Generate Google Auth URL
// // =====================================================
// router.get("/connect", authMiddleware, (req, res) => {
//   if (!isGoogleEnabled) {
//     return res.status(503).json({
//       code: "GOOGLE_DISABLED",
//       message: "Google OAuth is not enabled",
//     });
//   }

//   try {
//     const oauth2Client = new google.auth.OAuth2(
//       GOOGLE_CLIENT_ID,
//       GOOGLE_CLIENT_SECRET,
//       `${BASE_URL}/google/callback`
//     );

//     const scopes = ["https://www.googleapis.com/auth/calendar.events"];

//     const url = oauth2Client.generateAuthUrl({
//       access_type: "offline",
//       prompt: "consent",
//       scope: scopes,
//       state: req.user.id,
//     });

//     res.json({ url });
//   } catch (err) {
//     console.error("❌ Google connect error:", err);
//     res.status(500).json({ code: "GOOGLE_CONNECT_ERROR" });
//   }
// });

// // =====================================================
// // 🔹 Step 2: Google OAuth Callback
// // =====================================================
// router.get("/callback", async (req, res) => {
//   if (!isGoogleEnabled) {
//     return res.redirect("/profile?google=disabled");
//   }

//   const { code, state: userId } = req.query;

//   if (!code || !userId) {
//     return res.redirect("/profile?google=missing_data");
//   }

//   try {
//     const oauth2Client = new google.auth.OAuth2(
//       GOOGLE_CLIENT_ID,
//       GOOGLE_CLIENT_SECRET,
//       `${BASE_URL}/google/callback`
//     );

//     const { tokens } = await oauth2Client.getToken(code);

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.redirect("/profile?google=user_not_found");
//     }

//     user.google = {
//       accessToken: tokens.access_token,
//       refreshToken: tokens.refresh_token || null,
//       scope: tokens.scope,
//       tokenType: tokens.token_type,
//       expiryDate: tokens.expiry_date,
//       connectedAt: new Date(),
//     };

//     await user.save();

//     return res.redirect("/profile?google=connected");
//   } catch (err) {
//     console.error("❌ Google callback error:", err);
//     return res.redirect("/profile?google=error");
//   }
// });

// // =====================================================
// // 🔹 Disconnect Google
// // =====================================================
// router.post("/disconnect", authMiddleware, async (req, res) => {
//   if (!isGoogleEnabled) {
//     return res.status(503).json({ code: "GOOGLE_DISABLED" });
//   }

//   try {
//     req.user.google = undefined;
//     await req.user.save();
//     res.json({ code: "GOOGLE_DISCONNECTED" });
//   } catch (err) {
//     console.error("❌ Google disconnect error:", err);
//     res.status(500).json({ code: "GOOGLE_DISCONNECT_ERROR" });
//   }
// });

// export default router;
