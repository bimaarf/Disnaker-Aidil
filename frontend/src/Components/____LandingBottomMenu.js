import { Home, Heart, Newspaper, Calendar, Phone } from "lucide-react";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { NavLink, useLocation } from "react-router-dom";
import { selectUser } from "../features/authentication/AuthSlice";
import useIsMobile from "../Context/__useIsMobile";

const LandingBottomMenu = () => {
  const location = useLocation();
  const currentUser = useSelector(selectUser);
  const isMobile = useIsMobile();
  const [isHovered, setIsHovered] = useState(false);

  // Menu items untuk landing page - Colorful rainbow palette
  const landingMenus = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      color: "text-blue-500",
      activeColor: "text-blue-600",
      bgColor: "bg-blue-50",
      url: "/",
    },
    {
      id: "programs",
      label: "Programs",
      icon: Calendar,
      color: "text-green-500",
      activeColor: "text-green-600",
      bgColor: "bg-green-50",
      url: "/events",
    },
    {
      id: "volunteer",
      label: "Volunteer",
      icon: Heart,
      color: "text-red-500",
      activeColor: "text-red-600",
      bgColor: "bg-red-50",
      url: currentUser ? "/registration-volunteer" : "/registration-volunteer",
    },
    {
      id: "articles",
      label: "Articles",
      icon: Newspaper,
      color: "text-purple-500",
      activeColor: "text-purple-600",
      bgColor: "bg-purple-50",
      url: "/blogs",
    },
    {
      id: "contact",
      label: "Contact",
      icon: Phone,
      color: "text-cyan-500",
      activeColor: "text-cyan-600",
      bgColor: "bg-cyan-50",
      url: "/contact-us",
    },
  ];

  // Helper function to check if current path matches menu
  const isActiveMenu = (menuUrl) => {
    if (menuUrl === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(menuUrl);
  };

  // Don't show bottom menu on certain admin/dashboard pages
  const hiddenPaths = [
    "/dashboard",
    "/form/",
    "/users/account",
    "/admin",
    "/login",
    "/register",
  ];

  const shouldHideMenu = hiddenPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  // Function to handle menu click and scroll to top
  const handleMenuClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Don't render if should be hidden
  if (shouldHideMenu) {
    return null;
  }

  return (
    <div
      className={`
        ${
          isMobile
            ? "fixed z-40 bottom-0 left-0 right-0"
            : "fixed z-40 left-0 top-1/2 transform -translate-y-1/2"
        } 
        bg-white backdrop-blur-xl border-gray-100 shadow-lg transition-all duration-300
        ${isMobile ? "border-t" : "border-r rounded-r-2xl"}
        ${!isMobile && !isHovered ? "translate-x-[-90%]" : ""}
      `}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}>
      <div
        className={`
        ${isMobile ? "max-w-md mx-auto px-2 py-2" : "px-3 py-4"}
        ${!isMobile && !isHovered ? "overflow-hidden" : ""}
      `}>
        <div
          className={`
          ${
            isMobile
              ? "flex justify-between items-center"
              : "flex flex-col space-y-3"
          }
        `}>
          {landingMenus.map((menu) => {
            const IconComponent = menu.icon;
            const isActive = isActiveMenu(menu.url);

            return (
              <NavLink
                key={menu.id}
                to={menu.url}
                onClick={handleMenuClick}
                className={`
                  relative flex items-center p-2.5 rounded-2xl 
                  transition-all duration-300 group min-w-0
                  ${
                    isMobile
                      ? "flex-col flex-1 justify-center"
                      : `flex-row h-14 mb-2 justify-start ${
                          isHovered ? "w-auto pr-4" : "w-14"
                        }`
                  }
                  ${
                    isActive
                      ? "transform scale-105"
                      : "active:scale-95 hover:scale-95"
                  }
                `}>
                {/* Active background */}
                {isActive && (
                  <div
                    className={`absolute inset-0 ${menu.bgColor} rounded-2xl opacity-80 shadow-sm`}
                  />
                )}

                {/* Icon container */}
                <div
                  className={`relative z-10 p-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? `${menu.bgColor} shadow-sm`
                      : "group-hover:bg-gray-50 dark:group-hover:bg-gray-200"
                  }`}>
                  <IconComponent
                    className={`
                      ${isMobile ? "w-5 h-5" : "w-6 h-6"} 
                      transition-colors duration-300 
                      ${isActive ? menu.activeColor : menu.color}
                    `}
                  />
                </div>

                {/* Label - mobile atau desktop saat hover */}
                {(isMobile || (!isMobile && isHovered)) && (
                  <span
                    className={`
                      relative z-10 font-medium transition-colors duration-300 truncate text-center
                      ${
                        isMobile
                          ? "text-xs mt-1 max-w-full"
                          : "text-sm ml-3 whitespace-nowrap"
                      }
                      ${
                        isActive
                          ? menu.activeColor
                          : "text-gray-600 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-500"
                      }
                    `}>
                    {menu.label}
                  </span>
                )}

                {/* Active indicator */}
                {isActive && (
                  <div
                    className={`
                      absolute rounded-full
                      ${
                        isMobile
                          ? "-top-1 left-1/2 transform -translate-x-1/2 w-8 h-1"
                          : "-right-1 top-1/2 transform -translate-y-1/2 w-1 h-8"
                      }
                      ${menu.activeColor.replace("text-", "bg-")}
                    `}
                  />
                )}

                {/* Hover effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Bottom safe area for mobile devices only */}
      {isMobile && (
        <div className="h-safe-bottom bg-gray-50 backdrop-blur-xl" />
      )}
    </div>
  );
};

export default LandingBottomMenu;
