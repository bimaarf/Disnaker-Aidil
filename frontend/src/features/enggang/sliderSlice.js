import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Thunks
export const createSlider = createAsyncThunk(
  "sliders/createSlider",
  async (sliderData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/enggang/sliders`,
        sliderData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );
      return response.data.slider;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create slider"
      );
    }
  }
);

export const fetchAllSliders = createAsyncThunk(
  "roles/fetchAllSliders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/sliders/all`
      );
      return {
        allSliders: response.data.data, // Ensure this is correct based on API response structure
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch sliders" // Ensure error handling is proper
      );
    }
  }
);
export const fetchSliders = createAsyncThunk(
  "sliders/fetchSliders",
  async ({ page = 1, perPage = 20 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/sliders`,
        { params: { page, perPage } }
      );
      return {
        sliders: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        totalVisible: response.data.total_visible,
        totalHidden: response.data.total_hidden,
        total: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch sliders");
    }
  }
);

export const fetchSlider = createAsyncThunk(
  "sliders/fetchSlider",
  async (sliderKey, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/sliders/${sliderKey}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch slider");
    }
  }
);

export const updateSlider = createAsyncThunk(
  "sliders/updateSlider",
  async ({ key, sliderData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/enggang/sliders/${key}`,
        sliderData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.slider;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update slider");
    }
  }
);

export const deleteSlider = createAsyncThunk(
  "sliders/deleteSlider",
  async (sliderId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/enggang/sliders/${sliderId}`
      );
      return sliderId;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete slider");
    }
  }
);

export const deleteSliders = createAsyncThunk(
  "sliders/deleteSliders",
  async (sliderIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        sliderIds.map((id) =>
          axios.delete(`${process.env.REACT_APP_API}api/enggang/sliders/${id}`)
        )
      );
      return sliderIds;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete sliders");
    }
  }
);

const sliderSlice = createSlice({
  name: "sliders",
  initialState: {
    allSliders: [],
    sliders: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 20,
    totalVisible: 0,
    totalHidden: 0,
    totalPages: 1,
    total: null,
    slider: null,
  },
  reducers: {
    resetSlidersState: (state) => {
      state.sliders = [];
      state.slider = null;
      state.error = null;
      state.status = "idle";
    },
    resetSliderStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setSliderPage(state, action) {
      state.page = action.payload;
    },
    updateSingleSlider(state, action) {
      const updatedSlider = action.payload;
      const index = state.sliders.findIndex(
        (slider) => slider.id === updatedSlider.id
      );
      if (index !== -1) {
        state.sliders[index] = updatedSlider;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllSliders.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllSliders.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.allSliders = action.payload.allSliders; // Update allRoles state
      })
      .addCase(fetchAllSliders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createSlider.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createSlider.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.sliders.unshift(action.payload);
      })
      .addCase(createSlider.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchSliders.pending, (state) => {
        state.status = "loading";
      });
    builder
      .addCase(fetchSliders.fulfilled, (state, action) => {
        state.status = "succeeded";

        // Extract existing slider IDs into an array
        const existingIds = state.sliders.map((slider) => slider.id);

        // Filter out duplicates using Array.prototype.filter
        const newSliders = action.payload.sliders.filter(
          (slider) => !existingIds.includes(slider.id)
        );

        // Update the sliders state with the new unique sliders
        state.sliders = [...state.sliders, ...newSliders];

        // Update pagination details
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalVisible = action.payload.totalVisible;
        state.totalHidden = action.payload.totalHidden;
        state.total = action.payload.total;
      })
      .addCase(fetchSliders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchSlider.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchSlider.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.slider = action.payload;
      })
      .addCase(fetchSlider.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateSlider.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateSlider.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedSlider = action.payload;
        const index = state.sliders.findIndex(
          (slider) => slider.key === updatedSlider.key
        );
        if (index !== -1) {
          state.sliders[index] = updatedSlider;
        }
        if (state.slider && state.slider.key === updatedSlider.key) {
          state.slider = updatedSlider;
        }
      })
      .addCase(updateSlider.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteSlider.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteSlider.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.sliders = state.sliders.filter(
          (slider) => slider.id !== action.payload
        );
      })
      .addCase(deleteSlider.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteSliders.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteSliders.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.sliders = state.sliders.filter(
          (slider) => !action.payload.includes(slider.id)
        );
      })
      .addCase(deleteSliders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetSliderStatus,
  resetSlidersState,
  setSliderPage,
  updateSingleSlider,
} = sliderSlice.actions;
export default sliderSlice.reducer;
