import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "../../../../../App.css";
import {
  resetBannerStatus,
  updateBanner,
} from "../../../../../features/LandingPages/bannerSlice";

export const BannerModal = ({ selectedData, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [bannerImage, setBannerImage] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const dispatch = useDispatch();
  const status = useSelector((state) => state.banners.status);
  const error = useSelector((state) => state.banners.error);

  useEffect(() => {
    if (selectedData) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "15px";

      if (selectedData.image) {
        setBannerPreview(
          `${process.env.REACT_APP_API}banners/images/${selectedData.image}`
        );
      }
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
      dispatch(resetBannerStatus());
    };
  }, [selectedData, dispatch]);

  const handleClose = () => {
    setIsVisible(false);
    setBannerImage(null);
    setTimeout(onClose, 300);
  };

  const handleFileChange = (files) => {
    const file = files[0];
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (file && allowedTypes.includes(file.type)) {
      setBannerImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please upload a valid image file (jpeg, png, gif, webp).");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileChange(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleClick = () => {
    document.getElementById("file-input").click();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (bannerImage) {
      const formData = new FormData();
      formData.append("image", bannerImage);

      try {
        await dispatch(
          updateBanner({ key: selectedData.key, bannerData: formData })
        ).unwrap();
        handleClose();
      } catch (error) {
        console.error("Update failed: ", error);
      }
    }
  };

  if (!selectedData) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="banner-modal-title"
      aria-describedby="banner-modal-description"
      className={`fixed inset-0 flex items-center justify-center backdrop-blur-md transition-all duration-300  ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
      style={{ zIndex: 9999 }}>
      <div
        className={`p-6 rounded-lg w-11/12 shadow-lg bg-base-100 transition-transform duration-300 ${
          isVisible ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transition: "transform 300ms ease-out, opacity 300ms ease-out",
        }}>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger" aria-live="polite">
              {typeof error === "string" ? (
                error
              ) : (
                <>
                  <p>Status: {error.status}</p>
                  <p>Message: {error.message || "An error occurred."}</p>
                </>
              )}
            </div>
          )}
          <div className="py-4 flex justify-between ">
            <div className="w-2/3">
              <div
                className="flex justify-center items-center w-full h-full"
                style={{ height: "70vh" }}>
                {(bannerPreview || selectedData.image) && (
                  <img
                    src={
                      bannerPreview ||
                      `${process.env.REACT_APP_API}banners/images/${selectedData.image}`
                    }
                    alt={selectedData.key}
                    className={`object-contain duration-500 ${
                      bannerPreview || selectedData.width > selectedData.height
                        ? "w-full h-auto"
                        : "h-full w-auto"
                    }`}
                    style={{
                      maxHeight: "70vh",
                      maxWidth: "100%",
                    }}
                  />
                )}
              </div>
            </div>
            <div className="border-l border-base-300 pl-2">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleClick}
                className="border-dashed border-2 h-40 border-gray-400 p-4 rounded-lg cursor-pointer flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-4xl">
                  cloud_upload
                </span>
                <p>Drag & drop your image here, or click to upload</p>
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files)}
                  accept="image/*"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={status === "loading"}>
              {status === "loading" ? "Updating..." : "Update"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-ghost ml-2">
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
