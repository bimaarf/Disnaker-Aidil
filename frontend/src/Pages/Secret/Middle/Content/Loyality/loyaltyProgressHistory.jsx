import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export const LoyaltyProgressHistory = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("Semua");
  const theme = useSelector((state) => state.themes.name);
  return (
    <>
      <div className={`bg-${theme?.name}-950/10 md:p-4 space-y-4`}>
        <div className="p-3 bg-gradient-to-t from-yellow-700 to-yellow-500 text-center text-white text-sm uppercase">
          <p
            onClick={() => navigate("/loyalty/rewards")}
            className="float-left hover:brightness-90 duration-100 cursor-pointer material-symbols-outlined">
            arrow_back
          </p>
          <h1>Riwayat</h1>
        </div>
        <div className="p-3 space-y-4 md:space-y-6">
          <div className="font-body whitespace-normal">
            <div className="p-3 text-xs rounded text-white bg-neutral-500/40">
              <p className="text-yellow-500">Catatan</p>
              <p>
                Riwayat ini hanya menampilkan data transaksi selama 60 hari
                terakhir
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center font-medium text-pretty ">
            <div className="flex items-center gap-2 uppercase">
              <div className="w-1 rounded h-8 bg-yellow-600"></div>
              <p>{filter}</p>
            </div>
            <select
              onChange={(e) => setFilter(e.target.value)}
              className="px-2 w-1/3 border-base-300 border bg-base-300/50 py-1 outline-none">
              <option value={"Semua"}>Semua</option>
              <option value={"Riwayat LP"}>Riwayat LP</option>
              <option value={"Riwayat EXP"}>Riwayat EXP</option>
            </select>
          </div>
        </div>
      </div>
      {/* Navigation Tabs */}
    </>
  );
};
