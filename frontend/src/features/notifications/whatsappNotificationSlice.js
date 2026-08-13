import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// Thunk untuk mengambil semua notifikasi WhatsApp
export const fetchWhatsAppNotifications = createAsyncThunk(
  "whatsappNotification/fetchWhatsAppNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/whatsapp-notifications`
      );
      return {
        notifications: response.data.data,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch notifications"
      );
    }
  }
);

// Thunk untuk mengambil detail notifikasi WhatsApp
export const fetchWhatsAppNotificationById = createAsyncThunk(
  "whatsappNotification/fetchWhatsAppNotificationById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/whatsapp-notifications/${id}`
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch notification"
      );
    }
  }
);

// Thunk untuk membuat notifikasi WhatsApp
export const createWhatsAppNotification = createAsyncThunk(
  "whatsappNotification/createWhatsAppNotification",
  async (notificationData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/whatsapp-notifications`,
        notificationData,
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create notification"
      );
    }
  }
);

// Thunk untuk update notifikasi WhatsApp
export const updateWhatsAppNotification = createAsyncThunk(
  "whatsappNotification/updateWhatsAppNotification",
  async ({ id, notificationData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API}api/whatsapp-notifications/${id}`,
        notificationData,
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to update notification"
      );
    }
  }
);

// Thunk untuk delete notifikasi WhatsApp
export const deleteWhatsAppNotification = createAsyncThunk(
  "whatsappNotification/deleteWhatsAppNotification",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/whatsapp-notifications/${id}`
      );
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to delete notification"
      );
    }
  }
);

const whatsappNotificationSlice = createSlice({
  name: "whatsappNotification",
  initialState: {
    notifications: [],
    selectedNotification: null,
    status: "idle",
    error: null,
    page: 1,
    perPage: 10,
    totalPages: 1,
    total: 0,
  },
  reducers: {
    resetWhatsAppNotificationStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setWhatsAppNotificationPage(state, action) {
      state.page = action.payload;
    },
    updateSingleNotification(state, action) {
      const updatedNotification = action.payload;
      const index = state.notifications.findIndex(
        (notification) => notification.id === updatedNotification.id
      );

      if (index !== -1) {
        state.notifications[index] = updatedNotification;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all notifications
      .addCase(fetchWhatsAppNotifications.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchWhatsAppNotifications.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.notifications = action.payload.notifications;
        state.total = action.payload.notifications.length;
        state.error = null;
      })
      .addCase(fetchWhatsAppNotifications.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Fetch by ID
      .addCase(fetchWhatsAppNotificationById.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchWhatsAppNotificationById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.selectedNotification = action.payload;
        state.error = null;
      })
      .addCase(fetchWhatsAppNotificationById.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Create notification - Update state langsung tanpa fetch ulang
      .addCase(createWhatsAppNotification.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createWhatsAppNotification.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Tambahkan notifikasi baru ke awal array
        state.notifications.unshift(action.payload);
        state.total += 1;
        state.error = null;
      })
      .addCase(createWhatsAppNotification.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Update notification - Update state langsung tanpa fetch ulang
      .addCase(updateWhatsAppNotification.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateWhatsAppNotification.fulfilled, (state, action) => {
        state.status = "succeeded";
        const index = state.notifications.findIndex(
          (notification) => notification.id === action.payload.id
        );
        if (index !== -1) {
          // Update notifikasi yang sudah ada dengan data terbaru
          state.notifications[index] = {
            ...state.notifications[index],
            ...action.payload,
          };
        }
        // Update selectedNotification jika sedang dibuka
        if (state.selectedNotification?.id === action.payload.id) {
          state.selectedNotification = action.payload;
        }
        state.error = null;
      })
      .addCase(updateWhatsAppNotification.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Delete notification - Update state langsung tanpa fetch ulang
      .addCase(deleteWhatsAppNotification.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(deleteWhatsAppNotification.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Hapus notifikasi dari array
        state.notifications = state.notifications.filter(
          (notification) => notification.id !== action.payload
        );
        state.total -= 1;
        // Clear selectedNotification jika yang dihapus sedang dibuka
        if (state.selectedNotification?.id === action.payload) {
          state.selectedNotification = null;
        }
        state.error = null;
      })
      .addCase(deleteWhatsAppNotification.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetWhatsAppNotificationStatus,
  setWhatsAppNotificationPage,
  updateSingleNotification,
  clearSelectedNotification,
} = whatsappNotificationSlice.actions;

export default whatsappNotificationSlice.reducer;
