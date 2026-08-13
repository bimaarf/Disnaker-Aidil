import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { logout } from "../authentication/AuthSlice";

export const fetchInitialData = createAsyncThunk(
  "logos/fetchInitialData",
  async (_, { rejectWithValue }) => {
    try {
      const [logoResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}api/logo`),
        // axios.get(`${process.env.REACT_APP_API}api/livechat-settings`),
      ]);

      return {
        logos: logoResponse.data.data,
        // liveChat: {
        //   liveChatId: liveChatResponse.data.data?.license_id || "",
        //   isEnabled: liveChatResponse.data.data?.is_enabled ?? false,
        // },
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch initial data"
      );
    }
  }
);

// Thunk untuk meng-upload logo
export const uploadLogo = createAsyncThunk(
  "logos/uploadLogo",
  async (logoData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/logo`,
        logoData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.data; // Mengembalikan data logo yang di-upload
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to upload logo"
      );
    }
  }
);

// Thunk untuk mengambil semua logo
export const fetchLogos = createAsyncThunk(
  "logos/fetchLogos",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}api/logo`);
      return {
        logos: response.data.data,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch logos");
    }
  }
);

// Thunk untuk mengambil logo berdasarkan ID
export const fetchLogo = createAsyncThunk(
  "logos/fetchLogo",
  async (logoId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/logo/${logoId}`
      );

      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch logo");
    }
  }
);

// Thunk untuk memperbarui logo
export const updateLogo = createAsyncThunk(
  "logos/updateLogo",
  async ({ key, logoData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/logo/${key}`,
        logoData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.data; // Mengembalikan data logo yang diperbarui
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update logo");
    }
  }
);

export const deleteLogo = createAsyncThunk(
  "logos/deleteLogo",
  async (logoId, { rejectWithValue, dispatch }) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API}api/logo/${logoId}`);
      return logoId;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        dispatch(logout());
      }
      return rejectWithValue(err.response?.data || "Failed to delete logo");
    }
  }
);

// Slice untuk logo
const logoSlice = createSlice({
  name: "logos",
  initialState: {
    logos: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 10,
    totalPages: 1,
    total: 0,
    logo: null,
    // liveChatId: "",
    // isEnabled: true,
  },
  reducers: {
    resetLogoStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setLogoPage(state, action) {
      state.page = action.payload;
    },
    updateSingleLogo(state, action) {
      const updatedLogo = action.payload;
      const index = state.logos.findIndex((logo) => logo.id === updatedLogo.id);

      if (index !== -1) {
        state.logos[index] = updatedLogo;
      }
    },
    // setLiveChatSettings(state, action) {
    //   // state.liveChatId = action.payload.liveChatId;
    //   state.isEnabled = action.payload.isEnabled;
    // },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInitialData.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchInitialData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.logos = action.payload.logos || [];
        // state.liveChatId = action.payload.liveChat.liveChatId;
        // state.isEnabled = action.payload.liveChat.isEnabled;
      })
      .addCase(fetchInitialData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(uploadLogo.pending, (state) => {
        state.status = "loading";
      })
      .addCase(uploadLogo.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.logos = action.payload; // Menambahkan logo yang di-upload ke awal array
      })
      .addCase(uploadLogo.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchLogos.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchLogos.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.logos = action.payload?.logos || []; // Use the expected format from the API response
      })
      .addCase(fetchLogos.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchLogo.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchLogo.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.logo = action.payload;
      })
      .addCase(fetchLogo.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateLogo.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateLogo.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedLogo = action.payload;

        state.logos = state.logos.map((logo) =>
          logo.id === updatedLogo.id ? updatedLogo : logo
        );
      })
      .addCase(updateLogo.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteLogo.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteLogo.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.logos = state.logos.filter((logo) => logo.id !== action.payload);
      })
      .addCase(deleteLogo.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

// Ekspor action dan reducer
export const {
  resetLogoStatus,
  setLogoPage,
  updateSingleLogo,
  // setLiveChatSettings,
} = logoSlice.actions;

export default logoSlice.reducer;
