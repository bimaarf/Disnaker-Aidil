import axios from "axios";
import imageCompression from "browser-image-compression";
import dayjs from "dayjs";
import { AnimatePresence, motion } from "framer-motion";
import debounce from "lodash/debounce";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import useIsMobile from "../../Context/__useIsMobile";
import { truncateText } from "../../Context/__useTruncate";
import { selectUser } from "../../features/authentication/AuthSlice";
import {
  addChatRoom,
  addMessage,
  addMessages,
  confirmChatRoom,
  fetchAllRoomMessages,
  fetchMessages,
  handleMessageFailed,
  markMessagesAsRead,
  removeMessage,
  removePendingMessage,
  resetUnreadCountForRoom,
  selectOrderedMessages,
  sendMessage,
  setActiveRoom,
  setChatRooms,
  updateMessageStatus,
  updateUnreadCount,
} from "../../features/chats/chatSlice";
import {
  selectLocalTheme,
  toggleLocalTheme,
} from "../../features/LandingPages/themeSlice";
import { useSocket } from "../../utils/SocketContext";
import { ChatItems } from "./chatItems";
import ProfilePreview from "./components/profilePreview";
import NewChatModal from "./newChatModal";

// Konfigurasi
const CONFIG = {
  MAX_FILE_SIZE: 250 * 1024 * 1024, // 250MB
  MAX_MESSAGES: 1000,
  ALLOWED_FILE_TYPES: {
    image: ["image/jpeg", "image/png", "image/gif"],
    video: ["video/mp4", "video/webm", "video/quicktime"],
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
  PREVIEW_CACHE_TTL: 24 * 60 * 60 * 1000, // 24 jam
  MAX_PREVIEW_CACHE_SIZE: 100, // Batas cache
  DEBOUNCE_PREVIEW_MS: 500, // Debounce untuk fetch preview
  IMAGE_COMPRESSION: {
    maxSizeMB: 1, // Maksimum ukuran gambar setelah kompresi
    maxWidthOrHeight: 1920, // Resolusi maksimum
    useWebWorker: true, // Gunakan Web Worker untuk performa
  },
  MESSAGES_PER_PAGE: 20, // Sesuaikan dengan backend default
};

const urlRegex =
  /(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_.~#?&//=]*))/gi;

const Chat = () => {
  const dispatch = useDispatch();
  const messagesByRoom =
    useSelector((state) => state.chat.messagesByRoom) || {};
  const chatRooms = useSelector((state) => state.chat.chatRooms) || [];
  const receivedUnreadCounts =
    useSelector((state) => state.chat.receivedUnreadCounts) || {};
  const activeRoom = useSelector((state) => state.chat.activeRoom);

  const orderedMessages = useSelector((state) =>
    selectOrderedMessages(activeRoom)(state)
  );

  const currentUser = useSelector(selectUser);
  const isRehydrated = useSelector((state) => state._persist?.rehydrated);
  const { socket, isConnected, userStatus } = useSocket();
  const isMobile = useIsMobile();
  const theme = useSelector(selectLocalTheme);

  const [newMessage, setNewMessage] = useState("");
  const [detectedLinks, setDetectedLinks] = useState([]);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [recipientId, setRecipientId] = useState(null);
  const [showNewMessageBadge, setShowNewMessageBadge] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [readError, setReadError] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [isProfilePreviewOpen, setIsProfilePreviewOpen] = useState(false);
  const [linkPreviews, setLinkPreviews] = useState([]);
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const defaultTitle = useRef(document.title);

  const chatContainerRef = useRef(null);
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const docInputRef = useRef(null);
  const loadingRef = useRef(null);
  const hasFetched = useRef(false);
  const isMarkingRead = useRef(false);
  const isAtBottom = useRef(true);
  const prevScrollHeight = useRef(0);
  const joinedRoomsRef = useRef(new Set());
  const sentTempIds = useRef(new Set());
  const broadcastChannelRef = useRef(null);
  const previewCacheRef = useRef(new Map());
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  // Inisialisasi BroadcastChannel
  useEffect(() => {
    broadcastChannelRef.current = new BroadcastChannel("chat_channel");
    return () => broadcastChannelRef.current?.close();
  }, []);

  // Dynamic textarea resizing
  useEffect(() => {
    const textarea = messageInputRef.current;
    if (textarea) {
      const resizeTextarea = () => {
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
      };
      resizeTextarea();
      textarea.addEventListener("input", resizeTextarea);
      return () => textarea.removeEventListener("input", resizeTextarea);
    }
  }, [newMessage]);

  // Optimasi deteksi link
  const detectLinks = useCallback((text) => {
    if (!text) return [];
    return [...(text.matchAll(urlRegex) || [])].map((match) => match[0]);
  }, []);

  // Debounce fetchPreviews
  const fetchPreviews = useMemo(
    () =>
      debounce(async (links) => {
        if (!links.length) {
          setLinkPreviews([]);
          setIsLoadingPreviews(false);
          return;
        }

        setIsLoadingPreviews(true);
        try {
          const previews = await Promise.all(
            links.map(async (url) => {
              // ❗ HAPUS slice
              const cached = previewCacheRef.current.get(url);
              if (
                cached &&
                Date.now() - cached.timestamp < CONFIG.PREVIEW_CACHE_TTL
              ) {
                return cached.data;
              }

              try {
                const response = await axios.get(
                  `${process.env.REACT_APP_SOCKET_URL}/api/link-preview`,
                  { params: { url }, timeout: 7000 }
                );
                const previewData = { ...response.data, url };
                if (
                  previewCacheRef.current.size >= CONFIG.MAX_PREVIEW_CACHE_SIZE
                ) {
                  const oldestKey = previewCacheRef.current.keys().next().value;
                  previewCacheRef.current.delete(oldestKey);
                }
                previewCacheRef.current.set(url, {
                  data: previewData,
                  timestamp: Date.now(),
                });
                return previewData;
              } catch (error) {
                console.error(
                  `Failed to load preview for ${url}:`,
                  error.message
                );
                const errorPreview = {
                  url,
                  title: url,
                  description: "Unable to load preview",
                  icon: null,
                  image: null,
                  error: true,
                };
                previewCacheRef.current.set(url, {
                  data: errorPreview,
                  timestamp: Date.now(),
                });
                return errorPreview;
              }
            })
          );
          // setLinkPreviews(previews.filter((p) => p && !p.error));
          setLinkPreviews(
            links.map((url) => {
              const found = previews.find((p) => p.url === url);
              if (found && !found.error) return found;

              // Fallback jika gagal
              return {
                url,
                title: url,
                description: "No preview available",
                image: null,
                icon: null,
                error: false,
              };
            })
          );
        } catch (error) {
          console.error("Error fetching link previews:", error);
          setLinkPreviews([]);
        } finally {
          setIsLoadingPreviews(false);
        }
      }, CONFIG.DEBOUNCE_PREVIEW_MS),
    []
  );

  // Fetch link previews
  useEffect(() => {
    fetchPreviews(detectedLinks);
    return () => fetchPreviews.cancel();
  }, [detectedLinks, fetchPreviews]);

  // Cleanup URL.createObjectURL
  useEffect(() => {
    return () => {
      if (filePreview && filePreview !== "document") {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  // Pending messages cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      Object.entries(messagesByRoom).forEach(([roomId, messages]) => {
        Object.values(messages).forEach((msg) => {
          if (
            msg._isPending &&
            now - new Date(msg.created_at).getTime() > 30000 &&
            msg.status !== "failed"
          ) {
            dispatch(
              updateMessageStatus({
                messageIds: [msg.id],
                chatRoomId: roomId,
                status: {
                  status: "failed",
                  error: "Message timed out",
                  last_updated_at: new Date().toISOString(),
                  _isPending: false,
                },
              })
            );
            broadcastChannelRef.current?.postMessage({
              type: "message_failed",
              userId: currentUser?.id,
              message_id: msg.id,
              chat_room_id: roomId,
              error: "Message timed out",
              timestamp: new Date().toISOString(),
            });
            dispatch(
              removePendingMessage({
                tempId: msg.id,
                chatRoomId: roomId,
              })
            );
          }
        });
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [messagesByRoom, dispatch, currentUser?.id]);
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        document.title = defaultTitle.current;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Infinite Scroll
  const loadMore = useCallback(
    debounce(() => {
      setPage((prev) => prev + 1);
    }, 300),
    []
  );

  useEffect(() => {
    if (!chatRoomId || !hasMore || isLoadingMessages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMessages) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => {
      if (loadingRef.current) {
        observer.unobserve(loadingRef.current);
      }
      loadMore.cancel();
    };
  }, [chatRoomId, hasMore, isLoadingMessages, loadMore]);

  // Fetch messages
  useEffect(() => {
    if (!chatRoomId || !currentUser?.token || !isRehydrated) return;

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const container = chatContainerRef.current;
        const previousHeight = container ? container.scrollHeight : 0;

        const response = await dispatch(
          fetchMessages({ chatRoomId, page, perPage: CONFIG.MESSAGES_PER_PAGE })
        ).unwrap();

        const { messages, meta } = response;
        const formattedMessages = messages.map((msg) => ({
          ...msg,
          id: String(msg.id),
          chat_room_id: String(msg.chat_room_id),
          isLocal: false,
          _sortKey: new Date(
            msg.original_created_at || msg.created_at
          ).getTime(),
        }));

        dispatch(addMessages(formattedMessages));
        setHasMore(page < meta.last_page);

        if (page === 1 && formattedMessages.length > 0) {
          requestAnimationFrame(() => {
            if (container) {
              container.scrollTop = container.scrollHeight;
              isAtBottom.current = true;
            }
          });
        } else if (page > 1 && container) {
          requestAnimationFrame(() => {
            const newHeight = container.scrollHeight;
            container.scrollTop = newHeight - previousHeight;
          });
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        setHasMore(false);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [chatRoomId, page, currentUser?.token, isRehydrated, dispatch]);

  const emitGetUnreadCount = useCallback(
    debounce(
      (roomId, userId) => {
        if (!isConnected || !socket || !roomId || !userId) return;
        socket.emit("get_unread_count", {
          chat_room_id: roomId,
          user_id: userId,
        });
      },
      500,
      { leading: true }
    ),
    [socket, isConnected]
  );

  const handleMessagesRead = useCallback(
    ({ chat_room_id, message_ids, user_id }) => {
      const roomId = String(chat_room_id);
      if (message_ids?.length) {
        dispatch(
          updateMessageStatus({
            messageIds: message_ids.map(String),
            status: {
              is_read: true,
              read_at: new Date().toISOString(),
              status: "read",
              last_updated_at: new Date().toISOString(),
            },
            chatRoomId: roomId,
          })
        );
        const messages = messagesByRoom[roomId]
          ? Object.values(messagesByRoom[roomId])
          : [];
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && message_ids.includes(String(lastMessage.id))) {
          dispatch(
            setChatRooms(
              chatRooms.map((room) =>
                String(room.id) === roomId
                  ? {
                      ...room,
                      last_message: {
                        ...room.last_message,
                        is_read: true,
                        read_at: new Date().toISOString(),
                        status: "read",
                      },
                    }
                  : room
              )
            )
          );
        }
      }
      if (String(user_id) === String(currentUser?.id)) {
        dispatch(resetUnreadCountForRoom({ roomId }));
        emitGetUnreadCount(roomId, user_id);
      }
    },
    [dispatch, currentUser?.id, emitGetUnreadCount, messagesByRoom, chatRooms]
  );

  const updateUnreadCountImmediate = useCallback(
    (roomId, unreadCount) => {
      dispatch(updateUnreadCount({ roomId, unreadCount }));
    },
    [dispatch]
  );

  const handleUnreadCountUpdate = useCallback(
    ({ chat_room_id, unread_count }) => {
      const roomId = String(chat_room_id);
      updateUnreadCountImmediate(roomId, unread_count);
      dispatch(
        setChatRooms(
          chatRooms.map((room) =>
            String(room.id) === roomId
              ? { ...room, message_unread: unread_count }
              : room
          )
        )
      );
    },
    [dispatch, chatRooms, updateUnreadCountImmediate]
  );

  const handleMessagesDelivered = useCallback(
    ({ chat_room_id, message_ids }) => {
      const roomId = String(chat_room_id);
      if (roomId !== String(chatRoomId) || !message_ids?.length) return;

      const uniqueMessageIds = [...new Set(message_ids.map(String))].filter(
        (id) => !sentTempIds.current.has(id)
      );
      if (uniqueMessageIds.length === 0) return;

      dispatch(
        updateMessageStatus({
          messageIds: uniqueMessageIds,
          status: {
            is_delivered: true,
            delivered_at: new Date().toISOString(),
            last_updated_at: new Date().toISOString(),
            status: "delivered",
          },
          chatRoomId: roomId,
          replace: false, // Ensure we don't overwrite existing messages
        })
      );

      const messages = messagesByRoom[roomId]
        ? Object.values(messagesByRoom[roomId])
        : [];
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && message_ids.includes(String(lastMessage.id))) {
        dispatch(
          setChatRooms(
            chatRooms.map((room) =>
              String(room.id) === roomId
                ? {
                    ...room,
                    last_message: {
                      ...room.last_message,
                      is_delivered: true,
                      delivered_at: new Date().toISOString(),
                      status: "delivered",
                    },
                  }
                : room
            )
          )
        );
      }
    },
    [dispatch, chatRoomId, messagesByRoom, chatRooms]
  );

  useEffect(() => {
    if (!socket || !chatRoomId || !recipientId) return;
    const interval = setInterval(() => {
      socket.emit(
        "check_recipient_status",
        { recipient_id: recipientId },
        (response) => {
          if (response.online && messagesByRoom[chatRoomId]) {
            const pendingMessages = Object.values(
              messagesByRoom[chatRoomId]
            ).filter((msg) => msg.status === "sent" && !msg.is_delivered);
            if (pendingMessages.length) {
              dispatch(
                updateMessageStatus({
                  messageIds: pendingMessages.map((msg) => msg.id),
                  status: {
                    is_delivered: true,
                    delivered_at: new Date().toISOString(),
                    last_updated_at: new Date().toISOString(),
                    status: "delivered",
                  },
                  chatRoomId,
                })
              );
            }
          }
        }
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [socket, chatRoomId, recipientId, messagesByRoom, dispatch]);

  const markMessageAsRead = useCallback(
    debounce(
      async (roomId, userId, retryCount = 0) => {
        if (isMarkingRead.current || !isConnected || !socket) return;
        isMarkingRead.current = true;
        try {
          const messages = messagesByRoom[String(roomId)]
            ? Object.values(messagesByRoom[String(roomId)])
            : [];
          const unreadMessageIds = messages
            .filter(
              (msg) =>
                String(msg.recipient_id) === String(userId) &&
                !msg.is_read &&
                !msg.isLocal
            )
            .map((msg) => String(msg.id));
          if (!unreadMessageIds.length) {
            setReadError(null);
            emitGetUnreadCount(roomId, userId);
            return;
          }
          await dispatch(
            markMessagesAsRead({
              chatRoomId: String(roomId),
              messageIds: unreadMessageIds,
            })
          ).unwrap();
          socket.emit(
            "mark_messages_as_read",
            {
              chat_room_id: String(roomId),
              user_id: String(userId),
              message_ids: unreadMessageIds,
            },
            (response) => {
              if (!response?.success && retryCount < 3) {
                markMessageAsRead(roomId, userId, retryCount + 1);
              } else if (!response?.success) {
                setReadError(
                  "Failed to mark messages as read. Click to retry."
                );
              } else {
                setReadError(null);
                if (response.message_ids?.length) {
                  dispatch(
                    updateMessageStatus({
                      messageIds: response.message_ids.map(String),
                      status: {
                        is_read: true,
                        read_at: new Date().toISOString(),
                        last_updated_at: new Date().toISOString(),
                      },
                      chatRoomId: String(roomId),
                    })
                  );
                }
                emitGetUnreadCount(roomId, userId);
              }
            }
          );
        } catch (error) {
          if (retryCount < 3) {
            markMessageAsRead(roomId, userId, retryCount + 1);
          } else {
            setReadError("Failed to mark messages as read. Click to retry.");
          }
        } finally {
          isMarkingRead.current = false;
        }
      },
      500,
      { leading: true }
    ),
    [dispatch, socket, isConnected, messagesByRoom, emitGetUnreadCount]
  );

  const handleManualRetry = useCallback(() => {
    if (chatRoomId && currentUser?.id) {
      markMessageAsRead(chatRoomId, currentUser.id);
    }
  }, [chatRoomId, currentUser?.id, markMessageAsRead]);

  // Scroll handling
  useLayoutEffect(() => {
    if (!chatContainerRef.current || !chatRoomId) return;

    const container = chatContainerRef.current;
    const messages = messagesByRoom[String(chatRoomId)]
      ? Object.values(messagesByRoom[String(chatRoomId)])
      : [];

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const { scrollTop, scrollHeight, clientHeight } = container;
          const isBottom = scrollHeight - scrollTop - clientHeight < 50;

          if (isBottom !== isAtBottom.current) {
            isAtBottom.current = isBottom;

            if (isBottom && messages.length > 0) {
              setShowNewMessageBadge(false);
              markMessageAsRead(chatRoomId, currentUser?.id);
              dispatch(resetUnreadCountForRoom({ roomId: chatRoomId }));
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    if (messages.length > 0) {
      const wasAtBottom = isAtBottom.current;
      const newScrollHeight = container.scrollHeight;

      if (newScrollHeight !== prevScrollHeight.current) {
        if (wasAtBottom) {
          container.scrollTop = newScrollHeight;
          setShowNewMessageBadge(false);
          markMessageAsRead(chatRoomId, currentUser?.id);
          dispatch(resetUnreadCountForRoom({ roomId: chatRoomId }));
        } else if (
          String(messages[messages.length - 1]?.sender_id) !==
          String(currentUser?.id)
        ) {
          setShowNewMessageBadge(true);
        }
        prevScrollHeight.current = newScrollHeight;
      }
    }

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [
    chatRoomId,
    currentUser?.id,
    messagesByRoom,
    markMessageAsRead,
    dispatch,
  ]);

  const handleSelectChatRoom = useCallback(
    async (room) => {
      const roomId = String(room.id);
      setChatRoomId(roomId);
      setRecipientId(
        String(room.recipient_id) === String(currentUser?.id)
          ? room.sender_id
          : room.recipient_id
      );
      setPage(1);
      setHasMore(true);
      dispatch(setActiveRoom(roomId));
      setShowNewMessageBadge(false);
      setReadError(null);
      try {
        if (
          !messagesByRoom[roomId] ||
          Object.keys(messagesByRoom[roomId]).length === 0
        ) {
          await dispatch(
            fetchMessages({
              chatRoomId: roomId,
              page: 1,
              perPage: CONFIG.MESSAGES_PER_PAGE,
            })
          ).unwrap();
        }
        if (isAtBottom.current) markMessageAsRead(roomId, currentUser?.id);
        emitGetUnreadCount(roomId, currentUser?.id);
      } catch (error) {
        console.error("Error loading room messages:", error);
      }
    },
    [
      dispatch,
      currentUser?.id,
      messagesByRoom,
      markMessageAsRead,
      emitGetUnreadCount,
    ]
  );

  const handleFileChange = useCallback(async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > CONFIG.MAX_FILE_SIZE) {
      alert("File size too large! Maximum 250MB.");
      return;
    }

    if (!CONFIG.ALLOWED_FILE_TYPES[type].includes(file.type)) {
      alert(
        `Unsupported ${type} type! Only ${
          type === "image"
            ? "JPG, PNG, GIF"
            : type === "video"
            ? "MP4, WebM, QuickTime"
            : "PDF, DOC, DOCX"
        }.`
      );
      return;
    }

    let processedFile = file;
    if (type === "image") {
      try {
        processedFile = await imageCompression(file, CONFIG.IMAGE_COMPRESSION);
        console.log(
          `Compressed image from ${file.size} to ${processedFile.size} bytes`
        );
      } catch (error) {
        console.error("Image compression failed:", error);
        alert("Failed to compress image. Using original file.");
      }
    }

    if (processedFile.size > CONFIG.MAX_FILE_SIZE) {
      alert("Compressed file size still too large! Maximum 250MB.");
      return;
    }

    setSelectedFile(processedFile);
    setMediaType(type);
    setFilePreview(
      type === "document" ? "document" : URL.createObjectURL(processedFile)
    );
    setShowAttachmentOptions(false);
  }, []);

  const handleRemoveFile = useCallback(() => {
    if (filePreview && filePreview !== "document") {
      URL.revokeObjectURL(filePreview);
    }
    setSelectedFile(null);
    setFilePreview(null);
    setMediaType(null);
    [fileInputRef, videoInputRef, docInputRef].forEach((ref) => {
      if (ref.current) ref.current.value = null;
    });
  }, [filePreview]);
  const sequenceCounter = useRef(0); // Initialize sequence counter
  const currentRoom = useMemo(() => {
    return chatRooms.find((room) => String(room.id) === String(chatRoomId));
  }, [chatRoomId, chatRooms]);

  const handleSendMessage = useCallback(
    async (formDataOverride, forcedTempId = null) => {
      if (
        !chatRoomId ||
        !recipientId ||
        !isConnected ||
        (!newMessage.trim() && !selectedFile && !formDataOverride) ||
        !isRehydrated
      ) {
        return;
      }

      const tempId =
        forcedTempId ||
        `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const clientTimestamp = new Date().toISOString();
      const sortKey = performance.now();
      const sequence = ++sequenceCounter.current;
      const isTempRoom = chatRoomId?.startsWith("temp-");
      const isFirstMessage = isTempRoom && !currentRoom?.has_messages;
      const shouldMarkPending = !isTempRoom && !isFirstMessage;

      // Dapatkan informasi recipient untuk temporary room
      const recipient = currentRoom?.recipient || {
        id: recipientId,
        name: "New Contact", // Default name
      };

      const messagePayload = {
        id: tempId,
        chat_room_id: chatRoomId,
        sender_id: currentUser.id,
        recipient_id: recipientId,
        message: newMessage.trim() || null,
        created_at: clientTimestamp,
        original_created_at: clientTimestamp,
        status: "sending",
        isLocal: true,
        originalTempId: tempId,
        media_type: selectedFile ? mediaType : null,
        file_name: selectedFile ? selectedFile.name : null,
        file_type: selectedFile ? selectedFile.type : null,
        is_delivered: false,
        is_read: false,
        sequence,
        _sortKey: sortKey,
        link_preview:
          linkPreviews.length > 0 ? JSON.stringify(linkPreviews) : null,
        _isPending: shouldMarkPending,
      };

      // Tambahkan default room di Redux jika belum ada
      dispatch(
        addChatRoom({
          id: chatRoomId,
          name: recipient.name || "New Chat",
          recipient: {
            id: recipientId,
            name: recipient.name || "New Chat",
          },
          participants: [currentUser.id, recipientId],
          created_at: clientTimestamp,
          updated_at: clientTimestamp,
          isTemp: isTempRoom,
        })
      );

      // Optimistik tampilkan pesan
      dispatch(addMessage(messagePayload));

      // Broadcast pesan sementara ke tab lain
      broadcastChannelRef.current?.postMessage({
        type: "pending_message",
        userId: currentUser?.id,
        message: messagePayload,
        timestamp: clientTimestamp,
      });

      // Reset input dan media
      setNewMessage("");
      setDetectedLinks([]);
      messageInputRef.current?.focus();
      handleRemoveFile();

      // Emit socket
      socket.emit("send_message", messagePayload);

      // Build form data
      const formData = formDataOverride || new FormData();
      if (!formDataOverride) {
        formData.append("chat_room_id", chatRoomId);
        formData.append("sender_id", currentUser.id);
        formData.append("recipient_id", recipientId);
        formData.append("id", tempId);
        if (newMessage.trim()) formData.append("message", newMessage.trim());
        if (selectedFile) {
          formData.append("file", selectedFile);
          formData.append("media_type", mediaType);
          formData.append("file_name", selectedFile.name);
          formData.append("file_type", selectedFile.type);
        }
        formData.append("originalTempId", tempId);
        formData.append("sequence", sequence);
        formData.append("original_created_at", clientTimestamp);
        if (linkPreviews.length > 0) {
          formData.append("link_preview", JSON.stringify(linkPreviews));
        }
      }

      try {
        const response = await dispatch(sendMessage(formData)).unwrap();

        // Jika server mengembalikan room baru
        if (response.new_room && response.chat_room) {
          const realRoom = response.chat_room;
          const realRoomId = String(realRoom.id);
          const tempRoomId = chatRoomId;

          // Dispatch konfirmasi room baru
          dispatch(
            confirmChatRoom({
              tempId: tempRoomId,
              newRoom: {
                ...realRoom,
                id: realRoomId,
                recipient: realRoom.recipient || {
                  id: recipientId,
                  name: realRoom.recipient_name || "New Contact",
                },
              },
            })
          );

          // Broadcast konfirmasi room baru ke tab lain
          broadcastChannelRef.current?.postMessage({
            type: "room_confirmed",
            userId: currentUser?.id,
            tempId: tempRoomId,
            newRoom: {
              ...realRoom,
              id: realRoomId,
              recipient: realRoom.recipient || {
                id: recipientId,
                name: realRoom.recipient_name || "New Contact",
              },
            },
            timestamp: new Date().toISOString(),
          });

          // Set activeRoom ke real room
          dispatch(setActiveRoom(realRoomId));
          setChatRoomId(realRoomId);
        }

        // Update status pesan
        dispatch(
          updateMessageStatus({
            messageIds: [tempId, response.id],
            chatRoomId: response.chat_room_id,
            status: {
              ...response,
              status: response.is_read
                ? "read"
                : response.is_delivered
                ? "delivered"
                : "sent",
              original_created_at: clientTimestamp,
              sequence,
              _sortKey: sortKey,
              _isPending: false,
            },
            replace: true,
          })
        );

        // Broadcast message confirmed
        broadcastChannelRef.current?.postMessage({
          type: "message_confirmed",
          userId: currentUser?.id,
          tempId,
          messageId: response.id,
          message: {
            ...response,
            status: response.is_read
              ? "read"
              : response.is_delivered
              ? "delivered"
              : "sent",
            original_created_at: clientTimestamp,
            sequence,
            isLocal: false,
            _sortKey: sortKey,
            _isPending: false,
          },
          timestamp: new Date().toISOString(),
        });

        sentTempIds.current.add(tempId);
        sentTempIds.current.add(response.id);
        if (sentTempIds.current.size > 1000) {
          sentTempIds.current = new Set([...sentTempIds.current].slice(-500));
        }
        localStorage.setItem(
          "sentTempIds",
          JSON.stringify([...sentTempIds.current])
        );
      } catch (error) {
        const errorMessage =
          error?.message?.includes("file") || error?.error?.includes("file")
            ? "Failed to upload file. Check type or size."
            : "Failed to send message";

        dispatch(
          updateMessageStatus({
            messageIds: [tempId],
            chatRoomId,
            status: {
              ...messagePayload,
              status: "failed",
              error: errorMessage,
              last_updated_at: new Date().toISOString(),
              _isPending: false,
            },
          })
        );

        broadcastChannelRef.current?.postMessage({
          type: "message_failed",
          userId: currentUser?.id,
          message_id: tempId,
          chat_room_id: chatRoomId,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        });
      }
    },
    [
      newMessage,
      selectedFile,
      mediaType,
      chatRoomId,
      recipientId,
      isConnected,
      isRehydrated,
      dispatch,
      currentUser?.id,
      handleRemoveFile,
      linkPreviews,
      socket,
      currentRoom,
      activeRoom,
    ]
  );

  const handleRetryMessage = useCallback(
    (messageId, chatRoomId) => {
      if (!isConnected || !isRehydrated) return;

      const roomId = String(chatRoomId);
      const message = messagesByRoom[roomId]?.[String(messageId)];

      if (!message || !message.id) {
        console.warn(
          `No message found for retry: ${messageId}, room: ${roomId}`
        );
        return;
      }

      // Ambil data asli pesan
      const retryPayload = {
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        chat_room_id: roomId,
        sender_id: currentUser.id,
        recipient_id: currentRoom?.recipient?.id || recipientId,
        message: message.message || null,
        created_at: new Date().toISOString(),
        original_created_at: message.original_created_at || message.created_at,
        status: "sending",
        isLocal: true,
        originalTempId: message.id,
        media_type: message.media_type || null,
        file_name: message.file_name || null,
        file_type: message.file_type || null,
        is_delivered: false,
        is_read: false,
        sequence: ++sequenceCounter.current,
        _sortKey: performance.now(),
        _isPending: true,
        link_preview: message.link_preview
          ? JSON.parse(message.link_preview)
          : null,
      };

      // Optimistik tampilkan pesan retry
      dispatch(addMessage(retryPayload));

      // Broadcast pesan retry ke tab lain
      broadcastChannelRef.current?.postMessage({
        type: "pending_message",
        userId: currentUser?.id,
        message: retryPayload,
        timestamp: new Date().toISOString(),
      });

      // Build form data untuk retry
      const formData = new FormData();
      formData.append("chat_room_id", roomId);
      formData.append("sender_id", currentUser.id);
      formData.append(
        "recipient_id",
        currentRoom?.recipient?.id || recipientId
      );
      formData.append("id", retryPayload.id);
      if (message.message) formData.append("message", message.message);
      if (message.file_name && !message.isLocalFileProcessed) {
        // Jika file ada, ambil dari storage atau kembalikan error
        console.warn(
          `Retry with file not supported yet for message: ${messageId}`
        );
        dispatch(
          updateMessageStatus({
            messageIds: [retryPayload.id],
            chatRoomId: roomId,
            status: {
              status: "failed",
              error: "File retry not supported. Please resend manually.",
              last_updated_at: new Date().toISOString(),
              _isPending: false,
            },
          })
        );
        return;
      }
      formData.append("originalTempId", message.id);
      formData.append("sequence", retryPayload.sequence);
      formData.append("original_created_at", retryPayload.original_created_at);
      if (message.link_preview)
        formData.append("link_preview", message.link_preview);

      // Kirim ulang ke server
      dispatch(sendMessage(formData))
        .unwrap()
        .then((response) => {
          dispatch(
            updateMessageStatus({
              messageIds: [retryPayload.id, response.id],
              chatRoomId: roomId,
              status: {
                ...response,
                status: response.is_read
                  ? "read"
                  : response.is_delivered
                  ? "delivered"
                  : "sent",
                original_created_at: retryPayload.original_created_at,
                _isPending: false,
              },
              replace: true,
            })
          );
          broadcastChannelRef.current?.postMessage({
            type: "message_confirmed",
            userId: currentUser?.id,
            tempId: retryPayload.id,
            messageId: response.id,
            message: {
              ...response,
              status: response.is_read
                ? "read"
                : response.is_delivered
                ? "delivered"
                : "sent",
              original_created_at: retryPayload.original_created_at,
            },
            timestamp: new Date().toISOString(),
          });
        })
        .catch((error) => {
          dispatch(
            updateMessageStatus({
              messageIds: [retryPayload.id],
              chatRoomId: roomId,
              status: {
                status: "failed",
                error: error.message || "Failed to retry message",
                last_updated_at: new Date().toISOString(),
                _isPending: false,
              },
            })
          );
          broadcastChannelRef.current?.postMessage({
            type: "message_failed",
            userId: currentUser?.id,
            message_id: retryPayload.id,
            chat_room_id: roomId,
            error: error.message || "Failed to retry message",
            timestamp: new Date().toISOString(),
          });
        });

      // Hapus pesan gagal asli setelah retry berhasil dimulai
      dispatch(removeMessage({ chatRoomId: roomId, messageId: messageId }));
    },
    [
      isConnected,
      isRehydrated,
      messagesByRoom,
      currentUser,
      currentRoom,
      recipientId,
      dispatch,
    ]
  );

  useEffect(() => {
    const handleRetryWithFile = async () => {
      if (!selectedFile || !chatRoomId) return;
      const tempMessage = Object.values(messagesByRoom[chatRoomId] || {}).find(
        (msg) => msg.status === "failed" && msg.file_name
      );
      if (tempMessage) {
        let processedFile = selectedFile;
        if (tempMessage.media_type === "image") {
          try {
            processedFile = await imageCompression(
              selectedFile,
              CONFIG.IMAGE_COMPRESSION
            );
            console.log(
              `Compressed retry image from ${selectedFile.size} to ${processedFile.size} bytes`
            );
          } catch (error) {
            console.error("Image compression failed for retry:", error);
            alert("Failed to compress image. Using original file.");
          }
        }

        if (processedFile.size > CONFIG.MAX_FILE_SIZE) {
          alert("Compressed file size still too large! Maximum 250MB.");
          return;
        }

        const formData = new FormData();
        formData.append("chat_room_id", String(tempMessage.chat_room_id));
        formData.append("sender_id", String(currentUser?.id));
        formData.append("recipient_id", String(tempMessage.recipient_id));
        const newTempId = `temp-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 11)}`;
        formData.append("id", newTempId);
        if (tempMessage.message)
          formData.append("message", tempMessage.message);
        formData.append("file", processedFile);
        formData.append("media_type", tempMessage.media_type);
        formData.append("file_name", processedFile.name);
        formData.append("file_type", processedFile.type);
        formData.append("originalTempId", newTempId);
        dispatch(
          removePendingMessage({
            tempId: String(tempMessage.id),
            chatRoomId: String(tempMessage.chat_room_id),
          })
        );
        handleSendMessage(formData, newTempId);
      }
    };
    handleRetryWithFile();
  }, [
    selectedFile,
    chatRoomId,
    messagesByRoom,
    currentUser?.id,
    dispatch,
    handleSendMessage,
  ]);

  const handleBadgeClick = useCallback(() => {
    if (chatContainerRef.current && chatRoomId) {
      requestAnimationFrame(() => {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      });
      isAtBottom.current = true;
      markMessageAsRead(chatRoomId, currentUser?.id);
      setShowNewMessageBadge(false);
      dispatch(resetUnreadCountForRoom({ roomId: chatRoomId }));
    }
  }, [chatRoomId, currentUser?.id, markMessageAsRead, dispatch]);

  const getLastMessagePreview = useCallback(
    (room) => {
      const roomId = String(room.id);
      const roomMessages = messagesByRoom[roomId]
        ? Object.values(messagesByRoom[roomId])
        : [];
      const lastRoomMessage =
        roomMessages.length > 0
          ? roomMessages.reduce((latest, msg) => {
              const msgTime = msg.created_at
                ? new Date(msg.created_at).getTime()
                : 0;
              const latestTime = latest.created_at
                ? new Date(latest.created_at).getTime()
                : 0;
              return msgTime > latestTime ? msg : latest;
            }, roomMessages[0])
          : room.last_message && room.last_message.created_at
          ? room.last_message
          : null;
      if (!lastRoomMessage) {
        return { text: "No messages yet", timestamp: "", status: null };
      }
      const isCurrentUser =
        String(lastRoomMessage.sender_id) === String(currentUser?.id);
      const recipientId =
        String(room.recipient_id) === String(currentUser.id)
          ? room.sender_id
          : room.recipient_id;
      const isRecipientOnline =
        userStatus[String(recipientId)]?.online === true;
      const textContent = lastRoomMessage.message
        ? lastRoomMessage.message
        : lastRoomMessage.media_type === "video"
        ? "Video"
        : lastRoomMessage.media_type === "image"
        ? "Photo"
        : lastRoomMessage.file_name || "No messages yet";
      let status = lastRoomMessage.status || null;
      let statusTooltip = "";
      if (status === "failed") {
        statusTooltip = "Failed to send";
      } else if (lastRoomMessage.is_read) {
        status = "read";
        statusTooltip = "Read";
      } else if (lastRoomMessage.is_delivered) {
        status = "delivered";
        statusTooltip = "Delivered";
      } else if (lastRoomMessage.isLocal) {
        status = "pending";
        statusTooltip = "Sending...";
      } else {
        status = "sent";
        statusTooltip = isRecipientOnline ? "Sent" : "Sent (Recipient Offline)";
      }
      return {
        text: isCurrentUser ? `You: ${textContent}` : textContent,
        timestamp: lastRoomMessage.created_at
          ? dayjs(lastRoomMessage.created_at).format("HH:mm")
          : "",
        status,
        statusTooltip,
      };
    },
    [messagesByRoom, currentUser?.id, userStatus]
  );

  const handleAvatarClick = useCallback((e) => {
    e.stopPropagation();
    setIsProfilePreviewOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!broadcastChannelRef.current) return;
    const handleBroadcastMessage = (event) => {
      if (event.data.userId !== currentUser?.id) return;
      if (event.data.type === "message_confirmed") {
        const { tempId, messageId, message } = event.data;
        if (
          sentTempIds.current.has(messageId) ||
          sentTempIds.current.has(tempId)
        )
          return;
        dispatch(
          updateMessageStatus({
            messageIds: [messageId, tempId],
            status: {
              ...message,
              id: messageId,
              originalTempId: tempId,
              last_updated_at:
                message.last_updated_at || new Date().toISOString(),
              isLocal: false,
              _isPending: false, // Pastikan _isPending diatur ke false
            },
            chatRoomId: String(message.chat_room_id),
            replace: true,
          })
        );
        // Hapus pesan pending secara eksplisit
        if (tempId && messagesByRoom[message.chat_room_id]?.[tempId]) {
          dispatch(
            removePendingMessage({
              tempId: tempId,
              chatRoomId: String(message.chat_room_id),
            })
          );
        }
        sentTempIds.current.add(String(messageId));
        sentTempIds.current.add(String(tempId));
        localStorage.setItem(
          "sentTempIds",
          JSON.stringify([...sentTempIds.current])
        );
      } else if (event.data.type === "messages_added") {
        const validMessages = event.data.messages.filter((msg) => {
          if (!msg?.id) return false;
          const roomId = String(msg.chat_room_id);
          return (
            !messagesByRoom[roomId]?.[String(msg.id)] &&
            !sentTempIds.current.has(String(msg.id)) &&
            !sentTempIds.current.has(String(msg.originalTempId))
          );
        });
        if (validMessages.length > 0) {
          dispatch(addMessages(validMessages));
          validMessages.forEach((msg) => {
            if (String(msg.sender_id) === String(currentUser?.id)) {
              sentTempIds.current.add(String(msg.id));
              if (msg.originalTempId)
                sentTempIds.current.add(String(msg.originalTempId));
            }
          });
          localStorage.setItem(
            "sentTempIds",
            JSON.stringify([...sentTempIds.current])
          );
        }
      } else if (event.data.type === "message_deleted") {
        const { chat_room_id, message_id } = event.data;
        dispatch(
          removeMessage({
            chatRoomId: String(chat_room_id),
            messageId: String(message_id),
          })
        );
        sentTempIds.current.delete(String(message_id));
        localStorage.setItem(
          "sentTempIds",
          JSON.stringify([...sentTempIds.current])
        );
      } else if (event.data.type === "message_failed") {
        const { message_id, chat_room_id, error, timestamp } = event.data;
        dispatch(
          handleMessageFailed({
            message_id: String(message_id),
            chat_room_id: String(chat_room_id),
            error,
            timestamp,
          })
        );
        sentTempIds.current.delete(String(message_id));
        localStorage.setItem(
          "sentTempIds",
          JSON.stringify([...sentTempIds.current])
        );
      } else if (event.data.type === "request_state_sync") {
        broadcastChannelRef.current.postMessage({
          type: "state_sync",
          userId: currentUser?.id,
          messagesByRoom,
          sentTempIds: [...sentTempIds.current],
        });
      } else if (event.data.type === "state_sync") {
        const { messagesByRoom: remoteMessages, sentTempIds: remoteTempIds } =
          event.data;
        Object.entries(remoteMessages).forEach(([roomId, messages]) => {
          const localMessages = messagesByRoom[roomId]
            ? Object.values(messagesByRoom[roomId])
            : [];
          const validMessages = Object.values(messages).filter((remoteMsg) => {
            const localMsg = localMessages.find(
              (m) => String(m.id) === String(remoteMsg.id)
            );
            if (!localMsg) return true;
            const localUpdated = new Date(
              localMsg.last_updated_at || remoteMsg.created_at
            ).getTime();
            const remoteUpdated = new Date(
              remoteMsg.last_updated_at || remoteMsg.created_at
            ).getTime();
            return (
              remoteUpdated > localUpdated ||
              (!localMsg.is_delivered && remoteMsg.is_delivered) ||
              (!localMsg.is_read && remoteMsg.is_read)
            );
          });
          if (validMessages.length > 0) dispatch(addMessages(validMessages));
        });
        remoteTempIds.forEach((id) => {
          if (!sentTempIds.current.has(id)) sentTempIds.current.add(id);
        });
        localStorage.setItem(
          "sentTempIds",
          JSON.stringify([...sentTempIds.current])
        );
      }
    };
    broadcastChannelRef.current.onmessage = handleBroadcastMessage;
    return () => {
      if (broadcastChannelRef.current)
        broadcastChannelRef.current.onmessage = null;
    };
  }, [currentUser?.id, dispatch, messagesByRoom]);

  const handleMessagesUpdated = useCallback(
    ({ chat_room_id, user_id }) => {
      if (String(user_id) === String(currentUser?.id)) {
        dispatch(fetchMessages({ chatRoomId: String(chat_room_id), page: 1 }));
      }
    },
    [dispatch, currentUser?.id]
  );

  const handleLastMessageUpdated = useCallback(
    (lastMessage) => {
      const roomId = String(lastMessage.chat_room_id);
      dispatch(
        setChatRooms(
          chatRooms.map((room) =>
            String(room.id) === roomId
              ? { ...room, last_message: lastMessage }
              : room
          )
        )
      );
    },
    [dispatch, chatRooms]
  );

  useEffect(() => {
    if (!socket || !currentUser || !isConnected || !chatRooms.length) return;
    const unjoined = chatRooms.filter(
      (room) => !joinedRoomsRef.current.has(String(room.id))
    );
    if (unjoined.length > 0) {
      unjoined.forEach((room) => {
        const roomId = String(room.id);
        socket.emit("join_chat", {
          userId: String(currentUser.id),
          chat_room_id: roomId,
        });
        joinedRoomsRef.current.add(roomId);
      });
    }
    socket.on("messageDeleted", ({ chat_room_id, message_id }) => {
      dispatch(
        removeMessage({
          chatRoomId: String(chat_room_id),
          messageId: String(message_id),
        })
      );
      broadcastChannelRef.current?.postMessage({
        type: "message_deleted",
        userId: currentUser?.id,
        chat_room_id: String(chat_room_id),
        message_id: String(message_id),
      });
    });
    socket.on(
      "message_failed",
      ({ message_id, chat_room_id, error, timestamp }) => {
        dispatch(
          handleMessageFailed({
            message_id: String(message_id),
            chat_room_id: String(chat_room_id),
            error,
            timestamp,
          })
        );
        broadcastChannelRef.current?.postMessage({
          type: "message_failed",
          userId: currentUser?.id,
          message_id: String(message_id),
          chat_room_id: String(chat_room_id),
          error,
          timestamp,
        });
      }
    );
    socket.on("messages_delivered", handleMessagesDelivered);
    socket.on("messages_updated", handleMessagesUpdated);
    socket.on("last_message_updated", handleLastMessageUpdated);
    socket.on("messages_read", handleMessagesRead);
    socket.on("unread_count_update", handleUnreadCountUpdate);
    socket.on("recipient_status", ({ recipient_id, online, chat_room_id }) => {
      console.log(
        `Recipient ${recipient_id} status: ${online ? "online" : "offline"}`
      );
      if (
        String(recipient_id) === String(recipientId) &&
        String(chat_room_id) === String(chatRoomId)
      ) {
        dispatch(
          updateMessageStatus({
            messageIds: Object.values(messagesByRoom[chatRoomId] || {})
              .filter(
                (msg) =>
                  String(msg.sender_id) === String(currentUser.id) &&
                  !msg.is_delivered &&
                  !msg.is_read
              )
              .map((msg) => String(msg.id)),
            chatRoomId,
            status: {
              is_delivered: online,
              is_read: false,
              last_updated_at: new Date().toISOString(),
            },
          })
        );
      }
    });
    return () => {
      socket.off("messages_delivered");
      socket.off("messages_updated");
      socket.off("last_message_updated");
      socket.off("messages_read");
      socket.off("unread_count_update");
      socket.off("recipient_status");
      socket.off("messageDeleted");
      socket.off("message_failed");
    };
  }, [
    socket,
    currentUser,
    isConnected,
    chatRooms,
    handleMessagesDelivered,
    handleMessagesUpdated,
    handleLastMessageUpdated,
    handleMessagesRead,
    handleUnreadCountUpdate,
    chatRoomId,
    recipientId,
    dispatch,
    messagesByRoom,
  ]);

  const fetchChatRooms = useCallback(async () => {
    if (!currentUser?.token || !isRehydrated) return;
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/chat-rooms`,
        {
          headers: { Authorization: `Bearer ${currentUser.token}` },
        }
      );
      const rooms = Array.isArray(response.data) ? response.data : [];
      dispatch(setChatRooms(rooms));
      hasFetched.current = true;
      if (rooms.length > 0) {
        try {
          await dispatch(fetchAllRoomMessages()).unwrap();
        } catch (error) {
          console.error("Failed to fetch all room messages:", error);
        }
        rooms.forEach((room) =>
          emitGetUnreadCount(String(room.id), currentUser?.id)
        );
      }
    } catch (error) {
      console.error("Failed to fetch chat rooms:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      dispatch(setChatRooms([]));
    }
  }, [currentUser, isRehydrated, dispatch, emitGetUnreadCount]);

  useEffect(() => {
    if (isConnected && currentUser?.token && isRehydrated) {
      fetchChatRooms();
    }
  }, [isConnected, currentUser, isRehydrated, fetchChatRooms]);

  useEffect(() => {
    setDetectedLinks(detectLinks(newMessage));
  }, [newMessage, detectLinks]);

  useEffect(() => {
    if (!isMobile) return;
    const handleResize = () => {
      if (!chatContainerRef.current || !isAtBottom.current) return;
      requestAnimationFrame(() => {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      });
    };
    window.addEventListener("resize", handleResize);
    const input = messageInputRef.current;
    if (input) input.addEventListener("focus", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (input) input.removeEventListener("focus", handleResize);
    };
  }, [isMobile]);

  useEffect(() => {
    fetchChatRooms();
  }, [fetchChatRooms]);

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        if (isProfilePreviewOpen) setIsProfilePreviewOpen(false);
        else if (chatRoomId) {
          setChatRoomId(null);
          dispatch(setActiveRoom(null));
        }
      }
    };
    window.addEventListener("keydown", handleEscapeKey);
    return () => window.removeEventListener("keydown", handleEscapeKey);
  }, [chatRoomId, dispatch, isProfilePreviewOpen]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("black", theme === "black");
    document.documentElement.classList.toggle(
      "wireframe",
      theme === "wireframe"
    );
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    dispatch(toggleLocalTheme());
  }, [dispatch]);

  const formatLastSeen = useCallback((timestamp) => {
    if (!timestamp) return "offline";
    const now = dayjs();
    const lastSeen = dayjs(timestamp);
    if (now.diff(lastSeen, "day") === 0)
      return `today at ${lastSeen.format("HH:mm")}`;
    if (now.diff(lastSeen, "day") === 1)
      return `yesterday at ${lastSeen.format("HH:mm")}`;
    if (now.diff(lastSeen, "day") < 7)
      return `${lastSeen.format("dddd")} at ${lastSeen.format("HH:mm")}`;
    return `${lastSeen.format("DD/MM/YYYY")}`;
  }, []);

  const sortedChatRooms = useMemo(() => {
    return [...chatRooms].sort((a, b) => {
      const aMessages = messagesByRoom[String(a.id)]
        ? Object.values(messagesByRoom[String(a.id)])
        : [];
      const bMessages = messagesByRoom[String(b.id)]
        ? Object.values(messagesByRoom[String(b.id)])
        : [];

      const aLastMessage =
        aMessages.length > 0
          ? aMessages.reduce((latest, msg) => {
              const msgTime = new Date(
                msg.created_at || msg.original_created_at
              ).getTime();
              return msgTime >
                new Date(
                  latest.created_at || latest.original_created_at
                ).getTime()
                ? msg
                : latest;
            }, aMessages[0])
          : a.last_message;

      const bLastMessage =
        bMessages.length > 0
          ? bMessages.reduce((latest, msg) => {
              const msgTime = new Date(
                msg.created_at || msg.original_created_at
              ).getTime();
              return msgTime >
                new Date(
                  latest.created_at || latest.original_created_at
                ).getTime()
                ? msg
                : latest;
            }, bMessages[0])
          : b.last_message;

      const aTime = aLastMessage
        ? new Date(
            aLastMessage.created_at || aLastMessage.original_created_at
          ).getTime()
        : 0;
      const bTime = bLastMessage
        ? new Date(
            bLastMessage.created_at || bLastMessage.original_created_at
          ).getTime()
        : 0;

      return bTime - aTime; // Sort descending
    });
  }, [chatRooms, messagesByRoom]);

  const displayedMessages = useMemo(() => {
    const roomId = String(chatRoomId);
    if (!roomId || !messagesByRoom[roomId]) return [];

    const messages = Object.values(messagesByRoom[roomId])
      .filter(
        (msg) =>
          msg &&
          msg.id &&
          (msg.created_at || msg.original_created_at) &&
          (!showOnlyUnread || !msg.is_read)
      )
      .sort((a, b) => {
        const aTime = new Date(a.original_created_at || a.created_at).getTime();
        const bTime = new Date(b.original_created_at || b.created_at).getTime();
        if (aTime === bTime) {
          return (a.sequence || 0) - (b.sequence || 0);
        }
        return aTime - bTime; // Ascending order
      });

    return messages.slice(0, CONFIG.MAX_MESSAGES); // Limit to 1000 messages
  }, [chatRoomId, messagesByRoom, showOnlyUnread]);

  const selectedRoom = useMemo(
    () => chatRooms.find((room) => String(room.id) === String(chatRoomId)),
    [chatRooms, chatRoomId]
  );

  const isLoadingUnreadCounts = !isConnected && chatRooms.length > 0;

  if (!currentUser) {
    return (
      <div
        className={`flex items-center justify-center ${
          isMobile ? "h-[70vh]" : "h-[80vh]"
        } bg-[#efeae2] dark:bg-base-100 text-[#4a4a4a] dark:text-[#e9edef]`}>
        Please log in to view chat rooms.
      </div>
    );
  }

  return (
    <div
      className={`flex flex-row ${
        isMobile ? "h-[70vh]" : "h-[80vh]"
      } bg-[#efeae2] dark:bg-base-100 antialiased`}>
      <div
        className={`${chatRoomId && isMobile ? "hidden" : "flex"} flex-col ${
          isMobile ? "w-full" : "w-[40vw]"
        } bg-white dark:bg-base-200/50 md:border-r md:border-[#e9edef] dark:border-base-300`}>
        <div className="bg-[#00a884] dark:bg-transparent border-b border-[#e9edef] dark:border-transparent p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center h-[4vh]">
            {!isMobile && (
              <div className="avatar cursor-pointer">
                <div className="w-10 rounded-full">
                  <img
                    src={
                      currentUser?.avatar
                        ? `${process.env.REACT_APP_API}user/images/${currentUser.avatar}`
                        : "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                    }
                    alt={currentUser?.name || "Profile"}
                    onClick={handleAvatarClick}
                  />
                </div>
              </div>
            )}
            <span className="ml-3 text-xl font-semibold text-white">
              Messages
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {/* Tambahkan tombol New Chat di sini */}
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="text-white opacity-80 hover:opacity-100"
              title="New Chat">
              <span className="material-symbols-outlined">add_comment</span>
            </button>
            <button className="text-white opacity-80 hover:opacity-100">
              <span className="material-symbols-outlined">search</span>
            </button>
            <button
              onClick={handleToggleTheme}
              className="text-white opacity-80 hover:opacity-100">
              <span className="material-symbols-outlined">
                {theme === "wireframe" ? "light_mode" : "dark_mode"}
              </span>
            </button>
            <button className="text-white opacity-80 hover:opacity-100">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          <AnimatePresence initial={false}>
            {sortedChatRooms.map((room) => {
              const { text, timestamp, status, statusTooltip } =
                getLastMessagePreview(room);
              const recipientId =
                String(room.recipient_id) === String(currentUser.id)
                  ? room.sender_id
                  : room.recipient_id;
              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => handleSelectChatRoom(room)}
                  className={`flex mx-4 my-1 rounded-xl items-center p-4 border-y border-[#e9edef] dark:border-transparent cursor-pointer hover:bg-[#f5f6f6] dark:hover:bg-base-300 ${
                    String(chatRoomId) === String(room.id)
                      ? "bg-[#f0f2f5] dark:bg-base-300"
                      : ""
                  }`}>
                  <div className="avatar">
                    <div className="w-12 rounded-full">
                      <img
                        src={
                          room.recipient?.avatar
                            ? `${process.env.REACT_APP_API}user/images/${room.recipient.avatar}`
                            : "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                        }
                        alt={room.recipient?.name || "Recipient Avatar"}
                        onClick={handleAvatarClick}
                      />
                    </div>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span
                        className={`${
                          receivedUnreadCounts[String(room.id)] > 0
                            ? "font-semibold"
                            : "font-medium"
                        } text-[#111b21] dark:text-white truncate`}>
                        {room.recipient.name || "Unnamed Chat"}
                      </span>
                      <span className="text-xs text-[#667781] dark:text-[#8696a0]">
                        {timestamp}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center truncate">
                        {status && (
                          <span
                            className="flex items-center mr-1 tooltip"
                            data-tip={statusTooltip}>
                            {status === "failed" ? (
                              <span className="text-[#f05656] text-[14px]">
                                <span className="material-symbols-outlined">
                                  error
                                </span>
                              </span>
                            ) : status === "sent" ? (
                              <span className="text-[#667781] dark:text-[#8696a0]">
                                <span className="material-symbols-outlined text-[14px]">
                                  done
                                </span>
                              </span>
                            ) : status === "delivered" ? (
                              <span className="text-[#667781] dark:text-[#8696a0] flex">
                                <span className="material-symbols-outlined text-[14px]">
                                  done
                                </span>
                                <span className="material-symbols-outlined text-[14px] -ml-[8px]">
                                  done
                                </span>
                              </span>
                            ) : status === "read" ? (
                              <span className="text-[#53bdeb] flex">
                                <span className="material-symbols-outlined text-[14px]">
                                  done
                                </span>
                                <span className="material-symbols-outlined text-[14px] -ml-[8px]">
                                  done
                                </span>
                              </span>
                            ) : status === "pending" ? (
                              <span className="text-[#667781] dark:text-[#8696a0]">
                                <span className="material-symbols-outlined text-[14px]">
                                  schedule
                                </span>
                              </span>
                            ) : null}
                          </span>
                        )}
                        <p
                          className={`text-sm ${
                            receivedUnreadCounts[String(room.id)] > 0
                              ? "text-[#303b41] dark:text-[#cbd7df] font-semibold"
                              : "text-[#667781] dark:text-[#8696a0]"
                          } truncate mr-1`}>
                          {truncateText(text, 50)}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {isLoadingUnreadCounts ? (
                          <span className="bg-gray-300 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 animate-pulse"></span>
                        ) : receivedUnreadCounts[Number(room.id)] > 0 ? (
                          <span className="bg-[#25d366] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">
                            {receivedUnreadCounts[String(room.id)]}
                          </span>
                        ) : null}
                        <span className="text-xs text-[#667781] dark:text-[#8696a0]">
                          {userStatus[String(recipientId)]?.online === true
                            ? "online"
                            : userStatus[String(recipientId)]?.last_online_at
                            ? formatLastSeen(
                                userStatus[String(recipientId)]?.last_online_at
                              )
                            : "offline"}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
      <div
        className={`${
          chatRoomId || !isMobile ? "flex" : "hidden"
        } flex-row w-full overflow-x-hidden`}>
        {chatRoomId ? (
          <>
            <div
              className={`flex flex-col ${
                isProfilePreviewOpen && !isMobile ? "w-2/3" : "w-full"
              }`}>
              <div className="bg-[#f0f2f5] dark:bg-base-200/50 p-4 flex items-center border-b border-[#e9edef] dark:border-base-300 sticky top-0 z-10">
                <div className="flex items-center flex-1 h-[4vh]">
                  {isMobile && (
                    <button
                      onClick={() => {
                        setChatRoomId(null);
                        dispatch(setActiveRoom(null));
                      }}
                      className="md:hidden mr-3 text-[#54656f] dark:text-[#aebac1]">
                      <span className="material-symbols-outlined">
                        arrow_back
                      </span>
                    </button>
                  )}
                  <div
                    className="avatar cursor-pointer"
                    onClick={handleAvatarClick}>
                    <div className="w-10 rounded-full">
                      <img
                        src={
                          selectedRoom?.recipient?.avatar
                            ? `${process.env.REACT_APP_API}user/images/${selectedRoom.recipient.avatar}`
                            : "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                        }
                        alt={
                          selectedRoom?.recipient?.name || "Recipient Avatar"
                        }
                      />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-[#111b21] dark:text-[#e9edef]">
                      {selectedRoom?.recipient?.name || "Unnamed Chat"}
                    </h3>
                    <p className="text-sm text-[#667781] dark:text-[#8696a0]">
                      {userStatus[String(recipientId)]?.online === true
                        ? "Online"
                        : userStatus[String(recipientId)]?.last_online_at
                        ? `Last seen ${formatLastSeen(
                            userStatus[String(recipientId)]?.last_online_at
                          )}`
                        : "Offline"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOnlyUnread((prev) => !prev)}
                  className="text-[#54656f] dark:text-[#aebac1] hover:text-[#25d366] ml-2"
                  title={
                    showOnlyUnread
                      ? "Show all messages"
                      : "Show only unread messages"
                  }>
                  <span className="material-symbols-outlined">
                    {showOnlyUnread ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              <div
                ref={chatContainerRef}
                className="relative flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent p-4"
                style={{
                  background: `
      /* Transparent background with only pattern visible */
      url('data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" opacity="0.04">
          <path fill="${
            theme === "dark" ? "#ffffff" : "#000000"
          }" d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm0 48c115.2 0 208 92.8 208 208s-92.8 208-208 208S48 363.2 48 248 92.8 48 256 48z"/>
        </svg>
      `)}')
      center/400px 400px repeat
    `,
                }}>
                <div ref={loadingRef} className="flex justify-center">
                  {isLoadingMessages && hasMore && (
                    <span className="loading loading-spinner loading-sm text-[#25d366]"></span>
                  )}
                </div>
                <ChatItems
                  broadcastChannelRef={broadcastChannelRef}
                  isMobile={isMobile}
                  theme={theme}
                  // messages={displayedMessages}
                  messages={orderedMessages}
                  chatRoomId={chatRoomId}
                  currentUser={currentUser}
                  handleRetryMessage={handleRetryMessage}
                  showNewMessageBadge={showNewMessageBadge}
                  handleBadgeClick={handleBadgeClick}
                  linkPreviews={linkPreviews} // Jika masih relevan
                  isLoadingPreviews={isLoadingPreviews} // Jika masih relevan
                  markMessageAsRead={markMessageAsRead}
                  dispatch={dispatch}
                  resetUnreadCountForRoom={resetUnreadCountForRoom}
                  loadMore={loadMore}
                  hasMore={hasMore}
                  isLoadingMessages={isLoadingMessages}
                />
                {readError && (
                  <div className="flex justify-center py-2">
                    <button
                      onClick={handleManualRetry}
                      className="bg-[#f05656] text-white rounded-full px-4 py-1 text-sm flex items-center shadow-lg hover:bg-[#d32f2f]">
                      <span className="material-symbols-outlined text-sm mr-1">
                        refresh
                      </span>
                      {readError}
                    </button>
                  </div>
                )}
              </div>
              {filePreview && (
                <div className="bg-[#f0f2f5] dark:bg-base-200/50 p-2 border-t border-[#e9edef] dark:border-base-300">
                  {filePreview === "document" ? (
                    <div className="flex items-center bg-[#e9edef] dark:bg-base-300 p-2 rounded-lg max-w-full">
                      <span className="material-symbols-outlined text-[#54656f] dark:text-[#aebac1] mr-2">
                        description
                      </span>
                      <span className="text-sm text-[#111b21] dark:text-[#e9edef] truncate flex-1">
                        {selectedFile.name}
                      </span>
                      <button
                        onClick={handleRemoveFile}
                        className="ml-2 text-[#f05656] hover:text-[#d32f2f]">
                        <span className="material-symbols-outlined text-sm">
                          close
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="relative inline-block max-w-full">
                      <div className="relative max-h-40 rounded-lg overflow-hidden border border-[#e9edef] dark:border-base-300">
                        {mediaType === "video" ? (
                          <video
                            src={filePreview}
                            className="max-h-40 w-full object-contain"
                            controls
                          />
                        ) : (
                          <img
                            src={filePreview}
                            alt="Preview"
                            className="max-h-40 w-full object-contain"
                          />
                        )}
                      </div>
                      <button
                        onClick={handleRemoveFile}
                        className="absolute top-2 right-2 bg-[#00000080] text-white rounded-full w-6 h-6 flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm">
                          close
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              {detectedLinks.length > 0 && (
                <div className="bg-[#f0f2f5] dark:bg-base-200/50 p-2 border-t border-[#e9edef] dark:border-base-300">
                  <p className="text-sm text-[#54656f] dark:text-[#aebac1] mb-1">
                    Link Preview:
                  </p>
                  {isLoadingPreviews ? (
                    <div className="flex items-center justify-center py-2">
                      <span className="loading loading-spinner loading-sm text-[#25d366]"></span>
                      <span className="ml-2 text-sm text-[#54656f] dark:text-[#aebac1]">
                        Loading previews...
                      </span>
                    </div>
                  ) : linkPreviews.length > 0 ? (
                    linkPreviews.map((preview, index) => (
                      <div
                        key={index}
                        className="flex w-[100vh] items-center my-2 p-2 bg-[#e9edef] dark:bg-base-300 rounded-lg max-w-full">
                        {(preview.image || preview.icon) && (
                          <img
                            src={preview.image || preview.icon}
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded-lg mr-2"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <a
                            href={preview.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#25d366] hover:underline font-semibold text-sm truncate block">
                            {preview.title}
                          </a>
                          <p className="text-sm text-[#667781] dark:text-[#8696a0] truncate">
                            {preview.description}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#667781] dark:text-[#8696a0]">
                      No preview available
                    </p>
                  )}
                </div>
              )}
              <div className="bg-[#f0f2f5] dark:bg-base-200/50 p-2 border-t border-[#e9edef] dark:border-base-300 flex items-center">
                <div className="relative flex items-center flex-1">
                  <button
                    onClick={() => setShowAttachmentOptions((prev) => !prev)}
                    className="text-[#54656f] dark:text-[#aebac1] mr-2">
                    <span className="material-symbols-outlined">
                      attach_file
                    </span>
                  </button>
                  {showAttachmentOptions && (
                    <div className="absolute bottom-12 left-2 bg-white dark:bg-base-200 shadow-lg rounded-lg p-2 z-20">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center w-full text-left px-4 py-2 hover:bg-[#f5f6f6] dark:hover:bg-base-300 text-[#54656f] dark:text-[#aebac1]">
                        <span className="material-symbols-outlined mr-2">
                          image
                        </span>
                        Photo
                      </button>
                      <button
                        onClick={() => videoInputRef.current?.click()}
                        className="flex items-center w-full text-left px-4 py-2 hover:bg-[#f5f6f6] dark:hover:bg-base-300 text-[#54656f] dark:text-[#aebac1]">
                        <span className="material-symbols-outlined mr-2">
                          videocam
                        </span>
                        Video
                      </button>
                      <button
                        onClick={() => docInputRef.current?.click()}
                        className="flex items-center w-full text-left px-4 py-2 hover:bg-[#f5f6f6] dark:hover:bg-base-300 text-[#54656f] dark:text-[#aebac1]">
                        <span className="material-symbols-outlined mr-2">
                          description
                        </span>
                        Document
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileChange(e, "image")}
                    accept="image/jpeg,image/png,image/gif"
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={videoInputRef}
                    onChange={(e) => handleFileChange(e, "video")}
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={docInputRef}
                    onChange={(e) => handleFileChange(e, "document")}
                    accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                  />
                  <textarea
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      } else if (e.key === "Enter" && e.shiftKey) {
                        // Allow default behavior to insert newline
                        // No need to manually append \n
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 bg-white dark:bg-base-300 text-[#111b21] dark:text-[#e9edef] rounded-lg p-2 outline-none resize-none"
                    rows="1"
                  />
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!newMessage.trim() && !selectedFile}
                  className={`ml-2 text-[#54656f] dark:text-[#aebac1] ${
                    !newMessage.trim() && !selectedFile
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:text-[#25d366]"
                  }`}>
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
            {isProfilePreviewOpen && (
              <div
                className={`${
                  isMobile ? "fixed inset-0 z-50" : "w-1/3"
                } border-l border-[#e9edef] dark:border-base-300`}>
                <ProfilePreview
                  user={
                    selectedRoom?.recipient ||
                    currentUser || {
                      name: "Unknown User",
                      avatar: null,
                      email: null,
                      status: null,
                    }
                  }
                  isOpen={isProfilePreviewOpen}
                  onClose={() => setIsProfilePreviewOpen(false)}
                  messages={displayedMessages}
                  theme={theme}
                  isMobile={isMobile}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#efeae2] dark:bg-base-100 text-[#4a4a4a] dark:text-[#e9edef]">
            Select a chat to start messaging
          </div>
        )}
      </div>
      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
      />
    </div>
  );
};

export default Chat;
