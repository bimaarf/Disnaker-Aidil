import React from "react";
import { useSelector } from "react-redux";

export const EventMenu = ({ dataEvent, setLabelEFilter, labelEFilter }) => {
  const theme = useSelector((state) => state.themes.theme);
  return (
    <ul className="space-y-0">
      <li
        onClick={() => {
          setLabelEFilter("");
        }}
        className={`${
          labelEFilter === ""
            ? `bg-transparent text-${theme?.name}-300`
            : `bg-base-300/30 text-white`
        } hover:bg-${
          theme?.name || "default"
        }-950/10 active:scale-95 duration-300`}>
        <div className="font-normal">
          <span className="font-medium py-2">Semua Event Promosi</span>
        </div>
      </li>
      {dataEvent.map((item, index) => (
        <li
          onClick={() => {
            setLabelEFilter(item.label);
          }}
          key={index}
          className={`${
            item.label === labelEFilter
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
