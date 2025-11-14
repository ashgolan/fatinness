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
// 📸 إعداد مكان حفظ الصور
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, "logo" + ext); // اسم ثابت
  },
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("الملف يجب أن يكون صورة"));
  },
});

/**
 * 🔹 إنشاء قالب أسبوعي جديد (Week Template)
 */
export const createWeekTemplate = async (req, res) => {
  try {
    const { name, slots } = req.body;
    if (!name || !slots?.length) {
      return res
        .status(400)
        .json({ message: "Template name and slots required" });
    }
    const template = await WeekTemplate.create({ name, slots });
    res.status(201).json({ message: "Template created", template });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating template" });
  }
};

/**
 * 🔹 تطبيق قالب أسبوعي على تواريخ محددة
 */
import { parseLocalDate } from "../utils/date.js";

export const applyTemplate = async (req, res) => {
  try {
    const { templateId, startDate } = req.body;
    const template = await WeekTemplate.findById(templateId);
    if (!template)
      return res.status(404).json({ message: "Template not found" });

    // ✅ استخدم تاريخ محلي بدلاً من new Date
    const start = parseLocalDate(startDate); // مثال: "2025-11-14"

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
      message: "Template applied successfully",
      created: createdSlots.length,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error applying template", error: error.message });
  }
};

/**
 * 🔹 تمكين/تعطيل الحجز الإضافي لمستخدم
 */
export const setUserExtraBooking = async (req, res) => {
  try {
    const { userId, allow } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.allowExtraBookings = !!allow;
    await user.save();

    res.json({ message: "User updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating user" });
  }
};

/**
 * 🔹 تصدير تقرير CSV بالحضور والإحصاءات
 */
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
      return res.status(404).json({ message: "لا توجد بيانات لتصديرها" });
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
    res.status(200).end("\uFEFF" + csvData); // BOM لترميز عربي صحيح
  } catch (error) {
    console.error("خطأ أثناء تصدير التقرير:", error);
    res.status(500).json({ message: "فشل تصدير التقرير" });
  }
};

/**
 * 🔹 لوحة الإحصاءات: نسب الحضور وعدد المستخدمين والأنشطة
 */
export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 6);

    // 🔹 الحجوزات الأسبوعية للرسم البياني
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

    // 🧮 حساب جلسات اليوم (كل جلسات اليوم حتى المنتهية)
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const todaySessions = await Slot.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    // 🧮 حساب الحجوزات النشطة فعليًا (التي لم تنتهِ بعد)
    const booked = await Booking.find({ status: "booked" }).populate("slot");
    const activeBookings = booked.filter((b) => {
      if (!b.slot || !b.slot.endTime) return false;
      const [h, m] = b.slot.endTime.split(":").map(Number);
      const end = new Date(b.slot.date);
      end.setHours(h, m, 0, 0);
      return end >= now;
    }).length;

    // 🧮 بقية الإحصاءات
    const [
      totalUsers,
      blockedUsers,
      totalBookings,
      cancelled,
      completedBookings,
      totalSlots,
      upcomingWeekSessions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBlocked: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "cancelled" }),
      Booking.countDocuments({ status: "completed" }),
      Slot.countDocuments(),
      Slot.countDocuments({
        date: {
          $gte: new Date(),
          $lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    // 🔹 الإخراج النهائي
    res.json({
      totalUsers,
      activeUsers: totalUsers - blockedUsers,
      blockedUsers,
      totalBookings,
      activeBookings, // ✅ الآن فعليًا صحيحة
      cancelled,
      completedBookings,
      totalSlots,
      todaySessions, // ✅ الآن تُظهر عدد جلسات اليوم الحقيقي
      upcomingWeekSessions,
      dailyBookings,
    });
  } catch (error) {
    console.error("❌ Error in getDashboardStats:", error);
    res.status(500).json({ message: "Error fetching stats" });
  }
};

/**
 * 🔹 جلب جميع القوالب الأسبوعية
 */
export const getWeekTemplates = async (req, res) => {
  try {
    const templates = await WeekTemplate.find().sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching templates" });
  }
};

/**
 * 🔹 حذف قالب أسبوعي
 */
export const deleteWeekTemplate = async (req, res) => {
  try {
    const template = await WeekTemplate.findByIdAndDelete(req.params.id);
    if (!template)
      return res.status(404).json({ message: "Template not found" });
    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting template" });
  }
};

/**
 * 🔹 فحص حالة المجدول التلقائي
 */
export const getSchedulerStatus = async (req, res) => {
  try {
    const status = {
      active: true,
      lastRun: global.lastSchedulerRun || null,
    };
    res.json(status);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "تعذر جلب حالة المجدول" });
  }
};

/**
 * 🔹 جلب جميع المستخدمين لعرضهم في لوحة الإدارة
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select(
        "username email phone allowExtraBookings role isBlocked createdAt"
      )
      .sort({ createdAt: -1 });

    const usersWithBookings = await Promise.all(
      users.map(async (u) => {
        // نحسب مجموع الحجوزات التي تم إنشاؤها (لإعطاء فكرة عن نشاط الحساب)
        const totalBookings = await Booking.countDocuments({ user: u._id });
        return { ...u.toObject(), totalBookings };
      })
    );

    res.json(usersWithBookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

/**
 * 🔹 حظر أو إلغاء حظر مستخدم
 */
export const toggleUserBlock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "admin") {
      return res.status(403).json({ message: "لا يمكن حظر مديرة النظام 👑" });
    }

    const newStatus = !user.isBlocked;
    await User.updateOne({ _id: user._id }, { $set: { isBlocked: newStatus } });

    const updatedUser = await User.findById(user._id).select(
      "username email phone role allowExtraBookings isBlocked"
    );

    return res.json({
      message: newStatus
        ? "🚫 تم حظر المشتركة بنجاح"
        : "🔓 تم إلغاء الحظر عن المشتركة",
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ toggleUserBlock error:", error);
    res.status(500).json({ message: "حدث خطأ أثناء تغيير حالة الحظر" });
  }
};

/**
 * 🔹 إرسال إشعار مخصص وتسجيله في قاعدة البيانات
 */

export const sendCustomNotification = async (req, res) => {
  try {
    const { title, body, target, channel = "auto" } = req.body;
    const adminUser = req.user?._id;

    if (!title || !body)
      return res
        .status(400)
        .json({ message: "الرجاء إدخال العنوان والمحتوى." });

    // 📦 تحديد الفئة المستهدفة
    let users = [];
    if (target === "all") {
      users = await User.find({ isBlocked: false });
    } else {
      const user = await User.findById(target);
      if (!user)
        return res.status(404).json({ message: "لم يتم العثور على المشتركة." });
      users = [user];
    }

    if (!users.length)
      return res.status(400).json({ message: "لا توجد مشتركات مستهدفات." });

    // 📤 إرسال الإشعارات
    let totalSuccess = 0;
    let totalFail = 0;
    let viaWhatsApp = 0;
    let viaPush = 0;

    for (const u of users) {
      let result;

      // ✅ تحديد نوع القناة
      if (channel === "fcm") {
        result = await sendFCMNotification(u.fcmTokens, title, body);
        if (result.success) viaPush++;
      } else {
        result = await sendSmartNotification({ user: u, title, body });
        if (result.via === "push") viaPush++;
        if (result.via === "whatsapp") viaWhatsApp++;
      }

      totalSuccess += result.successCount || (result.success ? 1 : 0);
      totalFail += result.failureCount || 0;
    }

    // 🧾 حفظ في السجل
    await Notification.create({
      title,
      body,
      targetType: target === "all" ? "all" : "user",
      targetUser: target === "all" ? null : target,
      sentBy: adminUser,
      successCount: totalSuccess,
      failureCount: totalFail,
      channel: channel, // ✅ حفظ نوع القناة المستخدَمة
    });

    // 📩 الرد إلى الواجهة
    res.json({
      message: `✅ تم إرسال الإشعار بنجاح إلى ${users.length} مشتركة.`,
      successCount: totalSuccess,
      failureCount: totalFail,
      details: {
        viaPush,
        viaWhatsApp,
        mode: channel,
      },
    });
  } catch (error) {
    console.error("❌ خطأ أثناء إرسال الإشعار:", error);
    res.status(500).json({ message: "حدث خطأ أثناء إرسال الإشعار." });
  }
};

/**
 * 🔹 جلب سجل الإشعارات
 */
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
    res.status(500).json({ message: "تعذر جلب سجل الإشعارات" });
  }
};

/**
 * 🔹 جلب الإعدادات الحالية
 */
export const getSettings = async (req, res) => {
  try {
    // 🔹 البحث عن الإعدادات
    let settings = await Setting.findOne();

    // 🔹 إذا لم توجد، أنشئ إعدادات جديدة فارغة وأعدها مباشرة
    if (!settings) {
      settings = await Setting.create({
        clubName: "",
        contactNumber: "",
        autoMessage: "",
        allowExtraBookingsByDefault: false,
        logoUrl: "",
        cardUrl: "",
      });
      console.log("✅ تم إنشاء إعدادات جديدة افتراضيًا");
    }

    // ✅ إعادة الإعدادات كما هي (وليس داخل كائن)
    res.json(settings);
  } catch (error) {
    console.error("❌ خطأ أثناء جلب الإعدادات:", error);
    res.status(500).json({ message: "فشل جلب الإعدادات" });
  }
};

/**
 * 🔹 تحديث الإعدادات
 */
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

    // ✅ فقط الحقول المرسلة يتم تحديثها
    for (const field of fields) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    // ✅ تحديث السجل الوحيد أو إنشاؤه في حال لم يوجد (بأمان)
    const settings = await Setting.findOneAndUpdate(
      {}, // الشرط: أول سجل فقط
      { $set: updateData },
      { new: true, upsert: true } // ✅ أنشئه إن لم يكن موجودًا
    );

    res.json({
      message: "✅ تم تحديث الإعدادات بنجاح",
      settings,
    });
  } catch (error) {
    console.error("❌ خطأ أثناء تحديث الإعدادات:", error);
    res.status(500).json({ message: "فشل تحديث الإعدادات", error });
  }
};

/**
 * 🔹 رفع شعار جديد للنادي
 */
export const uploadLogo = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "يرجى اختيار صورة للشعار" });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const logoUrl = `${baseUrl}/uploads/${req.file.filename}`;

    let settings = await Setting.findOne();
    if (!settings) settings = new Setting();
    settings.logoUrl = logoUrl;
    await settings.save();

    res.json({ message: "تم تحديث الشعار بنجاح ✅", logoUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "فشل رفع الشعار" });
  }
};

/**
 * 🔹 تعديل بيانات مشتركة (فقط للمديرة)
 */
export const updateUserByAdmin = async (req, res) => {
  try {
    const admin = req.user;
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { username, email, phone, gender, height, weight, age, role } =
      req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 🔒 منع إزالة آخر مديرة
    if (user.role === "admin" && role === "user") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res
          .status(400)
          .json({ message: "❌ لا يمكن إزالة آخر مديرة في النظام" });
      }
    }

    // ✅ تحديث البيانات الأساسية
    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (gender !== undefined) user.gender = gender;
    if (height !== undefined) user.height = height;
    if (weight !== undefined) user.weight = weight;
    if (age !== undefined) user.age = age;

    // ✅ تحديث الدور إن وجد
    if (role !== undefined && ["admin", "user"].includes(role)) {
      user.role = role;
    }

    await user.save();

    res.json({ message: "User updated successfully ✅", user });
  } catch (err) {
    console.error("❌ Update User Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 🔹 تلخيص الحجوزات لكل مشتركة (عدد النشطة / الملغاة / المنجزة)
 */
export const getBookingsSummary = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("username email");

    const now = new Date();
    const data = await Promise.all(
      users.map(async (u) => {
        const bookings = await Booking.find({ user: u._id }).populate("slot");

        // 🔹 نفس منطق الواجهة لتحديد الحالة الفعلية
        const getDisplayStatus = (b) => {
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

        // 🔹 حساب الحالات الدقيقة
        let active = 0;
        let cancelled = 0;
        let completed = 0;

        bookings.forEach((b) => {
          const status = getDisplayStatus(b);
          if (status === "booked") active++;
          else if (status === "cancelled") cancelled++;
          else if (status === "completed") completed++;
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
    res.status(500).json({ message: "Error fetching booking summary" });
  }
};

/**
 * 🔹 جلب تفاصيل حجوزات مشتركة معينة (لعرضها عند الضغط على "عرض")
 */
export const getUserBookings = async (req, res) => {
  try {
    const { id } = req.params; // userId
    const bookings = await Booking.find({ user: id })
      .populate("slot", "date startTime endTime isBlocked") // ← أضف isBlocked هنا
      .sort({ "slot.date": -1 });

    res.json(bookings);
  } catch (err) {
    console.error("❌ Error in getUserBookings:", err);
    res.status(500).json({ message: "Error fetching user bookings" });
  }
};

export const adminGetSlotBookings = async (req, res) => {
  try {
    // ✅ تحويل id إلى ObjectId لضمان التطابق الصحيح
    const slotId = new mongoose.Types.ObjectId(req.params.id);

    const bookings = await Booking.find({ slot: slotId }).populate(
      "user",
      "username phone name email"
    );

    // 🔹 إرسال النتيجة بالشكل المتوقع للواجهة
    res.json({ bookings });
  } catch (err) {
    console.error("❌ Error loading slot bookings:", err);
    res.status(500).json({ message: "خطأ في تحميل حجوزات الحصة" });
  }
};

export const deleteNotificationById = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Notification.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "الإشعار غير موجود" });
    }

    return res.json({ message: "🗑️ تم حذف الإشعار بنجاح" });
  } catch (err) {
    console.error("❌ deleteNotificationById error:", err);
    return res.status(500).json({ message: "فشل حذف الإشعار" });
  }
};
export const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({});
    return res.json({ message: "🧹 تم مسح سجل الإشعارات بالكامل" });
  } catch (err) {
    console.error("❌ clearAllNotifications error:", err);
    return res.status(500).json({ message: "فشل مسح سجل الإشعارات" });
  }
};
