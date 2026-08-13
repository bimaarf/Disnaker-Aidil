import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Heart, Users, Mail, MessageCircle } from "lucide-react";
import { fetchOrganizations } from "../features/LandingPages/organizationSlice";
import { selectLandingByRouteName } from "../features/LandingPages/routesHook";
import { DynamicLucideIcon } from "../Helper/dinamycLucideIcon";

const calculateSubtreeWidth = (org, level) => {
  const isSmall = level >= 2;
  const cardWidth = isSmall ? 200 : 280;
  const cardMargin = isSmall ? 10 : 20;

  if (!org.children || org.children.length === 0) {
    return cardWidth;
  }

  let childrenTotalWidth = 0;
  org.children.forEach((child) => {
    childrenTotalWidth += calculateSubtreeWidth(child, level + 1);
  });

  const total = childrenTotalWidth + (org.children.length - 1) * cardMargin;
  return Math.max(cardWidth, total);
};

const ProfileCard = ({ org, level, animationDelay = 0, isMobile = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  const getLevelColor = (level) => {
    const colors = [
      "#ff6b6b",
      "#4ecdc4",
      "#f97316",
      "#96ceb4",
      "#feca57",
      "#ff9ff3",
      "#a29bfe",
      "#fd79a8",
      "#00b894",
      "#e17055",
    ];
    return colors[level % colors.length] || "#fbb9b6";
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  const cardColor = getLevelColor(org.level);
  const userInitials = org.user?.name
    ? org.user.name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "?";

  const getAvatarUrl = (avatar) => {
    if (!avatar || avatar === "default.jpg") return null;
    return `${process.env.REACT_APP_API}user/images/${avatar}`;
  };

  const handleEmailClick = () => {
    if (org.user?.email) {
      window.location.href = `mailto:${org.user.email}`;
    }
  };

  const handleWhatsAppClick = () => {
    if (org.user?.phone_number) {
      const phoneNumber = org.user.phone_number.replace(/\D/g, "");
      window.open(`https://wa.me/${phoneNumber}`, "_blank");
    }
  };

  const isSmall = level >= 2;

  return (
    <div
      ref={cardRef}
      className={`
        ${
          isMobile
            ? "w-full max-w-[320px] h-[240px] my-2.5 mx-auto"
            : isSmall
            ? "w-[200px] h-[200px] m-5"
            : "w-[280px] h-[280px] m-5"
        }
        bg-white rounded-[32px] p-[3px] relative
        transition-all duration-700 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}
        ${
          isHovered
            ? isMobile
              ? "scale-[1.02]"
              : "-translate-y-2 rounded-tl-[55px]"
            : ""
        }
        shadow-[0_70px_30px_-50px_rgba(96,75,74,0.19)]
        ${isHovered ? "shadow-[0_80px_40px_-50px_rgba(96,75,74,0.25)]" : ""}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        boxShadow: isHovered
          ? "0 80px 40px -50px rgba(96,75,74,0.25)"
          : "0 70px 30px -50px rgba(96,75,74,0.19)",
      }}>
      {/* Mail Button */}
      {/* <button
        onClick={handleEmailClick}
        disabled={!org.user?.email}
        className="absolute right-4 top-4 bg-transparent border-none cursor-pointer z-[4] transition-all duration-500 ease-out group">
        <Mail
          className={`${
            isMobile ? "w-5 h-5" : isSmall ? "w-5 h-5" : "w-6 h-6"
          } transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-12`}
          style={{ stroke: cardColor, strokeWidth: 3 }}
        />
      </button> */}
      <div className="absolute right-4 top-4 bg-transparent border-none cursor-pointer z-[4] transition-all duration-500 ease-out group">
        <div className={`${isMobile ? "hidden" : "flex"} gap-2 items-center`}>
          <button
            onClick={handleWhatsAppClick}
            disabled={!org.user?.phone_number}
            title={org.user?.phone_number ? "WhatsApp" : "No phone number"}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 p-0 bg-white/20 border border-white/30 hover:bg-white hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/20 disabled:hover:scale-100">
            <MessageCircle
              className="w-4 h-4 stroke-white stroke-2 transition-all duration-300"
              style={{ stroke: isHovered ? cardColor : "white" }}
            />
          </button>
          <button
            onClick={handleEmailClick}
            disabled={!org.user?.email}
            title={org.user?.email ? "Email" : "No email"}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 p-0 bg-white/20 border border-white/30 hover:bg-white hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/20 disabled:hover:scale-100">
            <Mail
              className="w-4 h-4 stroke-white stroke-2 transition-all duration-300"
              style={{ stroke: isHovered ? cardColor : "white" }}
            />
          </button>
        </div>
      </div>

      {/* Profile Picture */}
      <div
        className={`
          absolute inset-[3px] rounded-[29px] z-[1] overflow-hidden
          transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          ${
            isHovered && !isMobile
              ? "md:w-20 md:h-20 md:top-2.5 md:left-2.5 md:rounded-full md:z-[3] md:border-[7px]"
              : ""
          }
          ${isHovered && !isMobile && isSmall ? "md:w-20 md:h-20" : ""}
          ${
            isHovered && !isMobile && !isSmall
              ? "md:w-[100px] md:h-[100px]"
              : ""
          }
        `}
        style={{
          background: `linear-gradient(135deg, ${cardColor}20, ${cardColor}10)`,
          borderColor: isHovered && !isMobile ? cardColor : "transparent",
          boxShadow:
            isHovered && !isMobile ? "0 5px 5px 0 rgba(96,75,74,0.19)" : "none",
          transitionDelay: isHovered ? "0.1s" : "0s",
        }}>
        {org.user && getAvatarUrl(org.user.avatar) ? (
          <img
            src={getAvatarUrl(org.user.avatar)}
            alt={org.user.name}
            className={`w-full h-full object-cover object-center transition-all duration-1000 ease-out ${
              isHovered && !isMobile ? "md:scale-110" : ""
            }`}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className={`
            w-full h-full flex items-center justify-center font-bold
            ${isMobile ? "text-5xl" : isSmall ? "text-4xl" : "text-6xl"}
            ${
              isHovered && !isMobile
                ? isSmall
                  ? "md:text-2xl"
                  : "md:text-3xl"
                : ""
            }
            transition-all duration-1000 ease-out
          `}
          style={{
            color: cardColor,
            background: `linear-gradient(135deg, ${cardColor}15, ${cardColor}25)`,
            display:
              org.user && getAvatarUrl(org.user.avatar) ? "none" : "flex",
            transform: isHovered && !isMobile ? "scale(1.1)" : "scale(1)",
          }}>
          {org.user ? userInitials : "?"}
        </div>
      </div>

      {/* Bottom Section */}
      <div
        className={`
          absolute bottom-[3px] left-[3px] right-[3px] rounded-[29px] z-[2] overflow-hidden
          transition-all duration-500 ease-[cubic-bezier(0.645,0.045,0.355,1)]
          ${
            isHovered
              ? isMobile
                ? "top-[50%] rounded-[29px]"
                : isSmall
                ? "top-[40%] md:rounded-[80px_29px_29px_29px]"
                : "top-[20%] md:rounded-[80px_29px_29px_29px]"
              : isMobile
              ? "top-[75%]"
              : isSmall
              ? "top-[75%]"
              : "top-[80%]"
          }
        `}
        style={{
          background: cardColor,
          boxShadow: "0 5px 5px 0 inset rgba(96,75,74,0.19)",
        }}>
        {/* Content */}
        <div
          className={`absolute bottom-0 left-4 right-4 pt-4 ${
            isMobile ? "h-[105px]" : isSmall ? "h-[105px]" : "h-[160px]"
          }`}>
          <span
            className={`block text-white font-bold leading-tight sn:mb-2 overflow-hidden text-ellipsis whitespace-nowrap ${
              isMobile ? "text-base" : isSmall ? "text-base" : "text-xl"
            }`}>
            {org.user ? org.user.name : "Posisi Kosong"}
          </span>
          {/* <span
            className={`block text-white opacity-90 font-semibold mb-2 overflow-hidden text-ellipsis whitespace-nowrap ${
              isMobile ? "text-xs" : isSmall ? "text-xs" : "text-sm"
            }`}>
            {org.name}
          </span> */}
          <span
            className={`${
              isMobile ? "hidden" : "block"
            } text-white opacity-80 leading-relaxed ${
              isSmall ? "text-xs" : "text-sm"
            } ${!org.user ? "opacity-70 italic" : ""}`}>
            {org.user ? org.user.email : "Belum ada pemegang jabatan"}
          </span>
          {!isSmall && (
            <span
              className={`${
                isMobile ? "hidden" : "block"
              } text-white opacity-80 leading-relaxed ${
                isSmall ? "text-xs" : "text-sm"
              } ${!org.user ? "opacity-70 italic" : ""}`}>
              {org.user ? org.user.phone_number : "Belum ada pemegang jabatan"}
            </span>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2">
          <button
            className={`
              bg-white border-none rounded-[20px] font-semibold px-3 py-1.5
              shadow-[0_2px_4px_0_rgba(0,0,0,0.1)] cursor-pointer transition-all duration-300
              hover:bg-[#f55d56] hover:text-white hover:-translate-y-px hover:shadow-[0_4px_8px_0_rgba(0,0,0,0.2)]
              ${
                isMobile
                  ? "text-[0.6rem]"
                  : isSmall
                  ? "text-[0.6rem]"
                  : "text-xs"
              }
            `}
            style={{ color: cardColor }}>
            {/* {org.user?.phone_number ? "Contact" : "Vacant"} */}
            {org.name}
          </button>
        </div>
      </div>
    </div>
  );
};

const ConnectionLines = ({ children, level, isMobile = false }) => {
  if (!children || children.length === 0 || isMobile) return null;

  const isSmall = level >= 2;
  const cardMargin = isSmall ? 10 : 20;
  const verticalGap = isSmall ? 50 : 60;
  const lineColor = "#facc15";

  const childrenWidths = children.map((child) =>
    calculateSubtreeWidth(child, level)
  );
  const totalWidth =
    childrenWidths.reduce((sum, w) => sum + w, 0) +
    (children.length - 1) * cardMargin;
  const startX = -totalWidth / 2;

  const childPositions = [];
  let currentX = startX;
  childrenWidths.forEach((width) => {
    childPositions.push(currentX + width / 2);
    currentX += width + cardMargin;
  });

  const firstPos = childPositions[0];
  const lastPos = childPositions[childPositions.length - 1];

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <svg className="w-full h-full overflow-visible">
        <line
          x1="50%"
          y1="0"
          x2="50%"
          y2={verticalGap / 2}
          stroke={lineColor}
          strokeWidth="3"
          strokeDasharray="8,4"
          opacity="0.8"
        />
        {children.length > 1 && (
          <>
            <line
              x1={`calc(50% + ${firstPos}px)`}
              y1={verticalGap / 2}
              x2={`calc(50% + ${lastPos}px)`}
              y2={verticalGap / 2}
              stroke={lineColor}
              strokeWidth="3"
              strokeDasharray="8,4"
              opacity="0.8"
            />
            {childPositions.map((pos, index) => (
              <line
                key={index}
                x1={`calc(50% + ${pos}px)`}
                y1={verticalGap / 2}
                x2={`calc(50% + ${pos}px)`}
                y2={verticalGap}
                stroke={lineColor}
                strokeWidth="3"
                strokeDasharray="8,4"
                opacity="0.8"
              />
            ))}
          </>
        )}
        {children.length === 1 && (
          <line
            x1="50%"
            y1={verticalGap / 2}
            x2="50%"
            y2={verticalGap}
            stroke={lineColor}
            strokeWidth="3"
            strokeDasharray="8,4"
            opacity="0.8"
          />
        )}
      </svg>
    </div>
  );
};

const OrganizationNode = ({
  org,
  level = 0,
  animationDelay = 0,
  isMobile = false,
}) => {
  const hasChildren = org.children && org.children.length > 0;
  const isSmall = level >= 2;
  const cardWidth = isSmall ? 200 : 280;
  const cardMargin = isSmall ? 10 : 20;

  if (isMobile) {
    return (
      <div className="w-full">
        <div
          className="w-full flex justify-center"
          style={{ marginLeft: `${level * 20}px` }}>
          <ProfileCard
            org={org}
            level={level}
            animationDelay={animationDelay}
            isMobile={isMobile}
          />
        </div>
        {hasChildren && (
          <div className="mt-4">
            {[...org.children]
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((child, index) => (
                <OrganizationNode
                  key={child.id}
                  org={child}
                  level={level + 1}
                  animationDelay={animationDelay + 200 + index * 100}
                  isMobile={isMobile}
                />
              ))}
          </div>
        )}
      </div>
    );
  }

  let containerWidth = cardWidth;
  if (hasChildren) {
    let childrenTotal = 0;
    org.children.forEach((child) => {
      childrenTotal += calculateSubtreeWidth(child, level + 1);
    });
    containerWidth = Math.max(
      cardWidth,
      childrenTotal + (org.children.length - 1) * cardMargin
    );
  }

  return (
    <div className="flex flex-col items-center relative">
      <div className="relative">
        <ProfileCard
          org={org}
          level={level}
          animationDelay={animationDelay}
          isMobile={isMobile}
        />
      </div>
      {hasChildren && (
        <div
          className="relative"
          style={{
            height: isSmall ? "80px" : "100px",
            width: `${containerWidth}px`,
            marginTop: isSmall ? "-20px" : "-30px",
          }}>
          <ConnectionLines level={level + 1} isMobile={isMobile}>
            {org.children}
          </ConnectionLines>
        </div>
      )}
      {hasChildren && (
        <div
          className="flex justify-start items-start relative"
          style={{
            width: `${containerWidth}px`,
            minHeight: isSmall ? "200px" : "300px",
            paddingBottom: isSmall ? "1rem" : "2rem",
            paddingLeft: isSmall ? "0.5rem" : "1rem",
            paddingRight: isSmall ? "0.5rem" : "1rem",
          }}>
          {[...org.children]
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((child, index) => {
              const childWidth = calculateSubtreeWidth(child, level + 1);
              return (
                <div
                  key={child.id}
                  className="flex-none"
                  style={{
                    width: `${childWidth}px`,
                    marginRight:
                      index < org.children.length - 1 ? `${cardMargin}px` : "0",
                  }}>
                  <OrganizationNode
                    org={child}
                    level={level + 1}
                    animationDelay={animationDelay + 300 + index * 150}
                    isMobile={isMobile}
                  />
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

const OrganizationLevel = ({
  organizations,
  level = 0,
  animationDelay = 0,
  isMobile = false,
}) => {
  if (!organizations || organizations.length === 0) return null;
  const sortedOrgs = [...organizations].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  return (
    <div className="flex flex-col items-center justify-start w-full">
      {sortedOrgs.map((org, index) => (
        <div key={org.id} className="w-full flex justify-center mb-4">
          <OrganizationNode
            org={org}
            level={level}
            animationDelay={animationDelay + index * 200}
            isMobile={isMobile}
          />
        </div>
      ))}
    </div>
  );
};

export const OrganizationalStructure = () => {
  const { organizations, status, error } = useSelector(
    (state) => state.organizations
  );
  const dispatch = useDispatch();
  const [isHeroVisible, setIsHeroVisible] = useState(false);
  const [isChartVisible, setIsChartVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const heroRef = useRef(null);
  const chartRef = useRef(null);
  const chartContainerRef = useRef(null);
  const landing = useSelector(selectLandingByRouteName("struktur-organisasi"));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const getOrganizations = async () => {
      try {
        await dispatch(fetchOrganizations()).unwrap();
      } catch (error) {
        console.error("Failed to fetch organization data:", error);
      }
    };
    if (status === "idle") {
      getOrganizations();
    }
  }, [dispatch, status]);

  useEffect(() => {
    if (
      status === "succeeded" &&
      organizations &&
      organizations.length > 0 &&
      chartContainerRef.current &&
      !isMobile
    ) {
      const container = chartContainerRef.current;
      if (container) {
        const content = container.querySelector(".flex.justify-center.py-8");
        if (content) {
          const contentWidth = content.offsetWidth;
          const containerWidth = container.clientWidth;
          container.scrollLeft = (contentWidth - containerWidth) / 2;
        }
      }
    }
  }, [status, organizations, isMobile]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useLayoutEffect(() => {
    const savedScrollPosition = sessionStorage.getItem(
      "organizationScrollPosition"
    );
    if (savedScrollPosition) {
      const position = parseInt(savedScrollPosition, 10);
      if (!isNaN(position)) {
        window.scrollTo({ top: position, behavior: "instant" });
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem("organizationScrollPosition", window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);

    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsHeroVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    const chartObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isChartVisible) {
            setIsChartVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) heroObserver.observe(heroRef.current);
    if (chartRef.current) chartObserver.observe(chartRef.current);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      heroObserver.disconnect();
      chartObserver.disconnect();
    };
  }, [isChartVisible]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pt-10 sm:pt-0">
      <section
        ref={heroRef}
        className="relative transform-gpu bg-gradient-to-r from-orange-500 to-red-600 py-8 sm:py-12 lg:py-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-4 left-4 sm:top-10 sm:left-10 w-16 h-16 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-20 right-4 sm:top-40 sm:right-20 w-12 h-12 sm:w-24 sm:h-24 bg-yellow-300/20 rounded-full blur-lg animate-bounce"></div>
          <div className="absolute bottom-8 left-1/4 w-8 h-8 sm:w-20 sm:h-20 bg-green-300/20 rounded-full blur-md animate-pulse delay-1000"></div>
        </div>

        <div className="relative mt-4 sm:mt-8 z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-4 sm:space-y-6">
            <div
              className={`flex justify-center transition-all transform-gpu duration-1000 ${
                isHeroVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}>
              <div className="p-2 sm:p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all transform-gpu duration-300 hover:scale-110">
                <DynamicLucideIcon
                  iconName={landing?.icon || "Users"}
                  className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white"
                />
              </div>
            </div>

            <div
              className={`space-y-2 sm:space-y-3 transition-all transform-gpu duration-1000 delay-300 ${
                isHeroVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}>
              <h1 className="text-xl sm:text-3xl lg:text-5xl font-bold text-white leading-tight">
                {landing?.title || "Struktur Organisasi"}
              </h1>
              <h1 className="text-lg sm:text-2xl lg:text-4xl font-bold italic text-yellow-300">
                {landing?.subtitle || "Hirarki Perusahaan"}
              </h1>
              <p className="text-sm sm:text-lg lg:text-xl text-orange-100 max-w-3xl mx-auto px-2">
                {landing?.description ||
                  "Struktur organisasi menggambarkan hirarki dan pembagian tugas dalam perusahaan"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={chartRef}
        className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="min-h-screen bg-gradient-to-b from-white via-orange-50 to-white rounded-2xl p-4 md:p-8">
          {status === "loading" && (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200"></div>
                <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-orange-600 absolute top-0 left-0"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Heart className="w-8 h-8 text-orange-600 animate-pulse" />
                </div>
              </div>
              <p className="text-gray-600 font-medium">
                Memuat struktur organisasi...
              </p>
            </div>
          )}

          {status === "failed" && (
            <div className="text-center py-20">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
                <div className="text-red-600 text-xl font-bold mb-4">
                  Gagal memuat struktur organisasi
                </div>
                <p className="text-red-500">
                  {error || "Terjadi kesalahan saat memuat data."}
                </p>
              </div>
            </div>
          )}

          {status === "succeeded" && (
            <div className="space-y-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  Bagan Organisasi
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Berikut adalah struktur organisasi yang menunjukkan hirarki
                  dan pembagian tugas dalam perusahaan kami.
                </p>
              </div>

              {Array.isArray(organizations) && organizations.length > 0 ? (
                <div className="w-full">
                  <div
                    ref={chartContainerRef}
                    className="org-chart-scroll overflow-x-auto overflow-y-visible pb-16 pt-8">
                    <div className="flex justify-center py-8 min-w-max px-[15vw] mx-auto min-h-[600px]">
                      <OrganizationLevel
                        organizations={organizations}
                        isMobile={isMobile}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 max-w-md mx-auto">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <div className="text-gray-600 text-xl font-bold mb-2">
                      Belum Ada Struktur Organisasi
                    </div>
                    <p className="text-gray-500">
                      Struktur organisasi belum tersedia saat ini.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
