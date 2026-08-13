import truncate from "truncate-html";

// truncate plain text
export const truncateText = (title, limit) => {
  if (!title) return "";
  return title.length > limit ? title.slice(0, limit) + "..." : title;
};

// truncate HTML tanpa merusak tag
export const truncateHTML = (html, limit) => {
  if (!html) return "";
  return truncate(html, { length: limit, ellipsis: "..." });
};
export const truncateTextWords = (text, limit) => {
  if (!text) return "";
  const words = text.split(" ");
  return words.length > limit ? words.slice(0, limit).join(" ") + "..." : text;
};
