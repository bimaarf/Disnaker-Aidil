import React from "react";

export const Announcement = () => {
  return (
    <>
      <div className="flex justify-center mt-10vh]">
        <div className="flex w-fit justify-center rounded-full bg-base-300/90 p-10 items-center">
          <img
            className="size-20"
            src={require("../../../../../Images/Bell/empty.webp")}
          />
        </div>
      </div>
      <div className="text-center font-mono -tracking-widest">
        <p className="font-medium text-white">Belum Ada Notifikasi</p>
        <p className="text-sm text-white">
          Saat Anda mendapatkan notifikasi, mereka akan muncul di sini
        </p>
      </div>
    </>
  );
};
