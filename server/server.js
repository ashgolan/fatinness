import "dotenv/config";
import express from 'express';
import cors from "cors";
import { connectDB } from './config/db.js';
import { agenda } from './config/agenda.js';
import { defineSchedulerJobs } from './utils/scheduler.js';
import usersRoutes from './routes/users.routes.js';
import bookingsRouter from "./routes/bookings.routes.js";

// Controllers & Routes
import { handleWebhook } from './controllers/payments.controller.js';
import authRoutes from './routes/auth.routes.js';
import slotRoutes from './routes/slots.routes.js';
import adminRoutes from './routes/admin.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import googleRoutes from './routes/google.routes.js';
import mainRoutes from './routes/index.js';

const app = express();

// ✅ تفعيل CORS
app.use(cors());

// ✅ Stripe Webhook قبل JSON middleware
app.post(
  '/payments/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    req.rawBody = req.body;
    if (Buffer.isBuffer(req.rawBody)) {
      req.rawBody = req.rawBody;
    } else if (typeof req.rawBody === 'string') {
      req.rawBody = Buffer.from(req.rawBody);
    }
    next();
  },
  handleWebhook
);

// ✅ تفعيل JSON لباقي المسارات
app.use(express.json());

// ✅ Health Check
app.get('/health', (req, res) => res.json({ ok: true, time: new Date() }));

// ✅ Mount Routes
app.use('/auth', authRoutes);
app.use('/slots', slotRoutes);
app.use('/bookings', bookingsRouter);
app.use('/admin', adminRoutes);
app.use('/payments', paymentsRoutes);
app.use('/google', googleRoutes);
app.use('/users', usersRoutes);
app.use('/', mainRoutes);

// ✅ تشغيل السيرفر
const PORT = process.env.PORT || 4000;
(async () => {
  try {
    await connectDB();

    // 🔹 تعريف مهام Agenda قبل التشغيل
    defineSchedulerJobs();

    // 🔹 بدء تشغيل الـ Agenda
    await agenda.start();

    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  } catch (err) {
    console.error('❌ Server startup failed:', err);
    process.exit(1);
  }
})();
