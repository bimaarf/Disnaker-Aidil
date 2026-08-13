import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const bankCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

const isCacheValid = (cacheEntry) => {
  if (!cacheEntry) return false;
  const { timestamp } = cacheEntry;
  return Date.now() - timestamp < CACHE_DURATION;
};

const getCachedBanks = (key) => {
  const cacheEntry = bankCache.get(key);
  if (isCacheValid(cacheEntry)) {
    return cacheEntry.data;
  }
  bankCache.delete(key);
  return null;
};

const setCachedBanks = (key, data) => {
  bankCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

const mergeBanksUnique = (existingBanks, newBanks) => {
  const bankMap = new Map();

  existingBanks.forEach((bank) => {
    bankMap.set(bank.key || bank.id, bank);
  });

  newBanks.forEach((bank) => {
    bankMap.set(bank.key || bank.id, bank);
  });

  return Array.from(bankMap.values());
};

const updateBankInArray = (banks, updatedBank) => {
  const index = banks.findIndex(
    (bank) =>
      (bank.key && bank.key === updatedBank.key) ||
      (bank.id && bank.id === updatedBank.id)
  );

  if (index !== -1) {
    banks[index] = updatedBank;
  } else {
    banks.unshift(updatedBank);
  }
  return banks;
};

export const createBank = createAsyncThunk(
  "banks/createBank",
  async (bankData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/bank`,
        bankData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );
      const newBank = response.data.data;
      setCachedBanks(newBank.key, newBank);

      const keysToDelete = [];
      for (let key of bankCache.keys()) {
        if (
          key.startsWith("banks_page_") ||
          key.startsWith("public_banks_page_") ||
          key === "all_banks"
        ) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => bankCache.delete(key));

      return newBank;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create bank"
      );
    }
  }
);

export const fetchAllBanks = createAsyncThunk(
  "banks/fetchAllBanks",
  async (_, { rejectWithValue }) => {
    const cacheKey = "all_banks";
    const cachedData = getCachedBanks(cacheKey);
    if (cachedData) {
      return { allBanks: cachedData };
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API}api/bank`);
      const allBanks = response.data.data;
      setCachedBanks(cacheKey, allBanks);
      return { allBanks };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch banks");
    }
  }
);

export const fetchBanks = createAsyncThunk(
  "banks/fetchBanks",
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
    const cacheKey = `banks_page_${page}_per_${perPage}_q_${searchQuery}_from_${fromDate}_to_${toDate}`;
    const cachedData = getCachedBanks(cacheKey);

    if (cachedData && !loadMore) {
      return { ...cachedData, isFromCache: true };
    }

    try {
      const params = { page, perPage, q: searchQuery, fromDate, toDate };
      const response = await axios.get(`${process.env.REACT_APP_API}api/bank`, {
        params,
      });

      const responseData = {
        ...response.data,
        loadMore,
        requestedPage: page,
      };

      setCachedBanks(cacheKey, responseData);
      return responseData;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch banks");
    }
  }
);

export const fetchPublicBanks = createAsyncThunk(
  "banks/fetchPublicBanks",
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
    const cacheKey = `public_banks_page_${page}_per_${perPage}_q_${searchQuery}_from_${fromDate}_to_${toDate}`;
    const cachedData = getCachedBanks(cacheKey);

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

      const response = await axios.get(`${process.env.REACT_APP_API}api/bank`, {
        params,
      });

      const responseData = {
        ...response.data,
        loadMore,
        requestedPage: page,
      };

      setCachedBanks(cacheKey, responseData);
      return responseData;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch public banks"
      );
    }
  }
);

export const fetchBank = createAsyncThunk(
  "banks/fetchBank",
  async (key, { rejectWithValue, getState }) => {
    const state = getState();
    const existingBank =
      state.banks.banks.find((bank) => bank.key === key) ||
      state.banks.publicBanks.find((bank) => bank.key === key) ||
      state.banks.allBanks.find((bank) => bank.key === key);

    if (existingBank) {
      return existingBank;
    }

    const cachedData = getCachedBanks(key);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/bank/${key}`
      );

      const bankData = response.data.data;
      setCachedBanks(key, bankData);
      return bankData;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch bank");
    }
  }
);

export const updateBank = createAsyncThunk(
  "banks/updateBank",
  async ({ key, bankData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/bank/${key}`,
        bankData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const updatedBank = response.data.data;
      setCachedBanks(key, updatedBank);

      const keysToDelete = [];
      for (let cacheKey of bankCache.keys()) {
        if (
          cacheKey.startsWith("banks_page_") ||
          cacheKey.startsWith("public_banks_page_") ||
          cacheKey === "all_banks"
        ) {
          keysToDelete.push(cacheKey);
        }
      }
      keysToDelete.forEach((cacheKey) => bankCache.delete(cacheKey));

      return updatedBank;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update bank");
    }
  }
);

export const deleteBank = createAsyncThunk(
  "banks/deleteBank",
  async (bankId, { rejectWithValue }) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API}api/bank/${bankId}`);
      bankCache.delete(bankId);

      const keysToDelete = [];
      for (let key of bankCache.keys()) {
        if (
          key.startsWith("banks_page_") ||
          key.startsWith("public_banks_page_") ||
          key === "all_banks"
        ) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => bankCache.delete(key));

      return bankId;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete bank");
    }
  }
);

export const deleteBanks = createAsyncThunk(
  "banks/deleteBanks",
  async (bankIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        bankIds.map((id) =>
          axios.delete(`${process.env.REACT_APP_API}api/bank/${id}`)
        )
      );

      bankIds.forEach((id) => bankCache.delete(id));
      bankCache.clear();

      return bankIds;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete banks");
    }
  }
);

const bankSlice = createSlice({
  name: "banks",
  initialState: {
    allBanks: [],
    banks: [],
    publicBanks: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 1,
    totalVisible: 0,
    totalHidden: 0,
    publicPage: 1,
    publicPerPage: 10,
    publicTotal: 0,
    publicTotalPages: 1,
    publicTotalVisible: 0,
    publicTotalHidden: 0,
    searchQuery: "",
    fromDate: "",
    toDate: "",
    lastFetchParams: null,
    isLoadingMore: false,
  },
  reducers: {
    resetBanks: (state) => {
      state.banks = [];
      state.publicBanks = [];
      state.allBanks = [];
      state.page = 1;
      state.publicPage = 1;
      state.totalPages = 1;
      state.publicTotalPages = 1;
      state.total = 0;
      state.publicTotal = 0;
      state.status = "idle";
      state.lastFetchParams = null;
      state.isLoadingMore = false;
      bankCache.clear();
    },
    setBankFromDate(state, action) {
      state.fromDate = action.payload;
    },
    setBankToDate(state, action) {
      state.toDate = action.payload;
    },
    resetBanksState: (state) => {
      state.banks = [];
      state.publicBanks = [];
      state.error = null;
      state.status = "idle";
      state.isLoadingMore = false;
    },
    resetBankStatus: (state) => {
      state.status = "idle";
      state.error = null;
      state.isLoadingMore = false;
    },
    setBankPage(state, action) {
      state.page = action.payload;
    },
    setPublicBankPage(state, action) {
      state.publicPage = action.payload;
    },
    updateSingleBank(state, action) {
      const updatedBank = action.payload;

      // Update di banks array
      state.banks = updateBankInArray([...state.banks], updatedBank);

      // Update di publicBanks array
      if (updatedBank.status) {
        state.publicBanks = updateBankInArray(
          [...state.publicBanks],
          updatedBank
        );
      } else {
        state.publicBanks = state.publicBanks.filter(
          (bank) => bank.key !== updatedBank.key && bank.id !== updatedBank.id
        );
      }

      // Update di allBanks array
      state.allBanks = updateBankInArray([...state.allBanks], updatedBank);

      setCachedBanks(updatedBank.key, updatedBank);
    },
    clearBankCache: () => {
      bankCache.clear();
    },
    setLoadingMore: (state, action) => {
      state.isLoadingMore = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllBanks.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllBanks.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.allBanks = action.payload.allBanks || [];
      })
      .addCase(fetchAllBanks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createBank.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createBank.fulfilled, (state, action) => {
        state.status = "succeeded";

        // Hindari duplikasi dengan menggunakan helper function
        state.banks = updateBankInArray([...state.banks], action.payload);
        state.allBanks = updateBankInArray([...state.allBanks], action.payload);

        if (action.payload.status) {
          state.publicBanks = updateBankInArray(
            [...state.publicBanks],
            action.payload
          );
        }
      })
      .addCase(createBank.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchBanks.pending, (state, action) => {
        if (action.meta.arg.loadMore) {
          state.isLoadingMore = true;
        } else {
          state.status = "loading";
        }
      })
      .addCase(fetchBanks.fulfilled, (state, action) => {
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

        state.banks = mergeBanksUnique(state.banks, data);

        // Update pagination info
        state.total = total;
        state.totalVisible = total_visible;
        state.totalHidden = total_hidden;
        state.page = current_page;
        state.totalPages = last_page;
        state.perPage = per_page;
      })
      .addCase(fetchBanks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.isLoadingMore = false;
      })
      .addCase(fetchPublicBanks.pending, (state, action) => {
        if (action.meta.arg.loadMore) {
          state.isLoadingMore = true;
        } else {
          state.status = "loading";
        }
      })
      .addCase(fetchPublicBanks.fulfilled, (state, action) => {
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

        state.publicBanks = mergeBanksUnique(state.publicBanks, data);

        state.publicTotal = total;
        state.publicTotalVisible = total_visible;
        state.publicTotalHidden = total_hidden;
        state.publicPage = current_page;
        state.publicTotalPages = last_page;
        state.publicPerPage = per_page;
      })
      .addCase(fetchPublicBanks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.isLoadingMore = false;
      })
      .addCase(fetchBank.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchBank.fulfilled, (state, action) => {
        state.status = "succeeded";
        const bankData = action.payload;

        // Update di semua array tanpa duplikasi
        state.banks = updateBankInArray([...state.banks], bankData);
        state.allBanks = updateBankInArray([...state.allBanks], bankData);

        if (bankData.status) {
          state.publicBanks = updateBankInArray(
            [...state.publicBanks],
            bankData
          );
        }
      })
      .addCase(fetchBank.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateBank.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateBank.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedBank = action.payload;

        state.banks = updateBankInArray([...state.banks], updatedBank);
        state.allBanks = updateBankInArray([...state.allBanks], updatedBank);

        if (updatedBank.status) {
          state.publicBanks = updateBankInArray(
            [...state.publicBanks],
            updatedBank
          );
        } else {
          state.publicBanks = state.publicBanks.filter(
            (bank) => bank.key !== updatedBank.key && bank.id !== updatedBank.id
          );
        }
      })
      .addCase(updateBank.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteBank.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteBank.fulfilled, (state, action) => {
        state.status = "succeeded";
        const bankId = action.payload;

        state.banks = state.banks.filter(
          (bank) => bank.key !== bankId && bank.id !== bankId
        );
        state.publicBanks = state.publicBanks.filter(
          (bank) => bank.key !== bankId && bank.id !== bankId
        );
        state.allBanks = state.allBanks.filter(
          (bank) => bank.key !== bankId && bank.id !== bankId
        );
      })
      .addCase(deleteBank.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteBanks.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteBanks.fulfilled, (state, action) => {
        state.status = "succeeded";
        const bankIds = action.payload;

        state.banks = state.banks.filter(
          (bank) => !bankIds.includes(bank.key) && !bankIds.includes(bank.id)
        );
        state.publicBanks = state.publicBanks.filter(
          (bank) => !bankIds.includes(bank.key) && !bankIds.includes(bank.id)
        );
        state.allBanks = state.allBanks.filter(
          (bank) => !bankIds.includes(bank.key) && !bankIds.includes(bank.id)
        );
      })
      .addCase(deleteBanks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetBanks,
  resetBankStatus,
  resetBanksState,
  setBankPage,
  setPublicBankPage,
  setBankFromDate,
  setBankToDate,
  updateSingleBank,
  clearBankCache,
  setLoadingMore,
} = bankSlice.actions;

export default bankSlice.reducer;
