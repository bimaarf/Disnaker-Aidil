import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const useSaveLastClassroomParams = () => {
  const location = useLocation();

  useEffect(() => {
    // Simpan hanya jika path diawali /classrooms
    if (location.pathname.startsWith("/classrooms")) {
      localStorage.setItem(
        "lastClassroomPath",
        location.pathname + location.search
      );
    }
  }, [location]);
};

export default useSaveLastClassroomParams;
