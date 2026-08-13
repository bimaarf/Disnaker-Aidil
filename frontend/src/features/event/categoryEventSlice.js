import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const categoryEventCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // Cache 5 menit

const isCacheValid = (cacheEntry) => {
  if (!cacheEntry) return false;
  const { timestamp } = cacheEntry;
  return Date.now() - timestamp < CACHE_DURATION;
};

const getCachedCategoryEvent = (key) => {
  const cacheEntry = categoryEventCache.get(key);
  if (isCacheValid(cacheEntry)) {
    return cacheEntry.data;
  }
  categoryEventCache.delete(key);
  return null;
};

const setCachedCategoryEvent = (key, data) => {
  categoryEventCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

export const createCategoryEvent = createAsyncThunk(
  "categoryEvents/createCategoryEvent",
  async (categoryEventData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/event/category`,
        categoryEventData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.category;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create categoryEvent"
      );
    }
  }
);

export const fetchCategoryEvents = createAsyncThunk(
  "categoryEvents/fetchCategoryEvents",
  async ({ page = 1, perPage = 10 }, { rejectWithValue }) => {
    const cacheKey = `categoryEvents_page_${page}_perPage_${perPage}`;
    const cachedData = getCachedCategoryEvent(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/event/category`,
        { params: { page, perPage } }
      );
      const data = {
        categoryEvents: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        totalVisible: response.data.total_visible,
        totalHidden: response.data.total_hidden,
        total: response.data.total,
      };
      setCachedCategoryEvent(cacheKey, data);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch categoryEvents"
      );
    }
  }
);

export const fetchCategoryEvent = createAsyncThunk(
  "categoryEvents/fetchCategoryEvent",
  async (categoryEventKey, { rejectWithValue }) => {
    const cachedData = getCachedCategoryEvent(categoryEventKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/event/category/${categoryEventKey}`
      );
      const data =
        response.data.data || response.data.category || response.data;
      setCachedCategoryEvent(categoryEventKey, data);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch categoryEvent"
      );
    }
  }
);

export const updateCategoryEvent = createAsyncThunk(
  "categoryEvents/updateCategoryEvent",
  async ({ key, categoryEventData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/event/category/${key}`,
        categoryEventData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.category;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update categoryEvent"
      );
    }
  }
);

export const deleteCategoryEvent = createAsyncThunk(
  "categoryEvents/deleteCategoryEvent",
  async (categoryEventId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/event/category/${categoryEventId}`
      );
      // Hapus cache setelah penghapusan sukses
      categoryEventCache.delete(categoryEventId);
      return categoryEventId;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to delete categoryEvent"
      );
    }
  }
);

export const deleteCategoryEvents = createAsyncThunk(
  "categoryEvents/deleteCategoryEvents",
  async (categoryEventIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        categoryEventIds.map(async (id) => {
          try {
            await axios.delete(
              `${process.env.REACT_APP_API}api/event/category/${id}`
            );
            // Hapus cache untuk setiap kategori event yang dihapus
            categoryEventCache.delete(id);
          } catch (err) {
            if (err.response && err.response.status === 401) {
              throw new Error("Unauthorized - Logging out");
            }
            throw err;
          }
        })
      );
      return categoryEventIds;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete categoryEvents");
    }
  }
);

const categoryEventSlice = createSlice({
  name: "categoryEvents",
  initialState: {
    categoryEvents: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 10,
    totalVisible: 0,
    totalHidden: 0,
    totalPages: 1,
    total: null,
    categoryEvent: null,
  },
  reducers: {
    resetCategoryEventStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setCategoryEventPage(state, action) {
      state.page = action.payload;
    },
    updateSingleCategoryEvent(state, action) {
      const updatedcategoryEvent = action.payload;
      const index = state.categoryEvents.findIndex(
        (categoryEvent) => categoryEvent.id === updatedcategoryEvent.id
      );
      if (index !== -1) {
        state.categoryEvents[index] = updatedcategoryEvent;
      }
    },
    clearCategoryEventCache: () => {
      categoryEventCache.clear();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCategoryEvent.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createCategoryEvent.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categoryEvents.unshift(action.payload);
      })
      .addCase(createCategoryEvent.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchCategoryEvents.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCategoryEvents.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categoryEvents = [
          ...state.categoryEvents,
          ...action.payload.categoryEvents,
        ];
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalVisible = action.payload.totalVisible;
        state.totalHidden = action.payload.totalHidden;
        state.total = action.payload.total;
      })
      .addCase(fetchCategoryEvents.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchCategoryEvent.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCategoryEvent.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categoryEvent = action.payload;
      })
      .addCase(fetchCategoryEvent.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateCategoryEvent.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateCategoryEvent.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedCategoryEvent = action.payload;
        const index = state.categoryEvents.findIndex(
          (categoryEvent) => categoryEvent.key === updatedCategoryEvent.key
        );
        if (index !== -1) {
          state.categoryEvents[index] = updatedCategoryEvent; // Update local state
        }
        if (
          state.categoryEvent &&
          state.categoryEvent.key === updatedCategoryEvent.key
        ) {
          state.categoryEvent = updatedCategoryEvent; // Update single view
        }
      })

      .addCase(updateCategoryEvent.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteCategoryEvent.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteCategoryEvent.fulfilled, (state, action) => {
        state.status = "succeeded";
        const deletedId = action.payload;
        state.categoryEvents = state.categoryEvents.filter(
          (categoryEvent) => categoryEvent.id !== deletedId
        );
        categoryEventCache.delete(deletedId);
      })
      .addCase(deleteCategoryEvent.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteCategoryEvents.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteCategoryEvents.fulfilled, (state, action) => {
        state.status = "succeeded";
        const deletedIds = action.payload;
        state.categoryEvents = state.categoryEvents.filter(
          (categoryEvent) => !deletedIds.includes(categoryEvent.id)
        );
        deletedIds.forEach((id) => categoryEventCache.delete(id));
      })
      .addCase(deleteCategoryEvents.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetCategoryEventStatus,
  setCategoryEventPage,
  updateSingleCategoryEvent,
  clearCategoryEventCache,
} = categoryEventSlice.actions;
export default categoryEventSlice.reducer;
