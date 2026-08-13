import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { CircularLoader } from "../../../../Components/_CircularLoader";
import {
  fetchUser,
  selectUserDetail,
} from "../../../../features/users/userSlice";
// import { ProfileHeader } from "../__dashboard/__components/__profile/other/__profileHeader";
import { TabsAccounts } from "./__components/__tabs";
import AccountSetting from "./_accountSetting";
import { selectUser } from "../../../../features/authentication/AuthSlice";
import { AccountPassword } from "./_accountPassword";
import { selectLocalTheme } from "../../../../features/LandingPages/themeSlice";
import { Settings, AlertCircle, ArrowLeft } from "lucide-react";

export const AccountPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const email = new URLSearchParams(location.search).get("email");

  const theme = useSelector(selectLocalTheme);
  const currentUser = useSelector(selectUser);

  const [tabSelect, setTabSelect] = useState(null);
  const { data: user, status: detailStatus } = useSelector((state) =>
    selectUserDetail(state, email)
  );

  useEffect(() => {
    if (email && detailStatus === "idle") {
      dispatch(fetchUser(email));
    }
  }, [email, detailStatus, dispatch]);

  const getThemeClasses = () => {
    return {
      background:
        theme === "wireframe"
          ? "bg-base-300/25"
          : "bg-base-300/25 dark:bg-base-100",
      cardBg: theme === "wireframe" ? "bg-base-100" : "bg-base-200",
      cardBorder: theme === "wireframe" ? "border-base-200" : "border-base-200",
      text: theme === "wireframe" ? "text-base-content" : "text-base-content",
      textMuted:
        theme === "wireframe"
          ? "text-base-content/60"
          : "text-base-content/60 dark:text-base-content/60",
      accent: theme === "wireframe" ? "bg-base-300/30" : "bg-base-300/30",
      hover:
        theme === "wireframe" ? "hover:bg-base-300/30" : "hover:bg-base-300/30",
    };
  };

  const themeClasses = getThemeClasses();

  if (detailStatus === "loading") {
    return (
      <div className={`min-h-screen`}>
        <div className="">
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-2">
            <div className="relative">
              <CircularLoader />
              <div className="absolute inset-0 bg-base-100 dark:bg-base-200 rounded-full blur-xl animate-pulse"></div>
            </div>
            <div className="text-center space-y-4 max-w-md">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
              </div>
              <h3 className={`text-2xl font-bold ${themeClasses.text}`}>
                Loading Account
              </h3>
              <p
                className={`text-base leading-relaxed ${themeClasses.textMuted}`}>
                Please wait while we fetch the user data. This might take a few
                moments...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (detailStatus === "success" && !user) {
    return (
      <div className={`min-h-screen`}>
        <div className="">
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-2">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-error/20 to-error/20 rounded-3xl flex items-center justify-center border border-error/30 backdrop-blur-sm">
                <AlertCircle className="w-16 h-16 text-red-500/70" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-bold">!</span>
              </div>
            </div>
            <div className="text-center space-y-6 max-w-lg">
              <h3 className={`text-3xl font-bold ${themeClasses.text}`}>
                No User Found
              </h3>
              <p
                className={`${themeClasses.textMuted} leading-relaxed text-lg`}>
                {`We couldn't find any user data for the requested account. Please
                check the email parameter and try again.`}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.history.back()}
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-info text-white rounded-2xl font-medium hover:from-blue-700 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
                  <ArrowLeft className="w-5 h-5" />
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen`}>
      <div className="mx-auto max-w-screen-lg space-y-2">
        {/* Profile Header */}
        {/* <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-success/5 to-success/5 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
          <div
            className={`relative ${themeClasses.cardBg} rounded-3xl border ${themeClasses.cardBorder} shadow-xl ${themeClasses.hover} transition-all duration-300 overflow-hidden`}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-info"></div>
            <ProfileHeader data={user} />
          </div>
        </div> */}

        {/* Main Content */}
        <div
          className={`${themeClasses.cardBg} rounded-3xl border ${themeClasses.cardBorder} shadow-sm backdrop-blur-sm overflow-hidden`}>
          <div className="p-6 lg:p-8 space-y-2">
            {/* Section Header */}
            <div className="text-center space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-info rounded-3xl flex items-center justify-center shadow-sm backdrop-blur-sm">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <div className="text-center sm:text-left">
                  <h2
                    className={`text-xl text-2xl font-bold ${themeClasses.text}`}>
                    Account Management
                  </h2>
                  <p className={`text-base-content/60 text-base mt-1`}>
                    Manage your profile and security settings
                  </p>
                </div>
              </div>
              <div className="w-32 h-1 bg-gradient-to-r from-primary to-info rounded-full mx-auto"></div>
            </div>

            {/* Tab Navigation */}
            <div
              className={`${themeClasses.accent} mx-auto rounded-3xl p-6 border ${themeClasses.cardBorder} shadow-sm backdrop-blur-sm`}>
              <TabsAccounts
                currentUser={currentUser}
                setTabSelect={setTabSelect}
                tabSelect={tabSelect}
              />
            </div>

            {/* Content Area */}
          </div>
        </div>
        <div className="space-y-2 mx-auto">
          {/* Security Settings - Always Show */}
          {!tabSelect && (
            <AccountPassword currentUser={currentUser} user={user} />
          )}

          {/* Profile Settings - Show when Setting tab is active and user is not regular user */}
          {tabSelect === "Setting" && (
            <AccountSetting currentUser={currentUser} user={user} />
          )}
        </div>
        {/* Help Text */}
        <div className="text-center pt-8 border-t border-base-300/30">
          <p className={`text-sm ${themeClasses.textMuted}`}>
            Need help? Contact our support team for assistance with your account
            settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
