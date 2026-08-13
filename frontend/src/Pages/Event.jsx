import {
  ArrowRight,
  Award,
  Calendar,
  ChevronRight,
  Eye,
  Filter,
  HandHeart,
  Heart,
  Search,
  Tag,
  TreePine,
  TrendingUp,
  Users,
} from "lucide-react";
import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DynamicLucideIcon } from "../Helper/dinamycLucideIcon";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchPublicEvents,
  setPublicEventPage,
} from "../features/event/eventSlice";
import { selectLandingByRouteName } from "../features/LandingPages/routesHook";

// Utility function to truncate text
const truncateText = (text, limit) => {
  if (!text) return "";
  const words = text.split(" ");
  return words.length > limit ? words.slice(0, limit).join(" ") + "..." : text;
};

// Utility function to strip HTML
const stripHtml = (html) => {
  if (!html) return "";
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
};

// Horizontal Event Card Component - Mobile Optimized
const HorizontalEventCard = memo(({ event, onEventClick, logo }) => {
  const primaryImage = useMemo(
    () =>
      event?.images?.find((image) => image.is_primary === 1) ||
      event?.images?.[0],
    [event?.images]
  );

  const imageSrc = primaryImage
    ? `${process.env.REACT_APP_API}${primaryImage.image_data}`
    : null;

  const stripHtml = (html) => {
    return html?.replace(/<[^>]*>/g, "") || "";
  };

  return (
    <article
      onClick={() => onEventClick(event)}
      className="relative overflow-hidden cursor-pointer group rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out border border-transparent hover:border-orange-500/60 h-[45vh] backdrop-blur-sm will-change-transform">
      {/* Background Image or Placeholder */}
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={event.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 group-hover:rotate-1 transition-transform duration-500 ease-in-out filter group-hover:brightness-105 will-change-transform"
          loading="lazy"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop";
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-600 transition-all duration-300 ease-in-out">
          <TreePine className="w-12 h-12 text-gray-300 group-hover:text-orange-300 transition-colors duration-300 ease-in-out" />
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/40 transition-all duration-300 ease-in-out will-change-opacity"></div>

      {/* Program Badge */}
      <div className="absolute top-1 sm:top-1 left-1 sm:left-1 flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-blue-800/10 to-violet-800/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-300 ease-in-out">
        {logo && (
          <div className="flex items-center gap-1">
            <img
              src={`${process.env.REACT_APP_API}logo/images/${logo.image}`}
              alt="Enggang Foundation"
              className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-full object-cover"
            />
            <span className="text-white text-[10px] sm:text-xs font-semibold hidden sm:block drop-shadow-sm">
              Enggang Foundation
            </span>
          </div>
        )}
      </div>

      {/* Trending Badge */}
      {(event.views > 500 || event.featured) && (
        <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1 shadow-xl group-hover:shadow-orange-500/30 group-hover:scale-105 transition-all duration-300 ease-in-out will-change-transform">
          <TrendingUp className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300 ease-in-out" />
          {event.featured ? "Unggulan" : "Trending"}
        </div>
      )}

      {/* Content Overlay - Expanding on hover */}
      <div className="absolute bottom-0 left-0 w-full h-24 group-hover:h-fit bg-gradient-to-t from-orange-600/90 to-transparent text-white p-4 transition-all duration-500 ease-in-out overflow-hidden group-hover:backdrop-blur-sm group-hover:from-orange-500/95 group-hover:to-red-600/10 rounded-t-2xl will-change-transform">
        <div className="flex flex-col h-full">
          <div className="mt-auto space-y-2">
            <h3 className="text-lg font-bold leading-snug line-clamp-2 transition-all duration-300 ease-in-out">
              {event.name}
            </h3>

            {/* Description - Appears on hover */}
            <div className="text-gray-50 text-xs sm:text-sm line-clamp-5 mb-2 leading-relaxed flex-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out delay-100">
              {truncateText(stripHtml(event.description), 16)}
            </div>

            {/* Categories - Appears on hover */}
            {event.categories && event.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 max-h-0 opacity-0 group-hover:max-h-screen group-hover:opacity-100 transition-all duration-300 ease-in-out delay-150 overflow-hidden">
                {event.categories.slice(0, 3).map((category) => (
                  <span
                    key={category.id}
                    className="inline-flex items-center gap-1 text-xs font-medium text-orange-100 bg-orange-400/30 backdrop-blur-sm px-2.5 py-1 rounded-full border border-orange-300/40 group-hover:bg-orange-300/40 transition-all duration-300 ease-in-out">
                    <Tag className="w-3 h-3" />
                    {category.name}
                  </span>
                ))}
                {event.categories.length > 3 && (
                  <span className="text-xs text-gray-100 bg-gray-600/40 backdrop-blur-sm px-2 py-1 rounded-full border border-gray-400/30">
                    +{event.categories.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Author - Appears on hover */}
            {/* {event.author && (
              <div className="max-h-0 opacity-0 group-hover:max-h-screen group-hover:opacity-100 transition-all duration-300 ease-in-out delay-200 overflow-hidden">
                <div className="flex items-center gap-2 p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300 ease-in-out">
                  {event.author.avatar ? (
                    <img
                      src={`${process.env.REACT_APP_API}user/images/${event.author.avatar}`}
                      alt={event.author.name}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-orange-300/50 group-hover:ring-orange-200/70 group-hover:scale-110 transition-all duration-300 ease-in-out will-change-transform"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextElementSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ease-in-out will-change-transform"
                    style={{ display: event.author.avatar ? "none" : "flex" }}>
                    {event.author.name?.charAt(0).toUpperCase() || "T"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-orange-50 transition-colors duration-300 ease-in-out">
                      {event.author.name || "Tim Enggang Foundation"}
                    </p>
                    <p className="text-xs text-gray-200 group-hover:text-gray-100 transition-colors duration-300 ease-in-out">
                      {event.author.role || "Program Coordinator"}
                    </p>
                  </div>
                </div>
              </div>
            )} */}

            {/* Stats - Appears on hover */}
            <div className="flex items-center justify-between max-h-0 opacity-0 group-hover:max-h-screen group-hover:opacity-100 transition-all duration-300 ease-in-out delay-250 overflow-hidden">
              <div className="flex items-center gap-3 text-sm text-gray-200 group-hover:text-gray-100 transition-colors duration-300 ease-in-out">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(event.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {event.views || 0}
                </div>
                {event.likes > 0 && (
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4 group-hover:fill-red-300 transition-all duration-300 ease-in-out" />
                    {event.likes}
                  </div>
                )}
              </div>
            </div>

            {/* Action Button - Always visible, animates on hover */}
            <button className="flex items-center gap-2 text-sm font-semibold text-orange-100 group-hover:text-white transition-all duration-300 ease-in-out group-hover:gap-3 mt-2 group-hover:mt-4">
              Detail
              <ArrowRight className="w-4 h-4 transition-all duration-300 ease-in-out group-hover:translate-x-2 group-hover:scale-110" />
            </button>
          </div>
        </div>
      </div>

      {/* Additional hover effects */}
      <div className="absolute inset-0 bg-gradient-radial from-white/0 to-white/0 group-hover:from-white/10 transition-all duration-500 ease-in-out pointer-events-none will-change-opacity"></div>
    </article>
  );
});
HorizontalEventCard.displayName = "HorizontalEventCard";

// Regular Event Card Component (Grid) - Mobile Optimized
const EventCard = memo(({ event, onEventClick }) => {
  const primaryImage = useMemo(
    () =>
      event?.images?.find((image) => image.is_primary === 1) ||
      event?.images?.[0],
    [event?.images]
  );

  return (
    <article
      onClick={() => onEventClick(event)}
      className="group cursor-pointer bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all transform-gpu duration-300 transform hover:-translate-y-1 hover:scale-[1.02] border border-white/20 overflow-hidden h-full flex flex-col">
      {/* Image Section - Mobile optimized height */}
      <div className="relative overflow-hidden h-32 sm:h-40 lg:h-48 flex-shrink-0">
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
            <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Foundation Badge - Mobile positioned bottom */}
        <div className="absolute bottom-1 left-1 sm:top-2 sm:left-2 sm:bottom-auto flex items-center gap-1 bg-white/20 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md border border-white/30">
          <TreePine className="w-3 h-3 sm:w-4 sm:h-4 text-white drop-shadow-sm" />
          <span className="text-white text-xs font-semibold hidden sm:block drop-shadow-sm">
            Enggang Foundation
          </span>
        </div>

        {/* Trending Badge */}
        {(event.views > 500 || event.featured) && (
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-md">
            <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden sm:inline text-xs">
              {event.featured ? "Unggulan" : "Trending"}
            </span>
          </div>
        )}
      </div>

      {/* Content Section - Mobile optimized */}
      <div className="p-2 sm:p-3 lg:p-4 flex-1 flex flex-col justify-between">
        {/* Categories - Mobile compact */}
        <div className="flex flex-wrap gap-1 mb-2">
          {event.categories?.slice(0, 2).map((category, index) => (
            <span
              key={category.id || index}
              className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-100/80 px-1.5 py-0.5 rounded-full border border-orange-200/50">
              <Tag className="w-2 h-2" />
              <span className="truncate max-w-12 sm:max-w-none">
                {category?.name || "Program"}
              </span>
            </span>
          ))}
          {event.categories && event.categories.length > 2 && (
            <span className="text-xs text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">
              +{event.categories.length - 2}
            </span>
          )}
        </div>

        {/* Title - Mobile optimized */}
        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors duration-300 leading-tight">
          {event.name}
        </h3>

        {/* Description - Mobile compact */}
        <div className="text-gray-600 text-xs sm:text-sm line-clamp-2 mb-2 leading-relaxed flex-1">
          {truncateText(stripHtml(event.description), 12)}
        </div>

        {/* Stats Row - Mobile compact */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(event.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{event.views || 0}</span>
            </div>
          </div>
          {event.status === 1 && (
            <div className="flex items-center gap-1 text-green-600">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-xs">Aktif</span>
            </div>
          )}
        </div>

        {/* Author Info - Mobile compact */}
        {/* {event.author && (
          <div className="flex items-center gap-2 mb-2 p-1.5 sm:p-2 bg-gray-50/50 rounded-lg border border-gray-100">
            {event.author.avatar ? (
              <img
                src={`${process.env.REACT_APP_API}user/images/${event.author.avatar}`}
                alt={event.author.name}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover ring-1 ring-orange-100"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextElementSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ display: event.author.avatar ? "none" : "flex" }}>
              {event.author.name?.charAt(0).toUpperCase() || "T"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {event.author.name || "Tim Enggang Foundation"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {event.author.role || "Program Coordinator"}
              </p>
            </div>
          </div>
        )} */}

        {/* Action Row - Mobile optimized */}
        <div className="flex items-center justify-between pt-1">
          <button className="group/btn flex items-center gap-1 text-orange-500 hover:text-orange-700 font-semibold text-xs transition-all transform-gpu duration-300">
            <span>Baca</span>
            <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
          </button>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {event.likes > 0 && (
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>{event.likes}</span>
              </div>
            )}
            {event.comments > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
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

// Main Events Component for Enggang Foundation
export const Event = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    publicEvents,
    publicStatus: status,
    error,
    publicTotal,
    publicPage,
  } = useSelector((state) => state.events);
  const landing = useSelector(selectLandingByRouteName("events"));

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("horizontal"); // Default to horizontal
  const [isHeroVisible, setIsHeroVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);
  const logo = useSelector((state) => state.logos?.logos);

  // Effects
  useEffect(() => {
    if (status === "idle") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [status]);

  // Fetch events
  useEffect(() => {
    dispatch(
      fetchPublicEvents({
        page: publicPage,
        perPage: 10,
        searchQuery: "",
        fromDate: "",
        toDate: "",
      })
    );
  }, [dispatch, publicPage]);

  // Restore scroll position
  useLayoutEffect(() => {
    const savedScrollPosition = sessionStorage.getItem("eventScrollPosition");
    if (savedScrollPosition) {
      const position = parseInt(savedScrollPosition, 10);
      if (!isNaN(position)) {
        window.scrollTo({
          top: position,
          behavior: "instant",
        });
      }
    }
  }, []);

  // Save scroll position and handle parallax
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      sessionStorage.setItem("eventScrollPosition", window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);

    // Hero Intersection Observer
    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setIsHeroVisible(entry.isIntersecting));
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) heroObserver.observe(heroRef.current);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      heroObserver.disconnect();
    };
  }, []);

  // Memoized categories
  const categories = useMemo(
    () => [
      "all",
      ...new Set(
        publicEvents.flatMap(
          (event) => event.categories?.map((cat) => cat.name) || []
        )
      ),
    ],
    [publicEvents]
  );

  // Memoized filtered events
  const filteredEvents = useMemo(() => {
    let filtered = publicEvents;
    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stripHtml(event.description)
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory !== "all") {
      filtered = filtered.filter((event) =>
        event.categories?.some(
          (cat) => cat.name?.toLowerCase() === selectedCategory.toLowerCase()
        )
      );
    }
    return filtered;
  }, [publicEvents, searchQuery, selectedCategory]);

  // Memoized event handlers
  const loadMore = useCallback(() => {
    const nextPage = publicPage + 1;
    dispatch(setPublicEventPage(nextPage));
  }, [dispatch, publicPage]);

  const handleEventClick = useCallback(
    (event) => {
      sessionStorage.setItem("eventScrollPosition", window.scrollY);
      navigate(`/event/${event.key}?isTop=true`, { state: { event } });
    },
    [navigate]
  );

  const hasMore = publicEvents.length < publicTotal;

  // const quickStats = [
  //   {
  //     icon: <Heart className="w-4 h-4 sm:w-5 sm:h-5" />,
  //     number: "50,000+",
  //     label: "Penerima Manfaat",
  //     color: "text-red-600",
  //   },
  //   {
  //     icon: <TreePine className="w-4 h-4 sm:w-5 sm:h-5" />,
  //     number: "25,000",
  //     label: "Pohon Ditanam",
  //     color: "text-green-600",
  //   },
  //   {
  //     icon: <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />,
  //     number: "2,500+",
  //     label: "Anak Bersekolah",
  //     color: "text-blue-600",
  //   },
  //   {
  //     icon: <Home className="w-4 h-4 sm:w-5 sm:h-5" />,
  //     number: "1,200",
  //     label: "Rumah Dibangun",
  //     color: "text-orange-500",
  //   },
  // ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pt-10 sm:pt-0">
      {/* Hero Section - Mobile optimized */}
      <section
        ref={heroRef}
        className="relative bg-gradient-to-r from-orange-500 to-red-600 py-8 sm:py-12 lg:py-16">
        {/* Enhanced Background Pattern with Parallax */}
        <div
          className="absolute inset-0"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}></div>

        {/* Animated Background Elements - Mobile responsive */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-4 left-4 sm:top-10 sm:left-10 w-16 h-16 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-20 right-4 sm:top-40 sm:right-20 w-12 h-12 sm:w-24 sm:h-24 bg-yellow-300/20 rounded-full blur-lg animate-bounce"></div>
          <div className="absolute bottom-8 left-1/4 w-8 h-8 sm:w-20 sm:h-20 bg-green-300/20 rounded-full blur-md animate-pulse delay-1000"></div>
        </div>

        {/* Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-5 sm:opacity-10 overflow-hidden"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>

        <div className="relative mt-4 sm:mt-8 z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-4 sm:space-y-6">
            {/*  Icon */}
            <div
              className={`flex justify-center transition-all transform-gpu duration-1000 ${
                isHeroVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}>
              <div className="p-2 sm:p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all transform-gpu duration-300 hover:scale-110">
                <DynamicLucideIcon
                  iconName={landing?.icon}
                  className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white"
                />
              </div>
            </div>

            {/* Titles */}
            <div
              className={`space-y-2 sm:space-y-3 transition-all transform-gpu duration-1000 delay-300 ${
                isHeroVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}>
              <h1 className="text-xl sm:text-3xl lg:text-5xl font-bold text-white leading-tight">
                {landing?.title}
              </h1>
              <h1 className="text-lg sm:text-2xl lg:text-4xl font-bold italic text-yellow-300">
                {landing?.subtitle}
              </h1>
              <p className="text-sm sm:text-lg lg:text-xl text-orange-100 max-w-3xl mx-auto px-2">
                {landing?.description}
              </p>
            </div>

            {/* Quick Stats - Mobile grid 2x2 */}
            {/* <div
              className={`grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 max-w-4xl mx-auto pt-4 sm:pt-6 transition-all transform-gpu duration-1000 delay-500 ${
                isHeroVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}>
              {quickStats.map((stat, index) => (
                <div
                  key={index}
                  className="text-center p-2 sm:p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 group cursor-default hover:bg-white/20 transition-all transform-gpu duration-300"
                  style={{ transitionDelay: `${700 + index * 150}ms` }}>
                  <div
                    className={`flex justify-center mb-1 ${stat.color} group-hover:scale-110 transition-all transform-gpu duration-300`}>
                    {stat.icon}
                  </div>
                  <div className="text-base sm:text-xl font-bold text-white">
                    {stat.number}
                  </div>
                  <div className="text-orange-100 text-xs sm:text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div> */}
          </div>
        </div>
      </section>

      {/* Main Content - Mobile optimized */}
      <div className="py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 relative z-10">
        {/* Search and Filter Section - Mobile optimized */}
        <section className="mb-4 sm:mb-6 relative z-20">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20 shadow-lg p-3 sm:p-4 mb-3 sm:mb-4 relative">
            <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:gap-4 items-stretch lg:items-center">
              {/* Search Input - Mobile first */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                <input
                  type="text"
                  placeholder="Cari program, kegiatan, atau topik..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm text-gray-700 bg-gray-50/50 rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-300 dark:focus:border-orange-400 focus:border-orange-400  outline-none transition-all transform-gpu duration-300 placeholder-gray-400"
                />
              </div>

              {/* Category Filter - Mobile friendly */}
              <div className="relative w-full lg:w-auto">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full lg:w-auto pl-10 pr-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 text-sm text-gray-700 transition-all transform-gpu duration-300 appearance-none outline-none bg-gray-50/50 lg:min-w-[200px] cursor-pointer">
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "all" ? "Semua Program" : category}
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* View Mode Toggle - Mobile compact */}
              <div className="flex bg-gray-100/80 rounded-lg p-1 border border-gray-300 w-full lg:w-auto">
                <button
                  onClick={() => setViewMode("horizontal")}
                  className={`flex-1 lg:flex-none px-3 py-2 rounded-md transition-all transform-gpu duration-300 text-sm font-semibold ${
                    viewMode === "horizontal"
                      ? "bg-white shadow-md text-orange-500"
                      : "text-gray-600 hover:text-orange-500"
                  }`}>
                  Card
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex-1 lg:flex-none px-3 py-2 rounded-md transition-all transform-gpu duration-300 text-sm font-semibold ${
                    viewMode === "grid"
                      ? "bg-white shadow-md text-orange-500"
                      : "text-gray-600 hover:text-orange-500"
                  }`}>
                  Grid
                </button>
              </div>
            </div>
          </div>

          {/* Results Header - Mobile optimized */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {searchQuery || selectedCategory !== "all"
                ? `Hasil Pencarian (${filteredEvents.length})`
                : `Semua Program (${publicEvents.length})`}
            </h2>
            {publicTotal > 0 && (
              <span className="text-gray-500 text-xs sm:text-sm bg-gray-100 px-2 py-1 rounded-full">
                Menampilkan {publicEvents.length} dari {publicTotal} program
              </span>
            )}
          </div>
        </section>

        {/* Loading State - Mobile optimized */}
        {status === "loading" && publicEvents.length === 0 && (
          <div className="flex flex-col justify-center items-center py-16 sm:py-20">
            <div className="relative mb-4 sm:mb-6">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-gray-200"></div>
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-4 border-orange-600 absolute top-0 left-0"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-orange-500 animate-pulse" />
              </div>
            </div>
            <p className="text-gray-600 font-medium text-sm sm:text-base">
              Memuat program...
            </p>
          </div>
        )}

        {/* Error State - Mobile optimized */}
        {status === "failed" && (
          <div className="text-center py-16 sm:py-20">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6 max-w-md mx-auto">
              <div className="text-red-600 text-base sm:text-lg font-bold mb-3 sm:mb-4">
                Gagal memuat program
              </div>
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Event Cards - Mobile responsive grid */}
        {filteredEvents.length > 0 && (
          <section
            className={
              viewMode === "horizontal"
                ? "space-y-2 sm:space-y-0 grid gap-2 sm:gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-3"
                : `grid gap-2 sm:gap-3 lg:gap-4 grid-cols-2 sm:grid-cols-3`
            }>
            {filteredEvents.map((event) =>
              viewMode === "horizontal" ? (
                <HorizontalEventCard
                  logo={logo}
                  key={event.id}
                  event={event}
                  onEventClick={handleEventClick}
                />
              ) : (
                <EventCard
                  key={event.id}
                  event={event}
                  viewMode={viewMode}
                  onEventClick={handleEventClick}
                />
              )
            )}
          </section>
        )}

        {/* No Results - Mobile optimized */}
        {filteredEvents.length === 0 && status !== "loading" && (
          <div className="text-center py-16 sm:py-20">
            <div className="bg-gray-50/50 backdrop-blur-sm rounded-xl border border-gray-300 p-6 sm:p-8 max-w-md mx-auto">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Search className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3">
                Tidak ada program ditemukan
              </h3>
              <p className="text-gray-600 mb-4 sm:mb-6 text-sm">
                {searchQuery || selectedCategory !== "all"
                  ? "Coba ubah kata kunci pencarian atau filter kategori"
                  : "Program akan segera hadir. Pantau terus website kami!"}
              </p>
              {(searchQuery || selectedCategory !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all transform-gpu duration-300 hover:scale-105 shadow-lg hover:shadow-xl text-sm">
                  Reset Filter
                </button>
              )}
            </div>
          </div>
        )}

        {/* Load More - Mobile optimized */}
        {hasMore && filteredEvents.length > 0 && status !== "loading" && (
          <div className="text-center mt-6 sm:mt-8">
            <button
              onClick={loadMore}
              disabled={status === "loading"}
              className="group bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold transition-all transform-gpu duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 mx-auto text-sm sm:text-base">
              {status === "loading" ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Memuat...</span>
                </>
              ) : (
                <>
                  <span>Muat Lebih Banyak</span>
                  <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </button>

            {/* Progress Bar - Mobile friendly */}
            <div className="mt-3 sm:mt-4 max-w-xs sm:max-w-md mx-auto">
              <div className="bg-gray-200 rounded-full h-1.5 sm:h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-orange-500 to-red-600 h-full transition-all transform-gpu duration-500 ease-out"
                  style={{
                    width: `${(publicEvents.length / publicTotal) * 100}%`,
                  }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {publicEvents.length} dari {publicTotal} program dimuat
              </p>
            </div>
          </div>
        )}

        {/* Featured Programs - Mobile responsive */}
        {publicEvents.some((event) => event.featured) && (
          <section className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-300">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center group hover:scale-110 transition-all transform-gpu duration-300">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Program Unggulan
                </h2>
                <p className="text-gray-600 text-sm">
                  Program pilihan dengan dampak terbesar
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              {publicEvents
                .filter((event) => event.featured)
                .slice(0, 4)
                .map((event) => (
                  <EventCard
                    key={`featured-${event.id}`}
                    event={event}
                    viewMode="grid"
                    onEventClick={handleEventClick}
                  />
                ))}
            </div>
          </section>
        )}

        {/* Call to Action Section - Mobile optimized */}
        <section className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-300">
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-10 text-center text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 sm:opacity-10">
              <div
                className="absolute top-0 left-0 w-full h-full bg-repeat"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8 8 3.6 8 8zm0-20c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8 8 3.6 8 8z'/%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
            </div>

            <div className="max-w-2xl mx-auto relative z-10">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group hover:scale-110 transition-all transform-gpu duration-300">
                <HandHeart className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4">
                Bergabung dengan Misi Kami
              </h2>
              <p className="text-orange-100 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8">
                Setiap kontribusi Anda memberikan dampak nyata untuk Kalimantan
                dan masyarakatnya
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                {/* <button className="group bg-white text-orange-500 hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold text-sm sm:text-base transition-all transform-gpu duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                  <Heart className="w-4 h-4 mr-2 inline group-hover:text-red-500 transition-colors duration-300" />
                  Donasi Sekarang
                </button> */}
                <button
                  onClick={() => navigate("/registration-volunteer")}
                  className="group border-2 border-white text-white hover:bg-white hover:text-orange-500 px-6 py-3 rounded-lg font-semibold text-sm sm:text-base transition-all transform-gpu duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                  <Users className="w-4 h-4 mr-2 inline" />
                  Jadi Volunteer
                </button>
              </div>

              {/* Stats - Mobile 2x2 grid */}
              {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/20">
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-white">
                    500+
                  </div>
                  <div className="text-orange-100 text-xs sm:text-sm">
                    Volunteer
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-white">
                    100+
                  </div>
                  <div className="text-orange-100 text-xs sm:text-sm">
                    Program
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-white">
                    50+
                  </div>
                  <div className="text-orange-100 text-xs sm:text-sm">Desa</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-white">
                    10+
                  </div>
                  <div className="text-orange-100 text-xs sm:text-sm">
                    Tahun
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </section>
      </div>

      {/* Custom Styles - Mobile responsive utilities */}
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
