import React from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../features/authentication/AuthSlice";
import { ReactComponent as BronzeIcon } from "../Images/Avatar/bronze.svg";
import { useNavigate } from "react-router-dom";

export const BronzeAuth = () => {
  const currentUser = useSelector(selectUser);
  const navigate = useNavigate();
  return (
    <div className="w-full pb-3 bg-base-300/90">
      <div
        className={`px-3 py-2 whitespace-nowrap flex space-y-4 items-center md:gap-4 overflow-hidden`}>
        <div className="flex items-center justify-between w-full gap-2">
          <div className="w-1/2">
            <p className="text-white uppercase font-bold">{currentUser.name}</p>
          </div>
          <div className="flex w-1/2 items-center gap-2 px-2">
            <BronzeIcon width="23" height="23" />
            <div className="flex-col w-20">
              <div className="flex justify-between items-center text-xs">
                <p className="text-amber-600/70 font-bold">BRONZE</p>
              </div>
            </div>
          </div>
        </div>
        {/* bar */}
      </div>
      <div className="space-y-3">
        <div className="bg-base-100 rounded px-2 py-1.5 mx-4 text-sm flex items-center gap-2 font-mono">
          <p className="font-bold text-white">IDR</p>
          <p className="font-bold text-green-600 brightness-150">
            {currentUser?.wallet?.balance}
          </p>
        </div>
        <div className="bg-base-100 rounded px-2 py-1.5 mx-4 text-sm flex items-center gap-2 font-mono">
          <p className="font-bold text-white bg-yellow-600 px-1">LP</p>
          <p className="font-bold brightness-150 text-yellow-600">0</p>
        </div>
        <div className="bg-base-100 rounded px-2 py-1.5 mx-4 text-sm flex items-center gap-2 font-mono">
          <p className="font-bold text-white bg-white/30 px-1">EXP</p>
          <p className="font-bold brightness-150 text-yellow-600">0</p>
        </div>
      </div>
      <div className="mt-3 flex items-center bg-base-200 mx-2 rounded p-2">
        <div
          onClick={() => navigate("/deposit/bank")}
          className="w-1/3 uppercase text-center font-mono">
          <span className="material-symbols-outlined">payment</span>
          <p className="text-white text-[12px]">Deposit</p>
        </div>
        <div
          onClick={() => navigate("/withdrawal/bank")}
          className="w-1/3 uppercase border-x border-white/35 text-center font-mono">
          <span className="material-symbols-outlined">payment</span>
          <p className="text-white text-[12px]">Penarikan</p>
        </div>
        <div
          onClick={() =>
            (window.location.href = "https://g9king-1.com/download-apk")
          }
          className="w-1/3 uppercase text-center font-mono">
          <span className="material-symbols-outlined">sync_alt</span>
          <p className="text-white text-[12px]">Penukaran</p>
        </div>
      </div>
    </div>
  );
};
