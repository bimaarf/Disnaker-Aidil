import axios from "axios";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { removeMessage } from "../../features/chats/chatSlice";
import { useDispatch } from "react-redux";

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(isToday);
dayjs.extend(isYesterday);

export const ChatItems = ({
  broadcastChannelRef,
  messages,
  currentUser,
  handleRetryMessage,
  showNewMessageBadge,
  handleBadgeClick,
  theme = "light",
  isMobile = false,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const imageRef = useRef(null);
  const dispatch = useDispatch();
  const messagesContainerRef = useRef(null);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    message: null,
  });
  const [messageInfo, setMessageInfo] = useState(null);
  const [badgePosition, setBadgePosition] = useState({ left: 0, width: 0 });
  const [animatingMessages, setAnimatingMessages] = useState(new Set());
  const contextMenuRef = useRef(null);
  const [statusTransitions, setStatusTransitions] = useState({});

  const urlRegex =
    /(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*))/gi;

  const messageVariants = {
    pending: { opacity: 0.6, scale: 0.95 },
    transitioning: {
      opacity: [0.6, 0.8, 1],
      scale: [0.95, 0.98, 1],
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      },
    },
    sent: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        type: "spring",
        stiffness: 500,
        damping: 30,
      },
    },
    hidden: { opacity: 0, transition: { duration: 0.2 } },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2,
        delay: 0.2,
      },
    },
  };

  useEffect(() => {
    const updateBadgePosition = () => {
      if (messagesContainerRef.current) {
        const rect = messagesContainerRef.current.getBoundingClientRect();
        const containerWidth = rect.width;
        const contentWidth = containerWidth * (isMobile ? 0.7 : 0.5);
        const left = rect.left + (containerWidth - contentWidth) / 2;
        setBadgePosition({ left, width: contentWidth });
      }
    };

    updateBadgePosition();
    window.addEventListener("resize", updateBadgePosition);
    return () => window.removeEventListener("resize", updateBadgePosition);
  }, [isMobile]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("black", theme === "black");
    document.documentElement.classList.toggle(
      "wireframe",
      theme === "wireframe"
    );
  }, [theme]);

  useEffect(() => {
    if (messagesContainerRef.current && !showNewMessageBadge) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, showNewMessageBadge]);

  useEffect(() => {
    const transitions = {};
    messages.forEach((msg) => {
      const key = msg.id || msg.originalTempId;
      if (msg._isPending && !animatingMessages.has(key)) {
        transitions[key] = "pending";
      } else if (
        !msg._isPending &&
        msg.status === "delivered" &&
        animatingMessages.has(key)
      ) {
        transitions[key] = "transitioning";
        setTimeout(() => {
          setStatusTransitions((prev) => {
            const newTransitions = { ...prev };
            delete newTransitions[key];
            return newTransitions;
          });
          setAnimatingMessages((prev) => {
            const newSet = new Set(prev);
            newSet.delete(key);
            return newSet;
          });
        }, 500); // Sesuaikan dengan durasi transisi
      }
    });
    setStatusTransitions(transitions);
  }, [messages, animatingMessages]);

  const closeMediaPreview = () => {
    setPreviewOpen(false);
    setSelectedMedia(null);
    document.body.style.overflow = "auto";
  };

  const handleWheel = (event) => {
    if (!previewOpen || selectedMedia?.file_type?.startsWith("video/")) return;
    event.preventDefault();
    const zoomDirection = event.deltaY < 0 ? 1 : -1;
    const zoomFactor = 0.1;
    setZoomLevel((prev) =>
      Math.max(0.5, Math.min(3, prev + zoomDirection * zoomFactor))
    );
  };

  const handleDoubleClick = () => {
    setZoomLevel(1);
  };

  const handleContextMenu = (event, message) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      message,
    });
  };

  const handleArrowClick = (event, message) => {
    const rect = event.target.getBoundingClientRect();
    setContextMenu({
      visible: true,
      x: rect.left,
      y: rect.bottom + 5,
      message,
    });
  };

  const handleMenuOptionClick = (option) => {
    const { message } = contextMenu;
    switch (option) {
      case "Message info":
        setMessageInfo(message);
        break;
      case "Delete":
        if (
          String(message.sender_id) !== String(currentUser.id) &&
          String(message.recipient_id) !== String(currentUser.id)
        ) {
          alert("You can only delete your own messages.");
          return;
        }
        handleDeleteMessage(message);
        break;
      case "Reply":
      case "Copy":
      case "React":
      case "Forward":
      case "Pin":
      case "Star":
        console.log(`${option} message:`, message);
        break;
      default:
        break;
    }
    setContextMenu({ visible: false, x: 0, y: 0, message: null });
  };

  const handleDeleteMessage = async (message) => {
    try {
      console.log(`Deleting message: ${message.id}`);
      const response = await axios.delete(
        `${process.env.REACT_APP_API}api/messages/${message.id}`,
        {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
          },
        }
      );
      console.log(`Message deleted successfully:`, response.data);
      dispatch(
        removeMessage({
          chatRoomId: message.chat_room_id,
          messageId: message.id,
        })
      );
      broadcastChannelRef.current?.postMessage({
        type: "message_deleted",
        userId: currentUser?.id,
        chat_room_id: message.chat_room_id,
        message_id: message.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to delete message:", error);
      if (error.response && error.response.status === 404) {
        console.warn(
          `Message ${message.id} not found on server, checking local storage`
        );
        const storedMessages = JSON.parse(
          localStorage.getItem("messagesByRoom") || "{}"
        );
        const roomMessages = storedMessages[message.chat_room_id] || {};
        const localMessage = roomMessages[message.id];
        if (localMessage) {
          console.log(
            `Found message ${message.id} in local storage, removing from state`
          );
          dispatch(
            removeMessage({
              chatRoomId: message.chat_room_id,
              messageId: message.id,
            })
          );
          delete roomMessages[message.id];
          storedMessages[message.chat_room_id] = roomMessages;
          localStorage.setItem(
            "messagesByRoom",
            JSON.stringify(storedMessages)
          );
        } else {
          console.warn(
            `No local copy of message ${message.id} found, removing from state anyway`
          );
          dispatch(
            removeMessage({
              chatRoomId: message.chat_room_id,
              messageId: message.id,
            })
          );
        }
        broadcastChannelRef.current?.postMessage({
          type: "message_deleted",
          userId: currentUser?.id,
          chat_room_id: message.chat_room_id,
          message_id: message.id,
          timestamp: new Date().toISOString(),
        });
        alert("Message not found on server but removed locally.");
      } else {
        alert("Failed to delete message. Please try again.");
      }
    }
  };

  const openMediaPreview = (msg) => {
    setSelectedMedia(msg);
    setPreviewOpen(true);
    setZoomLevel(1);
    document.body.style.overflow = "hidden";
  };

  const ContextMenu = () => {
    if (!contextMenu.visible) return null;

    const options = [
      "Message info",
      "Reply",
      "Copy",
      "React",
      "Forward",
      "Pin",
      "Star",
      "Delete",
    ];

    return (
      <motion.div
        ref={contextMenuRef}
        style={{
          position: "fixed",
          top: contextMenu.y,
          left: contextMenu.x,
          zIndex: 1000,
        }}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.01 }}
        className="bg-[#1f2c34] text-white rounded-lg shadow-lg w-40">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => handleMenuOptionClick(option)}
            className="block w-full text-left px-4 py-2 hover:bg-base-300 text-sm">
            {option}
          </button>
        ))}
      </motion.div>
    );
  };

  const MessageInfoPanel = () => {
    if (!messageInfo) return null;

    const deliveredTime =
      messageInfo.is_delivered &&
      dayjs.utc(messageInfo.delivered_at).local().isValid()
        ? dayjs.utc(messageInfo.delivered_at).local().format("HH:mm")
        : null;

    const readTime =
      messageInfo.is_read && dayjs.utc(messageInfo.read_at).local().isValid()
        ? dayjs.utc(messageInfo.read_at).local().format("HH:mm")
        : null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.01 }}
          className="fixed top-0 right-0 w-80 h-full bg-[#1f2c34] text-white z-[1000] shadow-lg flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-[#2a3942]">
            <h2 className="text-lg">Message info</h2>
            <button onClick={() => setMessageInfo(null)} className="text-white">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {messageInfo.file_url &&
              messageInfo.file_type?.startsWith("image/") && (
                <img
                  src={messageInfo.file_url}
                  alt="Message content"
                  className="max-w-full rounded-lg mb-4"
                />
              )}
            {messageInfo.message && (
              <p className="text-sm mb-4">{messageInfo.message}</p>
            )}
            <div className="space-y-2">
              {deliveredTime && (
                <div className="flex items-center text-[#8696a0]">
                  <span className="material-symbols-outlined text-[18px] mr-2">
                    done
                  </span>
                  <span>Delivered at {deliveredTime}</span>
                </div>
              )}
              {readTime && (
                <div className="flex items-center text-[#8696a0]">
                  <span className="material-symbols-outlined text-[18px] mr-2">
                    done_all
                  </span>
                  <span>Read at {readTime}</span>
                </div>
              )}
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">Read by</h3>
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-[#8696a0]">
                    person
                  </span>
                  <span>You</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const uniqueMessages = React.useMemo(() => {
    const seenIds = new Set();
    const tempIdToRealId = new Map();

    messages.forEach((msg) => {
      if (msg.originalTempId && msg.id !== msg.originalTempId) {
        tempIdToRealId.set(msg.originalTempId, msg.id);
      }
    });

    return messages
      .filter((msg) => {
        const id = String(msg.id);
        if (tempIdToRealId.has(id)) return false;
        if (seenIds.has(id)) return false;
        seenIds.add(id);
        return true;
      })
      .sort((a, b) => {
        const aTime = new Date(a.original_created_at || a.created_at).getTime();
        const bTime = new Date(b.original_created_at || b.created_at).getTime();
        const aSeq = a.sequence || 0;
        const bSeq = b.sequence || 0;
        return aTime !== bTime ? aTime - bTime : aSeq - bSeq;
      });
  }, [messages]);

  const MediaPreviewModal = () => {
    const [showHeaderFooter, setShowHeaderFooter] = useState(true);
    if (!previewOpen || !selectedMedia) return null;
    const isVideo = selectedMedia.file_type?.startsWith("video/");

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-90 z-[999] select-none"
        onWheel={handleWheel}>
        <div className="relative w-full h-full flex flex-col">
          <div
            className="bg-[#1f2c34] text-white p-4 flex justify-between items-center transition-transform duration-300 ease-in-out"
            style={{
              transform: showHeaderFooter
                ? "translateY(0)"
                : "translateY(-100%)",
            }}>
            <div className="flex items-center space-x-3">
              <button onClick={closeMediaPreview} className="text-white">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <span>
                {selectedMedia.file_name || (isVideo ? "Video" : "Image")}
              </span>
            </div>
            <div className="flex space-x-4 items-center">
              {!isVideo && (
                <span className="text-xs text-gray-300">
                  {Math.round(zoomLevel * 100)}%
                </span>
              )}
              <button className="text-white">
                <span className="material-symbols-outlined">share</span>
              </button>
              <button className="text-white">
                <span className="material-symbols-outlined">download</span>
              </button>
              <button className="text-white">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>
          </div>
          <div
            className={`flex items-center justify-center bg-black overflow-hidden ${
              showHeaderFooter ? "flex-1" : "h-screen"
            }`}
            onClick={() => setShowHeaderFooter((prev) => !prev)}>
            <div className="relative w-full h-full flex items-center justify-center">
              {isVideo ? (
                <video
                  src={selectedMedia.file_url}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  onDoubleClick={handleDoubleClick}>
                  <img
                    ref={imageRef}
                    src={selectedMedia.file_url}
                    alt={selectedMedia.file_name || "Preview"}
                    className="w-full h-full object-contain transition-transform duration-75"
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: "center",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <div
            className="bg-[#1f2c34] p-4 flex items-center transition-transform duration-300 ease-in-out"
            style={{
              transform: showHeaderFooter
                ? "translateY(0)"
                : "translateY(100%)",
            }}>
            <input
              type="text"
              className="w-full rounded-full bg-base-300 text-white px-4 py-2 placeholder-[#8696a0]"
              placeholder="Type a message..."
            />
            <button className="ml-3 text-white">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
        {!isVideo && (
          <div
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm transition-opacity duration-300 ease-in-out"
            style={{
              opacity: showHeaderFooter ? 1 : 0,
              pointerEvents: showHeaderFooter ? "auto" : "none",
            }}>
            Scroll to zoom, Double-click to reset, Esc to exit
          </div>
        )}
      </div>
    );
  };

  const renderDeliveryStatus = (msg) => {
    if (String(msg.sender_id) !== String(currentUser.id)) return null;

    if (msg.status === "sending" || msg._isPending) {
      return (
        <span className="text-[#667781] dark:text-[#8696a0] flex">
          <span className="material-symbols-outlined text-[14px]">
            schedule
          </span>
        </span>
      );
    }

    if (msg.status === "failed") {
      return (
        <button
          onClick={() => handleRetryMessage(msg)}
          className="text-[#f05656] hover:text-[#d32f2f] flex items-center"
          title="Retry sending message">
          <span className="material-symbols-outlined text-[14px] mr-1">
            error
          </span>
          <span className="text-xs">Retry</span>
        </button>
      );
    }

    if (!msg.is_delivered) {
      return (
        <span className="text-[#667781] dark:text-[#8696a0] flex">
          <span className="material-symbols-outlined text-[14px]">done</span>
        </span>
      );
    }

    if (!msg.is_read) {
      return (
        <span className="text-[#667781] dark:text-[#8696a0] flex">
          <span className="material-symbols-outlined text-[14px]">done</span>
          <span className="material-symbols-outlined text-[14px] -ml-[8px]">
            done
          </span>
        </span>
      );
    }

    return (
      <span className="text-[#53bdeb] flex">
        <span className="material-symbols-outlined text-[14px]">done</span>
        <span className="material-symbols-outlined text-[14px] -ml-[8px]">
          done
        </span>
      </span>
    );
  };

  const renderFile = (msg) => {
    if (!msg.file_url) return null;

    const handleError = (event) => {
      console.error("Failed to load file:", msg.file_url);
      event.target.style.display = "none";
    };

    if (msg.file_type?.startsWith("image/")) {
      return (
        <div
          className="mb-2 cursor-pointer w-full"
          onClick={() => openMediaPreview(msg)}>
          <div className="relative w-full">
            <img
              src={msg.file_url}
              alt={msg.file_name || "Uploaded image"}
              className="w-full max-w-full rounded-lg object-contain"
              onError={handleError}
            />
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 rounded-full p-1">
              <span className="material-symbols-outlined text-white text-sm">
                download
              </span>
            </div>
          </div>
        </div>
      );
    } else if (msg.file_type?.startsWith("video/")) {
      return (
        <div
          className="mb-2 cursor-pointer w-full"
          onClick={() => openMediaPreview(msg)}>
          <div className="relative w-full">
            <video
              src={msg.file_url}
              className="w-full max-w-full rounded-lg object-contain"
              onError={handleError}
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-4xl bg-black bg-opacity-50 rounded-full p-2">
                play_arrow
              </span>
            </div>
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 rounded-full p-1">
              <span className="material-symbols-outlined text-white text-sm">
                download
              </span>
            </div>
          </div>
        </div>
      );
    } else {
      const getDocIcon = () => {
        if (msg.file_type === "application/pdf") return "picture_as_pdf";
        if (
          msg.file_type === "application/msword" ||
          msg.file_type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
          return "description";
        return "insert_drive_file";
      };

      return (
        <a
          href={msg.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-[#f0f2f5] dark:bg-base-300 rounded-lg p-2 mb-2 hover:bg-[#e9edef] dark:hover:bg-base-300 transition-colors">
          <div className="flex items-center">
            <span className="material-symbols-outlined text-[#54656f] dark:text-[#aebac1] mr-2">
              {getDocIcon()}
            </span>
            <span className="text-sm text-[#111b21] dark:text-[#e9edef] truncate flex-1">
              {msg.file_name || "Unnamed Document"}
            </span>
            <span className="material-symbols-outlined text-[#00a884] dark:text-[#00a884] ml-2">
              download
            </span>
          </div>
        </a>
      );
    }
  };

  const renderMessageText = (text) => {
    const parts = text.split(urlRegex);
    const urls = text.match(urlRegex) || [];
    return {
      renderedText: parts.map((part, index) =>
        urlRegex.test(part) ? (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00a884] hover:underline break-all">
            {part}
          </a>
        ) : (
          <span key={index} className="break-all">
            {part}
          </span>
        )
      ),
      detectedUrls: urls,
    };
  };

  const [expandedLinkPreviews, setExpandedLinkPreviews] = useState({});

  const renderLinkPreviews = (urls, message) => {
    if (!urls || urls.length === 0 || !message.link_preview) return null;

    const messageId = message.id || message.originalTempId;
    const isExpanded = expandedLinkPreviews[messageId] || false;

    let previews = [];
    try {
      previews =
        typeof message.link_preview === "string"
          ? JSON.parse(message.link_preview)
          : message.link_preview;
      if (!Array.isArray(previews)) previews = [previews];
    } catch (error) {
      console.error(
        `Failed to parse link_preview for message ${messageId}:`,
        error,
        message.link_preview
      );
      previews = [];
    }

    const visibleLinks = urls.slice(0, 5);
    const remainingLinks = urls.slice(5);
    const totalLinks = isExpanded
      ? visibleLinks.concat(remainingLinks)
      : visibleLinks;

    const gridClass =
      totalLinks.length === 1
        ? "grid grid-cols-1 gap-2 my-2 w-full"
        : "grid grid-cols-1 sm:grid-cols-2 gap-2 my-2 w-full";

    return (
      <div className={gridClass}>
        {totalLinks.map((url, index) => {
          const preview = previews.find((p) => p.url === url);
          const isLastItem =
            totalLinks.length % 2 !== 0 && index === totalLinks.length - 1;

          const itemClass = isLastItem
            ? "flex flex-col bg-[#e9edef] dark:bg-base-300 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow w-full col-span-2"
            : "flex flex-col bg-[#e9edef] dark:bg-base-300 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow w-full";

          return (
            <div key={`${messageId}-${url}-${index}`} className={itemClass}>
              {(preview?.image || preview?.icon) && (
                <div className="w-full h-32 overflow-hidden">
                  <img
                    src={preview.image || preview.icon}
                    alt="Link Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}
              <div className="p-3 flex-1">
                <a
                  href={preview?.url || url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#25d366] hover:underline font-semibold text-sm line-clamp-2 mb-1">
                  {preview?.title || url}
                </a>
                <p className="text-xs text-[#667781] dark:text-[#8696a0] line-clamp-3">
                  {preview?.description || "No description available"}
                </p>
              </div>
            </div>
          );
        })}

        {remainingLinks.length > 0 && !isExpanded && (
          <div
            className="flex flex-col bg-[#e9edef] dark:bg-base-300 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow w-full justify-center items-center p-3 cursor-pointer"
            onClick={() =>
              setExpandedLinkPreviews((prev) => ({
                ...prev,
                [messageId]: true,
              }))
            }>
            <p className="text-center text-sm text-[#667781] dark:text-[#8696a0]">
              {remainingLinks.length}+ more
            </p>
          </div>
        )}
      </div>
    );
  };

  const getDateLabel = (currentDate, prevDate) => {
    if (!currentDate || !dayjs(currentDate).isValid()) {
      console.warn("Invalid date:", currentDate);
      return null;
    }

    const current = dayjs(currentDate).local().startOf("day");

    if (
      !prevDate ||
      !dayjs(prevDate).isValid() ||
      !current.isSame(dayjs(prevDate).local().startOf("day"), "day")
    ) {
      if (current.isToday()) return "Today";
      if (current.isYesterday()) return "Yesterday";
      return current.format("DD MMMM YYYY");
    }
    return null;
  };

  const renderMessagesWithInfo = () => {
    const renderedMessages = [];
    let prevDate = null;

    uniqueMessages.forEach((msg, index) => {
      const isCurrentUser = String(msg.sender_id) === String(currentUser.id);
      const formattedTime = msg.created_at
        ? dayjs(msg.created_at).local().format("HH:mm")
        : "-";
      const stableKey = `${msg.chat_room_id}-${index}-${
        msg.id || msg.originalTempId || Date.now()
      }-${msg.created_at || ""}`;
      const dateLabel = getDateLabel(
        msg.original_created_at || msg.created_at,
        prevDate
      );
      const { renderedText, detectedUrls } = msg.message
        ? renderMessageText(msg.message)
        : { renderedText: null, detectedUrls: [] };

      if (dateLabel) {
        renderedMessages.push(
          <div
            key={`date-${msg.chat_room_id}-${index}-${dateLabel}`}
            className="flex items-center justify-center my-4">
            <div className="flex-1 h-px bg-[#e9edef] dark:bg-[#3b4a54]"></div>
            <span className="mx-3 px-2 py-1 bg-[#e9edef] dark:bg-[#3b4a54] text-[#667781] dark:text-[#8696a0] text-xs rounded-full">
              {dateLabel}
            </span>
            <div className="flex-1 h-px bg-[#e9edef] dark:bg-[#3b4a54]"></div>
          </div>
        );
      }

      renderedMessages.push(
        <AnimatePresence key={stableKey}>
          <motion.div
            onClick={() => setMessageInfo(null)}
            className={`flex w-full mb-3 ${
              isCurrentUser ? "justify-end" : "justify-start"
            }`}
            onContextMenu={(e) => handleContextMenu(e, msg)}
            variants={messageVariants}
            initial={
              msg._isPending
                ? "pending"
                : statusTransitions[msg.id || msg.originalTempId] ===
                  "transitioning"
                ? "transitioning"
                : "sent"
            }
            animate={
              statusTransitions[msg.id || msg.originalTempId] ===
              "transitioning"
                ? "transitioning"
                : msg._isPending
                ? "pending"
                : "sent"
            }
            exit="hidden">
            <div
              className={`relative ${
                isMobile ? "max-w-[70vh]" : "max-w-[50vh]"
              } p-3 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] group ${
                isCurrentUser
                  ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-l-lg rounded-br-lg"
                  : "bg-white dark:bg-[#262d31] text-[#111b21] dark:text-[#e9edef] rounded-r-lg rounded-bl-lg"
              } box-sizing-border-box overflow-hidden`}>
              <button
                onClick={(e) => handleArrowClick(e, msg)}
                className={`absolute top-2 ${
                  isCurrentUser ? "left-[-20px]" : "right-[-20px]"
                } text-[#667781] dark:text-[#8696a0] opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                <span className="material-symbols-outlined text-sm">
                  arrow_drop_down
                </span>
              </button>
              <div className="flex flex-col w-full overflow-hidden">
                {renderFile(msg)}
                {renderedText && (
                  <span className="text-sm break-words whitespace-pre-wrap overflow-x-hidden">
                    {renderedText}
                  </span>
                )}
                {renderLinkPreviews(detectedUrls, msg)}
                <div className="flex items-center justify-end mt-1">
                  <span className="text-[11px] text-[#667781] dark:text-[#8696a0] mr-1">
                    {formattedTime}
                  </span>
                  {isCurrentUser && renderDeliveryStatus(msg)}
                </div>
              </div>
              <div
                className={`absolute top-0 w-3 h-3 ${
                  isCurrentUser ? "right-[-9px]" : "left-[-9px]"
                }`}
                style={{
                  background: isCurrentUser
                    ? theme === "black"
                      ? "#005c4b"
                      : "#d9fdd3"
                    : theme === "black"
                    ? "#262d31"
                    : "white",
                  clipPath: isCurrentUser
                    ? "polygon(0 0, 100% 0, 0 100%)"
                    : "polygon(0 0, 100% 0, 100% 100%)",
                }}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      );

      prevDate = msg.original_created_at || msg.created_at;
    });

    return renderedMessages;
  };

  return (
    <div
      ref={messagesContainerRef}
      className={`break-words whitespace-pre-wrap min-h-0 relative overflow-y-auto overflow-x-hidden ${
        isMobile ? "w-full" : "w-full"
      }`}>
      {renderMessagesWithInfo()}
      <ContextMenu />
      <AnimatePresence>
        {showNewMessageBadge && (
          <motion.div
            initial={{ opacity: 0, y: isMobile ? 40 : 28 }}
            animate={{ opacity: 1, y: 24, transition: { duration: 0.3 } }}
            exit={{
              opacity: 0,
              y: isMobile ? 40 : 28,
              transition: { duration: 0.3 },
            }}
            className={`fixed ${isMobile ? "bottom-40" : "bottom-28"} mb-1`}
            style={{
              left:
                badgePosition.left + badgePosition.width / (isMobile ? 4 : 3),
              transform: "translateX(-50%)",
              maxWidth: badgePosition.width,
              zIndex: 1001,
            }}>
            <button
              className="bg-[#25d366] text-white rounded-full px-4 py-1 text-sm flex items-center shadow-lg hover:bg-[#20b559] transition-colors"
              onClick={handleBadgeClick}
              aria-label="Scroll to new messages">
              <motion.span
                className="material-symbols-outlined text-sm mr-1"
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}>
                arrow_downward
              </motion.span>
              New Message
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <MessageInfoPanel />
      <MediaPreviewModal />
    </div>
  );
};
