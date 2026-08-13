import "quill/dist/quill.core.css";
import React, { useEffect, useState } from "react";
import "../../../../../App.css";
import { useNavigate } from "react-router-dom";

export const WalletModal = ({ selectedData, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (selectedData) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "15px";
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedData]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!selectedData) {
    return null;
  }

  const truncateTitle = (title, limit) => {
    return title.length > limit ? title.slice(0, limit) + "..." : title;
  };
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
      aria-describedby="wallet-modal-description"
      className={`fixed inset-0 flex items-center justify-center backdrop-blur-md transition-all duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
      style={{ zIndex: 9999 }}>
      <div
        className={`p-6 rounded-lg w-11/12 md:w-8/12 shadow-lg bg-base-100 transition-transform duration-300 ${
          isVisible ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transition: "transform 300ms ease-out, opacity 300ms ease-out",
          maxHeight: "77vh", 
          overflowY: "auto", 
        }}>
        <div className="py-4">
          {selectedData.image && (
            <div className="mb-4 flex justify-center">
              <img
                src={`${process.env.REACT_APP_API}wallet/images/${selectedData.image}`}
                alt={selectedData.username}
                className="w-full max-w-xs"
              />
            </div>
          )}
          <div className="text-md mb-4">
            <h1 id="wallet-modal-title" className="font-medium">
              {truncateTitle(selectedData.username, 50)}
            </h1>
          </div>
          <div className="text-sm mb-4">
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
          <button
            onClick={() =>
              navigate(`/wallets/preview/${selectedData.key}`, {
                state: { dataProps: selectedData },
              })
            }
            className="btn btn-ghost">
            Preview
          </button>
          <button onClick={handleClose} className="btn btn-ghost">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
