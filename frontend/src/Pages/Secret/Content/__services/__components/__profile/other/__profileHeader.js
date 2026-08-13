import React from "react";

export const ProfileHeader = ({ data }) => {
  return (
    <>
      <div className="flex rounded-xl justify-center items-center gap-6 bg-gradient-to-b p-4 from-blue-700 to-blue-400 dark:from-base-300 dark:to-base-100">
        {data?.avatar && data?.avatar !== "default.jpg" ? (
          <div className="relative group">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-teal-600 p-1">
              <div className="w-full h-full rounded-xl overflow-hidden bg-white">
                <img
                  src={`${process.env.REACT_APP_API}user/images/${data?.avatar}`}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-2 sm:border-3 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
        ) : (
          <div className="avatar placeholder">
            <div className="bg-gradient-to-br from-white/80 to-white/80 dark:from-primary/20 dark:to-primary/40 text-primary h-16 w-16 rounded-xl ring-2 ring-primary">
              <span className="text-3xl font-semibold">
                {data?.name?.charAt(0).toUpperCase() || "?"}
              </span>
            </div>
          </div>
        )}
        <div>
          <h1 className="text-balance font-bold text-white dark:text-neutral-content">
            {data?.name}
          </h1>
          <div className="flex justify-start items-center text-xs gap-2">
            <p className="text-white dark:text-neutral">Connected to</p>
            <p className="text-white dark:text-neutral">Website.com</p>
          </div>
          {/* menu */}
          {/* menu */}
          <p className="text-[10px] text-white dark:text-neutral mt-2">
            Registered: {data?.created_at}
          </p>
        </div>
      </div>
    </>
  );
};
