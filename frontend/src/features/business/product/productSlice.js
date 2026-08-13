import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Thunks
export const createProduct = createAsyncThunk(
  "products/createProduct",
  async (productData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/product`,
        productData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );
      return response.data.product;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create product"
      );
    }
  }
);

export const fetchAllProducts = createAsyncThunk(
  "roles/fetchAllProducts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/product/all`
      );
      return {
        allProducts: response.data.data, // Ensure this is correct based on API response structure
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch products" // Ensure error handling is proper
      );
    }
  }
);
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async ({ page = 1, perPage = 20 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/product`,
        { params: { page, perPage } }
      );
      return {
        products: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        totalVisible: response.data.total_visible,
        totalHidden: response.data.total_hidden,
        total: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch products"
      );
    }
  }
);

export const fetchProduct = createAsyncThunk(
  "products/fetchProduct",
  async (productKey, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/product/${productKey}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch product");
    }
  }
);

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ key, productData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/product/${key}`,
        productData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.product;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update product"
      );
    }
  }
);

export const deleteProduct = createAsyncThunk(
  "products/deleteProduct",
  async (productId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/product/${productId}`
      );
      return productId;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete product");
    }
  }
);

export const deleteProducts = createAsyncThunk(
  "products/deleteProducts",
  async (productIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        productIds.map((id) =>
          axios.delete(`${process.env.REACT_APP_API}api/product/${id}`)
        )
      );
      return productIds;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete products");
    }
  }
);

const productSlice = createSlice({
  name: "products",
  initialState: {
    allProducts: [],
    products: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 20,
    totalVisible: 0,
    totalHidden: 0,
    totalPages: 1,
    total: null,
    product: null,
  },
  reducers: {
    resetProductsState: (state) => {
      state.products = [];
      state.product = null;
      state.error = null;
      state.status = "idle";
    },
    resetProductStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setProductPage(state, action) {
      state.page = action.payload;
    },
    updateSingleProduct(state, action) {
      const updatedProduct = action.payload;
      const index = state.products.findIndex(
        (product) => product.id === updatedProduct.id
      );
      if (index !== -1) {
        state.products[index] = updatedProduct;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllProducts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.allProducts = action.payload.allProducts;
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createProduct.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.products.unshift(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchProducts.pending, (state) => {
        state.status = "loading";
      });
    builder
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = "succeeded";

        const existingIds = state.products.map((product) => product.id);

        const newProducts = action.payload.products.filter(
          (product) => !existingIds.includes(product.id)
        );

        state.products = [...state.products, ...newProducts];

        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalVisible = action.payload.totalVisible;
        state.totalHidden = action.payload.totalHidden;
        state.total = action.payload.total;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchProduct.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.product = action.payload;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateProduct.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedProduct = action.payload;
        const index = state.products.findIndex(
          (product) => product.key === updatedProduct.key
        );
        if (index !== -1) {
          state.products[index] = updatedProduct;
        }
        if (state.product && state.product.key === updatedProduct.key) {
          state.product = updatedProduct;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteProduct.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.products = state.products.filter(
          (product) => product.id !== action.payload
        );
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteProducts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.products = state.products.filter(
          (product) => !action.payload.includes(product.id)
        );
      })
      .addCase(deleteProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetProductStatus,
  resetProductsState,
  setProductPage,
  updateSingleProduct,
} = productSlice.actions;
export default productSlice.reducer;
