import React from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { WithdrawalBank } from "./withdrawalBankContent";

export const Withdrawal = ({ children }) => {
  const theme = useSelector((state) => state.themes.theme);

  const menu = [
    {
      label: "Deposit",
      icon: "account_balance",
      url: "/deposit/qris",
    },
    {
      label: "Penarikan",
      icon: "lock",
      url: "/withdrawal/bank",
    },
    {
      label: "Transaksi Saya",
      icon: "edit_note",
      url: "/deposit-history",
    },
    {
      label: "Akun Saya",
      icon: "text_snippet",
      url: "/redemption-history",
    },
  ];

  const location = useLocation();
  const navigate = useNavigate();
  const menuButton = [
    {
      label: "Bank/VA",
      url: "/withdrawal/bank",
      icon: "payment",
    },
    {
      label: "E-Money",
      url: "/withdrawal/e-money",
      icon: "payment",
    },
  ];
  return (
    <>
      {/* Navigation Tabs */}
      <div className="flex items-center justify-start overflow-x-auto whitespace-nowrap border-b border-yellow-500/30">
        {menu.map((item, key) => (
          <div
            key={key}
            onClick={() => navigate(item.url)}
            className={`${
              location.pathname.split("/")[1] === item.url.split("/")[1]
                ? `bg-${theme?.name}-600/30 text-yellow-500`
                : `bg-${theme?.name}-600/10`
            } hover:bg-${
              theme?.name
            }-600/30 md:flex-row flex-col flex uppercase cursor-pointer items-center text-xs gap-1 py-2 px-4 w-fit font-medium`}>
            <span className="material-symbols-outlined">{item.icon}</span>
            <p>{item.label}</p>
          </div>
        ))}
      </div>
      <div className={`bg-${theme.name}-950/10 p-2 md:p-4 min-h-[70vh]`}>
        <div className="flex justify-between text-sm px-4 py-2 items-center">
          <p className="font-medium">Metode Pembayaran </p>
          <p className="underline">Riwayat Penarikan</p>
        </div>
        <div className="flex mt-2 px-4 py-2 justify-center items-center gap-2 font-body">
          {menuButton.map((item, key) => (
            <div
              onClick={() => navigate(item.url)}
              key={key}
              className={`${
                location.pathname === item.url
                  ? "bg-gradient-to-t from-yellow-600 to-yellow-400 text-white"
                  : "bg-white/80 text-base-100"
              } w-1/2 shadow text-center font-bold text-sm py-2 px-3 rounded cursor-pointer hover:brightness-90 duration-100`}>
              <span className="material-symbols-outlined">{item.icon}</span>
              <p>{item.label}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-4">
          <div
            className={`bg-gradient-to-r w-full mt-4 from-${theme?.name}-800 via-${theme?.name}-500 max-w-screen-sm to-${theme?.name}-800 rounded-full p-[1px]`}></div>
        </div>
        <div className="flex justify-end items-center gap-4">
          <p className="bg-success px-2 py-1 text-white font-bold font-body rounded-full text-[10px]">
            Instan
          </p>
        </div>
        <div>
          {/* Content Rendering */}
          {children ? (
            children
          ) : (
            <>
              {location.pathname === "/withdrawal/bank" && <WithdrawalBank />}
              {/* {location.pathname === "/change-password" && <ChangePassword />} */}
            </>
          )}
        </div>
      </div>
    </>
  );
};
