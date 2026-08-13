import React from "react";
export const Game = () => {
  return (
    <>
      <div className=" overflow-hidden relative">
        <div className="fixed top-0 flex justify-between w-full z-50 bg-black">
          <button className="fa-solid text-3xl fa-bars"></button>
          <div className="w-full justify-center flex">
            <img
              src={require("../Images/Avatar/logo.png")}
              width={160}
              alt=""
            />
          </div>
          <button className="fa-regular text-2xl fa-user"></button>
        </div>

        <iframe
          className="w-screen h-screen cursor-pointer z-40 bottom-0"
          src="https://www.peernetwork.org/"></iframe>
      </div>
    </>
  );
};
