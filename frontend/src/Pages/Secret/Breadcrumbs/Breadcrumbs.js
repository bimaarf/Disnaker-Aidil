import React from "react";
import { Link, useLocation } from "react-router-dom";

const Breadcrumbs = () => {
  const location = useLocation();
  let pathnames = location.pathname
    .split("/")
    .map((x) => x.trim())
    .filter((x) => x && !/^\d+$/.test(x));

  const updateIndex = pathnames.indexOf("update");
  const previewIndex = pathnames.indexOf("preview");

  const truncateIndex = Math.max(updateIndex, previewIndex);

  if (truncateIndex > -1) {
    pathnames = pathnames.slice(0, truncateIndex + 1);
  }

  return (
    <div className="breadcrumbs text-sm p-3 rounded-xl bg-base-100 dark:bg-base-200 shadow-sm border border-base-200/50 backdrop-blur-sm">
      <ul className="flex items-center space-x-1">
        <li className="flex items-center">
          <Link
            to="/"
            className="group flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-base-content/60 hover:text-base-content hover:bg-base-200/70 transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-4 w-4 stroke-current group-hover:scale-110 transition-transform duration-200">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
            </svg>
            <span className="group-hover:scale-105 transition-transform duration-200">
              Home
            </span>
          </Link>
        </li>
        {pathnames.map((pathname, index) => {
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;

          return (
            <li key={to} className="flex items-center">
              {/* Separator */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="h-4 w-4 text-base-content/40 mx-2 flex-shrink-0">
                <path200
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>

              {isLast ? (
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-base-200/80 shadow-sm border border-base-200/50 backdrop-blur-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="h-4 w-4 stroke-current text-base-content/70">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <span className="text-sm font-semibold text-base-content/80 truncate max-w-[120px] sm:max-w-none">
                    {pathname.charAt(0).toUpperCase() + pathname.slice(1)}
                  </span>
                </span>
              ) : (
                <Link
                  to={to}
                  className="group flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-base-content/60 hover:text-base-content hover:bg-base-200/70 transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="h-4 w-4 stroke-current group-hover:scale-110 transition-transform duration-200">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                  </svg>
                  <span className="group-hover:scale-105 transition-transform duration-200 truncate max-w-[120px] sm:max-w-none">
                    {pathname.charAt(0).toUpperCase() + pathname.slice(1)}
                  </span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Breadcrumbs;
