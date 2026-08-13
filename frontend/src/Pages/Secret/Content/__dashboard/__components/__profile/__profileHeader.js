import React from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../../../../../features/authentication/AuthSlice";
import { Home, Shield, UserCircle, GraduationCap, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ProfileHeader = () => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
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

  const RoleIcon = getRoleIcon(user?.role);

  const getRoleBadgeClasses = (role) => {
    switch (role) {
      case "administrator":
        return "bg-red-50 dark:bg-error/10 border-red-200 dark:border-error/20 text-red-700 dark:text-error";
      case "teacher":
        return "bg-blue-50 dark:bg-primary/10 border-blue-200 dark:border-primary/20 text-blue-700 dark:text-primary";
      case "student":
      case "user":
        return "bg-green-50 dark:bg-success/10 border-green-200 dark:border-success/20 text-green-700 dark:text-success";
      default:
        return "bg-purple-50 dark:bg-info/10 border-purple-200 dark:border-info/20 text-purple-700 dark:text-info";
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-base-100 dark:to-base-300">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent dark:from-black/30 dark:to-transparent"></div>
        {/* Floating orbs */}
        <div className="absolute top-4 right-8 w-24 h-24 bg-blue-200/30 rounded-full blur-2xl animate-pulse"></div>
        <div
          className="absolute bottom-8 left-4 w-20 h-20 bg-purple-200/30 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "1s" }}></div>
        <div
          className="absolute top-1/2 left-1/3 w-16 h-16 bg-indigo-200/20 rounded-full blur-lg animate-pulse"
          style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* Avatar Section */}
            <div className="relative group flex-shrink-0">
              {user?.avatar && user.avatar !== "default.jpg" ? (
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/80 dark:bg-base-content/10 backdrop-blur-sm border-2 border-indigo-200 dark:border-base-content/20 p-1 shadow-lg">
                    <div className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-blue-100/50 to-purple-100/30 dark:from-primary/20 dark:to-secondary/10">
                      <img
                        src={user?.avatar}
                        alt="User Avatar"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                  </div>

                  {/* Online Status */}
                  <div className="absolute -bottom-1 -right-1 flex items-center justify-center">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-green-500 rounded-full border-3 border-white dark:border-primary-content shadow-md">
                      <div className="w-full h-full rounded-full bg-green-400 animate-ping opacity-75"></div>
                    </div>
                    <div className="absolute w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/80 dark:bg-base-content/10 backdrop-blur-sm border-2 border-indigo-200 dark:border-base-content/20 flex items-center justify-center group-hover:border-indigo-300 dark:group-hover:border-base-content/30 transition-colors duration-300 shadow-lg">
                  <span className="text-3xl sm:text-4xl font-bold text-indigo-600 dark:text-primary-content">
                    {user?.name?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
              )}
            </div>

            {/* User Info Section */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              {/* Name and Role */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-primary-content drop-shadow-sm">
                  {user?.name || "Unknown User"}
                </h1>

                {/* Badges Row */}
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  {/* Role Badge */}
                  {user?.role && (
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-sm border shadow-sm ${getRoleBadgeClasses(
                        user.role
                      )}`}>
                      <RoleIcon className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold capitalize">
                        {user.role === "administrator" ? "Admin" : user.role}
                      </span>
                    </div>
                  )}

                  {/* Online Status Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 dark:bg-base-content/10 backdrop-blur-sm border border-gray-200 dark:border-base-content/20 shadow-sm">
                    <div className="relative flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 dark:bg-success rounded-full"></div>
                      <div className="absolute w-2 h-2 bg-green-500 dark:bg-success rounded-full animate-ping"></div>
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-primary-content/90">
                      Online
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Info - Desktop Only */}
              <div className="hidden sm:flex flex-col gap-2">
                {/* Email */}
                {user?.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-primary-content/80">
                    <div className="w-1 h-1 rounded-full bg-indigo-400 dark:bg-primary-content/60"></div>
                    <span>{user.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Home Button - Desktop Only */}
            <div className="hidden sm:block flex-shrink-0">
              <button
                onClick={() => navigate("/")}
                className="group relative px-4 py-2.5 rounded-xl bg-white/60 hover:bg-white/80 dark:bg-base-content/10 dark:hover:bg-base-content/20 backdrop-blur-sm border border-gray-200 hover:border-indigo-300 dark:border-base-content/20 dark:hover:border-base-content/30 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="flex items-center gap-2 text-gray-700 dark:text-primary-content">
                  <Home className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 duration-300" />
                  <span className="text-sm font-medium">Halaman Utama</span>
                </div>
              </button>
            </div>
          </div>

          {/* Server Info Bar - Mobile */}
          <div className="sm:hidden mt-4 pt-4 border-t border-gray-200 dark:border-base-content/10">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-600 dark:text-primary-content/70">
              <Shield className="w-3.5 h-3.5" />
              <span className="font-medium">Connected to</span>
              <code className="px-2 py-1 rounded bg-gray-200 dark:bg-black/20 text-gray-700 dark:text-primary-content/90 font-mono text-[10px]">
                {process.env.REACT_APP_URL || "localhost"}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
