import React from "react";

export const BadgeNotifications = ({ badgeData }) => {
  return (
    <div className="sm:float-left lg:float-right">
      <ul className="menu bg-base-200/50 menu-horizontal">
        <li>
          <div>
            <span className="material-symbols-outlined">database</span>
            <span className="badge badge-xs md:badge-sm">{badgeData}+</span>
          </div>
        </li>
      </ul>
    </div>
  );
};
