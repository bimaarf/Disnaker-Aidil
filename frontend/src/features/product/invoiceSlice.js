import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Base API URL
const API_BASE_URL = process.env.REACT_APP_API;

// Async thunks for invoice operations

// Get all invoices (for admin)
// features/product/invoiceSlice.js
export const fetchInvoices = createAsyncThunk(
  "invoice/fetchInvoices",
  async (params = {}, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");

      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page);
      if (params.per_page) queryParams.append("per_page", params.per_page);
      if (params.search) queryParams.append("search", params.search);
      if (params.dateFrom) queryParams.append("date_from", params.dateFrom);
      if (params.dateTo) queryParams.append("date_to", params.dateTo);
      if (params.bankName && params.bankName !== "Semua Bank")
        queryParams.append("bank_name", params.bankName);

      const response = await axios.get(
        `${API_BASE_URL}api/invoice?${queryParams.toString()}`
      );

      return {
        data: response.data,
        params,
      };
    } catch (error) {
      return rejectWithValue({
        message:
          error.response?.data?.message || "Gagal mengambil data invoice",
        status: error.response?.status,
      });
    }
  }
);

// Get invoice by checkout key
export const fetchInvoiceByKey = createAsyncThunk(
  "invoice/fetchInvoiceByKey",
  async (checkoutKey, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");

      const response = await axios.get(
        `${API_BASE_URL}api/invoice/${checkoutKey}`
      );

      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || "Invoice tidak ditemukan",
        status: error.response?.status,
      });
    }
  }
);

// Create or update invoice
export const createOrUpdateInvoice = createAsyncThunk(
  "invoice/createOrUpdateInvoice",
  async ({ checkoutKey, formData }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");

      const response = await axios.post(
        `${API_BASE_URL}api/invoice/${checkoutKey}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return {
        data: response.data,
        checkoutKey,
      };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || "Gagal menyimpan invoice",
        errors: error.response?.data?.errors,
        status: error.response?.status,
      });
    }
  }
);

// Delete invoice
export const deleteInvoice = createAsyncThunk(
  "invoice/deleteInvoice",
  async (checkoutKey, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");

      const response = await axios.delete(
        `${API_BASE_URL}api/invoice/${checkoutKey}`
      );

      return {
        data: response.data,
        checkoutKey,
      };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || "Gagal menghapus invoice",
        status: error.response?.status,
      });
    }
  }
);

// Initial state
const initialState = {
  // Invoice list (for admin)
  viewMode: "grid",
  invoices: [],
  totalInvoices: 0,
  currentPage: 1,
  totalPages: 1,
  perPage: 15,

  // Current invoice (by checkout key)
  currentInvoice: null,
  currentCheckout: null,

  // Loading states
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  fetchStatus: "idle",
  createStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",

  // Error states
  error: null,
  validationErrors: null,

  // Search and filters
  searchTerm: "",
  filters: {
    dateFrom: null,
    dateTo: null,
    bankName: null,
  },
};

// Invoice slice
const invoiceSlice = createSlice({
  name: "invoice",
  initialState,
  reducers: {
    // Reset states
    resetInvoiceState: () => {
      return { ...initialState };
    },
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },

    resetCurrentInvoice: (state) => {
      state.currentInvoice = null;
      state.currentCheckout = null;
      state.fetchStatus = "idle";
      state.error = null;
    },

    resetInvoiceStatus: (state) => {
      state.status = "idle";
      state.createStatus = "idle";
      state.updateStatus = "idle";
      state.deleteStatus = "idle";
      state.error = null;
      state.validationErrors = null;
    },

    // Set search term
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },

    // Set filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Reset filters
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.searchTerm = "";
    },

    // Update current page
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },

    // Update per page
    setPerPage: (state, action) => {
      state.perPage = action.payload;
      state.currentPage = 1; // Reset to first page when changing per page
    },

    // Clear validation errors
    clearValidationErrors: (state) => {
      state.validationErrors = null;
    },

    // Update invoice in list (after create/update)
    updateInvoiceInList: (state, action) => {
      const { invoiceData } = action.payload;
      const existingIndex = state.invoices.findIndex(
        (invoice) => invoice.id === invoiceData.id
      );

      if (existingIndex !== -1) {
        state.invoices[existingIndex] = invoiceData;
      } else {
        state.invoices.unshift(invoiceData);
        state.totalInvoices += 1;
      }
    },

    // Remove invoice from list (after delete)
    removeInvoiceFromList: (state, action) => {
      const { checkoutKey } = action.payload;
      state.invoices = state.invoices.filter(
        (invoice) => invoice.checkout_key !== checkoutKey
      );
      state.totalInvoices = Math.max(0, state.totalInvoices - 1);
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch invoices (list)
      .addCase(fetchInvoices.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.status = "succeeded";
        const { data, params } = action.payload;

        if (params.page && params.page > 1) {
          // Load more - append to existing invoices
          state.invoices = [...state.invoices, ...data.data.data];
        } else {
          // Fresh load - replace invoices
          state.invoices = data.data.data;
        }

        state.currentPage = data.data.current_page;
        state.totalPages = data.data.last_page;
        state.totalInvoices = data.data.total;
        state.perPage = data.data.per_page;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Gagal mengambil data invoice";
      })

      // Fetch invoice by key
      .addCase(fetchInvoiceByKey.pending, (state) => {
        state.fetchStatus = "loading";
        state.error = null;
      })
      .addCase(fetchInvoiceByKey.fulfilled, (state, action) => {
        state.fetchStatus = "succeeded";
        state.currentInvoice = action.payload.data.invoice;
        state.currentCheckout = action.payload.data.checkout;
      })
      .addCase(fetchInvoiceByKey.rejected, (state, action) => {
        state.fetchStatus = "failed";
        state.error = action.payload?.message || "Gagal mengambil data invoice";
        state.currentInvoice = null;
        state.currentCheckout = null;
      })

      // Create or update invoice
      .addCase(createOrUpdateInvoice.pending, (state) => {
        state.createStatus = "loading";
        state.error = null;
        state.validationErrors = null;
      })
      .addCase(createOrUpdateInvoice.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        const { data } = action.payload;

        // Update current invoice if it matches
        if (data.data.invoice) {
          state.currentInvoice = data.data.invoice;
        }

        // Update invoice in list if it exists
        invoiceSlice.caseReducers.updateInvoiceInList(state, {
          payload: { invoiceData: data.data.invoice },
        });
      })
      .addCase(createOrUpdateInvoice.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error = action.payload?.message || "Gagal menyimpan invoice";
        state.validationErrors = action.payload?.errors || null;
      })

      // Delete invoice
      .addCase(deleteInvoice.pending, (state) => {
        state.deleteStatus = "loading";
        state.error = null;
      })
      .addCase(deleteInvoice.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        const { checkoutKey } = action.payload;

        // Clear current invoice if it matches
        if (state.currentCheckout?.key === checkoutKey) {
          state.currentInvoice = null;
          state.currentCheckout = null;
        }

        // Remove from list
        invoiceSlice.caseReducers.removeInvoiceFromList(state, {
          payload: { checkoutKey },
        });
      })
      .addCase(deleteInvoice.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error = action.payload?.message || "Gagal menghapus invoice";
      });
  },
});

// Export actions
export const {
  resetInvoiceState,
  resetCurrentInvoice,
  resetInvoiceStatus,
  setSearchTerm,
  setFilters,
  resetFilters,
  setCurrentPage,
  setPerPage,
  clearValidationErrors,
  updateInvoiceInList,
  removeInvoiceFromList,
  setViewMode,
} = invoiceSlice.actions;

// Selectors
export const selectInvoices = (state) => state.invoice.invoices;
export const selectCurrentInvoice = (state) => state.invoice.currentInvoice;
export const selectCurrentCheckout = (state) => state.invoice.currentCheckout;
export const selectInvoiceStatus = (state) => state.invoice.status;
export const selectFetchStatus = (state) => state.invoice.fetchStatus;
export const selectCreateStatus = (state) => state.invoice.createStatus;
export const selectDeleteStatus = (state) => state.invoice.deleteStatus;
export const selectInvoiceError = (state) => state.invoice.error;
export const selectValidationErrors = (state) => state.invoice.validationErrors;
export const selectSearchTerm = (state) => state.invoice.searchTerm;
export const selectFilters = (state) => state.invoice.filters;
export const selectPagination = (state) => ({
  currentPage: state.invoice.currentPage,
  totalPages: state.invoice.totalPages,
  totalInvoices: state.invoice.totalInvoices,
  perPage: state.invoice.perPage,
});

// Complex selectors
export const selectIsLoading = (state) =>
  state.invoice.status === "loading" || state.invoice.fetchStatus === "loading";

export const selectIsCreating = (state) =>
  state.invoice.createStatus === "loading";

export const selectIsDeleting = (state) =>
  state.invoice.deleteStatus === "loading";

export const selectHasError = (state) => state.invoice.error !== null;

export const selectHasValidationErrors = (state) =>
  state.invoice.validationErrors !== null;

export const selectCanLoadMore = (state) =>
  state.invoice.currentPage < state.invoice.totalPages;

// Export reducer
export default invoiceSlice.reducer;
