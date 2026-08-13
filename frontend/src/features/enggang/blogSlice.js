import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Blog Cache dengan struktur yang lebih baik
const blogCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Helper function to check if cache is valid
const isCacheValid = (cacheEntry) => {
  if (!cacheEntry) return false;
  const { timestamp } = cacheEntry;
  return Date.now() - timestamp < CACHE_DURATION;
};

// Helper function to get cached data
const getCachedBlogs = (key) => {
  const cacheEntry = blogCache.get(key);
  if (isCacheValid(cacheEntry)) {
    return cacheEntry.data;
  }
  blogCache.delete(key); // Remove stale cache
  return null;
};

// Helper function to set cached data
const setCachedBlogs = (key, data) => {
  blogCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

// Helper function untuk menghindari duplikasi blog
const mergeBlogsUnique = (existingBlogs, newBlogs) => {
  const blogMap = new Map();

  // Add existing blogs to map
  existingBlogs.forEach((blog) => {
    blogMap.set(blog.key || blog.id, blog);
  });

  // Add or update with new blogs
  newBlogs.forEach((blog) => {
    blogMap.set(blog.key || blog.id, blog);
  });

  return Array.from(blogMap.values());
};

// Helper function untuk update blog di array tanpa duplikasi
const updateBlogInArray = (blogs, updatedBlog) => {
  const index = blogs.findIndex(
    (blog) =>
      (blog.key && blog.key === updatedBlog.key) ||
      (blog.id && blog.id === updatedBlog.id)
  );

  if (index !== -1) {
    blogs[index] = updatedBlog;
  } else {
    blogs.unshift(updatedBlog);
  }
  return blogs;
};

// Thunks
export const createBlog = createAsyncThunk(
  "blogs/createBlog",
  async (blogData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/blog`,
        blogData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );
      const newBlog = response.data.blog;
      setCachedBlogs(newBlog.key, newBlog);

      // Clear cache yang berhubungan dengan list untuk refresh data
      const keysToDelete = [];
      for (let key of blogCache.keys()) {
        if (
          key.startsWith("blogs_page_") ||
          key.startsWith("public_blogs_page_") ||
          key === "all_blogs"
        ) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => blogCache.delete(key));

      return newBlog;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create blog"
      );
    }
  }
);

export const fetchAllBlogs = createAsyncThunk(
  "blogs/fetchAllBlogs",
  async (_, { rejectWithValue }) => {
    const cacheKey = "all_blogs";
    const cachedData = getCachedBlogs(cacheKey);
    if (cachedData) {
      return { allBlogs: cachedData };
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/blog/all`
      );
      const allBlogs = response.data.data;
      setCachedBlogs(cacheKey, allBlogs);
      return { allBlogs };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch blogs");
    }
  }
);

export const fetchBlogs = createAsyncThunk(
  "blogs/fetchBlogs",
  async (
    {
      page,
      perPage,
      searchQuery = "",
      fromDate = "",
      toDate = "",
      loadMore = false,
    },
    { rejectWithValue }
  ) => {
    const cacheKey = `blogs_page_${page}_per_${perPage}_q_${searchQuery}_from_${fromDate}_to_${toDate}`;
    const cachedData = getCachedBlogs(cacheKey);

    // Jika cache ada dan bukan load more, return cache
    if (cachedData && !loadMore) {
      return { ...cachedData, isFromCache: true };
    }

    try {
      const params = { page, perPage, q: searchQuery, fromDate, toDate };
      console.log(
        "fetchBlogs: Sending request to /api/blog with params:",
        params
      );

      const response = await axios.get(`${process.env.REACT_APP_API}api/blog`, {
        params,
      });

      console.log("fetchBlogs: Response received:", response.data);

      const responseData = {
        ...response.data,
        loadMore,
        requestedPage: page,
      };

      setCachedBlogs(cacheKey, responseData);
      return responseData;
    } catch (err) {
      console.error("fetchBlogs: Error:", err.response?.data || err.message);
      return rejectWithValue(err.response?.data || "Failed to fetch blogs");
    }
  }
);

export const fetchPublicBlogs = createAsyncThunk(
  "blogs/fetchPublicBlogs",
  async (
    {
      page,
      perPage,
      searchQuery = "",
      fromDate = "",
      toDate = "",
      loadMore = false,
    },
    { rejectWithValue }
  ) => {
    const cacheKey = `public_blogs_page_${page}_per_${perPage}_q_${searchQuery}_from_${fromDate}_to_${toDate}`;
    const cachedData = getCachedBlogs(cacheKey);

    if (cachedData && !loadMore) {
      return { ...cachedData, isFromCache: true };
    }

    try {
      const params = {
        page,
        perPage,
        q: searchQuery,
        fromDate,
        toDate,
        isPublic: true,
      };
      console.log("fetchPublicBlogs: Sending request with params:", params);

      const response = await axios.get(`${process.env.REACT_APP_API}api/blog`, {
        params,
      });

      const responseData = {
        ...response.data,
        loadMore,
        requestedPage: page,
      };

      setCachedBlogs(cacheKey, responseData);
      return responseData;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch public blogs"
      );
    }
  }
);

// ============== PERBAIKAN BLOG SLICE ==============

// Di bagian fetchBlog thunk, perbaiki logika isPublic
export const fetchBlog = createAsyncThunk(
  "blogs/fetchBlog",
  async ({ key, isPublic = false }, { rejectWithValue, getState }) => {
    // Check di state terlebih dahulu
    const state = getState();
    const existingBlog =
      state.blogs.blogs.find((blog) => blog.key === key) ||
      state.blogs.publicBlogs.find((blog) => blog.key === key) ||
      state.blogs.allBlogs.find((blog) => blog.key === key);

    // PERBAIKAN: Jika isPublic = true, pastikan blog yang ada memiliki status = true
    if (existingBlog) {
      if (isPublic && !existingBlog.status) {
        // Jika request untuk public blog tapi blog tidak public, fetch ulang
        // Tidak return existing blog
      } else {
        return existingBlog;
      }
    }

    const cachedData = getCachedBlogs(key);
    if (cachedData) {
      if (isPublic && !cachedData.status) {
        // Jika request untuk public blog tapi cached blog tidak public, fetch ulang
        // Tidak return cached data
      } else {
        return cachedData;
      }
    }

    try {
      const params = isPublic ? { isPublic: true } : {};
      console.log(
        "fetchBlog: Sending request to /api/blog/" + key + " with params:",
        params
      );

      const response = await axios.get(
        `${process.env.REACT_APP_API}api/blog/${key}`,
        { params }
      );

      const blogData = response.data.data;

      // PERBAIKAN: Validasi response untuk public blog
      if (isPublic && !blogData.status) {
        return rejectWithValue("Blog is not publicly accessible");
      }

      setCachedBlogs(key, blogData);
      return blogData;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch blog");
    }
  }
);

export const updateBlog = createAsyncThunk(
  "blogs/updateBlog",
  async ({ key, blogData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/blog/${key}`,
        blogData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const updatedBlog = response.data.data;
      setCachedBlogs(key, updatedBlog);

      // Clear related cache entries
      const keysToDelete = [];
      for (let cacheKey of blogCache.keys()) {
        if (
          cacheKey.startsWith("blogs_page_") ||
          cacheKey.startsWith("public_blogs_page_") ||
          cacheKey === "all_blogs"
        ) {
          keysToDelete.push(cacheKey);
        }
      }
      keysToDelete.forEach((cacheKey) => blogCache.delete(cacheKey));

      return updatedBlog;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update blog");
    }
  }
);

export const deleteBlog = createAsyncThunk(
  "blogs/deleteBlog",
  async (blogId, { rejectWithValue }) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API}api/blog/${blogId}`);
      blogCache.delete(blogId);

      // Clear related cache entries
      const keysToDelete = [];
      for (let key of blogCache.keys()) {
        if (
          key.startsWith("blogs_page_") ||
          key.startsWith("public_blogs_page_") ||
          key === "all_blogs"
        ) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => blogCache.delete(key));

      return blogId;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete blog");
    }
  }
);

export const deleteBlogs = createAsyncThunk(
  "blogs/deleteBlogs",
  async (blogIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        blogIds.map((id) =>
          axios.delete(`${process.env.REACT_APP_API}api/blog/${id}`)
        )
      );

      blogIds.forEach((id) => blogCache.delete(id));

      // Clear related cache entries
      blogCache.clear(); // Clear all cache untuk memastikan konsistensi

      return blogIds;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete blogs");
    }
  }
);

const blogSlice = createSlice({
  name: "blogs",
  initialState: {
    allBlogs: [],
    blogs: [],
    publicBlogs: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 1,
    totalVisible: 0,
    totalHidden: 0,
    publicPage: 1,
    publicPerPage: 10,
    publicTotal: 0,
    publicTotalPages: 1,
    publicTotalVisible: 0,
    publicTotalHidden: 0,
    searchQuery: "",
    fromDate: "",
    toDate: "",
    // Tambahan untuk tracking
    lastFetchParams: null,
    isLoadingMore: false,
  },
  reducers: {
    resetBlogs: (state) => {
      state.blogs = [];
      state.publicBlogs = [];
      state.allBlogs = [];
      state.page = 1;
      state.publicPage = 1;
      state.totalPages = 1;
      state.publicTotalPages = 1;
      state.total = 0;
      state.publicTotal = 0;
      state.status = "idle";
      state.lastFetchParams = null;
      state.isLoadingMore = false;
      blogCache.clear();
    },
    setBlogFromDate(state, action) {
      state.fromDate = action.payload;
    },
    setBlogToDate(state, action) {
      state.toDate = action.payload;
    },
    resetBlogsState: (state) => {
      state.blogs = [];
      state.publicBlogs = [];
      state.error = null;
      state.status = "idle";
      state.isLoadingMore = false;
    },
    resetBlogStatus: (state) => {
      state.status = "idle";
      state.error = null;
      state.isLoadingMore = false;
    },
    setBlogPage(state, action) {
      state.page = action.payload;
    },
    setPublicBlogPage(state, action) {
      state.publicPage = action.payload;
    },
    updateSingleBlog(state, action) {
      const updatedBlog = action.payload;

      // Update di blogs array
      state.blogs = updateBlogInArray([...state.blogs], updatedBlog);

      // Update di publicBlogs array
      if (updatedBlog.status) {
        state.publicBlogs = updateBlogInArray(
          [...state.publicBlogs],
          updatedBlog
        );
      } else {
        state.publicBlogs = state.publicBlogs.filter(
          (blog) => blog.key !== updatedBlog.key && blog.id !== updatedBlog.id
        );
      }

      // Update di allBlogs array
      state.allBlogs = updateBlogInArray([...state.allBlogs], updatedBlog);

      setCachedBlogs(updatedBlog.key, updatedBlog);
    },
    clearBlogCache: () => {
      blogCache.clear();
    },
    setLoadingMore: (state, action) => {
      state.isLoadingMore = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllBlogs.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllBlogs.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.allBlogs = action.payload.allBlogs || [];
      })
      .addCase(fetchAllBlogs.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createBlog.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createBlog.fulfilled, (state, action) => {
        state.status = "succeeded";

        // Hindari duplikasi dengan menggunakan helper function
        state.blogs = updateBlogInArray([...state.blogs], action.payload);
        state.allBlogs = updateBlogInArray([...state.allBlogs], action.payload);

        if (action.payload.status) {
          state.publicBlogs = updateBlogInArray(
            [...state.publicBlogs],
            action.payload
          );
        }
      })
      .addCase(createBlog.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchBlogs.pending, (state, action) => {
        if (action.meta.arg.loadMore) {
          state.isLoadingMore = true;
        } else {
          state.status = "loading";
        }
      })
      .addCase(fetchBlogs.fulfilled, (state, action) => {
        const {
          data,
          total,
          total_visible,
          total_hidden,
          current_page,
          last_page,
          per_page,
        } = action.payload;

        state.status = "succeeded";
        state.isLoadingMore = false;

        // LOGIKA INI SUDAH BENAR - MENAMBAH DATA, BUKAN MENGGANTI
        // Load more: gabungkan tanpa duplikasi menggunakan mergeBlogsUnique
        state.blogs = mergeBlogsUnique(state.blogs, data);

        // Update pagination info
        state.total = total;
        state.totalVisible = total_visible;
        state.totalHidden = total_hidden;
        state.page = current_page;
        state.totalPages = last_page;
        state.perPage = per_page;
      })

      .addCase(fetchBlogs.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.isLoadingMore = false;
      })
      .addCase(fetchPublicBlogs.pending, (state, action) => {
        if (action.meta.arg.loadMore) {
          state.isLoadingMore = true;
        } else {
          state.status = "loading";
        }
      })
      .addCase(fetchPublicBlogs.fulfilled, (state, action) => {
        const {
          data,
          total,
          total_visible,
          total_hidden,
          current_page,
          last_page,
          per_page,
        } = action.payload;

        state.status = "succeeded";
        state.isLoadingMore = false;

        state.publicBlogs = mergeBlogsUnique(state.publicBlogs, data);

        state.publicTotal = total;
        state.publicTotalVisible = total_visible;
        state.publicTotalHidden = total_hidden;
        state.publicPage = current_page;
        state.publicTotalPages = last_page;
        state.publicPerPage = per_page;
      })
      .addCase(fetchPublicBlogs.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.isLoadingMore = false;
      })
      .addCase(fetchBlog.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchBlog.fulfilled, (state, action) => {
        state.status = "succeeded";
        const blogData = action.payload;

        // Update di semua array tanpa duplikasi
        state.blogs = updateBlogInArray([...state.blogs], blogData);
        state.allBlogs = updateBlogInArray([...state.allBlogs], blogData);

        if (blogData.status) {
          state.publicBlogs = updateBlogInArray(
            [...state.publicBlogs],
            blogData
          );
        }
      })
      .addCase(fetchBlog.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateBlog.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateBlog.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedBlog = action.payload;

        // Update semua array
        state.blogs = updateBlogInArray([...state.blogs], updatedBlog);
        state.allBlogs = updateBlogInArray([...state.allBlogs], updatedBlog);

        if (updatedBlog.status) {
          state.publicBlogs = updateBlogInArray(
            [...state.publicBlogs],
            updatedBlog
          );
        } else {
          state.publicBlogs = state.publicBlogs.filter(
            (blog) => blog.key !== updatedBlog.key && blog.id !== updatedBlog.id
          );
        }
      })
      .addCase(updateBlog.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteBlog.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteBlog.fulfilled, (state, action) => {
        state.status = "succeeded";
        const blogId = action.payload;

        state.blogs = state.blogs.filter(
          (blog) => blog.key !== blogId && blog.id !== blogId
        );
        state.publicBlogs = state.publicBlogs.filter(
          (blog) => blog.key !== blogId && blog.id !== blogId
        );
        state.allBlogs = state.allBlogs.filter(
          (blog) => blog.key !== blogId && blog.id !== blogId
        );
      })
      .addCase(deleteBlog.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteBlogs.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteBlogs.fulfilled, (state, action) => {
        state.status = "succeeded";
        const blogIds = action.payload;

        state.blogs = state.blogs.filter(
          (blog) => !blogIds.includes(blog.key) && !blogIds.includes(blog.id)
        );
        state.publicBlogs = state.publicBlogs.filter(
          (blog) => !blogIds.includes(blog.key) && !blogIds.includes(blog.id)
        );
        state.allBlogs = state.allBlogs.filter(
          (blog) => !blogIds.includes(blog.key) && !blogIds.includes(blog.id)
        );
      })
      .addCase(deleteBlogs.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetBlogs,
  resetBlogStatus,
  resetBlogsState,
  setBlogPage,
  setPublicBlogPage,
  setBlogFromDate,
  setBlogToDate,
  updateSingleBlog,
  clearBlogCache,
  setLoadingMore,
} = blogSlice.actions;

export default blogSlice.reducer;
