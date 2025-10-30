// ✅ أدوات التاريخ للسيرفر (Node.js) بدون انزلاق توقيت

/**
 * 🔹 تحليل "YYYY-MM-DD" إلى Date محلي (بدون UTC)
 */
export function parseLocalDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * 🔹 حساب بداية الأسبوع (الأحد)
 */
export function startOfWeek(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

/**
 * 🔹 إضافة أيام لتاريخ معين (محلي)
 */
export function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * 🔹 تنسيق التاريخ المحلي "YYYY-MM-DD"
 */
export function fmtLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
