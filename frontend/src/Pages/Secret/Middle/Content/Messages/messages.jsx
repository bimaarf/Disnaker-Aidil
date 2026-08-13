import React, { useState } from "react";
import { Inbox } from "./inbox";
import { Announcement } from "./announcement";
import { useSelector } from "react-redux";

export const Messages = () => {
  const [tabActive, setTabActive] = useState(null);
  const theme = useSelector((state) => state.themes.theme);
  return (
    <>
      <div
        className={`flex justify-between bg-${theme?.name}-700/30 pt-1 text-center text-white text-sm uppercase`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTabActive(null)}
            className={`px-4 py-2 border-b-4  flex items-center duration-100 gap-2 ${
              !tabActive
                ? "border-yellow-500"
                : "border-transparent hover:border-yellow-500"
            }`}>
            <span className="material-symbols-outlined">
              mark_unread_chat_alt
            </span>
            <p>Kotak Masuk</p>
          </button>
          <button
            onClick={() => setTabActive("announcement")}
            className={`px-4 py-2 border-b-4  flex items-center duration-100 gap-2 ${
              tabActive === "announcement"
                ? "border-yellow-500"
                : "border-transparent hover:border-yellow-500"
            }`}>
            <span className="material-symbols-outlined">brand_awareness</span>
            <p>Notifikasi</p>
          </button>
        </div>
      </div>
      <div
        className={`bg-${theme?.name}-950/10 md:p-4 space-y-4 pt-6 whitespace-normal min-h-[70vh]`}>
        {!tabActive ? <Inbox /> : <Announcement />}
      </div>
      {/* Navigation Tabs */}
    </>
  );
};
