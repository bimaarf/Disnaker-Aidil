import React from "react";
import { useSelector } from "react-redux";

export const LoyaltyBronze = ({ BronzeIcon }) => {
  const theme = useSelector((state) => state.themes.theme);
  return (
    <div
      className={`bg-${theme?.name}-950/20 p-2 w-full md:flex space-y-4 items-center md:gap-4 overflow-x-auto`}>
      <div className="flex items-center justify-between w-full md:w-1/2">
        <div className="flex w-full items-start gap-2 px-2">
          <BronzeIcon width="62" height="62" />
          <div className="flex-col w-full">
            <div className="flex justify-between items-center">
              <p className="text-amber-600/70 font-bold">BRONZE</p>
              <div className="flex items-center font-medium font-mono text-sm">
                <p>0</p>
                <p>/25.000 EXP</p>
              </div>
            </div>
            <div className="flex mt-4 items-center gap-4">
              <div className="flex w-full items-center gap-1">
                <p className="px-1 py-0.5 text-xs font-mono bg-neutral/80 rounded">
                  exp
                </p>
                <div className="h-3.5 w-full rounded bg-base-100"></div>
              </div>
            </div>
          </div>
        </div>
        <span className="text-3xl material-symbols-outlined">
          chevron_right
        </span>
      </div>
      <div className="flex w-full md:w-1/2 border-t md:border-t-transparent py-4 md:pt-0 md:border-l border-base-300 hover:brightness-90 cursor-pointer duration-200 items-start gap-2 h-full px-4">
        <div className="p-3 bg-base-100 rounded-xl w-full flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm">
            <span className="material-symbols-outlined">info</span>
            <p className="uppercase font-bold">Loyalty Point</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <p className="bg-warning py-0.5 px-2 text-pretty">LP</p>
            <p className="font-mono text-warning">0</p>
            <span className="text-warning material-symbols-outlined">
              refresh
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
