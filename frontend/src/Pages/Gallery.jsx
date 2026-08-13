import {
  Calendar,
  Eye,
  Image as ImageIcon,
  Search,
  Share2,
  X,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Filter,
  Tag,
  ExternalLink,
} from "lucide-react";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchBanners } from "../features/LandingPages/bannerSlice";
import { truncateTextWords } from "../Context/__useTruncate";
import { HeroSection } from "./Components/HeroSection";

// Utility to strip HTML
const stripHtml = (html) => {
  if (!html) return "";
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
};

// Gallery Card Component
const GalleryCard = ({ image, onImageClick }) => {
  const getCategoryDisplayText = (image) => {
    if (!image.blog?.categories?.length) return "Gallery";
    const categories = image.blog.categories;
    return categories.length === 1
      ? truncateTextWords(categories[0].name, 2)
      : `${truncateTextWords(categories[0].name, 2)} +${categories.length - 1}`;
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div
      onClick={() => onImageClick(image)}
      className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 h-full flex flex-col">
      <div className="aspect-square overflow-hidden bg-gray-200">
        <img
          src={image.url}
          alt={image.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop";
          }}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-sm sm:text-base mb-2 line-clamp-2">
            {image.title}
          </h3>
          <div className="flex items-center justify-between text-white/90 text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{formatDate(image.date)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-3 left-3">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
          <Tag className="w-3 h-3" />
          {getCategoryDisplayText(image)}
        </span>
      </div>

      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigator.share
              ? navigator
                  .share({
                    title: image.title,
                    text: `Lihat foto ini: ${image.title}`,
                    url: window.location.href,
                  })
                  .catch(console.log)
              : navigator.clipboard
                  .writeText(window.location.href)
                  .then(() => alert("Link disalin ke clipboard!"));
          }}
          className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors duration-200 shadow-lg">
          <Share2 className="w-4 h-4 text-gray-700" />
        </button>
      </div>
    </div>
  );
};

// Main Gallery Component
export const Gallery = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { banners, status, totalPages, page, total } = useSelector(
    (state) => state.banners
  );
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [modalImagesList, setModalImagesList] = useState([]);

  // Restore from sessionStorage
  const [searchTerm, setSearchTerm] = useState(() => {
    return sessionStorage.getItem("gallerySearchTerm") || "";
  });
  const [activeFilter, setActiveFilter] = useState(() => {
    return sessionStorage.getItem("galleryActiveFilter") || "all";
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isAutoLoading, setIsAutoLoading] = useState(false);

  const galleryRef = useRef(null);
  const isFetchingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Save state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("gallerySearchTerm", searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    sessionStorage.setItem("galleryActiveFilter", activeFilter);
  }, [activeFilter]);

  // Fetch initial banners - ONLY IF NO DATA EXISTS
  // =======================
  // INITIAL FETCH (cached-aware)
  // =======================
  useEffect(() => {
    if (hasInitializedRef.current) return;

    const hasCachedData = banners && banners.length > 0;

    if (hasCachedData) {
      console.log("✅ Using cached gallery data, skipping fetch");
      hasInitializedRef.current = true;
      return;
    }

    if (status === "idle") {
      console.log("🔄 Initial fetch - no cached gallery data found");
      hasInitializedRef.current = true;
      dispatch(fetchBanners({ page: 1, perPage: 10 }));
    }
  }, [dispatch, status, banners]);

  // =======================
  // RESTORE SCROLL
  // =======================
  const isRestoringScrollRef = useRef(false);

  // Hooks & refs
  const rafRef = useRef(null);
  const STORAGE_KEY = "galleryScrollPosition";

  // 1) Restore dengan aman setelah banners siap
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved || banners.length === 0) return;

      const pos = parseInt(saved, 10);
      if (Number.isNaN(pos)) return;

      isRestoringScrollRef.current = true;

      // Gunakan "auto" bukan "instant"
      window.scrollTo({ top: pos, behavior: "auto" });

      // Lepaskan flag pada frame berikutnya
      requestAnimationFrame(() => {
        isRestoringScrollRef.current = false;
        console.log("[scroll] restored to", pos);
      });
    } catch (err) {
      console.warn("[scroll] restore failed:", err);
    }
  }, [banners.length]); // trigger ketika jumlah banners berubah

  // 2) Save on scroll (raf throttle) + juga save on visibilitychange & beforeunload
  useEffect(() => {
    let ticking = false;

    const savePos = (y) => {
      try {
        sessionStorage.setItem(STORAGE_KEY, String(y));
      } catch (err) {
        console.warn("[scroll] save failed:", err);
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      // throttle via requestAnimationFrame
      rafRef.current = requestAnimationFrame(() => {
        // jika sedang restore, skip saving (opsional)
        if (!isRestoringScrollRef.current) {
          // gunakan pageYOffset (lebih luas kompatibilitas)
          const y = window.pageYOffset ?? window.scrollY ?? 0;
          savePos(y);
          // update local state if needed
        }
        ticking = false;
      });
    };

    const onVisibility = () => {
      // save when tab hidden
      const y = window.pageYOffset ?? window.scrollY ?? 0;
      savePos(y);
      console.log("[scroll] saved on visibilitychange:", y);
    };

    const onBeforeUnload = () => {
      const y = window.pageYOffset ?? window.scrollY ?? 0;
      savePos(y);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // 3) IntersectionObserver tetap seperti semula (opsional)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsGalleryVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    if (galleryRef.current) observer.observe(galleryRef.current);

    return () => observer.disconnect();
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (
      page >= totalPages ||
      isFetchingRef.current ||
      status === "loading" ||
      isLoadingMore
    ) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoadingMore(true);

    try {
      await dispatch(fetchBanners({ page: page + 1, perPage: 10 })).unwrap();
    } catch (error) {
      console.error("Error loading more images:", error);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [dispatch, page, totalPages, status, isLoadingMore]);

  const transformedBanners = useMemo(
    () =>
      banners.map((image) => ({
        ...image,
        title: image.blog?.name || "Gambar Galeri",
        date: image.created_at,
        views: 0,
        url: image.image_data,
      })),
    [banners]
  );

  const filters = useMemo(() => {
    const categoryCounts = {};
    const total = transformedBanners.length;

    const generalCount = transformedBanners.filter(
      (image) =>
        !image.blog ||
        !image.blog.categories ||
        image.blog.categories.length === 0
    ).length;

    transformedBanners.forEach((image) => {
      if (image.blog && Array.isArray(image.blog.categories)) {
        image.blog.categories.forEach((cat) => {
          if (!cat || !cat.name) return;
          const catName = cat.name.toLowerCase();
          if (!categoryCounts[catName]) {
            categoryCounts[catName] = { name: cat.name, count: 0 };
          }
          categoryCounts[catName].count++;
        });
      }
    });

    const categoryFilters = Object.values(categoryCounts).map((cat) => ({
      id: cat.name.toLowerCase(),
      label: cat.name,
      count: cat.count,
    }));

    const filters = [
      { id: "all", label: "Semua Foto", count: total },
      ...(generalCount > 0
        ? [{ id: "general", label: "Foto Umum", count: generalCount }]
        : []),
      ...categoryFilters,
    ];

    return filters;
  }, [transformedBanners]);

  const filteredImages = useMemo(() => {
    return transformedBanners.filter((image) => {
      const hasCategories =
        image.blog &&
        Array.isArray(image.blog.categories) &&
        image.blog.categories.length > 0;

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "general" && (!image.blog || !hasCategories)) ||
        (hasCategories &&
          image.blog.categories.some(
            (cat) => cat.name?.toLowerCase() === activeFilter
          ));

      const titleMatch = image.title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const descMatch = stripHtml(image.blog?.description || "")
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesSearch = titleMatch || descMatch;

      return matchesFilter && matchesSearch;
    });
  }, [transformedBanners, activeFilter, searchTerm]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const previewImgId = searchParams.get("previewImg");

    if (previewImgId) {
      const imageId = parseInt(previewImgId, 10);

      const imageIndex = filteredImages.findIndex((img) => img.id === imageId);

      if (imageIndex !== -1) {
        const image = filteredImages[imageIndex];
        setSelectedImage(image);
        setModalImagesList(filteredImages);
        setSelectedImageIndex(imageIndex);
      } else {
        const fallbackIndex = transformedBanners.findIndex(
          (img) => img.id === imageId
        );
        if (fallbackIndex !== -1) {
          const image = transformedBanners[fallbackIndex];
          setSelectedImage(image);
          setModalImagesList([image]);
          setSelectedImageIndex(0);
        } else if (
          page < totalPages &&
          !isLoadingMore &&
          !isFetchingRef.current
        ) {
          handleLoadMore();
        }
      }
    } else {
      setSelectedImage(null);
      setSelectedImageIndex(0);
      setModalImagesList([]);
    }
  }, [
    location.search,
    filteredImages,
    transformedBanners,
    page,
    totalPages,
    isLoadingMore,
    handleLoadMore,
  ]);

  // Handle image click
  const handleImageClick = useCallback(
    (image) => {
      sessionStorage.setItem(
        "galleryScrollPosition",
        window.scrollY.toString()
      );
      setSelectedImage(image);
      setModalImagesList(filteredImages);
      setSelectedImageIndex(
        filteredImages.findIndex((img) => img.id === image.id)
      );
      const newParams = new URLSearchParams(location.search);
      newParams.set("previewImg", image.id);
      navigate({ search: `?${newParams.toString()}` });
    },
    [navigate, location.search, filteredImages]
  );

  const handleCloseModal = useCallback(() => {
    setSelectedImage(null);
    setSelectedImageIndex(0);
    setModalImagesList([]);
    const newParams = new URLSearchParams(location.search);
    newParams.delete("previewImg");
    navigate({
      search: newParams.toString() ? `?${newParams.toString()}` : "",
    });
  }, [navigate, location.search]);

  const handlePrevImage = useCallback(() => {
    let newIndex =
      selectedImageIndex === 0
        ? modalImagesList.length - 1
        : selectedImageIndex - 1;
    const newImage = modalImagesList[newIndex];
    setSelectedImage(newImage);
    setSelectedImageIndex(newIndex);
    const newParams = new URLSearchParams(location.search);
    newParams.set("previewImg", newImage.id);
    navigate({ search: `?${newParams.toString()}` });
  }, [selectedImageIndex, modalImagesList, navigate, location.search]);

  const handleNextImage = useCallback(async () => {
    let newIndex = selectedImageIndex + 1;

    if (
      newIndex >= modalImagesList.length - 3 &&
      page < totalPages &&
      !isAutoLoading &&
      !isLoadingMore
    ) {
      handleLoadMore();
    }

    if (newIndex >= modalImagesList.length) {
      if (isAutoLoading || isLoadingMore) {
        return;
      } else if (page < totalPages) {
        setIsAutoLoading(true);
        try {
          await handleLoadMore();
        } catch (error) {
          console.error("Auto load more failed:", error);
          const firstImage = modalImagesList[0];
          setSelectedImage(firstImage);
          setSelectedImageIndex(0);
          const newParams = new URLSearchParams(location.search);
          newParams.set("previewImg", firstImage.id);
          navigate({ search: `?${newParams.toString()}` });
        } finally {
          setIsAutoLoading(false);
        }
        return;
      } else {
        newIndex = 0;
      }
    }

    const newImage = modalImagesList[newIndex];
    setSelectedImage(newImage);
    setSelectedImageIndex(newIndex);
    const newParams = new URLSearchParams(location.search);
    newParams.set("previewImg", newImage.id);
    navigate({ search: `?${newParams.toString()}` });
  }, [
    selectedImageIndex,
    modalImagesList,
    navigate,
    location.search,
    page,
    totalPages,
    isAutoLoading,
    isLoadingMore,
    handleLoadMore,
  ]);

  useEffect(() => {
    if (selectedImage && modalImagesList.length > 0 && isAutoLoading) {
      if (filteredImages.length > modalImagesList.length) {
        const oldLength = modalImagesList.length;
        setModalImagesList(filteredImages);

        const newIndex = oldLength;
        const newImage = filteredImages[newIndex];

        if (newImage) {
          setSelectedImage(newImage);
          setSelectedImageIndex(newIndex);
          const newParams = new URLSearchParams(location.search);
          newParams.set("previewImg", newImage.id);
          navigate({ search: `?${newParams.toString()}` }, { replace: true });
        }

        setIsAutoLoading(false);
      }
    }
  }, [
    filteredImages,
    selectedImage,
    modalImagesList,
    isAutoLoading,
    navigate,
    location.search,
  ]);

  const handleShare = async (image) => {
    if (navigator.share) {
      await navigator
        .share({
          title: image.title,
          text: `Lihat foto ini: ${image.title}`,
          url: window.location.href,
        })
        .catch(console.log);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link disalin ke clipboard!");
    }
  };

  const handleViewBlog = useCallback(
    (blogKey) => {
      navigate(`/blog/${blogKey}?isTop=true`);
    },
    [navigate]
  );

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // Close fullscreen with ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && selectedImage) {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedImage, handleCloseModal]);

  const hasMorePages = page < totalPages;
  const currentLoadedCount = banners.length;

  console.log(`📊 Gallery State:`, {
    loaded: banners.length,
    total: total,
    currentPage: page,
    totalPages,
    hasMore: hasMorePages,
    status,
    hasInitialized: hasInitializedRef.current,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection landingProps="gallery-page" />
      {/* Main Content */}
      <section ref={galleryRef} className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search and Filter Card */}
          <div
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 transition-all duration-1000 ease-out ${
              isGalleryVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-0 opacity-100"
            }`}>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari foto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full landing-input pl-12 pr-4 py-3 text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:border-gray-500 outline-none transition-all"
                />
              </div>

              {/* Category Dropdown */}
              <div className="relative lg:w-64">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 rounded-lg border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 text-sm text-gray-900 outline-none bg-gray-50 cursor-pointer appearance-none">
                  {filters.map((filter) => (
                    <option key={filter.id} value={filter.id}>
                      {filter.label} ({filter.count})
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Results Header */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {searchTerm || activeFilter !== "all"
                  ? `Hasil Pencarian (${filteredImages.length})`
                  : `Semua Foto (${filteredImages.length})`}
              </h2>
              {total > 0 && (
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
                  {filteredImages.length} dari {total}
                </span>
              )}
            </div>
          </div>

          {/* Loading State - Only show when no data exists */}
          {status === "loading" && filteredImages.length === 0 && (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600 font-medium">Memuat foto...</p>
            </div>
          )}

          {/* Gallery Grid */}
          {filteredImages.length > 0 && (
            <div
              className={`grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 transition-all duration-1000 ${
                isGalleryVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-0 opacity-100"
              }`}>
              {filteredImages.map((image, index) => (
                <div
                  key={image.id}
                  className={`transition-all duration-500 ${
                    isGalleryVisible
                      ? "translate-y-0 opacity-100"
                      : "translate-y-0 opacity-100"
                  }`}
                  style={{ transitionDelay: `${index * 40}ms` }}>
                  <GalleryCard
                    image={image}
                    onImageClick={() => handleImageClick(image)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {filteredImages.length === 0 && status !== "loading" && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tidak ada foto ditemukan
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                Coba ubah kata kunci pencarian atau filter kategori
              </p>
              {(searchTerm || activeFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setActiveFilter("all");
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                  Reset Filter
                </button>
              )}
            </div>
          )}

          {/* Load More Button */}
          {hasMorePages && filteredImages.length > 0 && (
            <div className="text-center mt-10">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="group bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 mx-auto">
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memuat...</span>
                  </>
                ) : (
                  <>
                    <span>Muat Lebih Banyak</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              <div className="mt-4 max-w-md mx-auto">
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gray-600 h-full transition-all duration-500"
                    style={{
                      width: `${
                        total > 0 ? (currentLoadedCount / total) * 100 : 0
                      }%`,
                    }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {currentLoadedCount} dari {total} foto dimuat (Halaman {page}{" "}
                  dari {totalPages})
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black z-50 flex items-center justify-center animate-fadeIn"
          onClick={handleCloseModal}>
          {/* Close Button */}
          <button
            onClick={handleCloseModal}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-white/10 hover:bg-white/20 text-white rounded-lg p-3 transition-all duration-300 hover:scale-105 border border-white/20 backdrop-blur-md z-10 group">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="absolute -bottom-10 right-0 bg-white/90 text-gray-900 px-2.5 py-1 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              ESC untuk tutup
            </span>
          </button>

          {/* Image Container */}
          <div
            className="relative w-full h-full flex items-center justify-center p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.url}
              alt={selectedImage.title}
              className="max-w-full max-h-full w-auto h-auto object-contain"
            />

            {/* Auto Loading Indicator */}
            {isAutoLoading && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  Memuat foto selanjutnya...
                </span>
              </div>
            )}

            {/* Navigation Arrows */}
            {modalImagesList.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  disabled={isAutoLoading}
                  className="absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-lg p-3 sm:p-4 transition-all duration-300 hover:scale-105 border border-white/20 backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  disabled={isAutoLoading}
                  className="absolute right-4 sm:right-6 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-lg p-3 sm:p-4 transition-all duration-300 hover:scale-105 border border-white/20 backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  {isAutoLoading && (
                    <div className="absolute -top-1 -right-1 w-3 h-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </div>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Bottom Info Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-5 sm:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
                <div className="flex-1">
                  <h3 className="text-white font-bold text-base sm:text-lg mb-1.5">
                    {selectedImage.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-white/70 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(selectedImage.date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      {selectedImage.views || "-"}
                    </span>
                    {modalImagesList.length > 1 && (
                      <span className="bg-white/10 px-2.5 py-1 rounded-lg font-semibold text-xs flex items-center gap-1.5">
                        {selectedImageIndex + 1} / {modalImagesList.length}
                        {isAutoLoading && (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        )}
                      </span>
                    )}
                  </div>
                  {selectedImage.blog?.description && (
                    <p className="mt-3 text-white/90 text-sm leading-relaxed max-w-2xl line-clamp-3">
                      {stripHtml(selectedImage.blog.description)}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(selectedImage);
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all duration-300 flex items-center gap-2 font-semibold text-xs border border-white/20 backdrop-blur-md hover:scale-105">
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Bagikan</span>
                  </button>
                  {selectedImage.blog && selectedImage.blog?.key !== null && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewBlog(selectedImage.blog.key);
                      }}
                      className="bg-gray-600/20 hover:bg-gray-600/30 text-gray-200 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all duration-300 flex items-center gap-2 font-semibold text-xs border border-gray-300/30 backdrop-blur-md hover:scale-105">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Lihat Artikel</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
