import React, { useEffect, useMemo, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
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
import useIsMobile from "../../../../../Context/__useIsMobile";
import {
  fetchBlog as fetch,
  updateBlog,
} from "../../../../../features/blog/blogSlice";
import { fetchCategoryBlogs } from "../../../../../features/blog/categoryBlogSlice";
import TopBarProgress from "react-topbar-progress-indicator";
import "../../../../../App.css";

const BlogUpdatePage = () => {
  const { key } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const dataProps = location.state?.dataProps;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const categories = useSelector(
    (state) => state.categoryBlogs.categoryBlogs || []
  );
  const { error } = useSelector((state) => state.blogs);

  const uniqueCategories = useMemo(() => {
    const seen = new Set();
    return categories.filter((item) => {
      const duplicate = seen.has(item.id);
      seen.add(item.id);
      return !duplicate;
    });
  }, [categories]);

  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategoryBlogs({ pageFilter: 1, perPageFilter: 100 }))
        .unwrap()
        .catch(() => toast.error("Failed to load categories."));
    }
  }, [dispatch, categories]);

  const isMobile = useIsMobile();
  useEffect(() => {
    if (dataProps) {
      setName(dataProps.name || "");
      setDescription(dataProps.description || "");
      setStatus(!!dataProps.status);
      setSelectedCategories(dataProps.categories?.map((cat) => cat.id) || []);
      const images =
        dataProps.images?.map((img) => ({
          ...img,
          is_primary: !!img.is_primary,
        })) || [];
      setImages(images);
      setSelectedImage(images.find((img) => img.is_primary) || images[0]);
    } else if (key) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const blogData = await dispatch(fetch(key)).unwrap();
          setName(blogData.name || "");
          setDescription(blogData.description || "");
          setStatus(!!blogData.status);
          setSelectedCategories(
            blogData.categories?.map((cat) => cat.id) || []
          );
          const images =
            blogData.images?.map((img) => ({
              ...img,
              is_primary: !!img.is_primary,
            })) || [];
          setImages(images);
          setSelectedImage(images.find((img) => img.is_primary) || images[0]);
        } catch (err) {
          toast.error("Failed to fetch blog data.");
          navigate("/blog");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      navigate(isMobile && dataProps ? -2 : dataProps ? -1 : "/blog");
    }
  }, [dispatch, key, dataProps, navigate, isMobile]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    const maxSize = 2 * 1024 * 1024;

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
  };

  const togglePrimaryImage = (index) => {
    setImages((prevImages) => {
      const updatedImages = prevImages.map((img, i) => ({
        ...img,
        is_primary: i === index,
      }));
      setSelectedImage(updatedImages[index]);
      return updatedImages;
    });
  };

  const removeImage = (index) => {
    const image = images[index];
    if (image.id) {
      setImagesToRemove((prev) => [...prev, image.id]);
    }
    setImages((prevImages) => {
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
  };

  const handleImageSelect = (image) => {
    setSelectedImage(image);
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategories((prev) => {
      const exists = prev.includes(categoryId);
      if (exists) {
        return prev.filter((id) => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (selectedCategories.length === 0) {
      toast.error("Please select at least one category");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("status", status ? 1 : 0);

      selectedCategories.forEach((categoryId) => {
        formData.append("category_ids[]", String(categoryId));
      });

      const existingImages = images.filter((image) => image.id);
      existingImages.forEach((image, index) => {
        formData.append(`existing_images[${index}][id]`, image.id);
        formData.append(
          `existing_images[${index}][is_primary]`,
          image.is_primary ? 1 : 0
        );
      });

      const newImages = images.filter(
        (image) => image.image_data instanceof File
      );
      newImages.forEach((image, index) => {
        formData.append(`images[${index}]`, image.image_data);
        formData.append(`is_primary[${index}]`, image.is_primary ? 1 : 0);
      });

      imagesToRemove.forEach((id) => {
        formData.append("images_to_remove[]", id);
      });

      const response = await dispatch(
        updateBlog({ key, blogData: formData })
      ).unwrap();
      if (!response.errors) {
        toast.success("Blog updated successfully!");
        navigate(dataProps ? -1 : "/blog");
      }
    } catch (err) {
      toast.error("Error updating blog: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {loading && <TopBarProgress />}

      {/* Navbar */}
      <div className="navbar bg-base-100 dark:bg-base-200 max-w-7xl mx-auto rounded shadow-sm backdrop-blur-sm">
        <div className="navbar-start">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
        <div className="navbar-center">
          <span className="text-sm font-medium text-base-content/60">
            Update Blog
          </span>
        </div>
        <div className="navbar-end">
          <button
            type="submit"
            form="blog-update-form"
            className="btn btn-primary btn-sm gap-2"
            disabled={loading || selectedCategories.length === 0}>
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{loading ? "Updating..." : "Save"}</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-7xl bg-base-100 dark:bg-base-200 mt-3 rounded-xl shadow-sm backdrop-blur-sm">
        <form id="blog-update-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
            {/* Image Section */}
            <div className="space-y-4 lg:col-span-2">
              {/* Main Image */}
              <div className="aspect-video lg:aspect-square bg-base-200 rounded-2xl overflow-hidden shadow-sm border border-base-300">
                {selectedImage ? (
                  <img
                    src={
                      selectedImage.image_data instanceof File
                        ? URL.createObjectURL(selectedImage.image_data)
                        : `${selectedImage.image_data}`
                    }
                    alt="Selected image"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-base-content/40">
                    <ImageIcon className="w-16 h-16 mb-3" />
                    <p className="text-sm font-medium">No image available</p>
                  </div>
                )}
              </div>

              {/* File Upload */}
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

              {/* Thumbnail Gallery */}
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((image, index) => (
                    <div
                      key={image.id || `new-${index}`}
                      onClick={() => handleImageSelect(image)}
                      className={`aspect-square relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                        selectedImage === image
                          ? "ring-2 ring-primary ring-offset-2"
                          : "ring-2 ring-base-300 opacity-60 hover:opacity-100"
                      }`}>
                      <img
                        src={
                          image.image_data instanceof File
                            ? URL.createObjectURL(image.image_data)
                            : `${image.image_data}`
                        }
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
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
              {/* Title & Status Badge */}
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

              {/* Categories & Status */}
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
              onClick={() => navigate(-1)}
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
              <span>{loading ? "Updating..." : "Update Blog"}</span>
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

export default BlogUpdatePage;
