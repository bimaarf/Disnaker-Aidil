import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Building2,
  Mail,
} from "lucide-react";
import { fetchOrganizations } from "../features/LandingPages/organizationSlice";
import { WhatsApp } from "@mui/icons-material";

const OurTeam = ({
  title = "Organizational Structure",
  showNavigation = true,
  showDots = true,
  showCounter = true,
  autoPlay = false,
  autoPlayInterval = 3000,
  className = "",
}) => {
  const dispatch = useDispatch();
  const { organizations, status, error } = useSelector(
    (state) => state.organizations
  );
  const theme = useSelector((state) => state.themes?.localTheme);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(1);
  const [autoPlayRef, setAutoPlayRef] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const sliderRef = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const startTime = useRef(0);
  const velocityThreshold = 0.5;
  const dragThreshold = 50; // Minimum pixels to trigger slide change

  // Check if mobile with proper breakpoints
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch organizations on component mount
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchOrganizations());
    }
  }, [dispatch, status]);

  // Get theme classes
  const getThemeClasses = useCallback(() => {
    if (theme === "wireframe") {
      return {
        container: "bg-base-300/25",
        card: "bg-base-100",
        header: "bg-base-100/90",
        input:
          "bg-base-100 border-base-300 focus:border-blue-500 text-base-content",
        button: "bg-blue-600 hover:bg-blue-700 text-white",
        text: "text-base-content",
        muted: "text-base-content/60",
      };
    } else {
      return {
        container: "bg-base-300/25 dark:bg-base-100",
        card: "bg-base-100 dark:bg-base-200",
        header: "bg-base-100/90 dark:bg-base-200/90",
        input:
          "bg-base-100 dark:bg-base-300 border-base-300 dark:border-base-600 focus:border-blue-500 dark:focus:border-blue-400 text-base-content",
        button:
          "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white",
        text: "text-base-content",
        muted: "text-base-content/60 dark:text-base-content/70",
      };
    }
  }, [theme]);

  const themeClasses = useMemo(() => getThemeClasses(), [getThemeClasses]);

  // Function to truncate text by words
  const truncateTextWords = (text, wordLimit) => {
    if (!text) return "";
    const words = text.split(" ");
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(" ") + "...";
  };

  // Flatten the organization structure to create slides
  const createSlides = useCallback((orgData) => {
    const slides = [];

    if (!orgData || !Array.isArray(orgData)) return slides;

    const processNode = (node, level = 0, parent = null) => {
      slides.push({
        type: level === 0 ? "director" : level === 1 ? "manager" : "staff",
        item: node,
        level: level,
        parent: parent,
        hasChildren: node.children && node.children.length > 0,
      });

      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => {
          processNode(child, level + 1, node);
        });
      }
    };

    orgData.forEach((root) => {
      processNode(root);
    });

    return slides;
  }, []);

  const slides = useMemo(
    () => createSlides(organizations),
    [organizations, createSlides]
  );
  const totalSlides = slides.length;

  const displaySlides = useMemo(() => {
    if (totalSlides === 0) return [];
    return [slides[totalSlides - 1], ...slides, slides[0]];
  }, [slides, totalSlides]);

  // Auto play functionality
  useEffect(() => {
    if (autoPlay && totalSlides > 1) {
      const interval = setInterval(() => {
        handleNextSlide();
      }, autoPlayInterval);
      setAutoPlayRef(interval);
      return () => clearInterval(interval);
    }
    return () => {
      if (autoPlayRef) clearInterval(autoPlayRef);
    };
  }, [autoPlay, autoPlayInterval, totalSlides]);

  const handleNextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const newDisplay = displayIndex + 1;
    setDisplayIndex(newDisplay);
    const newCurrent = (currentSlide + 1) % totalSlides;
    setCurrentSlide(newCurrent);
    setTimeout(() => {
      setIsTransitioning(false);
      if (newDisplay === totalSlides + 1) {
        if (sliderRef.current) {
          sliderRef.current.style.transition = "none";
        }
        setDisplayIndex(1);
      }
    }, 500);
  }, [isTransitioning, totalSlides, currentSlide, displayIndex]);

  const nextSlide = useCallback(
    (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      handleNextSlide();
    },
    [handleNextSlide]
  );

  const prevSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const newDisplay = displayIndex - 1;
    setDisplayIndex(newDisplay);
    const newCurrent = (currentSlide - 1 + totalSlides) % totalSlides;
    setCurrentSlide(newCurrent);
    setTimeout(() => {
      setIsTransitioning(false);
      if (newDisplay === 0) {
        if (sliderRef.current) {
          sliderRef.current.style.transition = "none";
        }
        setDisplayIndex(totalSlides);
      }
    }, 500);
  }, [isTransitioning, totalSlides, currentSlide, displayIndex]);

  const goToSlide = useCallback(
    (index) => {
      if (isTransitioning) return;
      if (autoPlayRef) clearInterval(autoPlayRef);
      setIsTransitioning(true);
      setDisplayIndex(index + 1);
      setCurrentSlide(index);
      setTimeout(() => setIsTransitioning(false), 500);
    },
    [isTransitioning, autoPlayRef]
  );

  const getSlideIndex = (index) => {
    return (index + totalSlides) % totalSlides;
  };

  const getAvatarUrl = (avatar) => {
    if (!avatar || avatar === "default.jpg") return null;
    return `${process.env.REACT_APP_API}user/images/${avatar}`;
  };

  const getLevelConfig = (level) => {
    const configs = {
      0: {
        gradient: "from-purple-500 to-purple-600",
        role: "Director",
        bgColor: "bg-purple-500",
        icon: Building2,
        color: "purple",
      },
      1: {
        gradient: "from-blue-500 to-blue-600",
        role: "Manager",
        bgColor: "bg-blue-500",
        icon: Users,
        color: "blue",
      },
      2: {
        gradient: "from-green-500 to-green-600",
        role: "Staff",
        bgColor: "bg-green-500",
        icon: User,
        color: "green",
      },
    };
    return configs[level] || configs[2];
  };

  const handleEmailClick = (email) => {
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };

  const handleWhatsappClick = (phoneNumber) => {
    if (!phoneNumber) return;

    let phoneStr = String(phoneNumber).trim();

    if (!phoneStr.startsWith("628")) {
      phoneStr = phoneStr.replace(/\D/g, "");
      if (phoneStr.startsWith("0")) {
        phoneStr = "62" + phoneStr.slice(1);
      }
    }

    if (phoneStr.length < 10) {
      alert("Nomor WhatsApp tidak valid");
      return;
    }

    const message = encodeURIComponent("Halo, saya ingin bertanya.");
    const url = `https://wa.me/${phoneStr}?text=${message}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = useCallback(
    (e) => {
      if (isTransitioning) return;
      if (autoPlayRef) clearInterval(autoPlayRef);

      setIsDragging(true);
      startX.current = e.touches[0].clientX;
      currentX.current = e.touches[0].clientX;
      startTime.current = Date.now();

      if (sliderRef.current) {
        sliderRef.current.style.transition = "none";
      }
    },
    [isTransitioning, autoPlayRef]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging || isTransitioning) return;

      currentX.current = e.touches[0].clientX;
      const deltaX = currentX.current - startX.current;
      const containerWidth = sliderRef.current?.offsetWidth || 0;

      // Only allow horizontal swipe, prevent if trying to scroll vertically
      const deltaY = Math.abs(e.touches[0].clientY - e.touches[0].clientY);
      if (deltaY > Math.abs(deltaX)) return;

      // Calculate percentage with resistance at edges
      const percent = (deltaX / containerWidth) * 100;
      const resistance = 0.5; // Add resistance when swiping
      const adjustedPercent = percent * resistance;

      if (sliderRef.current) {
        sliderRef.current.style.transform = `translateX(calc(-${
          displayIndex * 100
        }% + ${adjustedPercent}%))`;
      }
    },
    [isDragging, isTransitioning, displayIndex]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);
    const deltaX = currentX.current - startX.current;
    const elapsed = Date.now() - startTime.current;
    const velocity = Math.abs(deltaX / elapsed) || 0;
    // const containerWidth = sliderRef.current?.offsetWidth || 0;

    // Determine if swipe was significant enough
    const shouldSwipe =
      Math.abs(deltaX) > dragThreshold || velocity > velocityThreshold;

    if (sliderRef.current) {
      sliderRef.current.style.transition = "transform 0.5s ease-in-out";
    }

    if (shouldSwipe) {
      if (deltaX > 0) {
        prevSlide();
      } else {
        handleNextSlide();
      }
    } else {
      // Snap back to center if swipe wasn't enough
      if (sliderRef.current) {
        sliderRef.current.style.transform = `translateX(-${
          displayIndex * 100
        }%)`;
      }
    }
  }, [isDragging, displayIndex, handleNextSlide, prevSlide]);

  const renderOrgCard = (slide, position) => {
    if (!slide) {
      return (
        <div className="flex items-center justify-center h-72 sm:h-80">
          <div
            className={`${themeClasses.card} rounded-xl p-4 opacity-30 h-full w-full flex items-center justify-center border border-base-300/50`}>
            <p className={themeClasses.muted}>No data</p>
          </div>
        </div>
      );
    }

    const { item, level } = slide;
    const isCenter = position === "center";
    const levelConfig = getLevelConfig(level);

    const cardClasses = `
      transform transition-all duration-500 ease-out
      ${
        isCenter
          ? "scale-100 opacity-100 translate-y-0"
          : "scale-90 opacity-60 translate-y-2"
      }
      ${isMobile && !isCenter ? "scale-75" : ""}
    `;

    const userInitials = item.user?.name
      ? item.user.name
          .split(" ")
          .map((word) => word.charAt(0))
          .join("")
          .substring(0, 2)
          .toUpperCase()
      : "?";

    return (
      <div className={cardClasses}>
        <div
          className={`
            ${themeClasses.card} rounded-xl p-4 sm:p-6 
            shadow-lg hover:shadow-xl transition-all duration-300 
            border border-base-300/50 h-72 sm:h-80
            flex flex-col relative overflow-hidden group
            ${isCenter ? "ring-2 ring-blue-500/20" : ""}
          `}>
          <div
            className={`absolute inset-0 bg-gradient-to-br ${levelConfig.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
          />

          <div
            className={`h-1 bg-gradient-to-r ${levelConfig.gradient} rounded-full mb-3`}
          />

          <div className="flex items-center gap-2 absolute top-3 right-3">
            <button
              onClick={() => handleEmailClick(item.user?.email)}
              disabled={!item.user?.email}
              className="p-2 rounded-lg bg-blue-500 hover:bg-base-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              <Mail className="w-4 h-4 text-white" />
            </button>

            <button
              onClick={() => handleWhatsappClick(item.user?.phone_number)}
              disabled={!item.user?.phone_number}
              className="p-2 rounded-lg bg-green-500 hover:bg-base-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              <WhatsApp className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="flex flex-col items-center text-center space-y-3 flex-1">
            <div className="relative">
              {getAvatarUrl(item.user?.avatar) ? (
                <img
                  src={getAvatarUrl(item.user.avatar)}
                  alt={item.user?.name || "User"}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-base-300 shadow-md"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className={`
                  w-16 h-16 sm:w-20 sm:h-20 rounded-full 
                  bg-gradient-to-br ${levelConfig.gradient} 
                  flex items-center justify-center ring-2 ring-base-300 shadow-md
                  ${getAvatarUrl(item.user?.avatar) ? "hidden" : "flex"}
                `}>
                {item.user ? (
                  <span className="text-lg font-bold text-white">
                    {userInitials}
                  </span>
                ) : (
                  <levelConfig.icon className="w-8 h-8 text-white" />
                )}
              </div>

              <div
                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br ${levelConfig.gradient} flex items-center justify-center shadow-md border-2 border-white`}>
                <span className="text-xs font-bold text-white">
                  {level + 1}
                </span>
              </div>
            </div>

            <div className="space-y-2 flex-1 flex flex-col justify-center min-h-0">
              <h3
                className={`font-bold text-base sm:text-lg leading-tight ${themeClasses.text} line-clamp-2`}>
                {item.user ? item.user.name : "Posisi Kosong"}
              </h3>
              <p
                className={`text-sm font-medium ${themeClasses.text} opacity-90 line-clamp-2`}>
                {truncateTextWords(item.name, 4)}
              </p>
              <p className={`text-xs ${themeClasses.muted} line-clamp-1`}>
                {item.user?.email || "Belum ada pemegang"}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${levelConfig.gradient} text-white shadow-sm`}>
                {levelConfig.role}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className={`${className} py-12`}>
        <div className="flex flex-col items-center justify-center">
          <div className="relative mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200" />
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 absolute top-0 left-0" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Users className="w-5 h-5 text-blue-600 animate-pulse" />
            </div>
          </div>
          <p className={`text-base ${themeClasses.muted}`}>
            Loading organization data...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "failed") {
    return (
      <div className={`${className} py-12`}>
        <div className="flex flex-col items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
            <div className="text-red-600 text-xl font-bold mb-3 text-center">
              Failed to Load Organization Data
            </div>
            <p className="text-red-500 text-center">
              {error || "An error occurred while loading the data."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Return early if no data
  if (slides.length === 0) {
    return (
      <div className={`${className} py-12`}>
        <div className="flex flex-col items-center justify-center">
          <Building2 className="w-16 h-16 text-base-content/30 mb-4" />
          <p className={`text-lg ${themeClasses.muted}`}>
            No organization data available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {title && (
        <div className="mb-8 sm:mb-12">
          <div className="mb-4 sm:mb-8 text-center">
            <div className="divider divider-primary">{title}</div>
            <p className="text-gray-600 text-sm lg:text-base">Our Team</p>
          </div>
        </div>
      )}

      <div className="overflow-hidden py-4 sm:py-6">
        {isMobile ? (
          <div
            ref={sliderRef}
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${displayIndex * 100}%)`,
              touchAction: "pan-y pinch-zoom", // Allow vertical scroll, prevent horizontal
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}>
            {displaySlides.map((slide, index) => (
              <div key={index} className="flex-shrink-0 w-full">
                <div className="px-4">{renderOrgCard(slide, "center")}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 min-h-[320px] items-stretch">
            <div className="col-span-1">
              {renderOrgCard(slides[getSlideIndex(currentSlide - 1)], "left")}
            </div>
            <div className="col-span-1">
              {renderOrgCard(slides[getSlideIndex(currentSlide)], "center")}
            </div>
            <div className="col-span-1">
              {renderOrgCard(slides[getSlideIndex(currentSlide + 1)], "right")}
            </div>
          </div>
        )}
      </div>

      {showNavigation && totalSlides > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={prevSlide}
            disabled={isTransitioning}
            className={`
              p-3 rounded-xl ${themeClasses.button} shadow-lg
              hover:shadow-xl transform transition-all duration-300 
              hover:scale-110 active:scale-[98%] flex items-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
            `}>
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">Previous</span>
          </button>

          {showDots && (
            <div className="flex items-center gap-2 max-w-xs overflow-x-auto px-4">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  disabled={isTransitioning}
                  className={`
                    w-3 h-3 rounded-full transition-all duration-300 flex-shrink-0
                    ${
                      index === currentSlide
                        ? "bg-blue-500 scale-125 shadow-lg shadow-blue-500/50"
                        : "bg-base-300 hover:bg-base-400 hover:scale-110"
                    }
                    disabled:cursor-not-allowed
                  `}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}

          <button
            onClick={nextSlide}
            disabled={isTransitioning}
            className={`
              p-3 rounded-xl ${themeClasses.button} shadow-lg
              hover:shadow-xl transform transition-all duration-300 
              hover:scale-110 active:scale-[98%] flex items-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed z-40 disabled:hover:scale-100
            `}>
            <span className="hidden sm:inline font-medium">Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {showCounter && totalSlides > 1 && (
        <div className="text-center mt-4">
          <span
            className={`text-sm ${themeClasses.muted} px-3 py-1 rounded-full bg-base-200/50`}>
            {currentSlide + 1} of {totalSlides}
          </span>
        </div>
      )}

      {autoPlay && totalSlides > 1 && (
        <div className="text-center mt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-base-200 text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Auto-playing
          </div>
        </div>
      )}
    </div>
  );
};

export default OurTeam;
