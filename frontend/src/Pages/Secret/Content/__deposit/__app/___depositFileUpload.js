import "quill/dist/quill.core.css";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import "../../../../../App.css";
import {
  fetchDeposit,
  updateDeposit,
} from "../../../../../features/deposits/depositSlice";

export const DepositFileUpload = ({ selectedData, onUploadSuccess }) => {
  const [imagePreview, setImagePreview] = useState(null);
  const [file, setFile] = useState(null);
  const dispatch = useDispatch();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const processFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Please select a valid image file");
      setFile(null);
      setImagePreview(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleUpload = () => {
    if (file && selectedData) {
      const formData = new FormData();
      formData.append("image", file);
      dispatch(updateDeposit({ key: selectedData.key, depositData: formData }))
        .then((result) => {
          dispatch(fetchDeposit(selectedData.key));
          toast.success("Deposit updated successfully!");

          if (onUploadSuccess) {
            onUploadSuccess(result.payload.image);
            setImagePreview(null);
          }
        })
        .catch(() => {
          toast.error("Failed to update the deposit.");
        });
    }
  };

  if (!selectedData) {
    return null;
  }

  return (
    <div className="mt-4">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input").click()}
        className="border-dashed border-2 border-gray-400 h-40 rounded-lg p-4 cursor-pointer flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-4xl">cloud_upload</span>
        <p>Drag & drop your image here, or click to upload</p>
        <input
          id="file-input"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      {imagePreview && (
        <div className="my-4 flex justify-center">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full max-w-xs object-contain"
          />
        </div>
      )}
      <div className="flex justify-end mt-4">
        <button
          onClick={handleUpload}
          className="btn btn-info rounded"
          disabled={!file}>
          Upload Image
        </button>
      </div>
    </div>
  );
};
