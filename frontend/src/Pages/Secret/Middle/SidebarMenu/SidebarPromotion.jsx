import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useSwipeable } from "react-swipeable";
import { Auth } from "../../../../Components/Auth";
import { Footer } from "../../../../Components/Footer";
import { Header } from "../../../../Components/Header";
import { menuBottom } from "../../../../Data/GeneralMenu";
import { GameProvider } from "../../../gameProvider";
import { SidebarMobile } from "../../Components/_sidebarMobile";
import { EventPromotion } from "../Content/Promotion/eventProvider";
import { Promotion } from "../Content/Promotion/promotion";
import { EventMenu } from "./EventMenu";
import { eventData } from "./eventProviderData";
import { promotionData } from "./promotionData";
import { PromotionMenu } from "./PromotionMenu";

export const SidebarPromotion = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
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

  const theme = useSelector((state) => state.themes.theme);
  const dataPromotion = promotionData;
  const dataEvent = eventData;
  const [tabActive, setTabActive] = useState(true);
  const [labelFilter, setLabelFilter] = useState("");
  const [labelEFilter, setLabelEFilter] = useState("");
  const filteredPromotion = dataPromotion.filter((item) => {
    if (labelFilter === "") {
      return true; // Show all promotions if no filter is applied
    }
    return item.label.toLowerCase().trim() === labelFilter.toLowerCase().trim();
  });
  const filteredEvent = dataEvent.filter((item) => {
    if (labelEFilter === "") {
      return true; // Show all promotions if no filter is applied
    }
    return (
      item.label.toLowerCase().trim() === labelEFilter.toLowerCase().trim()
    );
  });
  return (
    <div className={`bg-base-300/30`}>
      <Header
        isTogle={isOpen}
        setTogle={setIsOpen}
        setIsAuthForm={setIsAuthForm}
        isAuthForm={isAuthForm}
      />
      <div
        className={` from-${theme?.name}-950/10 to-${theme?.name}-950/10 via-base-300/20 bg-gradient-to-b`}>
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
            className={` top-0 left-0 from-base-100/50 to-base-100/50 p-2 shadow bg-gradient-to-r w-72 transform ${
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
            <div className={`bg-${theme?.name}-950/10 px-2`}>
              <div className="flex justify-center mt-2 items-end gap-1 text-[10px] font-mono">
                <div
                  onClick={() => setTabActive(true)}
                  className={`${
                    tabActive
                      ? `text-yellow-500 bg-${theme?.name}-950/30`
                      : `text-white bg-${theme?.name}-950/10 hover:text-yellow-300 duration-300 brightness-90`
                  } text-center w-1/2 py-3 active:scale-95 font-semibold cursor-pointer`}>
                  Semua Promosi
                </div>
                <div
                  onClick={() => setTabActive(false)}
                  className={`${
                    !tabActive
                      ? `text-yellow-500 bg-${theme?.name}-950/30`
                      : `text-white bg-${theme?.name}-950/10 hover:text-yellow-300 duration-300 brightness-90`
                  } text-center w-1/2 py-3 active:scale-95 font-semibold cursor-pointer`}>
                  Semua Event Provider
                </div>
              </div>
            </div>
            <div className="menu">
              {tabActive && !isMobile && (
                <PromotionMenu
                  setLabelFilter={setLabelFilter}
                  labelFilter={labelFilter}
                  dataPromotion={dataPromotion}
                  isMobile={isMobile}
                  setIsOpen={setIsOpen}
                />
              )}
              {!tabActive && !isMobile && (
                <EventMenu
                  setLabelEFilter={setLabelEFilter}
                  labelEFilter={labelEFilter}
                  dataEvent={dataEvent}
                />
              )}
            </div>
          </div>
          <div
            className={`w-full pb-6 duration-300 ease-in-out`}
            style={{
              minHeight: "100vh",
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
              className={`transition-opacity ease-in-out md:ml-5 duration-300 ${
                isOpen && isMobile ? "opacity-50 md:opacity-100" : "opacity-100"
              }`}>
              <div
                className={`md:px-2 pb-32 md:pb-0 ${
                  isMobile && "overflow-x-hidden whitespace-nowrap"
                }`}>
                {tabActive ? (
                  <Promotion
                    filteredPromotion={filteredPromotion}
                    dataPromotion={dataPromotion}
                  />
                ) : (
                  <EventPromotion
                    filteredEvent={filteredEvent}
                    dataEvent={dataEvent}
                  />
                )}
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
