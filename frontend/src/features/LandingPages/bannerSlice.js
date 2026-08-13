// src/features/banners/bannerSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { logout } from "../authentication/AuthSlice";
const API_BASE = `${process.env.REACT_APP_API}api/banners`;
// ============================================
// Async Thunks
// ============================================
export const uploadBanner = createAsyncThunk(
  "banners/uploadBanner",
  async (bannerData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(API_BASE, bannerData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.errors || "Failed to upload banner"
      );
    }
  }
);
export const fetchBanners = createAsyncThunk(
  "banners/fetchBanners",
  async ({ page = 1, perPage = 10 }, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(API_BASE, {
        params: { page, perPage },
      });
      return {
        banners: data.data,
        currentPage: data.current_page,
        totalPages: data.last_page,
        total: data.total,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch banners");
    }
  }
);
export const fetchBanner = createAsyncThunk(
  "banners/fetchBanner",
  async (key, { rejectWithValue, getState, fulfillWithValue }) => {
    // Optimasi: Cek apakah banner sudah ada di state sebelum fetch API
    const state = getState().banners;
    let existingBanner = null;

    // Cari berdasarkan ID atau image_data di list banners
    if (!isNaN(Number(key))) {
      existingBanner = state.banners.find(
        (banner) => banner.id === Number(key)
      );
    } else if (typeof key === "string" && key.startsWith("http")) {
      existingBanner = state.banners.find(
        (banner) => banner.image_data === key
      );
    }

    // Jika ada di list, gunakan itu
    if (existingBanner) {
      return fulfillWithValue(existingBanner);
    }

    // Jika ada di state.banner dan match
    if (state.banner) {
      if (!isNaN(Number(key)) && state.banner.id === Number(key)) {
        return fulfillWithValue(state.banner);
      } else if (
        typeof key === "string" &&
        key.startsWith("http") &&
        state.banner.image_data === key
      ) {
        return fulfillWithValue(state.banner);
      }
    }

    // Jika tidak ada, baru fetch dari API
    try {
      let url = `${API_BASE}/view`;
      // Jika input berupa angka atau bisa dikonversi ke angka → by ID
      if (!isNaN(Number(key))) {
        url += `/${key}`;
      }
      // Jika input berupa URL (image_data)
      else if (typeof key === "string" && key.startsWith("http")) {
        url += `?image_data=${encodeURIComponent(key)}`;
      }
      // Jika input bukan id maupun URL
      else {
        throw new Error("Invalid banner key: must be ID or image_data URL");
      }
      const { data } = await axios.get(url);
      return data.data || data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch banner");
    }
  }
);
export const updateBanner = createAsyncThunk(
  "banners/updateBanner",
  async ({ bannerId, bannerData }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(`${API_BASE}/${bannerId}`, bannerData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update banner");
    }
  }
);
export const deleteBanner = createAsyncThunk(
  "banners/deleteBanner",
  async (bannerId, { rejectWithValue, dispatch }) => {
    try {
      await axios.delete(`${API_BASE}/${bannerId}`);
      return bannerId;
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logout());
      }
      return rejectWithValue(error.response?.data || "Failed to delete banner");
    }
  }
);
export const deleteBanners = createAsyncThunk(
  "banners/deleteBanners",
  async (bannerIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        bannerIds.map((id) => axios.delete(`${API_BASE}/${id}`))
      );
      return bannerIds;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to delete banners"
      );
    }
  }
);
// ============================================
// Initial State
// ============================================
const initialState = {
  banners: [],
  banner: null,
  status: "idle",
  error: null,
  page: 1,
  perPage: 10,
  totalPages: 1,
  total: 0,
};
// ============================================
// Slice
// ============================================
const bannerSlice = createSlice({
  name: "banners",
  initialState,
  reducers: {
    resetBannerStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setBannerPage: (state, action) => {
      state.page = action.payload;
    },
    updateSingleBanner: (state, action) => {
      const index = state.banners.findIndex(
        (banner) => banner.id === action.payload.id
      );
      if (index !== -1) {
        state.banners[index] = action.payload;
      }
      // Update juga state.banner jika sedang dilihat
      if (state.banner && state.banner.id === action.payload.id) {
        state.banner = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload Banner
      .addCase(uploadBanner.pending, (state) => {
        state.status = "loading";
      })
      .addCase(uploadBanner.fulfilled, (state, action) => {
        state.status = "succeeded";
        const newBanners = Array.isArray(action.payload)
          ? action.payload
          : [action.payload];
        state.banners = [...newBanners, ...state.banners];
        state.total += newBanners.length;
      })
      .addCase(uploadBanner.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Fetch Banners (List)
      .addCase(fetchBanners.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.status = "succeeded";
        const { banners, currentPage, totalPages, total } = action.payload;
        if (currentPage === 1) {
          state.banners = banners;
        } else {
          state.banners = [...state.banners, ...banners];
        }
        state.page = currentPage;
        state.totalPages = totalPages;
        state.total = total;
      })
      .addCase(fetchBanners.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Fetch Single Banner
      .addCase(fetchBanner.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchBanner.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.banner = action.payload;
        // Tambahkan ke list jika belum ada (optimasi cache)
        const exists = state.banners.some(
          (banner) => banner.id === action.payload.id
        );
        if (!exists) {
          state.banners = [action.payload, ...state.banners];
          state.total += 1;
        }
      })
      .addCase(fetchBanner.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Update Banner
      .addCase(updateBanner.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateBanner.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Update di list
        state.banners = state.banners.map((banner) =>
          banner.id === action.payload.id ? action.payload : banner
        );
        // Update state.banner jika sedang dilihat
        if (state.banner && state.banner.id === action.payload.id) {
          state.banner = action.payload;
        }
      })
      .addCase(updateBanner.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Delete Single Banner
      .addCase(deleteBanner.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteBanner.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.banners = state.banners.filter(
          (banner) => banner.id !== action.payload
        );
        // Set null jika state.banner dihapus
        if (state.banner && state.banner.id === action.payload) {
          state.banner = null;
        }
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(deleteBanner.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Delete Multiple Banners
      .addCase(deleteBanners.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteBanners.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.banners = state.banners.filter(
          (banner) => !action.payload.includes(banner.id)
        );
        // Set null jika state.banner dihapus
        if (state.banner && action.payload.includes(state.banner.id)) {
          state.banner = null;
        }
        state.total = Math.max(0, state.total - action.payload.length);
      })
      .addCase(deleteBanners.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});
export const { resetBannerStatus, setBannerPage, updateSingleBanner } =
  bannerSlice.actions;
export default bannerSlice.reducer;
