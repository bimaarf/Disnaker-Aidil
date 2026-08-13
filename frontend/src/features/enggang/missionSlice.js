import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Thunks
export const createMission = createAsyncThunk(
  "missions/createMission",
  async (missionData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/enggang/missions`,
        missionData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );
      return response.data.mission;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create mission"
      );
    }
  }
);

export const fetchAllMissions = createAsyncThunk(
  "roles/fetchAllMissions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/missions/all`
      );
      return {
        allMissions: response.data.data, // Ensure this is correct based on API response structure
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch missions" // Ensure error handling is proper
      );
    }
  }
);
export const fetchMissions = createAsyncThunk(
  "missions/fetchMissions",
  async ({ page = 1, perPage = 20 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/missions`,
        { params: { page, perPage } }
      );
      return {
        missions: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        totalVisible: response.data.total_visible,
        totalHidden: response.data.total_hidden,
        total: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch missions"
      );
    }
  }
);

export const fetchMission = createAsyncThunk(
  "missions/fetchMission",
  async (missionKey, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/missions/${missionKey}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch mission");
    }
  }
);

export const updateMission = createAsyncThunk(
  "missions/updateMission",
  async ({ key, missionData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/enggang/missions/${key}`,
        missionData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.mission;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update mission"
      );
    }
  }
);

export const deleteMission = createAsyncThunk(
  "missions/deleteMission",
  async (missionId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/enggang/missions/${missionId}`
      );
      return missionId;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete mission");
    }
  }
);

export const deleteMissions = createAsyncThunk(
  "missions/deleteMissions",
  async (missionIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        missionIds.map((id) =>
          axios.delete(`${process.env.REACT_APP_API}api/enggang/missions/${id}`)
        )
      );
      return missionIds;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete missions");
    }
  }
);

const missionSlice = createSlice({
  name: "missions",
  initialState: {
    allMissions: [],
    missions: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 20,
    totalVisible: 0,
    totalHidden: 0,
    totalPages: 1,
    total: null,
    mission: null,
  },
  reducers: {
    resetMissionsState: (state) => {
      state.missions = [];
      state.mission = null;
      state.error = null;
      state.status = "idle";
    },
    resetMissionStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setMissionPage(state, action) {
      state.page = action.payload;
    },
    updateSingleMission(state, action) {
      const updatedMission = action.payload;
      const index = state.missions.findIndex(
        (mission) => mission.id === updatedMission.id
      );
      if (index !== -1) {
        state.missions[index] = updatedMission;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllMissions.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllMissions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.allMissions = action.payload.allMissions; // Update allRoles state
      })
      .addCase(fetchAllMissions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createMission.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createMission.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.missions.unshift(action.payload);
      })
      .addCase(createMission.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchMissions.pending, (state) => {
        state.status = "loading";
      });
    builder
      .addCase(fetchMissions.fulfilled, (state, action) => {
        state.status = "succeeded";

        // Extract existing mission IDs into an array
        const existingIds = state.missions.map((mission) => mission.id);

        // Filter out duplicates using Array.prototype.filter
        const newMissions = action.payload.missions.filter(
          (mission) => !existingIds.includes(mission.id)
        );

        // Update the missions state with the new unique missions
        state.missions = [...state.missions, ...newMissions];

        // Update pagination details
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalVisible = action.payload.totalVisible;
        state.totalHidden = action.payload.totalHidden;
        state.total = action.payload.total;
      })
      .addCase(fetchMissions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchMission.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMission.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.mission = action.payload;
      })
      .addCase(fetchMission.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateMission.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateMission.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedMission = action.payload;
        const index = state.missions.findIndex(
          (mission) => mission.key === updatedMission.key
        );
        if (index !== -1) {
          state.missions[index] = updatedMission;
        }
        if (state.mission && state.mission.key === updatedMission.key) {
          state.mission = updatedMission;
        }
      })
      .addCase(updateMission.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteMission.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteMission.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.missions = state.missions.filter(
          (mission) => mission.id !== action.payload
        );
      })
      .addCase(deleteMission.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteMissions.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteMissions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.missions = state.missions.filter(
          (mission) => !action.payload.includes(mission.id)
        );
      })
      .addCase(deleteMissions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetMissionStatus,
  resetMissionsState,
  setMissionPage,
  updateSingleMission,
} = missionSlice.actions;
export default missionSlice.reducer;
