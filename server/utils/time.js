import { DateTime } from "luxon";

export const ZONE = "Asia/Jerusalem";

// ======================================================
// ⏱️ الآن UTC
// ======================================================
export const nowUTC = () => DateTime.now().toUTC();

// ======================================================
// 🔄 Local ISO → UTC Date (للتخزين)
// ======================================================
export const localISOToUTC = (isoLocal) =>
  DateTime.fromISO(isoLocal, { zone: ZONE }).toUTC().toJSDate();

// ======================================================
// 🔄 UTC Date → Local DateTime (للعرض فقط)
// ======================================================
export const utcToLocal = (dateUTC) =>
  DateTime.fromJSDate(dateUTC, { zone: "utc" }).setZone(ZONE);

// ======================================================
// 📅 نطاق الأسبوع (الأحد → السبت)
// ======================================================
export const getWeekRangeLocal = (baseISO) => {
  const base = baseISO
    ? DateTime.fromISO(baseISO, { zone: ZONE })
    : DateTime.now().setZone(ZONE);

  // Luxon: weekday (1=Mon ... 7=Sun)
  const daysFromSunday = base.weekday % 7;

  const weekStartLocal = base.minus({ days: daysFromSunday }).startOf("day");

  const weekEndLocal = weekStartLocal.plus({ days: 6 }).endOf("day");

  return {
    weekStartLocal,
    weekEndLocal,
    weekStartUTC: weekStartLocal.toUTC().toJSDate(),
    weekEndUTC: weekEndLocal.toUTC().toJSDate(),
  };
};
export const formatLocalDate = (dateUTC) =>
  utcToLocal(dateUTC).toFormat("yyyy-MM-dd");

export const formatLocalTime = (dateUTC) =>
  utcToLocal(dateUTC).toFormat("HH:mm");
