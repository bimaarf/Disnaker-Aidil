import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const createWithdraw = createAsyncThunk(
  "withdraws/createWithdraw",
  async (withdrawData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/withdraws`,
        withdrawData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.withdraw;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create withdraw"
      );
    }
  }
);

export const fetchWithdraws = createAsyncThunk(
  "withdraws/fetchWithdraws",
  async ({ page = 1, perPage = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/withdraws`,
        { params: { page, perPage } }
      );
      return {
        withdraws: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        total: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch withdraws"
      );
    }
  }
);

// Fetch a single withdraw by its key
export const fetchWithdraw = createAsyncThunk(
  "withdraws/fetchWithdraw",
  async (withdrawKey, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/withdraws/${withdrawKey}`
      );
      return response.data.withdraw;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch withdraw");
    }
  }
);

// Update an existing withdraw
export const updateWithdraw = createAsyncThunk(
  "withdraws/updateWithdraw",
  async ({ key, withdrawData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/withdraws/${key}`,
        withdrawData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.withdraw;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update withdraw"
      );
    }
  }
);
export const processWithdraw = createAsyncThunk(
  "withdraws/processWithdraw",
  async ({ key, withdrawData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/withdraws/process/${key}`,
        withdrawData
      );
      return {
        withdraw: response.data.withdraw,
        wallet: response.data.wallet,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update withdraw"
      );
    }
  }
);

// Delete a single withdraw
export const deleteWithdraw = createAsyncThunk(
  "withdraws/deleteWithdraw",
  async (withdrawKey, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/withdraws/${withdrawKey}`
      );
      return withdrawKey;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete withdraw");
    }
  }
);

// Delete multiple withdraws
export const deleteWithdraws = createAsyncThunk(
  "withdraws/deleteWithdraws",
  async (withdrawKeys, { rejectWithValue }) => {
    try {
      await Promise.all(
        withdrawKeys.map((key) =>
          axios.delete(`${process.env.REACT_APP_API}api/withdraws/${key}`)
        )
      );
      return withdrawKeys; // Return the array of deleted withdraw keys
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to delete withdraws"
      );
    }
  }
);

const withdrawsSlice = createSlice({
  name: "withdraws",
  initialState: {
    withdraws: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 10,
    totalPages: 1,
    total: null,
    withdraw: null,
  },
  reducers: {
    resetWithdrawState: (state) => {
      state.withdraws = [];
      state.withdraw = null;
      state.error = null;
      state.status = "idle";
    },
    resetWithdrawStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setPage(state, action) {
      state.page = action.payload;
    },
    updateSingleWithdraw(state, action) {
      const updatedWithdraw = action.payload;
      const index = state.withdraws.findIndex(
        (withdraw) => withdraw.key === updatedWithdraw.key
      );
      if (index !== -1) {
        state.withdraws[index] = updatedWithdraw;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createWithdraw.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createWithdraw.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.withdraws.unshift(action.payload);
      })
      .addCase(createWithdraw.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Fetch Withdraws
      .addCase(fetchWithdraws.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchWithdraws.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.withdraws =
          action.payload.currentPage === 1
            ? action.payload.withdraws
            : [...state.withdraws, ...action.payload.withdraws];
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.total = action.payload.total;
      })
      .addCase(fetchWithdraws.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Fetch Withdraw
      .addCase(fetchWithdraw.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchWithdraw.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.withdraw = action.payload;
      })
      .addCase(fetchWithdraw.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Update Withdraw
      .addCase(updateWithdraw.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateWithdraw.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedWithdraw = action.payload;

        // Update withdraw in withdraws list
        const index = state.withdraws.findIndex(
          (withdraw) => withdraw.key === updatedWithdraw.key
        );
        if (index !== -1) {
          state.withdraws[index] = updatedWithdraw;
        }

        if (state.withdraw && state.withdraw.key === updatedWithdraw.key) {
          state.withdraw = updatedWithdraw;
        }
      })
      .addCase(updateWithdraw.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Update Withdraw
      .addCase(processWithdraw.pending, (state) => {
        state.status = "loading";
      })
      .addCase(processWithdraw.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedWithdraw = action.payload;

        const index = state.withdraws.findIndex(
          (withdraw) => withdraw.key === updatedWithdraw.key
        );
        if (index !== -1) {
          state.withdraws[index] = updatedWithdraw;
        }

        // Update single withdraw if it's the one currently being viewed
        if (state.withdraw && state.withdraw.key === updatedWithdraw.key) {
          state.withdraw = updatedWithdraw;
        }
      })
      .addCase(processWithdraw.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Delete Withdraw
      .addCase(deleteWithdraw.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteWithdraw.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.withdraws = state.withdraws.filter(
          (withdraw) => withdraw.key !== action.payload
        );
      })
      .addCase(deleteWithdraw.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Delete Withdraws
      .addCase(deleteWithdraws.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteWithdraws.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.withdraws = state.withdraws.filter(
          (withdraw) => !action.payload.includes(withdraw.key)
        );
      })
      .addCase(deleteWithdraws.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetWithdrawStatus,
  resetWithdrawState,
  setPage,
  updateSingleWithdraw,
} = withdrawsSlice.actions;
export default withdrawsSlice.reducer;
