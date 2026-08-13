import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBanners } from "../../../../../features/LandingPages/bannerSlice"; // Adjust the import path as necessary

export const Banners = () => {
  const dispatch = useDispatch();
  const banners = useSelector((state) => state.banners.banners);

  // Fetch banners only if the state is empty
  useEffect(() => {
    if (banners.length === 0) {
      dispatch(fetchBanners({ page: 1, perPage: 10 }));
    }
  }, [banners, dispatch]); // Dependencies include banners and dispatch

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {banners.slice(0, 10).map((banner) => (
          <a
            key={banner.id} // Make sure to use a unique key for each banner
            className="group block relative overflow-hidden rounded-lg"
            href="#">
            <img
              className="w-full size-40 object-cover bg-gray-100 rounded-lg dark:bg-neutral-800"
              src={`${process.env.REACT_APP_API}banners/images/${banner.image}`}
              alt="Project"
            />
            <div className="absolute bottom-1 end-1 opacity-0 group-hover:opacity-100 transition">
              <div className="flex items-center gap-x-1 py-1 px-2 bg-white border border-gray-200 text-gray-800 rounded-lg dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200">
                <svg
                  className="shrink-0 size-3"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <span className="text-xs">View</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </>
  );
};
