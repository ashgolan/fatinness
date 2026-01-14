// ===========================
// 📁 server/controllers/slots.admin.controller.js
// ===========================

import Booking from "../models/Booking.js";
import Slot from "../models/Slot.js";
import { DateTime } from "luxon";
import { ZONE } from "../utils/time.js";

/**
 * Checks if a slot overlaps with existing ones
 */
export async function hasOverlap(startAtUTC, endAtUTC, session = null) {
  const overlap = await Slot.findOne(
    {
      startAt: { $lt: endAtUTC },
      endAt: { $gt: startAtUTC },
    },
    "_id",
    session ? { session } : undefined
  );

  return !!overlap;
}


// =====================================================
// 🔹 GET /admin/slots/week?start=YYYY-MM-DD
// الأسبوع: الأحد → السبت
// =====================================================
export const adminGetWeekSlots = async (req, res) => {
  try {
    const { start } = req.query;

    const baseDate = start
      ? DateTime.fromISO(start, { zone: ZONE })
      : DateTime.now().setZone(ZONE);

    if (!baseDate.isValid) {
      return res.status(400).json({ error: "Invalid start date" });
    }

    // Luxon weekday: 1=Mon ... 7=Sun
    const daysFromSunday = baseDate.weekday % 7;

    const weekStartLocal = baseDate
      .minus({ days: daysFromSunday })
      .startOf("day");

    const weekEndLocal = weekStartLocal.plus({ days: 6 }).endOf("day");

    const weekStartUTC = weekStartLocal.toUTC().toJSDate();
    const weekEndUTC = weekEndLocal.toUTC().toJSDate();

    const slots = await Slot.find({
      startAt: { $gte: weekStartUTC, $lte: weekEndUTC },
    }).sort({ startAt: 1 });

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

      return {
        ...s.toObject(),
        startTime: DateTime.fromJSDate(s.startAt)
          .setZone(ZONE)
          .toFormat("HH:mm"),
        endTime: DateTime.fromJSDate(s.endAt)
          .setZone(ZONE)
          .toFormat("HH:mm"),
        bookedCount,
        available: Math.max((s.capacity || 0) - bookedCount, 0),
      };
    });

    const days = {};
    for (let i = 0; i < 7; i++) {
      const key = weekStartLocal.plus({ days: i }).toFormat("yyyy-MM-dd");
      days[key] = [];
    }

    enhancedSlots.forEach((s) => {
      const key = DateTime.fromJSDate(s.startAt)
        .setZone(ZONE)
        .toFormat("yyyy-MM-dd");
      if (!days[key]) days[key] = [];
      days[key].push(s);
    });

    res.json({
      weekStart: weekStartLocal.toFormat("yyyy-MM-dd"),
      weekEnd: weekEndLocal.toFormat("yyyy-MM-dd"),
      days,
    });
  } catch (e) {
    console.error("❌ adminGetWeekSlots error:", e);
    res.status(500).json({
      code: "ADMIN_SLOTS_WEEK_FETCH_ERROR",
      error: e.message,
    });
  }
};

// =====================================================
// 🔹 POST /admin/slots
// إنشاء حصة ليوم معيّن
// =====================================================
export const adminCreateSlot = async (req, res) => {
  try {
    const { date, startTime, endTime, capacity = 20 } = req.body;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({ code: "ADMIN_SLOT_MISSING_FIELDS" });
    }

    const startAtUTC = DateTime.fromISO(`${date}T${startTime}`, {
      zone: ZONE,
    }).toUTC();

    const endAtUTC = DateTime.fromISO(`${date}T${endTime}`, {
      zone: ZONE,
    }).toUTC();

    if (!startAtUTC.isValid || !endAtUTC.isValid || endAtUTC <= startAtUTC) {
      return res.status(400).json({ code: "ADMIN_SLOT_INVALID_TIME" });
    }

    if (await hasOverlap(startAtUTC.toJSDate(), endAtUTC.toJSDate())) {
      return res.status(409).json({ code: "ADMIN_SLOT_OVERLAP" });
    }

    const slot = await Slot.create({
      date: startAtUTC.startOf("day").toJSDate(),
      startAt: startAtUTC.toJSDate(),
      endAt: endAtUTC.toJSDate(),
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

// =====================================================
// 🔹 PUT /admin/slots/:id/block
// =====================================================
export const adminToggleBlock = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) return res.status(404).json({ code: "ADMIN_SLOT_NOT_FOUND" });

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

// =====================================================
// 🔹 POST /admin/slots/next-week/bulk
// ⬅️ النسخة المصحّحة (تعتمد على date الصريحة)
// =====================================================
export const adminCreateNextWeekBulk = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ code: "ADMIN_SLOT_BULK_EMPTY" });
    }

    const created = [];
    let skippedOverlap = 0;
    let skippedDuplicate = 0;

    for (const it of items) {
      if (!it.date || !it.startTime || !it.endTime) continue;

      const startAtUTC = DateTime.fromISO(
        `${it.date}T${it.startTime}`,
        { zone: ZONE }
      ).toUTC();

      const endAtUTC = DateTime.fromISO(
        `${it.date}T${it.endTime}`,
        { zone: ZONE }
      ).toUTC();

      if (!startAtUTC.isValid || !endAtUTC.isValid || endAtUTC <= startAtUTC) {
        continue;
      }

      if (await hasOverlap(startAtUTC.toJSDate(), endAtUTC.toJSDate())) {
        skippedOverlap++;
        continue;
      }

      const exists = await Slot.findOne({
        startAt: startAtUTC.toJSDate(),
        endAt: endAtUTC.toJSDate(),
      });

      if (exists) {
        skippedDuplicate++;
        continue;
      }

      const s = await Slot.create({
        date: startAtUTC.startOf("day").toJSDate(),
        startAt: startAtUTC.toJSDate(),
        endAt: endAtUTC.toJSDate(),
        capacity: Number(it.capacity) || 20,
      });

      created.push(s._id);
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


export const adminDeleteSlot = async (req, res) => {
  try {
    const { id } = req.params;

    const slot = await Slot.findById(id);
    if (!slot) {
      return res.status(404).json({ code: "SLOT_NOT_FOUND" });
    }

    // 🔒 (اختياري) منع حذف حصة عليها حجوزات
    if (slot.bookings?.length > 0) {
      return res.status(400).json({ code: "SLOT_HAS_BOOKINGS" });
    }

    await slot.deleteOne();

    res.json({ code: "SLOT_DELETED_SUCCESSFULLY" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: "DELETE_SLOT_FAILED" });
  }
};
