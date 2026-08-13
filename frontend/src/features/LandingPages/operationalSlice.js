import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// Thunk untuk fetch jam operasional
export const fetchOperational = createAsyncThunk(
  "operational/fetchOperational",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/operational`
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch operational data"
      );
    }
  }
);

// Thunk untuk update jam operasional (opsional)
export const updateOperational = createAsyncThunk(
  "operational/updateOperational",
  async (operationalData, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API}api/operational`,
        operationalData
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update operational data"
      );
    }
  }
);

const operationalSlice = createSlice({
  name: "operational",
  initialState: {
    hours: [], // data jam per hari
    note: null, // catatan penting (opsional)
    status: "idle",
    error: null,
  },
  reducers: {
    resetOperationalStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOperational.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchOperational.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.hours = action.payload.hours || [];
        state.note = action.payload.note || null;
      })
      .addCase(fetchOperational.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateOperational.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateOperational.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.hours = action.payload.hours || [];
        state.note = action.payload.note || null;
      })
      .addCase(updateOperational.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { resetOperationalStatus } = operationalSlice.actions;

export default operationalSlice.reducer;
