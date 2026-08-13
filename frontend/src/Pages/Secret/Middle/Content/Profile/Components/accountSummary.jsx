import React from "react";
import { ReactComponent as BronzeIcon } from "../../../../../../Images/Avatar/bronze.svg";
import { useSelector } from "react-redux";
import { selectUser } from "../../../../../../features/authentication/AuthSlice";
import useIsMobile from "../../../../../../Context/__useIsMobile";
import { DesktopProfileBadge } from "./_desktopProfileBadge";
import { AccountInformation } from "./_accountInformation";
import { DepositHistory } from "./_depositHistory";
import { Profile } from "../profile";

export const AccountSummary = () => {
  const currentUser = useSelector(selectUser);
  const isMobile = useIsMobile();
  const theme = useSelector((state) => state.themes.theme);
  return (
    <Profile>
      <div className={`bg-${theme?.name}-950/10 md:p-4`}>
        {!isMobile && (
          <DesktopProfileBadge
            currentUser={currentUser}
            BronzeIcon={BronzeIcon}
          />
        )}
        <AccountInformation theme={theme} currentUser={currentUser} />
        <DepositHistory currentUser={currentUser} />
      </div>
    </Profile>
  );
};
