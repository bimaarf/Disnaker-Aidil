import React from "react";
import { useNavigate } from "react-router-dom";
import { MissionItems } from "./Components/missionItems";
import { useSelector } from "react-redux";

export const LoyaltyMissions = () => {
  const navigate = useNavigate();
  const theme = useSelector((state) => state.themes.theme);
  return (
    <>
      <div className={`bg-${theme?.name}-950/10 md:p-4 space-y-4`}>
        <div className="p-3 bg-gradient-to-t from-yellow-700 to-yellow-500 text-center text-white text-sm uppercase">
          <p
            onClick={() => navigate("/loyalty/rewards")}
            className="float-left hover:brightness-90 duration-100 cursor-pointer material-symbols-outlined">
            arrow_back
          </p>
          <h1>Misi</h1>
        </div>
        <MissionItems theme={theme} />
      </div>
      {/* Navigation Tabs */}
    </>
  );
};
