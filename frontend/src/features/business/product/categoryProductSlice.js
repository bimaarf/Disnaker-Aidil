import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const createCategoryProduct = createAsyncThunk(
  "categoryProducts/createCategoryProduct",
  async (categoryProductData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/product/category`,
        categoryProductData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.category;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create categoryProduct"
      );
    }
  }
);

export const fetchCategoryProducts = createAsyncThunk(
  "categoryProducts/fetchCategoryProducts",
  async ({ page = 1, perPage = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/product/category`,
        { params: { page, perPage } }
      );
      return {
        categoryProducts: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        totalVisible: response.data.total_visible,
        totalHidden: response.data.total_hidden,
        total: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch categoryProducts"
      );
    }
  }
);

export const fetchCategoryProduct = createAsyncThunk(
  "categoryProducts/fetchCategoryProduct",
  async (categoryProductKey, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/product/category/${categoryProductKey}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch categoryProduct"
      );
    }
  }
);

export const updateCategoryProduct = createAsyncThunk(
  "categoryProducts/updateCategoryProduct",
  async ({ key, categoryProductData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/product/category/${key}`,
        categoryProductData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.category;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update categoryProduct"
      );
    }
  }
);

export const deleteCategoryProduct = createAsyncThunk(
  "categoryProducts/deleteCategoryProduct",
  async (categoryProductId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/product/category/${categoryProductId}`
      );
      return categoryProductId;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to delete categoryProduct"
      );
    }
  }
);

export const deleteCategoryProducts = createAsyncThunk(
  "categoryProducts/deleteCategoryProducts",
  async (categoryProductIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        categoryProductIds.map(async (id) => {
          try {
            await axios.delete(
              `${process.env.REACT_APP_API}api/product/category/${id}`
            );
          } catch (err) {
            if (err.response && err.response.status === 401) {
              throw new Error("Unauthorized - Logging out");
            }
            throw err;
          }
        })
      );
      return categoryProductIds;
    } catch (err) {
      return rejectWithValue(
        err.message || "Failed to delete categoryProducts"
      );
    }
  }
);

const categoryProductSlice = createSlice({
  name: "categoryProducts",
  initialState: {
    categoryProducts: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 10,
    totalVisible: 0,
    totalHidden: 0,
    totalPages: 1,
    total: null,
    categoryProduct: null,
  },
  reducers: {
    resetCategoryProductStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setCategoryProductPage(state, action) {
      state.page = action.payload;
    },
    updateSingleCategoryProduct(state, action) {
      const updatedcategoryProduct = action.payload;
      const index = state.categoryProducts.findIndex(
        (categoryProduct) => categoryProduct.id === updatedcategoryProduct.id
      );
      if (index !== -1) {
        state.categoryProducts[index] = updatedcategoryProduct;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCategoryProduct.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createCategoryProduct.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categoryProducts.unshift(action.payload);
      })
      .addCase(createCategoryProduct.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchCategoryProducts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCategoryProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categoryProducts = [
          ...state.categoryProducts,
          ...action.payload.categoryProducts,
        ];
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalVisible = action.payload.totalVisible;
        state.totalHidden = action.payload.totalHidden;
        state.total = action.payload.total;
      })
      .addCase(fetchCategoryProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchCategoryProduct.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCategoryProduct.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categoryProduct = action.payload;
      })
      .addCase(fetchCategoryProduct.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateCategoryProduct.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateCategoryProduct.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedcategoryProduct = action.payload;
        const index = state.categoryProducts.findIndex(
          (categoryProduct) =>
            categoryProduct.key === updatedcategoryProduct.key
        );
        if (index !== -1) {
          state.categoryProducts[index] = updatedcategoryProduct;
        }
        if (
          state.categoryProduct &&
          state.categoryProduct.key === updatedcategoryProduct.key
        ) {
          state.categoryProduct = updatedcategoryProduct;
        }
      })
      .addCase(updateCategoryProduct.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteCategoryProduct.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteCategoryProduct.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categoryProducts = state.categoryProducts.filter(
          (categoryProduct) => categoryProduct.id !== action.payload
        );
      })
      .addCase(deleteCategoryProduct.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteCategoryProducts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteCategoryProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.categoryProducts = state.categoryProducts.filter(
          (categoryProduct) => !action.payload.includes(categoryProduct.id)
        );
      })
      .addCase(deleteCategoryProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetCategoryProductStatus,
  setCategoryProductPage,
  updateSingleCategoryProduct,
} = categoryProductSlice.actions;
export default categoryProductSlice.reducer;
