import React from "react";
import { Bonus } from "../bonus";
import "../../../../../components/button.css";
import { useSelector } from "react-redux";
export const BonusComponent = () => {
  const theme = useSelector((state) => state.themes.theme);
  return (
    <Bonus>
      <div className={`bg-${theme?.name}-950/10 md:p-4 space-y-4`}>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2 font-body text-sm tracking-tighter">
            <p>Kategori</p>
            <select className="px-2 border-base-300 border bg-base-300/50 py-1 outline-none">
              <option>Semua</option>
              <option>Pendaftaran</option>
            </select>
          </div>
          <div className="flex items-center gap-2 font-body text-sm tracking-tighter">
            <p>Type</p>
            <select className="px-2 border-base-300 border bg-base-300/50 py-1 outline-none">
              <option>Semua</option>
              <option>Slots</option>
              <option>Arcade</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <div className="p-3 bg-gradient-to-t from-yellow-700 to-yellow-500 text-white text-sm uppercase">
            <h1>KLAIM BONUS</h1>
          </div>

          <div className="p-3 font-body whitespace-normal">
            <div className="p-3 text-xs rounded text-white bg-neutral-500/40">
              <p className="text-yellow-500">Catatan</p>
              <li className="list-decimal">
                Promosi ini tidak bisa dikombinasikan dengan promosi lainnya dan
                promosi ini bisa kedaluarsa.
              </li>
              <li className="list-decimal">
                Cek progress promosi dan klaim tidak tersedia dari jam 03:00 -
                07:00!
              </li>
              <li className="list-decimal">
                Bonus sedang disimpan sementara selama 30 menit dari 29-Nov-2024
                07:17:34 WIB
              </li>
            </div>
            <div className="p-3 md:flex justify-between items-center">
              <div className="flex items-center gap-1">
                <p className="bg-success h-2 w-10 rounded"></p>
                <p className="text-sm font-body">: Diperbolehkan bergabung</p>
              </div>
              <div className="flex items-center gap-1">
                <p className="bg-warning h-2 w-10 rounded"></p>
                <p className="text-sm font-body">
                  : Tidak dapat menentukan kelayakan
                </p>
              </div>
              <div className="flex items-center gap-1">
                <p className="bg-error h-2 w-10 rounded"></p>
                <p className="text-sm font-body">
                  : Tidak diperbolehkan bergabung
                </p>
              </div>
            </div>
          </div>
          <div className="max-w-screen-xl my-4 mx-auto w-full">
            <div className="flex justify-end">
              <button
                className={`parallelogram-left-button mx-2 px-10 py-1 bg-${theme?.name}-950 text-sm uppercase font-medium`}>
                Pendaftaran
              </button>
            </div>
            <div className={`border-2 border-${theme?.name}-950 mx-2`}>
              <div className="flex justify-between items-start p-4">
                <div className="w-3/4">
                  <div className="flex justify-between items-baseline">
                    <p className="text-pretty font-bold uppercase">
                      Extra Bonus Slots 200%
                    </p>
                    <p className="bg-warning h-2 w-10 rounded"></p>
                  </div>
                  <div className="p-4 rounded bg-white mt-4">
                    <div className="h-4 bg-base-300/50"></div>
                  </div>
                  <div className="flex justify-center mt-2 text-sm items-center gap-1">
                    <p>Perkembangan:</p>
                    <p className="font-mono text-warning">0.0%</p>
                  </div>
                </div>
                <div>
                  <img
                    src={require("../../../../../../Images/Chest/chest-silver.png")}
                    alt=""
                  />
                </div>
              </div>
              <div className={`p-4 bg-${theme?.name}-950`}>
                <button className="px-4 py-1 text-white bg-base-300/60 text-sm">
                  Info
                </button>
              </div>
            </div>
          </div>
          <div className="max-w-screen-xl my-4 mx-auto w-full">
            <div className="flex justify-end">
              <button
                className={`parallelogram-left-button mx-2 px-10 py-1 bg-${theme?.name}-950 text-sm uppercase font-medium`}>
                Pendaftaran
              </button>
            </div>
            <div className={`border-2 border-${theme?.name}-950 mx-2`}>
              <div className="flex justify-between items-start p-4">
                <div className="w-3/4">
                  <div className="flex justify-between items-baseline">
                    <p className="text-pretty font-bold uppercase">
                      Extra Bonus Slots 200%
                    </p>
                    <p className="bg-warning h-2 w-10 rounded"></p>
                  </div>
                  <div className="p-4 rounded bg-white mt-4">
                    <div className="h-4 bg-base-300/50"></div>
                  </div>
                  <div className="flex justify-center mt-2 text-sm items-center gap-1">
                    <p>Perkembangan:</p>
                    <p className="font-mono text-warning">0.0%</p>
                  </div>
                </div>
                <div>
                  <img
                    src={require("../../../../../../Images/Chest/chest-silver.png")}
                    alt=""
                  />
                </div>
              </div>
              <div className={`p-4 bg-${theme?.name}-950`}>
                <button className="px-4 py-1 text-white bg-base-300/60 text-sm">
                  Info
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Bonus>
  );
};
