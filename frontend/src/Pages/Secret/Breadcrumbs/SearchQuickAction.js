import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import PeriodCreatePage from "../_PPDB/__period/__app/_periodCreatePage";
import useIsMobile from "../../../Context/__useIsMobile";
import { Database } from "lucide-react";

const SearchQuickAction = ({ badgeData, totalVisible, totalHidden }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef(null);
  const isMobile = useIsMobile();

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsVisible(false);
    setTimeout(() => setIsModalOpen(false), 200); // Match transition duration
  };

  useEffect(() => {
    if (isModalOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
      if (!isMobile) document.body.style.paddingRight = "15px";

      const handleKeyDown = (e) => {
        if (e.key === "Escape") closeModal();
      };
      const handleClickOutside = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target))
          closeModal();
      };

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.body.style.overflow = "";
        if (!isMobile) document.body.style.paddingRight = "";
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isModalOpen, isMobile]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, []);

  const stats = [
    {
      label: "Total",
      value: Number(badgeData) || 0,
      icon: "📊",
      color: "bg-primary/10",
      textColor: "text-primary",
      bgColor: "bg-primary/10 border-primary/10",
    },
    {
      label: "Opened",
      value: Number(totalVisible) || 0,
      icon: "🟢",
      color: "bg-success/10",
      textColor: "text-success",
      bgColor: "bg-success/10 border-success/10",
    },
    {
      label: "Closed",
      value: Number(totalHidden) || 0,
      icon: "🔴",
      color: "bg-error/10",
      textColor: "text-error",
      bgColor: "bg-error/10 border-error/10",
    },
  ];

  const ModalContent = () => {
    const chartContainerRef = useRef(null);

    useEffect(() => {
      const handleResize = () => {
        if (chartContainerRef.current) {
          // Force a reflow to ensure the chart resizes correctly
          chartContainerRef.current.style.display = "none";
          chartContainerRef.current.offsetHeight; // Trigger reflow
          chartContainerRef.current.style.display = "";
        }
      };

      if (isVisible && chartContainerRef.current) {
        window.addEventListener("resize", handleResize);
        handleResize(); // Initial resize
      }

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, [isVisible]);

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create Period Modal"
        className="fixed inset-0 z-50 bg-black/40 flex justify-end transition-opacity duration-200 ease-out">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/20" onClick={closeModal} />

        {/* Modal panel */}
        <div
          ref={modalRef}
          style={{
            width: isMobile ? "100%" : "42rem",
            height: "100vh",
            overflowY: "auto",
            zIndex: 9999,
          }}
          className={`relative bg-white dark:bg-base-200 border-l border-gray-200 dark:border-base-300 shadow-sm backdrop-blur-sm transform transition-transform duration-200 ease-out ${
            isVisible ? "translate-x-0" : "translate-x-full"
          } ${isMobile ? "rounded-none" : "rounded-l-2xl"}`}>
          {/* Modal header gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
          {/* Modal content */}
          <div className="p-4 sm:p-6 h-full flex flex-col">
            <React.Suspense fallback={<div>Loading...</div>}>
              {isVisible && (
                <div ref={chartContainerRef}>
                  <PeriodCreatePage />
                </div>
              )}
            </React.Suspense>
            <button
              onClick={closeModal}
              aria-label="Close modal"
              className="mt-4 sm:mt-6 mb-16 sm:mb-6 w-full bg-gray-100 dark:bg-base-300 hover:bg-gray-200 dark:hover:bg-base-200 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl border border-gray-300 dark:border-base-300 transition-colors duration-150">
              <div className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">
                  arrow_back
                </span>
                <span className="text-sm sm:text-base">Close</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-base-200 dark:to-base-300 rounded-2xl shadow-sm backdrop-blur-sm transition-colors duration-200 border border-gray-200/50 dark:border-base-300/50">
        <div className="relative p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Header Section */}
          <div className="flex gap-4 sm:gap-6 items-start">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-sm backdrop-blur-sm flex items-center justify-center">
                <div className="text-white text-xl sm:text-2xl font-bold">
                  📝
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-400 rounded-full border-2 border-white dark:border-base-200 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
            <div className="flex-1 space-y-2 sm:space-y-3">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-base-content mb-1">
                  Inquiry Form
                </h3>
                <div className="flex items-center gap-2">
                  <div className="px-2 gap-1 flex items-center sm:px-3 py-1 bg-primary/10 text-primary text-xs sm:text-sm font-medium rounded-full border border-primary/10">
                    <Database className="size-4" />
                    <span>Portal Pendaftaran Siswa Baru</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className={`${stat.bgColor} rounded-xl p-2 sm:p-3 border transition-colors duration-150`}>
                    <div className="text-center space-y-1">
                      <div className="text-base sm:text-lg">{stat.icon}</div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {stat.label}
                      </p>
                      <p
                        className={`text-base sm:text-lg font-bold ${stat.textColor}`}>
                        {stat.value.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={openModal}
            aria-label="Open modal to add new label to question form"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl py-3 sm:py-4 px-6 transition-colors duration-200 shadow-sm backdrop-blur-sm hover:shadow-xl">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-lg sm:text-xl">
                  add
                </span>
              </div>
              <span className="font-semibold text-sm sm:text-lg">
                New Label To Question Form
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Render modal via portal only when open */}
      {isModalOpen && createPortal(<ModalContent />, document.body)}
    </>
  );
};

export default SearchQuickAction;
