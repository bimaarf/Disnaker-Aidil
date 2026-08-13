import React from "react";
import { useNavigate } from "react-router-dom";
import useIsMobile from "../../../../Context/__useIsMobile";

export const BadgeBanks = ({ badgeData, totalActive, totalSuspend }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  return (
    <div className="mx-auto">
      <ul
        className={`menu menu-horizontal bg-base-200/50 ${
          !isMobile ? "w-96" : "w-full"
        } overflow-x-auto justify-center md:justify-end items-center gap-2 px-2 rounded`}>
        <li onClick={() => navigate("/bank/create")}>
          <div className="gap-1 text-xs md:text-sm">
            <i className="fas fa-plus"></i> Add New
          </div>
        </li>
        <li>
          <div className="gap-1 text-xs md:text-sm">
            <i className="fas fa-database"></i>
            <span className="badge badge-xs md:badge-sm">{badgeData}+</span>
          </div>
        </li>
        <li>
          <div className="gap-1 text-xs md:text-sm">
            {totalActive}+{" "}
            <span className="badge badge-xs md:badge-sm badge-success"></span>
          </div>
        </li>
        <li>
          <div className="gap-1 text-xs md:text-sm">
            {totalSuspend}+{" "}
            <span className="badge badge-xs md:badge-sm badge-error"></span>
          </div>
        </li>
      </ul>
    </div>
  );
};
