import React from "react";
import { useNavigate } from "react-router-dom";

export const BadgePromotionProducts = ({
  badgeData,
  totalVisible,
  totalHidden,
}) => {
  const navigate = useNavigate();
  return (
    <div className="flex justify-end rounded-l-lg">
      <ul className="menu bg-base-300/50 dark:bg-base-200/50 menu-horizontal">
        <li onClick={() => navigate("/promotion/product/create")}>
          <div>
            <i className="fas fa-plus"></i>
            Add New
          </div>
        </li>
        <li>
          <div>
            <i className="fas fa-database"></i>
            <span className="badge badge-xs md:badge-sm">{badgeData}+</span>
          </div>
        </li>
        <li>
          <div>
            {totalVisible}+
            <span className="badge badge-xs md:badge-sm badge-success"></span>
          </div>
        </li>
        <li>
          <div>
            {totalHidden}+
            <span className="badge badge-xs md:badge-sm badge-error"></span>
          </div>
        </li>
      </ul>
    </div>
  );
};
