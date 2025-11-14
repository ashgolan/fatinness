// ======================================================
// ✅ أدوات التاريخ للسيرفر بدون أي انزلاق UTC
// ======================================================

/**
 * 🔹 تحويل أي Date إلى Local بدون انزلاق (مهم جدًا)
 */
export function toLocal(date) {
  const d = new Date(date);
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
    d.getMilliseconds()
  );
}

/**
 * 🔹 تحليل تاريخ من نص "YYYY-MM-DD"
 */
export function parseLocalDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * 🔹 تنسيق التاريخ "YYYY-MM-DD"
 */
export function fmtLocal(date) {
  const d = toLocal(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
