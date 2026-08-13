import React from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

export const MenuUser = ({ isMobile, setIsOpen }) => {
  const menu = [
    {
      label: "Akun Saya",
      icon: "person",
      url: "/account-summary",
    },
    {
      label: "BANK",
      icon: "account_balance",
      url: "/deposit/qris",
    },
    {
      label: "Klaim Bonus",
      icon: "featured_seasonal_and_gifts",
      url: "/bonus",
    },
    {
      label: "Hadiah Loyalitas",
      icon: "social_leaderboard",
      url: "/loyalty/rewards",
    },
    {
      label: "Laporan Taruhan",
      icon: "event_note",
      url: "/statement/consolidate",
    },
    {
      label: "Pesan",
      icon: "message",
      url: "/messages/inbox",
    },
    {
      label: "Referensi",
      icon: "groups",
      url: "/referral/guidance",
    },
  ];
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useSelector((state) => state.themes.theme);
  const renderMenu = (menuItems) => {
    return (
      <ul className="space-y-2">
        {menuItems.map((item, index) => (
          <li
            key={index}
            className={`${
              location.pathname.split("/")[1] === item.url.split("/")[1]
                ? `bg-${theme?.name}-950/20 text-${theme?.name}-400`
                : "text-white"
            } hover:bg-base-600/30`}>
            {item.subMenu ? (
              <details open>
                <summary>
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="uppercase">{item.label}</span>
                </summary>
                {renderMenu(item.subMenu)}
              </details>
            ) : (
              <div
                className={`${
                  location.pathname.split("/")[1] === item.url.split("/")[1]
                    ? `bg-${theme?.name}-950/20 text-${theme?.name}-400`
                    : "text-white"
                } hover:bg-base-600/30`}
                onClick={() => {
                  if (isMobile) {
                    setIsOpen(false);
                  }
                  navigate(item.url);
                }}>
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="uppercase">{item.label}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return <>{renderMenu(menu)}</>;
};
