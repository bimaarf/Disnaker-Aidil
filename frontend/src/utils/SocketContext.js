import axios from "axios";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import newMessageSound from "../assets/audio/tap-notification-180637.mp3";
import {
  addChatRoom,
  addMessages,
  confirmChatRoom,
  fetchAllRoomMessages,
  fetchMessages,
  removePendingMessage,
  resetUnreadCountForRoom,
  setMessagesAsRead,
  setUnreadCounts,
  updateMessageStatus,
} from "../features/chats/chatSlice";

let socketInstance = null;

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

const initializeSocket = (token, userId) => {
  if (socketInstance && socketInstance.connected) {
    console.log("Reusing existing socket instance:", socketInstance.id);
    return socketInstance;
  }

  if (socketInstance) {
    console.log(
      "Cleaning up old socket instance:",
      socketInstance.id || "none"
    );
    socketInstance.disconnect();
    socketInstance = null;
  }

  socketInstance = io(process.env.REACT_APP_SOCKET_CHAT_URL, {
    path: process.env.REACT_APP_SOCKET_CHAT_PATH,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    randomizationFactor: 0.5,
    timeout: 20000,
    forceNew: false,
    upgrade: true,
    auth: { token, user_id: String(userId) },
  });

  socketInstance.onAnyOutgoing((event, ...args) => {
    console.log(`Sending socket event: ${event}`, args);
  });

  socketInstance.on("connect_error", (err) => {
    console.error("Socket connect error:", err.message);
    setTimeout(() => {
      if (!socketInstance.connected) {
        console.log("Attempting socket reconnection...");
        socketInstance.connect();
      }
    }, 1000);
  });

  console.log(
    "New socket instance created:",
    socketInstance.id || "pending connection"
  );
  return socketInstance;
};

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [userStatus, setUserStatus] = useState({});
  const dispatch = useDispatch();
  const processedBatchesRef = useRef(new Set());
  const sentTempIds = useRef(new Map());

  const currentUser = useSelector((state) => state.auth.user);
  const messagesByRoom =
    useSelector((state) => state.chat.messagesByRoom) || {};
  const chatRooms = useSelector((state) => state.chat.chatRooms) || [];
  const receivedUnreadCounts =
    useSelector((state) => state.chat.receivedUnreadCounts) || {};
  const tempToRealRoomMap =
    useSelector((state) => state.chat.tempToRealRoomMap) || {};
  const isRehydrated = useSelector((state) => state._persist?.rehydrated);

  const notificationSound = useMemo(() => {
    const audio = new Audio(newMessageSound);
    audio.volume = 0.5;
    audio.oncanplay = () => {
      console.log("🔊 Notification sound loaded and ready to play");
    };
    audio.onerror = () => {
      console.error("❌ Failed to load /assets/audio/new-messages.mp3");
    };
    return audio;
  }, []);

  const playNotificationSound = () => {
    if (document.visibilityState === "visible") {
      try {
        notificationSound.pause();
        notificationSound.currentTime = 0;
        Promise.resolve().then(() => {
          notificationSound.volume = 1.0;
          notificationSound.play().catch((e) => {
            console.warn("🔇 Notification sound play failed:", e.message);
          });
        });
      } catch (e) {
        console.warn("🔇 Notification sound error:", e.message);
      }
    }
  };

  useEffect(() => {
    return () => {
      notificationSound.pause();
      notificationSound.currentTime = 0;
    };
  }, [notificationSound]);

  useEffect(() => {
    const handleInteraction = () => {
      console.log("User interacted with document");
      notificationSound.play().catch((error) => {
        console.warn("🔇 Initial play failed:", error.message);
      });
      document.removeEventListener("click", handleInteraction);
    };
    document.addEventListener("click", handleInteraction);
    return () => {
      document.removeEventListener("click", handleInteraction);
    };
  }, [notificationSound]);

  const totalUnread = useMemo(
    () =>
      Object.values(receivedUnreadCounts).reduce(
        (sum, count) => sum + (count || 0),
        0
      ),
    [receivedUnreadCounts]
  );

  const debouncedToastRef = useRef(null);
  const broadcastChannelRef = useRef(null);
  const pendingMessagesRef = useRef(new Map());

  const showToast = useCallback((message) => {
    const now = Date.now();
    if (
      debouncedToastRef.current?.lastShown &&
      now - debouncedToastRef.current.lastShown < 4000
    ) {
      console.log("Ignoring toast trigger: too soon since last toast");
      return;
    }
    if (debouncedToastRef.current?.timeout) {
      clearTimeout(debouncedToastRef.current.timeout);
      debouncedToastRef.current.timeout = null;
    }
    setToastMessage(message);
    debouncedToastRef.current = {
      timeout: setTimeout(() => {
        setToastMessage(null);
        debouncedToastRef.current = null;
      }, 4000),
      lastShown: now,
    };
  }, []);

  const fetchUnreadCountsFromAPI = useCallback(async () => {
    if (!currentUser?.token || !currentUser?.id) return;
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/chat-rooms`,
        {
          headers: { Authorization: `Bearer ${currentUser.token}` },
        }
      );
      const rooms = Array.isArray(response.data) ? response.data : [];
      const unreadCounts = rooms.reduce((acc, room) => {
        acc[String(room.id)] = room.message_unread || 0;
        return acc;
      }, {});
      console.log("Fetched unread counts from API:", unreadCounts);
      dispatch(setUnreadCounts({ received: unreadCounts, sent: {} }));
    } catch (error) {
      console.error("Error fetching unread counts from API:", error.message);
    }
  }, [currentUser, dispatch]);

  const setupSocketListeners = useCallback(
    (socket) => {
      socket.on("connect", () => {
        setIsConnected(true);
        console.log("Socket connected:", socket.id);
        socket.emit("authenticate", {
          token: currentUser.token,
          user_id: String(currentUser.id),
        });
      });

      socket.on("authenticated", ({ unreadCounts }) => {
        console.log(
          "✅ Socket authenticated, received unread counts:",
          unreadCounts
        );
        dispatch(setUnreadCounts({ received: unreadCounts || {}, sent: {} }));
        dispatch(fetchAllRoomMessages());
        fetchUnreadCountsFromAPI().then(() => {
          const joinedRooms = chatRooms.map((room) => String(room.id));
          if (joinedRooms.length) {
            console.log("🔁 Emitting join_rooms:", joinedRooms);
            socket.emit("join_rooms", { room_ids: joinedRooms });
          } else {
            console.warn(
              "⚠️ No chatRooms available to join after authenticated."
            );
          }
        });
      });

      socket.on(
        "new_chat_room",
        async ({ chat_room_id, user_ids, room, timestamp }) => {
          console.log(`Recipient ${currentUser.id} received new_chat_room:`, {
            chat_room_id,
            user_ids,
            room,
            timestamp,
          });

          if (!chat_room_id) {
            console.warn("new_chat_room: Missing chat_room_id, skipping");
            return;
          }

          if (String(chat_room_id).startsWith("temp-")) {
            console.log(
              `new_chat_room: Skipping fetch for temporary room: ${chat_room_id}`
            );
            return;
          }

          const roomId = String(chat_room_id);
          const roomExists = chatRooms.some((r) => String(r.id) === roomId);
          if (roomExists) {
            console.log(
              `new_chat_room: Room ${roomId} already exists, skipping addition`
            );
            try {
              await dispatch(
                fetchMessages({ chatRoomId: roomId, page: 1, perPage: 20 })
              ).unwrap();
              socket.emit("join_rooms", { room_ids: [roomId] });
              socket.emit("get_unread_count", {
                chat_room_id: roomId,
                user_id: String(currentUser.id),
              });
            } catch (error) {
              console.error(
                `Failed to fetch messages for existing room ${roomId}:`,
                error
              );
            }
            return;
          }

          const addRoomAndFetch = async (roomData) => {
            console.log(`new_chat_room: Adding room ${roomId}`);
            dispatch(addChatRoom({ ...roomData, id: roomId }));
            let retries = 3;
            while (retries > 0) {
              try {
                await dispatch(
                  fetchMessages({ chatRoomId: roomId, page: 1, perPage: 20 })
                ).unwrap();
                socket.emit("join_rooms", { room_ids: [roomId] });
                socket.emit("get_unread_count", {
                  chat_room_id: roomId,
                  user_id: String(currentUser.id),
                });
                break;
              } catch (error) {
                console.error(
                  `Failed to fetch messages for room ${roomId} (attempt ${
                    4 - retries
                  }/3):`,
                  error
                );
                retries--;
                if (retries === 0) {
                  console.error(`Max retries reached for room ${roomId}`);
                  showToast("Failed to load messages for new chat room");
                }
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }
            }
          };

          if (room) {
            await addRoomAndFetch(room);
          } else {
            try {
              const response = await axios.get(
                `${process.env.REACT_APP_API}api/chat-rooms/${roomId}`,
                {
                  headers: { Authorization: `Bearer ${currentUser.token}` },
                }
              );
              if (response.data) {
                console.log(
                  `new_chat_room: Fetched new chat room from API: ${roomId}`,
                  response.data
                );
                await addRoomAndFetch(response.data);
              }
            } catch (error) {
              console.error(
                `new_chat_room: Failed to fetch chat room ${roomId}`,
                error
              );
              showToast("Failed to load new chat room");
            }
          }
        }
      );

      socket.on(
        "user_status",
        ({ user_id, online, last_online_at, timestamp }) => {
          console.log(
            `Received user_status for ${user_id}: online=${online}, last_online_at=${last_online_at}, timestamp=${timestamp}`
          );
          setUserStatus((prev) => {
            const userIdStr = String(user_id);
            if (
              prev[userIdStr]?.online === online &&
              prev[userIdStr]?.last_online_at === last_online_at &&
              prev[userIdStr]?.timestamp === timestamp
            ) {
              return prev;
            }
            return {
              ...prev,
              [userIdStr]: {
                online,
                last_online_at: last_online_at || null,
                timestamp: timestamp || new Date().toISOString(),
              },
            };
          });
        }
      );

      socket.on("message_confirmed", (message) => {
        if (!message?.id || !message.originalTempId) return;

        const messageId = String(message.id);
        const tempId = String(message.originalTempId);
        const realRoomId = String(message.chat_room_id);

        if (
          sentTempIds.current.has(messageId) ||
          sentTempIds.current.has(tempId)
        ) {
          console.log(`Skipping already processed message: ${messageId}`);
          return;
        }

        dispatch(
          updateMessageStatus({
            messageIds: [tempId, messageId],
            chatRoomId: realRoomId,
            status: {
              ...message,
              id: messageId,
              originalTempId: tempId,
              chat_room_id: realRoomId,
              isLocal: false,
              _isPending: false,
              last_updated_at: new Date().toISOString(),
            },
            replace: true,
          })
        );

        broadcastChannelRef.current?.postMessage({
          type: "message_confirmed",
          userId: currentUser.id,
          tempId,
          messageId,
          message: {
            ...message,
            id: messageId,
            originalTempId: tempId,
            chat_room_id: realRoomId,
            isLocal: false,
            _isPending: false,
          },
        });

        sentTempIds.current.set(messageId, true);
        sentTempIds.current.set(tempId, true);
      });

      socket.on("new_message_batch", async (payload) => {
        if (!payload || !Array.isArray(payload.messages)) {
          console.warn("SocketContext: No valid messages in new_message_batch");
          return;
        }

        const { messages, chat_room } = payload;
        const batchId = `${messages
          .map((msg) => msg.id)
          .join("-")}-${Date.now()}`;
        if (processedBatchesRef.current.has(batchId)) {
          console.log("Skipping duplicate batch:", batchId);
          return;
        }
        processedBatchesRef.current.add(batchId);

        if (processedBatchesRef.current.size > 100) {
          processedBatchesRef.current = new Set(
            [...processedBatchesRef.current].slice(-50)
          );
        }

        console.log(
          `Recipient ${currentUser.id} received new_message_batch:`,
          payload
        );

        const validMessages = messages
          .filter((msg) => msg?.id && msg.chat_room_id)
          .map((msg) => ({
            ...msg,
            chat_room_id: String(msg.chat_room_id),
            id: String(msg.id),
            sequence: Number(msg.sequence) || Date.now(),
            isLocal: false,
            _isPending: false,
            _sortKey: new Date(
              msg.original_created_at || msg.created_at
            ).getTime(),
          }))
          .filter((msg) => {
            const roomId = String(msg.chat_room_id);
            const messageId = String(msg.id);
            const existing = messagesByRoom[roomId]?.[messageId];

            if (!existing) return true;

            const existingUpdated = new Date(
              existing.last_updated_at || existing.created_at
            ).getTime();
            const newUpdated = new Date(
              msg.last_updated_at || msg.created_at
            ).getTime();
            return (
              newUpdated > existingUpdated ||
              (msg.is_delivered && !existing.is_delivered) ||
              (msg.is_read && !existing.is_read) ||
              (msg.originalTempId && !existing.originalTempId)
            );
          });

        if (validMessages.length === 0) {
          console.log("No valid messages to process after filtering");
          return;
        }

        const roomId = String(validMessages[0].chat_room_id);
        const roomExists = chatRooms.some((room) => String(room.id) === roomId);

        // Ensure the room exists before adding messages
        if (!roomExists && !chat_room?.id) {
          try {
            const response = await axios.get(
              `${process.env.REACT_APP_API}api/chat-rooms/${roomId}`,
              {
                headers: { Authorization: `Bearer ${currentUser.token}` },
              }
            );
            if (response.data) {
              console.log(
                `new_message_batch: Fetched room ${roomId} from API`,
                response.data
              );
              dispatch(addChatRoom({ ...response.data, id: roomId }));
            }
          } catch (error) {
            console.error(`Failed to fetch room ${roomId}:`, error);
            showToast("Failed to load chat room for new messages");
            return;
          }
        } else if (chat_room?.id) {
          const realRoomId = String(chat_room.id);
          const isNewRoom = messages.some((msg) => msg.new_room === true);

          if (!chatRooms.some((room) => String(room.id) === realRoomId)) {
            console.log(
              `new_message_batch: Adding new real room: ${realRoomId}`
            );
            dispatch(addChatRoom({ ...chat_room, id: realRoomId }));
          }

          // Confirm temporary room if it exists
          if (isNewRoom) {
            const tempRoom = chatRooms.find(
              (room) =>
                String(room.recipient_id) === String(chat_room.recipient_id) &&
                String(room.id).startsWith("temp-")
            );
            if (tempRoom) {
              console.log(
                `new_message_batch: Confirming temp room: ${tempRoom.id} -> real room: ${realRoomId}`
              );
              dispatch(
                confirmChatRoom({
                  tempId: tempRoom.id,
                  newRoom: { ...chat_room, id: realRoomId },
                })
              );
            }
          }
        }

        // Add messages to state
        console.log("SocketContext: Adding valid messages:", validMessages);
        dispatch(addMessages(validMessages));
        broadcastChannelRef.current?.postMessage({
          type: "messages_added",
          userId: currentUser.id,
          messages: validMessages,
        });

        // Handle incoming messages
        const hasIncomingMessage = validMessages.some(
          (msg) => String(msg.sender_id) !== String(currentUser?.id)
        );
        if (hasIncomingMessage) {
          playNotificationSound();
          socket.emit("get_unread_count", {
            chat_room_id: roomId,
            user_id: String(currentUser.id),
          });
        }

        // Fetch messages with retries
        let retries = 3;
        while (retries > 0) {
          try {
            await dispatch(
              fetchMessages({ chatRoomId: roomId, page: 1, perPage: 20 })
            ).unwrap();
            socket.emit("join_rooms", { room_ids: [roomId] });
            break;
          } catch (error) {
            console.error(
              `Failed to fetch messages for room ${roomId} (attempt ${
                4 - retries
              }/3):`,
              error
            );
            retries--;
            if (retries === 0) {
              console.error(`Max retries reached for room ${roomId}`);
              showToast("Failed to sync messages for chat room");
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      });

      socket.on("messages_delivered", ({ chat_room_id, message_ids }) => {
        console.log(
          `Received messages_delivered for room ${chat_room_id}:`,
          message_ids
        );
        dispatch(
          updateMessageStatus({
            messageIds: message_ids.map(String),
            status: {
              is_delivered: true,
              delivered_at: new Date().toISOString(),
              last_updated_at: new Date().toISOString(),
            },
            chatRoomId: String(chat_room_id),
          })
        );
      });

      socket.on(
        "messages_read",
        ({ chat_room_id, user_id, message_ids, timestamp }) => {
          console.log(
            `Received messages_read for room ${chat_room_id}, user: ${user_id}, messages:`,
            message_ids
          );
          const roomId = String(chat_room_id);
          if (message_ids?.length) {
            dispatch(
              updateMessageStatus({
                messageIds: message_ids.map(String),
                status: {
                  is_read: true,
                  read_at: timestamp || new Date().toISOString(),
                  status: "read",
                  last_updated_at: timestamp || new Date().toISOString(),
                },
                chatRoomId: roomId,
              })
            );
          }
          if (String(user_id) === String(currentUser.id)) {
            dispatch(resetUnreadCountForRoom({ roomId }));
            socket.emit("get_unread_count", {
              chat_room_id: roomId,
              user_id: String(user_id),
            });
          }
        }
      );

      socket.on("messages_updated", ({ chat_room_id, user_id }) => {
        dispatch(
          setMessagesAsRead({
            chatRoomId: String(chat_room_id),
            userId: String(user_id),
          })
        );
        dispatch(resetUnreadCountForRoom({ roomId: String(chat_room_id) }));
      });

      socket.on("unread_count_update", ({ chat_room_id, unread_count }) => {
        console.log(
          `Received unread_count_update for room ${chat_room_id}: ${unread_count}`
        );
        const roomId = String(chat_room_id);
        const updatedCounts = {
          ...receivedUnreadCounts,
          [roomId]: unread_count,
        };
        dispatch(setUnreadCounts({ received: updatedCounts, sent: {} }));
      });

      socket.on("error", ({ event, message }) => {
        console.error(`Socket error (${event}): ${message}`);
        showToast(`Error: ${message}`);
      });

      return () => {
        socket.off("connect");
        socket.off("authenticated");
        socket.off("user_status");
        socket.off("message_confirmed");
        socket.off("new_message_batch");
        socket.off("messages_delivered");
        socket.off("messages_updated");
        socket.off("messages_read");
        socket.off("unread_count_update");
        socket.off("new_chat_room");
        socket.off("error");
      };
    },
    [
      currentUser,
      messagesByRoom,
      receivedUnreadCounts,
      tempToRealRoomMap,
      dispatch,
      showToast,
      fetchUnreadCountsFromAPI,
      notificationSound,
    ]
  );

  useEffect(() => {
    broadcastChannelRef.current = new BroadcastChannel("chat_channel");

    broadcastChannelRef.current.onmessage = async (event) => {
      if (event.data.userId !== currentUser?.id) return;
      if (event.data.type === "message_confirmed") {
        const { tempId, messageId, message } = event.data;
        const roomId = String(message.chat_room_id);

        if (
          sentTempIds.current.has(messageId) ||
          sentTempIds.current.has(tempId)
        ) {
          console.log(
            `Broadcast: Skipping already processed message: ${messageId}`
          );
          return;
        }

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
              _isPending: false,
            },
            chatRoomId: roomId,
            replace: true,
          })
        );
        dispatch(removePendingMessage({ tempId, chatRoomId: roomId }));

        sentTempIds.current.set(messageId, true);
        sentTempIds.current.set(tempId, true);
      } else if (event.data.type === "messages_added") {
        const roomId = String(event.data.messages[0]?.chat_room_id);
        if (!roomId) return;

        // Ensure the room exists
        const roomExists = chatRooms.some((room) => String(room.id) === roomId);
        if (!roomExists) {
          try {
            const response = await axios.get(
              `${process.env.REACT_APP_API}api/chat-rooms/${roomId}`,
              {
                headers: { Authorization: `Bearer ${currentUser.token}` },
              }
            );
            if (response.data) {
              console.log(
                `Broadcast: Fetched room ${roomId} for messages_added`,
                response.data
              );
              dispatch(addChatRoom({ ...response.data, id: roomId }));
              socketInstance.emit("join_rooms", { room_ids: [roomId] });
            }
          } catch (error) {
            console.error(`Broadcast: Failed to fetch room ${roomId}:`, error);
          }
        }

        const validMessages = event.data.messages.filter((msg) => {
          if (!msg?.id) return false;
          const roomId = String(msg.chat_room_id);
          const messageId = String(msg.id);
          const existing = messagesByRoom[roomId]?.[messageId];

          if (!existing) return true;

          const existingUpdated = new Date(
            existing.last_updated_at || existing.created_at
          ).getTime();
          const newUpdated = new Date(
            msg.last_updated_at || msg.created_at
          ).getTime();
          return (
            newUpdated > existingUpdated ||
            (msg.is_delivered && !existing.is_delivered) ||
            (msg.is_read && !existing.is_read) ||
            (msg.originalTempId && !existing.originalTempId)
          );
        });

        if (validMessages.length > 0) {
          console.log(
            `Broadcast: Adding ${validMessages.length} messages from another tab`
          );
          dispatch(addMessages(validMessages));
          const hasIncomingMessage = validMessages.some(
            (msg) => String(msg.sender_id) !== String(currentUser?.id)
          );
          if (hasIncomingMessage) {
            playNotificationSound();
            socketInstance.emit("get_unread_count", {
              chat_room_id: roomId,
              user_id: String(currentUser.id),
            });
          }
        }
      }
    };

    return () => {
      broadcastChannelRef.current?.close();
    };
  }, [currentUser?.id, messagesByRoom, dispatch]);

  useEffect(() => {
    if (
      !currentUser?.token ||
      !currentUser?.id ||
      !isRehydrated ||
      !currentUser
    ) {
      if (socketInstance?.connected) {
        console.log(
          "User logged out or not ready, disconnecting socket:",
          socketInstance.id
        );
        socketInstance.emit("logout");
        socketInstance.disconnect();
        socketInstance = null;
      }
      return;
    }

    const socket = initializeSocket(currentUser.token, currentUser.id);

    if (!socket.connected) {
      console.log("Connecting socket on login...");
      socket.connect();
    }

    const cleanupListeners = setupSocketListeners(socket);

    return () => {
      cleanupListeners();
      if (debouncedToastRef.current) clearTimeout(debouncedToastRef.current);
    };
  }, [currentUser, isRehydrated, setupSocketListeners]);

  const trackPendingMessage = useCallback((messageId, status = "pending") => {
    pendingMessagesRef.current.set(String(messageId), status);
  }, []);

  const toastAnimationStyle = useMemo(
    () => ({
      animation: "slideIn 0.3s ease-in-out, slideOut 0.3s ease-in-out 3.7s",
    }),
    []
  );

  const contextValue = useMemo(
    () => ({
      socket: socketInstance,
      isConnected,
      trackPendingMessage,
      userStatus,
    }),
    [isConnected, trackPendingMessage, userStatus]
  );

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
      {toastMessage && (
        <div
          className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
          style={toastAnimationStyle}>
          {toastMessage} ({totalUnread})
          <button
            onClick={() => {
              console.log("Testing notification sound");
              notificationSound.play().catch((error) => {
                console.error("Test play failed:", error);
              });
            }}
            className="ml-2 bg-white text-green-500 px-2 py-1 rounded">
            Test Sound
          </button>
        </div>
      )}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
    </SocketContext.Provider>
  );
};

export const disconnectSocket = () => {
  if (socketInstance?.connected) {
    console.log("App unmounting, disconnecting socket:", socketInstance.id);
    socketInstance.emit("logout");
    socketInstance.disconnect();
    socketInstance = null;
  }
};
