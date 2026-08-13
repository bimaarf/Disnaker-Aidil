import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// Product Cache dengan struktur yang lebih baik
const productCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Helper function to check if cache is valid
const isCacheValid = (cacheEntry) => {
  if (!cacheEntry) return false;
  const { timestamp } = cacheEntry;
  return Date.now() - timestamp < CACHE_DURATION;
};

// Helper function to get cached data
export const getCachedProducts = (key) => {
  const cacheEntry = productCache.get(key);
  if (isCacheValid(cacheEntry)) {
    return cacheEntry.data;
  }
  productCache.delete(key); // Remove stale cache
  return null;
};

// Helper function to set cached data
const setCachedProducts = (key, data) => {
  productCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

// Helper function untuk menghindari duplikasi product
const mergeProductsUnique = (existingProducts, newProducts) => {
  const productMap = new Map();

  // Add existing products to map
  existingProducts.forEach((product) => {
    productMap.set(product.key || product.id, product);
  });

  // Add or update with new products
  newProducts.forEach((product) => {
    productMap.set(product.key || product.id, product);
  });

  return Array.from(productMap.values());
};

// Helper function untuk update product di array tanpa duplikasi
const updateProductInArray = (products, updatedProduct) => {
  const index = products.findIndex(
    (product) =>
      (product.key && product.key === updatedProduct.key) ||
      (product.id && product.id === updatedProduct.id)
  );

  if (index !== -1) {
    products[index] = updatedProduct;
  } else {
    products.unshift(updatedProduct);
  }
  return products;
};

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
      const newProduct = response.data.data;
      setCachedProducts(newProduct.key, newProduct);

      // Clear cache yang berhubungan dengan list untuk refresh data
      const keysToDelete = [];
      for (let key of productCache.keys()) {
        if (
          key.startsWith("products_page_") ||
          key.startsWith("public_products_page_") ||
          key === "all_products"
        ) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => productCache.delete(key));

      return newProduct;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create product"
      );
    }
  }
);

export const fetchAllProducts = createAsyncThunk(
  "products/fetchAllProducts",
  async (_, { rejectWithValue }) => {
    const cacheKey = "all_products";
    const cachedData = getCachedProducts(cacheKey);
    if (cachedData) {
      return { allProducts: cachedData };
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/product/all`
      );
      const allProducts = response.data.data;
      setCachedProducts(cacheKey, allProducts);
      return { allProducts };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch products"
      );
    }
  }
);

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
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
    const cacheKey = `products_page_${page}_per_${perPage}_q_${searchQuery}_from_${fromDate}_to_${toDate}`;
    const cachedData = getCachedProducts(cacheKey);

    if (cachedData && !loadMore) {
      return { ...cachedData, isFromCache: true };
    }

    try {
      const params = { page, perPage, q: searchQuery, fromDate, toDate };
      console.log(
        "fetchProducts: Sending request to /api/product with params:",
        params
      );

      const response = await axios.get(
        `${process.env.REACT_APP_API}api/product`,
        {
          params,
        }
      );

      console.log("fetchProducts: Response received:", response.data);

      // Attach page number to each product for state checking
      const productsWithPage = response.data.data.map((product) => ({
        ...product,
        page, // Add page number to each product
      }));

      const responseData = {
        ...response.data,
        data: productsWithPage,
        loadMore,
        requestedPage: page,
      };

      setCachedProducts(cacheKey, responseData);
      return responseData;
    } catch (err) {
      console.error("fetchProducts: Error:", err.response?.data || err.message);
      return rejectWithValue(err.response?.data || "Failed to fetch products");
    }
  }
);

export const fetchPublicProducts = createAsyncThunk(
  "products/fetchPublicProducts",
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
    const cacheKey = `public_products_page_${page}_per_${perPage}_q_${searchQuery}_from_${fromDate}_to_${toDate}`;
    const cachedData = getCachedProducts(cacheKey);

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
      console.log("fetchPublicProducts: Sending request with params:", params);

      const response = await axios.get(
        `${process.env.REACT_APP_API}api/product`,
        {
          params,
        }
      );

      const responseData = {
        ...response.data,
        loadMore,
        requestedPage: page,
      };

      setCachedProducts(cacheKey, responseData);
      return responseData;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch public products"
      );
    }
  }
);

export const fetchProduct = createAsyncThunk(
  "products/fetchProduct",
  async ({ key, isPublic = false }, { rejectWithValue, getState }) => {
    // Check di state terlebih dahulu
    const state = getState();
    const existingProduct =
      state.products.products.find((product) => product.key === key) ||
      state.products.publicProducts.find((product) => product.key === key) ||
      state.products.allProducts.find((product) => product.key === key);

    if (existingProduct) {
      if (isPublic && !existingProduct.status) {
        // Jika request untuk public product tapi product tidak public, fetch ulang
      } else {
        return existingProduct;
      }
    }

    const cachedData = getCachedProducts(key);
    if (cachedData) {
      if (isPublic && !cachedData.status) {
        // Jika request untuk public product tapi cached product tidak public, fetch ulang
      } else {
        return cachedData;
      }
    }

    try {
      const params = isPublic ? { isPublic: true } : {};
      console.log(
        "fetchProduct: Sending request to /api/product/" +
          key +
          " with params:",
        params
      );

      const response = await axios.get(
        `${process.env.REACT_APP_API}api/product/${key}`,
        { params }
      );

      const productData = response.data.data;

      if (isPublic && !productData.status) {
        return rejectWithValue("Product is not publicly accessible");
      }

      setCachedProducts(key, productData);
      return productData;
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
      const updatedProduct = response.data.data;
      setCachedProducts(key, updatedProduct);

      // Clear related cache entries
      const keysToDelete = [];
      for (let cacheKey of productCache.keys()) {
        if (
          cacheKey.startsWith("products_page_") ||
          cacheKey.startsWith("public_products_page_") ||
          cacheKey === "all_products"
        ) {
          keysToDelete.push(cacheKey);
        }
      }
      keysToDelete.forEach((cacheKey) => productCache.delete(cacheKey));

      return updatedProduct;
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
      productCache.delete(productId);

      // Clear related cache entries
      const keysToDelete = [];
      for (let key of productCache.keys()) {
        if (
          key.startsWith("products_page_") ||
          key.startsWith("public_products_page_") ||
          key === "all_products"
        ) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => productCache.delete(key));

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

      productIds.forEach((id) => productCache.delete(id));

      // Clear related cache entries
      productCache.clear(); // Clear all cache untuk memastikan konsistensi

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
    publicProducts: [],
    status: "idle",
    error: null,

    // State untuk products (dashboard)
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 1,
    totalVisible: 0,
    totalHidden: 0,
    searchQuery: "",
    fromDate: "",
    toDate: "",

    // State terpisah untuk publicProducts
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
    publicIsLoadingMore: false,

    // Tambahan untuk tracking
    lastFetchParams: null,
    isLoadingMore: false,
  },
  reducers: {
    resetProducts: (state) => {
      state.products = [];
      state.page = 1;
      state.totalPages = 1;
      state.total = 0;
      state.status = "idle";
      state.lastFetchParams = null;
      state.isLoadingMore = false;
      // Hapus cache khusus products saja
      for (let key of productCache.keys()) {
        if (key.startsWith("products_page_")) {
          productCache.delete(key);
        }
      }
    },

    resetPublicProducts: (state) => {
      state.publicProducts = [];
      state.publicPage = 1;
      state.publicTotalPages = 1;
      state.publicTotal = 0;
      state.publicStatus = "idle";
      state.publicIsLoadingMore = false;
      // Hapus cache khusus public products saja
      for (let key of productCache.keys()) {
        if (key.startsWith("public_products_page_")) {
          productCache.delete(key);
        }
      }
    },

    resetAllProducts: (state) => {
      state.allProducts = [];
      productCache.delete("all_products");
    },

    setProductFromDate(state, action) {
      state.fromDate = action.payload;
    },
    setProductToDate(state, action) {
      state.toDate = action.payload;
    },

    setPublicProductFromDate(state, action) {
      state.publicFromDate = action.payload;
    },
    setPublicProductToDate(state, action) {
      state.publicToDate = action.payload;
    },

    resetProductsState: (state) => {
      state.products = [];
      state.error = null;
      state.status = "idle";
      state.isLoadingMore = false;
    },

    resetPublicProductsState: (state) => {
      state.publicProducts = [];
      state.publicError = null;
      state.publicStatus = "idle";
      state.publicIsLoadingMore = false;
    },

    resetProductStatus: (state) => {
      state.status = "idle";
      state.error = null;
      state.isLoadingMore = false;
    },

    resetPublicProductStatus: (state) => {
      state.publicStatus = "idle";
      state.publicError = null;
      state.publicIsLoadingMore = false;
    },

    setProductPage(state, action) {
      state.page = action.payload;
    },
    setPublicProductPage(state, action) {
      state.publicPage = action.payload;
    },

    setProductSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    setPublicProductSearchQuery(state, action) {
      state.publicSearchQuery = action.payload;
    },

    updateSingleProduct(state, action) {
      const updatedProduct = action.payload;

      // Update di products array
      state.products = updateProductInArray(
        [...state.products],
        updatedProduct
      );

      // Update di publicProducts array
      if (updatedProduct.status) {
        state.publicProducts = updateProductInArray(
          [...state.publicProducts],
          updatedProduct
        );
      } else {
        state.publicProducts = state.publicProducts.filter(
          (product) =>
            product.key !== updatedProduct.key &&
            product.id !== updatedProduct.id
        );
      }

      // Update di allProducts array
      state.allProducts = updateProductInArray(
        [...state.allProducts],
        updatedProduct
      );

      setCachedProducts(updatedProduct.key, updatedProduct);
    },
    clearProductCache: () => {
      productCache.clear();
    },
    setLoadingMore: (state, action) => {
      state.isLoadingMore = action.payload;
    },
    setPublicLoadingMore: (state, action) => {
      state.publicIsLoadingMore = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllProducts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.allProducts = action.payload.allProducts || [];
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

        // Hindari duplikasi dengan menggunakan helper function
        state.products = updateProductInArray([...state.products], action.payload);
        state.allProducts = updateProductInArray([...state.allProducts], action.payload);

        if (action.payload.status) {
          state.publicProducts = updateProductInArray(
            [...state.publicProducts],
            action.payload
          );
        }
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchProducts.pending, (state, action) => {
        if (action.meta.arg.loadMore) {
          state.isLoadingMore = true;
        } else {
          state.status = "loading";
        }
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
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

        // Merge products without duplicates, preserving page info
        state.products = mergeProductsUnique(state.products, data);

        // Update pagination info
        state.total = total;
        state.totalVisible = total_visible;
        state.totalHidden = total_hidden;
        state.page = current_page;
        state.totalPages = last_page;
        state.perPage = per_page;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.isLoadingMore = false;
      })
      .addCase(fetchPublicProducts.pending, (state, action) => {
        if (action.meta.arg.loadMore) {
          state.publicIsLoadingMore = true;
        } else {
          state.publicStatus = "loading";
        }
      })
      .addCase(fetchPublicProducts.fulfilled, (state, action) => {
        const {
          data,
          total,
          total_visible,
          total_hidden,
          current_page,
          last_page,
          per_page,
        } = action.payload;

        state.publicStatus = "succeeded";
        state.publicIsLoadingMore = false;

        state.publicProducts = mergeProductsUnique(state.publicProducts, data);

        state.publicTotal = total;
        state.publicTotalVisible = total_visible;
        state.publicTotalHidden = total_hidden;
        state.publicPage = current_page;
        state.publicTotalPages = last_page;
        state.publicPerPage = per_page;
      })
      .addCase(fetchPublicProducts.rejected, (state, action) => {
        state.publicStatus = "failed";
        state.publicError = action.payload;
        state.publicIsLoadingMore = false;
      })
      .addCase(fetchProduct.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.status = "succeeded";
        const productData = action.payload;

        // Update di semua array tanpa duplikasi
        state.products = updateProductInArray([...state.products], productData);
        state.allProducts = updateProductInArray(
          [...state.allProducts],
          productData
        );

        if (productData.status) {
          state.publicProducts = updateProductInArray(
            [...state.publicProducts],
            productData
          );
        }
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

        // Update semua array
        state.products = updateProductInArray(
          [...state.products],
          updatedProduct
        );
        state.allProducts = updateProductInArray(
          [...state.allProducts],
          updatedProduct
        );

        if (updatedProduct.status) {
          state.publicProducts = updateProductInArray(
            [...state.publicProducts],
            updatedProduct
          );
        } else {
          state.publicProducts = state.publicProducts.filter(
            (product) =>
              product.key !== updatedProduct.key &&
              product.id !== updatedProduct.id
          );
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
        const productId = action.payload;

        state.products = state.products.filter(
          (product) => product.key !== productId && product.id !== productId
        );
        state.publicProducts = state.publicProducts.filter(
          (product) => product.key !== productId && product.id !== productId
        );
        state.allProducts = state.allProducts.filter(
          (product) => product.key !== productId && product.id !== productId
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
        const productIds = action.payload;

        state.products = state.products.filter(
          (product) =>
            !productIds.includes(product.key) &&
            !productIds.includes(product.id)
        );
        state.publicProducts = state.publicProducts.filter(
          (product) =>
            !productIds.includes(product.key) &&
            !productIds.includes(product.id)
        );
        state.allProducts = state.allProducts.filter(
          (product) =>
            !productIds.includes(product.key) &&
            !productIds.includes(product.id)
        );
      })
      .addCase(deleteProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetProducts,
  resetPublicProducts,
  resetAllProducts,
  resetProductStatus,
  resetPublicProductStatus,
  resetProductsState,
  resetPublicProductsState,
  setProductPage,
  setPublicProductPage,
  setProductFromDate,
  setProductToDate,
  setPublicProductFromDate,
  setPublicProductToDate,
  setProductSearchQuery,
  setPublicProductSearchQuery,
  updateSingleProduct,
  clearProductCache,
  setLoadingMore,
  setPublicLoadingMore,
} = productSlice.actions;

export default productSlice.reducer;
