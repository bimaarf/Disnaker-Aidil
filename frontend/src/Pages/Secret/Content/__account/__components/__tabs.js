import React from "react";

export const TabsAccounts = ({ tabSelect, setTabSelect }) => {
  return (
    <>
      <div className="flex justify-start items-center gap-4">
        <div
          className={`${
            tabSelect === null || !tabSelect
              ? "bg-primary text-white"
              : "bg-base-200 text-base-content"
          } px-4 py-2 text-sm sm:hover:text-white sm:hover:bg-primary rounded-lg active:scale-95 duration-100 flex items-center gap-2 cursor-pointer`}
          onClick={() => setTabSelect(null)}>
          <span className="material-symbols-outlined">shield_lock</span>
          <span>Password</span>
        </div>
        <div
          className={`${
            tabSelect === "Setting"
              ? "bg-primary text-white"
              : "bg-base-200 text-base-content"
          } px-4 py-2 text-s sm:hover:text-white sm:hover:bg-primary rounded-lg active:scale-95 duration-100 flex items-center gap-2 cursor-pointer`}
          onClick={() => setTabSelect("Setting")}>
          <span className="material-symbols-outlined">settings</span>
          <span>Setting</span>
        </div>
      </div>
    </>
  );
};
