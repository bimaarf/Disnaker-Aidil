// src/utils/rupiah.js

/**
 * Format number/string to currency: Rp 1.000.000
 * @param {string|number} value
 * @returns {string}
 */
export const formatRupiah = (value) => {
  const numberString = String(value).replace(/[^\d]/g, "");
  const number = parseInt(numberString, 10);
  if (isNaN(number)) return "";
  return "Rp " + number.toLocaleString("id-ID");
};

/**
 * Convert currency string like "Rp 1.000.000" to integer: 1000000
 * @param {string} value
 * @returns {number}
 */
export const parseRupiahToInt = (value) => {
  return parseInt(String(value).replace(/[^\d]/g, ""), 10) || 0;
};
