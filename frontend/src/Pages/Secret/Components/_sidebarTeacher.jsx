import {
  BarChart3,
  Bell,
  ChevronDown,
  Circle,
  LogOut,
  MessageCircle,
  User,
  Users,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { logout, resetState } from "../../../features/authentication/AuthSlice";
import {
  selectOpenSubMenus,
  toggleSubMenu,
} from "../../../features/LandingPages/themeSlice";

// Komponen SidebarTeacher
export const SidebarTeacher = ({ isMobile, setIsOpen }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const currentUser = useSelector((state) => state.auth.user);
  const openSubMenus = useSelector(selectOpenSubMenus);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [loadSubmit, setLoadSubmit] = useState(false);
  const [classroomAnimating, setClassroomAnimating] = useState(false);

  const WhiteboardIcon = ({ className = "w-4 h-4", ...props }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      {...props}>
      <rect x="2" y="4" width="20" height="14" rx="2" ry="2" strokeWidth="2" />
      <path d="M8 20h8" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 18v2" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 8h12" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 12h6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
  // Definisikan menu
  const menuSections = [
    {
      label: "Chatting",
      icon: MessageCircle,
      url: "/chatting",
      color: "text-blue-500",
    },
    {
      label: "Dashboard",
      icon: BarChart3,
      url: "/dashboard",
      color: "text-blue-500",
    },

    {
      label: "Class Room",
      url: "/classrooms",
      icon: WhiteboardIcon,
      color: "text-red-500",
    },

    {
      label: "Notifications",
      url: "/notifications",
      icon: Bell,
      color: "text-red-500",
    },
    {
      label: "Users",
      url: isAuthenticated
        ? `/users/account?email=${currentUser?.email}`
        : "/login",
      icon: Users,
      color: "text-cyan-500",
    },
  ];
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
  // Handler Logout
  const handleLogout = async () => {
    try {
      setLoadSubmit(true);
      dispatch(logout());
      dispatch(resetState());
      toast.info("You are logged out!");
      navigate("/");
    } catch (error) {
      toast.error("Logout failed!");
    } finally {
      setLoadSubmit(false);
    }
  };

  // Toggle Submenu
  const toggleSubMenuHandler = (sectionIndex, itemIndex) => {
    const globalIndex =
      menuSections
        .slice(0, sectionIndex)
        .reduce((acc, section) => acc + section.items.length, 0) + itemIndex;
    dispatch(toggleSubMenu(globalIndex));
  };

  // Cek URL Aktif
  const isActiveUrl = (url) => {
    return location.pathname === url || location.pathname.startsWith(url + "/");
  };

  // Cek Submenu Aktif
  const hasActiveSubMenu = (subMenu) => {
    return subMenu && subMenu.some((item) => isActiveUrl(item.url));
  };
  // Ambil lastClassroomPath sekali
  const lastClassroomPath =
    localStorage.getItem("lastClassroomPath") || "/classrooms";

  // State untuk tracking classroom navigation
  const [classroomState, setClassroomState] = useState({
    isNavigating: false,
    lastPath: lastClassroomPath,
  });
  // Effect untuk membuka submenu secara otomatis jika subitem aktif
  useEffect(() => {
    if (location.pathname.startsWith("/classrooms")) {
      const currentPath = location.pathname + location.search;

      // Jika path berubah, trigger animasi
      if (
        currentPath !== classroomState.lastPath &&
        classroomState.isNavigating
      ) {
        setClassroomAnimating(true);

        // Reset animasi setelah delay
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

  // Render Item Menu dengan handling khusus classroom
  const renderMenuItem = (item, sectionIndex, itemIndex) => {
    const IconComponent = item.icon;
    const hasSubMenu = item.subMenu && item.subMenu.length > 0;
    const globalIndex =
      menuSections
        .slice(0, sectionIndex)
        .reduce((acc, section) => acc + section.items.length, 0) + itemIndex;
    const isOpen = openSubMenus[globalIndex];
    const isActive = isActiveUrl(item.url);
    const hasActiveChild = hasActiveSubMenu(item.subMenu);

    // Khusus handling untuk Classroom
    if (item.isClassroom) {
      const classroomStatus = getClassroomStatus();

      return (
        <div key={`${sectionIndex}-${itemIndex}`} className="mb-1">
          <button
            onClick={item.onClick}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all duration-300 group hover:scale-[0.99] active:scale-[0.98] ${
              classroomStatus.isActive
                ? `bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform ${
                    classroomStatus.isAnimating
                      ? "scale-[1.02] shadow-2xl"
                      : "scale-[1.01]"
                  }`
                : "text-base-content/80 hover:bg-base-200/60 hover:shadow-sm hover:scale-[0.99]"
            } ${classroomStatus.isAnimating ? "animate-pulse" : ""}`}>
            <div
              className={`p-2.5 rounded-xl transition-all duration-300 ${
                classroomStatus.isActive
                  ? `bg-white/20 shadow-sm ${
                      classroomStatus.isAnimating ? "animate-bounce" : ""
                    }`
                  : "bg-base-200/70 group-hover:bg-base-300/70"
              }`}>
              <IconComponent
                className={`w-4 h-4 transition-all duration-300 ${
                  classroomStatus.isActive
                    ? `text-white drop-shadow-sm ${
                        classroomStatus.isAnimating ? "animate-spin" : ""
                      }`
                    : item.color || "text-gray-600"
                }`}
              />
            </div>

            <div className="flex flex-col items-start flex-1">
              <span
                className={`font-semibold text-sm tracking-tight transition-all duration-300 ${
                  classroomStatus.isActive ? "text-white drop-shadow-sm" : ""
                }`}>
                {item.label}
              </span>
            </div>

            {/* Loading indicator saat navigating */}
            {classroomStatus.isAnimating && (
              <div className="w-2 h-2 bg-white/60 rounded-full animate-ping"></div>
            )}
          </button>
        </div>
      );
    }

    // === MENU DENGAN SUBMENU ===
    if (hasSubMenu) {
      return (
        <div key={`${sectionIndex}-${itemIndex}`} className="mb-1">
          <button
            onClick={() => toggleSubMenuHandler(sectionIndex, itemIndex)}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 group hover:scale-[0.99] active:scale-[0.98] ${
              isOpen || hasActiveChild
                ? "bg-base-200/80 shadow-sm text-blue-600 dark:text-blue-400 backdrop-blur-sm"
                : "text-base-content/80 hover:bg-base-200/60 hover:shadow-sm"
            }`}>
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl transition-all duration-200 ${
                  isOpen || hasActiveChild
                    ? "bg-primary/10 dark:bg-base-200 shadow-sm"
                    : "bg-base-200/70 group-hover:bg-base-300/70"
                }`}>
                <IconComponent
                  className={`w-4 h-4 transition-colors ${
                    isOpen || hasActiveChild
                      ? "text-blue-600 dark:text-blue-400"
                      : item.color || "text-gray-600"
                  }`}
                />
              </div>
              <span className="font-semibold text-sm tracking-tight">
                {item.label}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-all duration-300 ${
                isOpen ? "rotate-180 text-blue-600" : "text-gray-400"
              }`}
            />
          </button>

          {isOpen && (
            <div className="mt-2 ml-4 space-y-1 border-l-2 border-primary/20 dark:border-blue-700 pl-4">
              {item.subMenu.map((subItem, subIndex) => (
                <button
                  key={subIndex}
                  onClick={() => {
                    if (isMobile) setIsOpen(false);
                    navigate(subItem.url);
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 text-left group hover:scale-[0.99] active:scale-[0.98] ${
                    isActiveUrl(subItem.url)
                      ? "bg-primary/10 dark:bg-base-200 text-blue-600 dark:text-blue-400"
                      : "text-base-content dark:text-base-content hover:bg-base-200 dark:hover:bg-base-300 hover:text-base-content"
                  }`}>
                  <div
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isActiveUrl(subItem.url)
                        ? "bg-base-100 dark:bg-base-200"
                        : "bg-base-200 dark:bg-base-300"
                    }`}>
                    {subItem.icon ? (
                      <subItem.icon className="w-3.5 h-3.5" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 fill-current" />
                    )}
                  </div>
                  <span className="font-medium text-sm tracking-tight">
                    {subItem.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    // === MENU TANPA SUBMENU (NORMAL) ===
    return (
      <div key={`${sectionIndex}-${itemIndex}`} className="mb-1">
        <button
          onClick={() => {
            if (isMobile) setIsOpen(false);
            navigate(item.url);
          }}
          className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 group hover:scale-[0.99] active:scale-[0.98] ${
            isActive
              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-[1.01]"
              : "text-base-content/80 hover:bg-base-200/60 hover:shadow-sm hover:scale-[0.99]"
          }`}>
          <div
            className={`p-2.5 rounded-xl transition-all duration-200 ${
              isActive
                ? "bg-white/20 shadow-sm"
                : "bg-base-200/70 group-hover:bg-base-300/70"
            }`}>
            <IconComponent
              className={`w-4 h-4 transition-colors ${
                isActive
                  ? "text-white drop-shadow-sm"
                  : item.color || "text-gray-600"
              }`}
            />
          </div>
          <span
            className={`font-semibold text-sm tracking-tight ${
              isActive ? "text-white drop-shadow-sm" : ""
            }`}>
            {item.label}
          </span>
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 space-y-6 pb-4">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-2">
            <div className="mb-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
                {section.title}
              </p>
            </div>
            <div className="space-y-1">
              {section.items.map((item, itemIndex) =>
                renderMenuItem(item, sectionIndex, itemIndex)
              )}
            </div>
          </div>
        ))}
      </nav>

      {isAuthenticated && (
        <div className="mt-auto pt-6 border-t border-base-200/60">
          <div className="mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
              Account
            </p>
          </div>

          {/* My Account */}
          <button
            onClick={() => navigate(`/users/account?email=${currentUser?.email}`)}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 group hover:scale-[0.99] active:scale-[0.98] ${
              location.pathname.startsWith("/users/account")
                ? "bg-primary/10 text-blue-600 dark:text-blue-400"
                : "text-base-content/80 hover:bg-base-200/60 hover:shadow-sm"
            }`}>
            <div className="p-2.5 rounded-xl bg-base-200/70 group-hover:bg-base-300/70">
              <User className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm tracking-tight">
              My Account
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loadSubmit}
            className={`mt-2 w-full flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 group hover:scale-[0.99] active:scale-[0.98] ${
              loadSubmit
                ? "opacity-50 cursor-not-allowed bg-base-200/50"
                : "text-red-600 hover:bg-red-50 hover:shadow-sm hover:text-red-700 dark:hover:bg-red-900/20"
            }`}>
            <div
              className={`p-2.5 rounded-xl ${
                loadSubmit
                  ? "bg-base-200/50"
                  : "bg-red-50 group-hover:bg-red-100 dark:bg-red-900/20 dark:group-hover:bg-red-900/30"
              }`}>
              <LogOut
                className={`w-4 h-4 ${
                  loadSubmit
                    ? "animate-spin text-gray-400"
                    : "text-red-600 group-hover:text-red-700"
                }`}
              />
            </div>
            <span className="font-semibold text-sm tracking-tight">
              {loadSubmit ? "Logging out..." : "Logout"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
