import React from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { selectUser } from "../../../features/authentication/AuthSlice";

// SidebarMobile component
export const SidebarMobile = ({ setIsAuthForm, isAuthForm }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const currentUser = useSelector(selectUser);
  return (
    <ul
      className={`fixed btn-nav bottom-0 flex items-end justify-between shadow-xl w-screen z-50`}>
      <li
        onClick={() => (isAuthenticated ? navigate(`/`) : navigate(`/`))}
        className={`w-full bg-gradient-to-b from-base-200/50 shadow-2xl  p-4 text-center cursor-pointer to-base-200/20 bg-base-100 duration-100 select-none active:scale-y-95 ${
          location.pathname === "/" || location.pathname === "/"
            ? `text-teal-600`
            : ""
        }`}>
        <div className="tooltip -space-y-1" data-tip={"Dashboard"}>
          <span className={`material-symbols-outlined`}>house</span>
          <p className="text-xs">Home</p>
        </div>
      </li>
      <li
        onClick={() => {
          if (isAuthenticated) {
            navigate(`/dashboard`);
          } else {
            navigate(`/login`);
          }
        }}
        className={`w-full bg-gradient-to-b from-base-200/50 shadow-2xl p-4 text-center cursor-pointer to-base-200/20 bg-base-100 duration-100 select-none active:scale-y-95 ${
          location.pathname === "/dashboard" ? `text-teal-600` : ""
        }`}>
        <div className="tooltip -space-y-1" data-tip={"Games"}>
          <span className={`material-symbols-outlined `}>space_dashboard</span>
          <p className="text-xs">Dashboard</p>
        </div>
      </li>
      <li
        onClick={() => {
          if (isAuthenticated) {
            navigate(`/enggang/form/create`);
          } else {
            navigate(`/enggang/form/create`);
          }
        }}
        className={`w-full bg-gradient-to-b from-base-200/50 shadow-2xl p-4 text-center cursor-pointer to-base-200/20 bg-base-100 duration-100 select-none active:scale-y-95 ${
          location.pathname === "/enggang/form/create" ? `text-teal-600` : ""
        }`}>
        <div className="tooltip -space-y-1" data-tip={"Games"}>
          <span className={`material-symbols-outlined `}>add</span>
          <p className="text-xs whitespace-nowrap">Add Form</p>
        </div>
      </li>
      <li
        onClick={() =>
          isAuthenticated
            ? navigate("/enggang/form")
            : setIsAuthForm(isAuthForm)
        }
        className={`w-full bg-gradient-to-b from-base-200/50 shadow-2xl  p-4 text-center cursor-pointer to-base-200/20 bg-base-100 duration-100 select-none active:scale-y-95 ${
          location.pathname === "/enggang/form" ? `text-teal-600` : ""
        }`}>
        <div className="tooltip -space-y-1" data-tip={"History"}>
          <span className={`material-symbols-outlined `}>list_alt</span>
          <p className="text-xs font-medium">History</p>
        </div>
      </li>

      <li
        onClick={() =>
          isAuthenticated
            ? navigate(`/users/account?email=${currentUser.email}`)
            : setIsAuthForm(isAuthForm)
        }
        className={`w-full bg-gradient-to-b from-base-200/50 shadow-2xl  p-4 text-center cursor-pointer to-base-200/20 bg-base-100 duration-100 select-none active:scale-y-95 ${
          location.pathname.split("?")[0] === `/users/account`
            ? `text-teal-600`
            : ""
        }`}>
        <div className="tooltip -space-y-1" data-tip={"Profile"}>
          <span className={`material-symbols-outlined`}>person</span>
          <p className="text-xs font-medium">Profile</p>
        </div>
      </li>
    </ul>
  );
};
