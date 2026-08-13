import React from "react";
import {
  Bell,
  ChevronRight,
  Home,
  LogOut,
  User,
  Calendar,
  MonitorSmartphone,
} from "lucide-react";
import useIsMobile from "../Context/__useIsMobile";
import { useSelector } from "react-redux";
import { selectUser } from "../features/authentication/AuthSlice";
import { useNavigate } from "react-router-dom";

export const BoxMenu = ({ handleLogout }) => {
  // Mock data
  const user = useSelector(selectUser);
  const isAuthenticated = true;
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const menu = [
    {
      label: "Home",
      icon: Home,
      theme: "primary",
      url: `/`,
      badge: null,
      description: "Dashboard utama",
    },
    {
      label: "Manage Service ",
      icon: Calendar,
      theme: "success",
      url: `/service-management`,
      badge: "5",
      description: "Manajemen Layanan",
    },
    {
      label: "Notifications",
      icon: Bell,
      theme: "warning",
      url: "/notifications",
      badge: "12",
      description: "Pemberitahuan terbaru",
    },
    {
      label: "Account",
      icon: User,
      theme: "info",
      url: isAuthenticated ? `/users/account?email=${user?.email}` : "/login",
      badge: null,
      description: "Profil & pengaturan",
    },
  ];

  const themeColors = {
    primary: {
      gradient: "from-blue-500 via-blue-600 to-indigo-600",
      hover: "hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700",
    },
    success: {
      gradient: "from-emerald-500 via-green-600 to-teal-600",
      hover: "hover:from-emerald-600 hover:via-green-700 hover:to-teal-700",
    },
    warning: {
      gradient: "from-amber-500 via-orange-600 to-yellow-600",
      hover: "hover:from-amber-600 hover:via-orange-700 hover:to-yellow-700",
    },
    info: {
      gradient: "from-cyan-500 via-sky-600 to-blue-600",
      hover: "hover:from-cyan-600 hover:via-sky-700 hover:to-blue-700",
    },
    error: {
      gradient: "from-rose-500 via-red-600 to-pink-600",
      hover: "hover:from-rose-600 hover:via-red-700 hover:to-pink-700",
    },
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 pb-4 lg:pb-6">
      {/* Mobile: Overlapping Card Container */}
      <div className="lg:hidden mb-6">
        <div className="bg-base-100 dark:bg-base-300 rounded-3xl shadow-sm border border-base-300 p-4">
          {/* Mobile Header */}
          {!isMobile && (
            <div className="text-center mb-4">
              <div className="divider divider-primary text-sm">Main Menu</div>
              <p className="text-base-content/60 text-xs">
                Pilih menu untuk mengakses fitur
              </p>
            </div>
          )}

          {/* Mobile Menu Grid */}
          <div className="grid grid-cols-5 gap-2">
            {menu.map((item, key) => {
              const theme = themeColors[item.theme];
              const IconComponent = item.icon;

              return (
                <div
                  key={key}
                  onClick={() => navigate(item.url)}
                  className="group relative cursor-pointer"
                  role="button"
                  tabIndex={0}>
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative inline-flex">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-br ${theme.gradient} shadow-sm transition-all duration-200 active:scale-95`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>

                      {item.badge && (
                        <div className="absolute -top-1 -right-1 min-w-[18px] h-5 bg-error text-error-content text-xs font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                          {item.badge}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-base-content/70 mt-1 text-center leading-tight">
                      {item.label.split(" ")[0]}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Mobile Logout */}
            <div
              onClick={() => handleLogout && handleLogout()}
              className="group relative cursor-pointer"
              role="button"
              tabIndex={0}>
              <div className="flex flex-col items-center justify-center">
                <div className="relative inline-flex">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${themeColors.error.gradient} shadow-sm transition-all duration-200 active:scale-95`}>
                    <LogOut className="w-6 h-6 text-white" />
                  </div>
                </div>
                <span className="text-[10px] text-base-content/70 mt-1 text-center leading-tight">
                  Logout
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Original Header Section */}
      <div className="text-center mb-4">
        <div className="divider divider-primary text-sm">Main Menu</div>
        <p className="text-base-content/60 text-xs">
          Pilih menu untuk mengakses fitur
        </p>
      </div>
      {/* Desktop Menu Grid */}
      <div className="hidden lg:grid grid-cols-4 gap-6 mb-6">
        {menu.map((item, key) => {
          const theme = themeColors[item.theme];
          const IconComponent = item.icon;

          return (
            <div
              key={key}
              onClick={() => navigate(item.url)}
              className="group relative cursor-pointer"
              role="button"
              tabIndex={0}>
              <div className="relative bg-base-200 rounded-3xl overflow-hidden border border-base-300 transition-all duration-300 hover:border-base-content/20 hover:shadow-sm hover:-translate-y-1">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                />

                <div className="relative p-6 flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} rounded-2xl blur-md opacity-20 group-hover:opacity-30 transition-opacity duration-300`}
                    />
                    <div
                      className={`relative bg-gradient-to-br ${theme.gradient} ${theme.hover} p-4 rounded-2xl shadow-sm transition-all duration-300 group-hover:scale-105`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>

                    {item.badge && (
                      <div className="absolute -top-1 -right-1 min-w-[24px] h-6 bg-error text-error-content text-xs font-bold rounded-full flex items-center justify-center px-1.5 animate-pulse">
                        {item.badge}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-base-content group-hover:text-primary transition-colors duration-300">
                      {item.label}
                    </h3>
                    <p className="text-sm text-base-content/60">
                      {item.description}
                    </p>
                  </div>

                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <ChevronRight className="w-5 h-5 text-base-content/40" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Bottom Actions */}
      <div className="border-t border-base-200 hidden lg:block">
        <div className="grid sm:grid-cols-2 grid-cols-1 gap-6 pt-6">
          {/* Landing Management */}
          {user.role !== "user" && (
            <div
              onClick={() => navigate("/landing-management")}
              className="group relative cursor-pointer"
              role="button"
              tabIndex={0}>
              <div className="relative bg-base-200 rounded-3xl overflow-hidden border border-base-300 transition-all duration-300 hover:border-base-content/20 hover:shadow-sm hover:-translate-y-1">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${themeColors.warning.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                />

                <div className="relative p-6 flex items-center gap-4">
                  <div className="relative">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${themeColors.warning.gradient} rounded-xl blur-md opacity-20 group-hover:opacity-30 transition-opacity duration-300`}
                    />
                    <div
                      className={`relative bg-gradient-to-br ${themeColors.warning.gradient} ${themeColors.warning.hover} p-4 rounded-xl shadow-sm transition-all duration-300`}>
                      <MonitorSmartphone className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-base-content mb-1 group-hover:text-warning transition-colors duration-300">
                      Landing Management
                    </h3>
                    <p className="text-sm text-base-content/60">
                      Konfigurasi Landing Pages
                    </p>
                  </div>

                  <ChevronRight className="w-6 h-6 text-base-content/40 group-hover:text-base-content/80 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>
            </div>
          )}

          {/* Desktop Logout */}
          <div
            onClick={() => handleLogout && handleLogout()}
            className="group relative cursor-pointer"
            role="button"
            tabIndex={0}>
            <div className="relative bg-base-200 rounded-3xl overflow-hidden border border-base-300 transition-all duration-300 hover:border-error/40 hover:shadow-sm hover:-translate-y-1">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${themeColors.error.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
              />

              <div className="relative p-6 flex items-center gap-4">
                <div className="relative">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${themeColors.error.gradient} rounded-xl blur-md opacity-20 group-hover:opacity-30 transition-opacity duration-300`}
                  />
                  <div
                    className={`relative bg-gradient-to-br ${themeColors.error.gradient} ${themeColors.error.hover} p-4 rounded-xl shadow-sm transition-all duration-300`}>
                    <LogOut className="w-8 h-8 text-white" />
                  </div>
                </div>

                <div className="flex-1 text-left">
                  <h3 className="text-lg font-semibold text-base-content mb-1 group-hover:text-error transition-colors duration-300">
                    Logout
                  </h3>
                  <p className="text-sm text-base-content/60">
                    Keluar dari akun
                  </p>
                </div>

                <ChevronRight className="w-6 h-6 text-base-content/40 group-hover:text-error group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="sm:mt-8 mt-4 text-center">
        <p className="text-xs text-base-content/40 lg:block hidden">
          © 2025 Dashboard System
        </p>
        <p className="text-xs text-base-content/40 lg:hidden">
          Klik pada menu untuk mengakses fitur
        </p>
      </div>
    </div>
  );
};
