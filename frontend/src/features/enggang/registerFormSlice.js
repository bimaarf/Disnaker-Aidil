import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Thunks
export const createRegisterForm = createAsyncThunk(
  "registerForms/createRegisterForm",
  async (registerFormData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/enggang/form`,
        registerFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create registerForm"
      );
    }
  }
);

export const fetchAllRegisterForms = createAsyncThunk(
  "roles/fetchAllRegisterForms",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/form/all`
      );
      return {
        allRegisterForms: response.data.data, // Ensure this is correct based on API response structure
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch registerForms" // Ensure error handling is proper
      );
    }
  }
);
export const fetchRegisterForms = createAsyncThunk(
  "registerForms/fetchRegisterForms",
  async ({ page = 1, perPage = 20 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/form`,
        { params: { page, perPage } }
      );
      return {
        registerForms: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        totalVisible: response.data.total_visible,
        totalHidden: response.data.total_hidden,
        total: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch registerForms"
      );
    }
  }
);

export const fetchRegisterForm = createAsyncThunk(
  "registerForms/fetchRegisterForm",
  async (registerFormKey, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/enggang/form/${registerFormKey}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch registerForm"
      );
    }
  }
);

export const updateRegisterForm = createAsyncThunk(
  "registerForms/updateRegisterForm",
  async ({ key, registerFormData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/enggang/form/${key}`,
        registerFormData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update registerForm"
      );
    }
  }
);

export const deleteRegisterForm = createAsyncThunk(
  "registerForms/deleteRegisterForm",
  async (registerFormId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/enggang/form/${registerFormId}`
      );
      return registerFormId;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to delete registerForm"
      );
    }
  }
);

export const deleteRegisterForms = createAsyncThunk(
  "registerForms/deleteRegisterForms",
  async (registerFormIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        registerFormIds.map((id) =>
          axios.delete(`${process.env.REACT_APP_API}api/enggang/form/${id}`)
        )
      );
      return registerFormIds;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to delete registerForms"
      );
    }
  }
);

const registerFormSlice = createSlice({
  name: "registerForms",
  initialState: {
    allRegisterForms: [],
    registerForms: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 20,
    totalVisible: 0,
    totalHidden: 0,
    totalPages: 1,
    total: null,
    registerForm: null,
  },
  reducers: {
    resetRegisterFormsState: (state) => {
      state.registerForms = [];
      state.registerForm = null;
      state.error = null;
      state.status = "idle";
    },
    resetRegisterFormStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setRegisterFormPage(state, action) {
      state.page = action.payload;
    },
    updateSingleRegisterForm(state, action) {
      const updatedRegisterForm = action.payload;
      const index = state.registerForms.findIndex(
        (registerForm) => registerForm.id === updatedRegisterForm.id
      );
      if (index !== -1) {
        state.registerForms[index] = updatedRegisterForm;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllRegisterForms.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllRegisterForms.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.allRegisterForms = action.payload.allRegisterForms; // Update allRoles state
      })
      .addCase(fetchAllRegisterForms.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createRegisterForm.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createRegisterForm.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.registerForms.unshift(action.payload);
      })
      .addCase(createRegisterForm.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchRegisterForms.pending, (state) => {
        state.status = "loading";
      });
    builder
      .addCase(fetchRegisterForms.fulfilled, (state, action) => {
        state.status = "succeeded";

        // Extract existing registerForm IDs into an array
        const existingIds = state.registerForms.map(
          (registerForm) => registerForm.id
        );

        // Filter out duplicates using Array.prototype.filter
        const newRegisterForms = action.payload.registerForms.filter(
          (registerForm) => !existingIds.includes(registerForm.id)
        );

        // Update the registerForms state with the new unique registerForms
        state.registerForms = [...state.registerForms, ...newRegisterForms];

        // Update pagination details
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalVisible = action.payload.totalVisible;
        state.totalHidden = action.payload.totalHidden;
        state.total = action.payload.total;
      })
      .addCase(fetchRegisterForms.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchRegisterForm.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchRegisterForm.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.registerForm = action.payload;
      })
      .addCase(fetchRegisterForm.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateRegisterForm.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateRegisterForm.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedRegisterForm = action.payload;
        const index = state.registerForms.findIndex(
          (registerForm) => registerForm.key === updatedRegisterForm.key
        );
        if (index !== -1) {
          state.registerForms[index] = updatedRegisterForm;
        }
        if (
          state.registerForm &&
          state.registerForm.key === updatedRegisterForm.key
        ) {
          state.registerForm = updatedRegisterForm;
        }
      })
      .addCase(updateRegisterForm.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteRegisterForm.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteRegisterForm.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.registerForms = state.registerForms.filter(
          (registerForm) => registerForm.id !== action.payload
        );
      })
      .addCase(deleteRegisterForm.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteRegisterForms.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteRegisterForms.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.registerForms = state.registerForms.filter(
          (registerForm) => !action.payload.includes(registerForm.id)
        );
      })
      .addCase(deleteRegisterForms.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetRegisterFormStatus,
  resetRegisterFormsState,
  setRegisterFormPage,
  updateSingleRegisterForm,
} = registerFormSlice.actions;
export default registerFormSlice.reducer;
