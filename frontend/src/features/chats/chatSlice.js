import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Utility to save unread counts to localStorage
export const saveUnreadCountToStorage = (type, unreadCount) => {
  localStorage.setItem(`${type}UnreadCount`, JSON.stringify(unreadCount));
};

// Utility to save temp chat rooms to localStorage
export const saveTempChatRoomsToStorage = (tempChatRooms) => {
  localStorage.setItem("tempChatRooms", JSON.stringify(tempChatRooms));
};

// Thunk to fetch paginated messages for a specific chat room
export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async ({ chatRoomId, page = 1, perPage = 20 }, { getState }) => {
    const { auth } = getState();
    const url = page
      ? `${process.env.REACT_APP_API}api/messages/${chatRoomId}?page=${page}&per_page=${perPage}`
      : `${process.env.REACT_APP_API}api/messages/${chatRoomId}`;
    if (String(chatRoomId).startsWith("temp-")) {
      return { chatRoomId: String(chatRoomId), messages: [], meta: {} };
    }
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
    const promises = chatRooms
      .filter((room) => !String(room.id).startsWith("temp-"))
      .map((room) =>
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
      const { auth, chat } = getState();
      const recipientId = formData.get("recipient_id");
      const tempRoomId = formData.get("chat_room_id");
      // Prevent duplicate room creation for the same recipient
      const existingRoom = chat.chatRooms.find(
        (room) =>
          String(room.recipient_id) === String(recipientId) &&
          !String(room.id).startsWith("temp-")
      );
      if (existingRoom) {
        formData.set("chat_room_id", existingRoom.id);
      }
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
      return { ...response.data.data, tempRoomId };
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

      if (!ids.length || String(chatRoomId).startsWith("temp-")) {
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
// Thunk to retry a failed message
export const retryFailedMessage = createAsyncThunk(
  "chat/retryFailedMessage",
  async ({ chatRoomId, messageId }, { getState }) => {
    const { auth } = getState();
    const formData = new FormData();
    formData.append("chat_room_id", chatRoomId);
    formData.append("message_id", messageId);
    const response = await axios.post(
      `${process.env.REACT_APP_API}api/retry-message`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${auth.user.token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  }
);
// Selector to get ordered messages for a room
export const selectOrderedMessages = (roomId) => (state) => {
  const roomMessages = state.chat.messagesByRoom[String(roomId)] || {};

  return Object.values(roomMessages).sort((a, b) => {
    // Urutkan berdasarkan sequence jika ada, convert to string for consistency
    if (a.sequence !== undefined && b.sequence !== undefined) {
      const aSeqStr = String(a.sequence);
      const bSeqStr = String(b.sequence);
      if (aSeqStr !== bSeqStr) {
        return aSeqStr.localeCompare(bSeqStr);
      }
    }

    // Fallback ke timestamp
    const aTime = new Date(
      a.original_created_at || a.created_at || 0
    ).getTime();
    const bTime = new Date(
      b.original_created_at || b.created_at || 0
    ).getTime();

    // Jika timestamp sama, gunakan ID sebagai tie-breaker
    if (aTime === bTime) {
      return String(a.id).localeCompare(String(b.id));
    }

    return aTime - bTime;
  });
};

// Initial state
const initialState = {
  chatRooms: [],
  tempChatRooms: [],
  tempToRealRoomMap: {},
  messagesByRoom: {},
  activeRoom: null,
  receivedUnreadCounts: {},
  sentUnreadCounts: {},
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
      const tempId = action.payload.originalTempId;
      const isPending =
        action.payload._isPending ||
        (typeof messageId === "string" && messageId.startsWith("temp-"));

      const consistentTimestamp =
        action.payload.original_created_at || action.payload.created_at || now;

      // Ensure sequence is a string and consistent
      const sequence = String(
        action.payload.sequence || new Date(consistentTimestamp).getTime()
      );

      const message = {
        ...action.payload,
        id: messageId,
        chat_room_id: String(action.payload.chat_room_id),
        original_created_at: consistentTimestamp,
        created_at: action.payload.created_at || consistentTimestamp,
        sequence,
        _sortKey: sequence,
        _isPending: isPending,
      };

      const roomId = String(message.chat_room_id);
      if (!state.roomsById[roomId]) {
        state.roomsById[roomId] = {
          id: roomId,
          name: "Unknown Room",
          participants: [],
          created_at: message.created_at,
          updated_at: message.created_at,
        };
      }
      if (!state.messagesByRoom[roomId]) state.messagesByRoom[roomId] = {};

      if (tempId && !isPending) {
        const tempKey = String(tempId);
        delete state.messagesByRoom[roomId][tempKey];
        for (const id in state.messagesByRoom[roomId]) {
          const m = state.messagesByRoom[roomId][id];
          if (m.originalTempId === tempKey && id !== messageId) {
            delete state.messagesByRoom[roomId][id];
          }
        }
      }

      const existing = state.messagesByRoom[roomId][messageId];
      const shouldReplace =
        !existing ||
        new Date(message.created_at).getTime() >
          new Date(existing.created_at).getTime();

      if (shouldReplace) {
        state.messagesByRoom[roomId][messageId] = message;
      }
    },

    // --- END PATCH ---

    addMessages: (state, action) => {
      const messages = action.payload;
      if (!Array.isArray(messages)) return;

      const isNewRoom = messages?.[0]?.new_room;
      const realRoomId = String(messages?.[0]?.chat_room_id);
      const messageIdsToKeep = new Set(messages.map((m) => String(m.id)));

      if (isNewRoom && state.messagesByRoom[realRoomId]) {
        Object.keys(state.messagesByRoom[realRoomId]).forEach((msgId) => {
          const msg = state.messagesByRoom[realRoomId][msgId];
          if (msg._isPending && !messageIdsToKeep.has(msgId)) {
            delete state.messagesByRoom[realRoomId][msgId];
          }
        });
      }

      messages.forEach((message) => {
        const roomId = String(message.chat_room_id);
        if (!state.messagesByRoom[roomId]) state.messagesByRoom[roomId] = {};

        const messageId = String(message.id);
        const existing = state.messagesByRoom[roomId][messageId];
        const sortKey =
          existing?._sortKey ||
          new Date(message.original_created_at || message.created_at).getTime();

        // Ensure sequence is a string
        const sequence = String(message.sequence || sortKey);

        state.messagesByRoom[roomId][messageId] = {
          ...message,
          id: messageId,
          chat_room_id: roomId,
          isLocal: false,
          sequence,
          _sortKey: sortKey,
        };
      });
    },
    clearMessagesExceptFirst: (state, action) => {
      const { roomId, keepId, tempId } =
        typeof action === "object" ? action : {};
      if (!state.messagesByRoom[roomId]) return;
      Object.keys(state.messagesByRoom[roomId]).forEach((id) => {
        if (id !== String(keepId) && id !== String(tempId)) {
          delete state.messagesByRoom[roomId][id];
        }
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
        messageIds, // Array ID pesan yang akan diperbarui statusnya
        status, // Status baru yang akan diperbarui
        chatRoomId, // ID room chat tempat pesan berada
        replace = false, // Flag untuk menggantikan pesan yang ada
      } = action.payload;
      const roomId = String(chatRoomId); // Konversi roomId ke string

      // Jika room belum ada dalam state.messagesByRoom, buat room baru
      if (!state.messagesByRoom[roomId]) {
        state.messagesByRoom[roomId] = {};
      }

      // Iterasi setiap ID pesan untuk memperbarui statusnya
      messageIds.forEach((msgId) => {
        const msgKey = String(msgId); // Pastikan msgId adalah string
        if (!state.messagesByRoom[roomId][msgKey]) return; // Jika pesan tidak ditemukan, lewati

        const current = state.messagesByRoom[roomId][msgKey]; // Ambil data pesan yang ada

        // Tentukan pesan yang diperbarui
        const updatedMessage = replace
          ? {
              ...current, // Pertahankan data asli pesan
              ...status, // Gabungkan dengan status baru
              id: String(status.id || msgKey), // Tentukan ID pesan
              chat_room_id: roomId, // Tentukan ID room chat
              _sortKey: current._sortKey, // Pertahankan _sortKey asli
              sequence: current.sequence || current._sortKey, // Tentukan urutan berdasarkan sequence atau _sortKey
              original_created_at: current.original_created_at, // Pastikan tanggal pembuatan asli tetap ada
              _isPending:
                status._isPending !== undefined ? status._isPending : false, // Tentukan status pending
            }
          : {
              ...current, // Gabungkan status baru dengan data pesan yang ada
              ...status,
              _sortKey: current._sortKey, // Pertahankan _sortKey
              sequence: current.sequence || current._sortKey, // Tentukan urutan berdasarkan sequence atau _sortKey
              original_created_at: current.original_created_at, // Pertahankan tanggal pembuatan asli
              _isPending:
                status._isPending !== undefined
                  ? status._isPending
                  : current._isPending, // Tentukan status pending jika ada
            };

        // Simpan pesan yang sudah diperbarui dalam state.messagesByRoom[roomId]
        state.messagesByRoom[roomId][msgKey] = updatedMessage;

        // Update `last_message` di room chat jika pesan yang diperbarui adalah pesan terakhir di room tersebut
        const roomIndex = state.chatRooms.findIndex(
          (room) => String(room.id) === roomId
        );
        if (roomIndex !== -1 && state.chatRooms[roomIndex].last_message) {
          const lastMessage = state.chatRooms[roomIndex].last_message;
          if (String(lastMessage.id) === msgKey) {
            // Jika pesan yang diperbarui adalah pesan terakhir, update last_message di room chat
            state.chatRooms[roomIndex].last_message = {
              ...lastMessage,
              status: updatedMessage.status, // Update status pesan terakhir
              is_delivered: updatedMessage.is_delivered,
              is_read: updatedMessage.is_read,
              read_at: updatedMessage.read_at,
              delivered_at: updatedMessage.delivered_at,
            };
          }
        }
      });
    },

    handleMessageConfirmed: (state, action) => {
      const message = action.payload;
      const roomId = String(message.chat_room_id);
      const messageId = String(message.id);

      if (!state.messagesByRoom[roomId]) {
        state.messagesByRoom[roomId] = {};
      }

      const tempId = String(message.originalTempId);
      if (tempId && state.messagesByRoom[roomId][tempId]) {
        delete state.messagesByRoom[roomId][tempId]; // Remove pending message
      }

      const existing = state.messagesByRoom[roomId][messageId];
      const sortKey =
        existing?._sortKey ||
        new Date(message.original_created_at || message.created_at).getTime();

      state.messagesByRoom[roomId][messageId] = {
        ...message,
        id: messageId,
        chat_room_id: roomId,
        sequence: message.sequence || Date.now(),

        status: message.is_read
          ? "read"
          : message.is_delivered
          ? "delivered"
          : "sent",
        isLocal: false,
        _sortKey: sortKey,
        _isPending: false,
      };
    },
    removePendingMessage: (state, action) => {
      const { tempId, chatRoomId } = action.payload;
      const roomId = String(chatRoomId);
      const msgId = String(tempId);

      if (state.messagesByRoom && state.messagesByRoom[roomId]?.[msgId]) {
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
    replaceChatRooms(state, action) {
      state.chatRooms = action.payload || [];
    },
    removeChatRoom: (state, action) => {
      const idToRemove = String(action.payload);

      // Hapus dari array chatRooms
      state.chatRooms = state.chatRooms.filter(
        (room) => String(room.id) !== idToRemove
      );

      // Hapus dari roomsById
      if (state.roomsById?.[idToRemove]) {
        delete state.roomsById[idToRemove];
      }

      // Jika activeRoom adalah temp yang dihapus, reset
      if (state.activeRoom === idToRemove) {
        state.activeRoom = null;
      }

      console.log(`Removed temp room: ${idToRemove}`);
    },

    addChatRoom: (state, action) => {
      const newRoom = { ...action.payload, id: String(action.payload.id) };

      if (!state.roomsById) {
        state.roomsById = {};
      }

      if (!state.roomsById[newRoom.id]) {
        state.roomsById[newRoom.id] = newRoom;
      } else {
        state.roomsById[newRoom.id] = {
          ...state.roomsById[newRoom.id],
          ...newRoom,
        };
      }

      const exists = state.chatRooms.some(
        (room) => String(room.id) === newRoom.id
      );
      if (!exists) {
        state.chatRooms.unshift(newRoom);
        console.log(`Added new room: ${newRoom.id}`);
      } else {
        console.log(`Room ${newRoom.id} already exists, skipping add`);
      }
    },

    setChatRooms: (state, action) => {
      state.chatRooms = action.payload.map((room) => ({
        ...room,
        id: String(room.id),
      }));
    },
    setActiveRoom: (state, action) => {
      state.activeRoom = String(action.payload);
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
    addTempChatRoom: (state, action) => {
      const tempRoom = {
        ...action.payload,
        id: String(action.payload.id),
        isTemp: true,
      };
      const exists = state.tempChatRooms.some(
        (room) => String(room.id) === String(tempRoom.id)
      );
      if (!exists) {
        state.tempChatRooms.push(tempRoom);
        state.chatRooms.push(tempRoom);
        saveTempChatRoomsToStorage(state.tempChatRooms);
        console.log(`Added temp room: ${tempRoom.id}`);
      }
    },
    confirmChatRoom: (state, action) => {
      const { tempId, newRoom } = action.payload;
      const newRoomId = String(newRoom.id);
      const tempRoomId = String(tempId);

      if (tempRoomId && newRoomId && tempRoomId !== newRoomId) {
        const pendingMessages = state.messagesByRoom[tempRoomId] || {};
        const existingMessages = state.messagesByRoom[newRoomId] || {};

        const mergedMessages = { ...existingMessages };

        Object.entries(pendingMessages).forEach(([msgId, msg]) => {
          if (!existingMessages[msgId]) {
            mergedMessages[msgId] = {
              ...msg,
              chat_room_id: newRoomId,
              _isPending: msg._isPending || false,
            };
          }
        });

        state.messagesByRoom[newRoomId] = mergedMessages;
        delete state.messagesByRoom[tempRoomId];
      }

      // Update room list
      state.chatRooms = state.chatRooms.map((room) =>
        String(room.id) === tempRoomId ? newRoom : room
      );
      state.tempToRealRoomMap[tempRoomId] = newRoomId;

      if (state.activeRoom === tempRoomId) {
        state.activeRoom = newRoomId;
      }

      const roomIndex = state.chatRooms.findIndex(
        (r) => String(r.id) === newRoomId
      );
      if (roomIndex !== -1 && newRoom.last_message) {
        state.chatRooms[roomIndex].last_message = newRoom.last_message;
      }
    },
  },
  extraReducers: (builder) => {
    builder
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
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // --- PATCHED: sendMessage.fulfilled now cleans up all other messages when new_room ---

      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        const {
          id,
          chat_room_id,
          originalTempId,
          new_room,
          chat_room,
          tempRoomId,
          ...restPayload
        } = action.payload;
        const roomId = String(chat_room_id);
        const messageId = String(id);

        if (!state.messagesByRoom[roomId]) {
          state.messagesByRoom[roomId] = {};
        }

        // Hapus semua pesan dengan originalTempId yang sama di semua ruang
        if (originalTempId) {
          Object.keys(state.messagesByRoom).forEach((roomKey) => {
            Object.keys(state.messagesByRoom[roomKey]).forEach((msgId) => {
              if (
                state.messagesByRoom[roomKey][msgId].originalTempId ===
                originalTempId
              ) {
                delete state.messagesByRoom[roomKey][msgId];
              }
            });
          });
        }

        state.messagesByRoom[roomId][messageId] = {
          ...restPayload,
          id: messageId,
          chat_room_id: roomId,
          status: restPayload.is_read
            ? "read"
            : restPayload.is_delivered
            ? "delivered"
            : "sent",
          isLocal: false,
          _sortKey: new Date(
            restPayload.original_created_at || restPayload.created_at
          ).getTime(),
          _isPending: false,
        };

        // Logika untuk new_room tetap dipertahankan
        if (new_room && chat_room && tempRoomId) {
          const tempIdStr = String(tempRoomId);
          const newRoomId = String(chat_room.id);

          // Hapus semua pesan pending dari temp room
          if (state.messagesByRoom[tempIdStr]) {
            Object.keys(state.messagesByRoom[tempIdStr]).forEach((msgId) => {
              if (state.messagesByRoom[tempIdStr][msgId]._isPending) {
                delete state.messagesByRoom[tempIdStr][msgId];
              }
            });
          }

          // Pindahkan pesan yang sudah dikonfirmasi
          if (state.messagesByRoom[tempIdStr]) {
            state.messagesByRoom[newRoomId] = {
              ...(state.messagesByRoom[newRoomId] || {}),
              ...Object.fromEntries(
                Object.entries(state.messagesByRoom[tempIdStr]).map(
                  ([msgId, msg]) => [
                    msgId,
                    {
                      ...msg,
                      chat_room_id: newRoomId,
                      _isPending: false,
                    },
                  ]
                )
              ),
            };
            delete state.messagesByRoom[tempIdStr];
          }

          // Hapus temporary room dari chatRooms dan tempChatRooms
          state.chatRooms = state.chatRooms.filter(
            (room) => String(room.id) !== tempIdStr
          );
          state.tempChatRooms = state.tempChatRooms.filter(
            (room) => String(room.id) !== tempIdStr
          );

          // Tambahkan real room
          const roomExists = state.chatRooms.some(
            (room) => String(room.id) === newRoomId
          );
          if (!roomExists) {
            state.chatRooms.unshift({
              ...chat_room,
              id: newRoomId,
              recipient: chat_room.recipient || {
                id: chat_room.recipient_id,
                name: chat_room.recipient_name || "New Contact",
              },
            });
          }

          // Update activeRoom
          if (state.activeRoom === tempIdStr) {
            state.activeRoom = newRoomId;
          }

          // Pindahkan unread counts
          if (state.receivedUnreadCounts[tempIdStr]) {
            state.receivedUnreadCounts[newRoomId] =
              state.receivedUnreadCounts[tempIdStr];
            delete state.receivedUnreadCounts[tempIdStr];
            saveUnreadCountToStorage("received", state.receivedUnreadCounts);
          }

          state.tempToRealRoomMap[tempIdStr] = newRoomId;
          saveTempChatRoomsToStorage(state.tempChatRooms);
        }
      })
      .addCase(retryFailedMessage.rejected, (state, action) => {
        const { chat_room_id, message_id } = action.meta.arg;
        const roomId = String(chat_room_id);
        const messageId = String(message_id);
        if (state.messagesByRoom[roomId]?.[messageId]) {
          state.messagesByRoom[roomId][messageId] = {
            ...state.messagesByRoom[roomId][messageId],
            error: action.payload || "Failed to retry message",
            last_updated_at: new Date().toISOString(),
          };
        }
        state.error = action.payload || "Failed to retry message";
      })
      .addCase(retryFailedMessage.fulfilled, (state, action) => {
        const { id, chat_room_id, ...rest } = action.payload;
        const roomId = String(chat_room_id);
        const messageId = String(id);
        if (state.messagesByRoom[roomId]?.[messageId]) {
          state.messagesByRoom[roomId][messageId] = {
            ...state.messagesByRoom[roomId][messageId],
            ...rest,
            status: "sent",
            error: null,
            _isPending: false,
          };
        }
      })

      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to send message";
      })
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
      })
      .addCase(confirmChatRoom, (state, action) => {
        const { tempId, newRoom } = action.payload;
        const newRoomId = String(newRoom.id);
        const tempRoomId = String(tempId);

        if (tempRoomId && newRoomId && tempRoomId !== newRoomId) {
          // Pindahkan pesan dengan pembaruan status
          if (state.messagesByRoom[tempRoomId]) {
            state.messagesByRoom[newRoomId] = Object.fromEntries(
              Object.entries(state.messagesByRoom[tempRoomId]).map(
                ([msgId, msg]) => [
                  msgId,
                  {
                    ...msg,
                    chat_room_id: newRoomId,
                    _isPending: false,
                    status: msg.is_read
                      ? "read"
                      : msg.is_delivered
                      ? "delivered"
                      : "sent",
                  },
                ]
              )
            );
            delete state.messagesByRoom[tempRoomId];
          }

          // Hapus room temp dari chatRooms
          state.chatRooms = state.chatRooms.filter(
            (room) => String(room.id) !== String(tempId)
          );

          // Tambahkan room baru
          state.chatRooms.push(newRoom);

          // Pindahkan unreadCounts
          if (state.receivedUnreadCounts[tempId]) {
            state.receivedUnreadCounts[newRoomId] =
              state.receivedUnreadCounts[tempId];
            delete state.receivedUnreadCounts[tempId];
            saveUnreadCountToStorage("received", state.receivedUnreadCounts);
          }
        }
      });
  },
});

// Export actions
export const {
  addMessage,
  addMessages,
  setMessagesAsRead,
  updateMessageStatus,
  handleMessageConfirmed,
  setChatRooms,
  setActiveRoom,
  setUnreadCounts,
  resetUnreadCountForRoom,
  updateUnreadCount,
  removePendingMessage,
  removeMessage,
  handleMessageFailed,
  addTempChatRoom,
  confirmChatRoom,
  replaceChatRooms,
  addChatRoom,
  removeChatRoom,
  clearMessagesExceptFirst,
} = chatSlice.actions;

// Export reducer
export default chatSlice.reducer;
