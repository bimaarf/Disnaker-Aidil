import React, { useState } from "react";

const formatRupiah = (number) => {
  if (!number) return "Rp 0";
  return "Rp " + Number(number).toLocaleString("id-ID");
};

const removeRupiahFormat = (formattedNumber) => {
  return formattedNumber.replace(/[^0-9]/g, "");
};

const RupiahInput = ({ initialValue = "", onChange }) => {
  const [amount, setAmount] = useState(formatRupiah(initialValue));

  const handleInputChange = (e) => {
    const rawValue = removeRupiahFormat(e.target.value);
    const formattedValue = formatRupiah(rawValue);
    setAmount(formattedValue);
    onChange(rawValue);
  };

  return (
    <div className="form-control">
      <input
        type="text"
        value={amount}
        onChange={handleInputChange}
        placeholder="Enter amount"
        inputMode="numeric"
        className="border duration-500 ease-in-out focus:rounded-xl border-base-300 focus:bg-base-100 bg-base-200 focus:ring-2 focus:ring-cyan-500 cursor-pointer hover:brightness-90 outline-none font-bold text-pretty rounded py-4 text-xl focus:w-96 text-center transition-all"
      />
    </div>
  );
};

export default RupiahInput;
