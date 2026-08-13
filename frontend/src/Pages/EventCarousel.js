import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Tag,
  TreePine,
  TrendingUp,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPublicEvents } from "../features/event/eventSlice";
import { useNavigate } from "react-router-dom";
import useIsMobile from "../Context/__useIsMobile";

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

// Carousel Event Card Component
const CarouselEventCard = React.memo(({ event, onEventClick, logo }) => {
  const primaryImage = useMemo(
    () =>
      event?.images?.find((image) => image.is_primary === 1) ||
      event?.images?.[0],
    [event?.images]
  );

  const imageSrc = primaryImage
    ? `${process.env.REACT_APP_API}${primaryImage.image_data}`
    : null;

  return (
    <article
      onClick={() => onEventClick(event)}
      className="relative overflow-hidden cursor-pointer group rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out border border-transparent hover:border-orange-500/60 h-[45vh] backdrop-blur-sm will-change-transform">
      {/* Background Image or Placeholder */}
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={event.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out filter group-hover:brightness-105 will-change-transform"
          loading="lazy"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop";
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-600 transition-all duration-300 ease-in-out">
          <TreePine className="w-10 h-10 text-gray-300 group-hover:text-orange-300 transition-colors duration-300 ease-in-out" />
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent group-hover:from-black/50 transition-all duration-300 ease-in-out will-change-opacity"></div>

      {/* Program Badge */}
      <div className="absolute top-2 left-2 flex items-center gap-1 bg-gradient-to-r from-blue-800/20 to-violet-800/20 px-2 py-1 rounded-full transition-all duration-300 ease-in-out">
        {logo && (
          <div className="flex items-center gap-1">
            <img
              src={`${process.env.REACT_APP_API}logo/images/${logo.image}`}
              alt="Enggang Foundation"
              className="w-3 h-3 rounded-full object-cover"
            />
            <span className="text-white text-xs font-semibold drop-shadow-sm">
              Enggang
            </span>
          </div>
        )}
        {!logo && (
          <div className="flex items-center gap-1">
            <TreePine className="w-3 h-3 text-white" />
            <span className="text-white text-xs font-semibold drop-shadow-sm">
              Enggang
            </span>
          </div>
        )}
      </div>

      {/* Trending Badge */}
      {(event.views > 500 || event.featured) && (
        <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg group-hover:shadow-orange-500/30 group-hover:scale-105 transition-all duration-300 ease-in-out will-change-transform">
          <TrendingUp className="w-3 h-3" />
          {event.featured ? "Top" : "Hot"}
        </div>
      )}

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-orange-600/95 to-transparent text-white p-4 transition-all duration-500 ease-in-out overflow-hidden group-hover:backdrop-blur-sm group-hover:from-orange-500/95 rounded-t-xl will-change-transform">
        <div className="space-y-2">
          {/* Title */}
          <h3 className="text-lg font-bold leading-snug line-clamp-2 transition-all duration-300 ease-in-out">
            {event.name}
          </h3>

          {/* Description */}
          <div className="text-gray-50 text-sm line-clamp-2 leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity duration-300 ease-in-out">
            {truncateText(stripHtml(event.description), 15)}
          </div>

          {/* Categories - Show on hover */}
          {event.categories && event.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 max-h-0 opacity-0 group-hover:max-h-screen group-hover:opacity-100 transition-all duration-300 ease-in-out delay-100 overflow-hidden">
              {event.categories.slice(0, 2).map((category) => (
                <span
                  key={category.id}
                  className="inline-flex items-center gap-1 text-xs font-medium text-orange-100 bg-orange-400/30 backdrop-blur-sm px-2 py-0.5 rounded-full border border-orange-300/40">
                  <Tag className="w-3 h-3" />
                  {category.name}
                </span>
              ))}
              {event.categories.length > 2 && (
                <span className="text-xs text-gray-100 bg-gray-600/40 backdrop-blur-sm px-2 py-0.5 rounded-full border border-gray-400/30">
                  +{event.categories.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-gray-200">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(event.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                })}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {event.views || 0}
              </div>
            </div>
            {event.likes > 0 && (
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {event.likes}
              </div>
            )}
          </div>

          {/* Action Button */}
          <button className="flex items-center gap-2 text-xs font-semibold text-orange-100 group-hover:text-white transition-all duration-300 ease-in-out group-hover:gap-3 mt-2">
            Detail Program
            <ArrowRight className="w-3 h-3 transition-all duration-300 ease-in-out group-hover:translate-x-1 group-hover:scale-110" />
          </button>
        </div>
      </div>
    </article>
  );
});

CarouselEventCard.displayName = "CarouselEventCard";

// Main Carousel Component
const EventCarousel = () => {
  const dispatch = useDispatch();
  const {
    publicEvents,
    publicStatus: status,
    error,
  } = useSelector((state) => state.events);

  const logo = useSelector((state) => state.logos?.logos);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Calculate items per slide and total slides
  const isMobile = useIsMobile();
  const itemsPerSlide = isMobile ? 1 : 3;
  const totalSlides = Math.ceil(publicEvents.length / itemsPerSlide);
  const navigate = useNavigate();
  // Fetch events on component mount
  useEffect(() => {
    if (status === "idle") {
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
  }, [dispatch, status]);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || totalSlides <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 6000); // Increased interval for 3 items

    return () => clearInterval(interval);
  }, [isAutoPlaying, totalSlides]);

  // Navigation handlers
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  }, [totalSlides]);

  const goToSlide = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  const handleEventClick = useCallback((event) => {
    console.log("Event clicked:", event);
    // Add navigation logic here
    navigate(`/event/${event.key}?isTop=true`, { state: { event } });
  }, []);

  // Get events for current slide (keeping for slide indicator)
  const getCurrentSlideEvents = useCallback(() => {
    const startIndex = currentIndex * itemsPerSlide;
    const endIndex = startIndex + itemsPerSlide;
    return publicEvents.slice(startIndex, endIndex);
  }, [currentIndex, publicEvents, itemsPerSlide]);

  // Loading state
  if (status === "loading" && publicEvents.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-600 absolute top-0 left-0"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Heart className="w-6 h-6 text-orange-500 animate-pulse" />
          </div>
        </div>
        <p className="text-gray-600 font-medium">Memuat program...</p>
      </div>
    );
  }

  // Error state
  if (status === "failed") {
    return (
      <div className="text-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
          <div className="text-red-600 text-lg font-bold mb-4">
            Gagal memuat program
          </div>
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // No events state
  if (publicEvents.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="bg-gray-50/50 backdrop-blur-sm rounded-xl border border-gray-200/50 p-8 max-w-md mx-auto">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <TreePine className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            Tidak ada program ditemukan
          </h3>
          <p className="text-gray-600 mb-6 text-sm">
            Program akan segera hadir. Pantai terus website kami!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Program ({publicEvents.length})
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-300 ${
              isAutoPlaying
                ? "bg-orange-100 text-orange-600"
                : "bg-gray-100 text-gray-600"
            }`}>
            {isAutoPlaying ? "Auto" : "Manual"}
          </button>
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {currentIndex + 1} / {totalSlides}
          </div>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Navigation Arrows */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 hover:text-orange-600 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 hover:text-orange-600 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Carousel Track - 3 items grid */}
        <div className="overflow-hidden rounded-2xl">
          <div className="transition-opacity duration-500 ease-in-out">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getCurrentSlideEvents().map((event) => (
                <div key={event.id} className="w-full">
                  <CarouselEventCard
                    event={event}
                    onEventClick={handleEventClick}
                    logo={logo}
                  />
                </div>
              ))}

              {/* Fill empty slots if needed */}
              {getCurrentSlideEvents().length < itemsPerSlide &&
                Array(itemsPerSlide - getCurrentSlideEvents().length)
                  .fill(null)
                  .map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="w-full hidden lg:block"
                    />
                  ))}
            </div>
          </div>
        </div>

        {/* Dots Navigation */}
        {totalSlides > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            {Array(totalSlides)
              .fill(null)
              .map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "bg-orange-500 scale-110"
                      : "bg-gray-300 hover:bg-orange-300"
                  }`}
                />
              ))}
          </div>
        )}
      </div>

      {/* Slide indicator */}
      <div className="text-center mt-4">
        <p className="text-sm text-gray-500">
          Menampilkan {getCurrentSlideEvents().length} dari{" "}
          {publicEvents.length} program
        </p>
      </div>

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
      `}</style>
    </div>
  );
};

export default EventCarousel;
