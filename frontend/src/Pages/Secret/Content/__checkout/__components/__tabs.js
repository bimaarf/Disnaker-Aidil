import React from "react";

export const TabsFilter = ({ viewMode, handleSetViewMode }) => {
  return (
    <>
      <div className="flex justify-start items-center overflow-x-auto gap-4">
        <span className="material-symbols-outlined">notifications_active</span>
        <button
          className={`${
            !viewMode && "glass"
          } px-4 py-2 text-sm bg-base-200 hover:bg-base-300 rounded active:scale-95 duration-100 `}
          onClick={() => {
            handleSetViewMode(null);
          }}>
          Default
        </button>
        <button
          className={`${
            viewMode === "table" && "glass"
          } px-4 py-2 text-sm bg-base-200 hover:bg-base-300 rounded active:scale-95 duration-100 `}
          onClick={() => {
            handleSetViewMode("table");
          }}>
          Table
        </button>
      </div>
    </>
  );
};
