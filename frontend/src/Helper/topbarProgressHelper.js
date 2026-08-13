import React, { createContext, useContext, useState } from "react";
import TopBarProgress from "react-topbar-progress-indicator";

const TopBarContext = createContext(null);

export const TopBarProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  return (
    <TopBarContext.Provider value={setLoading}>
      {loading && <TopBarProgress />}
      {children}
    </TopBarContext.Provider>
  );
};

// Helper untuk start/finish
export const useTopBar = () => {
  const setLoading = useContext(TopBarContext);
  return {
    start: () => setLoading?.(true),
    finish: () => setLoading?.(false),
  };
};
