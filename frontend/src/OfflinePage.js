// src/OfflinePage.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { SidebarGeneral } from "./Pages/Secret/Components/_sidebarGeneral";

const OfflinePage = () => {
  const navigate = useNavigate();
  return (
    <SidebarGeneral>
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-transparent via-base-100 dark:via-base-100 to-base-100 dark:to-base-100 fixed inset-0">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img
              src={require("./Images/Alert/no-signal-2.png")}
              alt="No Signal"
              width={100}
              draggable={false}
              className="mx-auto"
              onError={(e) => (e.target.style.display = "none")}
            />
          </div>
          <p className="text-sm md:text-base text-pretty p-2 mb-4">
            You {"aren't"} connected to a working internet connection
          </p>
          <div className="flex justify-center items-center">
            <button
              onClick={() => navigate()}
              className="bg-transparent duration-200 hover:bg-base-300 text-pretty hover:text-white rounded shadow hover:shadow-lg py-2 px-4 border border-base-200 hover:border-transparent">
              Retry
            </button>
          </div>
        </div>
      </div>
    </SidebarGeneral>
  );
};

export default OfflinePage;
