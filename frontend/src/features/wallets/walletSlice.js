import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const createWallet = createAsyncThunk(
  "wallets/createWallet",
  async (walletData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/wallets`,
        walletData
      );
      return response.data.wallet;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.errors || "Failed to create wallet"
      );
    }
  }
);
export const fetchOther = createAsyncThunk(
  "otherWallets/otherWallets",
  async ({ pageOther = 1, perPageOther = 10, email }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/wallets/find/${email}`,
        {
          params: {
            perPage: perPageOther,
            sortKey: "id",
            sortDirection: "desc",
            page: pageOther,
          },
        }
      );
      return {
        otherUser: response.data.user,
        otherWallets: response.data.wallets,
        currentPageOther: response.data.current_page,
        perPageOther: response.data.per_page,
        totalPageOther: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch other wallets"
      );
    }
  }
);

export const fetchCurrent = createAsyncThunk(
  "currentWallets/currentWallets",
  async ({ pageFilter = 1, perPageFilter = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/wallets/current`,
        { params: { pageFilter, perPageFilter } }
      );
      return {
        currentWallets: response.data.data,
        currentPageFilter: response.data.current_page,
        totalPagesFilter: response.data.last_page,
        totalFilter: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch current wallets"
      );
    }
  }
);
export const fetchWallets = createAsyncThunk(
  "wallets/fetchWallets",
  async ({ page = 1, perPage = 10, fetchAll = false }, { rejectWithValue }) => {
    try {
      const url = `${process.env.REACT_APP_API}api/wallets`;

      const params = {
        page,
        perPage,
        fetchAll,
      };

      const response = await axios.get(url, { params });

      return {
        wallets: response.data.wallets,
        currentPage: fetchAll ? 1 : response.data.current_page,
        totalPages: fetchAll ? 1 : response.data.last_page,
        total: response.data.total || 0,
        totalActive: response.data.total_active,
        totalSuspend: response.data.total_suspend,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch wallets");
    }
  }
);
// export const fetchWallets = createAsyncThunk(
//   "wallets/fetchWallets",
//   async ({ page = 1, perPage = 10 }, { rejectWithValue }) => {
//     try {
//       const response = await axios.get(
//         `${process.env.REACT_APP_API}api/wallets`,
//         { params: { page, perPage } }
//       );
//       return {
//         wallets: response.data.data,
//         currentPage: response.data.current_page,
//         totalPages: response.data.last_page,
//         totalVisible: response.data.total_visible,
//         totalHidden: response.data.total_hidden,
//         total: response.data.total,
//       };
//     } catch (error) {
//       return rejectWithValue(error.response?.data || "Failed to fetch wallets");
//     }
//   }
// );
export const fetchWallet = createAsyncThunk(
  "wallets/fetchWallet",
  async (walletKey, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/wallets/${walletKey}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch wallet");
    }
  }
);

export const updateWallet = createAsyncThunk(
  "wallets/updateWallet",
  async ({ key, walletData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/wallets/${key}`,
        walletData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.wallets;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update wallet");
    }
  }
);

export const deleteWallet = createAsyncThunk(
  "wallets/deleteWallet",
  async (walletId, { rejectWithValue }) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API}api/wallets/${walletId}`);
      return walletId;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete wallet");
    }
  }
);

export const deleteWallets = createAsyncThunk(
  "wallets/deleteWallets",
  async (walletIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        walletIds.map(async (id) => {
          try {
            await axios.delete(`${process.env.REACT_APP_API}api/wallets/${id}`);
          } catch (err) {
            if (err.response && err.response.status === 401) {
              throw new Error("Unauthorized - Logging out");
            }
            throw err;
          }
        })
      );
      return walletIds;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete wallets");
    }
  }
);

const walletSlice = createSlice({
  name: "wallets",
  initialState: {
    wallets: [],
    currentWallets: [],
    otherWallets: [],
    otherUser: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 10,
    totalPages: 1,
    pageFilter: 1,
    perPageFilter: 10,
    totalPagesOther: 1,
    pageOther: 1,
    perPageOther: 10,
    totalPageOther: 1,
    total: null,
    wallet: null,
  },
  reducers: {
    resetWalletState: (state) => {
      state.wallets = [];
      state.wallet = null;
      state.error = null;
      state.status = "idle";
    },
    resetWalletStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    updateSingleWallet: (state, action) => {
      const updatedWallet = action.payload;
      const index = state.wallets.findIndex(
        (wallet) => wallet.id === updatedWallet.id
      );
      if (index !== -1) {
        state.wallets[index] = updatedWallet;
      }
    },
    updateWalletBalance: (state, action) => {
      const { key, newBalance } = action.payload;
      const wallet = state.wallets.find((wallet) => wallet.key === key);
      if (wallet) {
        wallet.balance = newBalance;
      }
    },
    updateBalance: (state, action) => {
      const { key, newBalance } = action.payload;
      const wallet = state.wallets.find((wallet) => wallet.key === key);
      if (wallet) {
        wallet.balance = newBalance;
      }
      const currentWallets = state.currentWallets.find(
        (current) => current.key === key
      );
      if (currentWallets) {
        currentWallets.balance = newBalance;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createWallet.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createWallet.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.wallets.unshift(action.payload);
      })
      .addCase(createWallet.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchOther.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchOther.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.otherUser = action.payload.otherUser;
        state.otherWallets = action.payload.otherWallets;
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalVisible = action.payload.totalVisible;
        state.totalHidden = action.payload.totalHidden;
        state.total = action.payload.total;
      })

      .addCase(fetchOther.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchCurrent.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCurrent.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.currentWallets = [
          ...state.currentWallets,
          ...action.payload.currentWallets,
        ];
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalVisible = action.payload.totalVisible;
        state.totalHidden = action.payload.totalHidden;
        state.total = action.payload.total;
      })
      .addCase(fetchCurrent.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchWallets.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchWallets.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.wallets = [...state.wallets, ...action.payload.wallets];
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalVisible = action.payload.totalVisible;
        state.totalHidden = action.payload.totalHidden;
        state.total = action.payload.total;
      })
      .addCase(fetchWallets.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWallet.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.wallet = payload;
      })
      .addCase(fetchWallet.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      .addCase(updateWallet.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateWallet.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedWallet = action.payload;
        const index = state.wallets.findIndex(
          (wallet) => wallet.key === updatedWallet.key
        );
        if (index !== -1) {
          state.wallets[index] = updatedWallet;
        }
        if (state.wallet && state.wallet.key === updatedWallet.key) {
          state.wallet = updatedWallet;
        }
      })
      .addCase(updateWallet.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteWallet.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteWallet.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.wallets = state.wallets.filter(
          (wallet) => wallet.key !== action.payload
        );
      })
      .addCase(deleteWallet.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteWallets.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteWallets.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.wallets = state.wallets.filter(
          (wallet) => !action.payload.includes(wallet.key)
        );
      })
      .addCase(deleteWallets.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetWalletStatus,
  setWalletPage,
  updateSingleWallet,
  updateWalletBalance,
  updateBalance,
  resetWalletState,
} = walletSlice.actions;
export default walletSlice.reducer;
