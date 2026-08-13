import React from "react";
import { useSelector } from "react-redux";

export const PromotionMenu = ({
  dataPromotion,
  setLabelFilter,
  labelFilter,
}) => {
  const theme = useSelector((state) => state.themes.theme);
  return (
    <ul className="space-y-0">
      <li
        onClick={() => {
          setLabelFilter("");
        }}
        className={`${
          labelFilter === ""
            ? `bg-transparent text-${theme?.name}-300`
            : `bg-base-300/30 text-white`
        } hover:bg-${
          theme?.name || "default"
        }-950/10 active:scale-95 duration-300`}>
        <div className="font-normal">
          <span className="font-medium py-2">Semua Promosi</span>
        </div>
      </li>
      {dataPromotion.map((item, index) => (
        <li
          onClick={() => {
            setLabelFilter(item.label);
          }}
          key={index}
          className={`${
            item.label === labelFilter
              ? `bg-transparent text-${theme?.name}-300`
              : `bg-base-300/30 text-white`
          } hover:bg-${
            theme?.name || "default"
          }-950/10 active:scale-95 duration-300`}>
          <div className="font-normal">
            <span className="font-medium py-2">{item.label}</span>
          </div>
        </li>
      ))}
    </ul>
  );
};
