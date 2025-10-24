import Slot from "../models/Slot.js";
import Booking from "../models/Booking.js";
import { sendFcmToTokens } from "../utils/fcm.js"; // إن كنا نستخدم FCM للإشعارات

/**
 * 🔹 جلب جميع الحصص بشكل مرتب حسب التاريخ
 */
export const getAllSlots = async (req, res) => {
  try {
    const { startDate } = req.query;

    // إذا تم تمرير تاريخ بداية الأسبوع
    let filter = {};
    if (startDate) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      filter.date = { $gte: start, $lte: end };
    }

    const slots = await Slot.find(filter).sort({ date: 1, startTime: 1 });

    // أضف بيانات الحجز
    const result = await Promise.all(
      slots.map(async (slot) => {
        const booked = await Booking.countDocuments({
          slot: slot._id,
          status: "booked",
        });
        return {
          ...slot.toObject(),
          booked,
          remaining: Math.max((slot.capacity || 0) - booked, 0),
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching slots" });
  }
};

/**
 * 🔹 تعطيل أو تفعيل حصة
 */
export const toggleSlotBlock = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    slot.isBlocked = !slot.isBlocked;
    await slot.save();

    res.json({
      message: slot.isBlocked ? "تم تعطيل الحصة بنجاح" : "تم تفعيل الحصة بنجاح",
      slot,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error toggling slot block" });
  }
};

export const deleteSlot = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    // احذف كل الحجوزات المرتبطة بهذه الحصة
    await Booking.deleteMany({ slot: slot._id });

    // احذف الحصة نفسها
    await slot.deleteOne();

    res.json({ message: "تم حذف الحصة وكل حجوزاتها بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting slot and bookings" });
  }
};
// 🔹 إرجاع قائمة بأسابيع متوفرة حسب تواريخ الـ Slots
export const getAvailableWeeks = async (req, res) => {
  try {
    const slots = await Slot.find({}, "date").sort({ date: 1 });
    const weeks = new Set();

    slots.forEach((s) => {
      const d = new Date(s.date);
      const sunday = new Date(d);
      sunday.setDate(d.getDate() - d.getDay()); // بداية الأسبوع (الأحد)
      weeks.add(sunday.toISOString().split("T")[0]);
    });

    res.json([...weeks]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching weeks" });
  }
};

// 🔹 جلب المشتركات المحجوزات في حصة معينة
export const getSlotBookings = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    const bookings = await Booking.find({ slot: slot._id, status: "booked" })
      .populate("user", "name email phone")
      .sort({ createdAt: 1 });

    res.json({
      slot: {
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity,
      },
      bookings: bookings.map((b) => b.user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching slot bookings" });
  }
};

export const cancelUserBookingInSlot = async (req, res) => {
  try {
    const { slotId, userId } = req.params;

    const booking = await Booking.findOne({
      slot: slotId,
      user: userId,
      status: "booked",
    });
    if (!booking)
      return res
        .status(404)
        .json({ message: "الحجز غير موجود أو ملغي مسبقًا" });

    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "تم إلغاء حجز المشتركة بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ أثناء إلغاء الحجز" });
  }
};

/**
 * 🔔 إرسال تذكير لكل المشتركات في حصة معينة
 * يدعم 3 طرق: FCM / بريد إلكتروني / واتساب
 */
export const sendSlotReminder = async (req, res) => {
  try {
    // 👇 نقرأ نوع الطريقة من الطلب (افتراضيًا FCM)
    const { method = "fcm" } = req.body;

    // ✅ التحقق من وجود الحصة
    const slot = await Slot.findById(req.params.id);
    if (!slot)
      return res
        .status(404)
        .json({ message: "لم يتم العثور على الحصة المطلوبة" });
if (new Date(slot.date) < new Date()) {
  return res.status(400).json({
    message: "لا يمكن إرسال تذكير لأن موعد الحصة قد انتهى بالفعل.",
  });
}
    // ✅ البحث عن المشتركات المحجوزات في هذه الحصة
    const bookings = await Booking.find({ slot: slot._id, status: "booked" })
      .populate("user", "name email phone")
      .sort({ createdAt: 1 })
      .lean();

    // إزالة الحجوزات التي ليس لديها مستخدم
    const validBookings = bookings.filter((b) => b.user);
    if (!bookings.length)
      return res
        .status(400)
        .json({ message: "لا توجد مشتركات محجوزات في هذه الحصة" });

    // 📄 إعداد نص التذكير
    const title = "تذكير: تدريبك اليوم 💪";
    const body = `موعد تدريبك في ${slot.startTime} بتاريخ ${new Date(
      slot.date
    ).toLocaleDateString("ar-EG")}`;

    // 📨 عدّاد لعدد الرسائل التي تم إرسالها فعلياً
    let sentCount = 0;

    // 🔄 إرسال التذكيرات بحسب النوع المختار
    for (const b of bookings) {
      const user = b.user;

      if (method === "fcm" && user?.fcmTokens?.length) {
        await sendFcmToTokens(user.fcmTokens, { title, body });
        sentCount++;
      } else if (method === "email" && user?.email) {
        await sendEmail(user.email, title, body, `<p>${body}</p>`);
        sentCount++;
      } else if (method === "whatsapp" && user?.phone) {
        await sendWhatsAppMessage(user.phone, body);
        sentCount++;
      }
    }

    // ✅ الرد النهائي
    if (sentCount > 0) {
      res.json({
        slot: {
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          capacity: slot.capacity,
        },
        bookings: validBookings.map((b) => b.user),
      });
    } else {
      res.status(400).json({
        message: `لم يتم إرسال أي تذكير لأن بيانات الاتصال غير متوفرة`,
      });
    }
  } catch (err) {
    console.error("❌ Error sending reminders:", err);
    res.status(500).json({
      message: "حدث خطأ أثناء محاولة إرسال التذكيرات",
      error: err.message,
    });
  }
};
