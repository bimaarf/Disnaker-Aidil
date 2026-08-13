import React from "react";
import { Navigate, useLocation } from "react-router-dom";
const ProtectedRoute = ({ isAuth, children }) => {
  const location = useLocation();

  if (isAuth) return children;

  return (
    <Navigate
      to={`/login?redirect=${encodeURIComponent(
        location.pathname + location.search
      )}`}
      replace
    />
  );
};

export default ProtectedRoute;
