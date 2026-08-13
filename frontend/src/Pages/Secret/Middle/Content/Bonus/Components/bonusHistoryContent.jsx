import React from "react";
import { useSelector } from "react-redux";
import { BonusHistoryComponent } from "./bonusHistoryComponent";

export const BonusHistoryContent = () => {
  const theme = useSelector((state) => state.themes.theme);
  return (
    <BonusHistoryComponent>
      <div className={`bg-${theme?.name}-950/10 md:p-4 space-y-4`}>
        <div className="p-3 bg-gradient-to-t from-yellow-700 to-yellow-500 text-white text-sm uppercase">
          <h1>Riwayat Bonus</h1>
        </div>
        {/* content */}
        <div className="flex overflow-x-auto items-center gap-2">
          <div className="flex items-center text-xs gap-2">
            <p className="font-medium">Rentang Tanggal</p>
            <input
              type="date"
              className="px-2 py-2 text-sm outline-none border border-base-300 focus:border-yellow-600 rounded bg-base-100/50"
            />
          </div>

          <button className="px-4 py-1 rounded bg-gradient-to-b hover:bg-gradient-to-t duration-100 from-yellow-500 to-yellow-700 font-medium text-sm">
            Cari
          </button>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="border-b whitespace-normal border-white">
                <th>Nama Promosi</th>
                <th>Durasi Tanggal Mulai (WIB)</th>
                <th>Durasi Tanggal Selesai (WIB)</th>
                <th>Tanggal Mulai (WIB)</th>
                <th>Tanggal Selesai (WIB)</th>
                <th>Jumlah</th>
                <th>Jumlah Pembayaran</th>
                <th>Kelipatan</th>
                <th>Total Jumlah Turnover</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/50 h-10">
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr className="border-b border-white/50 h-10">
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr className="border-b border-white/50 h-10">
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr className="border-b border-white/50 h-10">
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr className="border-b border-white/50 h-10">
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr className="border-b border-white/50 h-10">
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* Navigation Tabs */}
    </BonusHistoryComponent>
  );
};
