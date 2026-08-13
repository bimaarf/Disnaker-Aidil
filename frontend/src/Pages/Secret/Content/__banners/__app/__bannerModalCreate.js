import React, { useEffect, useRef, useState } from "react";
import BannerCreateForm from "./___bannerCreateForm";

export const BannerModalCreate = ({ onClose }) => {
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
      setIsVisible(false);
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
      id="modal-create-banner"
      className={`fixed inset-0 z-50 flex items-center justify-end backdrop-blur-md transition-all duration-300`}>
      <div
        ref={modalRef}
        className={`overflow-y-auto md:fixed md:right-0 md:w-1/4 bg-base-100 border border-base-300 rounded-lg shadow-lg p-4 transform transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}>
        <h3 className="font-bold text-lg">Banner Create</h3>
        <div className="flex w-full flex-col">
          <div className="divider">Default</div>
          <BannerCreateForm handleClose={handleClose} />
        
        </div>
      </div>
    </div>
  );
};
