import React from "react";

export const TabsFilter = ({ isTab, setIsTab }) => {
  return (
    <>
      <div className="flex justify-start items-center overflow-x-auto gap-4">
        <span className="material-symbols-outlined">notifications_active</span>
        <button
          className={`${
            !isTab && "glass"
          } px-4 py-2 text-sm bg-base-200 hover:bg-base-300 rounded active:scale-95 duration-100 `}
          onClick={() => {
            setIsTab(null);
          }}>
          Default
        </button>
        <button
          className={`${
            isTab === "table" && "glass"
          } px-4 py-2 text-sm bg-base-200 hover:bg-base-300 rounded active:scale-95 duration-100 `}
          onClick={() => {
            setIsTab("table");
          }}>
          Table
        </button>
      </div>
    </>
  );
};
