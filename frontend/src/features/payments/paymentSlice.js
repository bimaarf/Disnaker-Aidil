import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const createPayment = createAsyncThunk(
  "payments/createPayment",
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/payments`,
        paymentData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.payment;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create payment"
      );
    }
  }
);

export const fetchPayments = createAsyncThunk(
  "payments/fetchPayments",
  async ({ page = 1, perPage = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/payments`,
        { params: { page, perPage } }
      );
      return {
        payments: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        totalVisible: response.data.total_visible,
        totalHidden: response.data.total_hidden,
        total: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch payments"
      );
    }
  }
);

export const fetchPayment = createAsyncThunk(
  "payments/fetchPayment",
  async (paymentKey, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/payments/${paymentKey}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch payment");
    }
  }
);

export const updatePayment = createAsyncThunk(
  "payments/updatePayment",
  async ({ key, paymentData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/payments/${key}`,
        paymentData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.payment;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update payment"
      );
    }
  }
);

export const deletePayment = createAsyncThunk(
  "payments/deletePayment",
  async (paymentId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/payments/${paymentId}`
      );
      return paymentId;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete payment");
    }
  }
);

export const deletePayments = createAsyncThunk(
  "payments/deletePayments",
  async (paymentIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        paymentIds.map(async (id) => {
          try {
            await axios.delete(
              `${process.env.REACT_APP_API}api/payments/${id}`
            );
          } catch (err) {
            if (err.response && err.response.status === 401) {
              throw new Error("Unauthorized - Logging out");
            }
            throw err;
          }
        })
      );
      return paymentIds;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete payments");
    }
  }
);

const paymentSlice = createSlice({
  name: "payments",
  initialState: {
    payments: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 10,
    totalVisible: 0,
    totalHidden: 0,
    totalPages: 1,
    total: null,
    payment: null,
  },
  reducers: {
    resetPaymentStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setPaymentPage(state, action) {
      state.page = action.payload;
    },
    updateSinglePayment(state, action) {
      const updatedPayment = action.payload;
      const index = state.payments.findIndex(
        (payment) => payment.id === updatedPayment.id
      );
      if (index !== -1) {
        state.payments[index] = updatedPayment;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPayment.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.payments.unshift(action.payload);
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchPayments.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.payments = [...state.payments, ...action.payload.payments];
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalVisible = action.payload.totalVisible;
        state.totalHidden = action.payload.totalHidden;
        state.total = action.payload.total;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchPayment.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPayment.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.payment = action.payload;
      })
      .addCase(fetchPayment.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updatePayment.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updatePayment.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedPayment = action.payload;
        const index = state.payments.findIndex(
          (payment) => payment.key === updatedPayment.key
        );
        if (index !== -1) {
          state.payments[index] = updatedPayment;
        }
        if (state.payment && state.payment.key === updatedPayment.key) {
          state.payment = updatedPayment;
        }
      })
      .addCase(updatePayment.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deletePayment.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deletePayment.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.payments = state.payments.filter(
          (payment) => payment.id !== action.payload
        );
      })
      .addCase(deletePayment.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deletePayments.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deletePayments.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.payments = state.payments.filter(
          (payment) => !action.payload.includes(payment.id)
        );
      })
      .addCase(deletePayments.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { resetPaymentStatus, setPaymentPage, updateSinglePayment } =
  paymentSlice.actions;
export default paymentSlice.reducer;
