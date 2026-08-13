import {
  CheckCircle,
  Home,
  Menu,
  Moon,
  Palette,
  Settings,
  User,
  X,
} from "lucide-react";
import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
// import { useSwipeable } from "react-swipeable";
import { selectUser } from "../../../features/authentication/AuthSlice";
import {
  selectLocalTheme,
  toggleLocalTheme,
} from "../../../features/LandingPages/themeSlice";
import "../../../index.css";
import "../../../inputField.css";
import Breadcrumbs from "../Breadcrumbs/Breadcrumbs";
import { SidebarAdmin } from "./_sidebarAdmin";
import SidebarNotificationDropdown from "./_sidebarNotificationDropdown";
import { SidebarSuperAdmin } from "./_sidebarSuperAdmin";
import { SidebarUser } from "./_sidebarUser";
import secureLocalStorage from "react-secure-storage";
import { SidebarTeacher } from "./_sidebarTeacher";
import useScrollRestoration from "../../../Components/_scrollRestoration";
import MobileBottomMenuSuperAdmin from "./_mobileBottomMenuSuperAdmin";
import MobileBottomMenuAdmin from "./_mobileBottomMenuAdmin";
import MobileBottomMenuTeacher from "./_mobileBottomMenuTeacher";
import MobileBottomMenuUser from "./_mobileBottomMenuUser";
import { useNavigate } from "react-router-dom";

const UserAvatar = memo(({ user }) => {
  const renderAvatar = useMemo(() => {
    if (user?.avatar || user?.avatar !== "default.jpg") {
      return (
        <div className="relative group transform transition-all duration-300 hover:scale-105">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-teal-600 p-0.5 shadow-lg">
            <div className="w-full h-full rounded-xl overflow-hidden bg-base-100 ring-2 ring-white ring-opacity-20">
              <img
                src={user?.avatar}
                alt="User Avatar"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-3 border-base-100 flex items-center justify-center shadow-lg">
            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      );
    } else {
      const initials = user?.name
        ? `${user.name.split(" ")[0][0]}${user.name.split(" ")[1]?.[0] || ""}`
        : "";
      return (
        <div className="relative group transform transition-all duration-300 hover:scale-105">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl ring-4 ring-white ring-opacity-10">
            <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {initials}
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-3 border-base-100 flex items-center justify-center shadow-lg">
            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      );
    }
  }, [user?.avatar, user?.name]);

  return renderAvatar;
});

// Memoize UserInfo component
const UserInfo = memo(({ user, theme }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 justify-center">
      <h2
        className={`font-bold text-base sm:text-lg tracking-tight ${
          theme === "wireframe" ? "text-base-content" : "text-base-content"
        }`}>
        {user?.name}
      </h2>
      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 drop-shadow-sm" />
    </div>
    <p
      className={`text-xs sm:text-sm font-medium ${
        theme === "wireframe"
          ? "text-gray-500"
          : "text-gray-500 dark:text-gray-400"
      }`}>
      {user?.email}
    </p>
    <div
      className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full shadow-sm ${
        theme === "wireframe"
          ? "bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-100"
          : "bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 border border-blue-100 dark:border-blue-800"
      }`}>
      <User className="w-3.5 h-3.5" />
      <span
        className={`text-xs font-semibold capitalize ${
          theme === "wireframe"
            ? "text-blue-700"
            : "text-blue-700 dark:text-blue-300"
        }`}>
        {user?.role}
      </span>
    </div>
  </div>
));

// Memoize ThemeSelector component
const ThemeSelector = memo(
  ({ theme, themeMenuOpen, setThemeMenuOpen, dispatch }) => {
    const themeOptions = useMemo(
      () => [
        { key: "black", label: "Dark", icon: Moon },
        { key: "wireframe", label: "Wireframe", icon: Settings },
      ],
      []
    );

    const handleThemeClick = useCallback(() => {
      setThemeMenuOpen(!themeMenuOpen);
    }, [themeMenuOpen, setThemeMenuOpen]);

    const handleThemeSelect = useCallback(
      (themeKey) => {
        dispatch(toggleLocalTheme(themeKey));
        setThemeMenuOpen(false);
      },
      [dispatch, setThemeMenuOpen]
    );
    const handleOverlayClick = useCallback(() => {
      setThemeMenuOpen(false);
    }, [setThemeMenuOpen]);

    return (
      <div className="relative">
        <button
          onClick={handleThemeClick}
          className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm ${
            theme === "wireframe"
              ? "bg-base-200 hover:bg-base-300"
              : "bg-base-200 hover:bg-base-300"
          }`}>
          <Palette
            className={`w-5 h-5 ${
              theme === "wireframe"
                ? "text-gray-700"
                : "text-gray-700 dark:text-gray-300"
            }`}
          />
        </button>
        {themeMenuOpen && (
          <>
            <div
              className="fixed inset-0 h-screen z-40 backdrop-blur-sm"
              onClick={handleOverlayClick}
            />
            <div
              className={`absolute right-0 mt-3 w-48 rounded-2xl shadow-2xl border py-2 z-50 backdrop-blur-sm ${
                theme === "wireframe"
                  ? "bg-base-100 border-base-300"
                  : "bg-base-100 border-base-300 dark:bg-base-200 dark:border-base-300"
              }`}>
              {themeOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.key}
                    onClick={() => handleThemeSelect(option.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${
                      theme === "wireframe"
                        ? `hover:bg-base-200 ${
                            theme === option.key
                              ? "bg-blue-50 text-blue-600 border-r-2 border-blue-500"
                              : "text-gray-700"
                          }`
                        : `hover:bg-base-200 ${
                            theme === option.key
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-r-2 border-blue-500"
                              : "text-gray-700 dark:text-gray-300"
                          }`
                    }`}>
                    <IconComponent className="w-4 h-4" />
                    <span className="font-medium text-sm sm:text-base">
                      {option.label}
                    </span>
                    {theme === option.key && (
                      <CheckCircle className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }
);

// Memoize SidebarContent component
const SidebarContent = memo(({ user, isMobile, setIsOpen, theme }) => (
  <>
    <div className={`md:p-6 p-4 border-b border-base-200/50`}>
      <div className="flex flex-col items-center text-center space-y-5">
        <UserAvatar user={user} />
        <UserInfo user={user} theme={theme} />
      </div>
    </div>
    <div className="md:p-6 p-4">
      {user?.role === "administrator" ? (
        <SidebarAdmin isMobile={isMobile} setIsOpen={setIsOpen} />
      ) : user?.role === "super admin" ? (
        <SidebarSuperAdmin isMobile={isMobile} setIsOpen={setIsOpen} />
      ) : user?.role === "teacher" ? (
        <SidebarTeacher isMobile={isMobile} setIsOpen={setIsOpen} />
      ) : (
        <SidebarUser isMobile={isMobile} setIsOpen={setIsOpen} />
      )}
    </div>
  </>
));

export const SidebarGeneral = memo(({ children }) => {
  const [isOpen, setIsOpen] = useState(() => {
    if (window.innerWidth < 1024) return false;

    const stored = secureLocalStorage.getItem("isOpenSidebar");
    return stored ? stored === "true" : true;
  });
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const user = useSelector(selectUser);
  const theme = useSelector(selectLocalTheme);
  const dispatch = useDispatch();

  useScrollRestoration(["/dashboard", "/products", "/about", "/contact-us"]);

  const sidebarRef = useRef(null);
  const logo = useSelector((s) => s.logos.logos);
  useLayoutEffect(() => {
    const scrollPosition = sessionStorage.getItem("sidebarScrollPosition");
    if (scrollPosition && sidebarRef.current) {
      sidebarRef.current.scrollTop = parseInt(scrollPosition, 10);
    }
  }, []);
  useEffect(() => {
    // Simpan status sidebar ke secureLocalStorage ketika isOpen berubah
    secureLocalStorage.setItem("isOpenSidebar", isOpen.toString());
  }, [isOpen]);

  // Debounced scroll handler to reduce performance impact
  useEffect(() => {
    let timeoutId;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (sidebarRef.current) {
          sessionStorage.setItem(
            "sidebarScrollPosition",
            sidebarRef.current.scrollTop
          );
        }
      }, 100);
    };
    const currentSidebarRef = sidebarRef.current;
    currentSidebarRef?.addEventListener("scroll", handleScroll);
    return () => {
      clearTimeout(timeoutId);
      currentSidebarRef?.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Debounced resize handler
  useLayoutEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 1024;
      setIsMobile(isMobileView);
      if (isMobileView) {
        setIsOpen(false); // Menutup sidebar di mobile view
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Inisialisasi saat pertama kali render

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  // Fixed body overflow handling for mobile
  useEffect(() => {
    const body = document.body;
    if (isMobile) {
      body.style.overflow = isOpen ? "hidden" : "";
    } else {
      body.style.overflow = "";
    }
    return () => {
      body.style.overflow = "";
    };
  }, [isOpen, isMobile]);

  const toggleSidebar = useCallback(() => {
    setIsOpen((prev) => !prev);
    secureLocalStorage.setItem("isOpenSidebar", (prev) => !prev);
  }, []);

  const handleOverlayClick = useCallback(() => {
    setIsOpen(false);
    secureLocalStorage.setItem("isOpenSidebar", false);
  }, []);

  // Memoize main content styles
  const mainContentStyle = useMemo(
    () => ({
      minHeight: "calc(100vh - 64px)",
      maxWidth: isOpen && !isMobile ? "calc(100% - 320px)" : "100%",
      boxSizing: "border-box",
    }),
    [isOpen, isMobile]
  );

  const mainContentClass = useMemo(() => {
    const baseClass = `w-full md:px-4 pb-6 transition-all duration-300 ease-in-out ${
      isOpen && !isMobile ? "ml-80" : "ml-0"
    }`;

    if (theme === "wireframe") {
      return `${baseClass} bg-base-200 dark:bg-base-100`;
    } else {
      return `${baseClass} bg-base-200 dark:bg-base-100`;
    }
  }, [isOpen, isMobile, theme]);

  // Memoize content padding class
  const contentPaddingClass = useMemo(() => {
    if (isMobile) {
      return `pb-24 overflow-x-hidden`;
    }
    return "pb-6"; // desktop cukup kecil
  }, [isMobile, theme]);

  // Memoize top navigation bar classes
  const topNavClass = useMemo(() => {
    if (theme === "wireframe") {
      return "fixed top-0 px-3 left-0 right-0 z-50 bg-base-100 backdrop-blur-xl border-b border-base-200/50 shadow-sm";
    } else {
      return "fixed top-0 px-3 left-0 right-0 z-50 bg-base-100 backdrop-blur-xl border-b border-base-200/50 shadow-sm dark:bg-base-200";
    }
  }, [theme]);

  // Memoize sidebar background classes
  const sidebarBgClass = useMemo(() => {
    if (theme === "wireframe") {
      return "bg-base-100 backdrop-blur-xl border-r border-base-200/50 shadow-lg";
    } else {
      return "bg-base-100 backdrop-blur-xl border-r border-base-200/50 shadow-lg dark:bg-base-200 dark:border-base-300";
    }
  }, [theme]);

  return (
    <>
      {/* Top Navigation Bar */}
      <div className={topNavClass}>
        <div className="flex items-center justify-between md:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={toggleSidebar}
              className={`relative p-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm ${
                theme === "wireframe"
                  ? "bg-base-200 hover:bg-base-300"
                  : "bg-base-200 hover:bg-base-300 dark:bg-base-300 dark:hover:bg-base-400"
              }`}
              aria-label={isOpen ? "Close sidebar" : "Open sidebar"}>
              {isOpen ? (
                <X
                  className={`w-5 h-5 transition-transform duration-200 ${
                    theme === "wireframe"
                      ? "text-gray-700"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                />
              ) : (
                <Menu
                  className={`w-5 h-5 transition-transform duration-200 ${
                    theme === "wireframe"
                      ? "text-gray-700"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                />
              )}
            </button>
            <div className="hidden md:flex items-center gap-3">
              {logo?.image ? (
                <img
                  src={logo.image}
                  alt="DISNAKER Logo"
                  className={`object-contain group-hover:scale-110 transition-transform duration-300 rounded-full w-9 h-9`}
                />
              ) : (
                <div className="w-9 h-9 bg-gradient-to-r from-blue-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-base">
                    {
                      user?.name
                        ?.split(" ") // pisah nama jadi array ["Elon", "Musk"]
                        .map((n) => n[0]) // ambil huruf pertama dari setiap kata
                        .join("") // gabung jadi "EM"
                        .slice(0, 2) // ambil 2 huruf saja
                        .toUpperCase() // biar kapital semua
                    }
                  </span>
                </div>
              )}

              <div>
                <p
                  className={`font-bold text-lg sm:text-xl tracking-tight ${
                    theme === "wireframe"
                      ? "text-base-content"
                      : "text-base-content"
                  }`}>
                  Control Panel
                </p>
                <p className="text-xs text-base-content/70 font-medium">
                  Dinas Ketenagakerjaan Kota Balikpapan
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="relative p-2 rounded-xl text-base-content bg-base-100 hover:bg-base-200 transition-all duration-200 hover:scale-105"
              aria-label="Notifications">
              <Home className="w-5 h-5 text-base-content" />
            </button>
            <SidebarNotificationDropdown />
            <ThemeSelector
              theme={theme}
              themeMenuOpen={themeMenuOpen}
              setThemeMenuOpen={setThemeMenuOpen}
              dispatch={dispatch}
            />
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm z-40 transition-opacity duration-100"
          onClick={handleOverlayClick}
          style={{ top: "64px" }}
        />
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <div
          className={`fixed pb-20 top-16 left-0 h-full z-50 w-80 max-w-[85vw] transform transition-all duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          } lg:hidden ${sidebarBgClass}`}
          style={{
            height: "calc(100vh - 64px)",
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor:
              theme === "wireframe" ? "#e5e7eb #ffffff" : "#1A1A1D #0a0a0a",
          }}>
          <SidebarContent
            user={user}
            isMobile={isMobile}
            setIsOpen={setIsOpen}
            theme={theme}
          />
        </div>
      )}

      {/* Main Layout */}
      <div
        className="flex pt-16"
        style={{ position: "relative", width: "100%" }}>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div
            ref={sidebarRef}
            className={`fixed left-0 h-full z-40 w-80 transform transition-all duration-300 ease-in-out ${
              isOpen ? "translate-x-0" : "-translate-x-full"
            } ${sidebarBgClass}`}
            style={{
              height: "calc(100vh - 64px)",
              overflowY: "auto",
              scrollbarWidth: "thin",
              scrollbarColor:
                theme === "wireframe" ? "#e5e7eb #ffffff" : "#1A1A1D #0a0a0a",
            }}>
            <SidebarContent
              user={user}
              isMobile={isMobile}
              setIsOpen={setIsOpen}
              theme={theme}
            />
          </div>
        )}

        {/* Main Content Area */}
        <main
          className={`${mainContentClass} ${
            location.pathname !== "chat" && "pb-16"
          }`} // 64px padding bawah
          style={mainContentStyle}>
          <div className={contentPaddingClass}>
            <div className="px-2 py-2 md:py-6">
              {!isMobile && (
                <div className="mb-4">
                  <Breadcrumbs />
                </div>
              )}
              <div>{children}</div>
              <button
                onClick={() =>
                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  })
                }
                className={`fixed ${
                  isMobile ? "bottom-[200px]" : "bottom-[200px]"
                } right-3 w-12 h-12 bg-base-200/90 hover:bg-base-300/90 backdrop-blur-sm text-base-content rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-50 group`}>
                <span className="material-symbols-outlined text-xl group-hover:text-primary transition-colors duration-300">
                  keyboard_arrow_up
                </span>
              </button>
            </div>
          </div>
        </main>
        <button
          onClick={() => navigate("/")}
          className="fixed bottom-8 left-8 bg-white/80 backdrop-blur-sm hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed text-gray-700 hover:text-orange-600 p-3 rounded-full shadow-lg hover:shadow-xl border border-orange-100/50 transition-all duration-300 transform hover:scale-110 flex items-center gap-2">
          <Home className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-medium">
            Halaman Utama
          </span>
        </button>
        {/* Bottom Navigation Bar */}
      </div>
      {/* Mobile Bottom Navigation Bar */}
      {isMobile && (
        <div>
          {user?.role === "administrator" ? (
            <MobileBottomMenuAdmin />
          ) : user?.role === "super admin" ? (
            <MobileBottomMenuSuperAdmin />
          ) : user?.role === "teacher" ? (
            <MobileBottomMenuTeacher />
          ) : (
            <MobileBottomMenuUser />
          )}
        </div>
      )}
    </>
  );
});

// Add display names for debugging
UserAvatar.displayName = "UserAvatar";
UserInfo.displayName = "UserInfo";
ThemeSelector.displayName = "ThemeSelector";
SidebarContent.displayName = "SidebarContent";
SidebarGeneral.displayName = "SidebarGeneral";
