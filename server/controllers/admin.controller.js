// 📁 server/controllers/admin.controller.js

import User from "../models/User.js";
import Slot from "../models/Slot.js";
import WeekTemplate from "../models/WeekTemplate.js";
import Booking from "../models/Booking.js";
import Notification from "../models/Notification.js";
import { createObjectCsvStringifier } from "csv-writer";
import Setting from "../models/Setting.js";
import multer from "multer";
import path from "path";
import mongoose from "mongoose";
import { sendSmartNotification } from "../utils/notify.js";
import { DateTime } from "luxon";
import { ZONE } from "../utils/time.js";
import fs from "fs";
import { hasOverlap } from "./adminSlots.controller.js";
import { agenda } from "../config/agenda.js";
import bcrypt from "bcrypt";
import { NOTIFICATION_MESSAGES } from "../utils/notificationMessages.js";

// =======================
// 📸 رفع الشعار (multer)
// =======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, "logo" + ext);
  },
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("الملف يجب أن يكون صورة"));
  },
});
export const adminGetSlotBookings = async (req, res) => {
  try {
    const slotId = new mongoose.Types.ObjectId(req.params.id);

    const bookings = await Booking.find({ slot: slotId }).populate(
      "user",
      "username phone name email"
    );

    res.json({ bookings });
  } catch (err) {
    console.error("❌ Error loading slot bookings:", err);
    res.status(500).json({ code: "ADMIN_SLOT_BOOKINGS_ERROR" });
  }
};
// =======================
// 🟦 إنشاء قالب أسبوعي
// =======================
export const createWeekTemplate = async (req, res) => {
  try {
    const { name, slots } = req.body;
    if (!name || !slots?.length) {
      return res.status(400).json({ code: "ADMIN_TEMPLATE_REQUIRED" });
    }

    const template = await WeekTemplate.create({ name, slots });
    res.status(201).json({
      code: "ADMIN_TEMPLATE_CREATE_SUCCESS",
      template,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "ADMIN_TEMPLATE_CREATE_ERROR" });
  }
};


export const applyTemplate = async (req, res) => {
  const { templateId, startDate } = req.body;

  if (!templateId || !startDate) {
    return res.status(400).json({ code: "ADMIN_TEMPLATE_REQUIRED" });
  }

  const startLocal = DateTime.fromISO(startDate, { zone: ZONE });
  if (!startLocal.isValid) {
    return res.status(400).json({ code: "ADMIN_TEMPLATE_INVALID_START_DATE" });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const template = await WeekTemplate.findById(templateId).session(session);
    if (!template) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ code: "ADMIN_TEMPLATE_NOT_FOUND" });
    }

    const createdSlots = [];
    let skippedOverlap = 0;
    let skippedDuplicate = 0;

    // 🔹 لحفظ الحصص المقبولة داخل نفس العملية (template ↔ template)
    const localRanges = [];

    // 🔹 فحص تداخل محلي
    const hasLocalOverlap = (start, end) => {
      return localRanges.some(
        (r) => start < r.end && end > r.start
      );
    };

    // =========================
    // إنشاء الحصص من القالب
    // =========================
    for (const tpl of template.slots) {
      const dayLocal = startLocal.plus({ days: tpl.dateOffset || 0 });

      const startAtUTC = DateTime.fromISO(
        `${dayLocal.toISODate()}T${tpl.startTime}`,
        { zone: ZONE }
      ).toUTC();

      const endAtUTC = DateTime.fromISO(
        `${dayLocal.toISODate()}T${tpl.endTime}`,
        { zone: ZONE }
      ).toUTC();

      // ❌ وقت غير صالح
      if (!startAtUTC.isValid || !endAtUTC.isValid) {
        skippedDuplicate++;
        continue;
      }

      // ❌ نهاية قبل البداية
      if (endAtUTC <= startAtUTC) {
        skippedOverlap++;
        continue;
      }

      // ❌ تداخل داخل نفس القالب
      if (hasLocalOverlap(startAtUTC, endAtUTC)) {
        skippedOverlap++;
        continue;
      }

      // ❌ تداخل مع حصص موجودة في قاعدة البيانات
      if (
        await hasOverlap(
          startAtUTC.toJSDate(),
          endAtUTC.toJSDate(),
          session
        )
      ) {
        skippedOverlap++;
        continue;
      }

      // ❌ تكرار تام (نفس البداية والنهاية)
      const exists = await Slot.findOne({
        startAt: startAtUTC.toJSDate(),
        endAt: endAtUTC.toJSDate(),
        isDeleted: false, // ⭐ مهم

      }).session(session);

      if (exists) {
        skippedDuplicate++;
        continue;
      }

      // ✅ إنشاء الحصة
      const [slot] = await Slot.create(
        [
          {
            date: startAtUTC.startOf("day").toJSDate(),
            startAt: startAtUTC.toJSDate(),
            endAt: endAtUTC.toJSDate(),
            capacity: tpl.capacity,
            templateId: template._id,
          },
        ],
        { session }
      );

      // حفظها للفحص المحلي
      localRanges.push({
        start: startAtUTC,
        end: endAtUTC,
      });

      createdSlots.push(slot._id);
    }

    await session.commitTransaction();
    session.endSession();

    return res.json({
      code: "ADMIN_TEMPLATE_APPLIED",
      created: createdSlots.length,
      skippedOverlap,
      skippedDuplicate,
      skippedTotal: skippedOverlap + skippedDuplicate,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ applyTemplate error:", error);
    return res.status(500).json({ code: "ADMIN_TEMPLATE_APPLY_ERROR" });
  }
};



// =======================
// 🟦 تمكين الحجز الإضافي
// =======================
export const setUserExtraBooking = async (req, res) => {
  try {
    const { userId, allow } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ code: "ADMIN_USER_NOT_FOUND" });
    }

    user.allowExtraBookings = !!allow;
    await user.save();

    res.json({
      code: "ADMIN_USER_UPDATED",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "ADMIN_USER_UPDATE_ERROR" });
  }
};

// =======================
// 📤 تصدير CSV
// =======================
// =======================
// 📤 تصدير CSV (UTC-safe)
// =======================

export const exportAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};

    // 🧮 فلترة المدى الزمني (محلي → UTC)
    if (startDate && endDate) {
      const startLocal = DateTime.fromISO(startDate, { zone: ZONE }).startOf(
        "day"
      );
      const endLocal = DateTime.fromISO(endDate, { zone: ZONE }).endOf("day");

      if (!startLocal.isValid || !endLocal.isValid) {
        return res.status(400).json({ code: "ADMIN_REPORT_INVALID_DATES" });
      }

      filter.createdAt = {
        $gte: startLocal.toUTC().toJSDate(),
        $lte: endLocal.toUTC().toJSDate(),
      };
    }

    const bookings = await Booking.find(filter)
      .populate("user", "username email phone")
      .populate("slot", "startAt endAt isBlocked")
      .sort({ createdAt: -1 });

    if (!bookings.length) {
      return res.status(404).json({ code: "ADMIN_REPORT_NO_DATA" });
    }

    const csv = createObjectCsvStringifier({
      header: [
        { id: "username", title: "שם" },
        { id: "email", title: "דוא״ל" },
        { id: "phone", title: "טלפון" },
        { id: "date", title: "תאריך האימון" },
        { id: "time", title: "שעה" },
        { id: "status", title: "סטטוס" },
        { id: "createdAt", title: "תאריך ההזמנה" },
      ],
    });


    const records = bookings.map((b) => {
      const hasSlot = !!b.slot?.startAt && !!b.slot?.endAt;

      const timeStr = hasSlot
        ? `${DateTime.fromJSDate(b.slot.startAt)
          .setZone(ZONE)
          .toFormat("HH:mm")} - ${DateTime.fromJSDate(b.slot.endAt)
            .setZone(ZONE)
            .toFormat("HH:mm")}`
        : "—";

      let statusStr = "—";
      if (b.status === "booked") statusStr = "نشط ✅";
      else if (b.status === "cancelled") statusStr = "ملغى ❌";
      else if (b.status === "completed") statusStr = "منجز ✅";

      return {
        username: b.user?.username || "—",
        email: b.user?.email || "—",
        phone: b.user?.phone || "—",
        date: hasSlot
          ? DateTime.fromJSDate(b.slot.startAt)
            .setZone(ZONE)
            .toFormat("yyyy-MM-dd")
          : "—",
        time: timeStr,
        status: statusStr,
        createdAt: DateTime.fromJSDate(b.createdAt)
          .setZone(ZONE)
          .toFormat("yyyy-MM-dd HH:mm"),
      };
    });

    const csvData = csv.getHeaderString() + csv.stringifyRecords(records);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=bookings-report.csv"
    );

    // BOM لدعم العربية في Excel
    res.status(200).end("\uFEFF" + csvData);
  } catch (error) {
    console.error("❌ exportAttendanceReport error:", error);
    res.status(500).json({ code: "ADMIN_REPORT_EXPORT_ERROR" });
  }
};

// =======================
// 📊 Dashboard
// =======================
// =======================
// 📊 Dashboard (UTC-safe, Sunday-based)
// =======================

export const getDashboardStats = async (req, res) => {
  try {
    // ⏱️ الآن (محلي)
    const nowLocal = DateTime.now().setZone(ZONE);
    const nowUTC = nowLocal.toUTC().toJSDate();

    // =======================
    // 📅 آخر 7 أيام (محلي)
    // =======================
    const start7Local = nowLocal.minus({ days: 6 }).startOf("day");
    const start7UTC = start7Local.toUTC().toJSDate();

    const last7 = await Booking.aggregate([
      { $match: { createdAt: { $gte: start7UTC } } },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Jerusalem",
              },
            },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const dailyBookings = [];

    for (let i = 0; i < 7; i++) {
      const dayLocal = start7Local.plus({ days: i });
      const dayStartUTC = dayLocal.startOf("day").toUTC().toJSDate();
      const dayEndUTC = dayLocal.endOf("day").toUTC().toJSDate();

      const completedForDay = await Booking.aggregate([
        { $match: { status: "booked" } },
        {
          $lookup: {
            from: "slots",
            localField: "slot",
            foreignField: "_id",
            as: "slot",
          },
        },
        { $unwind: "$slot" },
        {
          $match: {
            "slot.endAt": { $gte: dayStartUTC, $lte: dayEndUTC },
          },
        },
        { $count: "count" },
      ]);

      const getCount = (status) =>
        last7.find(
          (d) =>
            d._id.date === dayLocal.toFormat("yyyy-MM-dd") &&
            d._id.status === status
        )?.count || 0;

      dailyBookings.push({
        date: dayLocal.toFormat("yyyy-MM-dd"),
        active: getCount("booked"),
        cancelled: getCount("cancelled"),
        completed: completedForDay[0]?.count || 0,
      });
    }

    // =======================
    // ☀️ جلسات اليوم
    // =======================
    const startOfDayUTC = nowLocal.startOf("day").toUTC().toJSDate();
    const endOfDayUTC = nowLocal.endOf("day").toUTC().toJSDate();

    const todaySessions = await Slot.countDocuments({
      startAt: { $gte: startOfDayUTC, $lte: endOfDayUTC },
      isDeleted: false,
    });


    // =======================
    // 🔥 الحجوزات النشطة
    // =======================
    const activeBookings = await Booking.countDocuments({
      status: "booked",
    }).then(async (count) => {
      const bookings = await Booking.find({ status: "booked" }).populate(
        "slot"
      );
      return bookings.filter(
        (b) => b.slot && b.slot.endAt && b.slot.endAt >= nowUTC
      ).length;
    });

    // =======================
    // 🌈 الأسبوع القادم (الأحد → السبت)
    // =======================
    const weekStartLocal = nowLocal.startOf("week").minus({ days: 1 });
    const nextWeekStartLocal = weekStartLocal.plus({ weeks: 1 });
    const nextWeekEndLocal = nextWeekStartLocal.plus({ days: 6 }).endOf("day");

    const nextWeekStartUTC = nextWeekStartLocal.toUTC().toJSDate();
    const nextWeekEndUTC = nextWeekEndLocal.toUTC().toJSDate();

    const upcomingWeekSessions = await Slot.countDocuments({
      startAt: { $gte: nextWeekStartUTC, $lte: nextWeekEndUTC },
      isDeleted: false,
    });

    // =======================
    // 🔢 أرقام عامة
    // =======================
    const completedAgg = await Booking.aggregate([
      { $match: { status: "booked" } },
      {
        $lookup: {
          from: "slots",
          localField: "slot",
          foreignField: "_id",
          as: "slot",
        },
      },
      { $unwind: "$slot" },
      { $match: { "slot.endAt": { $lt: nowUTC } } },
      { $count: "count" },
    ]);

    const completedBookings = completedAgg[0]?.count || 0;
    const [totalUsers, blockedUsers, totalBookings, cancelled, totalSlots] =
      await Promise.all([
        // 👤 كل المستخدمين ما عدا السوبر أدمن
        User.countDocuments({ isSuperAdmin: { $ne: true } }),

        // 🚫 المحظورون (بدون سوبر أدمن)
        User.countDocuments({
          isBlocked: true,
          isSuperAdmin: { $ne: true },
        }),

        Booking.countDocuments(),
        Booking.countDocuments({ status: "cancelled" }),
        Slot.countDocuments({ isDeleted: false }),
      ]);

    // =======================
    // 📤 Response
    // =======================
    res.json({
      totalUsers,
      activeUsers: totalUsers - blockedUsers,
      blockedUsers,
      totalBookings,
      activeBookings,
      cancelled,
      completedBookings,
      totalSlots,
      todaySessions,
      upcomingWeekSessions,
      dailyBookings,
    });
  } catch (error) {
    console.error("❌ Error in getDashboardStats:", error);
    res.status(500).json({ code: "ADMIN_STATS_ERROR" });
  }
};

// =======================
// 🟦 جلب القوالب
// =======================
export const getWeekTemplates = async (req, res) => {
  try {
    const templates = await WeekTemplate.find().sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "ADMIN_TEMPLATES_FETCH_ERROR" });
  }
};

// =======================
// 🟦 حذف قالب أسبوعي
// =======================
export const deleteWeekTemplate = async (req, res) => {
  try {
    const template = await WeekTemplate.findByIdAndDelete(req.params.id);
    if (!template) {
      return res.status(404).json({ code: "ADMIN_TEMPLATE_NOT_FOUND" });
    }

    res.json({ code: "ADMIN_TEMPLATE_DELETE_SUCCESS" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "ADMIN_TEMPLATE_DELETE_ERROR" });
  }
};

// =======================
// 🟦 حالة المجدول
// =======================
export const getSchedulerStatus = async (req, res) => {
  try {
    res.json({
      active: true,
      lastRun: global.lastSchedulerRun || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: "ADMIN_SCHEDULER_STATUS_ERROR" });
  }
};

// =======================
// 👥 جلب المستخدمين
// =======================
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select(
        "username email phone allowExtraBookings role isSuperAdmin isBlocked createdAt height weight age gender subscriptionEnd subscriptionStart"
      )
      .sort({ createdAt: -1 });

    const usersWithBookings = await Promise.all(
      users.map(async (u) => {
        const totalBookings = await Booking.countDocuments({ user: u._id });
        return { ...u.toObject(), totalBookings };
      })
    );

    res.json(usersWithBookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "ADMIN_USERS_FETCH_ERROR" });
  }
};

// =======================
// 🚫 حظر مشتركة
// =======================
export const toggleUserBlock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ code: "ADMIN_USER_NOT_FOUND" });
    }

    if (user.role === "admin") {
      return res.status(403).json({ code: "ADMIN_CANNOT_BLOCK_ADMIN" });
    }

    const newStatus = !user.isBlocked;

    await User.updateOne({ _id: user._id }, { $set: { isBlocked: newStatus } });

    const updatedUser = await User.findById(user._id).select(
      "username email phone allowExtraBookings role isBlocked createdAt height weight age gender subscriptionEnd subscriptionStart"
    );

    res.json({
      code: newStatus ? "ADMIN_BLOCK_SUCCESS" : "ADMIN_UNBLOCK_SUCCESS",
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ toggleUserBlock error:", error);
    res.status(500).json({ code: "ADMIN_BLOCK_ERROR" });
  }
};

// =======================
// 📩 إرسال إشعار مخصّص (Push فقط)
// =======================
export const sendCustomNotification = async (req, res) => {
  try {
    const { title, body, target } = req.body;
    const adminUser = req.user?._id;

    // 🔍 Required fields
    if (!title || !body) {
      return res.status(400).json({
        code: "ADMIN_NOTIFICATION_FIELDS_REQUIRED",
      });
    }

    let users = [];

    // ==========================================
    // 1) Send to all users
    // ==========================================
    if (target === "all") {
      users = await User.find({ isBlocked: false });
    }

    // ==========================================
    // 2) Send to a specific user
    // ==========================================
    else if (!target.startsWith("slot:")) {
      const user = await User.findById(target);

      if (!user) {
        return res.status(404).json({
          code: "ADMIN_NOTIFICATION_USER_NOT_FOUND",
        });
      }

      users = [user];
    }

    // ==========================================
    // 3) Send to members of a session (slot:<id>)
    // ==========================================
    else if (target.startsWith("slot:")) {
      const slotId = target.split(":")[1];

      const bookings = await Booking.find({
        slot: slotId,
        status: "booked",
      }).populate("user");

      users = bookings.map((b) => b.user).filter(Boolean);

      if (!users.length) {
        return res.status(400).json({
          code: "ADMIN_NOTIFICATION_NO_TARGETS",
        });
      }
    }

    // No users found
    if (!users.length) {
      return res.status(400).json({
        code: "ADMIN_NOTIFICATION_NO_TARGETS",
      });
    }

    // ==========================================
    // Send notifications
    // ==========================================
    let totalSuccess = 0;
    let totalFail = 0;

    for (const u of users) {
      const result = await sendSmartNotification({
        user: u,
        title,
        body,
        channel: "push",
      });

      totalSuccess += result.successCount || 0;
      totalFail += result.failureCount || 0;
    }

    // ==========================================
    // Save to notifications history
    // ==========================================
    const isSlotNotification = target?.startsWith("slot:");

    if (!isSlotNotification) {
      await Notification.create({
        title,
        body,

        targetType: target === "all" ? "all" : "user",
        targetUser: target === "all" ? null : target,

        sentBy: adminUser,
        successCount: totalSuccess,
        failureCount: totalFail,
        channel: "push",
      });
    }

    // ==========================================
    // Response
    // ==========================================
    return res.json({
      code: "ADMIN_NOTIFICATION_SENT",
      targetCount: users.length,
      successCount: totalSuccess,
      failureCount: totalFail,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    return res.status(500).json({
      code: "ADMIN_NOTIFICATION_ERROR",
    });
  }
};

// =======================
// 🗂️ جلب سجل الإشعارات
// =======================
export const getNotificationsHistory = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("targetUser", "username email")
      .populate("sentBy", "username email");

    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "ADMIN_NOTIFICATIONS_FETCH_ERROR" });
  }
};

// =======================
// ⚙️ الإعدادات
// =======================
export const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();

    if (!settings) {
      settings = await Setting.create({
        clubName: "",
        contactNumber: "",
        autoMessage: "",
        allowExtraBookingsByDefault: false,
        logoUrl: "",
        cardUrl: "",
      });
    }

    res.json(settings);
  } catch (error) {
    console.error("❌ خطأ أثناء جلب الإعدادات:", error);
    res.status(500).json({ code: "ADMIN_SETTINGS_FETCH_FAILED" });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const updateData = {};
    const fields = [
      "clubName",
      "contactNumber",
      "autoMessage",
      "allowExtraBookingsByDefault",
      "logoUrl",
      "cardUrl",
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    const settings = await Setting.findOneAndUpdate(
      {},
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.json({
      code: "ADMIN_SETTINGS_UPDATE_SUCCESS",
      settings,
    });
  } catch (error) {
    console.error("❌ خطأ أثناء تحديث الإعدادات:", error);
    res.status(500).json({ code: "ADMIN_SETTINGS_UPDATE_FAILED" });
  }
};

// =======================
// 🖼️ رفع الشعار
// =======================
export const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: "ADMIN_LOGO_REQUIRED" });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const logoUrl = `${baseUrl}/uploads/${req.file.filename}`;

    let settings = await Setting.findOne();
    if (!settings) settings = new Setting();

    settings.logoUrl = logoUrl;
    await settings.save();

    res.json({
      code: "ADMIN_LOGO_UPDATE_SUCCESS",
      logoUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "ADMIN_LOGO_UPLOAD_FAILED" });
  }
};

// =======================
// ✏️ تعديل بيانات مشتركة
// =======================


export const updateUserByAdmin = async (req, res) => {
  try {
    const admin = req.user;
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ code: "ADMIN_UNAUTHORIZED" });
    }

    const { id } = req.params;

    const {
      username,
      email,
      phone,
      gender,
      height,
      weight,
      age,
      role,
      subscriptionEnd,
      password, // ⭐ كلمة المرور الجديدة
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ code: "ADMIN_USER_NOT_FOUND" });
    }

    // 🔒 لا يمكن خفض رتبة آخر أدمين
    if (user.role === "admin" && role === "user") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ code: "ADMIN_LAST_ADMIN_ERROR" });
      }
    }

    // 🟦 تحديث الحقول العادية
    if (username !== undefined) user.username = username;
    if (email !== undefined && email.trim() !== "") user.email = email.trim();
    if (phone !== undefined) user.phone = phone;
    if (gender !== undefined) user.gender = gender;
    if (height !== undefined) user.height = height;
    if (weight !== undefined) user.weight = weight;
    if (age !== undefined) user.age = age;

    if (role !== undefined && ["admin", "user"].includes(role)) {
      user.role = role;
    }

    // ⭐ تجديد الاشتراك
    if (subscriptionEnd !== undefined && subscriptionEnd !== null) {
      user.subscriptionEnd = new Date(subscriptionEnd);
      user.isBlocked = false;
    }

    // 🔐 تغيير كلمة المرور
    let passwordChanged = false;

    if (password && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password.trim(), salt);
      passwordChanged = true;
    }

    await user.save();

    // 🔔 إرسال إشعار عند تغيير كلمة المرور فقط
    if (passwordChanged) {
      const lang = user.preferredLanguage || "he";

      const message =
        NOTIFICATION_MESSAGES.passwordChanged[lang] ||
        NOTIFICATION_MESSAGES.passwordChanged.ar;

      await sendSmartNotification({
        user,
        title: message.title,
        body: message.body,
        channel: "push",
        type: "SECURITY_ALERT",
        url: "/profile",
      });
    }


    const safeUser = user.toObject();
    delete safeUser.passwordHash;

    res.json({
      code: "ADMIN_USER_UPDATE_SUCCESS",
      user: safeUser,
    });
  } catch (err) {
    console.error("❌ Update User Error:", err);
    res.status(500).json({ code: "ADMIN_SERVER_ERROR" });
  }
};


// =======================
// 📌 تلخيص الحجوزات
// =======================
// =======================
// 📌 تلخيص الحجوزات (UTC-safe)
// =======================

export const getBookingsSummary = async (req, res) => {
  try {
    const nowUTC = DateTime.now().setZone(ZONE).toUTC().toJSDate();

    const users = await User.find({ role: "user" }).select("username email");

    const data = await Promise.all(
      users.map(async (u) => {
        const bookings = await Booking.find({ user: u._id }).populate("slot");

        let active = 0;
        let cancelled = 0;
        let completed = 0;

        bookings.forEach((b) => {
          // ملغى
          if (b.status === "cancelled") {
            cancelled++;
            return;
          }

          // بدون حصة
          if (!b.slot || !b.slot.endAt) {
            return;
          }

          // محجوب
          if (b.slot.isBlocked) {
            completed++;
            return;
          }

          // نشط / منتهٍ
          if (b.status === "booked") {
            if (b.slot.endAt >= nowUTC) active++;
            else completed++;
          }
        });

        return {
          userId: u._id,
          username: u.username,
          email: u.email,
          active,
          cancelled,
          completed,
        };
      })
    );

    res.json(data);
  } catch (err) {
    console.error("❌ Error in getBookingsSummary:", err);
    res.status(500).json({ code: "ADMIN_BOOKING_SUMMARY_ERROR" });
  }
};

// =======================
// 📌 حجوزات مستخدمة محددة
// =======================
// =======================
// 📌 حجوزات مستخدم محدد (UTC-safe)
// =======================

export const getUserBookings = async (req, res) => {
  try {
    const { id } = req.params;

    const nowUTC = DateTime.now().setZone(ZONE).toUTC().toJSDate();

    const bookings = await Booking.find({ user: id })
      .populate("slot", "startAt endAt isBlocked")
      .sort({ "slot.startAt": -1 });

    const result = bookings.map((b) => {
      let status = b.status;

      if (b.status === "booked" && b.slot?.endAt) {
        if (b.slot.isBlocked) {
          status = "blocked";
        } else if (b.slot.endAt < nowUTC) {
          status = "completed";
        }
      }

      return {
        _id: b._id,
        status,
        createdAt: b.createdAt,
        slot: b.slot
          ? {
            startAt: b.slot.startAt,
            endAt: b.slot.endAt,
            isBlocked: b.slot.isBlocked,
          }
          : null,
      };
    });

    res.json(result);
  } catch (err) {
    console.error("❌ Error in getUserBookings:", err);
    res.status(500).json({ code: "ADMIN_USER_BOOKINGS_ERROR" });
  }
};

// =======================
// 🗑️ حذف إشعار واحد
// =======================
export const deleteNotificationById = async (req, res) => {
  try {
    const id = req.params.id;

    const deleted = await Notification.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ code: "ADMIN_NOTIFICATION_NOT_FOUND" });
    }

    res.json({ code: "ADMIN_NOTIFICATION_DELETE_SUCCESS" });
  } catch (err) {
    console.error("❌ deleteNotificationById error:", err);
    res.status(500).json({ code: "ADMIN_NOTIFICATION_DELETE_FAIL" });
  }
};

// =======================
// 🧹 مسح كل الإشعارات
// =======================
export const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ code: "ADMIN_NOTIFICATIONS_CLEAR_SUCCESS" });
  } catch (err) {
    console.error("❌ clearAllNotifications error:", err);
    res.status(500).json({ code: "ADMIN_NOTIFICATIONS_CLEAR_FAIL" });
  }
};

export const deleteUserCompletely = async (req, res) => {
  try {
    const userId = req.params.id;

    // 🔍 تحقق من وجود المستخدم المراد حذفه
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ code: "ADMIN_DELETE_USER_NOT_FOUND" });
    }

    // 🔐 1) فقط المدير الرئيسي يستطيع الحذف
    if (!req.user.isSuperAdmin) {
      return res.status(403).json({ code: "ADMIN_DELETE_NOT_ALLOWED" });
    }

    // 🔐 2) ممنوع حذف المدير الرئيسي نهائيًا
    if (targetUser.isSuperAdmin) {
      return res
        .status(403)
        .json({ code: "ADMIN_DELETE_SUPERADMIN_FORBIDDEN" });
    }

    // 🔐 3) ممنوع أن يحذف المدير الرئيسي نفسه
    if (req.user._id.toString() === targetUser._id.toString()) {
      return res.status(403).json({ code: "ADMIN_DELETE_SELF_FORBIDDEN" });
    }

    // ============================
    // 🔥 تنفيذ الحذف الكامل
    // ============================

    // حذف حجوزاته
    const bookings = await Booking.find({ user: userId });
    for (let b of bookings) {
      if (b.googleEventId) {
        await deleteGoogleEvent(b.googleEventId).catch(() => { });
      }
    }

    await Booking.deleteMany({ user: userId });

    // حذف من الـ Slots
    await Slot.updateMany(
      { attendees: userId },
      { $pull: { attendees: userId } }
    );

    // حذف الإشعارات
    await Notification.deleteMany({
      targetType: "user",
      targetUser: userId,
    });
    // حذف المستخدم نفسه
    await User.findByIdAndDelete(userId);

    return res.json({ code: "ADMIN_DELETE_SUCCESS" });
  } catch (error) {
    console.error("❌ Error in deleteUserCompletely:", error);
    return res.status(500).json({ code: "ADMIN_DELETE_ERROR" });
  }
};

// ======================================================
// 🛡️ تحقق سوبر أدمن
// ======================================================
function assertSuperAdmin(req, res) {
  if (!req.user?.isSuperAdmin) {
    res.status(403).json({ code: "ADMIN_RESET_NOT_ALLOWED" });
    return false;
  }
  return true;
}

// ======================================================
// 🛑 إيقاف وتنظيف Agenda
// ======================================================
async function stopAndCleanAgenda() {
  if (agenda) {
    await agenda.stop();
  }

  // حذف كل jobs المخزنة
  const collections = await mongoose.connection.db.listCollections().toArray();
  const agendaCollectionExists = collections.some(
    (c) => c.name === "agendaJobs"
  );

  if (agendaCollectionExists) {
    await mongoose.connection.collection("agendaJobs").deleteMany({});
  }
}

// ======================================================
// 🚀 إعادة تشغيل Agenda
// ======================================================
async function restartAgenda() {
  if (agenda) {
    await agenda.start();
  }
}

// ======================================================
// 🔹 Reset Light
// ======================================================
export const resetLight = async (req, res) => {
  try {
    if (!assertSuperAdmin(req, res)) return;

    await stopAndCleanAgenda();

    await Promise.all([
      Booking.deleteMany({}),
      Notification.deleteMany({}),
      Slot.deleteMany({}),
      WeekTemplate.deleteMany({}),
    ]);

    await restartAgenda();

    res.json({ code: "ADMIN_RESET_LIGHT_SUCCESS" });
  } catch (error) {
    console.error("❌ resetLight:", error);
    res.status(500).json({ code: "ADMIN_RESET_LIGHT_ERROR" });
  }
};

// ======================================================
// 🔸 Reset Medium
// ======================================================
export const resetMedium = async (req, res) => {
  try {
    if (!assertSuperAdmin(req, res)) return;

    const superAdminId = req.user._id;

    await stopAndCleanAgenda();

    await Promise.all([
      Booking.deleteMany({}),
      Notification.deleteMany({}),
      Slot.deleteMany({}),
      WeekTemplate.deleteMany({}),
      Setting.deleteMany({}),
      User.deleteMany({ _id: { $ne: superAdminId } }),
    ]);

    await restartAgenda();

    res.json({ code: "ADMIN_RESET_MEDIUM_SUCCESS" });
  } catch (error) {
    console.error("❌ resetMedium:", error);
    res.status(500).json({ code: "ADMIN_RESET_MEDIUM_ERROR" });
  }
};

// ======================================================
// 🔴 Reset Hard
// ======================================================
export const resetHard = async (req, res) => {
  try {
    if (!assertSuperAdmin(req, res)) return;

    const superAdminId = req.user._id;

    await stopAndCleanAgenda();

    await Promise.all([
      Booking.deleteMany({}),
      Notification.deleteMany({}),
      Slot.deleteMany({}),
      WeekTemplate.deleteMany({}),
      Setting.deleteMany({}),
      User.deleteMany({ _id: { $ne: superAdminId } }),
    ]);

    // 🗑️ حذف الملفات من uploads
    const uploadsPath = path.join(process.cwd(), "uploads");
    if (fs.existsSync(uploadsPath)) {
      const files = fs.readdirSync(uploadsPath);
      for (const file of files) {
        fs.unlinkSync(path.join(uploadsPath, file));
      }
    }

    await restartAgenda();

    res.json({ code: "ADMIN_RESET_HARD_SUCCESS" });
  } catch (error) {
    console.error("❌ resetHard:", error);
    res.status(500).json({ code: "ADMIN_RESET_HARD_ERROR" });
  }
};

// ======================================================
// 🏭 Reset Factory (أقوى Reset)
// ======================================================
export const resetFactory = async (req, res) => {
  try {
    if (!assertSuperAdmin(req, res)) return;

    if (agenda) {
      await agenda.stop();
    }

    // 🔥 حذف كامل قاعدة البيانات
    await mongoose.connection.dropDatabase();

    if (agenda) {
      await agenda.start();
    }

    res.json({ code: "ADMIN_RESET_FACTORY_SUCCESS" });
  } catch (error) {
    console.error("❌ resetFactory:", error);
    res.status(500).json({ code: "ADMIN_RESET_FACTORY_ERROR" });
  }
};
