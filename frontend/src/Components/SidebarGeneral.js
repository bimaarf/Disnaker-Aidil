import React, { useMemo } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import useIsMobile from "../Context/__useIsMobile";
import { useLocation } from "react-router-dom";
import useScrollRestoration from "./_scrollRestoration";
import { useEnsureLandings, useEnsureRoutes } from "../features/LandingPages/routesHook";
// import LandingBottomMenu from "./____LandingBottomMenu";

export const SidebarGeneral = ({ children }) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  // Memoize excluded paths untuk prevent re-creation
  const excludedPaths = useMemo(
    () => [
      "/login",
      "/register",
      "/forgot-password",
      "/verify-otp",
      "/product/",
      "/event/",
      "/events/",
      "/events/category/",
    ],
    []
  );

  // Check if current path is excluded
  const isExcludedPath = useMemo(
    () => excludedPaths.some((prefix) => location.pathname.startsWith(prefix)),
    [excludedPaths, location.pathname]
  );

  // ✅ Jalankan scroll restoration hook
  useScrollRestoration(excludedPaths);
  useEnsureLandings();
  useEnsureRoutes();

  // ✅ Handle mobile scroll behavior - SIMPLIFIED
  // Tidak perlu force scroll top karena sudah dihandle oleh useScrollRestoration
  // Hanya untuk path yang excluded dari restoration
  React.useEffect(() => {
    if (isMobile && isExcludedPath) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isMobile, isExcludedPath, location.pathname]);

  // Memoize hideHeader check
  const hideHeader = isExcludedPath;

  return (
    <div className="bg-white">
      {!hideHeader && <Header />}

      <div className="min-h-screen max-w-screen px-0 m-0 pb-32 md:pb-0">
        <div className="p-0">{children}</div>

        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`fixed ${
            isMobile ? "bottom-[200px]" : "bottom-[200px]"
          } right-3 w-12 h-12 bg-gray-300/30 hover:bg-gray-300/90 backdrop-blur-sm text-gray-700 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-30 group`}>
          <span className="material-symbols-outlined text-xl group-hover:text-primary transition-colors duration-300">
            keyboard_arrow_up
          </span>
        </button>
      </div>
      {/* <LandingBottomMenu /> */}
      <Footer />
    </div>
  );
};
