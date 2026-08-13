import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// Blog Cache
const blogCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const isCacheValid = (cacheEntry) => {
  if (!cacheEntry) return false;
  const { timestamp } = cacheEntry;
  return Date.now() - timestamp < CACHE_DURATION;
};

export const getCachedBlogs = (key) => {
  const cacheEntry = blogCache.get(key);
  if (isCacheValid(cacheEntry)) {
    return cacheEntry.data;
  }
  blogCache.delete(key);
  return null;
};

const setCachedBlogs = (key, data) => {
  blogCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

const mergeBlogsUnique = (existingBlogs, newBlogs) => {
  const blogMap = new Map(existingBlogs.map((blog) => [blog.id, blog]));

  newBlogs.forEach((blog) => {
    if (!blogMap.has(blog.id)) {
      blogMap.set(blog.id, blog);
    }
  });

  const result = Array.from(blogMap.values());

  return result;
};
const updateBlogInArray = (blogs, updatedBlog) => {
  const index = blogs.findIndex((blog) => blog.id === updatedBlog.id);

  if (index !== -1) {
    blogs[index] = updatedBlog;
  } else {
    blogs.unshift(updatedBlog);
  }
  return blogs;
};

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

      // Clear list cache
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

    if (!loadMore) {
      const cachedData = getCachedBlogs(cacheKey);
      if (cachedData) {
        return { ...cachedData, isFromCache: true };
      }
    }

    try {
      const params = { page, perPage, q: searchQuery, fromDate, toDate };

      const response = await axios.get(`${process.env.REACT_APP_API}api/blog`, {
        params,
      });

      const responseData = {
        data: response.data.data,
        total: response.data.total,
        total_visible: response.data.total_visible,
        total_hidden: response.data.total_hidden,
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        loadMore,
      };

      setCachedBlogs(cacheKey, responseData);
      return responseData;
    } catch (err) {
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

    if (!loadMore) {
      const cachedData = getCachedBlogs(cacheKey);
      if (cachedData) {
        return { ...cachedData, isFromCache: true };
      }
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

      const response = await axios.get(`${process.env.REACT_APP_API}api/blog`, {
        params,
      });

      const responseData = {
        data: response.data.data,
        total: response.data.total,
        total_visible: response.data.total_visible,
        total_hidden: response.data.total_hidden,
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        loadMore,
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

export const fetchBlog = createAsyncThunk(
  "blogs/fetchBlog",
  async ({ key, isPublic = false }, { rejectWithValue, getState }) => {
    const state = getState();
    const existingBlog =
      state.blogs.blogs.find((blog) => blog.key === key) ||
      state.blogs.publicBlogs.find((blog) => blog.key === key) ||
      state.blogs.allBlogs.find((blog) => blog.key === key);

    if (existingBlog && (!isPublic || existingBlog.status)) {
      return existingBlog;
    }

    const cachedData = getCachedBlogs(key);
    if (cachedData && (!isPublic || cachedData.status)) {
      return cachedData;
    }

    try {
      const params = isPublic ? { isPublic: true } : {};

      const response = await axios.get(
        `${process.env.REACT_APP_API}api/blog/${key}`,
        { params }
      );

      const blogData = response.data.data;

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

      // Clear related cache
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

      // Clear related cache
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
      blogCache.clear();

      return blogIds;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete blogs");
    }
  }
);
const updateTotalCounts = (state, blog, operation) => {
  if (operation === "create") {
    if (blog.status) {
      state.totalVisible += 1;
      state.publicTotalVisible += 1;
    } else {
      state.totalHidden += 1;
    }
    state.total += 1;
    state.publicTotal = state.totalVisible;
  } else if (operation === "delete") {
    if (blog.status) {
      state.totalVisible -= 1;
      state.publicTotalVisible -= 1;
    } else {
      state.totalHidden -= 1;
    }
    state.total -= 1;
    state.publicTotal = state.totalVisible;
  } else if (operation === "update") {
    // Cek perubahan status
    const oldBlog =
      state.blogs.find((b) => b.id === blog.id) ||
      state.allBlogs.find((b) => b.id === blog.id);

    if (oldBlog) {
      // Dari hidden ke visible
      if (!oldBlog.status && blog.status) {
        state.totalHidden -= 1;
        state.totalVisible += 1;
        state.publicTotalVisible += 1;
        state.publicTotal += 1;
      }
      // Dari visible ke hidden
      else if (oldBlog.status && !blog.status) {
        state.totalVisible -= 1;
        state.totalHidden += 1;
        state.publicTotalVisible -= 1;
        state.publicTotal -= 1;
      }
    }
  }
};
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
    searchQuery: "",
    fromDate: "",
    toDate: "",

    publicPage: 1,
    publicPerPage: 10,
    publicTotal: 0,
    publicTotalPages: 1,
    publicTotalVisible: 0,
    publicTotalHidden: 0,
    publicSearchQuery: "",
    publicFromDate: "",
    publicToDate: "",
    publicStatus: "idle",
    publicError: null,
  },
  reducers: {
    resetBlogs: (state) => {
      state.blogs = [];
      state.page = 1;
      state.totalPages = 1;
      state.total = 0;
      state.status = "idle";

      for (let key of blogCache.keys()) {
        if (key.startsWith("blogs_page_")) {
          blogCache.delete(key);
        }
      }
    },

    resetPublicBlogs: (state) => {
      state.publicBlogs = [];
      state.publicPage = 1;
      state.publicTotalPages = 1;
      state.publicTotal = 0;
      state.publicStatus = "idle";

      for (let key of blogCache.keys()) {
        if (key.startsWith("public_blogs_page_")) {
          blogCache.delete(key);
        }
      }
    },

    resetAllBlogs: (state) => {
      state.allBlogs = [];
      blogCache.delete("all_blogs");
    },

    setBlogFromDate(state, action) {
      state.fromDate = action.payload;
    },

    setBlogToDate(state, action) {
      state.toDate = action.payload;
    },

    setPublicBlogFromDate(state, action) {
      state.publicFromDate = action.payload;
    },

    setPublicBlogToDate(state, action) {
      state.publicToDate = action.payload;
    },

    resetBlogsState: (state) => {
      state.blogs = [];
      state.error = null;
      state.status = "idle";
    },

    resetPublicBlogsState: (state) => {
      state.publicBlogs = [];
      state.publicError = null;
      state.publicStatus = "idle";
    },

    resetBlogStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },

    resetPublicBlogStatus: (state) => {
      state.publicStatus = "idle";
      state.publicError = null;
    },

    setBlogPage(state, action) {
      state.page = action.payload;
    },

    setPublicBlogPage(state, action) {
      state.publicPage = action.payload;
    },

    setBlogSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },

    setPublicBlogSearchQuery(state, action) {
      state.publicSearchQuery = action.payload;
    },

    updateSingleBlog(state, action) {
      const updatedBlog = action.payload;

      // Update counts
      updateTotalCounts(state, updatedBlog, "update");

      state.blogs = updateBlogInArray([...state.blogs], updatedBlog);

      if (updatedBlog.status) {
        state.publicBlogs = updateBlogInArray(
          [...state.publicBlogs],
          updatedBlog
        );
      } else {
        state.publicBlogs = state.publicBlogs.filter(
          (blog) => blog.id !== updatedBlog.id
        );
      }

      state.allBlogs = updateBlogInArray([...state.allBlogs], updatedBlog);

      setCachedBlogs(updatedBlog.key, updatedBlog);
    },

    clearBlogCache: () => {
      blogCache.clear();
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
        state.blogs = updateBlogInArray([...state.blogs], action.payload);
        state.allBlogs = updateBlogInArray([...state.allBlogs], action.payload);

        if (action.payload.status) {
          state.publicBlogs = updateBlogInArray(
            [...state.publicBlogs],
            action.payload
          );
        }
        updateTotalCounts(state, action.payload, "create");
      })
      .addCase(createBlog.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchBlogs.pending, (state) => {
        state.status = "loading";
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
          loadMore,
        } = action.payload;

        state.status = "succeeded";
        if (loadMore) {
          state.blogs = mergeBlogsUnique(state.blogs, data);
        } else {
          state.blogs = data;
        }

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
      })
      .addCase(fetchPublicBlogs.pending, (state) => {
        state.publicStatus = "loading";
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
          loadMore,
        } = action.payload;

        state.publicStatus = "succeeded";

        if (loadMore) {
          state.publicBlogs = mergeBlogsUnique(state.publicBlogs, data);
        } else {
          state.publicBlogs = data;
        }

        state.publicTotal = total;
        state.publicTotalVisible = total_visible;
        state.publicTotalHidden = total_hidden;
        state.publicPage = current_page;
        state.publicTotalPages = last_page;
        state.publicPerPage = per_page;
      })
      .addCase(fetchPublicBlogs.rejected, (state, action) => {
        state.publicStatus = "failed";
        state.publicError = action.payload;
      })
      .addCase(fetchBlog.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchBlog.fulfilled, (state, action) => {
        state.status = "succeeded";
        const blogData = action.payload;

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

        // Update counts sebelum update array
        updateTotalCounts(state, updatedBlog, "update");

        state.blogs = updateBlogInArray([...state.blogs], updatedBlog);
        state.allBlogs = updateBlogInArray([...state.allBlogs], updatedBlog);

        if (updatedBlog.status) {
          state.publicBlogs = updateBlogInArray(
            [...state.publicBlogs],
            updatedBlog
          );
        } else {
          state.publicBlogs = state.publicBlogs.filter(
            (blog) => blog.id !== updatedBlog.id
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

        // Cari blog yang akan dihapus untuk update count
        const blogToDelete =
          state.blogs.find(
            (blog) => blog.id === blogId || blog.key === blogId
          ) ||
          state.allBlogs.find(
            (blog) => blog.id === blogId || blog.key === blogId
          );

        if (blogToDelete) {
          updateTotalCounts(state, blogToDelete, "delete");
        }

        state.blogs = state.blogs.filter(
          (blog) => blog.id !== blogId && blog.key !== blogId
        );
        state.publicBlogs = state.publicBlogs.filter(
          (blog) => blog.id !== blogId && blog.key !== blogId
        );
        state.allBlogs = state.allBlogs.filter(
          (blog) => blog.id !== blogId && blog.key !== blogId
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

        // Update counts untuk setiap blog yang dihapus
        blogIds.forEach((blogId) => {
          const blogToDelete =
            state.blogs.find(
              (blog) => blog.id === blogId || blog.key === blogId
            ) ||
            state.allBlogs.find(
              (blog) => blog.id === blogId || blog.key === blogId
            );

          if (blogToDelete) {
            updateTotalCounts(state, blogToDelete, "delete");
          }
        });

        state.blogs = state.blogs.filter(
          (blog) => !blogIds.includes(blog.id) && !blogIds.includes(blog.key)
        );
        state.publicBlogs = state.publicBlogs.filter(
          (blog) => !blogIds.includes(blog.id) && !blogIds.includes(blog.key)
        );
        state.allBlogs = state.allBlogs.filter(
          (blog) => !blogIds.includes(blog.id) && !blogIds.includes(blog.key)
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
  resetPublicBlogs,
  resetAllBlogs,
  resetBlogStatus,
  resetPublicBlogStatus,
  resetBlogsState,
  resetPublicBlogsState,
  setBlogPage,
  setPublicBlogPage,
  setBlogFromDate,
  setBlogToDate,
  setPublicBlogFromDate,
  setPublicBlogToDate,
  setBlogSearchQuery,
  setPublicBlogSearchQuery,
  updateSingleBlog,
  clearBlogCache,
} = blogSlice.actions;

export default blogSlice.reducer;
