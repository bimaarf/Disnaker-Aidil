import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Enhanced Checkout Cache with better memory management
const checkoutCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Limit cache size

// Cache cleanup function
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, entry] of checkoutCache.entries()) {
    if (now - entry.timestamp > CACHE_DURATION) {
      checkoutCache.delete(key);
    }
  }

  // If still too large, remove oldest entries
  if (checkoutCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(checkoutCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, checkoutCache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => checkoutCache.delete(key));
  }
};

// Enhanced cache validation
const isCacheValid = (cacheEntry) => {
  if (!cacheEntry) return false;
  const { timestamp } = cacheEntry;
  return Date.now() - timestamp < CACHE_DURATION;
};

// Enhanced cache getter with cleanup
const getCachedCheckout = (key) => {
  const cacheEntry = checkoutCache.get(key);
  if (isCacheValid(cacheEntry)) {
    return cacheEntry.data;
  }
  checkoutCache.delete(key);
  return null;
};

// Enhanced cache setter with cleanup
const setCachedCheckout = (key, data) => {
  cleanupCache();
  checkoutCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

// Optimized auth token getter
const getAuthToken = () => {
  try {
    return localStorage.getItem("auth_token");
  } catch (error) {
    console.warn("Cannot access localStorage:", error);
    return null;
  }
};

// Enhanced API call with retry logic
const apiCall = async (config, retries = 1) => {
  const token = getAuthToken();

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await axios({
        ...config,
        headers: {
          ...config.headers,
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      });
      return response;
    } catch (error) {
      if (i === retries) throw error;

      // Only retry on network errors or 500+ status codes
      if (
        error.code === "ECONNABORTED" ||
        (error.response && error.response.status >= 500)
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
};

/**
 * Change payment method
 */
export const changePaymentMethod = createAsyncThunk(
  "checkout/changePaymentMethod",
  async ({ checkoutKey, paymentMethod }, { rejectWithValue }) => {
    try {
      const response = await apiCall({
        method: "PUT",
        url: `${process.env.REACT_APP_API}api/checkout/${checkoutKey}/change-payment-method`,
        data: { payment_method: paymentMethod },
      });

      const updatedCheckout = response.data.data;

      // Update cache
      setCachedCheckout(checkoutKey, updatedCheckout);

      return updatedCheckout;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Gagal mengubah metode pembayaran";
      const errors = err.response?.data?.errors || null;

      console.error("changePaymentMethod error:", errorMessage, errors);

      return rejectWithValue({
        message: errorMessage,
        errors,
        status: err.response?.status,
      });
    }
  }
);

/**
 * Check payment status
 */
export const checkPaymentStatus = createAsyncThunk(
  "checkout/checkPaymentStatus",
  async (checkoutKey, { rejectWithValue, getState }) => {
    try {
      const response = await apiCall({
        method: "GET",
        url: `${process.env.REACT_APP_API}api/checkout/${checkoutKey}/payment-status`,
      });

      const paymentStatusData = response.data;

      // Update cache with the latest status
      const state = getState();
      const currentCheckout = state.checkout.checkoutData;
      if (currentCheckout && currentCheckout.key === checkoutKey) {
        const updatedCheckout = {
          ...currentCheckout,
          payment: {
            ...currentCheckout.payment,
            payment_status:
              paymentStatusData.transaction_status ||
              paymentStatusData.payment_status ||
              currentCheckout.payment.payment_status,
            payment_type:
              paymentStatusData.payment_type ||
              currentCheckout.payment.payment_type,
            transaction_id:
              paymentStatusData.transaction_id ||
              currentCheckout.payment.transaction_id,
            paid_at:
              paymentStatusData.transaction_time ||
              paymentStatusData.paid_at ||
              currentCheckout.payment.paid_at,
            order_id:
              paymentStatusData.order_id || currentCheckout.payment.order_id,
            fraud_status:
              paymentStatusData.fraud_status ||
              currentCheckout.payment.fraud_status,
            gross_amount:
              paymentStatusData.gross_amount ||
              currentCheckout.payment.gross_amount,
          },
          status: paymentStatusData.checkout_status || currentCheckout.status,
          can_regenerate: paymentStatusData.can_regenerate || false,
          can_retry: paymentStatusData.can_retry || false,
        };
        setCachedCheckout(checkoutKey, updatedCheckout);
      }

      return paymentStatusData;
    } catch (err) {
      console.error("checkPaymentStatus error:", err);

      return rejectWithValue({
        message:
          err.response?.data?.message || "Gagal memeriksa status pembayaran",
        status: err.response?.status,
        midtransError: err.response?.data?.midtrans_error,
      });
    }
  }
);

/**
 * Regenerate payment token
 */
export const regeneratePayment = createAsyncThunk(
  "checkout/regeneratePayment",
  async ({ checkoutKey, checkoutData }, { rejectWithValue }) => {
    try {
      const response = await apiCall({
        method: "POST",
        url: `${process.env.REACT_APP_API}api/checkout/${checkoutKey}/regenerate-payment`,
        data: {
          total_price: checkoutData.total_price,
          payment_method: "midtrans",
          referral_code: checkoutData.referral_promotion?.referral_code,
          referral_discount:
            checkoutData.referral_promotion?.discount_percentage,
          referral_promotion_id: checkoutData.referral_promotion?.id,
        },
      });

      const responseData = response.data.data || response.data;

      // Update cache
      setCachedCheckout(checkoutKey, responseData);

      return responseData;
    } catch (err) {
      console.error("regeneratePayment error:", err);

      return rejectWithValue({
        message:
          err.response?.data?.message || "Gagal membuat token pembayaran baru",
        status: err.response?.status,
      });
    }
  }
);

/**
 * Get snap token
 */
export const getSnapToken = createAsyncThunk(
  "checkout/getSnapToken",
  async (checkoutKey, { rejectWithValue }) => {
    try {
      const response = await apiCall({
        method: "GET",
        url: `${process.env.REACT_APP_API}api/checkout/${checkoutKey}/snap-token`,
      });

      return response.data;
    } catch (err) {
      console.error("getSnapToken error:", err);

      return rejectWithValue({
        message: err.response?.data?.message || "Gagal mendapatkan snap token",
        status: err.response?.status,
      });
    }
  }
);

/**
 * Optimized create checkout with better error handling
 */
export const createCheckout = createAsyncThunk(
  "checkout/createCheckout",
  async (checkoutData, { rejectWithValue }) => {
    try {
      const response = await apiCall({
        method: "POST",
        url: `${process.env.REACT_APP_API}api/checkout`,
        data: checkoutData,
      });

      const newCheckout = response.data.data;

      // Cache the new checkout
      setCachedCheckout(newCheckout.key, newCheckout);

      // Invalidate related list caches efficiently
      const cacheKeys = Array.from(checkoutCache.keys());
      cacheKeys.forEach((key) => {
        if (key.startsWith("checkouts_page_")) {
          checkoutCache.delete(key);
        }
      });

      return newCheckout;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Gagal membuat checkout";
      const errors = err.response?.data?.errors || null;

      console.error("createCheckout error:", errorMessage, errors);

      return rejectWithValue({
        message: errorMessage,
        errors,
        status: err.response?.status,
      });
    }
  }
);

/**
 * Optimized fetch checkouts with better pagination
 */
export const fetchCheckouts = createAsyncThunk(
  "checkout/fetchCheckouts",
  async (params = {}, { rejectWithValue }) => {
    const {
      page = 1,
      perPage = 10,
      searchQuery = "",
      fromDate = "",
      toDate = "",
      loadMore = false,
      forceRefresh = false,
    } = params;

    const cacheKey = `checkouts_page_${page}_per_${perPage}_q_${searchQuery}_from_${fromDate}_to_${toDate}`;

    // Check cache first unless forced refresh
    if (!forceRefresh && !loadMore) {
      const cachedData = getCachedCheckout(cacheKey);
      if (cachedData) {
        console.log(`fetchCheckouts: Cache hit for ${cacheKey}`);
        return { ...cachedData, isFromCache: true };
      }
    }

    try {
      console.log(`fetchCheckouts: API call for ${cacheKey}`);

      const response = await apiCall({
        method: "GET",
        url: `${process.env.REACT_APP_API}api/checkout`,
        params: {
          page,
          perPage,
          q: searchQuery,
          fromDate,
          toDate,
        },
      });

      const responseData = {
        ...response.data,
        loadMore,
        requestedPage: page,
        timestamp: Date.now(),
      };

      // Cache the response
      setCachedCheckout(cacheKey, responseData);

      return responseData;
    } catch (err) {
      console.error(`fetchCheckouts error for ${cacheKey}:`, err);

      return rejectWithValue({
        message:
          err.response?.data?.message || "Gagal mengambil daftar checkout",
        status: err.response?.status,
      });
    }
  }
);

/**
 * Optimized fetch single checkout with state-first approach
 */
export const fetchCheckout = createAsyncThunk(
  "checkout/fetchCheckout",
  async (key, { rejectWithValue, getState }) => {
    if (!key || key === "undefined" || key.trim() === "") {
      return rejectWithValue({
        message: "Invalid checkout key",
        status: 400,
      });
    }

    // Check Redux state first
    const state = getState();
    const existingCheckout = state.checkout.checkouts.find(
      (checkout) => checkout.key === key
    );

    if (existingCheckout && !isStaleData(existingCheckout)) {
      console.log(`fetchCheckout: State hit for ${key}`);
      return existingCheckout;
    }

    // Check cache
    const cachedData = getCachedCheckout(key);
    if (cachedData && !isStaleData(cachedData)) {
      console.log(`fetchCheckout: Cache hit for ${key}`);
      return cachedData;
    }

    try {
      console.log(`fetchCheckout: API call for ${key}`);

      const response = await apiCall({
        method: "GET",
        url: `${process.env.REACT_APP_API}api/checkout/${key}`,
      });

      const checkoutData = {
        ...response.data.data,
        fetchedAt: Date.now(),
      };

      setCachedCheckout(key, checkoutData);

      return checkoutData;
    } catch (err) {
      console.error(`fetchCheckout error for ${key}:`, err);

      return rejectWithValue({
        message: err.response?.data?.message || "Gagal mengambil data checkout",
        status: err.response?.status,
      });
    }
  }
);

/**
 * Optimized payment status update
 */
export const updatePaymentStatus = createAsyncThunk(
  "checkout/updatePaymentStatus",
  async (
    { checkoutId, paymentStatus, transactionId, paymentMethod },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiCall(
        {
          method: "PUT",
          url: `${process.env.REACT_APP_API}api/checkout/${checkoutId}/payment`,
          data: {
            payment_status: paymentStatus,
            transaction_id: transactionId,
            payment_method: paymentMethod, // Add payment method
          },
        },
        2 // Increased retries to 2
      );

      const updatedCheckout = {
        ...response.data.data,
        updatedAt: Date.now(),
      };

      // Update cache
      setCachedCheckout(updatedCheckout.key, updatedCheckout);

      // Invalidate only related list caches
      const cacheKeys = Array.from(checkoutCache.keys());
      cacheKeys.forEach((key) => {
        if (key.startsWith("checkouts_page_") || key === updatedCheckout.key) {
          checkoutCache.delete(key);
        }
      });

      return updatedCheckout;
    } catch (err) {
      console.error("updatePaymentStatus error:", err);

      return rejectWithValue({
        message:
          err.response?.data?.message || "Gagal memperbarui status pembayaran",
        errors: err.response?.data?.errors || null,
        status: err.response?.status,
      });
    }
  }
);

/**
 * Optimized delete multiple checkouts
 */
export const deleteCheckouts = createAsyncThunk(
  "checkout/deleteCheckouts",
  async (checkoutIds, { rejectWithValue }) => {
    try {
      await apiCall({
        method: "DELETE",
        url: `${process.env.REACT_APP_API}api/checkout/bulk-delete`,
        data: { ids: checkoutIds },
      });

      // Remove from cache
      checkoutIds.forEach((id) => checkoutCache.delete(id));

      // Invalidate list caches
      const cacheKeys = Array.from(checkoutCache.keys());
      cacheKeys.forEach((key) => {
        if (key.startsWith("checkouts_page_")) {
          checkoutCache.delete(key);
        }
      });

      return checkoutIds;
    } catch (err) {
      console.error("deleteCheckouts error:", err);

      return rejectWithValue({
        message: err.response?.data?.message || "Gagal menghapus checkouts",
        status: err.response?.status,
      });
    }
  }
);

/**
 * Optimized delete checkout
 */
export const deleteCheckout = createAsyncThunk(
  "checkout/deleteCheckout",
  async (checkoutId, { rejectWithValue }) => {
    try {
      await apiCall({
        method: "DELETE",
        url: `${process.env.REACT_APP_API}api/checkout/${checkoutId}`,
      });

      // Remove from cache
      checkoutCache.delete(checkoutId);

      // Invalidate list caches
      const cacheKeys = Array.from(checkoutCache.keys());
      cacheKeys.forEach((key) => {
        if (key.startsWith("checkouts_page_")) {
          checkoutCache.delete(key);
        }
      });

      return checkoutId;
    } catch (err) {
      console.error("deleteCheckout error:", err);

      return rejectWithValue({
        message: err.response?.data?.message || "Gagal menghapus checkout",
        status: err.response?.status,
      });
    }
  }
);

// Helper function to check if data is stale
const isStaleData = (data) => {
  if (!data || !data.fetchedAt) return true;
  return Date.now() - data.fetchedAt > CACHE_DURATION;
};

// Optimized merge function using Map for better performance
const mergeCheckoutsUnique = (existingCheckouts, newCheckouts) => {
  const checkoutMap = new Map();

  // Add existing checkouts
  existingCheckouts.forEach((checkout) => {
    const key = checkout.key || checkout.id;
    if (key) checkoutMap.set(key, checkout);
  });

  // Add/update with new checkouts
  newCheckouts.forEach((checkout) => {
    const key = checkout.key || checkout.id;
    if (key) checkoutMap.set(key, checkout);
  });

  return Array.from(checkoutMap.values());
};

// Optimized update function
const updateCheckoutInArray = (checkouts, updatedCheckout) => {
  const updatedKey = updatedCheckout.key || updatedCheckout.id;
  const index = checkouts.findIndex((checkout) => {
    const checkoutKey = checkout.key || checkout.id;
    return checkoutKey === updatedKey;
  });

  if (index !== -1) {
    // Update existing
    const newCheckouts = [...checkouts];
    newCheckouts[index] = updatedCheckout;
    return newCheckouts;
  } else {
    // Add new at the beginning
    return [updatedCheckout, ...checkouts];
  }
};

const checkoutSlice = createSlice({
  name: "checkout",
  initialState: {
    checkouts: [],
    checkoutData: null,
    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: 20,
      total: 0,
    },
    // Search parameters stored in Redux
    searchParams: {
      query: "",
      fromDate: "",
      toDate: "",
    },
    status: "idle",
    createStatus: "idle",
    updateStatus: "idle",
    deleteStatus: "idle",
    changePaymentStatus: "idle",
    regenerateStatus: "idle",
    snapTokenStatus: "idle",
    checkPaymentStatus: "idle",
    error: null,
    lastFetch: null,
    isOptimistic: false,
    paymentStatusData: null,
    snapTokenData: null,
    viewMode: "grid",
  },
  reducers: {
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },

    // Search params management
    setSearchParams: (state, action) => {
      const { query = "", fromDate = "", toDate = "" } = action.payload;
      state.searchParams = {
        query: query.trim(),
        fromDate: fromDate.trim(),
        toDate: toDate.trim(),
      };
    },

    clearSearchParams: (state) => {
      state.searchParams = {
        query: "",
        fromDate: "",
        toDate: "",
      };
    },

    updateSearchQuery: (state, action) => {
      state.searchParams.query = action.payload.trim();
    },

    updateSearchDateRange: (state, action) => {
      const { fromDate = "", toDate = "" } = action.payload;
      state.searchParams.fromDate = fromDate.trim();
      state.searchParams.toDate = toDate.trim();
    },

    // Optimistic update for better UX
    optimisticUpdateCheckout: (state, action) => {
      const updatedCheckout = action.payload;
      state.checkouts = updateCheckoutInArray(state.checkouts, updatedCheckout);
      if (state.checkoutData && state.checkoutData.id === updatedCheckout.id) {
        state.checkoutData = updatedCheckout;
      }
      state.isOptimistic = true;
    },

    // Clear optimistic state
    clearOptimisticState: (state) => {
      state.isOptimistic = false;
    },

    // Update payment status data
    updatePaymentStatusData: (state, action) => {
      state.paymentStatusData = action.payload;
    },

    // Enhanced cache clearing
    clearSpecificCheckoutCache: (state, action) => {
      const key = action.payload;
      checkoutCache.delete(key);

      // Also clear related list caches
      const cacheKeys = Array.from(checkoutCache.keys());
      cacheKeys.forEach((cacheKey) => {
        if (cacheKey.includes(key)) {
          checkoutCache.delete(cacheKey);
        }
      });
    },

    // Enhanced state reset
    resetCheckoutState: (state) => {
      state.status = "idle";
      state.createStatus = "idle";
      state.updateStatus = "idle";
      state.deleteStatus = "idle";
      state.changePaymentStatus = "idle";
      state.regenerateStatus = "idle";
      state.snapTokenStatus = "idle";
      state.checkPaymentStatus = "idle";
      state.error = null;
      state.checkoutData = null;
      state.checkouts = [];
      state.isOptimistic = false;
      state.lastFetch = null;
      state.paymentStatusData = null;
      state.snapTokenData = null;
      checkoutCache.clear();
    },

    // Reset state but keep search params
    resetCheckoutStateKeepSearch: (state) => {
      state.status = "idle";
      state.createStatus = "idle";
      state.updateStatus = "idle";
      state.deleteStatus = "idle";
      state.changePaymentStatus = "idle";
      state.regenerateStatus = "idle";
      state.snapTokenStatus = "idle";
      state.checkPaymentStatus = "idle";
      state.error = null;
      state.checkoutData = null;
      state.checkouts = [];
      state.isOptimistic = false;
      state.lastFetch = null;
      state.paymentStatusData = null;
      state.snapTokenData = null;
      // Keep searchParams intact
      checkoutCache.clear();
    },

    // Selective status reset
    resetActionStatus: (state, action) => {
      const validStatuses = [
        "createStatus",
        "updateStatus",
        "deleteStatus",
        "changePaymentStatus",
        "regenerateStatus",
        "snapTokenStatus",
        "checkPaymentStatus",
      ];
      if (action.payload && validStatuses.includes(action.payload)) {
        state[action.payload] = "idle";
      }
      state.error = null;
    },

    // Enhanced error clearing
    clearError: (state) => {
      state.error = null;
    },

    // Bulk cache clearing
    clearCheckoutCache: (state) => {
      checkoutCache.clear();
      state.lastFetch = null;
    },

    // Update last fetch time
    updateLastFetch: (state) => {
      state.lastFetch = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      // Create checkout cases
      .addCase(createCheckout.pending, (state) => {
        state.createStatus = "loading";
        state.error = null;
      })
      .addCase(createCheckout.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.checkoutData = action.payload;
        state.checkouts = updateCheckoutInArray(
          state.checkouts,
          action.payload
        );
        state.isOptimistic = false;
      })
      .addCase(createCheckout.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error = action.payload;
        state.isOptimistic = false;
      })

      // Fetch checkouts cases
      .addCase(fetchCheckouts.pending, (state, action) => {
        const { loadMore } = action.meta.arg;
        state.status = loadMore ? "loadingMore" : "loading";
        state.error = null;
      })
      .addCase(fetchCheckouts.fulfilled, (state, action) => {
        state.status = "succeeded";
        const { data, current_page, last_page, per_page, total, loadMore } =
          action.payload;

        state.checkouts = loadMore
          ? mergeCheckoutsUnique(state.checkouts, data || [])
          : data || [];

        state.pagination = {
          current_page,
          last_page,
          per_page,
          total,
        };

        state.lastFetch = Date.now();
      })
      .addCase(fetchCheckouts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Fetch checkout cases
      .addCase(fetchCheckout.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCheckout.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.checkoutData = action.payload;
        state.checkouts = updateCheckoutInArray(
          state.checkouts,
          action.payload
        );
      })
      .addCase(fetchCheckout.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Update payment status cases
      .addCase(updatePaymentStatus.pending, (state) => {
        state.updateStatus = "loading";
        state.error = null;
      })
      .addCase(updatePaymentStatus.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        state.checkoutData = action.payload;
        state.checkouts = updateCheckoutInArray(
          state.checkouts,
          action.payload
        );
        state.isOptimistic = false;
      })
      .addCase(updatePaymentStatus.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error = action.payload;
        state.isOptimistic = false;
      })

      // Delete multiple checkouts cases
      .addCase(deleteCheckouts.pending, (state) => {
        state.deleteStatus = "loading";
        state.error = null;
      })
      .addCase(deleteCheckouts.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        const deletedIds = action.payload;
        state.checkouts = state.checkouts.filter(
          (checkout) => !deletedIds.includes(checkout.id)
        );

        if (state.checkoutData && deletedIds.includes(state.checkoutData.id)) {
          state.checkoutData = null;
        }
      })
      .addCase(deleteCheckouts.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error = action.payload;
      })

      // Delete checkout cases
      .addCase(deleteCheckout.pending, (state) => {
        state.deleteStatus = "loading";
        state.error = null;
      })
      .addCase(deleteCheckout.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        state.checkouts = state.checkouts.filter(
          (checkout) => checkout.id !== action.payload
        );

        if (state.checkoutData && state.checkoutData.id === action.payload) {
          state.checkoutData = null;
        }
      })
      .addCase(deleteCheckout.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error = action.payload;
      })

      // Change payment method cases
      .addCase(changePaymentMethod.pending, (state) => {
        state.changePaymentStatus = "loading";
        state.error = null;
      })
      .addCase(changePaymentMethod.fulfilled, (state, action) => {
        state.changePaymentStatus = "succeeded";
        state.checkoutData = action.payload;
        state.checkouts = updateCheckoutInArray(
          state.checkouts,
          action.payload
        );
        state.isOptimistic = false;
      })
      .addCase(changePaymentMethod.rejected, (state, action) => {
        state.changePaymentStatus = "failed";
        state.error = action.payload;
        state.isOptimistic = false;
      })

      // Check payment status cases
      .addCase(checkPaymentStatus.pending, (state) => {
        state.checkPaymentStatus = "loading";
        state.error = null;
      })
      .addCase(checkPaymentStatus.fulfilled, (state, action) => {
        state.checkPaymentStatus = "succeeded";
        state.paymentStatusData = action.payload;

        // Update checkout data if it exists
        if (state.checkoutData) {
          const paymentStatus =
            action.payload.transaction_status || action.payload.payment_status;
          const paymentType = action.payload.payment_type;
          const transactionId = action.payload.transaction_id;
          const checkoutStatus = action.payload.checkout_status;

          // Update payment data with all relevant fields from API response
          state.checkoutData = {
            ...state.checkoutData,
            payment: {
              ...state.checkoutData.payment,
              payment_status: paymentStatus,
              payment_type:
                paymentType || state.checkoutData.payment.payment_type,
              transaction_id:
                transactionId || state.checkoutData.payment.transaction_id,
              paid_at:
                action.payload.transaction_time ||
                action.payload.paid_at ||
                state.checkoutData.payment.paid_at,
              order_id:
                action.payload.order_id || state.checkoutData.payment.order_id,
              fraud_status:
                action.payload.fraud_status ||
                state.checkoutData.payment.fraud_status,
              gross_amount:
                action.payload.gross_amount ||
                state.checkoutData.payment.gross_amount,
            },
            status: checkoutStatus || state.checkoutData.status,
            can_regenerate: action.payload.can_regenerate || false,
            can_retry: action.payload.can_retry || false,
          };

          // Also update in checkouts array
          const index = state.checkouts.findIndex(
            (c) => c.key === state.checkoutData.key
          );
          if (index !== -1) {
            state.checkouts[index] = state.checkoutData;
          }

          // Update cache
          if (state.checkoutData.key) {
            setCachedCheckout(state.checkoutData.key, state.checkoutData);
          }
        }
      })
      .addCase(checkPaymentStatus.rejected, (state, action) => {
        state.checkPaymentStatus = "failed";
        state.error = action.payload;
      })

      // Regenerate payment cases
      .addCase(regeneratePayment.pending, (state) => {
        state.regenerateStatus = "loading";
        state.error = null;
      })
      .addCase(regeneratePayment.fulfilled, (state, action) => {
        state.regenerateStatus = "succeeded";

        // Handle both response formats
        const responseData = action.payload.data || action.payload;
        const snapToken =
          responseData.snap_token || responseData.payment_gateway?.snap_token;
        const redirectUrl =
          responseData.redirect_url ||
          responseData.payment_gateway?.redirect_url;

        if (state.checkoutData) {
          state.checkoutData = {
            ...state.checkoutData,
            payment: {
              ...state.checkoutData.payment,
              payment_status: "pending",
              snap_token: snapToken,
              redirect_url: redirectUrl,
              payment_type: null,
            },
            status: "pending",
          };

          if (responseData.payment_gateway) {
            state.checkoutData.payment_gateway = responseData.payment_gateway;
          }
        }
      })
      .addCase(regeneratePayment.rejected, (state, action) => {
        state.regenerateStatus = "failed";
        state.error = action.payload;
      })

      // Get snap token cases
      .addCase(getSnapToken.pending, (state) => {
        state.snapTokenStatus = "loading";
        state.error = null;
      })
      .addCase(getSnapToken.fulfilled, (state, action) => {
        state.snapTokenStatus = "succeeded";
        state.snapTokenData = action.payload;

        // Update checkout data with new snap token
        if (state.checkoutData && action.payload.snap_token) {
          state.checkoutData = {
            ...state.checkoutData,
            payment: {
              ...state.checkoutData.payment,
              snap_token: action.payload.snap_token,
              redirect_url: action.payload.redirect_url,
            },
          };
        }
      })
      .addCase(getSnapToken.rejected, (state, action) => {
        state.snapTokenStatus = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  setViewMode,
  setSearchParams,
  clearSearchParams,
  updateSearchQuery,
  updateSearchDateRange,
  optimisticUpdateCheckout,
  clearOptimisticState,
  updatePaymentStatusData,
  clearSpecificCheckoutCache,
  resetCheckoutState,
  resetCheckoutStateKeepSearch,
  resetActionStatus,
  clearError,
  clearCheckoutCache,
  updateLastFetch,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;

export const cacheUtils = {
  getCacheSize: () => checkoutCache.size,
  getCacheKeys: () => Array.from(checkoutCache.keys()),
  clearCache: () => checkoutCache.clear(),
  cleanupCache,
};

// Selectors for easy access to search params
export const selectSearchParams = (state) => state.checkout.searchParams;
export const selectSearchQuery = (state) => state.checkout.searchParams.query;
export const selectSearchDateRange = (state) => ({
  fromDate: state.checkout.searchParams.fromDate,
  toDate: state.checkout.searchParams.toDate,
});
export const selectHasActiveFilters = (state) => {
  const { query, fromDate, toDate } = state.checkout.searchParams;
  return !!(query || fromDate || toDate);
};
