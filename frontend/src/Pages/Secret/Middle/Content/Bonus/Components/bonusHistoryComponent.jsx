import React from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import "../../../../../components/button.css";
import { Bonus } from "../bonus";
export const BonusHistoryComponent = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuButton = [
    {
      label: "Riwayat Bonus",
      url: "/bonus/history",
    },
    {
      label: "Riwayat Komisi",
      url: "/bonus/history/commission",
    },
    {
      label: "Riwayat Cashback",
      url: "/bonus/history/cashback",
    },
    {
      label: "Riwayat Penyesuaian",
      url: "/bonus/history/adjustment",
    },
  ];
  const theme = useSelector((state) => state.themes?.theme);
  return (
    <Bonus>
      <div className={`bg-${theme?.name}-950/10 md:p-4 space-y-4`}>
        <div className={`flex items-center mt-4`}>
          {menuButton.map((item, key) => (
            <button
              key={key}
              onClick={() => navigate(item.url)}
              className={`${
                location.pathname === item.url
                  ? "bg-yellow-600"
                  : "bg-base-300/50"
              } px-6 py-2 text-white font-medium whitespace-nowrap uppercase text-sm hover:brightness-90 duration-100 text-pretty`}>
              {item.label}
            </button>
          ))}
        </div>

        {children}
      </div>
    </Bonus>
  );
};
