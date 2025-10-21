import User from "../models/User.js";
import Slot from "../models/Slot.js";
import WeekTemplate from "../models/WeekTemplate.js";
import Booking from "../models/Booking.js";
import { createObjectCsvWriter } from "csv-writer";

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
    const bookings = await Booking.find()
      .populate("user slot")
      .lean();

    const csvWriter = createObjectCsvWriter({
      path: "attendance_report.csv",
      header: [
        { id: "name", title: "Name" },
        { id: "email", title: "Email" },
        { id: "slotDate", title: "Date" },
        { id: "startTime", title: "Start" },
        { id: "status", title: "Status" },
      ],
    });

    const records = bookings.map((b) => ({
      name: b.user?.name || "Unknown",
      email: b.user?.email || "",
      slotDate: new Date(b.slot?.date).toLocaleDateString(),
      startTime: b.slot?.startTime,
      status: b.status,
    }));

    await csvWriter.writeRecords(records);

    res.download("attendance_report.csv");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error exporting report" });
  }
};

/**
 * 🔹 لوحة الإحصاءات: نسب الحضور وعدد المستخدمين والأنشطة
 */
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.countDocuments({ status: "booked" });
    const cancelled = await Booking.countDocuments({ status: "cancelled" });
    const totalSlots = await Slot.countDocuments();

    res.json({
      totalUsers,
      totalBookings,
      activeBookings,
      cancelled,
      totalSlots,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching stats" });
  }
};
