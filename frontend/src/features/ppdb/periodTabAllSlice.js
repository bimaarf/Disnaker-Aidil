import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchPeriodTabAll = createAsyncThunk(
  "periodTabAll/fetchPeriodTabAll",
  async (page = 1, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/period?page=${page}`
      );
      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error("Failed to fetch period tab all");
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch period tab all"
      );
    }
  }
);

const periodTabAllSlice = createSlice({
  name: "periodTabAll",
  initialState: {
    periods: [],
    currentPage: 1,
    lastPage: 1,
    loading: false,
    error: null,
  },
  reducers: {
    clearPeriodTabAll(state) {
      state.periods = [];
      state.currentPage = 1;
      state.lastPage = 1;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPeriodTabAll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPeriodTabAll.fulfilled, (state, action) => {
        state.loading = false;
        const { data, meta } = action.payload;
        state.periods = [...state.periods, ...data];
        state.currentPage = meta.current_page;
        state.lastPage = meta.last_page;
      })
      .addCase(fetchPeriodTabAll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export const { clearPeriodTabAll } = periodTabAllSlice.actions;

export default periodTabAllSlice.reducer;
