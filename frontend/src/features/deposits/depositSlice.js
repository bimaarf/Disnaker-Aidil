import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const createDeposit = createAsyncThunk(
  "deposits/createDeposit",
  async (depositData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/deposits`,
        depositData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.deposit;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create deposit"
      );
    }
  }
);

export const fetchDeposits = createAsyncThunk(
  "deposits/fetchDeposits",
  async ({ page = 1, perPage = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/deposits`,
        { params: { page, perPage } }
      );
      return {
        deposits: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        total: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch deposits"
      );
    }
  }
);

// Fetch a single deposit by its key
export const fetchDeposit = createAsyncThunk(
  "deposits/fetchDeposit",
  async (depositKey, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/deposits/${depositKey}`
      );
      return response.data.deposit;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch deposit");
    }
  }
);

// Update an existing deposit
export const updateDeposit = createAsyncThunk(
  "deposits/updateDeposit",
  async ({ key, depositData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/deposits/${key}`,
        depositData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.deposit;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update deposit"
      );
    }
  }
);
export const processDeposit = createAsyncThunk(
  "deposits/processDeposit",
  async ({ key, depositData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/deposits/process/${key}`,
        depositData
      );
      return {
        deposit: response.data.deposit,
        wallet: response.data.wallet,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to process deposit"
      );
    }
  }
);
// Delete a single deposit
export const deleteDeposit = createAsyncThunk(
  "deposits/deleteDeposit",
  async (depositKey, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/deposits/${depositKey}`
      );
      return depositKey;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete deposit");
    }
  }
);

// Delete multiple deposits
export const deleteDeposits = createAsyncThunk(
  "deposits/deleteDeposits",
  async (depositKeys, { rejectWithValue }) => {
    try {
      await Promise.all(
        depositKeys.map((key) =>
          axios.delete(`${process.env.REACT_APP_API}api/deposits/${key}`)
        )
      );
      return depositKeys; // Return the array of deleted deposit keys
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete deposits");
    }
  }
);

const depositsSlice = createSlice({
  name: "deposits",
  initialState: {
    deposits: [],
    wallets: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 10,
    totalPages: 1,
    total: null,
    deposit: null,
    wallet: { balance: 10, id: null, key: null },
  },
  reducers: {
    resetDepositStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },

    resetDepositState: (state) => {
      state.deposits = [];
      state.wallets = [];
      state.error = null;
      state.status = "idle";
    },
    setPage(state, action) {
      state.page = action.payload;
    },
    updateSingleDeposit(state, action) {
      const updatedDeposit = action.payload;
      const index = state.deposits.findIndex(
        (deposit) => deposit.key === updatedDeposit.key
      );
      if (index !== -1) {
        state.deposits[index] = updatedDeposit;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createDeposit.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createDeposit.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.deposits.unshift(action.payload);
      })
      .addCase(createDeposit.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Fetch Deposits
      .addCase(fetchDeposits.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchDeposits.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.deposits =
          action.payload.currentPage === 1
            ? action.payload.deposits
            : [...state.deposits, ...action.payload.deposits];
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.total = action.payload.total;
      })
      .addCase(fetchDeposits.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Fetch Deposit
      .addCase(fetchDeposit.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchDeposit.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.deposit = action.payload;
      })
      .addCase(fetchDeposit.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Update Deposit
      .addCase(updateDeposit.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateDeposit.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedDeposit = action.payload;

        // Update deposit in deposits list
        const index = state.deposits.findIndex(
          (deposit) => deposit.key === updatedDeposit.key
        );
        if (index !== -1) {
          state.deposits[index] = updatedDeposit;
        }

        if (state.deposit && state.deposit.key === updatedDeposit.key) {
          state.deposit = updatedDeposit;
        }
      })
      .addCase(updateDeposit.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(processDeposit.pending, (state) => {
        state.status = "loading";
      })
      .addCase(processDeposit.fulfilled, (state, action) => {
        const { deposit, wallet } = action.payload;

        // Log wallet data to verify
        console.log("Wallet data:", wallet);

        // Update deposits array
        const depositIndex = state.deposits.findIndex(
          (d) => d.key === deposit.key
        );
        if (depositIndex !== -1) {
          state.deposits[depositIndex] = deposit; // Update existing deposit
        }

        // Update wallet balance
        if (wallet) {
          const walletIndex = state.wallets.findIndex(
            (w) => w.key === wallet.key
          );

          if (walletIndex !== -1) {
            // Update existing wallet balance
            state.wallets[walletIndex].balance = wallet.balance;
          } else {
            // If wallet not found, add it to wallets array
            state.wallets.push(wallet);
          }

          // Update the current session wallet if it matches
          if (state.wallet && state.wallet.key === wallet.key) {
            state.wallet.balance = wallet.balance;
          }
        }

        state.status = "succeeded";
      })

      .addCase(processDeposit.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Delete Deposit
      .addCase(deleteDeposit.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteDeposit.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.deposits = state.deposits.filter(
          (deposit) => deposit.key !== action.payload
        );
      })
      .addCase(deleteDeposit.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Delete Deposits
      .addCase(deleteDeposits.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteDeposits.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.deposits = state.deposits.filter(
          (deposit) => !action.payload.includes(deposit.key)
        );
      })
      .addCase(deleteDeposits.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetDepositStatus,
  resetDepositState,
  setPage,
  updateSingleDeposit,
} = depositsSlice.actions;
export default depositsSlice.reducer;
