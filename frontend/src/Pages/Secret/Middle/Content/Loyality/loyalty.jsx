import React from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../../../../features/authentication/AuthSlice";
import { ReactComponent as BronzeIcon } from "../../../../../Images/Avatar/bronze.svg";
import { LoyaltyBronze } from "./Components/loyaltyBronze";
import { LoyaltyContent } from "./Components/loyaltyContent";
import { LoyaltyMenu } from "./Components/loyaltyMenu";

export const Loyalty = () => {
  const currentUser = useSelector(selectUser);
  const theme = useSelector((state) => state.themes.theme);
  return (
    <>
      <div className={`bg-${theme?.name}-950/10 md:p-4 space-y-4`}>
        <div className="p-3 bg-gradient-to-t from-yellow-700 to-yellow-500 text-center text-white text-sm uppercase">
          <h1>Hadiah Loyalitas</h1>
        </div>

        <LoyaltyBronze currentUser={currentUser} BronzeIcon={BronzeIcon} />
        <LoyaltyMenu />
        <LoyaltyContent />
      </div>
      {/* Navigation Tabs */}
    </>
  );
};
