import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// Thunk untuk meng-upload body
export const createBody = createAsyncThunk(
  "body/createBody",
  async (bodyData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/body`,
        bodyData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to upload body"
      );
    }
  }
);

// Thunk untuk mengambil semua body
export const fetchBody = createAsyncThunk(
  "body/fetchBody",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}api/body`);
      return {
        body: response.data.data,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch body");
    }
  }
);

const bodySlice = createSlice({
  name: "body",
  initialState: {
    body: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 10,
    totalPages: 1,
    total: 0,
  },
  reducers: {
    resetBodyStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setBodyPage(state, action) {
      state.page = action.payload;
    },
    updateSingleBody(state, action) {
      const updatedBody = action.payload;
      const index = state.body.findIndex((body) => body.id === updatedBody.id);

      if (index !== -1) {
        state.body[index] = updatedBody;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBody.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createBody.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.body = action.payload;
      })
      .addCase(createBody.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchBody.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchBody.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.body = action.payload.body;
      })
      .addCase(fetchBody.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { resetBodyStatus, setBodyPage, updateSingleBody } =
  bodySlice.actions;

export default bodySlice.reducer;
