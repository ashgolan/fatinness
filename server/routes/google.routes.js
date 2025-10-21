import express from 'express';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import User from '../models/User.js';

dotenv.config();
const router = express.Router();

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BASE_URL } = process.env;
const redirectUri = `${BASE_URL}/google/callback`;
const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);

// 🔹 إنشاء رابط التفويض
router.get('/connect', authMiddleware, (req, res) => {
  const scopes = ['https://www.googleapis.com/auth/calendar.events'];
  const url = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: scopes });
  res.json({ url });
});

// 🔹 استقبال رمز التفويض من Google وتخزين الرموز في حساب المستخدم
router.get('/callback', authMiddleware, async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const user = req.user;
    user.google = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    };
    await user.save();

    res.redirect(`${BASE_URL}/profile?google=connected`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ message: 'Failed to connect Google Calendar' });
  }
});

export default router;
