import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  logout,
  resetState,
  selectUser,
} from "../../../../features/authentication/AuthSlice";

import { ProfileHeader } from "./__components/__profile/__profileHeader";
import { BoxMenu } from "../../../../Components/_BoxMenu";
import useIsMobile from "../../../../Context/__useIsMobile";
import DetailedProfile from "./__components/_detailedProfile";
const Dashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetState());
    navigate("/");
  };

  useEffect(() => {
    if (!user) {
      handleLogout();
    }
  }, [user]);
  return (
    <>
      <div className="rounded-xl">
        <div className="py-4">
          <div className={`grid grid-cols-1 md:grid-cols-9 gap-3`}>
            <div className={`col-span-1 md:col-span-6`}>
              <div className="rounded-3xl relative shadow-sm backdrop-blur-sm bg-base-100 dark:bg-base-100 border border-base-300 overflow-hidden h-fit">
                <ProfileHeader />
                <div
                  className={`flex flex-col ${
                    isMobile && "-mt-[6vh]"
                  } relative z-20 items-center justify-center`}>
                  <BoxMenu handleLogout={handleLogout} />
                </div>
              </div>
              <div className="sm:space-y-2">
                {isMobile && (
                  <div className="mt-2">
                    <DetailedProfile />
                  </div>
                )}
              </div>
            </div>

            {!isMobile && (
              <div
                className={`col-span-1 md:col-span-3 space-y-2 sm:space-y-4 select-none`}>
                <DetailedProfile />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
