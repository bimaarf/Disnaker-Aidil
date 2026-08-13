import React from "react";

const ConfirmationAlert = ({ onClose, onConfirm, message }) => {
  return (
    <div
      role="alert"
      className="alert fixed top-10 right-0 z-50 w-fit bg-white border border-gray-300 shadow-md p-4 rounded">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        className="stroke-info h-6 w-6 shrink-0">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <span>{message}</span>
      <div>
        <button className="btn btn-sm" onClick={onClose}>
          Deny
        </button>
        <button className="btn btn-sm btn-primary" onClick={onConfirm}>
          Accept
        </button>
      </div>
    </div>
  );
};

export default ConfirmationAlert;
