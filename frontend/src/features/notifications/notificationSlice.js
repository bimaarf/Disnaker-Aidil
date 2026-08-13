import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// Create a new notification
export const createNotification = createAsyncThunk(
  "notifications/createNotification",
  async (notificationData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/notifications`,
        notificationData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create notification"
      );
    }
  }
);

// Fetch notifications with pagination
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async ({ page = 1, perPage = 10, fetchAll = false }, { rejectWithValue }) => {
    try {
      const url = `${process.env.REACT_APP_API}api/notifications`;

      // Set params for fetching notifications
      const params = {
        page,
        perPage,
        fetchAll, // Add fetchAll parameter
      };

      const response = await axios.get(url, { params });

      return {
        notifications: response.data.data,
        currentPage: fetchAll ? 1 : response.data.current_page,
        totalPages: fetchAll ? 1 : response.data.last_page,
        total: response.data.total || 0,
        totalActive: response.data.total_active,
        totalSuspend: response.data.total_suspend,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch notifications"
      );
    }
  }
);

// Fetch a single notification by its id
export const fetchNotification = createAsyncThunk(
  "notifications/fetchNotification",
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/notifications/${notificationId}`
      );
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch notification"
      );
    }
  }
);

// Update an existing notification
export const updateNotification = createAsyncThunk(
  "notifications/updateNotification",
  async ({ id, notificationData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/notifications/${id}`,
        notificationData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update notification"
      );
    }
  }
);

export const deleteNotification = createAsyncThunk(
  "notifications/deleteNotification",
  async (notificationId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/notifications/${notificationId}`
      );
      return notificationId;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to delete notification"
      );
    }
  }
);

export const deleteNotifications = createAsyncThunk(
  "notifications/deleteNotifications",
  async (notificationIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        notificationIds.map((id) =>
          axios.delete(`${process.env.REACT_APP_API}api/notifications/${id}`)
        )
      );
      return notificationIds;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to delete notifications"
      );
    }
  }
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    notifications: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 10,
    totalPages: 1,
    total: null,
    totalActive: null,
    totalSuspend: null,
    notification: null,
  },
  reducers: {
    resetNotificationStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setPage(state, action) {
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
      // Create Notification
      .addCase(createNotification.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createNotification.fulfilled, (state, action) => {
        state.status = "succeeded";

        state.notifications = [action.payload, ...state.notifications];
        state.total += 1;
      })

      .addCase(createNotification.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.notifications =
          action.payload.currentPage === 1
            ? action.payload.notifications
            : [...state.notifications, ...action.payload.notifications];
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalActive = action.payload.totalActive;
        state.totalSuspend = action.payload.totalSuspend;
        state.total = action.payload.total;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Fetch Notification
      .addCase(fetchNotification.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchNotification.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.notification = action.payload;
      })
      .addCase(fetchNotification.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Update Notification
      .addCase(updateNotification.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateNotification.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedNotification = action.payload;

        // Update notification in notifications list
        const index = state.notifications.findIndex(
          (notification) => notification.id === updatedNotification.id
        );
        if (index !== -1) {
          state.notifications[index] = updatedNotification;
        }

        // Update single notification if it's the one currently being viewed
        if (
          state.notification &&
          state.notification.id === updatedNotification.id
        ) {
          state.notification = updatedNotification;
        }
      })
      .addCase(updateNotification.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Delete Notification
      .addCase(deleteNotification.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.notifications = state.notifications.filter(
          (notification) => notification.key !== action.payload
        );
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Delete Notifications
      .addCase(deleteNotifications.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteNotifications.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.notifications = state.notifications.filter(
          (notification) => !action.payload.includes(notification.key)
        );
      })
      .addCase(deleteNotifications.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { resetNotificationStatus, setPage, updateSingleNotification } =
  notificationsSlice.actions;
export default notificationsSlice.reducer;
