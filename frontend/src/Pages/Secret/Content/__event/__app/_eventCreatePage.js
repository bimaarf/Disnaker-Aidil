import React, { useEffect, useState, useCallback, useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import TopBarProgress from "react-topbar-progress-indicator";
import { createEvent } from "../../../../../features/event/eventSlice";
import { fetchCategoryEvents } from "../../../../../features/event/categoryEventSlice";

// Debounce utility to limit frequent state updates
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const EventCreatePage = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((state) => state.events);
  const categories = useSelector(
    (state) => state.categoryEvents.categoryEvents || []
  );

  // Memoize unique categories to prevent recalculations
  const uniqueCategories = useMemo(
    () =>
      Array.from(
        new Map(categories.map((category) => [category.id, category])).values()
      ),
    [categories]
  );

  // Fetch categories only once on mount
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        if (categories.length === 0) {
          await dispatch(
            fetchCategoryEvents({ pageFilter: 1, perPageFilter: 100 })
          ).unwrap();
        }
      } catch (err) {
        if (mounted) {
          toast.error(
            `Failed to load categories: ${err.message || "Unknown error"}`
          );
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [dispatch]); // Removed categories from dependencies

  // Cleanup image previews on unmount or when images change
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [images]);

  // Debounced image change handler
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
        preview: URL.createObjectURL(file), // Generate preview once
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

  const removeImage = useCallback((index) => {
    setImages((prevImages) => {
      URL.revokeObjectURL(prevImages[index].preview); // Cleanup preview
      const updatedImages = prevImages.filter((_, i) => i !== index);
      if (
        !updatedImages.some((img) => img.is_primary) &&
        updatedImages.length > 0
      ) {
        updatedImages[0].is_primary = true;
        setSelectedImage(updatedImages[0]);
      } else if (updatedImages.length === 0) {
        setSelectedImage(null);
      }
      return updatedImages;
    });
  }, []);

  const handleImageSelect = useCallback((image) => {
    setSelectedImage(image);
  }, []);

  const handleCategoryChange = useCallback((categoryId) => {
    setSelectedCategories((prev) => {
      const exists = prev.includes(categoryId);
      return exists
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId];
    });
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (selectedCategories.length === 0) {
        toast.error("Please select at least one category");
        return;
      }

      setLoading(true);
      try {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);
        formData.append("status", status ? 1 : 0);

        selectedCategories.forEach((categoryId) => {
          formData.append("category_ids[]", categoryId);
        });

        images.forEach((image, index) => {
          formData.append(`images[${index}]`, image.image_data);
          formData.append(`is_primary[${index}]`, image.is_primary ? 1 : 0);
        });

        await dispatch(createEvent(formData)).unwrap();
        toast.success("Event created successfully!");
        navigate("/event");
      } catch (err) {
        toast.error("Error creating event: " + (err.message || "Unknown error"));
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [name, description, status, selectedCategories, images, dispatch, navigate]
  );

  return (
    <div className="min-h-screen bg-base-100">
      {loading && <TopBarProgress />}

      {/* Navbar */}
      <div className="navbar bg-base-100 shadow-sm border-b border-base-300 sticky top-0 z-40">
        <div className="navbar-start">
          <button
            onClick={() => navigate("/event")}
            className="btn btn-ghost btn-sm">
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>
        </div>
        <div className="navbar-center">
          <span className="text-sm text-base-content/60">Create New Event</span>
        </div>
        <div className="navbar-end">
          <button
            type="submit"
            form="event-create-form"
            className="btn btn-primary text-white btn-sm gap-2"
            disabled={loading || selectedCategories.length === 0}>
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <span className="material-symbols-outlined text-sm">save</span>
            )}
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <form id="event-create-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Section */}
            <div className="space-y-4">
              <div className="aspect-square bg-base-200 rounded-2xl overflow-hidden shadow-sm border border-base-300">
                {selectedImage ? (
                  <img
                    src={selectedImage.preview}
                    alt="Selected image"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy" // Lazy load main image
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-base-content/40">
                    <span className="material-symbols-outlined text-6xl mb-2">
                      image
                    </span>
                    <p className="text-sm">No image selected</p>
                  </div>
                )}
              </div>

              <div className="border p-4 border-base-300 rounded-lg bg-base-50">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                  multiple
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-4xl text-base-content/60">
                      upload
                    </span>
                    <span className="text-sm font-medium text-base-content">
                      Upload images
                    </span>
                    <span className="text-xs text-base-content/70">
                      JPEG, PNG, JPG, WebP up to 2MB
                    </span>
                  </div>
                </label>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((image, index) => (
                    <div
                      key={`new-${index}`}
                      onClick={() => handleImageSelect(image)}
                      className={`aspect-square relative rounded-lg overflow-hidden cursor-pointer ${
                        selectedImage === image
                          ? "ring-2 ring-primary ring-offset-2"
                          : "ring-1 ring-base-300 opacity-50 hover:opacity-90"
                      }`}>
                      <img
                        src={image.preview}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy" // Lazy load thumbnails
                      />
                      <div className="absolute top-0 right-0 p-1 flex gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePrimaryImage(index);
                          }}
                          className={`btn btn-circle btn-xs btn-${
                            image.is_primary
                              ? "primary text-white"
                              : "ghost bg-white/80 hover:bg-white dark:bg-base-200/80 dark:hover:bg-base-200"
                          }`}
                          title={
                            image.is_primary
                              ? "Primary Image"
                              : "Set as Primary"
                          }>
                          <span className="material-symbols-outlined text-xs">
                            star
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          className="btn btn-circle btn-xs btn-error text-white"
                          title="Remove Image">
                          <span className="material-symbols-outlined text-xs">
                            delete
                          </span>
                        </button>
                      </div>
                      {image.is_primary && (
                        <span className="absolute bottom-2 left-2 badge badge-primary badge-sm text-white">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Fields Section */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`badge badge-${
                      status ? "badge-success" : "badge-warning"
                    } gap-2`}>
                    <span className="material-symbols-outlined text-xs">
                      {status ? "check_circle" : "pending"}
                    </span>
                    {status ? "Published" : "Draft"}
                  </div>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input w-full font-semibold bg-base-100 text-base-content border-b border-base-300 focus:border-primary focus:ring-none dark:bg-base-100 dark:border-base-200"
                  placeholder="Enter your event title..."
                  required
                />
                {error?.name && (
                  <p className="text-red-500 text-sm mt-1">{error.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      label
                    </span>
                    Categories
                  </h3>
                  <div className="bg-base-50 rounded-xl p-4 border border-base-300 max-h-64 overflow-y-auto">
                    {uniqueCategories.length > 0 ? (
                      <div className="space-y-2">
                        {uniqueCategories.map((category) => (
                          <label
                            key={category.id}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-base-100 transition-colors cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(category.id)}
                              onChange={() => handleCategoryChange(category.id)}
                              className="checkbox checkbox-primary"
                            />
                            <span className="text-sm font-medium text-base-content">
                              {category.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-base-content/60 text-sm py-4">
                        No categories available
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-base-content/60">
                    Selected: {selectedCategories.length} categories
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      verified
                    </span>
                    Publication Status
                  </h3>
                  <div className="bg-base-50 rounded-xl p-4 border border-base-300">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="font-semibold text-base-content">
                          {status ? "Published" : "Draft"}
                        </span>
                        <p className="text-sm text-base-content/70 mt-1">
                          {status
                            ? "Your event will be visible to everyone"
                            : "Your event will be saved as a draft"}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary toggle-lg"
                        checked={status}
                        onChange={(e) => setStatus(e.target.checked)}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-base-300 pt-8">
            <div className="border-t border-base-300 pt-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  description
                </span>
                Content
              </h3>
              <div className="rounded-xl border border-base-300 dark:border-base-300 bg-gray-50 dark:bg-base-300">
                <ReactQuill
                  value={description}
                  onChange={setDescription}
                  theme="snow"
                  className="react-quill custom-quill"
                  placeholder="Write your event content here..."
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
              {error?.description && (
                <p className="text-red-500 text-sm mt-2">{error.description}</p>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/event")}
              className="btn btn-outline px-4"
              disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary text-white px-4 gap-2"
              disabled={loading || selectedCategories.length === 0}>
              {loading && (
                <span className="loading loading-spinner loading-sm"></span>
              )}
              {loading ? "Creating..." : "Create Event"}
            </button>
          </div>
          {selectedCategories.length === 0 && (
            <p className="text-red-500 text-sm mt-2 text-right">
              Please select at least one category
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default EventCreatePage;
