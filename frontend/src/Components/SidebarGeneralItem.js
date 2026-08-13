import React from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { selectUser } from "../features/authentication/AuthSlice";

export const SidebarGeneralItem = ({ setIsAuthForm, isAuthForm }) => {
  const user = useSelector(selectUser);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return (
    <div className="space-y-3">
      {/* Sidebar content */}
      {/* Sidebar items go here */}
      <div
        onClick={() =>
          isAuthenticated ? navigate(`/dashboard`) : setIsAuthForm(!isAuthForm)
        }
        className="w-full mt-20 hover:brightness-90 bg-violet-950/10 from-violet-950/20 via-violet-950/10 to-violet-950/20 bg-gradient-to-r shadow-2xl rounded-t-lg p-4 text-center cursor-pointer duration-100 select-none active:scale-95">
        <div className="tooltip" data-tip={"Dashboard"}>
          <span
            className={`material-symbols-outlined ${
              location.pathname === "/dashboard" ? " text-primary" : ""
            }`}>
            data_usage
          </span>
          <p className="text-xs">Dashboard</p>
        </div>
      </div>

      <div
        onClick={() =>
          isAuthenticated
            ? navigate(`/users/account?email=${user?.email}`)
            : setIsAuthForm(!isAuthForm)
        }
        className="w-full hover:brightness-90 bg-violet-950/10 from-violet-950/20 via-violet-950/10 to-violet-950/20 bg-gradient-to-r shadow-2xl rounded-t-lg p-4 text-center cursor-pointer duration-100 select-none active:scale-95">
        <div className="tooltip" data-tip={"Profile"}>
          <span
            className={`material-symbols-outlined ${
              location.pathname.split("?")[0] === `/users/account`
                ? " text-primary"
                : ""
            }`}>
            person
          </span>
          <p className="text-xs">Account</p>
        </div>
      </div>
    </div>
  );
};
