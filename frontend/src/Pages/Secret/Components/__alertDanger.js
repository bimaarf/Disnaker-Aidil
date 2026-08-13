import React from "react";

export const AlertDanger = ({ title, body }) => {
  return (
    <div
      className="bg-base-100 border border-error text-sm text-error rounded-lg p-4"
      role="alert"
      tabIndex="-1"
      aria-labelledby="hs-with-description-label">
      <div className="flex">
        <div className="shrink-0">
          <svg
            className="shrink-0 size-4 mt-0.5"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
            <path d="M12 9v4"></path>
            <path d="M12 17h.01"></path>
          </svg>
        </div>
        <div className="ms-4">
          <h3 id="hs-with-description-label" className="text-sm font-semibold">
            {title || ""}
          </h3>
          <div className="mt-1 text-sm text-error/50">{body || ""}</div>
        </div>
      </div>
    </div>
  );
};
