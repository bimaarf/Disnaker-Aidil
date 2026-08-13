import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useSwipeable } from "react-swipeable";
import { Auth } from "../../../../Components/Auth";
import { Header } from "../../../../Components/Header";
import { menuBottom } from "../../../../Data/GeneralMenu";
import { selectUser } from "../../../../features/authentication/AuthSlice";
import { SidebarMobile } from "../../Components/_sidebarMobile";
import { MenuUser } from "./MenuUser";
import { Footer } from "../../../../Components/Footer";
import { GameProvider } from "../../../gameProvider";

export const SidebarAuthMiddle = ({ children }) => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const user = useSelector(selectUser);
  const sidebarRef = useRef(null);
  const [isAuthForm, setIsAuthForm] = useState(true); // Changed to false initially

  // useEffect(() => {
  //   const scrollPosition = sessionStorage.getItem("sidebarScrollPosition");
  //   if (scrollPosition && sidebarRef.current) {
  //     sidebarRef.current.scrollTop = parseInt(scrollPosition, 10);
  //   }
  // }, []);

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

    return () => {
      currentSidebarRef?.removeEventListener("scroll", handleScroll);
    };
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
      if (!isOpen && eventData.initial[0] < 100) {
        setIsOpen(true);
      }
    },
    preventScrollOnSwipe: true,
    trackTouch: true,
    trackMouse: true,
  });

  const toggleSidebar = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);
  const getCurrentDate = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, "0");

    const monthOptions = { month: "short" };
    const month = date.toLocaleDateString("en-US", monthOptions);
    const year = date.getFullYear();
    const time = date.toLocaleTimeString("id-ID", { hour12: false });
    return `${day}-${month}-${year} ${time} WIB`;
  };
  const theme = useSelector((state) => state.themes.theme);
  return (
    <div className={`bg-base-300/30`}>
      <div
        className={` from-${theme?.name}-950/10 to-${theme?.name}-950/10 via-base-300/20 bg-gradient-to-b`}>
        <Header
          isTogle={isOpen}
          setTogle={setIsOpen}
          setIsAuthForm={setIsAuthForm}
          isAuthForm={isAuthForm}
        />

        <div>
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
          className={`flex pt-4  ${
            !isMobile && isOpen
              ? "overflow-hidden md:container md:mx-auto xl:px-[20vh]"
              : ""
          }`}
          style={{ position: "relative", width: "100%" }}>
          <div
            ref={sidebarRef}
            className={` top-0 left-0 from-base-100/30 to-base-100/30 shadow bg-gradient-to-r w-72 transform ${
              isOpen ? "translate-x-0" : " -translate-x-full"
            } transition-transform duration-300 pb-32 md:pb-0 ease-in-out z-10 h-fit`}
            style={{
              position: "",
              top: 0,
              left: 0,
              minHeight: "80vh",
              overflowY: "auto",
              // zIndex: 8888,
            }}>
            <div className={`pb-2 pt-0.5 bg-${theme?.name}-600/30`}>
              <div className="flex justify-center mt-2 items-end gap-1">
                <h1 className="font-medium text-md text-yellow-500">
                  {user?.name}
                </h1>
              </div>
              <h1 className="text-[10px] text-center">
                Terakhir Masuk: {getCurrentDate()}
              </h1>
            </div>
            <p className="text-center uppercase font-mono text-xl border-b border-yellow-500 mx-2 py-3">
              Pusat Akun
            </p>
            <div className="menu">
              <MenuUser isMobile={isMobile} setIsOpen={setIsOpen} />
            </div>
          </div>
          <div
            className={`w-full pb-6 duration-300 ease-in-out`}
            style={{
              minHeight: "60vh",
              maxWidth: isOpen ? "calc(100% - 288px)" : "100%",
              boxSizing: "border-box",
            }}>
            {isOpen && isMobile && (
              <div
                className={`fixed inset-0 bg-black ${
                  isOpen && isMobile
                    ? "opacity-50 md:opacity-100"
                    : "opacity-100"
                } z-30`}
                onClick={() => setIsOpen(false)}
              />
            )}
            <div
              className={`transition-opacity  ease-in-out md:ml-5 duration-300 ${
                isOpen && isMobile ? "opacity-50 md:opacity-100" : "opacity-100"
              }`}>
              <div
                className={`bg-base-100/50 pb-32 md:pb-0 ${
                  isMobile && "overflow-x-hidden whitespace-nowrap w-screen"
                }`}>
                {children}
              </div>
            </div>
          </div>
        </div>
        <Auth
          setAuth={setIsAuthForm}
          isAuth={isAuthForm}
          isAuthForm={isAuthForm}
          setIsAuthForm={setIsAuthForm}
        />
        {/* Updated Auth component */}
        <div className="md:container md:mx-auto">
          <Footer />
          <div className="max-w-screen-xl my-4 mx-auto w-full pb-4">
            <GameProvider />
          </div>
        </div>
      </div>
    </div>
  );
};
