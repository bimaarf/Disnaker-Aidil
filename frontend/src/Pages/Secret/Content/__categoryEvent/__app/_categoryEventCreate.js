import React, { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import TopBarProgress from "react-topbar-progress-indicator";
import { createCategoryEvent } from "../../../../../features/event/categoryEventSlice";
import {
  ArrowLeft,
  Tag,
  Save,
  Star,
  Trash2,
  Upload,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const CategoryEventCreatePage = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((state) => state.categoryEvents);
  const [localError, setLocalError] = useState(null);

  const imagesRef = useRef([]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, []);

  const handleNameChange = (e) => {
    setName(e.target.value);
  };
  const handleIconChange = (e) => {
    setIcon(e.target.value);
  };

  useEffect(() => {
    if (error?.name) {
      setLocalError(error.name);
    } else {
      setLocalError(null);
    }
  }, [error]);

  const handleImageChange = useCallback(
    debounce((e) => {
      const files = Array.from(e.target.files);
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      const maxSize = 2 * 1024 * 1024; // 2MB

      const validImages = files.filter((file) => {
        if (!validTypes.includes(file.type)) {
          toast.error(
            `Invalid file type: ${file.name}. Only JPEG, PNG, JPG, WebP allowed.`
          );
          return false;
        }
        if (file.size > maxSize) {
          toast.error(`File too large: ${file.name}. Max size is 2MB.`);
          return false;
        }
        return true;
      });

      const newImages = validImages.map((file) => ({
        image_data: file,
        preview: URL.createObjectURL(file),
        is_primary: false,
      }));

      setImages((prevImages) => {
        const updatedImages = [...prevImages, ...newImages];
        if (
          !updatedImages.some((img) => img.is_primary) &&
          updatedImages.length > 0
        ) {
          updatedImages[0].is_primary = true;
          setSelectedImage(updatedImages[0]);
        }
        return updatedImages;
      });
    }, 300),
    []
  );

  const togglePrimaryImage = useCallback((index) => {
    setImages((prevImages) => {
      const updatedImages = prevImages.map((img, i) => ({
        ...img,
        is_primary: i === index,
      }));
      setSelectedImage(updatedImages[index]);
      return updatedImages;
    });
  }, []);

  const removeImage = useCallback(
    (index) => {
      setImages((prevImages) => {
        const removedImage = prevImages[index];
        URL.revokeObjectURL(removedImage.preview);
        const updatedImages = prevImages.filter((_, i) => i !== index);

        let newSelected = selectedImage;
        if (selectedImage === removedImage) {
          newSelected = null;
        }

        if (
          !updatedImages.some((img) => img.is_primary) &&
          updatedImages.length > 0
        ) {
          updatedImages[0].is_primary = true;
        }

        const primaryImage = updatedImages.find((img) => img.is_primary);

        if (updatedImages.length > 0) {
          if (newSelected === null) {
            newSelected = primaryImage || updatedImages[0];
          }
        } else {
          newSelected = null;
        }

        setSelectedImage(newSelected);
        return updatedImages;
      });
    },
    [selectedImage]
  );

  const handleImageSelect = useCallback((image) => {
    setSelectedImage(image);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("icon", icon);
    formData.append("description", description);
    images.forEach((image, index) => {
      formData.append(`images[${index}]`, image.image_data);
      formData.append(`is_primary[${index}]`, image.is_primary ? 1 : 0);
    });
    try {
      await dispatch(createCategoryEvent(formData)).unwrap();
      navigate("/category/event");
      toast.success("CategoryEvent created successfully!");
    } catch (err) {
      toast.error("Validation error occurred. Please check the fields.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/category/event");
  };

  const renderErrorMessages = (error) => {
    if (typeof error === "object" && error !== null) {
      return Object.keys(error).map((key) => {
        const messages = error[key];
        if (Array.isArray(messages)) {
          return messages.map((message, index) => (
            <div key={index} className="text-xs text-red-500 mt-1">
              {message}
            </div>
          ));
        }
        return null;
      });
    }
    return null;
  };

  return (
    <div className="min-h-screen">
      {loading && <TopBarProgress />}
      {/* Mobile-First Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        <form
          id="category-create-form"
          onSubmit={handleSubmit}
          className="space-y-8">
          {/* Main Form Grid - Desktop: Form Left, Images Right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column - Form Fields */}
            <div className="space-y-8 lg:order-1">
              {/* Basic Information Card */}
              <div className="bg-base-100 dark:bg-base-200 rounded-lg shadow-sm backdrop-blur-sm transition-all duration-500">
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-base-content">
                      Basic Information
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {/* Category Name */}
                    <div className="form-control">
                      <label className="px-2 pb-2">
                        <span className="text-sm text-base-content font-semibold">
                          Category Name *
                        </span>
                      </label>
                      <div className="relative group">
                        <input
                          type="text"
                          value={name}
                          onChange={handleNameChange}
                          className="w-full px-4 py-3 bg-base-200 dark:bg-base-300 rounded-2xl border focus:border-primary borderoutline-none transition-all duration-300 placeholder:text-base-content/50 border-base-300"
                          placeholder="Enter an amazing category name..."
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      {!name.trim() && (
                        <label className="px-2">
                          <span className="label-text-alt text-error flex items-center gap-1">
                            <div className="w-1 h-3 bg-error rounded"></div>
                            Category name is required
                          </span>
                        </label>
                      )}
                      {localError && renderErrorMessages({ name: localError })}
                    </div>

                    {/* Icon Field */}
                    <div className="form-control">
                      <div className="p-2 flex items-center justify-between">
                        <span className="text-sm text-base-content font-semibold">
                          Icon *
                        </span>
                        <div className="label-text-alt text-base-content/50">
                          Gunakan Icon Lucide di{" "}
                          <span
                            onClick={() =>
                              window.open("https://lucide.dev/icons/", "_blank")
                            }
                            className="cursor-pointer text-primary hover:underline">
                            https://lucide.dev/icons/
                          </span>
                        </div>
                      </div>
                      <div className="relative group">
                        <input
                          type="text"
                          value={icon}
                          onChange={handleIconChange}
                          className="w-full px-4 py-3 bg-base-200 dark:bg-base-300 rounded-2xl border focus:border-primary borderoutline-none transition-all duration-300 placeholder:text-base-content/50 border-base-300"
                          placeholder="example : Heart"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
                          <Tag className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                      {!icon.trim() && (
                        <label className="px-2">
                          <span className="label-text-alt text-error flex items-center gap-1">
                            <div className="w-1 h-3 bg-error rounded"></div>
                            Category icon is required
                          </span>
                        </label>
                      )}
                      {localError && renderErrorMessages({ icon: localError })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Card */}
              <div className="bg-base-100 dark:bg-base-200 rounded-lg shadow-sm backdrop-blur-sm transition-all duration-500">
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                      <Save className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-base-content">
                      Description *
                    </h2>
                  </div>

                  <div className="bg-base-300/30 rounded-lg focus-within:border-primary transition-all duration-300 overflow-hidden">
                    <ReactQuill
                      value={description}
                      onChange={setDescription}
                      theme="snow"
                      className="custom-quill modern-quill"
                      placeholder="Describe your category in detail. What makes it special? What kind of events will it include?"
                      modules={{
                        toolbar: [
                          [{ header: [1, 2, 3, false] }],
                          ["bold", "italic", "underline", "strike"],
                          [{ list: "ordered" }, { list: "bullet" }],
                          ["blockquote", "code-block"],
                          ["link", "image"],
                          ["clean"],
                        ],
                      }}
                    />
                  </div>
                  {!description.trim() && (
                    <div className="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg">
                      <p className="text-error text-sm flex items-center gap-2">
                        <div className="w-1 h-4 bg-error rounded"></div>A
                        detailed description is required to help users
                        understand this category
                      </p>
                    </div>
                  )}
                  {localError &&
                    renderErrorMessages({ description: localError })}
                </div>
              </div>
            </div>

            {/* Right Column - Image Management */}
            <div className="lg:order-2">
              <div className="bg-base-100 dark:bg-base-200 rounded-lg shadow-sm backdrop-blur-sm transition-all duration-500">
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-base-content">
                      Images
                    </h2>
                    {images.length > 0 && (
                      <div className="badge badge-primary badge-outline">
                        {images.length} image{images.length > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>

                  {/* Main Image Display */}
                  <div className="space-y-6">
                    <div className="aspect-[4/3] bg-gradient-to-br from-base-300/50 to-base-200 rounded-lg overflow-hidden group relative">
                      {selectedImage ? (
                        <div className="relative w-full h-full">
                          <img
                            src={selectedImage.preview}
                            alt="Selected preview"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="badge badge-primary shadow-sm text-base-content/3060">
                              Preview
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-base-content/40">
                          <div className="relative mb-4">
                            <ImageIcon className="w-16 sm:w-20 h-16 sm:h-20 animate-pulse" />
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary/30 rounded-full animate-ping"></div>
                          </div>
                          <h3 className="text-lg sm:text-xl font-semibold mb-2">
                            No Image Selected
                          </h3>
                          <p className="text-sm opacity-70 text-center max-w-xs">
                            Upload images below to see preview here
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Upload Zone */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                        multiple
                        id="image-upload-create"
                      />
                      <label
                        htmlFor="image-upload-create"
                        className="cursor-pointer block">
                        <div className="border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-lg p-6 lg:p-8 bg-gradient-to-br from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 group text-center">
                          <div className="space-y-3">
                            <div className="relative inline-block">
                              <Upload className="w-10 h-10 lg:w-12 lg:h-12 text-primary group-hover:text-primary/80 transition-all duration-300 group-hover:-translate-y-2" />
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                            </div>
                            <div>
                              <h3 className="text-base lg:text-lg font-bold text-primary group-hover:text-primary/80 transition-colors duration-300 mb-1">
                                Upload Images
                              </h3>
                              <p className="text-sm text-base-content/70 mb-2">
                                Drag & drop or click to browse
                              </p>
                              <p className="text-xs text-base-content/50">
                                JPEG, PNG, JPG, WebP • Max 2MB
                              </p>
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Image Gallery */}
                    {images.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-lg flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-primary" />
                            Gallery
                          </h4>
                          <div className="badge badge-outline text-base-content/60 outline-base-300/50">
                            {images.length} item{images.length > 1 ? "s" : ""}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                          {images.map((image, index) => (
                            <div
                              key={index}
                              onClick={() => handleImageSelect(image)}
                              className={`aspect-square relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300 group ${
                                selectedImage === image
                                  ? "ring-2 ring-primary ring-offset-2 ring-offset-base-100 scale-105 shadow-md"
                                  : "ring-1 ring-base-300/30 hover:ring-primary/60 opacity-70 hover:opacity-100 hover:scale-105 hover:shadow-sm"
                              }`}>
                              <img
                                src={image.preview}
                                alt={`Gallery ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                              />

                              {/* Controls */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePrimaryImage(index);
                                  }}
                                  className={`btn btn-circle btn-xs shadow-sm backdrop-blur-sm ${
                                    image.is_primary
                                      ? "btn-primary text-white"
                                      : "bg-white/90 hover:bg-white text-primary border-0"
                                  }`}
                                  title={
                                    image.is_primary
                                      ? "Primary Image"
                                      : "Set as Primary"
                                  }>
                                  <Star className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(index);
                                  }}
                                  className="btn btn-circle btn-xs btn-error text-white shadow-sm backdrop-blur-sm"
                                  title="Remove Image">
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>

                              {image.is_primary && (
                                <div className="absolute bottom-1 left-1">
                                  <div className="badge badge-primary badge-xs shadow-sm backdrop-blur-sm">
                                    <Star className="w-2 h-2 mr-1" />
                                    Primary
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-4 sm:bottom-6 z-40">
            <div className="bg-white/90 dark:bg-base-200/90 backdrop-blur-sm rounded-lg shadow-sm border border-base-300/30 p-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn btn-outline flex-1 sm:flex-none sm:px-8 rounded-lg hover:scale-105 transition-all duration-300"
                  disabled={loading}>
                  <ArrowLeft className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Cancel</span>
                  <span className="sm:hidden">Back</span>
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-white flex-1 sm:flex-none sm:px-8 rounded-lg shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 group order-first sm:order-last"
                  disabled={
                    loading ||
                    !name.trim() ||
                    !icon.trim() ||
                    !description.trim()
                  }>
                  {loading && (
                    <span className="loading loading-spinner loading-sm"></span>
                  )}
                  <Save className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="ml-2">
                    {loading ? "Creating..." : "Create Category"}
                  </span>
                </button>
              </div>

              {/* Mobile Progress Indicator */}
              <div className="mt-3 sm:hidden">
                <div className="flex justify-between text-xs text-base-content/60 mb-1">
                  <span>Progress</span>
                  <span>
                    {
                      [name.trim(), icon.trim(), description.trim()].filter(
                        Boolean
                      ).length
                    }
                    /3
                  </span>
                </div>
                <div className="progress progress-primary bg-base-300 h-1">
                  <div
                    className="progress-primary transition-all duration-500"
                    style={{
                      width: `${
                        ([name.trim(), icon.trim(), description.trim()].filter(
                          Boolean
                        ).length /
                          3) *
                        100
                      }%`,
                    }}></div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        .modern-quill .ql-editor {
          min-height: 200px;
          font-size: 16px;
          line-height: 1.7;
          padding: 2rem;
          background: transparent;
          color: hsl(var(--bc));
        }

        .modern-quill .ql-toolbar {
          background: hsl(var(--b2) / 0.5);
          border: none;
          border-bottom: 1px solid hsl(var(--b3) / 0.3);
          padding: 1.5rem;
        }

        .modern-quill .ql-container {
          border: none;
        }

        .modern-quill .ql-toolbar .ql-stroke {
          stroke: hsl(var(--bc) / 0.7);
          transition: stroke 0.3s ease;
        }

        .modern-quill .ql-toolbar .ql-fill {
          fill: hsl(var(--bc) / 0.7);
          transition: fill 0.3s ease;
        }

        .modern-quill .ql-toolbar button:hover .ql-stroke {
          stroke: hsl(var(--p));
        }

        .modern-quill .ql-toolbar button:hover .ql-fill {
          fill: hsl(var(--p));
        }

        .modern-quill .ql-toolbar button {
          border-radius: 0.5rem;
          transition: all 0.3s ease;
        }

        .modern-quill .ql-toolbar button:hover {
          background: hsl(var(--p) / 0.1);
        }

        /* Mobile-optimized scrollbar */
        .modern-quill .ql-editor::-webkit-scrollbar {
          width: 4px;
        }

        .modern-quill .ql-editor::-webkit-scrollbar-track {
          background: transparent;
        }

        .modern-quill .ql-editor::-webkit-scrollbar-thumb {
          background: hsl(var(--bc) / 0.2);
          border-radius: 2px;
        }

        .modern-quill .ql-editor::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--p) / 0.4);
        }

        /* Mobile touch improvements */
        @media (max-width: 768px) {
          .btn {
            min-height: 3rem;
            font-size: 1rem;
          }
          
          .input {
            min-height: 3rem;
            font-size: 16px;
          }
          
          .modern-quill .ql-editor {
            padding: 1.5rem;
            font-size: 16px;
          }
          
          .modern-quill .ql-toolbar {
            padding: 1rem;
          }
        }

        /* Focus indicators for accessibility */
        .input:focus {
          box-shadow: 0 0 0 2px hsl(var(--p) / 0.2);
          border-color: hsl(var(--p));
        }

        .btn:focus-visible {
          box-shadow: 0 0 0 2px hsl(var(--p) / 0.3);
        }
      `}</style>
    </div>
  );
};

export default CategoryEventCreatePage;
