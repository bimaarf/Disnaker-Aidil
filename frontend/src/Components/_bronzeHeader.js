import React, { useEffect } from "react";
import { ReactComponent as BronzeIcon } from "../Images/Avatar/bronze.svg";
import { useDispatch, useSelector } from "react-redux";
import {
  logout,
  resetState,
  selectUser,
} from "../features/authentication/AuthSlice";
import { useNavigate } from "react-router-dom";
import { resetWalletState } from "../features/wallets/walletSlice";
import { resetWithdrawState } from "../features/withdraws/withdrawSlice";
import { resetDepositState } from "../features/deposits/depositSlice";

export const BronzeHeader = () => {
  const currentUser = useSelector(selectUser);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetState());
    navigate("/");
    dispatch(resetWalletState());
    dispatch(resetWithdrawState());
    dispatch(resetDepositState());
  };

  useEffect(() => {
    if (!currentUser) {
      handleLogout();
    }
  }, [currentUser, handleLogout]);

  const menu = [
    {
      icon: "person",
      url: "/account-summary",
    },
    {
      icon: "account_balance",
      url: "/deposit/qris",
    },
    {
      icon: "sync_alt",
      url: "https://g9king-1.com/download-apk",
    },
    {
      icon: "featured_seasonal_and_gifts",
      url: "/bonus",
    },
    {
      icon: "message",
      url: "/messages/inbox",
    },
  ];
  return (
    <div className="flex items-center gap-2">
      <div
        className={`bg-base-300/90 rounded px-2 py-0.5 whitespace-nowrap flex space-y-4 items-center md:gap-4 overflow-hidden`}>
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex w-full items-center gap-2 px-2">
            <BronzeIcon width="23" height="23" />
            <div className="flex-col min-w-20">
              <div className="flex justify-between items-center text-xs">
                <p className="text-amber-600/70 font-bold">
                  {currentUser.name}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex w-full items-center gap-1">
                  <div className="h-2 w-full rounded bg-base-100"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-l h-6 border-white/30"></div>
          <div className="flex w-full items-center gap-2 px-2 text-yellow-500">
            <span className="material-symbols-outlined active:animate-spin">
              refresh
            </span>
            <p className="font-mono text-[12px]">
              IDR {currentUser.wallet.balance}
            </p>
          </div>
          <div className="border-l h-6 border-white/30"></div>
          <div className="flex w-full items-center gap-2 px-2 text-yellow-500">
            <p className="bg-yellow-600 rounded text-xs py-0.5 px-1 text-white">
              LP
            </p>
            <p className="font-mono text-[12px]">0</p>
          </div>
          <div className="border-l h-6 border-white/30"></div>
          <div className="flex w-full items-center gap-2 px-2 text-yellow-500">
            <div className="cursor-pointer overflow-hidden">
              <img
                className="overflow-hidden object-contain h-7"
                height={3}
                src={require("../Images/Avatar/chest-available.webp")}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {menu.map((item, key) => (
          <div
            key={key}
            className="bg-white/80 hover:brightness-90 duration-200 font-bold cursor-pointer rounded flex items-center text-base-200 px-1.5 py-1"
            onClick={() =>
              item.icon === "sync_alt"
                ? (window.location.href = item.url)
                : navigate(item.url)
            }>
            <span className="material-symbols-outlined text-[16px] font-bold">
              {item.icon}
            </span>
          </div>
        ))}
        <div
          onClick={handleLogout}
          className="bg-error/80 hover:brightness-90 duration-200 text-white font-bold cursor-pointer rounded flex items-center px-1.5 py-1">
          <span className="material-symbols-outlined text-[16px] font-bold">
            logout
          </span>
        </div>
      </div>
    </div>
  );
};
