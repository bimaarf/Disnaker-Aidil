import React from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { ReferralGuidance } from "./referralGuidance";
import { SignupsSummary } from "./signupsSummary";

export const Referral = ({ children }) => {
  const theme = useSelector((state) => state.themes.theme);

  const menu = [
    {
      label: "Referensi",
      icon: "groups",
      url: "/referral/guidance",
    },
    {
      label: "Ringkasan Pendaftaran",
      icon: "co_present",
      url: "/referral/signups-summary",
    },
  ];

  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      {/* Navigation Tabs */}
      <div className="flex items-center justify-start overflow-x-auto whitespace-nowrap border-b border-yellow-500/30">
        {menu.map((item, key) => (
          <div
            key={key}
            onClick={() => navigate(item.url)}
            className={`${
              location.pathname.split("/")[2] === item.url.split("/")[2]
                ? `bg-${theme?.name}-600/30 text-yellow-500`
                : `bg-${theme?.name}-600/10`
            } hover:bg-${
              theme?.name
            }-600/30 md:flex-row flex-col flex uppercase cursor-pointer items-center text-xs gap-1 py-2 px-4 w-fit font-medium`}>
            <span className="material-symbols-outlined">{item.icon}</span>
            <p>{item.label} </p>
          </div>
        ))}
      </div>
      <div className={`bg-${theme.name}-600/10 p-2 md:p-6 min-h-[70vh]`}>
        {children ? (
          children
        ) : (
          <>
            {location.pathname === "/referral/guidance" && <ReferralGuidance />}
            {location.pathname === "/referral/signups-summary" && (
              <SignupsSummary />
            )}
            {/* {location.pathname === "/change-password" && <ChangePassword />} */}
          </>
        )}
      </div>
    </>
  );
};
