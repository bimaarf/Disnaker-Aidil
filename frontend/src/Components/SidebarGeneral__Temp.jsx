import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSwipeable } from "react-swipeable";
import { menuBottom } from "../../../Data/GeneralMenu";
import { selectUser } from "../../../features/authentication/AuthSlice";
import {
  selectLocalTheme,
  toggleLocalTheme,
} from "../../../features/LandingPages/themeSlice";
import Breadcrumbs from "../Breadcrumbs/Breadcrumbs";
import { SidebarAdmin } from "./_sidebarAdmin";
import { SidebarMobile } from "./_sidebarMobile";
import { SidebarUser } from "./_sidebarUser";

export const SidebarGeneral = ({ children }) => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const user = useSelector(selectUser);
  const theme = useSelector(selectLocalTheme); // Get local theme from Redux
  const dispatch = useDispatch(); // Initialize dispatch
  const receivedUnreadCounts = useSelector(
    (state) => state.chat.receivedUnreadCounts
  );
  const totalReceivedUnread = Object.values(receivedUnreadCounts).reduce(
    (sum, count) => sum + count,
    0
  );
  const sidebarRef = useRef(null);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("black", theme === "black");
    document.documentElement.classList.toggle(
      "wireframe",
      theme === "wireframe"
    );
  }, [theme]);

  useEffect(() => {
    const scrollPosition = sessionStorage.getItem("sidebarScrollPosition");
    if (scrollPosition && sidebarRef.current) {
      sidebarRef.current.scrollTop = parseInt(scrollPosition, 10);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (sidebarRef.current) {
        sessionStorage.setItem(
          "sidebarScrollPosition",
          sidebarRef.current.scrollTop
        );
      }
    };
    const currentSidebarRef = sidebarRef.current;
    currentSidebarRef?.addEventListener("scroll", handleScroll);
    return () => currentSidebarRef?.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 1024;
      setIsMobile(isMobileView);
      setIsOpen(!isMobileView);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen && isMobile ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isMobile]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => isOpen && isMobile && setIsOpen(false),
    onSwipedRight: (eventData) => {
      if (!isOpen && eventData.initial[0] < 100) setIsOpen(true);
    },
    preventScrollOnSwipe: true,
    trackTouch: true,
    trackMouse: true,
  });

  const toggleSidebar = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const renderAvatar = () => {
    if (user?.avatar) {
      return (
        <div className="avatar">
          <div className="ring-primary ring-offset-base-100 w-24 rounded-full ring ring-offset-2">
            <img
              src={`${process.env.REACT_APP_API}user/images/${user?.avatar}`}
              alt="User Avatar"
            />
          </div>
        </div>
      );
    } else {
      const initials = user?.name
        ? `${user.name.split(" ")[0][0]}${user.name.split(" ")[1]?.[0] || ""}`
        : "";
      return (
        <div className="avatar placeholder">
          <div className="bg-neutral text-neutral-content w-28 rounded-full">
            <span className="text-5xl">{initials}</span>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <div className="absolute top-0 right-0 z-50">
        <button
          onClick={() => dispatch(toggleLocalTheme())}
          className="p-2 flex justify-center items-center m-2 bg-black/10 text-black dark:bg-red-700 dark:text-white rounded-md">
          Toggle Theme
        </button>
      </div>
      <div>
        <button
          className={`p-2 flex justify-center items-center m-2 bg-black/10 text-black dark:bg-base-200 dark:text-white rounded-md fixed top-2 ${
            isMobile ? "right-2" : "left-2"
          }`}
          onClick={toggleSidebar}
          style={{ zIndex: 999 }}
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}>
          <span className="material-symbols-outlined">menu</span>
          {totalReceivedUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {totalReceivedUnread}
            </span>
          )}
        </button>

        {isMobile && (
          <SidebarMobile
            menu={menuBottom}
            isOpen={isOpen}
            toggleSidebar={toggleSidebar}
          />
        )}
      </div>

      <div
        {...swipeHandlers}
        className={`flex duration-300 ease-linear ${
          !isMobile && isOpen ? "overflow-hidden" : ""
        }`}
        style={{ position: "relative", width: "100%" }}>
        <div
          ref={sidebarRef}
          className={`fixed top-0 left-0 dark:bg-base-200/30 bg-base-100 shadow-xl border-r border-base-200 w-72 transform ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 h-screen pb-32 md:pb-0 ease-in-out z-40`}
          style={{
            height: "100vh",
            overflowY: "scroll",
            scrollbarWidth: "thin",
          }}>
          <div className="flex justify-center mt-4">{renderAvatar()}</div>
          <div className="flex justify-center mt-2 items-end gap-1">
            <h1 className="text-center font-medium">{user?.name}</h1>
            <span className="material-symbols-outlined text-[20px]">
              verified
            </span>
          </div>
          <h1 className="text-center text-neutral">{user?.email}</h1>
          <div className="menu">
            {user?.role === "administrator" || user?.role === "Super Admin" ? (
              <SidebarAdmin isMobile={isMobile} setIsOpen={setIsOpen} />
            ) : (
              <SidebarUser isMobile={isMobile} setIsOpen={setIsOpen} />
            )}
          </div>
        </div>
        <div
          className={`w-full pt-4 md:px-4 pb-6 bg-base-200/10 dark:bg-base-100 duration-300 dark:bg-base-200/50 ease-in-out ${
            isOpen ? "ml-72" : "ml-0"
          }`}
          style={{
            minHeight: "100vh",
            maxWidth: isOpen ? "calc(100% - 288px)" : "100%",
            boxSizing: "border-box",
          }}>
          {isOpen && isMobile && (
            <div
              className={`fixed inset-0 bg-black ${
                isMobile ? "opacity-50" : "opacity-0"
              } z-30`}
              onClick={() => setIsOpen(false)}
            />
          )}
          <div
            className={`transition-opacity ease-in-out duration-300 ${
              isOpen && isMobile ? "opacity-20 md:opacity-100" : "opacity-100"
            }`}>
            <Breadcrumbs />
            <div
              className={`${
                isMobile
                  ? `${
                      location.pathname !== "/chatting" && "pb-32 px-2"
                    } overflow-x-hidden`
                  : "pb-0"
              } pb-0`}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
