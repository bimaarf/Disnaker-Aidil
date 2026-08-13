import React, { useEffect, useState } from "react";

export const ModalGeneral = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true); 
    document.body.style.overflow = "hidden"; 
    document.body.style.paddingRight = "15px";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    // Add event listener for keydown
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup on unmount
    return () => {
      setIsVisible(false); // Hide modal
      document.body.style.overflow = ""; // Enable scrolling
      document.body.style.paddingRight = ""; // Reset padding
      window.removeEventListener("keydown", handleKeyDown); // Remove event listener
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Match the duration with the CSS transition
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      id="modal-deposit"
      className={`fixed inset-0 z-50 flex items-center justify-end backdrop-blur-md transition-all duration-300`}
    >
      <div
        className={`modal-box top-0 fixed w-full bg-base-100 border border-base-300 rounded-lg shadow-lg p-4 ${
          isVisible ? "transform translate-x-0" : "transform translate-x-full"
        }`}
      >
        <h3 className="font-bold text-lg">Deposit Funds</h3>
        <p className="py-4">Press ESC key or click outside to close</p>
        <button onClick={handleClose} className="btn btn-primary">
          Close
        </button>
      </div>
    </div>
  );
};
