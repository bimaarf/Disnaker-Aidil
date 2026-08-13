import React, { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MediaGallery from "./_profileMediaGallery";

const ProfilePreview = ({
  user,
  isOpen,
  onClose,
  messages,
  theme,
  isMobile,
}) => {
  const previewRef = useRef(null);
  const [isMediaGalleryOpen, setIsMediaGalleryOpen] = useState(false);

  const handleCloseGallery = useCallback(
    () => setIsMediaGalleryOpen(false),
    []
  );
  const handleOpenGallery = useCallback(() => setIsMediaGalleryOpen(true), []);

  useEffect(() => {
    let ignoreNextClick = false;

    const handleClickOutside = (event) => {
      if (ignoreNextClick) {
        ignoreNextClick = false;
        return;
      }
      if (previewRef.current && !previewRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen && !isMediaGalleryOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    // Set flag saat preview baru dibuka
    if (isOpen) {
      ignoreNextClick = true;
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, onClose, isMediaGalleryOpen]);

  if (!isOpen || !user) return null;

  const imageMessages =
    messages?.filter((msg) => msg.file_type?.startsWith("image/")) || [];

  const isDarkTheme = theme === "black";
  const bgColor = isDarkTheme ? "bg-[#1f2c34]" : "bg-white";
  const textColor = isDarkTheme ? "text-[#e9edef]" : "text-[#111b21]";
  const secondaryTextColor = isDarkTheme ? "text-[#8696a0]" : "text-[#667781]";
  const borderColor = isDarkTheme ? "border-[#2a3942]" : "border-[#e9edef]";
  const mediaBgColor = isDarkTheme ? "bg-[#2a3942]" : "bg-[#e9edef]";

  const variants = {
    initial: { x: isMobile ? "100%" : 0, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: isMobile ? "100%" : 0, opacity: 0 },
  };

  const transition = {
    type: "tween",
    duration: 0.1, // Super fast (100ms)
    ease: "easeOut", // Sharp exit for snappy feel
  };
  return (
    <AnimatePresence mode="wait">
      {!isMediaGalleryOpen ? (
        <motion.div
          key="profile-preview"
          ref={previewRef}
          variants={variants}
          initial={{ x: "100%" }} // Mulai dari luar layar kanan
          animate={{ x: 0 }} // Geser ke posisi normal
          exit={{ x: "-100%" }} // Keluar ke kiri
          transition={transition} // Terapkan transisi super cepat
          className={`flex-shrink-0 h-full ${bgColor} ${textColor} flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent ${
            isMobile
              ? "fixed inset-0 z-50 w-full max-w-full"
              : "w-full border-l " + borderColor
          }`}>
          <div
            className={`bg-[#1f2c34] p-4 flex items-center sticky top-0 z-10 ${borderColor} border-b`}>
            <button onClick={onClose} className="text-white mr-3">
              <span className="material-symbols-outlined">
                {isMobile ? "arrow_back" : "close"}
              </span>
            </button>
            <h2 className="text-lg font-medium text-white">Profil</h2>
          </div>

          <div className="p-4">
            <div className="flex justify-center mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-500 flex items-center justify-center">
                {user.avatar ? (
                  <img
                    src={`${process.env.REACT_APP_API}user/images/${user.avatar}`}
                    alt={user.name || "Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-6xl text-gray-300">
                    person
                  </span>
                )}
              </div>
            </div>
            <h3 className="text-xl font-medium text-center">
              {user.name || "Tanpa Nama"}
            </h3>
            <p className={`text-sm ${secondaryTextColor} text-center`}>
              {user.email || "Tidak ada email"}
            </p>
          </div>

          <div className="px-4 py-2">
            <h4 className={`text-sm ${secondaryTextColor} mb-1`}>Status</h4>
            <p className="text-sm">
              {user.status || "Tidak ada status tersedia"}
            </p>
          </div>

          <div className="px-4 py-2">
            <button
              className="flex justify-between items-center w-full"
              onClick={handleOpenGallery}>
              <h4 className={`text-sm ${secondaryTextColor}`}>Media</h4>
              <div className="flex items-center">
                <span className={`text-sm ${secondaryTextColor} mr-2`}>
                  {imageMessages.length}
                </span>
                <span
                  className={`material-symbols-outlined ${secondaryTextColor} text-sm`}>
                  chevron_right
                </span>
              </div>
            </button>
            {imageMessages.length > 0 ? (
              <div className="flex space-x-2 overflow-x-auto mt-2">
                {imageMessages.slice(0, 4).map((msg, index) => (
                  <div
                    key={index}
                    className={`${mediaBgColor} w-20 h-20 rounded-lg overflow-hidden flex-shrink-0`}>
                    <img
                      src={msg.file_url}
                      alt={msg.file_name || "Chat image"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-sm ${secondaryTextColor}`}>
                Tidak ada media tersedia
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <div
          className={`flex-shrink-0 h-full ${bgColor} ${textColor} flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent ${
            isMobile
              ? "fixed inset-0 z-50 w-full max-w-full"
              : "w-full border-l " + borderColor
          }`}>
          <MediaGallery
            key="media-gallery"
            isOpen={isMediaGalleryOpen}
            onClose={handleCloseGallery}
            messages={messages}
            theme={theme}
            isMobile={isMobile}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProfilePreview;
