import React, { useState } from "react";

const NumberInput = () => {
  const [formattedAmount, setFormattedAmount] = useState("");

  const handleAmountChange = (event) => {
    const { value } = event.target;

    // Menghapus semua karakter yang bukan angka
    const numericValue = value.replace(/\D/g, "");

    // Memformat angka ke format mata uang
    const formattedValue = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(numericValue / 100); // Membagi dengan 100 untuk mendapatkan format yang benar

    setFormattedAmount(formattedValue);
  };

  const handleKeyDown = (event) => {
    // Mencegah karakter selain angka dan beberapa karakter khusus
    if (
      !/[0-9]/.test(event.key) &&
      event.key !== "Backspace" &&
      event.key !== "Delete" &&
      event.key !== "Tab" &&
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight"
    ) {
      event.preventDefault();
    }
  };

  return (
    <div className="flex justify-center w-full gap-1">
      <input
        type="text"
        value={formattedAmount}
        onChange={handleAmountChange}
        onKeyDown={handleKeyDown} // Tambahkan handler untuk keydown
        placeholder="Rp "
        className="border duration-500 ease-in-out focus:rounded-xl border-base-300 focus:bg-base-100 bg-base-200 focus:ring-2 focus:ring-cyan-500 cursor-pointer hover:brightness-90 outline-none font-bold text-pretty rounded py-4 text-xl focus:w-96 text-center transition-all"
      />
    </div>
  );
};

export default NumberInput;
