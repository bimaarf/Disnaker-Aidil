import React, { useEffect, useRef, useState } from "react";
import BannerCreateForm from "./__bannerCreateForm";

export const ModalBanner = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef();

  useEffect(() => {
    setIsVisible(true);
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = "15px";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      id="modal-deposit"
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md transition-all duration-300">
      <div
        ref={modalRef}
        className={`overflow-y-auto md:fixed md:right-0 w-11/12 md:w-1/4 bg-base-100 border border-base-300 rounded-lg shadow-lg p-4 transform transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}>
        <BannerCreateForm />
        <button
          onClick={handleClose}
          className="btn w-full btn-square md:mb-0 mb-20">
          Close
        </button>
      </div>
    </div>
  );
};
