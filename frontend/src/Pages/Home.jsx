import * as LucideIcons from "lucide-react";
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Info,
  X,
  Calendar,
  Eye,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import useIsMobile from "../Context/__useIsMobile";
import { fetchServices } from "../features/newNaker/serviceSlice";
import { fetchPublicBlogs } from "../features/blog/blogSlice";
import { selectLandingByRouteName } from "../features/LandingPages/routesHook";
import { DynamicLucideIcon } from "../Helper/dinamycLucideIcon";

// Dynamic Icon Component
const DynamicLucideIconService = ({
  iconName,
  className = "w-7 h-7 text-white",
  color,
}) => {
  const IconComponent = LucideIcons[iconName];
  const Component = IconComponent || Info;

  if (color) {
    return <Component className={className} style={{ color }} />;
  }
  return <Component className={className} />;
};

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

export const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { services, status, error } = useSelector((state) => state.services);
  const { publicBlogs, publicStatus } = useSelector((state) => state.blogs);
  const logo = useSelector((state) => state.logos.logos);
  const [selectedService, setSelectedService] = useState(null);
  const [expandedSubItem, setExpandedSubItem] = useState(null);
  const [isHeroVisible, setIsHeroVisible] = useState(false);
  const [isServicesVisible, setIsServicesVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [dragStart, setDragStart] = useState(0);
  const [dragCurrent, setDragCurrent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const landing = useSelector(selectLandingByRouteName("home-page"));

  const heroRef = useRef(null);
  const servicesRef = useRef(null);
  const modalRef = useRef(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchServices());
    }
  }, [status, dispatch]);

  useEffect(() => {
    if (publicStatus === "idle") {
      dispatch(
        fetchPublicBlogs({
          page: 1,
          perPage: 3,
          loadMore: false,
        })
      );
    }
  }, [publicStatus, dispatch]);

  // Scroll handler
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Intersection Observer
    const createObserver = (callback, element) => {
      const options = {
        threshold: 0.1,
        rootMargin: "0px",
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          callback(entry.isIntersecting);
        });
      }, options);

      if (element) {
        observer.observe(element);
      }

      return observer;
    };

    const heroObserver = createObserver(setIsHeroVisible, heroRef.current);
    const servicesObserver = createObserver(
      setIsServicesVisible,
      servicesRef.current
    );
    return () => {
      window.removeEventListener("scroll", handleScroll);
      heroObserver.disconnect();
      servicesObserver.disconnect();
    };
  }, []);

  const handleServiceClick = (service) => {
    if (service.sub_items && service.sub_items.length > 0) {
      setSelectedService(service);
      setExpandedSubItem(null);
    } else {
      window.open(service.link, "_blank", "noopener,noreferrer");
    }
  };

  const handleCloseModal = () => {
    setSelectedService(null);
    setExpandedSubItem(null);
    setDragStart(0);
    setDragCurrent(0);
    setIsDragging(false);
  };

  const handleBlogClick = (blog) => {
    navigate(`/blog/${blog.key}?isTop=true`, { state: { blog } });
  };

  // Handle drag events for mobile
  const handleTouchStart = (e) => {
    if (!isMobile) return;
    setDragStart(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isMobile || !isDragging) return;
    const current = e.touches[0].clientY;
    const diff = current - dragStart;
    if (diff > 0) {
      setDragCurrent(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    if (dragCurrent > 150) {
      handleCloseModal();
    } else {
      setDragCurrent(0);
    }
    setIsDragging(false);
  };

  // Disable body scroll on mobile when modal is open
  useEffect(() => {
    if (selectedService && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedService, isMobile]);

  // Ambil 3 blog terbaru
  const recentBlogs = publicBlogs.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#1F1F1F]">
      <section
        ref={heroRef}
        className="relative overflow-hidden bg-[#1F1F1F] text-white">
        <div
          className="absolute inset-0 md:h-full h-full -z-20 bg-cover bg-center bg-no-repeat opacity-70"
          style={{
            backgroundImage: logo?.background_header
              ? `url(${logo.background_header})`
              : "none",
            transform: isMobile ? "none" : `translateY(${scrollY * 0.3}px)`,
            willChange: "transform",
          }}></div>

        <div className="absolute inset-0 h-full -z-10 bg-gradient-to-b from-black/50 via-black/60 to-black/70"></div>

        {/* Banner Content */}
        <div className="relative h-[450px] md:h-[550px]">
          <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
            <div className="max-w-4xl">
              <div
                className={`inline-flex items-center gap-2 mb-4 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-xs font-semibold border border-white/20 transition-all duration-1000 ${
                  isHeroVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}>
                <DynamicLucideIcon
                  iconName={landing?.icon}
                  className="w-4 h-4"
                />
                <span> {landing?.title}</span>
              </div>

              <h1
                className={`text-xl sm:text-2xl lg:text-5xl xl:text-5xl font-bold mb-6 leading-tight transition-all duration-1000 ${
                  isHeroVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: "200ms" }}>
                {landing?.subtitle}
              </h1>

              <div
                className={`flex flex-col sm:flex-row gap-3 mb-8 transition-all duration-1000 ${
                  isHeroVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: "400ms" }}>
                <a
                  href="#layanan"
                  className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all duration-200 hover:scale-105 text-sm shadow-xl">
                  ZONA INTEGRITAS
                  <ChevronRight className="w-5 h-5 ml-2" />
                </a>
              </div>

              <div
                className={`space-y-2 text-sm transition-all duration-1000 ${
                  isHeroVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: "600ms" }}>
                <p className="font-semibold">{landing?.description}</p>
                <p className="text-xl font-bold text-red-500">
                  ANDA MEMASUKI WILAYAH ZONA INTEGRITAS
                </p>
              </div>
            </div>
            {!isMobile && (
              <div className="flex justify-end">
                <img className="h-40" src={logo?.image} alt="Logo" />
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
      </section>

      {/* Services Section */}
      <section
        ref={servicesRef}
        id="layanan"
        className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, #3B82F6 1px, transparent 1px),
                       radial-gradient(circle at 80% 80%, #3B82F6 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`text-center mb-12 transition-all duration-1000 ${
              isServicesVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-16 opacity-0"
            }`}>
            <div className="inline-block px-4 py-1.5 bg-blue-50 rounded-lg mb-3">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                LAYANAN PUBLIK
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Layanan Ketenagakerjaan
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              Berbagai layanan digital yang tersedia untuk memudahkan urusan
              ketenagakerjaan Anda
            </p>
          </div>

          {status === "loading" && services.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative w-12 h-12 mb-4">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600 text-sm font-medium">
                Memuat layanan...
              </p>
            </div>
          )}

          {status === "failed" && (
            <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 mb-1">
                    Gagal memuat layanan
                  </h4>
                  <p className="text-sm text-red-700 mb-3">
                    {error || "Terjadi kesalahan saat mengambil data layanan"}
                  </p>
                  <button
                    onClick={() => dispatch(fetchServices())}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                    Coba Lagi
                  </button>
                </div>
              </div>
            </div>
          )}

          {status !== "loading" &&
            services.length === 0 &&
            status !== "failed" && (
              <div className="text-center py-16 bg-white rounded-xl border-2 border-gray-200 shadow-sm">
                <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 rounded-xl flex items-center justify-center">
                  <DynamicLucideIcon
                    iconName={landing?.icon}
                    className="w-7 h-7 text-gray-700"
                  />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">
                  Belum ada layanan
                </h4>
                <p className="text-sm text-gray-600">
                  Layanan akan ditampilkan di sini setelah ditambahkan
                </p>
              </div>
            )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {services?.map((service, index) => {
              const hasValidColor =
                service.color && service.color.startsWith("#");
              const serviceColor = hasValidColor ? service.color : "#3B82F6";

              return (
                <div
                  key={service.id || index}
                  onClick={() => handleServiceClick(service)}
                  className={`group relative bg-white rounded-2xl p-5 sm:p-6 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-2 overflow-hidden ${
                    isServicesVisible
                      ? "translate-y-0 opacity-100"
                      : "translate-y-16 opacity-0"
                  }`}
                  style={{
                    transitionDelay: `${(index % 6) * 100 + 200}ms`,
                  }}>
                  {logo && logo.image && (
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                      <div className="relative w-40 h-40 opacity-[0.02] group-hover:opacity-[0.04] transition-all duration-500 group-hover:scale-110">
                        <div
                          className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                          style={{
                            backgroundImage: `url(${logo.image})`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
                    style={{
                      background: `linear-gradient(135deg, ${serviceColor}08 0%, ${serviceColor}03 100%)`,
                    }}
                  />

                  <div className="relative z-10 flex flex-col h-full min-h-[240px]">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg shadow-sm"
                        style={{
                          backgroundColor: `${serviceColor}15`,
                          border: `2px solid ${serviceColor}30`,
                        }}>
                        <DynamicLucideIconService
                          iconName={service.icon}
                          className="w-8 h-8"
                          color={serviceColor}
                        />
                      </div>

                      {service.sub_items && service.sub_items.length > 0 && (
                        <div
                          className="px-3 py-1.5 rounded-full text-xs font-bold shadow-sm"
                          style={{
                            backgroundColor: `${serviceColor}15`,
                            color: serviceColor,
                            border: `1px solid ${serviceColor}30`,
                          }}>
                          {service.sub_items.length} Layanan
                        </div>
                      )}
                    </div>

                    <h4 className="text-lg font-bold mb-2 text-gray-900 line-clamp-2 min-h-[1rem] leading-snug">
                      {service.title}
                    </h4>

                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 flex-grow">
                      {service.description}
                    </p>

                    <div className="flex items-center justify-between border-t-2 border-gray-200 mt-auto">
                      <span
                        className="text-sm font-bold flex items-center gap-1.5 group-hover:gap-2 transition-all"
                        style={{ color: serviceColor }}>
                        {service.sub_items && service.sub_items.length > 0
                          ? "Lihat Detail"
                          : "Akses Sekarang"}
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>

                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:rotate-[-10deg]"
                        style={{
                          backgroundColor: `${serviceColor}15`,
                        }}>
                        <ArrowRight
                          className="w-5 h-5"
                          style={{ color: serviceColor }}
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className="absolute bottom-0 left-0 right-0 h-1.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-b-2xl shadow-lg"
                    style={{
                      backgroundColor: serviceColor,
                      boxShadow: `0 0 20px ${serviceColor}40`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pengumuman Section */}
      <section className="py-16 sm:py-20 bg-[#1F1F1F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1.5 bg-blue-50 rounded-lg mb-3">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                INFORMASI
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
              Informasi Terbaru
            </h2>
            <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
              Informasi terbaru dari Dinas Ketenagakerjaan Kota Balikpapan
            </p>
          </div>

          {publicStatus === "loading" && recentBlogs.length === 0 && (
            <div className="flex justify-center py-12">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-4 border-gray-600 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          )}

          {recentBlogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentBlogs.map((item, index) => {
                const primaryImage =
                  item.images?.find((img) => img.is_primary === 1) ||
                  item.images?.[0];

                return (
                  <div
                    key={item.id || index}
                    onClick={() => handleBlogClick(item)}
                    className="group relative bg-[#2F2F2F] rounded-xl p-6 border border-gray-600 hover:border-gray-400 transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 overflow-hidden">
                    {primaryImage && (
                      <div className="mb-4 rounded-lg overflow-hidden">
                        <img
                          src={primaryImage.image_data}
                          alt={item.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                    <div className="mb-4">
                      <h4 className="text-base font-bold text-white mb-2 line-clamp-2">
                        {item.name}
                      </h4>
                      <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">
                        {truncateText(stripHtml(item.description), 20)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {item.views || 0}
                      </div>
                    </div>
                    <div className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium">
                      Selengkapnya{" "}
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            publicStatus !== "loading" && (
              <div className="text-center py-12">
                <p className="text-gray-400">Belum ada informasi tersedia</p>
              </div>
            )
          )}

          {recentBlogs.length > 0 && (
            <div className="text-center mt-8">
              <Link
                to="/blogs"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Lihat Semua Informasi
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-[#2F2F2F] via-[#2F2F2F] to-[#2F2F2F] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                             radial-gradient(circle at 80% 80%, white 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide">
                MULAI SEKARANG
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
              Siap Menggunakan Layanan Kami?
            </h2>
            <p className="text-sm sm:text-base text-gray-200 mb-8 leading-relaxed">
              Daftar sekarang dan nikmati kemudahan akses ke berbagai layanan
              ketenagakerjaan yang tersedia
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#layanan"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-[#2F2F2F] rounded-xl font-bold hover:bg-gray-100 transition-all duration-200 hover:scale-105 text-sm shadow-xl">
                Jelajahi Layanan
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
              <Link
                to="/blogs"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-white/10 backdrop-blur-sm text-white rounded-xl font-bold hover:bg-white/20 transition-all duration-200 border-2 border-white/30 hover:scale-105 text-sm">
                Informasi Lebih Lanjut
                <Info className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Service Modal */}
      {selectedService && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
          onClick={handleCloseModal}>
          <div
            ref={modalRef}
            className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp sm:animate-modalScale"
            style={{
              transform:
                isMobile && isDragging
                  ? `translateY(${dragCurrent}px)`
                  : "translateY(0)",
              transition: isDragging ? "none" : "transform 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}>
            {isMobile && (
              <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing bg-white">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
              </div>
            )}

            <div
              className="relative p-6 sm:p-8 text-white overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${
                  selectedService.color && selectedService.color.startsWith("#")
                    ? selectedService.color
                    : "#3B82F6"
                } 0%, ${
                  selectedService.color && selectedService.color.startsWith("#")
                    ? selectedService.color + "dd"
                    : "#2563EB"
                } 100%)`,
              }}>
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                             radial-gradient(circle at 80% 80%, white 1px, transparent 1px)`,
                    backgroundSize: "50px 50px",
                  }}></div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseModal();
                }}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 hover:rotate-90 backdrop-blur-sm z-50">
                <X className="w-5 h-5 text-white" />
              </button>

              <div className="flex items-start gap-4 relative z-10">
                <div className="w-16 h-16 sm:w-18 sm:h-18 flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-4 ring-white/30 transition-transform duration-300 hover:scale-110">
                  <DynamicLucideIconService
                    iconName={selectedService.icon}
                    className="w-8 h-8 sm:w-10 sm:h-10 text-white"
                  />
                </div>

                <div className="flex-1 pr-12">
                  <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold mb-2">
                    {selectedService.sub_items?.length || 0} Layanan Tersedia
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">
                    {selectedService.title}
                  </h3>
                  <p className="text-white/90 text-sm sm:text-base leading-relaxed">
                    {selectedService.description}
                  </p>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
                <svg
                  viewBox="0 0 1200 120"
                  preserveAspectRatio="none"
                  className="w-full h-8 sm:h-12">
                  <path
                    d="M0,0 C150,100 350,0 600,50 C850,100 1050,0 1200,50 L1200,120 L0,120 Z"
                    fill="#FFFFFF"
                    fillOpacity="1"></path>
                </svg>
              </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8 max-h-[calc(85vh-220px)] sm:max-h-[calc(90vh-220px)] overflow-y-auto bg-white">
              <div className="mb-5">
                <h4 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                  Pilih Layanan
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 ml-5">
                  Klik untuk melihat detail dan mengakses layanan
                </p>
              </div>

              <div className="space-y-3">
                {selectedService?.sub_items?.map((subItem, index) => {
                  const isExpanded = expandedSubItem === index;
                  const serviceColor =
                    selectedService.color &&
                    selectedService.color.startsWith("#")
                      ? selectedService.color
                      : "#3B82F6";

                  return (
                    <div
                      key={subItem.id || index}
                      className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-all duration-300 hover:shadow-md animate-fadeIn"
                      style={{
                        animationDelay: `${index * 80}ms`,
                        opacity: 0,
                        animationFillMode: "forwards",
                      }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedSubItem(isExpanded ? null : index);
                        }}
                        className="w-full p-4 sm:p-5 bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 transition-all duration-300 text-left group">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                            style={{
                              background: `linear-gradient(135deg, ${serviceColor}20 0%, ${serviceColor}10 100%)`,
                            }}>
                            <DynamicLucideIconService
                              iconName={subItem.icon}
                              className="w-6 h-6 sm:w-7 sm:h-7"
                              color={serviceColor}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-gray-900 text-sm sm:text-base mb-0.5 transition-colors">
                              {subItem.title}
                            </h5>
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                              {subItem.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-300"
                              style={{
                                backgroundColor: `${serviceColor}15`,
                                color: serviceColor,
                              }}>
                              {isExpanded ? "Tutup" : "Lihat"}
                            </div>
                            <ChevronDown
                              className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-500 transition-all duration-300 flex-shrink-0 ${
                                isExpanded
                                  ? "rotate-180 text-gray-700"
                                  : "group-hover:translate-y-0.5"
                              }`}
                            />
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-4 sm:p-5 bg-gray-50 border-t-2 border-gray-200 animate-fadeIn">
                          <div className="mb-5">
                            <div className="flex items-start gap-3 mb-3">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                  backgroundColor: `${serviceColor}15`,
                                }}>
                                <Info
                                  className="w-4 h-4"
                                  style={{ color: serviceColor }}
                                />
                              </div>
                              <div className="flex-1">
                                <h6 className="font-semibold text-gray-900 text-xs sm:text-sm mb-1">
                                  Deskripsi Layanan
                                </h6>
                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                  {subItem.description}
                                </p>
                              </div>
                            </div>
                          </div>

                          <a
                            href={subItem.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="group/btn relative inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-bold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg w-full sm:w-auto justify-center"
                            style={{
                              background: `linear-gradient(135deg, ${serviceColor} 0%, ${serviceColor}dd 100%)`,
                            }}>
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                            <span className="relative">Akses Layanan</span>
                            <ArrowRight className="w-4 h-4 relative group-hover/btn:translate-x-1 transition-transform" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes modalScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
        .animate-modalScale {
          animation: modalScale 0.25s ease-out forwards;
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
      `}</style>
    </div>
  );
};
