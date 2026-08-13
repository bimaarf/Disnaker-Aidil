import React from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../../../../../features/authentication/AuthSlice";
import {
  Settings,
  Shield,
  UserCircle,
  GraduationCap,
  Users,
} from "lucide-react";

export const ProfileHeader = () => {
  const user = useSelector(selectUser);

  const getRoleIcon = (role) => {
    switch (role) {
      case "teacher":
      case "administrator":
        return GraduationCap;
      case "student":
      case "user":
        return UserCircle;
      default:
        return Users;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "administrator":
        return {
          bg: "bg-error/10",
          border: "border-error/20",
          text: "text-error",
        };
      case "teacher":
        return {
          bg: "bg-primary/10",
          border: "border-primary/20",
          text: "text-primary",
        };
      case "student":
      case "user":
        return {
          bg: "bg-success/10",
          border: "border-success/20",
          text: "text-success",
        };
      default:
        return {
          bg: "bg-info/10",
          border: "border-info/20",
          text: "text-info",
        };
    }
  };

  const RoleIcon = getRoleIcon(user?.role);
  const roleColor = getRoleColor(user?.role);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary to-secondary dark:from-base-100 dark:to-base-300">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent dark:from-black/30 dark:to-transparent"></div>
        {/* Floating orbs */}
        <div className="absolute top-4 right-8 w-16 h-16 bg-primary-content/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-8 left-4 w-12 h-12 bg-accent/20 rounded-full blur-lg animate-bounce"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* Avatar Section */}
            <div className="relative group flex-shrink-0">
              {user?.avatar && user.avatar !== "default.jpg" ? (
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-base-content/10 backdrop-blur-sm border-2 border-base-content/20 p-1">
                    <div className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/10">
                      <img
                        src={`${process.env.REACT_APP_API}user/images/${user?.avatar}`}
                        alt="User Avatar"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                  </div>

                  {/* Online Status */}
                  <div className="absolute -bottom-1 -right-1 flex items-center justify-center">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-success rounded-full border-3 border-primary-content">
                      <div className="w-full h-full rounded-full bg-success/80 animate-ping opacity-75"></div>
                    </div>
                    <div className="absolute w-3 h-3 sm:w-4 sm:h-4 bg-success rounded-full"></div>
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-base-content/10 backdrop-blur-sm border-2 border-base-content/20 flex items-center justify-center group-hover:border-base-content/30 transition-colors duration-300">
                  <span className="text-3xl sm:text-4xl font-bold text-primary-content">
                    {user?.name?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
              )}
            </div>

            {/* User Info Section */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              {/* Name and Role */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-primary-content drop-shadow-lg">
                  {user?.name || "Unknown User"}
                </h1>

                {/* Badges Row */}
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  {/* Role Badge */}
                  {user?.role && (
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${roleColor.bg} backdrop-blur-sm border ${roleColor.border}`}>
                      <RoleIcon className={`w-3.5 h-3.5 ${roleColor.text}`} />
                      <span
                        className={`text-xs font-semibold ${roleColor.text} capitalize`}>
                        {user.role === "administrator" ? "Admin" : user.role}
                      </span>
                    </div>
                  )}

                  {/* Online Status Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-base-content/10 backdrop-blur-sm border border-base-content/20">
                    <div className="relative flex items-center justify-center">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <div className="absolute w-2 h-2 bg-success rounded-full animate-ping"></div>
                    </div>
                    <span className="text-xs font-medium text-primary-content/90">
                      Online
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Info - Desktop Only */}
              <div className="hidden sm:flex flex-col gap-2">
                {/* Email */}
                {user?.email && (
                  <div className="flex items-center gap-2 text-sm text-primary-content/80">
                    <div className="w-1 h-1 rounded-full bg-primary-content/60"></div>
                    <span>{user.email}</span>
                  </div>
                )}

                {/* Member Since */}
                {user?.registered && (
                  <div className="flex items-center gap-2 text-sm text-primary-content/80">
                    <div className="w-1 h-1 rounded-full bg-primary-content/60"></div>
                    <span>Member since {user.registered}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Settings Button - Desktop Only */}
            <div className="hidden sm:block flex-shrink-0">
              <button className="group relative px-4 py-2.5 rounded-xl bg-base-content/10 hover:bg-base-content/20 backdrop-blur-sm border border-base-content/20 hover:border-base-content/30 transition-all duration-300">
                <div className="flex items-center gap-2 text-primary-content">
                  <Settings className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
                  <span className="text-sm font-medium">Settings</span>
                </div>
              </button>
            </div>
          </div>

          {/* Server Info Bar - Mobile */}
          <div className="sm:hidden mt-4 pt-4 border-t border-base-content/10">
            <div className="flex items-center justify-center gap-2 text-xs text-primary-content/70">
              <Shield className="w-3.5 h-3.5" />
              <span className="font-medium">Connected to</span>
              <code className="px-2 py-1 rounded bg-black/20 text-primary-content/90 font-mono text-[10px]">
                {process.env.REACT_APP_URL || "localhost"}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
