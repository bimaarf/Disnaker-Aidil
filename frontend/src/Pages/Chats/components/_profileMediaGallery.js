import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

const MediaGallery = ({
  isOpen,
  onClose,
  messages,
  theme = "black",
  isMobile = false,
}) => {
  const [activeTab, setActiveTab] = useState("media");
  const galleryRef = useRef(null);

  const urlRegex = new RegExp(
    /(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_.~#?&//=]*))/gi
  );

  const groupMessagesByMonth = (messages, type) => {
    if (!messages || messages.length === 0) return {};

    // Remove duplicates based on id or originalTempId
    const uniqueMessages = Array.from(
      new Map(
        messages.map((msg) => [msg.id || msg.originalTempId, msg])
      ).values()
    );

    let filteredMessages = [];
    switch (type) {
      case "media":
        filteredMessages = uniqueMessages.filter(
          (msg) =>
            msg.file_type?.startsWith("image/") ||
            msg.file_type?.startsWith("video/")
        );
        break;
      case "docs":
        filteredMessages = uniqueMessages.filter(
          (msg) =>
            msg.file_type === "application/pdf" ||
            msg.file_type === "application/msword" ||
            msg.file_type ===
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
        break;
      case "links":
        filteredMessages = uniqueMessages.filter(
          (msg) => msg.message && urlRegex.test(msg.message)
        );
        break;
      default:
        return {};
    }

    const groupedMessages = {};
    filteredMessages.forEach((msg) => {
      const date = new Date(msg.created_at || msg.timestamp || Date.now());
      const month = date.toLocaleString("default", { month: "long" });
      const year = date.getFullYear();
      const key = `${month} ${year}`;

      if (!groupedMessages[key]) {
        groupedMessages[key] = [];
      }
      groupedMessages[key].push(msg);
    });

    return groupedMessages;
  };

  const groupedMedia = groupMessagesByMonth(messages, "media");
  const groupedDocs = groupMessagesByMonth(messages, "docs");
  const groupedLinks = groupMessagesByMonth(messages, "links");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (galleryRef.current && !galleryRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDarkTheme = theme === "black";
  const bgColor = isDarkTheme ? "bg-[#0c1317]" : "bg-white";
  const textColor = isDarkTheme ? "text-[#e9edef]" : "text-[#111b21]";
  const secondaryTextColor = isDarkTheme ? "text-[#8696a0]" : "text-[#667781]";
  const borderColor = isDarkTheme ? "border-[#2a3942]" : "border-[#e9edef]";
  const mediaBgColor = isDarkTheme ? "bg-[#1f2c34]" : "bg-[#e9edef]";
  const activeTabColor = "text-[#00a884]";
  const activeTabBorderColor = "border-[#00a884]";

  const variants = {
    initial: { x: isMobile ? "100%" : 0, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: isMobile ? "100%" : 0, opacity: 0 },
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "media":
        return Object.keys(groupedMedia).length > 0 ? (
          <div className="flex flex-col">
            {Object.keys(groupedMedia).map((month) => (
              <div key={month} className="mb-6">
                <h3
                  className={`${secondaryTextColor} text-xs font-medium uppercase mb-2 px-4`}>
                  {month}
                </h3>
                <div className="grid grid-cols-3 gap-1 px-4">
                  {groupedMedia[month].map((msg, idx) => (
                    <div
                      key={msg.id || msg.originalTempId || idx}
                      className={`${mediaBgColor} aspect-square relative overflow-hidden`}>
                      {msg.file_type?.startsWith("image/") ? (
                        <img
                          src={msg.file_url || "/placeholder-image.jpg"}
                          alt={msg.file_name || "Media"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.parentElement.innerHTML = `
                              <div class="flex items-center justify-center h-full w-full">
                                <span class="material-symbols-outlined ${secondaryTextColor} text-4xl">image</span>
                              </div>
                            `;
                          }}
                        />
                      ) : (
                        <div className="relative w-full h-full">
                          <video
                            src={msg.file_url}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.parentElement.innerHTML = `
                                <div class="flex items-center justify-center h-full w-full">
                                  <span class="material-symbols-outlined ${secondaryTextColor} text-4xl">videocam</span>
                                </div>
                              `;
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-4xl bg-black bg-opacity-50 rounded-full p-2">
                              play_arrow
                            </span>
                          </div>
                        </div>
                      )}
                      {msg.download_available && (
                        <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-lg">
                            download
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 p-4">
            <span className="material-symbols-outlined text-4xl mb-2 text-gray-500">
              image
            </span>
            <p className={`${secondaryTextColor} text-center`}>
              Tidak ada media ditemukan
            </p>
          </div>
        );
      case "docs":
        return Object.keys(groupedDocs).length > 0 ? (
          <div className="flex flex-col">
            {Object.keys(groupedDocs).map((month) => (
              <div key={month} className="mb-6">
                <h3
                  className={`${secondaryTextColor} text-xs font-medium uppercase mb-2 px-4`}>
                  {month}
                </h3>
                <div className="px-4">
                  {groupedDocs[month].map((msg, idx) => (
                    <a
                      key={msg.id || msg.originalTempId || idx}
                      href={msg.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${mediaBgColor} flex items-center p-2 rounded-lg mb-2 hover:bg-opacity-80`}>
                      <span
                        className={`material-symbols-outlined ${secondaryTextColor} mr-3`}>
                        {msg.file_type === "application/pdf"
                          ? "picture_as_pdf"
                          : "description"}
                      </span>
                      <span className={`text-sm ${textColor} truncate flex-1`}>
                        {msg.file_name || "Dokumen Tanpa Nama"}
                      </span>
                      <span className="material-symbols-outlined text-[#00a884] ml-2">
                        download
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 p-4">
            <span className="material-symbols-outlined text-4xl mb-2 text-gray-500">
              description
            </span>
            <p className={`${secondaryTextColor} text-center`}>
              Tidak ada dokumen ditemukan
            </p>
          </div>
        );
      case "links":
        return Object.keys(groupedLinks).length > 0 ? (
          <div className="flex flex-col">
            {Object.keys(groupedLinks).map((month) => (
              <div key={month} className="mb-6">
                <h3
                  className={`${secondaryTextColor} text-xs font-medium uppercase mb-2 px-4`}>
                  {month}
                </h3>
                <div className="px-4">
                  {groupedLinks[month].map((msg, idx) => {
                    const links = msg.message.match(urlRegex) || [];
                    return links.map((link, linkIdx) => (
                      <a
                        key={`${
                          msg.id || msg.originalTempId || idx
                        }-${linkIdx}`}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${mediaBgColor} flex items-center p-2 rounded-lg mb-2 hover:bg-opacity-80`}>
                        <span
                          className={`material-symbols-outlined ${secondaryTextColor} mr-3`}>
                          link
                        </span>
                        <span className="text-sm text-[#00a884] truncate flex-1 hover:underline">
                          {link}
                        </span>
                      </a>
                    ));
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 p-4">
            <span className="material-symbols-outlined text-4xl mb-2 text-gray-500">
              link
            </span>
            <p className={`${secondaryTextColor} text-center`}>
              Tidak ada tautan ditemukan
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      ref={galleryRef}
      variants={variants}
      initial={{ x: "100%" }} // Mulai dari luar layar kanan
      animate={{ x: 0 }} // Geser ke posisi normal
      exit={{ x: "-100%" }} // Keluar ke kiri
      transition={{
        type: "tween",
        duration: 0.1, // Super fast (100ms)
        ease: "easeOut", // Sharp exit for snappy feel
      }}
      className={`${bgColor} ${textColor} flex flex-col h-full ${
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
        <h2 className="text-lg font-medium text-white">
          Media, Dokumen & Tautan
        </h2>
      </div>

      <div className="flex mb-3 border-b border-[#2a3942] sticky top-[68px] z-10 bg-inherit">
        <button
          onClick={() => setActiveTab("media")}
          className={`flex-1 py-3 border-b-2 text-center text-sm ${
            activeTab === "media"
              ? `${activeTabColor} ${activeTabBorderColor}`
              : `border-transparent ${secondaryTextColor}`
          }`}>
          Media
        </button>
        <button
          onClick={() => setActiveTab("docs")}
          className={`flex-1 py-3 border-b-2 text-center text-sm ${
            activeTab === "docs"
              ? `${activeTabColor} ${activeTabBorderColor}`
              : `border-transparent ${secondaryTextColor}`
          }`}>
          Dokumen
        </button>
        <button
          onClick={() => setActiveTab("links")}
          className={`flex-1 py-3 border-b-2 text-center text-sm ${
            activeTab === "links"
              ? `${activeTabColor} ${activeTabBorderColor}`
              : `border-transparent ${secondaryTextColor}`
          }`}>
          Tautan
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {renderTabContent()}
      </div>
    </motion.div>
  );
};

export default MediaGallery;
