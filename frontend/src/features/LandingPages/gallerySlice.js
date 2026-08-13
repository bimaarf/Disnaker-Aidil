// src/features/galleries/gallerySlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { logout } from "../authentication/AuthSlice";

// Thunk to upload a gallery
export const uploadGallery = createAsyncThunk(
  "galleries/uploadGallery",
  async (galleryData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/galleries`,
        galleryData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to upload gallery"
      );
    }
  }
);

export const fetchGalleries = createAsyncThunk(
  "galleries/fetchGalleries",
  async ({ page = 1, perPage = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/galleries`,
        {
          params: { page, perPage },
        }
      );
      return {
        galleries: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        total: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch galleries"
      );
    }
  }
);

// Thunk to fetch a single gallery by ID
export const fetchGallery = createAsyncThunk(
  "galleries/fetchGallery",
  async (galleryId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/galleries/${galleryId}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch gallery");
    }
  }
);

// Thunk to update a gallery
export const updateGallery = createAsyncThunk(
  "galleries/updateGallery",
  async ({ key, galleryData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/galleries/${key}`,
        galleryData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update gallery"
      );
    }
  }
);

// Thunk to delete a gallery
export const deleteGallery = createAsyncThunk(
  "galleries/deleteGallery",
  async (galleryId, { rejectWithValue, dispatch }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/galleries/${galleryId}`
      );
      return galleryId;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        dispatch(logout());
      }
      return rejectWithValue(err.response?.data || "Failed to delete gallery");
    }
  }
);
export const deleteGalleries = createAsyncThunk(
  "galleries/deleteGalleries",
  async (galleryId, { rejectWithValue }) => {
    try {
      await Promise.all(
        galleryId.map((id) =>
          axios.delete(`${process.env.REACT_APP_API}api/galleries/${id}`)
        )
      );
      return galleryId;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to delete galleries"
      );
    }
  }
);

const gallerySlice = createSlice({
  name: "galleries",
  initialState: {
    galleries: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 10,
    totalPages: 1,
    total: 0,
    gallery: null,
  },
  reducers: {
    resetGalleryStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setGalleryPage(state, action) {
      state.page = action.payload;
    },
    updateSingleGallery(state, action) {
      const updatedGallery = action.payload;
      const index = state.galleries.findIndex(
        (gallery) => gallery.key === updatedGallery.key
      );

      if (index !== -1) {
        state.galleries[index] = updatedGallery;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadGallery.pending, (state) => {
        state.status = "loading";
      })
      .addCase(uploadGallery.fulfilled, (state, action) => {
        state.status = "succeeded";
        if (Array.isArray(action.payload)) {
          // Check for an array
          state.galleries.unshift(...action.payload); // Assuming action.payload is the array of uploaded galleries
        } else {
          console.error("Expected an array but received:", action.payload);
        }
      })

      .addCase(uploadGallery.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchGalleries.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchGalleries.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.galleries = [...state.galleries, ...action.payload.galleries];
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.total = action.payload.total;
      })
      .addCase(fetchGalleries.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchGallery.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchGallery.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.gallery = action.payload;
      })
      .addCase(fetchGallery.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateGallery.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateGallery.fulfilled, (state, action) => {
        console.log("Updated gallery payload:", action.payload);
        const updatedGallery = action.payload;

        state.galleries = state.galleries.map((gallery) =>
          gallery.id === updatedGallery.id ? updatedGallery : gallery
        );

        state.loading = false; // Stop loading after successful update
      })
      .addCase(updateGallery.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteGallery.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteGallery.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.galleries = state.galleries.filter(
          (gallery) => gallery.id !== action.payload
        );
      })
      .addCase(deleteGallery.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteGalleries.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteGalleries.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.galleries = state.galleries.filter(
          (gallery) => !action.payload.includes(gallery.id)
        );
      })
      .addCase(deleteGalleries.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { resetGalleryStatus, setGalleryPage, updateSingleGallery } =
  gallerySlice.actions;

export default gallerySlice.reducer;
