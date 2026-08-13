import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const promotionProductCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // Cache 5 menit

const isCacheValid = (cacheEntry) => {
  if (!cacheEntry) return false;
  const { timestamp } = cacheEntry;
  return Date.now() - timestamp < CACHE_DURATION;
};

const getCachedPromotionProduct = (key) => {
  const cacheEntry = promotionProductCache.get(key);
  if (isCacheValid(cacheEntry)) {
    return cacheEntry.data;
  }
  promotionProductCache.delete(key);
  return null;
};

const setCachedPromotionProduct = (key, data) => {
  promotionProductCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

export const createPromotionProduct = createAsyncThunk(
  "promotionProducts/createPromotionProduct",
  async (promotionProductData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/product/promotion`,
        promotionProductData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.promotion;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create promotionProduct"
      );
    }
  }
);

export const fetchPromotionProducts = createAsyncThunk(
  "promotionProducts/fetchPromotionProducts",
  async ({ page = 1, perPage = 10 }, { rejectWithValue }) => {
    const cacheKey = `promotionProducts_page_${page}_perPage_${perPage}`;
    const cachedData = getCachedPromotionProduct(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/product/promotion`,
        { params: { page, perPage } }
      );
      const data = {
        promotionProducts: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        totalVisible: response.data.total_visible,
        totalHidden: response.data.total_hidden,
        total: response.data.total,
      };
      setCachedPromotionProduct(cacheKey, data);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch promotionProducts"
      );
    }
  }
);

export const fetchPromotionProduct = createAsyncThunk(
  "promotionProducts/fetchPromotionProduct",
  async (promotionProductKey, { rejectWithValue }) => {
    const cachedData = getCachedPromotionProduct(promotionProductKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/product/promotion/${promotionProductKey}`
      );
      const data =
        response.data.data || response.data.promotion || response.data;
      setCachedPromotionProduct(promotionProductKey, data);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch promotionProduct"
      );
    }
  }
);

export const updatePromotionProduct = createAsyncThunk(
  "promotionProducts/updatePromotionProduct",
  async ({ key, promotionProductData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/product/promotion/${key}`,
        promotionProductData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.promotion;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update promotionProduct"
      );
    }
  }
);

export const deletePromotionProduct = createAsyncThunk(
  "promotionProducts/deletePromotionProduct",
  async (promotionProductId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/product/promotion/${promotionProductId}`
      );
      // Hapus cache setelah penghapusan sukses
      promotionProductCache.delete(promotionProductId);
      return promotionProductId;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to delete promotionProduct"
      );
    }
  }
);

export const deletePromotionProducts = createAsyncThunk(
  "promotionProducts/deletePromotionProducts",
  async (promotionProductIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        promotionProductIds.map(async (id) => {
          try {
            await axios.delete(
              `${process.env.REACT_APP_API}api/product/promotion/${id}`
            );
            // Hapus cache untuk setiap produk yang dihapus
            promotionProductCache.delete(id);
          } catch (err) {
            if (err.response && err.response.status === 401) {
              throw new Error("Unauthorized - Logging out");
            }
            throw err;
          }
        })
      );
      return promotionProductIds;
    } catch (err) {
      return rejectWithValue(
        err.message || "Failed to delete promotionProducts"
      );
    }
  }
);

const promotionProductSlice = createSlice({
  name: "promotionProducts",
  initialState: {
    promotionProducts: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 10,
    totalVisible: 0,
    totalHidden: 0,
    totalPages: 1,
    total: null,
    promotionProduct: null,
  },
  reducers: {
    resetPromotionProductStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setPromotionProductPage(state, action) {
      state.page = action.payload;
    },
    updateSinglePromotionProduct(state, action) {
      const updatedPromotionProduct = action.payload;
      const index = state.promotionProducts.findIndex(
        (promotionProduct) => promotionProduct.id === updatedPromotionProduct.id
      );
      if (index !== -1) {
        state.promotionProducts[index] = updatedPromotionProduct;
      }
    },
    clearPromotionProductCache: () => {
      promotionProductCache.clear();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPromotionProduct.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createPromotionProduct.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.promotionProducts.unshift(action.payload);
      })
      .addCase(createPromotionProduct.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchPromotionProducts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPromotionProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        const products = action.payload?.promotionProducts ?? [];
        state.promotionProducts = [...state.promotionProducts, ...products];
        state.page = action.payload.currentPage ?? 1;
        state.totalPages = action.payload.totalPages ?? 1;
        state.totalVisible = action.payload.totalVisible ?? 0;
        state.totalHidden = action.payload.totalHidden ?? 0;
        state.total = action.payload.total ?? 0;
      })

      .addCase(fetchPromotionProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchPromotionProduct.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPromotionProduct.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.promotionProduct = action.payload;
      })
      .addCase(fetchPromotionProduct.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updatePromotionProduct.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updatePromotionProduct.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedPromotionProduct = action.payload;
        const index = state.promotionProducts.findIndex(
          (promotionProduct) =>
            promotionProduct.key === updatedPromotionProduct.key
        );
        if (index !== -1) {
          state.promotionProducts[index] = updatedPromotionProduct; // Update local state
        }
        if (
          state.promotionProduct &&
          state.promotionProduct.key === updatedPromotionProduct.key
        ) {
          state.promotionProduct = updatedPromotionProduct; // Update single view
        }
      })

      .addCase(updatePromotionProduct.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deletePromotionProduct.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deletePromotionProduct.fulfilled, (state, action) => {
        state.status = "succeeded";
        const deletedId = action.payload;
        state.promotionProducts = state.promotionProducts.filter(
          (promotionProduct) => promotionProduct.id !== deletedId
        );
        promotionProductCache.delete(deletedId);
      })
      .addCase(deletePromotionProduct.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deletePromotionProducts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deletePromotionProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        const deletedIds = action.payload;
        state.promotionProducts = state.promotionProducts.filter(
          (promotionProduct) => !deletedIds.includes(promotionProduct.id)
        );
        deletedIds.forEach((id) => promotionProductCache.delete(id));
      })
      .addCase(deletePromotionProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetPromotionProductStatus,
  setPromotionProductPage,
  updateSinglePromotionProduct,
  clearPromotionProductCache,
} = promotionProductSlice.actions;
export default promotionProductSlice.reducer;
