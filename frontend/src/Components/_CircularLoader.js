import React from "react";

export const CircularLoader = () => {
  return (
    <div className="flex items-center justify-center min-h-[2rem]">
      <span className="material-symbols-outlined animate-spin text-center">
        donut_large
      </span>
    </div>
  );
};
