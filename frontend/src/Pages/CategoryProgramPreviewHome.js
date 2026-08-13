import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
// ✅ gabungan static & dynamic
import * as LucideIcons from "lucide-react"; // untuk akses dinamis: LucideIcons[dynamicName]
import {
  ArrowLeft,
  Calendar,
  Eye,
  Heart,
  Users,
  Tag,
  TreePine,
  ChevronRight,
  ArrowRight,
  Filter,
  Search,
  TrendingUp,
  Award,
  HandHeart,
  Home,
  FileText,
  Share2,
  Star,
  Play,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  AlertTriangle,
  RefreshCw,
  WifiOff,
} from "lucide-react"; // untuk akses statis

import {
  fetchCategoryEvent,
  fetchCategoryEvents,
} from "../features/event/categoryEventSlice";
import { fetchPublicEvents } from "../features/event/eventSlice";
import { CircularLoader } from "../Components/_CircularLoader";
import useScrollRestoration from "../Components/_scrollRestoration";

// Utility functions
const truncateText = (text, limit) => {
  if (!text) return "";
  const words = text.split(" ");
  return words.length > limit ? words.slice(0, limit).join(" ") + "..." : text;
};

const stripHtml = (html) => {
  if (!html) return "";
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
};

// Event Card Component
const EventCard = React.memo(({ event, onEventClick }) => {
  const primaryImage = useMemo(
    () =>
      event?.images?.find((image) => image.is_primary === 1) ||
      event?.images?.[0],
    [event?.images]
  );

  return (
    <article
      onClick={() => onEventClick(event)}
      className="group cursor-pointer bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all transform-gpu duration-300 transform hover:-translate-y-2 hover:scale-[1.02] border border-white/20 overflow-hidden h-full flex flex-col">
      {/* Image Section */}
      <div className="relative overflow-hidden h-48 flex-shrink-0">
        {primaryImage ? (
          <img
            src={`${process.env.REACT_APP_API}${primaryImage.image_data}`}
            alt={event.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              e.target.src =
                "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 via-red-100 to-yellow-100">
            <Heart className="w-8 h-8 text-orange-400" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Foundation Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30">
          <TreePine className="w-4 h-4 text-white drop-shadow-sm" />
          <span className="text-white text-xs font-semibold drop-shadow-sm">
            Enggang Foundation
          </span>
        </div>

        {/* Trending Badge */}
        {(event.views > 500 || event.featured) && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
            <TrendingUp className="w-3 h-3" />
            <span className="text-xs">
              {event.featured ? "Unggulan" : "Trending"}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-3">
          {event.categories?.slice(0, 2).map((category, index) => (
            <span
              key={category.id || index}
              className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-100/80 px-3 py-1 rounded-full border border-orange-200/50">
              <Tag className="w-3 h-3" />
              <span>{category?.name || "Program"}</span>
            </span>
          ))}
          {event.categories && event.categories.length > 2 && (
            <span className="text-xs text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
              +{event.categories.length - 2}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-orange-500 transition-colors duration-300 leading-tight">
          {event.name}
        </h3>

        {/* Description */}
        <div className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed flex-1">
          {truncateText(stripHtml(event.description), 20)}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(event.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{event.views || 0}</span>
            </div>
          </div>
          {event.status === 1 && (
            <div className="flex items-center gap-1 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs">Aktif</span>
            </div>
          )}
        </div>

        {/* Author Info */}
        {event.author && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
            {event.author.avatar ? (
              <img
                src={`${process.env.REACT_APP_API}user/images/${event.author.avatar}`}
                alt={event.author.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-orange-100"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextElementSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ display: event.author.avatar ? "none" : "flex" }}>
              {event.author.name?.charAt(0).toUpperCase() || "T"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {event.author.name || "Tim Enggang Foundation"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {event.author.role || "Program Coordinator"}
              </p>
            </div>
          </div>
        )}

        {/* Action Row */}
        <div className="flex items-center justify-between pt-2">
          <button className="group/btn flex items-center gap-2 text-orange-500 hover:text-orange-700 font-semibold text-sm transition-all transform-gpu duration-300">
            <span>Baca Detail</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
          </button>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            {event.likes > 0 && (
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>{event.likes}</span>
              </div>
            )}
            {event.comments > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{event.comments}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});
EventCard.displayName = "EventCard";

// Main Category Event Detail Component
export const CategoryProgramPreviewHome = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categoryKey } = useParams();
  const location = useLocation();

  // Redux state
  const { categoryEvent, categoryEvents } = useSelector(
    (state) => state.categoryEvents
  );
  const categoryStatus = useSelector((state) => state.categoryEvents.status);
  const categoryError = useSelector((state) => state.categoryEvents.error);

  const {
    publicEvents,
    publicStatus,
    error: eventsError,
    publicTotal,
  } = useSelector((state) => state.events);

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageExpanded, setImageExpanded] = useState(false);

  // Helper untuk ambil icon Lucide secara dinamis
  const DynamicLucideIcon = ({ iconName, className }) => {
    const IconComponent = LucideIcons[iconName];
    if (IconComponent) {
      return <IconComponent className={className} />;
    }
    // Fallback ke TreePine jika icon tidak ditemukan
    return <TreePine className={className} />;
  };
  useScrollRestoration();

  // Get category from location state if available
  const categoryFromState = location.state?.category;

  // Use category data from state or Redux
  const isLoadingEvents =
    publicStatus === "loading" && publicEvents.length === 0;

  // More robust display category logic
  const displayCategory = useMemo(() => {
    // Debug logging untuk development
    if (process.env.NODE_ENV === "development") {
      console.group("=== Category Debug ===");
      console.log("categoryKey from URL:", categoryKey);
      console.log("categoryEvent from Redux:", categoryEvent);
      console.log("categoryFromState from location:", categoryFromState);
      console.log("location.state:", location.state);
      console.groupEnd();
    }

    // 1. Prioritas pertama: Redux state yang match dengan URL
    if (
      categoryEvent &&
      (categoryEvent.key === categoryKey ||
        categoryEvent.slug === categoryKey ||
        categoryEvent.id?.toString() === categoryKey)
    ) {
      return categoryEvent;
    }

    // 2. Prioritas kedua: State dari navigation yang match
    if (
      categoryFromState &&
      (categoryFromState.key === categoryKey ||
        categoryFromState.slug === categoryKey ||
        categoryFromState.id?.toString() === categoryKey)
    ) {
      return categoryFromState;
    }

    // 3. Fallback: Gunakan data apapun yang tersedia dari navigation state
    // (karena user baru saja klik dari halaman lain)
    if (categoryFromState) {
      return categoryFromState;
    }

    // 4. Fallback: Gunakan Redux state apapun yang ada
    if (categoryEvent) {
      return categoryEvent;
    }

    // 5. No data available
    return null;
  }, [categoryEvent, categoryFromState, categoryKey]);

  const categoryHasError = categoryStatus === "failed" && !displayCategory;
  const isLoadingCategory = categoryStatus === "loading" && !displayCategory;
  const isLoading = isLoadingCategory || isLoadingEvents;

  const eventsHaveError =
    publicStatus === "failed" && publicEvents.length === 0;
  // Category images for gallery (mock data if needed)
  const categoryImages = useMemo(() => {
    if (displayCategory?.images?.length) {
      return displayCategory.images;
    }
    // Mock images for demonstration
    return [
      {
        id: 1,
        image_data:
          "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=600&fit=crop",
        is_primary: 1,
      },
      {
        id: 2,
        image_data:
          "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&h=600&fit=crop",
        is_primary: 0,
      },
      {
        id: 3,
        image_data:
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop",
        is_primary: 0,
      },
    ];
  }, [displayCategory]);

  // Effects
  // Fetch category data - Fixed: Only this effect, no buggy first one
  useEffect(() => {
    // Always fetch category data if we have a categoryKey, regardless of props
    // This ensures we have the most up-to-date data
    if (categoryKey) {
      // Check if we need to fetch category data
      const shouldFetchCategory =
        !categoryEvent ||
        categoryEvent.key !== categoryKey ||
        categoryStatus === "idle";

      if (shouldFetchCategory) {
        console.log(`Fetching category data for: ${categoryKey}`);
        dispatch(fetchCategoryEvent(categoryKey));
      }
    }
  }, [dispatch, categoryKey, categoryEvent, categoryStatus]);

  // Fetch events for this category
  useEffect(() => {
    if (categoryStatus === "idle" && categoryKey) {
      dispatch(fetchCategoryEvent(categoryKey));
      dispatch(fetchCategoryEvents({ page: 1, perPage: 6 }))
        .unwrap()
        .catch((error) =>
          console.error("Failed to fetch category events:", error)
        );
    }
  }, [dispatch, categoryStatus]);
  useEffect(() => {
    if (publicStatus === "idle") {
      dispatch(
        fetchPublicEvents({
          page: 1,
          perPage: 12,
          searchQuery: "",
          fromDate: "",
          toDate: "",
        })
      );
    }
  }, [dispatch, publicStatus]);

  // Memoized filtered and sorted events
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = publicEvents;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stripHtml(event.description)
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Sort events
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at) - new Date(a.created_at);
        case "oldest":
          return new Date(a.created_at) - new Date(b.created_at);
        case "popular":
          return (b.views || 0) - (a.views || 0);
        case "alphabetical":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return sorted;
  }, [publicEvents, searchQuery, sortBy]);

  // Event handlers
  const handleEventClick = useCallback(
    (event) => {
      navigate(`/event/${event.key}`, { state: { event } });
    },
    [navigate]
  );

  const handleImageSelect = useCallback((index) => {
    setSelectedImageIndex(index);
  }, []);

  const handlePrevImage = useCallback(() => {
    if (!categoryImages?.length) return;
    setSelectedImageIndex((prev) =>
      prev === 0 ? categoryImages.length - 1 : prev - 1
    );
  }, [categoryImages?.length]);

  const handleNextImage = useCallback(() => {
    if (!categoryImages?.length) return;
    setSelectedImageIndex((prev) =>
      prev === categoryImages.length - 1 ? 0 : prev + 1
    );
  }, [categoryImages?.length]);

  const toggleImageSize = useCallback(() => {
    setImageExpanded((prev) => !prev);
  }, []);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: displayCategory?.name,
          text: displayCategory?.description?.substring(0, 200) + "...",
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link berhasil disalin!");
    }
  }, [displayCategory]);

  const getImageUrl = useCallback((image) => {
    let url = typeof image === "string" ? image : image?.image_data;
    if (url && !url.startsWith("http")) {
      url = `${process.env.REACT_APP_API}${url}`;
    }
    return url;
  }, []);

  // Loading state
  if (isLoading) {
    return <CircularLoader />;
  }

  // Error state
  if (categoryHasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pt-10 sm:pt-0">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto">
              <div className="text-red-600 text-lg font-bold mb-4">
                Kategori tidak ditemukan
              </div>
              <p className="text-red-500 text-sm mb-6">{categoryError}</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    // Retry fetching
                    dispatch(fetchCategoryEvent(categoryKey));
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                  Coba Lagi
                </button>
                <button
                  onClick={() => navigate("/events")}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                  Kembali ke Program
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedImage = categoryImages[selectedImageIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate("/")}
                className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors">
                <Home className="w-5 h-5" />
                <span className="font-medium hidden sm:inline">Home</span>
              </button>
              <span className="text-gray-300">•</span>
              <button
                onClick={() => navigate("/events")}
                className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors">
                <FileText className="w-5 h-5" />
                <span className="font-medium hidden sm:inline">
                  Lihat Semua Events
                </span>
              </button>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Kembali</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Majoo-style design */}
      <section className="relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-200/50 rounded-full backdrop-blur-sm">
                <Star className="w-4 h-4 text-orange-600 mr-2" />
                <span className="text-orange-700 font-medium text-sm">
                  {displayCategory?.name || "Kategori Program"}
                </span>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  <span className="bg-gradient-to-r from-orange-600 via-red-600 to-yellow-600 bg-clip-text text-transparent">
                    {displayCategory?.name || "Kategori Program"}
                  </span>
                </h1>
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <TreePine className="w-5 h-5 text-orange-500" />
                  <span className="font-medium">Enggang Foundation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-500" />
                  <span className="font-medium">
                    {filteredAndSortedEvents.length} Program
                  </span>
                </div>
                <div className="flex items-center gap-2 hidden">
                  <Eye className="w-5 h-5 text-orange-500" />
                  <span className="font-medium">
                    {filteredAndSortedEvents.reduce(
                      (total, event) => total + (event.views || 0),
                      0
                    )}{" "}
                    total views
                  </span>
                </div>
              </div>

              {/* Description Preview */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 force-light">
                  <div
                    className="prose prose-lg max-w-none quill-content"
                    dangerouslySetInnerHTML={{
                      __html: displayCategory?.description,
                    }}
                  />
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() =>
                    document
                      .getElementById("programs-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="flex items-center gap-3 bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Play className="w-5 h-5" />
                  Lihat Program
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-3 bg-white/80 backdrop-blur-sm text-orange-700 px-8 py-4 rounded-2xl font-semibold border border-orange-200 hover:bg-white transition-all duration-300 hover:shadow-lg">
                  <Share2 className="w-5 h-5" />
                  Bagikan
                </button>
              </div>
            </div>

            {/* Right Content - Image Gallery */}
            <div className="relative">
              {/* Main Image */}
              {selectedImage && (
                <div className="relative group">
                  <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                    <img
                      src={getImageUrl(selectedImage)}
                      alt={displayCategory?.name}
                      className={`w-full object-cover transition-all duration-500 ${
                        imageExpanded ? "h-96" : "h-80"
                      }`}
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=600&fit=crop";
                      }}
                    />

                    {/* Overlay Controls */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {/* Image Controls */}
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button
                          onClick={toggleImageSize}
                          className="bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white rounded-full p-3 transition-all duration-200 hover:scale-110">
                          {imageExpanded ? (
                            <ZoomOut className="w-5 h-5" />
                          ) : (
                            <ZoomIn className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {/* Navigation */}
                      {categoryImages?.length > 1 && (
                        <>
                          <button
                            onClick={handlePrevImage}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white rounded-full p-3 transition-all duration-300 hover:scale-110">
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleNextImage}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white rounded-full p-3 transition-all duration-300 hover:scale-110">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}

                      {/* Counter */}
                      {categoryImages?.length > 1 && (
                        <div className="absolute bottom-4 left-4 bg-black/30 backdrop-blur-sm text-white px-4 py-2 rounded-full font-medium">
                          {selectedImageIndex + 1} / {categoryImages.length}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute -bottom-6 -right-6 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl p-4 shadow-xl backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      <div>
                        <div className="font-bold text-lg">
                          {filteredAndSortedEvents.length}
                        </div>
                        {/* <div className="text-sm opacity-90">Program</div> */}
                      </div>
                    </div>
                  </div>

                  {displayCategory && displayCategory.icon && (
                    <div className="absolute -top-6 -left-6 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-2xl p-4 shadow-xl backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        {typeof displayCategory.icon === "string" ? (
                          <DynamicLucideIcon
                            iconName={displayCategory.icon}
                            className="w-8 h-8 text-white"
                          />
                        ) : (
                          <displayCategory.icon className="w-8 h-8 text-white" />
                        )}
                        <div>
                          <div className="font-bold text-sm">
                            {displayCategory.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Thumbnail Gallery */}
              {categoryImages?.length > 1 && (
                <div className="flex gap-3 mt-4 py-4 justify-center overflow-x-auto">
                  {categoryImages.map((image, index) => (
                    <button
                      key={image.id ?? index}
                      onClick={() => handleImageSelect(index)}
                      className={`relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden transition-all duration-300 ${
                        selectedImageIndex === index
                          ? "ring-4 ring-orange-500 ring-offset-2 scale-110 shadow-lg"
                          : "hover:scale-105 opacity-70 hover:opacity-100 border-2 border-gray-200/50"
                      }`}>
                      <img
                        src={getImageUrl(image)}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=600&fit=crop";
                        }}
                      />
                      {selectedImageIndex === index && (
                        <div className="absolute inset-0 flex items-center justify-center bg-orange-600/20">
                          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-md">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section
        id="programs-section"
        className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
              <input
                type="text"
                placeholder={`Cari program lainnya ${
                  displayCategory?.name || "ini"
                }...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm text-gray-700 bg-gray-50/50 rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-300 dark:focus:border-orange-400 focus:border-orange-400  outline-none transition-all transform-gpu duration-300 placeholder-gray-400"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative w-full lg:w-auto">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full lg:w-auto pl-10 pr-8 py-3 rounded-xl border border-gray-200/50 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 text-sm text-gray-700 transition-all duration-300 appearance-none outline-none bg-gray-50/50 lg:min-w-[200px] cursor-pointer">
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="popular">Terpopuler</option>
                <option value="alphabetical">A-Z</option>
              </select>
              <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Results Header - Only show if no errors */}
          {!eventsHaveError && (
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200/50">
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {searchQuery
                  ? `Hasil Pencarian (${filteredAndSortedEvents.length})`
                  : `Semua Program (${filteredAndSortedEvents.length})`}
              </h2>
              {publicTotal > 0 && (
                <span className="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full">
                  {publicTotal} total program
                </span>
              )}
            </div>
          )}
        </div>

        {/* Events Error State */}
        {eventsHaveError && (
          <div className="text-center py-20">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div className="text-red-600 text-lg font-bold mb-4">
                Gagal memuat program
              </div>
              <p className="text-red-500 text-sm mb-6">
                {eventsError ||
                  "Terjadi kesalahan saat memuat program untuk kategori ini"}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    // Retry fetching events
                    dispatch(
                      fetchPublicEvents({
                        page: 1,
                        perPage: 12,
                        categoryKey: categoryKey,
                        searchQuery: "",
                        fromDate: "",
                        toDate: "",
                      })
                    );
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2 justify-center">
                  <RefreshCw className="w-4 h-4" />
                  Coba Lagi
                </button>
                <button
                  onClick={() => navigate("/events")}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                  Lihat Semua Program
                </button>
              </div>

              {/* Network status indicator */}
              {!navigator.onLine && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm">Tidak ada koneksi internet</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State for Events */}
        {publicStatus === "loading" &&
          publicEvents.length === 0 &&
          !eventsHaveError && (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-600 absolute top-0 left-0"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Heart className="w-4 h-4 text-orange-500 animate-pulse" />
                </div>
              </div>
              <p className="text-gray-600 font-medium">Memuat program...</p>
            </div>
          )}

        {/* Event Cards Grid */}
        {filteredAndSortedEvents.length > 0 && !eventsHaveError && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEventClick={handleEventClick}
              />
            ))}
          </section>
        )}

        {/* No Results */}
        {filteredAndSortedEvents.length === 0 &&
          publicStatus !== "loading" &&
          !eventsHaveError && (
            <div className="text-center py-20">
              <div className="bg-gray-50/50 backdrop-blur-sm rounded-xl border border-gray-200/50 p-8 max-w-md mx-auto">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  Tidak ada program ditemukan
                </h3>
                <p className="text-gray-600 mb-6 text-sm">
                  {searchQuery
                    ? "Coba ubah kata kunci pencarian"
                    : `Belum ada program dalam kategori ${
                        displayCategory?.name || "ini"
                      }`}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl text-sm">
                    Reset Pencarian
                  </button>
                )}
              </div>
            </div>
          )}
      </section>

      {/* Featured Programs Section */}
      {filteredAndSortedEvents.some((event) => event.featured) &&
        !eventsHaveError && (
          <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 overflow-hidden p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center group hover:scale-110 transition-all duration-300">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Program Unggulan dalam Kategori
                  </h2>
                  <p className="text-gray-600">
                    Program pilihan dengan dampak terbesar
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedEvents
                  .filter((event) => event.featured)
                  .slice(0, 4)
                  .map((event) => (
                    <EventCard
                      key={`featured-${event.id}`}
                      event={event}
                      onEventClick={handleEventClick}
                    />
                  ))}
              </div>
            </div>
          </section>
        )}

      {/* Statistics Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-8 lg:p-12 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute top-0 left-0 w-full h-full bg-repeat"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8 8 3.6 8 8zm0-20c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8 8 3.6 8 8z'/%3E%3C/g%3E%3C/svg%3E")`,
              }}></div>
          </div>

          <div className="relative z-10 text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 group hover:scale-110 transition-all duration-300">
              <HandHeart className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Statistik Kategori {displayCategory?.name}
            </h2>
            <p className="text-orange-100 text-lg mb-8 max-w-2xl mx-auto">
              {eventsHaveError
                ? "Data sementara tidak tersedia"
                : "Data dan pencapaian program dalam kategori ini"}
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-white mb-2">
                  {eventsHaveError ? "—" : filteredAndSortedEvents.length}
                </div>
                <div className="text-orange-100 text-sm">Program Aktif</div>
              </div>
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-white mb-2">
                  {eventsHaveError
                    ? "—"
                    : filteredAndSortedEvents.filter((event) => event.featured)
                        .length}
                </div>
                <div className="text-orange-100 text-sm">Program Unggulan</div>
              </div>
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-white mb-2">
                  {eventsHaveError
                    ? "—"
                    : filteredAndSortedEvents
                        .reduce((total, event) => total + (event.views || 0), 0)
                        .toLocaleString()}
                </div>
                <div className="text-orange-100 text-sm">Total Views</div>
              </div>
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-white mb-2">
                  {eventsHaveError
                    ? "—"
                    : filteredAndSortedEvents.reduce(
                        (total, event) => total + (event.likes || 0),
                        0
                      )}
                </div>
                <div className="text-orange-100 text-sm">Total Likes</div>
              </div>
            </div>

            {/* Error message in stats */}
            {eventsHaveError && (
              <div className="mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <p className="text-orange-100 text-sm">
                  Statistik akan ditampilkan setelah data program berhasil
                  dimuat
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-red-600 to-yellow-600"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-xl animate-blob"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Bergabung dengan Program {displayCategory?.name}
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Jadilah bagian dari perubahan positif untuk Kalimantan
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-3 bg-white text-orange-600 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <Share2 className="w-5 h-5" />
              Bagikan Kategori
            </button>
            <button
              onClick={() => navigate("/events")}
              className="flex items-center justify-center gap-3 bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-bold text-lg border border-white/30 hover:bg-white/30 transition-all duration-300">
              <Heart className="w-5 h-5" />
              Lihat Semua Program
            </button>
          </div>
        </div>
      </section>

      {/* Related Categories */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 overflow-hidden p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center group hover:scale-110 transition-all duration-300">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Jelajahi Kategori Lainnya
              </h2>
              <p className="text-gray-600">
                Program-program lain yang mungkin menarik bagi Anda
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categoryEvents?.map((category, index) => (
              <button
                key={index}
                onClick={() => navigate(`/events/category/${category.key}`)}
                className="group flex flex-col items-center gap-3 bg-white/80 backdrop-blur-sm hover:bg-white border border-gray-200/50 hover:border-orange-300 p-6 rounded-2xl transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  {typeof category.icon === "string" ? (
                    <DynamicLucideIcon
                      iconName={category.icon}
                      className="w-8 h-8 text-white"
                    />
                  ) : (
                    <category.icon className="w-8 h-8 text-white" />
                  )}
                </div>
                <span className="text-gray-700 font-medium text-center group-hover:text-orange-600 transition-colors duration-300">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Floating Action Button */}
      {/* <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={handleShare}
          className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 animate-bounce">
          <Bookmark className="w-6 h-6" />
        </button>
      </div> */}

      {/* Custom Styles */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }

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

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Custom breakpoint for extra small devices */
        @media (min-width: 475px) {
          .xs\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        
        /* Improve touch targets on mobile */
        @media (max-width: 640px) {
          button, .cursor-pointer {
            min-height: 44px;
            min-width: 44px;
          }
        }
        
        /* Better text readability on mobile */
        @media (max-width: 640px) {
          .text-xs {
            font-size: 0.75rem;
            line-height: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CategoryProgramPreviewHome;
