import "quill/dist/quill.core.css";
import React, { useEffect, useState } from "react";
import "../../../../../App.css";

export const ProductModal = ({ selectedData, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (selectedData) {
      setIsVisible(true);
      document.body.style.overflow = "hidden"; // Disable scrolling
    } else {
      setIsVisible(false);
      document.body.style.overflow = ""; // Enable scrolling
    }

    // Event listener for 'Esc' key press
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    // Attach event listener
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedData]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Match the duration with the CSS transition
  };

  if (!selectedData) {
    return null; // Return nothing if no product is selected
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      aria-describedby="product-modal-description"
      className={`fixed inset-0 flex items-center justify-center backdrop-blur-md transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
      style={{ zIndex: 9999 }} // Ensure it's on top of other elements
    >
      <div
        className={`relative p-6 rounded-lg h-screen md:w-8/12 shadow-lg bg-base-100 transition-transform duration-300 ${
          isVisible ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transition: "transform 300ms ease-out, opacity 300ms ease-out",
          maxHeight: "77vh", // Ensures modal doesn’t overflow the viewport
          overflowY: "auto", // Enables vertical scrolling
        }}>
        <div className="sticky top-2 right-2 float-right">
          <button onClick={handleClose} className="btn btn-ghost">
            Close
          </button>
        </div>
        <div className="py-4">
          {selectedData.image && (
            <div className="mb-4 flex justify-center">
              <img
                src={`${process.env.REACT_APP_API}dash/product/images/${selectedData.image}`}
                alt={selectedData.title}
                className="w-full max-w-xs"
              />
            </div>
          )}
          <div className="text-md mb-4">
            <h1 id="product-modal-title" className="font-medium">
              {selectedData.title}
            </h1>
          </div>
          <div className="text-sm mb-4">
            {/* Render HTML description including heading tags and lists */}
            <div
              id="product-modal-description"
              className="text-sm whitespace-pre-line prose ql-editor"
              dangerouslySetInnerHTML={{ __html: selectedData.description }}
            />
          </div>
          <p className="text-sm">
            Status: {selectedData.status ? "Visible" : "Hidden"}
          </p>
          <p className="text-sm">
            Created At: {new Date(selectedData.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};
