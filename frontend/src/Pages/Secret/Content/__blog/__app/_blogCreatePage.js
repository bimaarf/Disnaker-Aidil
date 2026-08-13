import React, { useEffect, useState, useCallback, useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import TopBarProgress from "react-topbar-progress-indicator";
import {
  ArrowLeft,
  Save,
  Image as ImageIcon,
  Upload,
  Star,
  Trash2,
  CheckCircle,
  Clock,
  Tag,
  Shield,
  FileText,
} from "lucide-react";
import { createBlog } from "../../../../../features/blog/blogSlice";
import { fetchCategoryBlogs } from "../../../../../features/blog/categoryBlogSlice";

// Debounce utility to limit frequent state updates
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const BlogCreatePage = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((state) => state.blogs);
  const categories = useSelector(
    (state) => state.categoryBlogs.categoryBlogs || []
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
            fetchCategoryBlogs({ pageFilter: 1, perPageFilter: 100 })
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
  }, [dispatch]);

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

  const removeImage = useCallback((index) => {
    setImages((prevImages) => {
      URL.revokeObjectURL(prevImages[index].preview);
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

        await dispatch(createBlog(formData)).unwrap();
        toast.success("Blog created successfully!");
        navigate("/blog");
      } catch (err) {
        toast.error("Error creating blog: " + (err.message || "Unknown error"));
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [name, description, status, selectedCategories, images, dispatch, navigate]
  );

  return (
    <div className="min-h-screen">
      {loading && <TopBarProgress />}

      {/* Navbar */}
      <div className="navbar bg-base-100 dark:bg-base-200 max-w-7xl mx-auto rounded shadow-sm backdrop-blur-sm">
        <div className="navbar-start">
          <button
            onClick={() => navigate("/blog")}
            className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
        <div className="navbar-center">
          <span className="text-sm font-medium text-base-content/60">
            Create New Blog
          </span>
        </div>
        <div className="navbar-end">
          <button
            type="submit"
            form="blog-create-form"
            className="btn btn-primary btn-sm gap-2"
            disabled={loading || selectedCategories.length === 0}>
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{loading ? "Creating..." : "Create"}</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-7xl bg-base-100 dark:bg-base-200 mt-3 rounded-xl shadow-sm backdrop-blur-sm">
        <form id="blog-create-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
            {/* Image Section */}
            <div className="space-y-4 lg:col-span-2">
              <div className="aspect-video lg:aspect-square bg-base-200 rounded-2xl overflow-hidden shadow-sm border border-base-300">
                {selectedImage ? (
                  <img
                    src={selectedImage.preview}
                    alt="Selected image"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-base-content/40">
                    <ImageIcon className="w-16 h-16 mb-3" />
                    <p className="text-sm font-medium">No image selected</p>
                  </div>
                )}
              </div>

              <div className="border-2 border-dashed border-base-300 rounded-xl p-6 bg-base-100 dark:bg-base-300 hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                  multiple
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-semibold text-base-content block">
                        Upload images
                      </span>
                      <span className="text-xs text-base-content/60">
                        JPEG, PNG, JPG, WebP up to 2MB
                      </span>
                    </div>
                  </div>
                </label>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((image, index) => (
                    <div
                      key={`new-${index}`}
                      onClick={() => handleImageSelect(image)}
                      className={`aspect-square relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                        selectedImage === image
                          ? "ring-2 ring-primary ring-offset-2"
                          : "ring-2 ring-base-300 opacity-60 hover:opacity-100"
                      }`}>
                      <img
                        src={image.preview}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-1 right-1 flex gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePrimaryImage(index);
                          }}
                          className={`btn btn-circle btn-xs ${
                            image.is_primary
                              ? "btn-primary"
                              : "btn-ghost bg-base-100/90 hover:bg-base-100"
                          }`}
                          title={
                            image.is_primary
                              ? "Primary Image"
                              : "Set as Primary"
                          }>
                          <Star
                            className={`w-3 h-3 ${
                              image.is_primary ? "fill-current" : ""
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          className="btn btn-circle btn-xs btn-error"
                          title="Remove Image">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      {image.is_primary && (
                        <span className="absolute bottom-1 left-1 badge badge-primary badge-xs px-2">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Fields Section */}
            <div className="space-y-6 lg:col-span-3">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                      status
                        ? "bg-success/10 text-success border border-success/20"
                        : "bg-warning/10 text-warning border border-warning/20"
                    }`}>
                    {status ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    <span>{status ? "Published" : "Draft"}</span>
                  </div>
                </div>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input input-lg w-full font-bold placeholder:font-semibold text-xl bg-transparent border-0 border-b-2 border-base-300 focus:border-primary rounded-none px-0 focus:outline-none"
                  placeholder="Enter your blog title..."
                  required
                />
                {error?.name && (
                  <p className="text-error text-sm">{error.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Categories */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    <span>Categories</span>
                  </h3>
                  <div className="bg-primary/5 dark:bg-base-300 rounded-xl p-4 border border-primary/10 dark:border-base-300 max-h-64 overflow-y-auto custom-scrollbar">
                    {uniqueCategories.length > 0 ? (
                      <div className="space-y-2">
                        {uniqueCategories.map((category) => (
                          <label
                            key={category.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200 transition-colors cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(category.id)}
                              onChange={() => handleCategoryChange(category.id)}
                              className="checkbox checkbox-primary checkbox-sm"
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

                {/* Publication Status */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>Publication Status</span>
                  </h3>
                  <div className="bg-primary/5 dark:bg-base-300 rounded-xl p-4 border border-primary/10 dark:border-base-300">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="font-semibold text-base-content">
                          {status ? "Published" : "Draft"}
                        </span>
                        <p className="text-xs text-base-content/60 mt-1">
                          {status
                            ? "Your blog will be visible to everyone"
                            : "Your blog will be saved as a draft"}
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

          {/* Content Section */}
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span>Content</span>
            </h3>
            <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100">
              <ReactQuill
                value={description}
                onChange={setDescription}
                theme="snow"
                className="react-quill custom-quill"
                placeholder="Write your blog content here..."
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
              <p className="text-error text-sm">{error.description}</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/blog")}
              className="btn btn-outline"
              disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary gap-2"
              disabled={loading || selectedCategories.length === 0}>
              {loading && (
                <span className="loading loading-spinner loading-sm"></span>
              )}
              <span>{loading ? "Creating..." : "Create Blog"}</span>
            </button>
          </div>
          {selectedCategories.length === 0 && (
            <p className="text-error text-sm mt-2 text-right">
              Please select at least one category
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default BlogCreatePage;
