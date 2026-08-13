import React from "react";
import { useNavigate } from "react-router-dom";
import useIsMobile from "../../../../../../Context/__useIsMobile";

export const LoyaltyMenu = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const menu = [
    {
      icon: "sync_alt",
      label: "Penukaran",
      url: "/loyalty/rewards",
    },
    {
      icon: "event_available",
      label: "Misi",
      url: "/loyalty/missions",
    },
    {
      icon: "trophy",
      label: "Hasil Lucky Draw",
      url: "/loyalty/missions",
    },
    {
      icon: "schedule",
      label: "Riwayat",
      url: "/loyalty/progress-history",
    },
    {
      icon: "event_note",
      label: "Cara Kerja",
      url: "/loyalty/ways-of-working",
    },
  ];
  return (
    <>
      <div className="flex justify-around whitespace-normal md:justify-start items-start gap-4 mt-4">
        {menu.map((item, key) => (
          <div
            key={key}
            onClick={() => navigate(item.url)}
            className="flex-col active:scale-95 cursor-pointer hover:brightness-90 hover:text-yellow-500 duration-200 flex justify-center items-center text-center">
            <div className="px-4 py-2 text-sm font-medium bold flex items-center gap-2 rounded border-base-300 border bg-base-300/30">
              <span className="material-symbols-outlined text-yellow-500">
                {item.icon}
              </span>
              {!isMobile && <p>{item.label}</p>}
            </div>
            {isMobile && <p className="text-xs my-2">{item.label}</p>}
          </div>
        ))}
      </div>
    </>
  );
};
