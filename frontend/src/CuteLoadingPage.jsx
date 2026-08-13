import React, { useState, useEffect } from "react";

const CuteLoadingPage = ({
  loadingProgress = 0,
  logoData = "logo.png",
  loadingMessage = "Loading",
  onComplete,
}) => {
  const [loadingText, setLoadingText] = useState(loadingMessage);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [animationStage, setAnimationStage] = useState("loading");

  const imageUrl = logoData?.image
    ? logoData.image
    : "https://enggangfoundation.id/api-yz-v1/logo/images/logo.png";

  // Smooth progress transition
  useEffect(() => {
    if (loadingProgress !== currentProgress) {
      const diff = loadingProgress - currentProgress;
      const increment =
        diff > 0 ? Math.max(diff / 5, 2) : Math.min(diff / 5, -2);

      const timer = setTimeout(() => {
        setCurrentProgress((prev) => {
          const next = prev + increment;
          return loadingProgress > prev
            ? Math.min(next, loadingProgress)
            : Math.max(next, loadingProgress);
        });
      }, 10);

      return () => clearTimeout(timer);
    }
  }, [loadingProgress, currentProgress]);

  // Loading text animation
  useEffect(() => {
    const textInterval = setInterval(() => {
      setLoadingText((prev) => {
        const base = loadingMessage;
        const dotsCount = prev.replace(base, "").length;
        return dotsCount >= 3 ? base : prev + ".";
      });
    }, 400);

    return () => clearInterval(textInterval);
  }, [loadingMessage]);

  // Handle completion
  useEffect(() => {
    if (Math.round(currentProgress) >= 100 && !isComplete) {
      setAnimationStage("completing");
      const timer = setTimeout(() => {
        setIsComplete(true);
        setAnimationStage("complete");
        if (onComplete) {
          onComplete();
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [currentProgress, isComplete, onComplete]);

  // Success screen
  if (animationStage === "complete") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center transition-all duration-500">
        <div className="text-center space-y-6 animate-scale-in">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce-fast">
            <svg
              className="w-16 h-16 text-white"
              fill="currentColor"
              viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-3">
              Siap!
            </h1>
            <p className="text-gray-600 text-xl">Sistem sudah kembali normal</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-teal-200 rounded-full blur-3xl opacity-30 animate-pulse-fast"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-cyan-200 rounded-full blur-3xl opacity-30 animate-pulse-fast"></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-teal-300 rounded-full blur-3xl opacity-20 animate-pulse-fast"></div>

      {/* Floating Tools */}
      <div className="absolute top-32 right-20 opacity-10 animate-float-fast">
        <svg
          className="w-16 h-16 text-teal-600"
          fill="currentColor"
          viewBox="0 0 24 24">
          <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
        </svg>
      </div>
      <div className="absolute bottom-32 left-20 opacity-10 animate-float-fast">
        <svg
          className="w-12 h-12 text-cyan-600"
          fill="currentColor"
          viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      </div>

      <div className="text-center w-full max-w-2xl mx-auto px-8 relative z-10">
        {/* Logo + Gears Animation */}
        <div className="mb-12 relative">
          <div className="relative w-48 h-48 mx-auto">
            {/* Background Circle */}
            <div className="absolute inset-0 bg-teal-100 rounded-full animate-pulse-fast opacity-30"></div>

            {/* Gear 1 */}
            <div className="absolute top-8 left-8 animate-spin-fast">
              <svg width="60" height="60" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="20" fill="#14B8A6" opacity="0.8" />
                <circle cx="30" cy="30" r="12" fill="#fff" />
                <rect
                  x="27"
                  y="5"
                  width="6"
                  height="15"
                  rx="2"
                  fill="#14B8A6"
                />
                <rect
                  x="27"
                  y="40"
                  width="6"
                  height="15"
                  rx="2"
                  fill="#14B8A6"
                />
                <rect
                  x="5"
                  y="27"
                  width="15"
                  height="6"
                  rx="2"
                  fill="#14B8A6"
                />
                <rect
                  x="40"
                  y="27"
                  width="15"
                  height="6"
                  rx="2"
                  fill="#14B8A6"
                />
              </svg>
            </div>

            {/* Gear 2 */}
            <div className="absolute top-8 right-8 animate-spin-reverse">
              <svg width="50" height="50" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="17" fill="#06B6D4" opacity="0.8" />
                <circle cx="25" cy="25" r="10" fill="#fff" />
                <rect
                  x="22.5"
                  y="3"
                  width="5"
                  height="12"
                  rx="2"
                  fill="#06B6D4"
                />
                <rect
                  x="22.5"
                  y="35"
                  width="5"
                  height="12"
                  rx="2"
                  fill="#06B6D4"
                />
                <rect
                  x="3"
                  y="22.5"
                  width="12"
                  height="5"
                  rx="2"
                  fill="#06B6D4"
                />
                <rect
                  x="35"
                  y="22.5"
                  width="12"
                  height="5"
                  rx="2"
                  fill="#06B6D4"
                />
              </svg>
            </div>

            {/* Logo Center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={imageUrl}
                alt="Logo"
                className="w-24 h-24 object-contain animate-bounce-slow"
              />
            </div>

            {/* Wrench Animation */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-wiggle-fast">
              <svg width="40" height="40" viewBox="0 0 40 40">
                <path d="M15 25 L25 15 L28 18 L18 28 Z" fill="#0E7490" />
                <rect
                  x="12"
                  y="28"
                  width="15"
                  height="8"
                  rx="4"
                  fill="#0891B2"
                />
                <circle cx="27" cy="13" r="4" fill="#0891B2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-slide-up-fast">
          <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            {animationStage === "completing" ? "Finish!" : "Loading"}
          </span>
        </h1>

        {/* Description */}
        <p className="text-gray-600 text-lg mb-8 animate-slide-up-fast">
          {animationStage === "completing"
            ? "Tinggal sedikit lagi, sabar ya!"
            : "Sistem sedang diperbaiki untuk memberikan layanan terbaik"}
        </p>

        {/* Progress Bar */}
        <div className="mb-8 animate-slide-up-fast">
          <div className="relative w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-200 ease-out ${
                animationStage === "completing"
                  ? "bg-gradient-to-r from-teal-500 to-cyan-600"
                  : "bg-gradient-to-r from-teal-500 to-cyan-600"
              }`}
              style={{
                width: `${Math.max(currentProgress, 0)}%`,
                boxShadow: currentProgress > 0 ? `0 0 20px #14b8a680` : "none",
              }}
            />
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span className="text-gray-500">0%</span>
            <span
              className={`${
                animationStage === "completing"
                  ? "text-teal-600"
                  : "text-cyan-600"
              }`}>
              {Math.round(Math.max(currentProgress, 0))}%
            </span>
            <span className="text-gray-500">100%</span>
          </div>
        </div>

        {/* Loading Dots */}
        <div className="flex justify-center space-x-2 mb-8 animate-slide-up-fast">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                animationStage === "completing" ? "bg-teal-500" : "bg-cyan-500"
              }`}
              style={{
                animation: `bounce-dot 1s ease-in-out ${
                  index * 0.15
                }s infinite`,
                transform:
                  animationStage === "completing" ? "scale(1.2)" : "scale(1)",
              }}
            />
          ))}
        </div>

        {/* Status Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-teal-200 animate-scale-in-fast">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <div
              className={`w-3 h-3 rounded-full ${
                animationStage === "completing"
                  ? "bg-teal-500 animate-ping-fast"
                  : "bg-cyan-500 animate-ping-fast"
              }`}></div>
            <p className="text-gray-900 font-bold text-lg">
              {animationStage === "completing"
                ? "Finalisasi sistem..."
                : loadingText}
            </p>
          </div>
          <p className="text-gray-600">
            {animationStage === "completing"
              ? "Semua sudah siap untuk Anda!"
              : "Mohon tunggu, ini hanya butuh beberapa detik"}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes pulse-fast {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes spin-fast {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes bounce-fast {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes wiggle-fast {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-8deg); }
          75% { transform: rotate(8deg); }
        }
        @keyframes slide-up-fast {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in-fast {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
          40% { transform: translateY(-10px) scale(1.1); opacity: 1; }
        }
        @keyframes ping-fast {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-float-fast { animation: float-fast 2s ease-in-out infinite; }
        .animate-pulse-fast { animation: pulse-fast 1.5s ease-in-out infinite; }
        .animate-spin-fast { animation: spin-fast 4s linear infinite; }
        .animate-spin-reverse { animation: spin-reverse 3s linear infinite; }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        .animate-bounce-fast { animation: bounce-fast 0.6s ease-in-out infinite; }
        .animate-wiggle-fast { animation: wiggle-fast 0.8s ease-in-out infinite; }
        .animate-slide-up-fast { animation: slide-up-fast 0.5s ease-out forwards; }
        .animate-scale-in { animation: scale-in-fast 0.6s ease-out forwards; }
        .animate-scale-in-fast { animation: scale-in-fast 0.4s ease-out forwards; }
        .animate-ping-fast { animation: ping-fast 1s cubic-bezier(0, 0, 0.2, 1) infinite; }
      `}</style>
    </div>
  );
};

export default CuteLoadingPage;
