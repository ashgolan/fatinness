// ✅ أدوات التعامل مع التاريخ في الواجهة (React) - بدون مشاكل UTC

/**
 * 🔹 تنسيق التاريخ المحلي بشكل آمن (بدون UTC)
 * يرجع النص على شكل "YYYY-MM-DD"
 */
export function fmtLocal(date) {
  if (!(date instanceof Date)) date = new Date(date);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 🔹 تحليل نص تاريخ "YYYY-MM-DD" وتحويله إلى كائن Date محلي
 * بدون انزلاق يوم بسبب UTC
 */
export function parseLocalDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d); // محلي بدون UTC
}

/**
 * 🔹 عرض التاريخ بالعربية بشكل جميل
 * مثال: "الثلاثاء، 28 أكتوبر 2025"
 */
export function formatArabicDate(date) {
  if (!(date instanceof Date)) date = new Date(date);
  return date.toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
