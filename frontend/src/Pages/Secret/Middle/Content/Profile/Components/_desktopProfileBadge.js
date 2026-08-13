import React from "react";
import { useSelector } from "react-redux";

export const DesktopProfileBadge = ({ BronzeIcon, currentUser }) => {
  const theme = useSelector((state) => state.themes.theme);
  return (
    <div
      className={`bg-${theme?.name}-950/10 p-2 flex items-start gap-4 overflow-x-auto`}>
      <div className="flex items-start gap-2 px-2">
        <BronzeIcon width="62" height="62" />
        <div className="flex-col">
          <p>{currentUser?.name}</p>
          <div className="flex mt-4 items-center gap-4">
            <div className="flex items-center gap-1">
              <p className="px-1 py-0.5 text-xs font-mono bg-neutral/50 rounded">
                exp
              </p>
              <p className="text-xs font-mono">0</p>
            </div>
            <div className="flex items-center gap-1">
              <p className="px-1 py-0.5 text-xs font-mono bg-yellow-600/90 rounded">
                exp
              </p>
              <p className="text-xs font-mono">0</p>
            </div>
            <div className="flex items-center gap-1">
              <p className="px-4 py-0.5 text-xs font-mono bg-neutral/50 whitespace-nowrap rounded">
                Detail {">>"}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex hover:brightness-90 cursor-pointer duration-200 hover:text-yellow-300 items-start gap-2 border-l px-4 border-dashed">
        <div className="text-center font-mono text-sm uppercase ">
          <span className="material-symbols-outlined text-yellow-300">
            paid
          </span>
          <p className="font-medium">Deposit</p>
        </div>
      </div>
      <div className="flex hover:brightness-90 cursor-pointer duration-200 hover:text-yellow-300 items-start gap-2 border-l px-4 border-dashed">
        <div className="text-center font-mono text-sm uppercase ">
          <span className="material-symbols-outlined text-yellow-300">
            price_check
          </span>
          <p className="font-medium">Penarikan</p>
        </div>
      </div>
      <div className="flex hover:brightness-90 cursor-pointer duration-200 hover:text-yellow-300 items-start gap-2 border-x px-4 border-dashed">
        <div className="text-center font-mono text-sm uppercase ">
          <span className="material-symbols-outlined text-yellow-300">
            sync
          </span>
          <p className="font-medium">Penukaran</p>
        </div>
      </div>
      <div className="flex hover:brightness-90 cursor-pointer duration-200 hover:text-yellow-300 items-start gap-2 h-full px-4 border-dashed">
        <div className="text-center border-b border-yellow-300 border-dashed font-mono text-sm uppercase ">
          <p className="font-medium">Kode Referensi</p>
        </div>
      </div>
    </div>
  );
};
