import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Utility to save unread counts to localStorage
export const saveUnreadCountToStorage = (type, unreadCount) => {
  localStorage.setItem(`${type}UnreadCount`, JSON.stringify(unreadCount));
};

// Thunk to fetch paginated messages for a specific chat room
export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async ({ chatRoomId, page = 1, perPage = 20 }, { getState }) => {
    const { auth } = getState();
    const url = page
      ? `${process.env.REACT_APP_API}api/messages/${chatRoomId}?page=${page}&per_page=${perPage}`
      : `${process.env.REACT_APP_API}api/messages/${chatRoomId}`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${auth.user.token}` },
    });
    return {
      chatRoomId: String(chatRoomId),
      messages: response.data.data,
      meta: response.data.meta,
    };
  }
);

// Thunk to fetch messages for all chat rooms
export const fetchAllRoomMessages = createAsyncThunk(
  "chat/fetchAllRoomMessages",
  async (_, { getState, dispatch, rejectWithValue }) => {
    const { chat, auth } = getState();
    if (!auth.user?.id) return rejectWithValue("User not authenticated");
    const chatRooms = chat.chatRooms || [];
    const promises = chatRooms.map((room) =>
      dispatch(
        fetchMessages({
          chatRoomId: String(room.id),
          page: 1,
          perPage: 20,
        })
      ).unwrap()
    );
    try {
      const results = await Promise.all(promises);
      return results.reduce((acc, result) => {
        acc[result.chatRoomId] = result.messages;
        return acc;
      }, {});
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch all room messages"
      );
    }
  }
);

// Thunk to send a message
export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async (formData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/send-message`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
            Authorization: `Bearer ${auth.user.token}`,
          },
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to send message");
    }
  }
);

// Thunk to mark messages as read
export const markMessagesAsRead = createAsyncThunk(
  "chat/markMessagesAsRead",
  async ({ chatRoomId, messageIds }, { getState, rejectWithValue }) => {
    try {
      const { auth, chat } = getState();
      const messages = chat.messagesByRoom[String(chatRoomId)] || {};
      const ids =
        messageIds ||
        Object.values(messages)
          .filter(
            (msg) =>
              String(msg.recipient_id) === String(auth.user.id) && !msg.is_read
          )
          .map((msg) => msg.id);

      if (!ids.length) {
        return {
          chatRoomId: String(chatRoomId),
          userId: String(auth.user.id),
          message_ids: [],
          updated_count: 0,
        };
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API}api/messages/read`,
        { chat_room_id: chatRoomId, message_ids: ids },
        {
          headers: {
            Authorization: `Bearer ${auth.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return {
        chatRoomId: String(chatRoomId),
        userId: String(auth.user.id),
        message_ids: response.data.message_ids || ids,
      };
    } catch (error) {
      console.error("Error marking messages as read:", error);
      return rejectWithValue(error.response?.data || "Failed to mark as read");
    }
  }
);

// Selector to get ordered messages for a room
// In chatSlice.js, update the selector
export const selectOrderedMessages =
  (roomId, showOnlyUnread = false) =>
  (state) => {
    const roomMessages = state.chat.messagesByRoom[String(roomId)] || {};
    return Object.values(roomMessages)
      .filter((msg) => msg && msg.id && (!showOnlyUnread || !msg.is_read))
      .sort((a, b) => {
        const aTime = new Date(a.original_created_at || a.created_at).getTime();
        const bTime = new Date(b.original_created_at || b.created_at).getTime();

        if (aTime === bTime) {
          return (a.sequence || 0) - (b.sequence || 0);
        }

        return aTime - bTime; // Urutan ascending
      });
  };

// Initial state
const initialState = {
  chatRooms: [],
  messagesByRoom: {},
  activeRoom: null,
  receivedUnreadCounts: {},
  sentUnreadCounts: {}, // Reintroduced for setUnreadCounts
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    perPage: 20,
    total: 0,
    lastPage: 1,
  },
};

// Chat slice
const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action) => {
      const now = new Date().toISOString();
      const messageId = String(action.payload.id);
      const isPending =
        action.payload._isPending ||
        (typeof messageId === "string" && messageId.startsWith("temp-"));

      const consistentTimestamp =
        action.payload.original_created_at || action.payload.created_at || now;

      const message = {
        ...action.payload,
        id: messageId,
        chat_room_id: String(action.payload.chat_room_id),
        original_created_at: consistentTimestamp,
        created_at: action.payload.created_at || consistentTimestamp,
        sequence: action.payload.sequence || Date.now(), // Pastikan sequence ada
        _sortKey: action.payload._sortKey || Date.now(),
        _isPending: isPending,
      };

      const roomId = String(message.chat_room_id);

      if (!state.messagesByRoom[roomId]) {
        state.messagesByRoom[roomId] = {};
      }

      // Only add if it doesn't exist or if it's newer
      const existing = state.messagesByRoom[roomId][messageId];
      if (
        !existing ||
        new Date(message.created_at).getTime() >
          new Date(existing.created_at).getTime()
      ) {
        state.messagesByRoom[roomId][messageId] = message;
      }
    },
    addMessages: (state, action) => {
      const messages = action.payload;
      if (!Array.isArray(messages)) return;
    
      messages.forEach((message) => {
        const roomId = String(message.chat_room_id);
        if (!state.messagesByRoom[roomId]) state.messagesByRoom[roomId] = {};
    
        const messageId = String(message.id);
        const existing = state.messagesByRoom[roomId][messageId];
    
        const sortKey =
          existing?._sortKey ||
          new Date(message.original_created_at || message.created_at).getTime();
    
        state.messagesByRoom[roomId][messageId] = {
          ...message,
          id: messageId,
          chat_room_id: roomId,
          isLocal: false,
          sequence: message.sequence || existing?.sequence || Date.now(), // Preserve or assign sequence
          _sortKey: sortKey,
        };
      });
    },
    setMessagesAsRead: (state, action) => {
      const { chatRoomId, userId } = action.payload;
      const roomId = String(chatRoomId);
      if (state.messagesByRoom[roomId]) {
        Object.keys(state.messagesByRoom[roomId]).forEach((msgId) => {
          const msg = state.messagesByRoom[roomId][msgId];
          if (String(msg.recipient_id) === String(userId) && !msg.is_read) {
            state.messagesByRoom[roomId][msgId] = {
              ...msg,
              is_read: true,
              read_at: new Date().toISOString(),
              status: "read",
            };
          }
        });
        state.receivedUnreadCounts[roomId] = 0;
        saveUnreadCountToStorage("received", state.receivedUnreadCounts);
      }
    },
    updateMessageStatus: (state, action) => {
      const {
        messageIds,
        status,
        chatRoomId,
        replace = false,
      } = action.payload;
      const roomId = String(chatRoomId);

      if (!state.messagesByRoom[roomId]) {
        state.messagesByRoom[roomId] = {};
      }

      messageIds.forEach((msgId) => {
        const msgKey = String(msgId);
        if (!state.messagesByRoom[roomId][msgKey]) return;

        const current = state.messagesByRoom[roomId][msgKey];

        // Skip if incoming status is older
        const currentTime = new Date(
          current.last_updated_at || current.created_at
        ).getTime();
        const newTime = new Date(
          status.last_updated_at || status.created_at || new Date()
        ).getTime();
        if (newTime < currentTime) return;

        const updatedMessage = replace
          ? {
              ...status,
              id: String(status.id || msgKey),
              chat_room_id: roomId,
              _sortKey: current._sortKey,
              original_created_at: current.original_created_at,
              _isPending:
                status._isPending !== undefined ? status._isPending : false,
            }
          : {
              ...current,
              ...status,
              _sortKey: current._sortKey,
              original_created_at: current.original_created_at,
              _isPending:
                status._isPending !== undefined
                  ? status._isPending
                  : current._isPending,
            };

        state.messagesByRoom[roomId][msgKey] = updatedMessage;

        // Update last_message in chatRooms if necessary
        const roomIndex = state.chatRooms.findIndex(
          (room) => String(room.id) === roomId
        );
        if (roomIndex !== -1 && state.chatRooms[roomIndex].last_message) {
          const lastMessage = state.chatRooms[roomIndex].last_message;
          if (String(lastMessage.id) === msgKey) {
            state.chatRooms[roomIndex].last_message = {
              ...lastMessage,
              status: updatedMessage.status,
              is_delivered: updatedMessage.is_delivered,
              is_read: updatedMessage.is_read,
              read_at: updatedMessage.read_at,
              delivered_at: updatedMessage.delivered_at,
            };
          }
        }
      });
    },
    removePendingMessage: (state, action) => {
      const { tempId, chatRoomId } = action.payload;
      const roomId = String(chatRoomId);
      const msgId = String(tempId);
      if (state.messagesByRoom[roomId]?.[msgId]) {
        delete state.messagesByRoom[roomId][msgId];
      }
    },
    removeMessage: (state, action) => {
      const { chatRoomId, messageId } = action.payload;
      const roomId = String(chatRoomId);
      const msgId = String(messageId);
      if (state.messagesByRoom[roomId]?.[msgId]) {
        delete state.messagesByRoom[roomId][msgId];
      }
    },
    handleMessageFailed: (state, action) => {
      const { message_id, chat_room_id, error, timestamp } = action.payload;
      const roomId = String(chat_room_id);
      const msgId = String(message_id);

      if (state.messagesByRoom[roomId]?.[msgId]) {
        state.messagesByRoom[roomId][msgId] = {
          ...state.messagesByRoom[roomId][msgId],
          status: "failed",
          error: error || "Failed to send message",
          last_updated_at: timestamp || new Date().toISOString(),
          _isPending: false,
        };
      }
    },
    setChatRooms: (state, action) => {
      state.chatRooms = action.payload.map((room) => ({
        ...room,
        id: String(room.id),
      }));
    },
    setActiveRoom: (state, action) => {
      state.activeRoom = action.payload ? String(action.payload) : null;
    },
    setUnreadCounts: (state, action) => {
      const { received, sent } = action.payload;
      state.receivedUnreadCounts = { ...received };
      state.sentUnreadCounts = { ...sent };
      saveUnreadCountToStorage("received", state.receivedUnreadCounts);
      saveUnreadCountToStorage("sent", state.sentUnreadCounts);
    },
    resetUnreadCountForRoom: (state, action) => {
      const { roomId } = action.payload;
      state.receivedUnreadCounts[String(roomId)] = 0;
      saveUnreadCountToStorage("received", state.receivedUnreadCounts);
    },
    updateUnreadCount: (state, action) => {
      const { roomId, unreadCount } = action.payload;
      state.receivedUnreadCounts[String(roomId)] = unreadCount;
      saveUnreadCountToStorage("received", state.receivedUnreadCounts);
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchMessages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { chatRoomId, messages, meta } = action.payload;
        const roomId = String(chatRoomId);

        if (!state.messagesByRoom[roomId]) state.messagesByRoom[roomId] = {};

        messages.forEach((msg) => {
          const messageId = String(msg.id);
          const existing = state.messagesByRoom[roomId][messageId];
          const sortKey =
            existing?._sortKey ||
            new Date(msg.original_created_at || msg.created_at).getTime();

          state.messagesByRoom[roomId][messageId] = {
            ...msg,
            chat_room_id: roomId,
            id: messageId,
            isLocal: false,
            _sortKey: sortKey,
          };
        });

        state.pagination = {
          currentPage: meta.current_page || 1,
          perPage: meta.per_page || 20,
          total: meta.total || 0,
          lastPage: meta.last_page || 1,
        };
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch messages";
      })
      // fetchAllRoomMessages
      .addCase(fetchAllRoomMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllRoomMessages.fulfilled, (state, action) => {
        state.loading = false;
        Object.entries(action.payload).forEach(([roomId, messages]) => {
          if (!state.messagesByRoom[roomId]) state.messagesByRoom[roomId] = {};
          messages.forEach((msg) => {
            const messageId = String(msg.id);
            const existing = state.messagesByRoom[roomId][messageId];
            const sortKey =
              existing?._sortKey ||
              new Date(msg.original_created_at || msg.created_at).getTime();

            state.messagesByRoom[roomId][messageId] = {
              ...msg,
              chat_room_id: String(roomId),
              id: messageId,
              isLocal: false,
              _sortKey: sortKey,
            };
          });
        });
      })
      .addCase(fetchAllRoomMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch all room messages";
      })
      // sendMessage
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        const message = action.payload;
        const roomId = String(message.chat_room_id);
        const messageId = String(message.id);

        if (!state.messagesByRoom[roomId]) state.messagesByRoom[roomId] = {};

        const tempId = String(message.originalTempId);
        const tempMessage = state.messagesByRoom[roomId][tempId];

        const sortKey =
          tempMessage?._sortKey ||
          new Date(message.original_created_at || message.created_at).getTime();

        if (tempMessage) {
          delete state.messagesByRoom[roomId][tempId];
        }

        state.messagesByRoom[roomId][messageId] = {
          ...message,
          id: messageId,
          chat_room_id: roomId,
          status: message.is_read
            ? "read"
            : message.is_delivered
            ? "delivered"
            : "sent",
          isLocal: false,
          _sortKey: sortKey,
          _isPending: false,
        };
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to send message";
      })
      // markMessagesAsRead
      .addCase(markMessagesAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        state.loading = false;
        const { chatRoomId, message_ids } = action.payload;
        const roomId = String(chatRoomId);

        if (state.messagesByRoom[roomId] && message_ids.length) {
          message_ids.forEach((msgId) => {
            const messageId = String(msgId);
            if (state.messagesByRoom[roomId][messageId]) {
              state.messagesByRoom[roomId][messageId] = {
                ...state.messagesByRoom[roomId][messageId],
                is_read: true,
                read_at: new Date().toISOString(),
                status: "read",
                last_updated_at: new Date().toISOString(),
              };
            }
          });
        }
        state.receivedUnreadCounts[roomId] = 0;
        saveUnreadCountToStorage("received", state.receivedUnreadCounts);
      })
      .addCase(markMessagesAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to mark messages as read";
      });
  },
});

// Export actions
export const {
  addMessage,
  addMessages,
  setMessagesAsRead,
  updateMessageStatus,
  setChatRooms,
  setActiveRoom,
  setUnreadCounts, // Reintroduced
  resetUnreadCountForRoom,
  updateUnreadCount,
  removePendingMessage,
  removeMessage,
  handleMessageFailed,
} = chatSlice.actions;

// Export reducer
export default chatSlice.reducer;
