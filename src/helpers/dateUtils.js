// src/utils/dateUtils.js

// ========= UTK INPUT MANUAL DI FORM
// 🔹 Batasan tanggal global 
export const MIN_DATE = "2024-07-01"; // batas bawah
// Hitung tanggal hari ini berdasarkan zona waktu lokal (bukan UTC)
export const MAX_DATE = (() => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
})();
// ========= UTK INPUT MANUAL DI FORM \

/**
 * Sanitasi tanggal agar tidak keluar dari batas min-max
 * @param {string} inputDate - format YYYY-MM-DD
 * @returns {string} - tanggal valid dalam range
 */
export function sanitizeDate(inputDate) {
  if (!inputDate) return MIN_DATE;

  const min = new Date(MIN_DATE);
  const max = new Date(MAX_DATE);
  const date = new Date(inputDate);

  if (date < min) return MIN_DATE;
  if (date > max) return MAX_DATE;
  return inputDate;
}

/**
 * Sanitasi range tanggal (pastikan endDate >= startDate)
 * @param {string} startDate - format YYYY-MM-DD
 * @param {string} endDate - format YYYY-MM-DD
 * @returns {[string, string]} - [startDate, endDate] yang valid
 */
export function sanitizeDateRange(startDate, endDate) {
  const start = new Date(sanitizeDate(startDate));
  const end = new Date(sanitizeDate(endDate));

  if (end < start) {
    return [start.toISOString().split("T")[0], start.toISOString().split("T")[0]];
  }
  return [
    start.toISOString().split("T")[0],
    end.toISOString().split("T")[0],
  ];
}

/**
 * Format tanggal ke bahasa Indonesia
 * @param {string} inputDate - format YYYY-MM-DD
 * @param {Object} options - Intl options (default: d MMM yy)
 * @returns {string}
 */
export function formatDateID(inputDate, options = { day: "numeric", month: "short", year: "2-digit" }) {
  if (!inputDate) return "-";
  return new Date(inputDate).toLocaleDateString("id-ID", options);
}
