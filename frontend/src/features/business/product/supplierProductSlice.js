import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const createSupplierProduct = createAsyncThunk(
  "supplierProducts/createSupplierProduct",
  async (supplierProductData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/product/supplier`,
        supplierProductData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.supplier;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create supplierProduct"
      );
    }
  }
);

export const fetchSupplierProducts = createAsyncThunk(
  "supplierProducts/fetchSupplierProducts",
  async ({ page = 1, perPage = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/product/supplier`,
        { params: { page, perPage } }
      );
      return {
        supplierProducts: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        totalVisible: response.data.total_visible,
        totalHidden: response.data.total_hidden,
        total: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch supplierProducts"
      );
    }
  }
);

export const fetchSupplierProduct = createAsyncThunk(
  "supplierProducts/fetchSupplierProduct",
  async (supplierProductKey, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/product/supplier/${supplierProductKey}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch supplierProduct"
      );
    }
  }
);

export const updateSupplierProduct = createAsyncThunk(
  "supplierProducts/updateSupplierProduct",
  async ({ key, supplierProductData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/product/supplier/${key}`,
        supplierProductData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.supplier;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update supplierProduct"
      );
    }
  }
);

export const deleteSupplierProduct = createAsyncThunk(
  "supplierProducts/deleteSupplierProduct",
  async (supplierProductId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/product/supplier/${supplierProductId}`
      );
      return supplierProductId;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to delete supplierProduct"
      );
    }
  }
);

export const deleteSupplierProducts = createAsyncThunk(
  "supplierProducts/deleteSupplierProducts",
  async (supplierProductIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        supplierProductIds.map(async (id) => {
          try {
            await axios.delete(
              `${process.env.REACT_APP_API}api/product/supplier/${id}`
            );
          } catch (err) {
            if (err.response && err.response.status === 401) {
              throw new Error("Unauthorized - Logging out");
            }
            throw err;
          }
        })
      );
      return supplierProductIds;
    } catch (err) {
      return rejectWithValue(
        err.message || "Failed to delete supplierProducts"
      );
    }
  }
);

const supplierProductSlice = createSlice({
  name: "supplierProducts",
  initialState: {
    supplierProducts: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 10,
    totalVisible: 0,
    totalHidden: 0,
    totalPages: 1,
    total: null,
    supplierProduct: null,
  },
  reducers: {
    resetSupplierProductStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setSupplierProductPage(state, action) {
      state.page = action.payload;
    },
    updateSingleSupplierProduct(state, action) {
      const updatedsupplierProduct = action.payload;
      const index = state.supplierProducts.findIndex(
        (supplierProduct) => supplierProduct.id === updatedsupplierProduct.id
      );
      if (index !== -1) {
        state.supplierProducts[index] = updatedsupplierProduct;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createSupplierProduct.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createSupplierProduct.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.supplierProducts.unshift(action.payload);
      })
      .addCase(createSupplierProduct.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchSupplierProducts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchSupplierProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.supplierProducts = [
          ...state.supplierProducts,
          ...action.payload.supplierProducts,
        ];
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalVisible = action.payload.totalVisible;
        state.totalHidden = action.payload.totalHidden;
        state.total = action.payload.total;
      })
      .addCase(fetchSupplierProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchSupplierProduct.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchSupplierProduct.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.supplierProduct = action.payload;
      })
      .addCase(fetchSupplierProduct.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateSupplierProduct.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateSupplierProduct.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedsupplierProduct = action.payload;
        const index = state.supplierProducts.findIndex(
          (supplierProduct) =>
            supplierProduct.key === updatedsupplierProduct.key
        );
        if (index !== -1) {
          state.supplierProducts[index] = updatedsupplierProduct;
        }
        if (
          state.supplierProduct &&
          state.supplierProduct.key === updatedsupplierProduct.key
        ) {
          state.supplierProduct = updatedsupplierProduct;
        }
      })
      .addCase(updateSupplierProduct.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteSupplierProduct.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteSupplierProduct.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.supplierProducts = state.supplierProducts.filter(
          (supplierProduct) => supplierProduct.id !== action.payload
        );
      })
      .addCase(deleteSupplierProduct.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteSupplierProducts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteSupplierProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.supplierProducts = state.supplierProducts.filter(
          (supplierProduct) => !action.payload.includes(supplierProduct.id)
        );
      })
      .addCase(deleteSupplierProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetSupplierProductStatus,
  setSupplierProductPage,
  updateSingleSupplierProduct,
} = supplierProductSlice.actions;
export default supplierProductSlice.reducer;
