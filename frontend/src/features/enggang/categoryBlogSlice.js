import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const categoryBlogCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // Cache 5 menit

const isCacheValid = (cacheEntry) => {
  if (!cacheEntry) return false;
  const { timestamp } = cacheEntry;
  return Date.now() - timestamp < CACHE_DURATION;
};

const getCachedCategoryBlog = (key) => {
  const cacheEntry = categoryBlogCache.get(key);
  if (isCacheValid(cacheEntry)) {
    return cacheEntry.data;
  }
  categoryBlogCache.delete(key);
  return null;
};

const setCachedCategoryBlog = (key, data) => {
  categoryBlogCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

export const createCategoryBlog = createAsyncThunk(
  "categoryBlogs/createCategoryBlog",
  async (categoryBlogData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/blog/category`,
        categoryBlogData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.category;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create categoryBlog"
      );
    }
  }
);

export const fetchCategoryBlogs = createAsyncThunk(
  "categoryBlogs/fetchCategoryBlogs",
  async ({ page = 1, perPage = 10 }, { rejectWithValue }) => {
    const cacheKey = `categoryBlogs_page_${page}_perPage_${perPage}`;
    const cachedData = getCachedCategoryBlog(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/blog/category`,
        { params: { page, perPage } }
      );
      const data = {
        categoryBlogs: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        totalVisible: response.data.total_visible,
        totalHidden: response.data.total_hidden,
        total: response.data.total,
      };
      setCachedCategoryBlog(cacheKey, data);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch categoryBlogs"
      );
    }
  }
);

export const fetchCategoryBlog = createAsyncThunk(
  "categoryBlogs/fetchCategoryBlog",
  async (categoryBlogKey, { rejectWithValue }) => {
    const cachedData = getCachedCategoryBlog(categoryBlogKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/blog/category/${categoryBlogKey}`
      );
      const data =
        response.data.data || response.data.category || response.data;
      setCachedCategoryBlog(categoryBlogKey, data);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch categoryBlog"
      );
    }
  }
);

export const updateCategoryBlog = createAsyncThunk(
  "categoryBlogs/updateCategoryBlog",
  async ({ key, categoryBlogData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/blog/category/${key}`,
        categoryBlogData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.category;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update categoryBlog"
      );
    }
  }
);

export const deleteCategoryBlog = createAsyncThunk(
  "categoryBlogs/deleteCategoryBlog",
  async (categoryBlogId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/blog/category/${categoryBlogId}`
      );
      // Hapus cache setelah penghapusan sukses
      categoryBlogCache.delete(categoryBlogId);
      return categoryBlogId;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to delete categoryBlog"
      );
    }
  }
);

export const deleteCategoryBlogs = createAsyncThunk(
  "categoryBlogs/deleteCategoryBlogs",
  async (categoryBlogIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        categoryBlogIds.map(async (id) => {
          try {
            await axios.delete(
              `${process.env.REACT_APP_API}api/blog/category/${id}`
            );
            // Hapus cache untuk setiap kategori blog yang dihapus
            categoryBlogCache.delete(id);
          } catch (err) {
            if (err.response && err.response.status === 401) {
              throw new Error("Unauthorized - Logging out");
            }
            throw err;
          }
        })
      );
      return categoryBlogIds;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete categoryBlogs");
    }
  }
);

const categoryBlogSlice = createSlice({
  name: "categoryBlogs",
  initialState: {
    categoryBlogs: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 10,
    totalVisible: 0,
    totalHidden: 0,
    totalPages: 1,
    total: null,
    categoryBlog: null,
  },
  reducers: {
    resetCategoryBlogStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setCategoryBlogPage(state, action) {
      state.page = action.payload;
    },
    updateSingleCategoryBlog(state, action) {
      const updatedcategoryBlog = action.payload;
      const index = state.categoryBlogs.findIndex(
        (categoryBlog) => categoryBlog.id === updatedcategoryBlog.id
      );
      if (index !== -1) {
        state.categoryBlogs[index] = updatedcategoryBlog;
      }
    },
    clearCategoryBlogCache: () => {
      categoryBlogCache.clear();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCategoryBlog.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createCategoryBlog.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categoryBlogs.unshift(action.payload);
      })
      .addCase(createCategoryBlog.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchCategoryBlogs.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCategoryBlogs.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categoryBlogs = [
          ...state.categoryBlogs,
          ...action.payload.categoryBlogs,
        ];
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalVisible = action.payload.totalVisible;
        state.totalHidden = action.payload.totalHidden;
        state.total = action.payload.total;
      })
      .addCase(fetchCategoryBlogs.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchCategoryBlog.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCategoryBlog.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categoryBlog = action.payload;
      })
      .addCase(fetchCategoryBlog.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateCategoryBlog.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateCategoryBlog.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedCategoryBlog = action.payload;
        const index = state.categoryBlogs.findIndex(
          (categoryBlog) => categoryBlog.key === updatedCategoryBlog.key
        );
        if (index !== -1) {
          state.categoryBlogs[index] = updatedCategoryBlog; // Update local state
        }
        if (
          state.categoryBlog &&
          state.categoryBlog.key === updatedCategoryBlog.key
        ) {
          state.categoryBlog = updatedCategoryBlog; // Update single view
        }
      })

      .addCase(updateCategoryBlog.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteCategoryBlog.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteCategoryBlog.fulfilled, (state, action) => {
        state.status = "succeeded";
        const deletedId = action.payload;
        state.categoryBlogs = state.categoryBlogs.filter(
          (categoryBlog) => categoryBlog.id !== deletedId
        );
        categoryBlogCache.delete(deletedId);
      })
      .addCase(deleteCategoryBlog.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteCategoryBlogs.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteCategoryBlogs.fulfilled, (state, action) => {
        state.status = "succeeded";
        const deletedIds = action.payload;
        state.categoryBlogs = state.categoryBlogs.filter(
          (categoryBlog) => !deletedIds.includes(categoryBlog.id)
        );
        deletedIds.forEach((id) => categoryBlogCache.delete(id));
      })
      .addCase(deleteCategoryBlogs.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetCategoryBlogStatus,
  setCategoryBlogPage,
  updateSingleCategoryBlog,
  clearCategoryBlogCache,
} = categoryBlogSlice.actions;
export default categoryBlogSlice.reducer;
