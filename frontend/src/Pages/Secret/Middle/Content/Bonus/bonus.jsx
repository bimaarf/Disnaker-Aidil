import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BonusComponent } from "./Components/bonusComponent";
import { useSelector } from "react-redux";
import useIsMobile from "../../../../../Context/__useIsMobile";

export const Bonus = ({ children }) => {
  const isMobile = useIsMobile();
  const menu = [
    {
      label: "Bonus",
      icon: "featured_seasonal_and_gifts",
      url: "/bonus",
    },
    {
      label: "Komisi",
      icon: "percent",
      url: "/bonus/commission",
    },
    {
      label: "CashBack",
      icon: "paid",
      url: "/bonus/cashback",
    },
    {
      label: "Riwayat Klaim",
      icon: "text_snippet",
      url: "/bonus/history",
    },
  ];

  // Exclude "Riwayat Klaim" when on mobile
  const filteredMenu = isMobile
    ? menu.filter((item) => item.label !== "Riwayat Klaim")
    : menu;

  const location = useLocation();
  const navigate = useNavigate();
  const theme = useSelector((state) => state.themes.theme);
  return (
    <>
      {/* Navigation Tabs */}
      <div
        className={`flex bg-base-100 w-fit items-center  ${
          isMobile ? "justify-center mx-auto" : "justify-start"
        } overflow-x-auto whitespace-nowrap border-b border-yellow-500/30`}>
        {filteredMenu.map((item, key) => (
          <div
            key={key}
            onClick={() => navigate(item.url)}
            className={`${
              location.pathname.split("/")[2] === item.url.split("/")[2]
                ? `bg-${theme?.name}-600/30 text-yellow-500`
                : `bg-base-300/10`
            } hover:bg-${
              theme?.name
            }-600/30 md:flex-row flex-col flex uppercase cursor-pointer items-center text-xs gap-1 py-2 px-6 font-medium`}>
            <span className="material-symbols-outlined">{item.icon}</span>
            <p>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Content Rendering */}
      {children ? (
        children
      ) : (
        <>
          {location.pathname === "/deposit/qris" && <BonusComponent />}
          {/* {location.pathname === "/change-password" && <ChangePassword />} */}
        </>
      )}
    </>
  );
};
