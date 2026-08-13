import React, { useState, useEffect } from "react";

const PhoneNumberInput = ({ initialValue = "", onChange, className = "" }) => {
  const [phoneNumber, setPhoneNumber] = useState("");

  // Fungsi untuk menangani perubahan input dan format nomor telepon
  const handleInputChange = (e) => {
    const formattedPhoneNumber = formatPhoneNumber(e.target.value);
    setPhoneNumber(formattedPhoneNumber);
    if (onChange) onChange(formattedPhoneNumber);
  };

  // Menggunakan useEffect untuk memperbarui nilai awal yang diformat
  useEffect(() => {
    if (initialValue) {
      const formattedPhoneNumber = formatPhoneNumber(initialValue);
      setPhoneNumber(formattedPhoneNumber);
    }
  }, [initialValue]);

  return (
    <input
      type="tel" // Menggunakan type tel agar keyboard number muncul di mobile
      // pattern="[0-9]*" // Mengizinkan hanya angka
      value={phoneNumber}
      onChange={handleInputChange}
      inputMode="numeric" // Memunculkan keyboard numerik
      // className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-xl focus-within:border-blue-500 transition-all duration-200"
      className={`${
        className !== ""
          ? className
          : "w-full px-4 py-3 rounded-2xl focus:bg-base-100 dark:focus:bg-base-100 bg-base-200/50 dark:bg-base-300 border border-base-300 focus:border-blue-500 focus:outline-none text-base"
      }`}
      placeholder="Enter phone number"
    />
  );
};

// Fungsi format nomor telepon
export const formatPhoneNumber = (value) => {
  if (!value) return "";
  value = String(value); // <-- pastikan string
  let phoneNumber = value.replace(/[^\d]/g, "");

  if (phoneNumber.startsWith("0")) {
    phoneNumber = "62" + phoneNumber.slice(1);
  } else if (!phoneNumber.startsWith("62")) {
    phoneNumber = "62" + phoneNumber;
  }

  // Format sesuai panjang nomor
  if (phoneNumber.length <= 2) return "+" + phoneNumber;
  if (phoneNumber.length <= 5)
    return "+" + phoneNumber.slice(0, 2) + " " + phoneNumber.slice(2);
  if (phoneNumber.length <= 9)
    return (
      "+" +
      phoneNumber.slice(0, 2) +
      " " +
      phoneNumber.slice(2, 5) +
      "-" +
      phoneNumber.slice(5)
    );
  if (phoneNumber.length <= 13)
    return (
      "+" +
      phoneNumber.slice(0, 2) +
      " " +
      phoneNumber.slice(2, 5) +
      "-" +
      phoneNumber.slice(5, 9) +
      "-" +
      phoneNumber.slice(9)
    );

  phoneNumber = phoneNumber.slice(0, 18);
  return (
    "+" +
    phoneNumber.slice(0, 2) +
    " " +
    phoneNumber.slice(2, 5) +
    "-" +
    phoneNumber.slice(5, 9) +
    "-" +
    phoneNumber.slice(9)
  );
};

export default PhoneNumberInput;
