import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Thunks
export const createCoverage = createAsyncThunk(
  "coverages/createCoverage",
  async (coverageData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/enggang/coverages`,
        coverageData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );
      return response.data.coverage;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create coverage"
      );
    }
  }
);

export const fetchAllCoverages = createAsyncThunk(
  "roles/fetchAllCoverages",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/coverages/all`
      );
      return {
        allCoverages: response.data.data, // Ensure this is correct based on API response structure
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch coverages" // Ensure error handling is proper
      );
    }
  }
);
export const fetchCoverages = createAsyncThunk(
  "coverages/fetchCoverages",
  async ({ page = 1, perPage = 20 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/coverages`,
        { params: { page, perPage } }
      );
      return {
        coverages: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        totalVisible: response.data.total_visible,
        totalHidden: response.data.total_hidden,
        total: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch coverages");
    }
  }
);

export const fetchCoverage = createAsyncThunk(
  "coverages/fetchCoverage",
  async (coverageKey, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/coverages/${coverageKey}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch coverage");
    }
  }
);

export const updateCoverage = createAsyncThunk(
  "coverages/updateCoverage",
  async ({ key, coverageData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/enggang/coverages/${key}`,
        coverageData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.coverage;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update coverage");
    }
  }
);

export const deleteCoverage = createAsyncThunk(
  "coverages/deleteCoverage",
  async (coverageId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/enggang/coverages/${coverageId}`
      );
      return coverageId;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete coverage");
    }
  }
);

export const deleteCoverages = createAsyncThunk(
  "coverages/deleteCoverages",
  async (coverageIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        coverageIds.map((id) =>
          axios.delete(`${process.env.REACT_APP_API}api/enggang/coverages/${id}`)
        )
      );
      return coverageIds;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete coverages");
    }
  }
);

const coverageSlice = createSlice({
  name: "coverages",
  initialState: {
    allCoverages: [],
    coverages: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 20,
    totalVisible: 0,
    totalHidden: 0,
    totalPages: 1,
    total: null,
    coverage: null,
  },
  reducers: {
    resetCoveragesState: (state) => {
      state.coverages = [];
      state.coverage = null;
      state.error = null;
      state.status = "idle";
    },
    resetCoverageStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setCoveragePage(state, action) {
      state.page = action.payload;
    },
    updateSingleCoverage(state, action) {
      const updatedCoverage = action.payload;
      const index = state.coverages.findIndex(
        (coverage) => coverage.id === updatedCoverage.id
      );
      if (index !== -1) {
        state.coverages[index] = updatedCoverage;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllCoverages.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllCoverages.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.allCoverages = action.payload.allCoverages; // Update allRoles state
      })
      .addCase(fetchAllCoverages.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createCoverage.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createCoverage.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.coverages.unshift(action.payload);
      })
      .addCase(createCoverage.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchCoverages.pending, (state) => {
        state.status = "loading";
      });
    builder
      .addCase(fetchCoverages.fulfilled, (state, action) => {
        state.status = "succeeded";

        // Extract existing coverage IDs into an array
        const existingIds = state.coverages.map((coverage) => coverage.id);

        // Filter out duplicates using Array.prototype.filter
        const newCoverages = action.payload.coverages.filter(
          (coverage) => !existingIds.includes(coverage.id)
        );

        // Update the coverages state with the new unique coverages
        state.coverages = [...state.coverages, ...newCoverages];

        // Update pagination details
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalVisible = action.payload.totalVisible;
        state.totalHidden = action.payload.totalHidden;
        state.total = action.payload.total;
      })
      .addCase(fetchCoverages.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchCoverage.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCoverage.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.coverage = action.payload;
      })
      .addCase(fetchCoverage.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateCoverage.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateCoverage.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedCoverage = action.payload;
        const index = state.coverages.findIndex(
          (coverage) => coverage.key === updatedCoverage.key
        );
        if (index !== -1) {
          state.coverages[index] = updatedCoverage;
        }
        if (state.coverage && state.coverage.key === updatedCoverage.key) {
          state.coverage = updatedCoverage;
        }
      })
      .addCase(updateCoverage.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteCoverage.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteCoverage.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.coverages = state.coverages.filter(
          (coverage) => coverage.id !== action.payload
        );
      })
      .addCase(deleteCoverage.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteCoverages.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteCoverages.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.coverages = state.coverages.filter(
          (coverage) => !action.payload.includes(coverage.id)
        );
      })
      .addCase(deleteCoverages.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetCoverageStatus,
  resetCoveragesState,
  setCoveragePage,
  updateSingleCoverage,
} = coverageSlice.actions;
export default coverageSlice.reducer;
