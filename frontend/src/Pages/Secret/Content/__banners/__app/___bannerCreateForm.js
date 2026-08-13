import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  resetBannerStatus,
  uploadBanner,
} from "../../../../../features/LandingPages/bannerSlice";

const MAX_IMAGES = 6;

const BannerCreateForm = ({ handleClose }) => {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.banners);
  const [bannerInputs, setBannerInputs] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(-1);

  const handleFileChange = (files) => {
    const newBannerInputs = [...bannerInputs];

    for (let i = 0; i < files.length; i++) {
      if (newBannerInputs.length < MAX_IMAGES) {
        const file = files[i];
        const reader = new FileReader();

        reader.onloadend = () => {
          newBannerInputs.push({
            id: Date.now() + Math.random(),
            file: file,
            preview: reader.result,
          });
          setBannerInputs(newBannerInputs);
        };

        reader.readAsDataURL(file);
      }
    }

    // Reset the file input for the next selection
    document.getElementById(`file-input`).value = null;
  };

  const handleRemoveInput = (id) => {
    const newBannerInputs = bannerInputs.filter((input) => input.id !== id);
    setBannerInputs(newBannerInputs);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileChange(files);
    }
  };

  const handleClick = () => {
    document.getElementById(`file-input`).click();
  };

  const handleInputChange = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      handleFileChange(files);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    bannerInputs.forEach((input) => {
      if (input.file) {
        formData.append("banners[]", input.file);
      }
    });
    dispatch(uploadBanner(formData));
    if (handleClose) {
      handleClose();
    }
  };

  useEffect(() => {
    if (status === "succeeded") {
      setBannerInputs([]);
      dispatch(resetBannerStatus());
    }
  }, [status, dispatch]);

  return (
    <div className="w-96">
      {status === "failed" && <p>Error: {error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
          className="border-dashed border-2 border-gray-400 p-4 rounded-lg cursor-pointer flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-4xl py-5">
            cloud_upload
          </span>
          <p>Drag & drop your images here, or click to upload</p>
        </label>
        <input
          id="file-input"
          type="file"
          onChange={handleInputChange}
          className="visually-hidden" // Use visually-hidden class instead
          accept="image/*"
          multiple
        />

        <div className="grid grid-flow-row-dense grid-cols-2 gap-4 mt-4">
          {bannerInputs.map((input) => (
            <div
              key={input.id}
              className="relative"
              onMouseEnter={() => setHoveredIndex(input.id)}
              onMouseLeave={() => setHoveredIndex(-1)}>
              <img
                src={input.preview}
                alt={`Preview ${input.id}`}
                className="w-96  object-cover"
              />
              {hoveredIndex === input.id && (
                <button
                  type="button"
                  onClick={() => handleRemoveInput(input.id)}
                  className="absolute bottom-1 right-1 flex rounded shadow-xl items-center hover:brightness-90 text-[12px] bg-white px-1 py-0.5 text-neutral font-medium">
                  <span className="material-symbols-outlined text-[14px]">
                    delete
                  </span>
                  <p>Delete</p>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setBannerInputs([]);
              dispatch(resetBannerStatus());
            }}
            className="btn btn-link">
            Reset Form
          </button>
          <button
            type="submit"
            className="btn btn-active flex items-center gap-2">
            <span className="material-symbols-outlined">upload</span>
            <p>Upload</p>
          </button>
        </div>
      </form>
    </div>
  );
};

export default BannerCreateForm;
