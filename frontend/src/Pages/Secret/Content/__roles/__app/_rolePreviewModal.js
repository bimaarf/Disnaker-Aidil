import "quill/dist/quill.core.css";
import React, { useEffect, useState } from "react";
import "../../../../../App.css";

export const UserModal = ({ selectedData, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (selectedData) {
      setIsVisible(true);
      document.body.style.overflow = "hidden"; // Disable scrolling
    } else {
      setIsVisible(false);
      document.body.style.overflow = ""; // Enable scrolling
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedData]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Match the duration with the CSS transition
  };

  if (!selectedData) {
    return null; // Return nothing if no user is selected
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-modal-title"
      aria-describedby="user-modal-description"
      className={`fixed inset-0 flex items-center justify-center backdrop-blur-md transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
      style={{ zIndex: 9999 }} // Ensure it's on top of other elements
    >
      <div
        className={`p-6 rounded-lg w-11/12 md:w-8/12 shadow-lg bg-base-100 transition-transform duration-300 ${
          isVisible ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transition: "transform 300ms ease-out, opacity 300ms ease-out",
          maxHeight: "77vh", // Ensures modal doesn’t overflow the viewport
          overflowY: "auto", // Enables vertical scrolling
        }}>
        <div className="py-4">
          {selectedData.image && (
            <div className="mb-4 flex justify-center">
              <img
                src={`${process.env.REACT_APP_API}user/images/${selectedData.image}`}
                alt={selectedData.title}
                className="w-full max-w-xs"
              />
            </div>
          )}
          <div className="text-md mb-4">
            <h1 id="user-modal-title" className="font-medium">
              {selectedData.name}
            </h1>
          </div>
          <div className="text-sm mb-4">
            {/* Render HTML description including heading tags and lists */}
            {selectedData.body}
          </div>
          <p className="text-sm">
            Status: {selectedData.status ? "Visible" : "Hidden"}
          </p>
          <p className="text-sm">
            Created At: {new Date(selectedData.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex justify-end">
          <button onClick={handleClose} className="btn btn-ghost">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
