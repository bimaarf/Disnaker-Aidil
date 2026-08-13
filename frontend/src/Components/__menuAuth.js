import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  logout,
  resetState,
  selectIsAuthenticated,
} from "../features/authentication/AuthSlice";
import { resetDepositState } from "../features/deposits/depositSlice";
import { resetWalletState } from "../features/wallets/walletSlice";
import { resetWithdrawState } from "../features/withdraws/withdrawSlice";

export const MenuAuth = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const dispatch = useDispatch();
  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetState());
    navigate("/");
    dispatch(resetWalletState());
    dispatch(resetWithdrawState());
    dispatch(resetDepositState());
  };

  const menu = [
    {
      icon: "featured_seasonal_and_gifts",
      label: "Bonus",
      url: "/bonus",
    },
    {
      label: "Pesan",
      icon: "message",
      url: "/messages/inbox",
    },
    {
      label: "Games",
      icon: "playing_cards",
      url: "/games",
      subMenu: [
        {
          label: "Hot Games",
          url: "/games",
        },
        {
          label: "Slot",
          url: "/games",
        },
        {
          label: "Live Casino",
          url: "/games",
        },
        {
          label: "Togel",
          url: "/games",
        },
        {
          label: "Olahraga",
          url: "/games",
        },
        {
          label: "Crash Game",
          url: "/games",
        },
        {
          label: "Arcade",
          url: "/games",
        },
        {
          label: "Poker",
          url: "/games",
        },
        {
          label: "E-Sports",
          url: "/games",
        },
        {
          label: "Sabung Ayam",
          url: "/games",
        },
      ],
    },
    {
      label: "Hadiah Loyalitas",
      icon: "social_leaderboard",
      url: "/loyalty/rewards",
    },
    {
      label: "Riwayat Taruhan",
      icon: "event_note",
      url: "/statement/consolidate",
    },
    {
      label: "Riwayat Klaim",
      icon: "event_note",
      url: "/history/bonus",
    },
    {
      label: "Referensi",
      icon: "groups",
      url: "/referral/guidance",
    },
  ];
  const theme = useSelector((state) => state.themes.theme);
  const navigate = useNavigate();
  const renderMenu = (menuItems) => {
    return (
      <ul className="menu -mt-1.5 px-0 rounded-box space-y-0.5 w-full">
        {menuItems.map((item, index) => (
          <li
            key={index}
            className={`from-${theme?.name}-700/10 to-${theme?.name}-700/10 bg-gradient-to-r bg-base-100`}>
            {item.subMenu ? (
              <details>
                <summary>
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {item.label}
                </summary>
                {renderMenu(item.subMenu)}
              </details>
            ) : (
              <div
                onClick={() => {
                  navigate(item.url);
                }}>
                <span className="material-symbols-outlined">
                  {item.icon || ""}
                </span>
                {item.label}
              </div>
            )}
          </li>
        ))}
        {isAuthenticated ? (
          <li
            className={`from-${theme?.name}-700/10 to-${theme?.name}-700/10 bg-gradient-to-r`}>
            <div onClick={handleLogout}>
              <span className="material-symbols-outlined">logout</span>
              Logout
            </div>
          </li>
        ) : (
          <li
            className={`from-${theme?.name}-700/10 to-${theme?.name}-700/10 bg-gradient-to-r`}>
            <div
              onClick={() => {
                navigate("/login");
              }}>
              <span className="material-symbols-outlined">login</span>
              Masuk
            </div>
          </li>
        )}
      </ul>
    );
  };

  return <>{renderMenu(menu)}</>;
};
