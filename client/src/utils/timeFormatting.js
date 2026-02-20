// // utils/time.js

// export function getLocaleByLang(lang) {
//   if (lang === "ar") return "ar-EG";
//   if (lang === "he") return "he-IL";
//   return "en-GB";
// }

// export function formatTimeRange(startAt, endAt, lang = "he") {
//   const locale = getLocaleByLang(lang);

//   const start = new Date(startAt);
//   const end = new Date(endAt);

//   const fmt = (d) =>
//     d.toLocaleTimeString(locale, {
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: false,
//     });

//   return `${fmt(start)} - ${fmt(end)}`;
// }

// export function getStartsInText(targetDate, lang = "he") {
//   const now = new Date();
//   const target = new Date(targetDate);

//   let diffMs = target - now;
//   if (diffMs <= 0) return null;

//   const totalMinutes = Math.floor(diffMs / 60000);

//   const days = Math.floor(totalMinutes / (60 * 24));
//   const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
//   const minutes = totalMinutes % 60;

//   if (lang === "ar") {
//     const parts = [];
//     if (days) parts.push(`${days} يوم`);
//     if (hours) parts.push(`${hours} ساعة`);
//     if (minutes) parts.push(`${minutes} دقيقة`);
//     return `يبدأ بعد ${parts.join(" و")}`;
//   }

//   if (lang === "he") {
//     const parts = [];
//     if (days) parts.push(`${days} ימים`);
//     if (hours) parts.push(`${hours} שעות`);
//     if (minutes) parts.push(`${minutes} דקות`);
//     return `מתחיל בעוד ${parts.join(" ו־")}`;
//   }

//   const parts = [];
//   if (days) parts.push(`${days} day${days > 1 ? "s" : ""}`);
//   if (hours) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
//   if (minutes) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
//   return `Starts in ${parts.join(" and ")}`;
// }
// utils/time.js

import { DateTime } from "luxon";

export const FIXED_ZONE = "Asia/Jerusalem";

export function getLocaleByLang(lang) {
  if (lang === "ar") return "ar";
  if (lang === "he") return "he";
  return "en";
}

export function formatTimeRange(startAt, endAt, lang = "he") {
  const locale = getLocaleByLang(lang);

  const start = DateTime.fromISO(startAt, { zone: "utc" })
    .setZone(FIXED_ZONE)
    .setLocale(locale)
    .toFormat("HH:mm");

  const end = DateTime.fromISO(endAt, { zone: "utc" })
    .setZone(FIXED_ZONE)
    .setLocale(locale)
    .toFormat("HH:mm");

  return `${start} - ${end}`;
}

export function getStartsInText(targetDate, lang = "he") {
  const locale = getLocaleByLang(lang);

  const now = DateTime.utc().setZone(FIXED_ZONE);
  const target = DateTime.fromISO(targetDate, { zone: "utc" })
    .setZone(FIXED_ZONE);

  if (target <= now) return null;

  const diff = target.diff(now, ["days", "hours", "minutes"]).toObject();

  const days = Math.floor(diff.days || 0);
  const hours = Math.floor(diff.hours || 0);
  const minutes = Math.floor(diff.minutes || 0);

  if (lang === "ar") {
    const parts = [];
    if (days) parts.push(`${days} يوم`);
    if (hours) parts.push(`${hours} ساعة`);
    if (minutes) parts.push(`${minutes} دقيقة`);
    return `يبدأ بعد ${parts.join(" و")}`;
  }

  if (lang === "he") {
    const parts = [];
    if (days) parts.push(`${days} ימים`);
    if (hours) parts.push(`${hours} שעות`);
    if (minutes) parts.push(`${minutes} דקות`);
    return `מתחיל בעוד ${parts.join(" ו־")}`;
  }

  const parts = [];
  if (days) parts.push(`${days} day${days > 1 ? "s" : ""}`);
  if (hours) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  if (minutes) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);

  return `Starts in ${parts.join(" and ")}`;
}