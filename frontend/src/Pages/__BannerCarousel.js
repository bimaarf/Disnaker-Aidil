// src/components/BannerCarousel.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fetchBanners } from "../features/LandingPages/bannerSlice";

export default function BannerCarousel({
  heightProps = "h-64 sm:h-80 md:h-[500px]",
}) {
  const dispatch = useDispatch();
  const { banners, status, error } = useSelector((state) => state.banners);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Fetch banners pertama kali
  useEffect(() => {
    dispatch(fetchBanners({ page: 1, perPage: 10 }))
      .unwrap()
      .catch((err) => {
        console.error("Failed to fetch banners:", err);
        toast.error("Failed to fetch banners");
      });
  }, [dispatch]);

  // Auto slide setiap 5 detik (pause saat hover)
  useEffect(() => {
    if (!banners || banners.length === 0 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners, isHovered]);

  if (status === "loading") {
    return (
      <div
        className={`relative w-full ${heightProps} overflow-hidden rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin opacity-60 animation-delay-150"></div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div
        className={`relative w-full ${heightProps} overflow-hidden rounded-3xl bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-950 border border-red-200 dark:border-red-800`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-red-700 dark:text-red-300 font-medium text-center">
            {error || "Error loading banners"}
          </p>
        </div>
      </div>
    );
  }

  if (!banners || banners.length === 0) {
    return (
      <div
        className={`relative w-full ${heightProps} overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-slate-400 dark:text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
            No banners available
          </p>
          <p className="text-slate-400 dark:text-slate-600 text-sm mt-2">
            Check back later for updates
          </p>
        </div>
      </div>
    );
  }

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  return (
    <div
      className={`relative w-full ${heightProps} overflow-hidden rounded-3xl shadow-2xl group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      {/* Background blur effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>

      {/* Main container */}
      <div className="relative w-full h-full rounded-3xl overflow-hidden bg-black">
        {/* Slides */}
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-all duration-1000 ease-out transform ${
              index === currentIndex
                ? "opacity-100 scale-100 translate-x-0"
                : index < currentIndex
                ? "opacity-0 scale-105 -translate-x-full"
                : "opacity-0 scale-105 translate-x-full"
            }`}>
            <img
              src={banner.image_data}
              alt={banner.key || `Banner ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        ))}

        {/* Navigation buttons */}
        <button
          onClick={prevSlide}
          className="absolute top-1/2 left-6 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/20 hover:scale-110 transition-all duration-300 shadow-md backdrop-blur-sm"
          aria-label="Previous slide">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          onClick={nextSlide}
          className="absolute top-1/2 right-6 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/20 hover:scale-110 transition-all duration-300 shadow-md backdrop-blur-sm"
          aria-label="Next slide">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Progress bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/20">
          <div
            className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 transition-all duration-5000 ease-linear"
            style={{
              width: isHovered
                ? `${((currentIndex + 1) / banners.length) * 100}%`
                : "0%",
              animation: isHovered ? "none" : `progress 5s linear infinite`,
            }}></div>
        </div>

        {/* Slide counter */}
        <div className="absolute top-6 right-6 px-4 py-2 bg-black/30 backdrop-blur-md border border-white/20 text-white text-sm font-medium rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {currentIndex + 1} / {banners.length}
        </div>

        {/* Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 hover:scale-125 ${
                index === currentIndex
                  ? "w-8 h-3 bg-white rounded-full shadow-md backdrop-blur-sm"
                  : "w-3 h-3 bg-white/50 rounded-full hover:bg-white/80 backdrop-blur-sm"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Floating elements for extra visual appeal */}
        <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-white/20 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/5 w-1 h-1 bg-white/30 rounded-full animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 right-1/6 w-1.5 h-1.5 bg-white/25 rounded-full animate-pulse animation-delay-2000"></div>
      </div>

      <style>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }

        .animation-delay-150 {
          animation-delay: 150ms;
        }

        .animation-delay-1000 {
          animation-delay: 1000ms;
        }

        .animation-delay-2000 {
          animation-delay: 2000ms;
        }
      `}</style>
    </div>
  );
}
