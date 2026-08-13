import React from "react";
import { useSelector } from "react-redux";
import { ReactComponent as BronzeIcon } from "../../../../../Images/Avatar/bronze.svg";
import { selectUser } from "../../../../../features/authentication/AuthSlice";

export const BronzeProfile = () => {
  const currentUser = useSelector(selectUser);

  return (
    <div className="flex items-center w-full gap-2 py-3">
      <div
        className={`w-5/12 px-2 py-0.5 whitespace-nowrap flex space-y-4 items-center md:gap-4 overflow-hidden`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex w-full items-center gap-2 px-2">
            <div className="flex-col space-y-1">
              <div className="flex justify-start gap-2 items-center">
                <BronzeIcon width="15" height="15" />
                <p className="text-white font-bold uppercase text-[12px]">
                  {currentUser.name}
                </p>
              </div>
              <div className="flex items-center w-full gap-4">
                <div className="flex items-center w-full gap-1">
                  <div className="flex items-baseline w-full font-medium font-mono text-sm">
                    <p className="text-[10px] bg-white/30 px-1 rounded">EXP</p>
                  </div>
                  <div className="w-full min-w-20 rounded bg-base-100 flex justify-start items-start px-2 py-0.5 text-xs font-mono">
                    <p className="font-bold">0%</p>
                  </div>
                  <span className="material-symbols-outlined rounded-full text-white">
                    arrow_right
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className={`w-5/12 border-l border-white/30 px-2 py-0.5 whitespace-nowrap flex space-y-4 items-center md:gap-4 overflow-hidden`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex w-full items-center gap-2 px-2">
            <div className="flex-col space-y-1">
              <div className="flex justify-start gap-2 items-center">
                <span className="material-symbols-outlined text-[13px] rounded-full bg-yellow-300 text-base-300">
                  star
                </span>
                <p className="text-white font-bold uppercase text-[12px]">
                  Loyalty Point
                </p>
              </div>
              <div className="flex items-center w-full gap-4">
                <div className="flex items-center w-full gap-1">
                  <div className="flex items-baseline w-full font-medium font-mono text-sm">
                    <p className="text-[10px] h-4 bg-yellow-600 text-white px-1 rounded">
                      LP
                    </p>
                  </div>
                  <div className="w-full min-w-20 rounded bg-base-100 flex justify-start items-start px-2 py-0.5 text-xs font-mono">
                    <p className="font-bold text-yellow-600">0</p>
                  </div>
                  <span className="material-symbols-outlined rounded-full text-white">
                    arrow_right
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className={`w-2/12 border-l border-white/30 px-2 py-0.5 whitespace-nowrap flex space-y-4 items-center md:gap-4 overflow-hidden`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex w-full items-center gap-2 px-2">
            <img
              src={require("../../../../../Images/Avatar/chest-claimed.webp")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
