// ===========================
// 📁 server/controllers/slots.admin.controller.js
// ===========================

import Booking from "../models/Booking.js";
import Slot from "../models/Slot.js";
import { fmtLocal } from "../utils/date.js";

//
// 🧮 دوال مساعدة لتاريخ الأسبوع (الأحد كبداية ثابتة دائمًا)
//
function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const day = local.getDay(); // 0 = الأحد
  local.setDate(local.getDate() - day);
  local.setHours(0, 0, 0, 0);
  return local;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

//
// ✅ دالة مساعدة للتحقق من التداخل الزمني في نفس اليوم
//
async function hasOverlap(date, startTime, endTime) {
  const overlap = await Slot.findOne({
    date: new Date(date),
    $or: [
      {
        $and: [
          { startTime: { $lt: endTime } },
          { endTime: { $gt: startTime } },
        ],
      },
    ],
  });
  return !!overlap;
}

//
// =====================================================
// 🔹 GET /admin/slots/week?start=YYYY-MM-DD
// =====================================================
export const adminGetWeekSlots = async (req, res) => {
  try {
    const { start } = req.query;

    let inputDate;
    if (start && !isNaN(Date.parse(start))) {
      inputDate = new Date(`${start}T00:00:00`);
    } else {
      inputDate = new Date();
    }

    const weekStart = startOfWeek(inputDate);
    const weekEnd = addDays(weekStart, 6);

    console.log("======================================");
    console.log("🗓️ طلب جلب الأسبوع:");
    console.log("start param:", start);
    console.log("inputDate:", inputDate.toISOString());
    console.log("weekStart:", weekStart.toISOString());
    console.log("weekEnd:", weekEnd.toISOString());
    console.log("======================================");

    const slots = await Slot.find({
      date: { $gte: weekStart, $lt: addDays(weekEnd, 1) },
    }).sort({ date: 1, startTime: 1 });

    console.log("📦 عدد الحصص المسترجعة من Mongo:", slots.length);

    // 🧮 حساب عدد الحجوزات المؤكدة
    const slotIds = slots.map((s) => s._id);
    let bookedBySlot = [];
    if (slotIds.length) {
      bookedBySlot = await Booking.aggregate([
        { $match: { slot: { $in: slotIds }, status: "booked" } },
        { $group: { _id: "$slot", bookedCount: { $sum: 1 } } },
      ]);
    }

    const bookedMap = bookedBySlot.reduce((acc, cur) => {
      acc[cur._id.toString()] = cur.bookedCount;
      return acc;
    }, {});

    const enhancedSlots = slots.map((s) => {
      const bookedCount = bookedMap[s._id.toString()] || 0;
      const available = Math.max((s.capacity || 0) - bookedCount, 0);
      return {
        ...s.toObject(),
        bookedCount,
        available,
      };
    });

    const days = {};
    for (let i = 0; i < 7; i++) {
      const key = fmtLocal(addDays(weekStart, i));
      days[key] = [];
    }

    enhancedSlots.forEach((s) => {
      const key = fmtLocal(new Date(s.date));
      if (!days[key]) days[key] = [];
      days[key].push(s);
    });

    res.json({
      weekStart: fmtLocal(weekStart),
      weekEnd: fmtLocal(weekEnd),
      days,
    });
  } catch (e) {
    console.error("❌ adminGetWeekSlots error details:", e);
    res.status(500).json({
      code: "ADMIN_SLOTS_WEEK_FETCH_ERROR",
      error: e.message,
      stack: e.stack,
    });
  }
};

//
// =====================================================
// 🔹 POST /admin/slots
// =====================================================
export const adminCreateSlot = async (req, res) => {
  try {
    const { date, startTime, endTime, capacity = 20 } = req.body;
    if (!date || !startTime || !endTime)
      return res.status(400).json({ code: "ADMIN_SLOT_MISSING_FIELDS" });

    const d = new Date(`${date}T00:00:00`);
    d.setHours(0, 0, 0, 0);

    if (await hasOverlap(d, startTime, endTime)) {
      return res.status(409).json({ code: "ADMIN_SLOT_OVERLAP" });
    }

    const slot = await Slot.create({
      date: d,
      startTime,
      endTime,
      capacity: Number(capacity) || 20,
    });

    res.status(201).json(slot);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ code: "ADMIN_SLOT_DUPLICATE" });
    }
    console.error("❌ adminCreateSlot error:", e);
    res.status(500).json({ code: "ADMIN_SLOT_CREATE_ERROR" });
  }
};

//
// =====================================================
// 🔹 DELETE /admin/slots/:id
// =====================================================
export const adminDeleteSlot = async (req, res) => {
  try {
    await Slot.findByIdAndDelete(req.params.id);
    res.json({ code: "ADMIN_SLOT_DELETE_SUCCESS" });
  } catch (e) {
    console.error("❌ adminDeleteSlot error:", e);
    res.status(500).json({ code: "ADMIN_SLOT_DELETE_ERROR" });
  }
};

//
// =====================================================
// 🔹 POST /admin/slots/next-week/bulk
// =====================================================
export const adminCreateNextWeekBulk = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || !items.length)
      return res.status(400).json({ code: "ADMIN_SLOT_BULK_EMPTY" });

    const base = startOfWeek(new Date());
    const nextSunday = addDays(base, 7);
    nextSunday.setHours(0, 0, 0, 0);

    console.log("📆 إنشاء الأسبوع القادم يبدأ من:", nextSunday.toLocaleDateString("ar-EG"));

    const created = [];
    let skippedOverlap = 0;
    let skippedDuplicate = 0;

    for (const it of items) {
      const d = addDays(nextSunday, it.dayOffset || 0);
      d.setHours(0, 0, 0, 0);

      if (await hasOverlap(d, it.startTime, it.endTime)) {
        skippedOverlap++;
        continue;
      }

      const exists = await Slot.findOne({
        date: d,
        startTime: it.startTime,
        endTime: it.endTime,
      });

      if (exists) {
        skippedDuplicate++;
        continue;
      }

      try {
        const s = await Slot.create({
          date: d,
          startTime: it.startTime,
          endTime: it.endTime,
          capacity: Number(it.capacity) || 20,
        });
        created.push(s._id);
      } catch (e) {
        if (e.code === 11000) skippedDuplicate++;
        else throw e;
      }
    }

    res.status(201).json({
      created: created.length,
      skippedOverlap,
      skippedDuplicate,
      code: "ADMIN_SLOT_BULK_CREATED",
    });
  } catch (e) {
    console.error("❌ adminCreateNextWeekBulk error:", e);
    res.status(500).json({ code: "ADMIN_SLOT_BULK_ERROR" });
  }
};

//
// =====================================================
// 🔹 PUT /admin/slots/:id/block
// =====================================================
export const adminToggleBlock = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot)
      return res.status(404).json({ code: "ADMIN_SLOT_NOT_FOUND" });

    slot.isBlocked = !slot.isBlocked;
    await slot.save();

    res.json({
      code: slot.isBlocked
        ? "ADMIN_SLOT_BLOCKED_SUCCESS"
        : "ADMIN_SLOT_UNBLOCKED_SUCCESS",
      slot,
    });
  } catch (e) {
    console.error("❌ adminToggleBlock error:", e);
    res.status(500).json({ code: "ADMIN_SLOT_BLOCK_ERROR" });
  }
};
