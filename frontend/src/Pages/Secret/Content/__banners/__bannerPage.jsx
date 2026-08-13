import { debounce } from "lodash";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  fetchBanners,
  uploadBanner,
  updateBanner,
  fetchBanner,
} from "../../../../features/LandingPages/bannerSlice";
import { fetchBlogs } from "../../../../features/blog/blogSlice";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { handleDelete, handleDeleteData } from "./__actions/__bannerAction";
import { truncateText } from "../../../../Context/__useTruncate";
import BannerList from "./__components/__bannerList";
import {
  X,
  Calendar,
  Share2,
  ChevronLeft,
  ChevronRight,
  Edit2,
} from "lucide-react";
import useIsMobile from "../../../../Context/__useIsMobile";

// Circular Loader Component
const CircularLoader = () => (
  <div className="flex justify-center items-center py-12">
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20"></div>
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent absolute top-0"></div>
    </div>
  </div>
);

// Format Date Utility
const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};


// Banner Create Form Component
const BannerCreateForm = ({ handleClose, isInModal = false }) => {
  const { status, error } = useSelector((state) => state.banners);
  const dispatch = useDispatch();
  const [bannerInputs, setBannerInputs] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedBlogId, setSelectedBlogId] = useState("");
  const [blogQuery, setBlogQuery] = useState("");
  const [showBlogDropdown, setShowBlogDropdown] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const dropdownRef = useRef(null);
  const MAX_IMAGES = 6;
  const blogs = useSelector((state) => state.blogs.blogs);
  const blogStatus = useSelector((state) => state.blogs.status);

  const debouncedSearch = useMemo(
    () =>
      debounce((q) => {
        if (q.length > 0) {
          dispatch(
            fetchBlogs({
              page: 1,
              perPage: 10,
              searchQuery: q,
              loadMore: false,
            })
          );
        } else {
          dispatch(fetchBlogs({ page: 1, perPage: 10, loadMore: false }));
        }
      }, 300),
    [dispatch]
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

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
          setBannerInputs([...newBannerInputs]);
        };
        reader.readAsDataURL(file);
      }
    }
    document.getElementById(`file-input`).value = null;
  };

  const handleRemoveInput = (id) => {
    const newBannerInputs = bannerInputs.filter((input) => input.id !== id);
    setBannerInputs(newBannerInputs);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileChange(files);
    }
  };

  const handleClick = () => {
    document.getElementById(`file-input`).click();
  };

  const handleInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileChange(files);
    }
  };

  const handleBlogSelect = (blogId, blogName) => {
    setSelectedBlogId(blogId);
    setBlogQuery(blogName);
    setShowBlogDropdown(false);
  };

  const handleBlogQueryChange = (e) => {
    const value = e.target.value;
    setBlogQuery(value);
    setShowBlogDropdown(value !== "");
    if (value === "") {
      setSelectedBlogId("");
    }
    debouncedSearch(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    bannerInputs.forEach((input) => {
      if (input.file) {
        formData.append("banners[]", input.file);
      }
    });
    if (selectedBlogId) {
      formData.append("blog_id", selectedBlogId);
    }
    try {
      await dispatch(uploadBanner(formData)).unwrap();
      toast.success("Banner uploaded successfully!");
      setBannerInputs([]);
      setSelectedBlogId("");
      setBlogQuery("");
      if (handleClose) handleClose();
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Failed to upload banners");
    }
  };

  const handlePreviewClose = () => {
    setShowPreview(false);
  };

  const handlePreviewPrev = () => {
    setPreviewIndex((prev) => (prev > 0 ? prev - 1 : bannerInputs.length - 1));
  };

  const handlePreviewNext = () => {
    setPreviewIndex((prev) => (prev < bannerInputs.length - 1 ? prev + 1 : 0));
  };

  const currentPreview = bannerInputs[previewIndex]?.preview;

  return (
    <div className="w-full bg-base-100 dark:bg-base-200 backdrop-blur-xl rounded-3xl shadow-sm border border-base-300/30 overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-primary rounded-2xl shadow-sm backdrop-blur-sm shadow-primary/25">
              <svg
                className="w-6 h-6 text-primary-content"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-primary">
                Upload Banners
              </h3>
              <p className="text-sm text-base-content/60 mt-0.5">
                Add up to {MAX_IMAGES} stunning images
              </p>
            </div>
          </div>
        </div>
        {status === "failed" && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-error/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-error"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-error">Upload Error</p>
                <p className="text-xs text-error/80 mt-0.5">{error}</p>
              </div>
            </div>
          </div>
        )}
        <div className="space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`group relative border-3 border-dashed rounded-3xl p-8 md:p-12 cursor-pointer transition-all duration-500 ${
              isDragging
                ? "border-primary bg-primary/10 scale-[1.02] shadow-xl shadow-primary/25"
                : "border-base-300/50 hover:border-primary/50 hover:bg-primary/5"
            }`}>
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div
                className={`relative transition-all duration-500 ${
                  isDragging ? "scale-110" : "group-hover:scale-105"
                }`}>
                <div className="absolute inset-0 bg-primary rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div
                  className={`relative p-5 rounded-3xl transition-all duration-500 ${
                    isDragging
                      ? "bg-primary"
                      : "bg-base-200 group-hover:from-primary/20 group-hover:to-secondary/20"
                  }`}>
                  <svg
                    className={`w-10 h-10 md:w-12 md:h-12 transition-colors duration-500 ${
                      isDragging
                        ? "text-primary-content"
                        : "text-base-content/60 group-hover:text-primary"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <p
                  className={`text-lg md:text-xl font-bold transition-all duration-300 ${
                    isDragging ? "text-primary scale-105" : "text-base-content"
                  }`}>
                  {isDragging
                    ? "Drop your files here"
                    : "Drag & Drop your images"}
                </p>
                <p className="text-sm text-base-content/60">
                  or{" "}
                  <span className="font-semibold text-primary">
                    click to browse
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-base-200 rounded-full backdrop-blur-sm">
                <svg
                  className="w-4 h-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-xs font-medium text-base-content/60">
                  PNG, JPG, GIF up to 10MB
                </span>
              </div>
            </div>
            <input
              id="file-input"
              type="file"
              onChange={handleInputChange}
              className="hidden"
              accept="image/*"
              multiple
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-base font-bold text-base-content flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                Selected Images
              </h4>
              <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-sm font-bold text-primary">
                {bannerInputs.length}/{MAX_IMAGES}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {bannerInputs.length > 0 ? (
                bannerInputs.map((input, index) => (
                  <div
                    key={input.id}
                    className="group relative aspect-video rounded-2xl overflow-hidden bg-base-200 shadow-sm backdrop-blur-sm hover:shadow-xl transition-all duration-500 hover:scale-[1.02] border border-base-300 cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(input.id)}
                    onMouseLeave={() => setHoveredIndex(-1)}
                    onClick={() => {
                      setPreviewIndex(index);
                      setShowPreview(true);
                    }}>
                    <img
                      src={input.preview}
                      alt={`Preview ${input.id}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div
                      className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300 ${
                        hoveredIndex === input.id ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {hoveredIndex === input.id && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveInput(input.id);
                        }}
                        className="absolute top-3 right-3 p-2.5 bg-error hover:bg-error/90 text-error-content rounded-xl shadow-sm shadow-error/50 transition-all duration-300 hover:scale-110 active:scale-95 z-10">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-base-content/60 py-4">
                  No images selected yet
                </div>
              )}
            </div>
          </div>
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-bold text-base-content/60 mb-3 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Linked Blog{" "}
              <span className="text-xs text-base-content/60 font-normal">
                (Optional)
              </span>
            </label>
            <input
              type="text"
              value={blogQuery}
              onChange={handleBlogQueryChange}
              onFocus={() => setShowBlogDropdown(true)}
              onBlur={(e) => {
                if (
                  dropdownRef.current &&
                  !dropdownRef.current.contains(e.relatedTarget)
                ) {
                  setShowBlogDropdown(false);
                }
              }}
              placeholder="Search for a blog..."
              className="w-full px-5 py-3.5 bg-base-200 border-2 border-base-300/30 rounded-2xl
             focus:border-primary focus:ring-4 focus:ring-primary/10
             transition-all duration-300 placeholder-base-content/60 text-base-content"
            />
            {showBlogDropdown && blogQuery !== "" && (
              <ul className="absolute z-50 w-full bg-base-200 border-2 border-base-300/30 rounded-2xl mt-2 max-h-60 overflow-y-auto shadow-xl backdrop-blur-xl">
                {blogStatus === "loading" ? (
                  <li className="p-4 text-center text-base-content/60">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                      <span className="text-sm">Loading blogs...</span>
                    </div>
                  </li>
                ) : blogs.length > 0 ? (
                  blogs.map((blog) => (
                    <li
                      key={blog.key}
                      tabIndex={0}
                      onClick={() =>
                        handleBlogSelect(blog.id, blog.name || blog.id)
                      }
                      className="p-4 hover:bg-primary/10 cursor-pointer border-b border-base-300/30 last:border-b-0 transition-all duration-200">
                      <div className="font-semibold text-base-content mb-1">
                        {blog.name || blog.key}
                      </div>
                      {blog.description && (
                        <div className="text-sm text-base-content/60 truncate">
                          {truncateText(stripHtml(blog.description), 16)}
                        </div>
                      )}
                    </li>
                  ))
                ) : (
                  <li className="p-4 text-center text-base-content/60 text-sm">
                    {blogQuery
                      ? "No blogs found"
                      : "Start typing to search blogs"}
                  </li>
                )}
              </ul>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 mt-10">
            <button
              type="button"
              onClick={() => {
                setBannerInputs([]);
                setSelectedBlogId("");
                setBlogQuery("");
              }}
              className="w-full sm:w-auto px-6 py-3 bg-base-200 hover:bg-base-300 text-base-content font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Clear All
            </button>
            <button
              onClick={handleSubmit}
              disabled={bannerInputs.length === 0 || status === "loading"}
              className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primary/90 disabled:bg-base-300 text-primary-content font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-sm backdrop-blur-sm shadow-primary/25 hover:shadow-sm hover:shadow-primary/40 disabled:shadow-none active:scale-95 disabled:cursor-not-allowed">
              {status === "loading" ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-content border-t-transparent"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Upload Banners
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      {showPreview && (
        <div
          className={`${
            isInModal ? "absolute inset-0" : "fixed inset-0 -top-6"
          } bg-black z-50 flex items-center justify-center transition-opacity duration-300 opacity-100`}
          onClick={handlePreviewClose}
          style={{ zIndex: 9999 }}>
          <button
            onClick={handlePreviewClose}
            className="absolute top-4 right-4 sm:top-8 sm:right-8 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 sm:p-4 transition-all duration-300 hover:scale-110 border border-white/20 backdrop-blur-md z-10 group">
            <X className="w-6 h-6 sm:w-7 sm:h-7" />
            <span className="absolute -bottom-12 right-0 bg-white/90 text-gray-900 px-3 py-1 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              ESC untuk tutup
            </span>
          </button>
          <div
            className="relative w-full h-full flex items-center justify-center p-4 sm:p-8 transition-all duration-500"
            onClick={(e) => e.stopPropagation()}>
            {currentPreview ? (
              <img
                src={currentPreview}
                alt="Preview"
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl transition-all duration-500 scale-100 opacity-100"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-[60vh] bg-white/5 text-white/60 rounded-3xl border border-white/10">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-lg">No image available</p>
                </div>
              </div>
            )}
            {bannerInputs.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewPrev();
                  }}
                  className="absolute left-4 sm:left-8 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full p-4 sm:p-5 transition-all duration-300 hover:scale-110 border border-white/20 backdrop-blur-md">
                  <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewNext();
                  }}
                  className="absolute right-4 sm:right-8 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full p-4 sm:p-5 transition-all duration-300 hover:scale-110 border border-white/20 backdrop-blur-md">
                  <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
              </>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 sm:p-8 transition-all duration-500">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg sm:text-xl mb-2">
                    Preview Image {previewIndex + 1}
                  </h3>
                  {bannerInputs.length > 1 && (
                    <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm">
                      <span className="bg-white/10 px-3 py-1 rounded-full font-medium">
                        {previewIndex + 1} / {bannerInputs.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const stripHtml = (html) => {
  if (!html) return "";
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
};

// Banner Modal Component
const BannerModal = ({ selectedData, onClose, uniqueDatas }) => {
  const dispatch = useDispatch();
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedBlogId, setSelectedBlogId] = useState("");
  const [blogQuery, setBlogQuery] = useState("");
  const [showBlogDropdown, setShowBlogDropdown] = useState(false);
  const [blogBanners, setBlogBanners] = useState([]);
  const [isLoadingBanners, setIsLoadingBanners] = useState(true);
  const dropdownRef = useRef(null);
  const { status: updateStatus } = useSelector((state) => state.banners);
  const blogs = useSelector((state) => state.blogs.blogs);
  const blogStatus = useSelector((state) => state.blogs.status);

  // Definisikan debouncedSearch dan getBlogId terlebih dahulu
  const debouncedSearch = useMemo(
    () =>
      debounce((q) => {
        if (blogQuery !== "" && q.length > 0) {
          dispatch(
            fetchBlogs({
              page: 1,
              perPage: 10,
              searchQuery: q,
              loadMore: false,
            })
          );
        } else {
          dispatch(fetchBlogs({ page: 1, perPage: 10, loadMore: false }));
        }
      }, 300),
    [dispatch, blogQuery]
  );

  const getBlogId = useCallback((banner) => {
    return banner?.blog_id ?? banner?.blog?.id ?? null;
  }, []);

  // Fetch banners dari server berdasarkan blog_id
  useEffect(() => {
    if (!selectedData) return;
    setIsVisible(true);
    setIsLoadingBanners(true);

    const fetchBlogBanners = async () => {
      try {
        let bannersList = uniqueDatas || [];
        let index = -1;

        if (selectedData.id) {
          index = bannersList.findIndex((b) => b.id === selectedData.id);
        } else if (selectedData.image_data) {
          index = bannersList.findIndex(
            (b) => b.image_data === selectedData.image_data
          );
        }

        if (index !== -1) {
          bannersList.sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
          setBlogBanners(bannersList);
          setCurrentIndex(index);
          setIsLoadingBanners(false);
          return;
        }

        const key = selectedData.id || selectedData.image_data;
        const result = await dispatch(fetchBanner(key)).unwrap();

        if (result) {
          setBlogBanners([result]);
          setCurrentIndex(0);
          setIsLoadingBanners(false);
          return;
        }
      } catch (err) {
        console.error("Failed to fetch blog banners:", err);
        setBlogBanners([selectedData]);
        setCurrentIndex(0);
      } finally {
        setIsLoadingBanners(false);
      }
    };

    fetchBlogBanners();
  }, [selectedData, dispatch, uniqueDatas]);

  const currentBanner =
    blogBanners.length > 0 ? blogBanners[currentIndex] : selectedData;
  // Update blog selection when current banner changes
  useEffect(() => {
    if (currentBanner) {
      const blogId = getBlogId(currentBanner);
      const blogName = currentBanner?.blog?.name || "";
      setSelectedBlogId(blogId);
      setBlogQuery(blogName);
    }
  }, [currentIndex, blogBanners, currentBanner, getBlogId]);

  // Update URL with preview image
  useEffect(() => {
    if (isVisible && currentBanner && currentBanner.image_data) {
      const url = new URL(window.location.href);
      url.searchParams.set("previewImg", currentBanner.image_data);
      window.history.pushState({}, "", url.toString());
    }
  }, [isVisible, currentIndex, currentBanner]);

  // Handle keyboard navigation - PINDAHKAN KE BAWAH setelah debouncedSearch didefinisikan
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showEditForm) {
          setShowEditForm(false);
        } else {
          handleClose();
        }
      } else if (
        e.key === "ArrowLeft" &&
        blogBanners.length > 1 &&
        !showEditForm
      ) {
        handlePrev();
      } else if (
        e.key === "ArrowRight" &&
        blogBanners.length > 1 &&
        !showEditForm
      ) {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      debouncedSearch.cancel();
    };
  }, [blogBanners.length, showEditForm, debouncedSearch]); // Sekarang debouncedSearch sudah tersedia

  const hasMultipleBanners = blogBanners.length > 1;

  // Update blog selection when current banner changes
  useEffect(() => {
    if (currentBanner) {
      const blogId = getBlogId(currentBanner);
      const blogName = currentBanner?.blog?.name || "";
      setSelectedBlogId(blogId);
      setBlogQuery(blogName);
    }
  }, [currentIndex, blogBanners, currentBanner, getBlogId]);

  // Update URL with preview image
  useEffect(() => {
    if (isVisible && currentBanner && currentBanner.image_data) {
      const url = new URL(window.location.href);
      url.searchParams.set("previewImg", currentBanner.image_data);
      window.history.pushState({}, "", url.toString());
    }
  }, [isVisible, currentIndex, currentBanner]);

  const handleClose = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("previewImg");
    window.history.pushState({}, "", url.toString());
    setIsVisible(false);
    setShowEditForm(false);
    setTimeout(onClose, 300);
  };

  const handlePrev = () => {
    if (blogBanners.length === 0) return;
    setCurrentIndex((prev) => {
      const newIndex = prev > 0 ? prev - 1 : blogBanners.length - 1;
      return newIndex;
    });
    setShowEditForm(false);
  };

  const handleNext = () => {
    if (blogBanners.length === 0) return;
    setCurrentIndex((prev) => {
      const newIndex = prev < blogBanners.length - 1 ? prev + 1 : 0;
      return newIndex;
    });
    setShowEditForm(false);
  };

  const handleShare = async (currentBanner) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentBanner.key || "Banner",
          text: `Check out this banner: ${currentBanner.key || "Banner"}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleBlogQueryChange = (e) => {
    const value = e.target.value;
    setBlogQuery(value);
    setShowBlogDropdown(value !== "");
    if (value === "") {
      setSelectedBlogId("");
    }
    debouncedSearch(value);
  };

  const handleBlogSelect = (blogId, blogName) => {
    setSelectedBlogId(blogId);
    setBlogQuery(blogName);
    setShowBlogDropdown(false);
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!currentBanner) {
      toast.error("No banner selected");
      return;
    }
    setIsLoadingBanners(true);
    const formData = new FormData();
    if (selectedBlogId && selectedBlogId !== "") {
      formData.append("blog_id", selectedBlogId);
    } else {
      formData.append("blog_id", "");
    }
    try {
      const result = await dispatch(
        updateBanner({ bannerId: currentBanner.id, bannerData: formData })
      ).unwrap();
      toast.success("Banner updated successfully!");
      setShowEditForm(false);

      // Update local state tanpa fetch ulang
      const updatedBanner = result;
      setBlogBanners((prev) =>
        prev.map((banner) =>
          banner.id === currentBanner.id ? updatedBanner : banner
        )
      );
    } catch (err) {
      console.error("Update failed:", err);
      toast.error(err.message || "Failed to update banner");
    } finally {
      setIsLoadingBanners(false);
    }
  };

  const formatDateLocal = (dateString) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!selectedData) return null;

  return (
    <div
      className={`fixed inset-0 bg-black z-50 -top-6 flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
      style={{ zIndex: 9999 }}>
      {/* Close Button */}
      {!showEditForm && (
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 sm:top-8 sm:right-8 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 sm:p-4 transition-all duration-300 hover:scale-110 border border-white/20 backdrop-blur-md z-10 group">
          <X className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="absolute -bottom-12 right-0 bg-white/90 text-gray-900 px-3 py-1 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            ESC untuk tutup
          </span>
        </button>
      )}

      {/* Image Container */}
      <div
        className={`relative w-full h-full flex items-center justify-center transition-all duration-500 ${
          showEditForm ? "pr-0 md:pr-[500px]" : "p-4 sm:p-8"
        }`}
        onClick={(e) => e.stopPropagation()}>
        {isLoadingBanners ? (
          <CircularLoader />
        ) : currentBanner.image_data ? (
          <img
            src={currentBanner.image_data}
            alt={currentBanner.key}
            className={`max-w-full max-h-full w-auto h-auto object-contain rounded-xl transition-all duration-500 ${
              isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
            } ${showEditForm ? "max-w-[calc(100%-520px)]" : ""}`}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-[60vh] bg-white/5 text-white/60 rounded-3xl border border-white/10">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-lg">No image available</p>
            </div>
          </div>
        )}

        {/* Navigation Arrows */}
        {hasMultipleBanners && !showEditForm && !isLoadingBanners && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-4 sm:left-8 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full p-4 sm:p-5 transition-all duration-300 hover:scale-110 border border-white/20 backdrop-blur-md">
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 sm:right-8 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full p-4 sm:p-5 transition-all duration-300 hover:scale-110 border border-white/20 backdrop-blur-md">
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          </>
        )}
      </div>

      {/* Edit Form Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-base-100 dark:bg-base-200 shadow-xl transform transition-transform duration-500 ease-in-out overflow-y-auto ${
          showEditForm ? "translate-x-0 z-[10000]" : "translate-x-full z-[9999]"
        }`}
        onClick={(e) => e.stopPropagation()}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-base-300/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-xl">
                <Edit2 className="w-5 h-5 text-info" />
              </div>
              <h3 className="text-xl font-bold text-base-content">
                Edit Banner
              </h3>
            </div>
            <button
              onClick={() => setShowEditForm(false)}
              className="p-2 hover:bg-base-200 rounded-xl transition-all duration-200">
              <X className="w-5 h-5 text-base-content/60" />
            </button>
          </div>

          <form onSubmit={handleSubmitEdit} className="space-y-6">
            {/* Banner Preview */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-base-content/60">
                Current Banner
              </label>
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-base-200 border border-base-300">
                {currentBanner.image_data ? (
                  <img
                    src={currentBanner.image_data}
                    alt={currentBanner.key}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-base-content/40">
                    No image
                  </div>
                )}
              </div>
            </div>

            {/* Blog Selection */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-bold text-base-content/60 mb-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Linked Blog{" "}
                <span className="text-xs text-base-content/60 font-normal">
                  (Optional)
                </span>
              </label>
              <input
                type="text"
                value={blogQuery}
                onChange={handleBlogQueryChange}
                onFocus={() => setShowBlogDropdown(true)}
                onBlur={(e) => {
                  if (
                    dropdownRef.current &&
                    !dropdownRef.current.contains(e.relatedTarget)
                  ) {
                    setShowBlogDropdown(false);
                  }
                }}
                placeholder="Search for a blog..."
                className="w-full px-5 py-3.5 bg-base-200 border-2 border-base-300/30 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 placeholder-base-content/60 text-base-content"
              />
              {showBlogDropdown && blogQuery !== "" && (
                <ul className="absolute z-50 w-full bg-base-200 border-2 border-base-300/30 rounded-2xl mt-2 max-h-60 overflow-y-auto shadow-xl backdrop-blur-xl">
                  {blogStatus === "loading" ? (
                    <li className="p-4 text-center text-base-content/60">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                        <span className="text-sm">Loading blogs...</span>
                      </div>
                    </li>
                  ) : blogs.length > 0 ? (
                    blogs.map((blog) => (
                      <li
                        key={blog.key}
                        tabIndex={0}
                        onClick={() =>
                          handleBlogSelect(blog.id, blog.name || blog.id)
                        }
                        className="p-4 hover:bg-primary/10 cursor-pointer border-b border-base-300/30 last:border-b-0 transition-all duration-200">
                        <div className="font-semibold text-base-content mb-1">
                          {blog.name || blog.key}
                        </div>
                        {blog.description && (
                          <div className="text-sm text-base-content/60 truncate">
                            {truncateText(stripHtml(blog.description), 16)}
                          </div>
                        )}
                      </li>
                    ))
                  ) : (
                    <li className="p-4 text-center text-base-content/60 text-sm">
                      {blogQuery
                        ? "No blogs found"
                        : "Start typing to search blogs"}
                    </li>
                  )}
                </ul>
              )}
            </div>

            {/* Banner Info */}
            <div className="space-y-3 p-4 bg-base-200 rounded-2xl">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-base-content/60" />
                <span className="text-base-content/60">Created:</span>
                <span className="font-medium text-base-content">
                  {formatDateLocal(currentBanner.created_at)}
                </span>
              </div>
              {currentBanner.blog && currentBanner.blog.id && (
                <div className="flex items-center gap-2 text-sm">
                  <svg
                    className="w-4 h-4 text-base-content/60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span className="text-base-content/60">Current Blog:</span>
                  <span className="font-medium text-base-content">
                    {currentBanner.blog.name || "Unnamed Blog"}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                disabled={updateStatus === "loading"}
                className="w-full px-8 py-3 bg-primary hover:bg-primary/90 disabled:bg-base-300 text-primary-content font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-sm backdrop-blur-sm shadow-primary/25 hover:shadow-sm hover:shadow-primary/40 disabled:shadow-none active:scale-95 disabled:cursor-not-allowed">
                {updateStatus === "loading" ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-content border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                className="w-full px-6 py-3 bg-base-200 hover:bg-base-300 text-base-content font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom Info Bar */}
      {!isLoadingBanners && (
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 sm:p-8 transition-all duration-500 ${
            showEditForm ? "md:right-[500px]" : "right-0"
          }`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg sm:text-xl mb-2">
                  {currentBanner.key || "Banner"}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm">
                  {currentBanner.created_at && (
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDateLocal(currentBanner.created_at)}
                    </span>
                  )}
                  {currentBanner.blog && currentBanner.blog.id && (
                    <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      {currentBanner.blog.name || "Unnamed Blog"}
                    </span>
                  )}
                  {hasMultipleBanners && (
                    <span className="bg-white/10 px-3 py-1 rounded-full font-medium">
                      {currentIndex + 1} / {blogBanners.length}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditForm(!showEditForm);
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-300 flex items-center gap-2 font-medium border border-white/20 backdrop-blur-md hover:scale-105">
                  <Edit2 className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {showEditForm ? "Close" : "Edit"}
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(currentBanner);
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-300 flex items-center gap-2 font-medium border border-white/20 backdrop-blur-md hover:scale-105">
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Modal Create Component
const BannerModalCreate = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed inset-0 -top-6 flex items-center justify-center backdrop-blur-xl bg-black/50 transition-all duration-300 p-4 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
      style={{ zIndex: 9999 }}>
      <div
        className={`w-full max-w-2xl bg-base-100 rounded-3xl shadow-xl transition-all duration-300 max-h-[90vh] overflow-y-auto relative ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b-2 border-base-300/30 bg-base-100 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-2xl shadow-sm backdrop-blur-sm shadow-primary/25">
              <svg
                className="w-6 h-6 text-primary-content"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-primary">
              Create New Banner
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-base-200 rounded-xl transition-all duration-200 active:scale-95">
            <svg
              className="w-6 h-6 text-base-content/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <BannerCreateForm handleClose={handleClose} isInModal={true} />
        </div>
      </div>
    </div>
  );
};

// Main Banner Page Component with State Persistence
export default function BannerPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { banners, status, totalPages, page } = useSelector(
    (state) => state.banners
  );

  // ============================================
  // STATE PERSISTENCE - Restore dari sessionStorage
  // ============================================
  const [selectedData, setSelectedData] = useState(null);
  const [sortConfig, setSortConfig] = useState(() => {
    const saved = sessionStorage.getItem("bannerPage_sortConfig");
    return saved ? JSON.parse(saved) : { key: "created_at", direction: "desc" };
  });
  const [selectedDatas, setSelectedDatas] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const isFetchingRef = useRef(false);
  const observerRef = useRef(null);
  const loadMoreTriggerRef = useRef(null);

  // ============================================
  // STATE PERSISTENCE - Simpan ke sessionStorage
  // ============================================
  useEffect(() => {
    sessionStorage.setItem("bannerPage_sortConfig", JSON.stringify(sortConfig));
  }, [sortConfig]);

  // ============================================
  // CHECK URL FOR PREVIEW IMAGE
  // ============================================
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const previewImg = urlParams.get("previewImg");
    if (previewImg) {
      setSelectedData({ image_data: previewImg });
    }
  }, []);

  // ============================================
  // INITIAL DATA LOADING - Skip jika kembali dari detail
  // ============================================
  useEffect(() => {
    const fromDetail =
      location.state?.fromDetail || location.state?.fromBannerPage;

    // Jika kembali dari detail dan sudah ada data, skip fetch
    if (fromDetail && banners.length > 0) {
      console.log("📦 Restoring banner data from Redux, skipping fetch");
      return;
    }

    // Jika belum ada data, fetch dari awal
    if (banners.length === 0) {
      console.log("🔄 Fetching fresh banner data");
      const loadInitialBanners = async () => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        try {
          await dispatch(fetchBanners({ page: 1, perPage: 10 })).unwrap();
        } catch (error) {
          toast.error(error.message || "Failed to fetch banners data.");
        } finally {
          isFetchingRef.current = false;
        }
      };
      loadInitialBanners();
    }
  }, []); // Empty dependency - hanya run sekali saat mount

  // ============================================
  // INFINITE SCROLL WITH INTERSECTION OBSERVER
  // ============================================
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (page >= totalPages || status === "loading") {
      return;
    }

    const options = {
      root: null,
      rootMargin: "200px",
      threshold: 0.1,
    };

    const handleIntersection = (entries) => {
      const [entry] = entries;

      if (
        entry.isIntersecting &&
        !isFetchingRef.current &&
        page < totalPages &&
        status !== "loading"
      ) {
        isFetchingRef.current = true;
        console.log(`🔄 Loading banner page ${page + 1}/${totalPages}`);
        dispatch(fetchBanners({ page: page + 1, perPage: 10 }));
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersection, options);

    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [dispatch, page, totalPages, status]);

  // Reset fetching flag saat status berubah
  useEffect(() => {
    if (status === "succeeded" || status === "failed") {
      isFetchingRef.current = false;
    }
  }, [status]);

  // Maintain scroll position saat kembali
  useEffect(() => {
    const fromBannerPage = location.state?.fromBannerPage;
    if (fromBannerPage) {
      console.log("🔙 Kembali dari banner page, maintain scroll");
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // ============================================
  // SORTING
  // ============================================
  const sortedDatas = useMemo(() => {
    let sortableDatas = [...banners];
    if (sortConfig.key) {
      sortableDatas.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    } else {
      sortableDatas.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
    }
    return sortableDatas;
  }, [banners, sortConfig]);

  const uniqueDatas = useMemo(() => {
    const seen = {};
    return sortedDatas.filter((data) => {
      if (!data || seen[data.id]) return false;
      seen[data.id] = true;
      return true;
    });
  }, [sortedDatas]);

  const requestSort = (key) => {
    setSortConfig((prevSortConfig) => ({
      key,
      direction:
        prevSortConfig.key === key && prevSortConfig.direction === "desc"
          ? "asc"
          : "desc",
    }));
  };

  const handlePreviewData = (data) => setSelectedData(data);
  const handleDeleteSingle = (dataId) => handleDeleteData(dispatch, dataId);
  const handleDeleteMultiple = () =>
    handleDelete(dispatch, selectedDatas, setSelectedDatas);

  const isMobile = useIsMobile();
  const hasMore = page < totalPages;

  return (
    <div className="space-y-6 min-h-[90vh] min-w-screen overflow-hidden">
      <div className="bg-base-100 dark:bg-base-200 border-2 border-base-300/30 rounded-3xl backdrop-blur-sm p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start md:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-primary">
                  image
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-base-content">
                  Gallery Management
                </h1>
                <p className="text-base-content/60">
                  Manage your promotional banners and visual content
                  {banners.length > 0 && (
                    <span className="ml-2 text-xs">
                      ({banners.length} banners loaded)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-base-100 dark:bg-base-200 rounded-2xl shadow-sm backdrop-blur-sm border border-base-300/30 p-5 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <svg
                    className="w-5 h-5 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-base-content/60">
                  Total
                </span>
              </div>
              <div className="text-3xl font-black text-primary">
                {uniqueDatas.length}
              </div>
            </div>

            <div className="bg-base-100 dark:bg-base-200 rounded-2xl shadow-sm backdrop-blur-sm border border-base-300/30 p-5 hover:shadow-sm transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-success/10 rounded-xl">
                  <svg
                    className="w-5 h-5 text-success"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-base-content/60">
                  Active
                </span>
              </div>
              <div className="text-3xl font-black text-success">
                {uniqueDatas.filter((d) => d.status === "active").length}
              </div>
            </div>

            <div className="bg-base-100 dark:bg-base-200 rounded-2xl shadow-sm backdrop-blur-sm border border-base-300/30 p-5 hover:shadow-sm transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-info/10 rounded-xl">
                  <svg
                    className="w-5 h-5 text-info"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-base-content/60">
                  Recent
                </span>
              </div>
              <div className="text-3xl font-black text-info">
                {
                  uniqueDatas.filter((d) => {
                    const daysDiff =
                      (new Date() - new Date(d.created_at)) /
                      (1000 * 60 * 60 * 24);
                    return daysDiff <= 7;
                  }).length
                }
              </div>
              <div className="text-xs text-base-content/60 mt-1">
                Last 7 days
              </div>
            </div>

            <div className="bg-base-100 dark:bg-base-200 rounded-2xl shadow-sm backdrop-blur-sm border border-base-300/30 p-5 hover:shadow-sm transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent/10 rounded-xl">
                  <svg
                    className="w-5 h-5 text-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-base-content/60">
                  Linked
                </span>
              </div>
              <div className="text-3xl font-black text-accent">
                {uniqueDatas.filter((d) => d.blog).length}
              </div>
              <div className="text-xs text-base-content/60 mt-1">
                With blogs
              </div>
            </div>
          </div>

          {status === "loading" && page === 1 && <CircularLoader />}

          <BannerList
            banners={uniqueDatas}
            status={status}
            sortConfig={sortConfig}
            requestSort={requestSort}
            handlePreviewData={handlePreviewData}
            handleDeleteData={handleDeleteSingle}
            handleDelete={handleDeleteMultiple}
            formatDate={formatDate}
            selectedDatas={selectedDatas}
            setSelectedDatas={setSelectedDatas}
          />

          {/* Infinite Scroll Trigger */}
          {hasMore && (
            <div
              ref={loadMoreTriggerRef}
              className="py-8 flex items-center justify-center">
              {status === "loading" ? (
                <div className="flex items-center gap-3 text-base-content/60">
                  <div className="loading loading-spinner loading-md text-primary"></div>
                  <span className="font-medium">Loading more banners...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-base-content/60">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg text-primary animate-pulse">
                      more_horiz
                    </span>
                  </div>
                  <span className="font-medium">Scroll for more content</span>
                </div>
              )}
            </div>
          )}

          {/* End of list message */}
          {!hasMore && uniqueDatas.length > 0 && (
            <div className="py-8 flex items-center justify-center">
              <div className="flex items-center gap-3 text-base-content/60">
                <span className="material-symbols-outlined text-lg">
                  check_circle
                </span>
                <span className="font-medium">No more banners to load</span>
              </div>
            </div>
          )}
        </div>

        {!isMobile && (
          <div className="lg:col-span-4">
            <div className="sticky top-6">
              <BannerCreateForm />
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <button
          onClick={() => setModalOpen(true)}
          className="fixed bottom-32 right-3 w-12 h-12 bg-primary text-primary-content rounded-2xl transition-all duration-300 hover:scale-110 active:scale-95 z-50 flex items-center justify-center shadow-lg shadow-primary/25">
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>
      )}

      {/* Modals */}
      {modalOpen && <BannerModalCreate onClose={() => setModalOpen(false)} />}
      {selectedData && (
        <BannerModal
          uniqueDatas={uniqueDatas}
          selectedData={selectedData}
          onClose={() => setSelectedData(null)}
        />
      )}
    </div>
  );
}
