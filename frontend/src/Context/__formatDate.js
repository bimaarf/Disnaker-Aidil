export const formatDate = (dateString) => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) return "Invalid Date";

  const day = date.getDate();
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const monthName = months[date.getMonth()];

  return `${day} ${monthName} ${year} ${hours}:${minutes}`;
};
export const formatDateMonthYear = (dateString) => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) return "Invalid Date";

  const day = date.getDate();
  const year = date.getFullYear();

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const monthName = months[date.getMonth()];

  return `${day} ${monthName} ${year} `;
};
export const formatTime = (dateString) => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) return "Invalid Time";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
};
