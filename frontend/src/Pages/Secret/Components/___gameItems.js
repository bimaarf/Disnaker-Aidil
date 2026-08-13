import React from "react";
import { truncateText } from "../../../Context/__useTruncate";
import { useSelector } from "react-redux";

export const GameItems = ({ game, handleTrigger }) => {
  const truncateTitle = truncateText;
  const theme = useSelector((state) => state.themes.theme);
  return (
    <>
      <div
        key={game?.id}
        className="group cursor-pointer hover:brightness-90 duration-100 select-none block relative overflow-hidden">
        <div className="flex flex-wrap justify-start items-center w-[18vh] h-[20vh] md:w-[20vh] md:h-[24vh]">
          {game?.image ? (
            <div className="relative w-[14vh] flex-shrink-0 h-[20vh] md:w-[20vh] md:h-[24vh]">
              <img
                draggable={false}
                className="object-cover w-auto h-auto"
                src={`${process.env.REACT_APP_API}game/images/${game?.image}`}
                alt="Games"
              />
              <p className={`text-sm p-2 text-${theme?.name}-300 text-center`}>
                {truncateTitle(game?.title, 20)}
              </p>
              <div
                onClick={() => handleTrigger(game)}
                className="absolute inset-0 flex items-center justify-center transition-opacity duration-200 opacity-0 group-hover:opacity-100 bg-base-100/80">
                <div
                  className={`text-xs py-1 flex items-center gap-2 hover:brightness-90 px-4 rounded bg-gradient-to-b duration-200 text-white hover:from-${theme?.name}-500/70 hover:to-${theme?.name}-950/70 from-${theme?.name}-950/70 to-${theme?.name}-500/70 font-body`}>
                  <span className="material-symbols-outlined">play_arrow</span>
                  <p className="uppercase font-medium">Main</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="avatar placeholder w-full h-full flex items-center justify-center">
              <div className="bg-neutral text-neutral-content rounded w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl">
                  broken_image
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
