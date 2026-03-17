import { DateTime } from "luxon";

export function getSundayWeekRange(date, zone = "Asia/Jerusalem") {
  const local = DateTime.fromJSDate(date instanceof Date ? date : new Date(date), {
    zone,
  });

  // weekday في Luxon:
  // Monday = 1 ... Saturday = 6 ... Sunday = 7
  // نريد Sunday = 0
  const daysFromSunday = local.weekday % 7;

  const weekStart = local.startOf("day").minus({ days: daysFromSunday });
  const weekEnd = weekStart.plus({ days: 6 }).endOf("day");

  return { weekStart, weekEnd };
}