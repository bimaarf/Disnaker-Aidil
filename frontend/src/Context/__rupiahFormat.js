// utils/formatCurrency.js
export const rupiahFormat = (amount) => {
  const numberString = amount.toString().replace(/[^,\d]/g, "");
  const split = numberString.split(",");
  let remainder = split[0].length % 3;
  let rupiah = split[0].substr(0, remainder);
  const thousand = split[0].substr(remainder).match(/\d{3}/gi);

  if (thousand) {
    const separator = remainder ? "." : "";
    rupiah += separator + thousand.join(".");
  }

  rupiah = split[1] !== undefined ? rupiah + "," + split[1] : rupiah;
  return `Rp ${rupiah}`;
};
