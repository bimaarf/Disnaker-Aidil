import React, { useState, useEffect } from "react";

const formatRupiah = (number) => {
  if (!number) return "IDR 0";
  return "IDR " + Number(number).toLocaleString("id-ID");
};

const removeRupiahFormat = (formattedNumber) => {
  return formattedNumber.replace(/[^0-9]/g, "");
};

const RupiahInputV3 = ({ initialValue, onChange }) => {
  const [amount, setAmount] = useState("");

  // Use useEffect to properly handle initialValue changes
  useEffect(() => {
    // Ensure initialValue is valid, fallback to 0 if invalid
    setAmount(formatRupiah(initialValue || 0));
  }, [initialValue]);

  const handleInputChange = (e) => {
    const rawValue = removeRupiahFormat(e.target.value);
    const formattedValue = formatRupiah(rawValue);
    setAmount(formattedValue);
    onChange(rawValue);
  };

  return (
    <div className="form-control w-full">
      <input
        type="text"
        value={amount}
        onChange={handleInputChange}
        placeholder="Enter amount"
        inputMode="numeric"
        className={`input input-bordered w-full h-16 text-neutral-content text-xl ${
          amount.length > 5 ? "font-medium" : "font-normal"
        }`}
      />
    </div>
  );
};

export default RupiahInputV3;
