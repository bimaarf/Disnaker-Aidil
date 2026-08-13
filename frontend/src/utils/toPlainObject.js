import { isDraft, current } from "@reduxjs/toolkit";

// Helper function to recursively convert proxy or nested objects to plain objects
export const toPlainObject = (obj) => {
  try {
    if (!obj || typeof obj !== "object") return obj; // Non-objects are returned as is

    // If it's a Proxy (Draft), unwrap it using Redux Toolkit
    if (isDraft(obj)) return current(obj);

    // If it's an array, apply toPlainObject recursively on each item
    if (Array.isArray(obj)) {
      return obj.map(toPlainObject); // Recursively process array items
    }

    // Otherwise, handle as an object and recursively apply toPlainObject on its properties
    const plain = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (typeof val !== "function") {
          plain[key] = toPlainObject(val); // Recursively process values
        }
      }
    }
    return plain;
  } catch (e) {
    console.warn("[toPlainObject] Failed:", e);
    return null; // In case of failure, return null (or fallback behavior)
  }
};
