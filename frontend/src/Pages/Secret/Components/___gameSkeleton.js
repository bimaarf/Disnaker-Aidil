import React from "react";

export const GameSkeleton = ({total}) => {
  return (
    <>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="group w-32 skeleton cursor-pointer hover:brightness-90 duration-100 select-none block relative overflow-hidden rounded-lg">
          <div className="flex justify-center items-center w-full h-[20vh]">
            <div className="flex justify-center items-center">
              <i className="fa-solid fa-spinner animate-spin text-gray-400"></i>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};
