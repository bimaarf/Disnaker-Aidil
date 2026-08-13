import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Thunks
export const createVision = createAsyncThunk(
  "visions/createVision",
  async (visionData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/enggang/visions`,
        visionData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );
      return response.data.vision;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create vision"
      );
    }
  }
);

export const fetchAllVisions = createAsyncThunk(
  "roles/fetchAllVisions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/visions/all`
      );
      return {
        allVisions: response.data.data, // Ensure this is correct based on API response structure
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch visions" // Ensure error handling is proper
      );
    }
  }
);
export const fetchVisions = createAsyncThunk(
  "visions/fetchVisions",
  async ({ page = 1, perPage = 20 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/visions`,
        { params: { page, perPage } }
      );
      return {
        visions: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        totalVisible: response.data.total_visible,
        totalHidden: response.data.total_hidden,
        total: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch visions");
    }
  }
);

export const fetchVision = createAsyncThunk(
  "visions/fetchVision",
  async (visionKey, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/visions/${visionKey}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch vision");
    }
  }
);

export const updateVision = createAsyncThunk(
  "visions/updateVision",
  async ({ key, visionData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/enggang/visions/${key}`,
        visionData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.vision;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update vision");
    }
  }
);

export const deleteVision = createAsyncThunk(
  "visions/deleteVision",
  async (visionId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/enggang/visions/${visionId}`
      );
      return visionId;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete vision");
    }
  }
);

export const deleteVisions = createAsyncThunk(
  "visions/deleteVisions",
  async (visionIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        visionIds.map((id) =>
          axios.delete(`${process.env.REACT_APP_API}api/enggang/visions/${id}`)
        )
      );
      return visionIds;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete visions");
    }
  }
);

const visionSlice = createSlice({
  name: "visions",
  initialState: {
    allVisions: [],
    visions: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 20,
    totalVisible: 0,
    totalHidden: 0,
    totalPages: 1,
    total: null,
    vision: null,
  },
  reducers: {
    resetVisionsState: (state) => {
      state.visions = [];
      state.vision = null;
      state.error = null;
      state.status = "idle";
    },
    resetVisionStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setVisionPage(state, action) {
      state.page = action.payload;
    },
    updateSingleVision(state, action) {
      const updatedVision = action.payload;
      const index = state.visions.findIndex(
        (vision) => vision.id === updatedVision.id
      );
      if (index !== -1) {
        state.visions[index] = updatedVision;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllVisions.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllVisions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.allVisions = action.payload.allVisions; // Update allRoles state
      })
      .addCase(fetchAllVisions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createVision.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createVision.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.visions.unshift(action.payload);
      })
      .addCase(createVision.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchVisions.pending, (state) => {
        state.status = "loading";
      });
    builder
      .addCase(fetchVisions.fulfilled, (state, action) => {
        state.status = "succeeded";

        // Extract existing vision IDs into an array
        const existingIds = state.visions.map((vision) => vision.id);

        // Filter out duplicates using Array.prototype.filter
        const newVisions = action.payload.visions.filter(
          (vision) => !existingIds.includes(vision.id)
        );

        // Update the visions state with the new unique visions
        state.visions = [...state.visions, ...newVisions];

        // Update pagination details
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalVisible = action.payload.totalVisible;
        state.totalHidden = action.payload.totalHidden;
        state.total = action.payload.total;
      })
      .addCase(fetchVisions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchVision.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchVision.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.vision = action.payload;
      })
      .addCase(fetchVision.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateVision.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateVision.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedVision = action.payload;
        const index = state.visions.findIndex(
          (vision) => vision.key === updatedVision.key
        );
        if (index !== -1) {
          state.visions[index] = updatedVision;
        }
        if (state.vision && state.vision.key === updatedVision.key) {
          state.vision = updatedVision;
        }
      })
      .addCase(updateVision.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteVision.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteVision.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.visions = state.visions.filter(
          (vision) => vision.id !== action.payload
        );
      })
      .addCase(deleteVision.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteVisions.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteVisions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.visions = state.visions.filter(
          (vision) => !action.payload.includes(vision.id)
        );
      })
      .addCase(deleteVisions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetVisionStatus,
  resetVisionsState,
  setVisionPage,
  updateSingleVision,
} = visionSlice.actions;
export default visionSlice.reducer;
