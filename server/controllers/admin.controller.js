import User from "../models/User.js";
import Slot from "../models/Slot.js";
import WeekTemplate from "../models/WeekTemplate.js";
import Booking from "../models/Booking.js";
import { sendFcmToTokens } from "../utils/fcm.js";
import Notification from "../models/Notification.js";
import { createObjectCsvStringifier } from "csv-writer";
import Setting from "../models/Setting.js";
import multer from "multer";
import path from "path";
// 📸 إعداد مكان حفظ الصور
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
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
 * يحتوي على الأيام والساعات المخصصة للتدريب
 */
export const createWeekTemplate = async (req, res) => {
  try {
    const { name, slots } = req.body;
    if (!name || !slots?.length)
      return res
        .status(400)
        .json({ message: "Template name and slots required" });

    const template = await WeekTemplate.create({ name, slots });
    res.status(201).json({ message: "Template created", template });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating template" });
  }
};

/**
 * 🔹 تطبيق قالب أسبوعي على تواريخ محددة
 * يقوم بإنشاء Slots فعلية في جدول الأيام
 */
export const applyTemplate = async (req, res) => {
  try {
    const { templateId, startDate } = req.body;
    const template = await WeekTemplate.findById(templateId);
    if (!template)
      return res.status(404).json({ message: "Template not found" });

    const start = new Date(startDate);
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
    res.status(500).json({
      message: "Error applying template",
      error: error.message, // ← أضف هذا السطر
    });
    res.status(500).json({ message: "Error applying template" });
  }
};

/**
 * 🔹 تمكين أو تعطيل الحجز الإضافي لمستخدم معين
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

    // 🔹 بناء الفلتر الزمني
    const filter = {};
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // 🔹 جلب البيانات مع الربط بالمستخدم والجلسة
    const bookings = await Booking.find(filter)
      .populate("user", "username email phone")
      .populate("slot", "date time isBlocked")
      .sort({ createdAt: -1 });

    if (!bookings.length)
      return res.status(404).json({ message: "لا توجد بيانات لتصديرها" });

    // 🔹 إنشاء كاتب CSV
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

    const records = bookings.map((b) => ({
      username: b.user?.username || "—",
      email: b.user?.email || "—",
      phone: b.user?.phone || "—",
      date: b.slot?.date
        ? new Date(b.slot.date).toLocaleDateString("ar-EG")
        : "—",
      time: b.slot?.time || "—",
      status:
        b.status === "booked"
          ? "نشط ✅"
          : b.status === "cancelled"
          ? "ملغى ❌"
          : "—",
      createdAt: new Date(b.createdAt).toLocaleString("ar-EG"),
    }));

    const csvData = csv.getHeaderString() + csv.stringifyRecords(records);

    // 🔹 إعداد الرد للتنزيل
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=bookings-report.csv"
    );
    res.status(200).end("\uFEFF" + csvData); // إضافة BOM لترميز عربي صحيح
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
    startOfWeek.setDate(now.getDate() - 6); // آخر 7 أيام

    // 🔹 إحصاءات الحجوزات النشطة والملغاة لكل يوم
    const last7Days = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfWeek },
        },
      },
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

    // 🔹 نجهز مصفوفة الأيام
    const dailyBookings = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const dateStr = day.toISOString().split("T")[0];

      const active =
        last7Days.find(
          (d) => d._id.date === dateStr && d._id.status === "booked"
        )?.count || 0;
      const cancelled =
        last7Days.find(
          (d) => d._id.date === dateStr && d._id.status === "cancelled"
        )?.count || 0;

      dailyBookings.push({ date: dateStr, active, cancelled });
    }

    // 🔹 الإحصاءات العامة الأخرى
    const [
      totalUsers,
      blockedUsers,
      totalBookings,
      activeBookings,
      cancelled,
      totalSlots,
      todaySessions,
      upcomingWeekSessions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBlocked: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "booked" }),
      Booking.countDocuments({ status: "cancelled" }),
      Slot.countDocuments(),
      Slot.countDocuments({
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      }),
      Slot.countDocuments({
        date: {
          $gte: new Date(),
          $lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    res.json({
      totalUsers,
      activeUsers: totalUsers - blockedUsers,
      blockedUsers,
      totalBookings,
      activeBookings,
      cancelled,
      totalSlots,
      todaySessions,
      upcomingWeekSessions,
      dailyBookings, // 🔹 الآن تحتوي على active و cancelled
    });
  } catch (error) {
    console.error(error);
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
    // يمكنك مستقبلاً جعلها تقرأ من قاعدة البيانات أو من الذاكرة
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

    // عدّ الحجوزات لكل مستخدم
    const usersWithBookings = await Promise.all(
      users.map(async (u) => {
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

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔒 لا يمكن حظر مديرة النظام
    if (user.role === "admin") {
      return res.status(403).json({ message: "لا يمكن حظر مديرة النظام 👑" });
    }

    // ✅ التبديل بين حالتي الحظر
    const newStatus = !user.isBlocked;
    await User.updateOne({ _id: user._id }, { $set: { isBlocked: newStatus } });

    // ✅ جلب المستخدم بعد التحديث
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
 * 🔹 إرسال إشعار مخصص من لوحة الإدارة
 * الهدف: تمكين المديرة من إرسال إشعار عام أو خاص
 */

/**
 * 🔹 إرسال إشعار مخصص وتسجيله في قاعدة البيانات
 */
export const sendCustomNotification = async (req, res) => {
  try {
    const { title, body, target } = req.body;
    const adminUser = req.user?._id;

    if (!title || !body)
      return res
        .status(400)
        .json({ message: "الرجاء إدخال العنوان والمحتوى." });

    let users = [];

    // 🎯 تحديد الجهة المستهدفة
    if (target === "all") {
      users = await User.find({
        isBlocked: false,
        fcmTokens: { $exists: true, $ne: [] },
      });
    } else {
      const user = await User.findById(target);
      if (!user)
        return res.status(404).json({ message: "لم يتم العثور على المشتركة." });
      users = [user];
    }

    if (!users.length)
      return res
        .status(400)
        .json({ message: "لم يتم العثور على أي مشتركات مستهدفات." });

    // 📱 جمع جميع الرموز (tokens)
    const allTokens = users.flatMap((u) => u.fcmTokens || []);

    if (!allTokens.length)
      return res
        .status(400)
        .json({ message: "لا توجد أجهزة مسجلة لاستقبال الإشعارات." });

    // 🚀 إرسال الإشعار عبر FCM
    const payload = { title, body };
    const response = await sendFcmToTokens(allTokens, payload);

    // 💾 حفظ سجل الإشعار في قاعدة البيانات
    await Notification.create({
      title,
      body,
      targetType: target === "all" ? "all" : "user",
      targetUser: target === "all" ? null : target,
      sentBy: adminUser,
      successCount: response?.successCount || 0,
      failureCount: response?.failureCount || 0,
    });

    res.json({
      message: `تم إرسال الإشعار بنجاح إلى ${users.length} مشتركة.`,
      successCount: response?.successCount,
      failureCount: response?.failureCount,
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
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "فشل جلب الإعدادات" });
  }
};

/**
 * 🔹 تحديث الإعدادات
 */
export const updateSettings = async (req, res) => {
  try {
    const {
      clubName,
      contactNumber,
      autoMessage,
      allowExtraBookingsByDefault,
    } = req.body;

    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting({});
    }

    settings.clubName = clubName ?? settings.clubName;
    settings.contactNumber = contactNumber ?? settings.contactNumber;
    settings.autoMessage = autoMessage ?? settings.autoMessage;
    settings.allowExtraBookingsByDefault =
      allowExtraBookingsByDefault ?? settings.allowExtraBookingsByDefault;

    await settings.save();
    res.json({ message: "تم تحديث الإعدادات بنجاح ✅", settings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "فشل تحديث الإعدادات" });
  }
};
/**
 * 🔹 رفع شعار جديد للنادي
 */
export const uploadLogo = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "يرجى اختيار صورة للشعار" });

    // 🔹 نحصل على اسم السيرفر الحالي (محلي أو Railway)
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const logoUrl = `${baseUrl}/uploads/${req.file.filename}`;

    let settings = await Setting.findOne();
    if (!settings) settings = new Setting();

    settings.logoUrl = logoUrl;
    await settings.save();

    res.json({
      message: "تم تحديث الشعار بنجاح ✅",
      logoUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "فشل رفع الشعار" });
  }
};
