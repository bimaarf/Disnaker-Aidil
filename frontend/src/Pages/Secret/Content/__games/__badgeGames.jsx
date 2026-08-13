import React from "react";

export const BadgeGames = ({ badgeData, totalVisible, totalHidden }) => {
  return (
    <div className="flex justify-end items-center">
      <ul className="menu bg-base-200/50 menu-horizontal flex items-center">
        <li>
          <div>
            <span className="material-symbols-outlined">database</span>
            <span className="badge badge-xs md:badge-sm">{badgeData}+</span>
          </div>
        </li>
        <li>
          <div className="text-xs">
            {totalVisible}+
            <span className="badge rounded-full badge-xs md:badge-sm badge-success"></span>
          </div>
        </li>
        <li>
          <div className="text-xs">
            {totalHidden}+
            <span className="badge rounded-full badge-xs md:badge-sm badge-error"></span>
          </div>
        </li>
      </ul>
    </div>
  );
};
