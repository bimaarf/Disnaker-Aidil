import { BarChart3, Bell, BookOpen, Store, User } from "lucide-react";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { NavLink, useLocation } from "react-router-dom";
import {
  selectIsAuthenticated,
  selectUser,
} from "../../../features/authentication/AuthSlice";
import { selectLocalTheme } from "../../../features/LandingPages/themeSlice";

const MobileBottomMenuTeacher = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectUser);
  const theme = useSelector(selectLocalTheme);

  const mainMenus = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      color: "text-blue-500",
      activeColor: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/30",
      url: "/dashboard",
    },
    {
      id: "products",
      label: "Products",
      icon: Store,
      color: "text-purple-500",
      activeColor: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/30",
      url: "/product",
    },
    {
      id: "classrooms",
      label: "Classroom",
      icon: BookOpen,
      color: "text-orange-500",
      activeColor: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/30",
      url: "/classrooms",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      color: "text-green-500",
      activeColor: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/30",
      url: "/notifications",
    },
    {
      id: "users",
      label: "Users",
      icon: User,
      color: "text-cyan-500",
      activeColor: "text-cyan-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-900/30",
      url: isAuthenticated
        ? `/users/account?email=${currentUser?.email} `
        : "/login",
    },
  ];
  // Helper status classroom
  const location = useLocation();
  const lastClassroomPath =
    localStorage.getItem("lastClassroomPath") || "/classrooms";
  const [classroomAnimating, setClassroomAnimating] = useState(false);
  const [classroomState, setClassroomState] = useState({
    isNavigating: false,
    lastPath: lastClassroomPath,
  });

  // Effect: deteksi perubahan path classrooms
  useEffect(() => {
    if (location.pathname.startsWith("/classrooms")) {
      const currentPath = location.pathname + location.search;

      if (
        currentPath !== classroomState.lastPath &&
        classroomState.isNavigating
      ) {
        setClassroomAnimating(true);

        const timer = setTimeout(() => {
          setClassroomAnimating(false);
          setClassroomState((prev) => ({
            ...prev,
            isNavigating: false,
            lastPath: currentPath,
          }));
        }, 300);

        return () => clearTimeout(timer);
      }
    }
  }, [
    location.pathname,
    location.search,
    classroomState.lastPath,
    classroomState.isNavigating,
  ]);

  const getClassroomStatus = () => {
    const isInClassroom = location.pathname.startsWith("/classrooms");
    const isRoot = location.pathname === "/classrooms";

    return {
      isActive: isInClassroom,
      isRoot,
      isAnimating: classroomAnimating,
      showSubPath: isInClassroom && !isRoot,
    };
  };
  // Theme-aware background classes
  const backgroundClass =
    theme === "wireframe"
      ? "bg-base-100/95 backdrop-blur-xl border-base-200/60"
      : "bg-base-100/95 backdrop-blur-xl border-base-200/60 dark:bg-base-200/95 dark:border-base-600/60";

  return (
    <div
      className={`fixed z-40 bottom-0 left-0 right-0 overflow-hidden ${backgroundClass} border-t shadow-lg`}>
      <div className="max-w-md mx-auto px-2 py-2">
        <div className="flex justify-between items-center">
          {mainMenus.map((menu) => {
            const IconComponent = menu.icon;

            // === khusus classroom ===
            if (menu.isClassroom) {
              const classroomStatus = getClassroomStatus();

              return (
                <button
                  key={menu.id}
                  onClick={menu.onClick}
                  className={`relative flex flex-col items-center justify-center p-2.5 rounded-2xl min-w-0 flex-1 transition-all duration-300 ${
                    classroomStatus.isActive
                      ? `transform scale-105 ${menu.bgColor} shadow-md`
                      : "active:scale-95 hover:scale-95"
                  } ${classroomStatus.isAnimating ? "animate-pulse" : ""}`}>
                  <div
                    className={`relative z-10 p-2 rounded-xl transition-all duration-300 ${
                      classroomStatus.isActive
                        ? `${menu.bgColor} shadow-sm`
                        : theme === "wireframe"
                        ? "group-hover:bg-base-200"
                        : "group-hover:bg-base-200 dark:group-hover:bg-base-300"
                    }`}>
                    <IconComponent
                      className={`w-5 h-5 transition-all duration-300 ${
                        classroomStatus.isActive
                          ? `${menu.activeColor} ${
                              classroomStatus.isAnimating ? "animate-spin" : ""
                            }`
                          : menu.color
                      }`}
                    />
                  </div>
                  <span
                    className={`relative z-10 text-xs font-medium mt-1 transition-colors duration-300 truncate max-w-full text-center ${
                      classroomStatus.isActive
                        ? menu.activeColor
                        : "text-base-content/50 group-hover:text-base-content-70 dark:text-base-content/40 dark:group-hover:text-base-content/30"
                    }`}>
                    {menu.label}
                  </span>
                  {classroomStatus.isActive && (
                    <div
                      className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 ${menu.activeColor.replace(
                        "text-",
                        "bg-"
                      )} rounded-full`}
                    />
                  )}
                </button>
              );
            }

            // === default menu ===
            return (
              <NavLink
                key={menu.id}
                to={menu.url}
                onClick={menu.onClick}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center p-2.5 rounded-2xl transition-all duration-300 group min-w-0 flex-1 ${
                    isActive
                      ? "transform scale-105"
                      : "active:scale-95 hover:scale-95"
                  }`
                }>
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div
                        className={`absolute inset-0 ${menu.bgColor} rounded-2xl opacity-80`}
                      />
                    )}
                    <div
                      className={`relative z-10 p-2 rounded-xl transition-all duration-300 ${
                        isActive
                          ? `${menu.bgColor} shadow-sm`
                          : theme === "wireframe"
                          ? "group-hover:bg-base-200"
                          : "group-hover:bg-base-200 dark:group-hover:bg-base-300"
                      }`}>
                      <IconComponent
                        className={`w-5 h-5 transition-colors duration-300 ${
                          isActive ? menu.activeColor : menu.color
                        }`}
                      />
                    </div>
                    <span
                      className={`relative z-10 text-xs font-medium mt-1 transition-colors duration-300 truncate max-w-full text-center ${
                        isActive
                          ? menu.activeColor
                          : "text-base-content/50 group-hover:text-base-content-70 dark:text-base-content/40 dark:group-hover:text-base-content/30"
                      }`}>
                      {menu.label}
                    </span>
                    {isActive && (
                      <div
                        className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 ${menu.activeColor.replace(
                          "text-",
                          "bg-"
                        )} rounded-full`}
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileBottomMenuTeacher;
