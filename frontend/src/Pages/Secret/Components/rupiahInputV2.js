import React, { useState } from "react";

const formatRupiah = (number) => {
  if (!number) return "IDR 0";
  return "IDR " + Number(number).toLocaleString("id-ID");
};

const removeRupiahFormat = (formattedNumber) => {
  return formattedNumber.replace(/[^0-9]/g, "");
};

const RupiahInputV2 = ({ initialValue = "", onChange }) => {
  const [amount, setAmount] = useState(formatRupiah(initialValue));

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
        className="px-2 py-2 text-right font-mono w-full outline-none border border-base-300 focus:border-yellow-600 rounded focus:bg-base-100/30 bg-base-300/30"
      />
    </div>
  );
};

export default RupiahInputV2;
