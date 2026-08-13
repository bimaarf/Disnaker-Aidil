import "quill/dist/quill.core.css";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import "../../../../../App.css";
import {
  fetchWithdraw,
  updateWithdraw,
} from "../../../../../features/withdraws/withdrawSlice";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const WithdrawPreview = ({ selectedData, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [file, setFile] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (selectedData) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "15px";
      setImagePreview(null);
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [selectedData]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (file && selectedData) {
      const formData = new FormData();
      formData.append("image", file);
      dispatch(
        updateWithdraw({ key: selectedData.key, withdrawData: formData })
      ).then(() => {
        dispatch(fetchWithdraw(selectedData.key));
        handleClose();
        toast.success("Withdraw updated successfully!");
      });
    }
  };
  const navigate = useNavigate();
  if (!selectedData) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdraw-modal-title"
      aria-describedby="withdraw-modal-description"
      className={`fixed inset-0 flex items-center justify-center backdrop-blur-md transition-opacity duration-300 ${
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
          {/* Existing content */}
          {selectedData.image && (
            <div className="mb-4 flex justify-center">
              <img
                src={`${process.env.REACT_APP_API}withdraw/images/${selectedData.image}`}
                alt={selectedData.amount}
                className="w-full max-w-xs"
              />
            </div>
          )}
          <div className="text-md mb-4">
            <h1 id="withdraw-modal-title" className="font-medium">
              {selectedData.amount}
            </h1>
          </div>
          <div className="text-sm mb-4">
            <div
              id="withdraw-modal-description"
              className="text-sm whitespace-pre-line prose ql-editor"
              dangerouslySetInnerHTML={{ __html: selectedData.description }}
            />
          </div>
          <p className="text-sm">
            Status: {selectedData.status ? "Confirmed" : "Process"}
          </p>
          <p className="text-sm">
            Created At: {new Date(selectedData.created_at).toLocaleDateString()}
          </p>

          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Upload New Image</h2>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mb-4"
            />
            {imagePreview && (
              <div className="mb-4 flex justify-center">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-w-xs"
                />
              </div>
            )}
            <button
              onClick={handleUpload}
              className="btn btn-primary"
              disabled={!file}>
              Upload Image
            </button>
          </div>
        </div>
        <div className="flex justify-end items-center gap-2">
          <button
            onClick={() => navigate("/withdraw/preview/" + selectedData.key)}
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
