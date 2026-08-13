import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Thunks
export const createProgram = createAsyncThunk(
  "programs/createProgram",
  async (programData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/enggang/programs`,
        programData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );
      return response.data.program;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create program"
      );
    }
  }
);

export const fetchAllPrograms = createAsyncThunk(
  "roles/fetchAllPrograms",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/programs/all`
      );
      return {
        allPrograms: response.data.data, // Ensure this is correct based on API response structure
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch programs" // Ensure error handling is proper
      );
    }
  }
);
export const fetchPrograms = createAsyncThunk(
  "programs/fetchPrograms",
  async ({ page = 1, perPage = 20 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/programs`,
        { params: { page, perPage } }
      );
      return {
        programs: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        totalVisible: response.data.total_visible,
        totalHidden: response.data.total_hidden,
        total: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch programs"
      );
    }
  }
);

export const fetchProgram = createAsyncThunk(
  "programs/fetchProgram",
  async (programKey, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/programs/${programKey}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch program");
    }
  }
);

export const updateProgram = createAsyncThunk(
  "programs/updateProgram",
  async ({ key, programData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/enggang/programs/${key}`,
        programData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.program;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update program"
      );
    }
  }
);

export const deleteProgram = createAsyncThunk(
  "programs/deleteProgram",
  async (programId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/enggang/programs/${programId}`
      );
      return programId;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete program");
    }
  }
);

export const deletePrograms = createAsyncThunk(
  "programs/deletePrograms",
  async (programIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        programIds.map((id) =>
          axios.delete(`${process.env.REACT_APP_API}api/enggang/programs/${id}`)
        )
      );
      return programIds;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete programs");
    }
  }
);

const programSlice = createSlice({
  name: "programs",
  initialState: {
    allPrograms: [],
    programs: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 20,
    totalVisible: 0,
    totalHidden: 0,
    totalPages: 1,
    total: null,
    program: null,
  },
  reducers: {
    resetProgramsState: (state) => {
      state.programs = [];
      state.program = null;
      state.error = null;
      state.status = "idle";
    },
    resetProgramStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setProgramPage(state, action) {
      state.page = action.payload;
    },
    updateSingleProgram(state, action) {
      const updatedProgram = action.payload;
      const index = state.programs.findIndex(
        (program) => program.id === updatedProgram.id
      );
      if (index !== -1) {
        state.programs[index] = updatedProgram;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllPrograms.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllPrograms.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.allPrograms = action.payload.allPrograms; // Update allRoles state
      })
      .addCase(fetchAllPrograms.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createProgram.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createProgram.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.programs.unshift(action.payload);
      })
      .addCase(createProgram.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchPrograms.pending, (state) => {
        state.status = "loading";
      });
    builder
      .addCase(fetchPrograms.fulfilled, (state, action) => {
        state.status = "succeeded";

        const existingIds = state.programs.map((program) => program.id);

        const newPrograms = action.payload.programs.filter(
          (program) => !existingIds.includes(program.id)
        );

        state.programs = [...state.programs, ...newPrograms];

        // Update pagination details
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalVisible = action.payload.totalVisible;
        state.totalHidden = action.payload.totalHidden;
        state.total = action.payload.total;
      })
      .addCase(fetchPrograms.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchProgram.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchProgram.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.program = action.payload;
      })
      .addCase(fetchProgram.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateProgram.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateProgram.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedProgram = action.payload;
        const index = state.programs.findIndex(
          (program) => program.key === updatedProgram.key
        );
        if (index !== -1) {
          state.programs[index] = updatedProgram;
        }
        if (state.program && state.program.key === updatedProgram.key) {
          state.program = updatedProgram;
        }
      })
      .addCase(updateProgram.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteProgram.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteProgram.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.programs = state.programs.filter(
          (program) => program.id !== action.payload
        );
      })
      .addCase(deleteProgram.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deletePrograms.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deletePrograms.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.programs = state.programs.filter(
          (program) => !action.payload.includes(program.id)
        );
      })
      .addCase(deletePrograms.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetProgramStatus,
  resetProgramsState,
  setProgramPage,
  updateSingleProgram,
} = programSlice.actions;
export default programSlice.reducer;
