import { useLayoutEffect, useEffect } from "react";
import { useLocation } from "react-router-dom";

const useScrollRestoration = (excludedPaths = []) => {
  const location = useLocation();

  const getBasePath = (path) => {
    const classroomMatch = path.match(/^\/classrooms\/[^/]+/);
    if (classroomMatch) return classroomMatch[0];

    const respondentMatch = path.match(/^\/form\/respondent\/preview\/[^/]+/);
    if (respondentMatch) return respondentMatch[0];

    return path;
  };

  const basePath = getBasePath(location.pathname);

  const isClassroomPreview =
    /^\/classrooms\/[^/]+\/announcement\/[^/]+\/preview$/.test(
      location.pathname
    );

  const isExcluded = excludedPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  // 🔹 Restore scroll (pakai useLayoutEffect biar tidak flicker)
  useLayoutEffect(() => {
    if (isExcluded) return;

    const searchParams = new URLSearchParams(location.search);
    const isTop = searchParams.get("isTop") === "true";

    if (isClassroomPreview || isTop) {
      window.scrollTo({ top: 0, behavior: "smooth" });

      return;
    }

    const saved = sessionStorage.getItem(`scrollPosition-${basePath}`);
    window.scrollTo(0, saved ? parseInt(saved, 10) : 0);
  }, [basePath, location, isClassroomPreview, isExcluded]);

  // 🔹 Save scroll (pakai useEffect biasa)
  useEffect(() => {
    if (isExcluded) return;

    const searchParams = new URLSearchParams(location.search);
    const isTop = searchParams.get("isTop") === "true";
    if (isClassroomPreview || isTop) return;

    const handleScroll = () => {
      sessionStorage.setItem(`scrollPosition-${basePath}`, window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      // ✅ save terakhir kali sebelum unmount
      sessionStorage.setItem(`scrollPosition-${basePath}`, window.scrollY);
    };
  }, [basePath, location, isClassroomPreview, isExcluded]);
};

export default useScrollRestoration;
