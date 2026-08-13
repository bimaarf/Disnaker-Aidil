import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { logout } from "../authentication/AuthSlice";

// Fetch all landings without pagination
export const fetchAllLandings = createAsyncThunk(
  "landings/fetchAllLandings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/landings/all`
      );
      console.log("Fetched all landings data:", response.data);

      return {
        allLandings: response.data.data,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch landings"
      );
    }
  }
);

// Create new landing
export const createLanding = createAsyncThunk(
  "landings/createLanding",
  async (landingData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/landings`,
        landingData,
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data.landing;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create landing"
      );
    }
  }
);

// Fetch landings with pagination
export const fetchLandings = createAsyncThunk(
  "landings/fetchLandings",
  async (
    { page = 1, perPage = 10, search = "", route_id = null },
    { rejectWithValue }
  ) => {
    try {
      const params = { page, perPage };
      if (search) params.search = search;
      if (route_id) params.route_id = route_id;

      const response = await axios.get(
        `${process.env.REACT_APP_API}api/landings`,
        { params }
      );
      return {
        landings: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        total: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch landings"
      );
    }
  }
);

// Fetch single landing
export const fetchLanding = createAsyncThunk(
  "landings/fetchLanding",
  async (landingId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/landings/${landingId}`
      );
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch landing");
    }
  }
);

// Update landing
export const updateLanding = createAsyncThunk(
  "landings/updateLanding",
  async ({ id, landingData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API}api/landings/${id}`,
        landingData,
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data.landing;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update landing"
      );
    }
  }
);

// Delete single landing
export const deleteLanding = createAsyncThunk(
  "landings/deleteLanding",
  async (landingId, { rejectWithValue, dispatch }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/landings/${landingId}`
      );
      return landingId;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        dispatch(logout());
      }
      return rejectWithValue(err.response?.data || "Failed to delete landing");
    }
  }
);

// Delete multiple landings
export const deleteLandings = createAsyncThunk(
  "landings/deleteLandings",
  async (landingIds, { rejectWithValue, dispatch }) => {
    try {
      await Promise.all(
        landingIds.map(async (id) => {
          try {
            await axios.delete(
              `${process.env.REACT_APP_API}api/landings/${id}`
            );
          } catch (err) {
            if (err.response && err.response.status === 401) {
              dispatch(logout());
              throw new Error("Unauthorized - Logging out");
            }
            throw err;
          }
        })
      );
      return landingIds;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete landings");
    }
  }
);

const landingsSlice = createSlice({
  name: "landings",
  initialState: {
    allLandings: [],
    landings: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 10,
    totalPages: 1,
    total: null,
    landing: null,
  },
  reducers: {
    resetLandingStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setLandingPage(state, action) {
      state.page = action.payload;
    },
    updateSingleLanding(state, action) {
      const updatedLanding = action.payload;
      const index = state.landings.findIndex(
        (landing) => landing.id === updatedLanding.id
      );
      if (index !== -1) {
        state.landings[index] = updatedLanding;
      }
    },
    clearLandings(state) {
      state.landings = [];
      state.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all landings
      .addCase(fetchAllLandings.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllLandings.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.allLandings = action.payload.allLandings;
        state.landings = action.payload.landings;
      })
      .addCase(fetchAllLandings.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Create landing
      .addCase(createLanding.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createLanding.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.landings.unshift(action.payload);
        state.allLandings.unshift(action.payload);
      })
      .addCase(createLanding.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Fetch landings with pagination
      .addCase(fetchLandings.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchLandings.fulfilled, (state, action) => {
        state.status = "succeeded";
        if (action.payload.currentPage === 1) {
          state.landings = action.payload.landings;
        } else {
          state.landings = [...state.landings, ...action.payload.landings];
        }
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.total = action.payload.total;
      })
      .addCase(fetchLandings.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Fetch single landing
      .addCase(fetchLanding.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchLanding.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.landing = action.payload;
      })
      .addCase(fetchLanding.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Update landing
      .addCase(updateLanding.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateLanding.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedLanding = action.payload;
        const index = state.landings.findIndex(
          (landing) => landing.id === updatedLanding.id
        );
        if (index !== -1) {
          state.landings[index] = updatedLanding;
        }
        if (state.landing && state.landing.id === updatedLanding.id) {
          state.landing = updatedLanding;
        }
        // Update allLandings as well
        const allIndex = state.allLandings.findIndex(
          (landing) => landing.id === updatedLanding.id
        );
        if (allIndex !== -1) {
          state.allLandings[allIndex] = updatedLanding;
        }
      })
      .addCase(updateLanding.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Delete single landing
      .addCase(deleteLanding.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteLanding.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.landings = state.landings.filter(
          (landing) => landing.id !== action.payload
        );
        state.allLandings = state.allLandings.filter(
          (landing) => landing.id !== action.payload
        );
      })
      .addCase(deleteLanding.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Delete multiple landings
      .addCase(deleteLandings.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteLandings.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.landings = state.landings.filter(
          (landing) => !action.payload.includes(landing.id)
        );
        state.allLandings = state.allLandings.filter(
          (landing) => !action.payload.includes(landing.id)
        );
      })
      .addCase(deleteLandings.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetLandingStatus,
  setLandingPage,
  updateSingleLanding,
  clearLandings,
} = landingsSlice.actions;
export default landingsSlice.reducer;
