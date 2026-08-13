import React from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { BronzeProfile } from "./bronzeProfile";
import { AccountSummary } from "./Components/accountSummary";
import { ChangePassword } from "./Components/changePassword";
import useIsMobile from "../../../../../Context/__useIsMobile";
import { selectUser } from "../../../../../features/authentication/AuthSlice";

export const Profile = ({ children }) => {
  const theme = useSelector((state) => state.themes.theme);

  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const currentUser = useSelector(selectUser);
  const menu = [
    {
      label: "Akun Saya",
      icon: "account_balance",
      url: "/account-summary",
    },
    {
      label: "Ubah Kata Sandi",
      icon: "lock",
      url: "/change-password",
    },
    {
      label: isMobile ? "Perbarui Profil" : "Perbarui Detail Akun",
      icon: "edit_note",
      url: "/account-details",
    },
    {
      label: "Riwayat Penukaran",
      icon: "text_snippet",
      url: "https://g9king-1.com/download-apk",
    },
  ];

  return (
    <>
      {/* Navigation Tabs */}
      {!isMobile && (
        <div
          className={`flex items-center justify-start overflow-x-auto whitespace-nowrap border-b border-yellow-500/30`}>
          {menu.map((item, key) => (
            <div
              key={key}
              onClick={() =>
                item.icon === "text_snippet"
                  ? (window.location.href = item.url)
                  : navigate(item.url)
              }
              className={`${
                location.pathname === item.url
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
      )}

      {/* Content Rendering */}
      {isMobile && (
        <div className={`bg-${theme?.name}-950/30 pb-2 overflow-hidden`}>
          <div className="bg-gradient-to-b from-white/30 to-base-300/50 p-2">
            <div className="flex justify-between items-center">
              <p className="text-white font-bold uppercase">
                {currentUser?.name}
              </p>
              <div className="w-2/6 flex items-center gap-2">
                <div className="rounded bg-base-100 flex justify-between items-center px-2 font-mono">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-xs">IDR</p>
                    <p className="font-bold text-xs text-success">0.00</p>
                  </div>
                  <p className="material-symbols-outlined">arrow_drop_down</p>
                </div>
                <span className="material-symbols-outlined text-yellow-500 active:animate-spin">
                  refresh
                </span>
              </div>
            </div>
          </div>
          <BronzeProfile />
          <div
            className={`flex mx-2 items-center justify-center bg-base-100 p-2 border-b border-yellow-500/30`}>
            {menu.map((item, key) => (
              <div
                key={key}
                onClick={() =>
                  item.icon === "text_snippet"
                    ? (window.location.href = item.url)
                    : navigate(item.url)
                }
                className={`${
                  location.pathname === item.url
                    ? `bg-${theme?.name}-600/30 text-yellow-500`
                    : `bg-transparent`
                } hover:bg-${
                  theme?.name
                }-600/30 md:flex-row flex-col flex uppercase whitespace-normal text-center cursor-pointer items-center gap-1 py-2 px-1 w-1/4 font-medium`}>
                <span className="material-symbols-outlined">{item.icon}</span>
                <p className="text-[10px]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {children ? (
        children
      ) : (
        <>
          {location.pathname === "/account-summary" && <AccountSummary />}
          {location.pathname === "/change-password" && <ChangePassword />}
        </>
      )}
    </>
  );
};
