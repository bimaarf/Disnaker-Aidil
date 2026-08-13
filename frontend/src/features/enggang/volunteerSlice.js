import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Thunks
export const createVolunteer = createAsyncThunk(
  "volunteers/createVolunteer",
  async (volunteerData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/enggang/volunteers`,
        volunteerData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );
      return response.data.volunteer;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create volunteer"
      );
    }
  }
);

export const fetchAllVolunteers = createAsyncThunk(
  "roles/fetchAllVolunteers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/volunteers/all`
      );
      return {
        allVolunteers: response.data.data, // Ensure this is correct based on API response structure
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch volunteers" // Ensure error handling is proper
      );
    }
  }
);
export const fetchVolunteers = createAsyncThunk(
  "volunteers/fetchVolunteers",
  async ({ page = 1, perPage = 20 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/volunteers`,
        { params: { page, perPage } }
      );
      return {
        volunteers: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        totalVisible: response.data.total_visible,
        totalHidden: response.data.total_hidden,
        total: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch volunteers"
      );
    }
  }
);

export const fetchVolunteer = createAsyncThunk(
  "volunteers/fetchVolunteer",
  async (volunteerKey, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/volunteers/${volunteerKey}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch volunteer");
    }
  }
);

export const updateVolunteer = createAsyncThunk(
  "volunteers/updateVolunteer",
  async ({ key, volunteerData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/enggang/volunteers/${key}`,
        volunteerData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.volunteer;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update volunteer"
      );
    }
  }
);

export const deleteVolunteer = createAsyncThunk(
  "volunteers/deleteVolunteer",
  async (volunteerId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/enggang/volunteers/${volunteerId}`
      );
      return volunteerId;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to delete volunteer"
      );
    }
  }
);

export const deleteVolunteers = createAsyncThunk(
  "volunteers/deleteVolunteers",
  async (volunteerIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        volunteerIds.map((id) =>
          axios.delete(
            `${process.env.REACT_APP_API}api/enggang/volunteers/${id}`
          )
        )
      );
      return volunteerIds;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to delete volunteers"
      );
    }
  }
);

const volunteerSlice = createSlice({
  name: "volunteers",
  initialState: {
    allVolunteers: [],
    volunteers: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 20,
    totalVisible: 0,
    totalHidden: 0,
    totalPages: 1,
    total: null,
    volunteer: null,
  },
  reducers: {
    resetVolunteersState: (state) => {
      state.volunteers = [];
      state.volunteer = null;
      state.error = null;
      state.status = "idle";
    },
    resetVolunteerStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setVolunteerPage(state, action) {
      state.page = action.payload;
    },
    updateSingleVolunteer(state, action) {
      const updatedVolunteer = action.payload;
      const index = state.volunteers.findIndex(
        (volunteer) => volunteer.id === updatedVolunteer.id
      );
      if (index !== -1) {
        state.volunteers[index] = updatedVolunteer;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllVolunteers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllVolunteers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.allVolunteers = action.payload.allVolunteers; // Update allRoles state
      })
      .addCase(fetchAllVolunteers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createVolunteer.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createVolunteer.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.volunteers.unshift(action.payload);
      })
      .addCase(createVolunteer.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchVolunteers.pending, (state) => {
        state.status = "loading";
      });
    builder
      .addCase(fetchVolunteers.fulfilled, (state, action) => {
        state.status = "succeeded";

        // Extract existing volunteer IDs into an array
        const existingIds = state.volunteers.map((volunteer) => volunteer.id);

        // Filter out duplicates using Array.prototype.filter
        const newVolunteers = action.payload.volunteers.filter(
          (volunteer) => !existingIds.includes(volunteer.id)
        );

        // Update the volunteers state with the new unique volunteers
        state.volunteers = [...state.volunteers, ...newVolunteers];

        // Update pagination details
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalVisible = action.payload.totalVisible;
        state.totalHidden = action.payload.totalHidden;
        state.total = action.payload.total;
      })
      .addCase(fetchVolunteers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchVolunteer.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchVolunteer.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.volunteer = action.payload;
      })
      .addCase(fetchVolunteer.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateVolunteer.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateVolunteer.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedVolunteer = action.payload;
        const index = state.volunteers.findIndex(
          (volunteer) => volunteer.key === updatedVolunteer.key
        );
        if (index !== -1) {
          state.volunteers[index] = updatedVolunteer;
        }
        if (state.volunteer && state.volunteer.key === updatedVolunteer.key) {
          state.volunteer = updatedVolunteer;
        }
      })
      .addCase(updateVolunteer.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteVolunteer.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteVolunteer.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.volunteers = state.volunteers.filter(
          (volunteer) => volunteer.id !== action.payload
        );
      })
      .addCase(deleteVolunteer.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteVolunteers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteVolunteers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.volunteers = state.volunteers.filter(
          (volunteer) => !action.payload.includes(volunteer.id)
        );
      })
      .addCase(deleteVolunteers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetVolunteerStatus,
  resetVolunteersState,
  setVolunteerPage,
  updateSingleVolunteer,
} = volunteerSlice.actions;
export default volunteerSlice.reducer;
