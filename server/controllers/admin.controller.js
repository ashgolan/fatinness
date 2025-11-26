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
import { fmtLocal } from "../utils/date.js";
import mongoose from "mongoose";
import { sendSmartNotification } from "../utils/notify.js";
import { sendFcmToTokens as sendFCMNotification } from "../utils/fcm.js";
import { parseLocalDate } from "../utils/date.js";

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

// =======================
// 🟦 تطبيق القالب
// =======================
export const applyTemplate = async (req, res) => {
  try {
    const { templateId, startDate } = req.body;

    const template = await WeekTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ code: "ADMIN_TEMPLATE_NOT_FOUND" });
    }

    const start = parseLocalDate(startDate);
    const createdSlots = [];

    for (const slot of template.slots) {
      const slotDate = new Date(start);
      slotDate.setDate(start.getDate() + slot.dateOffset);

      const exists = await Slot.findOne({
        date: slotDate,
        startTime: slot.startTime,
      });

      if (!exists) {
        const newSlot = await Slot.create({
          date: slotDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
          capacity: slot.capacity,
          templateId: template._id,
        });
        createdSlots.push(newSlot);
      }
    }

    res.json({
      code: "ADMIN_TEMPLATE_APPLIED",
      created: createdSlots.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "ADMIN_TEMPLATE_APPLY_ERROR" });
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
export const exportAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};
    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const bookings = await Booking.find(filter)
      .populate("user", "username email phone")
      .populate("slot", "date startTime endTime isBlocked")
      .sort({ createdAt: -1 });

    if (!bookings.length) {
      return res.status(404).json({ code: "ADMIN_REPORT_NO_DATA" });
    }

    const csv = createObjectCsvStringifier({
      header: [
        { id: "username", title: "الاسم" },
        { id: "email", title: "البريد" },
        { id: "phone", title: "الهاتف" },
        { id: "date", title: "تاريخ الجلسة" },
        { id: "time", title: "الوقت" },
        { id: "status", title: "الحالة" },
        { id: "createdAt", title: "تاريخ الحجز" },
      ],
    });

    const records = bookings.map((b) => {
      const timeStr =
        b.slot?.startTime && b.slot?.endTime
          ? `${b.slot.startTime} - ${b.slot.endTime}`
          : b.slot?.startTime || "—";

      let statusStr = "—";
      if (b.status === "booked") statusStr = "نشط ✅";
      else if (b.status === "cancelled") statusStr = "ملغى ❌";
      else if (b.status === "completed") statusStr = "منجز ✅";

      return {
        username: b.user?.username || "—",
        email: b.user?.email || "—",
        phone: b.user?.phone || "—",
        date: b.slot?.date
          ? new Date(b.slot.date).toLocaleDateString("ar-EG")
          : "—",
        time: timeStr,
        status: statusStr,
        createdAt: new Date(b.createdAt).toLocaleString("ar-EG"),
      };
    });

    const csvData = csv.getHeaderString() + csv.stringifyRecords(records);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=bookings-report.csv"
    );

    res.status(200).end("\uFEFF" + csvData);
  } catch (error) {
    console.error("خطأ أثناء تصدير التقرير:", error);
    res.status(500).json({ code: "ADMIN_REPORT_EXPORT_ERROR" });
  }
};

// =======================
// 📊 Dashboard
// =======================
export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();

    // 📅 آخر 7 أيام
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 6);

    const last7 = await Booking.aggregate([
      { $match: { createdAt: { $gte: startOfWeek } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const dailyBookings = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const dateStr = fmtLocal(day);

      const getCount = (status) =>
        last7.find((d) => d._id.date === dateStr && d._id.status === status)
          ?.count || 0;

      dailyBookings.push({
        date: dateStr,
        active: getCount("booked"),
        cancelled: getCount("cancelled"),
        completed: getCount("completed"),
      });
    }

    // ☀️ جلسات اليوم
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const todaySessions = await Slot.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    // 🔥 الحجوزات النشطة (غير منتهية)
    const booked = await Booking.find({ status: "booked" }).populate("slot");

    const activeBookings = booked.filter((b) => {
      if (!b.slot || !b.slot.endTime) return false;
      const [h, m] = b.slot.endTime.split(":").map(Number);
      const end = new Date(b.slot.date);
      end.setHours(h, m, 0, 0);
      return end >= now;
    }).length;

    // 🌈 حساب الأسبوع القادم الصحيح (الأحد → السبت)
    const today = new Date();
    const dow = today.getDay(); // 0 = Sunday

    const startOfThisWeek = new Date(today);
    startOfThisWeek.setDate(today.getDate() - dow);
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfNextWeek = new Date(startOfThisWeek);
    startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);

    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(endOfNextWeek.getDate() + 6);
    endOfNextWeek.setHours(23, 59, 59, 999);

    const upcomingWeekSessions = await Slot.countDocuments({
      date: { $gte: startOfNextWeek, $lte: endOfNextWeek },
    });

    const [
      totalUsers,
      blockedUsers,
      totalBookings,
      cancelled,
      completedBookings,
      totalSlots,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBlocked: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "cancelled" }),
      Booking.countDocuments({ status: "completed" }),
      Slot.countDocuments(),
    ]);

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
        "username email phone allowExtraBookings role isBlocked createdAt height weight age gender"
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
      "username email phone allowExtraBookings role isBlocked createdAt height weight age gender"
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

    if (!title || !body) {
      return res
        .status(400)
        .json({ code: "ADMIN_NOTIFICATION_FIELDS_REQUIRED" });
    }

    let users = [];
    if (target === "all") {
      users = await User.find({ isBlocked: false });
    } else {
      const user = await User.findById(target);
      if (!user) {
        return res
          .status(404)
          .json({ code: "ADMIN_NOTIFICATION_USER_NOT_FOUND" });
      }
      users = [user];
    }

    if (!users.length) {
      return res.status(400).json({ code: "ADMIN_NOTIFICATION_NO_TARGETS" });
    }

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

    res.json({
      code: "ADMIN_NOTIFICATION_SENT",
      targetCount: users.length,
      successCount: totalSuccess,
      failureCount: totalFail,
    });
  } catch (error) {
    console.error("❌ خطأ أثناء إرسال الإشعار:", error);
    res.status(500).json({ code: "ADMIN_NOTIFICATION_ERROR" });
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
    const { username, email, phone, gender, height, weight, age, role } =
      req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ code: "ADMIN_USER_NOT_FOUND" });
    }

    if (user.role === "admin" && role === "user") {
      const adminCount = await User.countDocuments({ role: "admin" });

      if (adminCount <= 1) {
        return res.status(400).json({ code: "ADMIN_LAST_ADMIN_ERROR" });
      }
    }

    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (gender !== undefined) user.gender = gender;
    if (height !== undefined) user.height = height;
    if (weight !== undefined) user.weight = weight;
    if (age !== undefined) user.age = age;

    if (role !== undefined && ["admin", "user"].includes(role)) {
      user.role = role;
    }

    await user.save();

    res.json({
      code: "ADMIN_USER_UPDATE_SUCCESS",
      user,
    });
  } catch (err) {
    console.error("❌ Update User Error:", err);
    res.status(500).json({ code: "ADMIN_SERVER_ERROR" });
  }
};

// =======================
// 📌 تلخيص الحجوزات
// =======================
export const getBookingsSummary = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("username email");

    const now = new Date();

    const data = await Promise.all(
      users.map(async (u) => {
        const bookings = await Booking.find({ user: u._id }).populate("slot");

        const getStatus = (b) => {
          if (!b.slot) return "unknown";
          if (b.slot.isBlocked) return "blocked";

          const end = new Date(b.slot.date);
          if (b.slot.endTime) {
            const [h, m] = b.slot.endTime.split(":");
            end.setHours(Number(h), Number(m), 0, 0);
          }

          if (b.status === "booked" && now > end) return "completed";

          return b.status;
        };

        let active = 0;
        let cancelled = 0;
        let completed = 0;

        bookings.forEach((b) => {
          const st = getStatus(b);

          if (st === "booked") active++;
          else if (st === "cancelled") cancelled++;
          else if (st === "completed") completed++;
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
export const getUserBookings = async (req, res) => {
  try {
    const { id } = req.params;

    const bookings = await Booking.find({ user: id })
      .populate("slot", "date startTime endTime isBlocked")
      .sort({ "slot.date": -1 });

    res.json(bookings);
  } catch (err) {
    console.error("❌ Error in getUserBookings:", err);
    res.status(500).json({ code: "ADMIN_USER_BOOKINGS_ERROR" });
  }
};

// =======================
// 📌 حجوزات حصة واحدة
// =======================
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
