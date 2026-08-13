import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { logout } from "../authentication/AuthSlice";

// Existing thunks (unchanged)
export const uploadTheme = createAsyncThunk(
  "themes/uploadTheme",
  async (themeData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/theme`,
        themeData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to upload theme"
      );
    }
  }
);

export const fetchThemes = createAsyncThunk(
  "themes/fetchThemes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}api/theme`);
      return {
        themes: response.data,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch themes");
    }
  }
);

export const fetchTheme = createAsyncThunk(
  "themes/fetchTheme",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/theme/show`
      );
      return response.data || null;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch theme");
    }
  }
);

export const updateTheme = createAsyncThunk(
  "themes/updateTheme",
  async ({ key, themeData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/theme/${key}`,
        themeData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update theme");
    }
  }
);

export const deleteTheme = createAsyncThunk(
  "themes/deleteTheme",
  async (themeId, { rejectWithValue, dispatch }) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API}api/theme/${themeId}`);
      return themeId;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        dispatch(logout());
      }
      return rejectWithValue(err.response?.data || "Failed to delete theme");
    }
  }
);

// Helper function to get initial submenu state
const getInitialSubMenusState = () => {
  const saved = localStorage.getItem("openSubMenus");
  if (saved !== null) {
    return JSON.parse(saved);
  }
  return {};
};

// Helper function to get initial sidebar state
const getInitialSidebarState = () => {
  const saved =
    typeof window !== "undefined" ? localStorage.getItem("theme") : null;
  return saved !== null ? saved : "black"; // default ke "black"
};

// Slice untuk theme
const themeSlice = createSlice({
  name: "themes",
  initialState: {
    themes: [],
    local:
      typeof window !== "undefined"
        ? localStorage.getItem("theme") || "black" // default ke black
        : "black",
    sidebarExpanded: getInitialSidebarState(),
    openSubMenus: getInitialSubMenusState(), // New state for submenus
    status: "idle",
    error: null,
    page: 1,
    perPage: 10,
    totalPages: 1,
    total: 0,
    theme: null || "",
  },
  reducers: {
    resetThemeStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setThemePage(state, action) {
      state.page = action.payload;
    },
    updateSingleTheme(state, action) {
      const updatedTheme = action.payload;
      const index = state.themes.findIndex(
        (theme) => theme.id === updatedTheme.id
      );
      if (index !== -1) {
        state.themes[index] = updatedTheme;
      }
    },
    // Theme reducers
    setLocalTheme(state, action) {
      state.local = action.payload;
      localStorage.setItem("theme", action.payload);
    },
    toggleLocalTheme(state, action) {
      const newTheme =
        action.payload || (state.local === "black" ? "wireframe" : "black");
      state.local = newTheme;
      localStorage.setItem("theme", newTheme);
    },

    // Sidebar reducers
    setSidebarExpanded(state, action) {
      state.sidebarExpanded = action.payload;
      localStorage.setItem("sidebarExpanded", JSON.stringify(action.payload));
    },
    toggleSidebar(state) {
      state.sidebarExpanded = !state.sidebarExpanded;
      localStorage.setItem(
        "sidebarExpanded",
        JSON.stringify(state.sidebarExpanded)
      );
    },
    // Submenu reducers
    toggleSubMenu(state, action) {
      const index = action.payload;
      state.openSubMenus[index] = !state.openSubMenus[index];
      localStorage.setItem("openSubMenus", JSON.stringify(state.openSubMenus));
    },
    setSubMenus(state, action) {
      state.openSubMenus = action.payload;
      localStorage.setItem("openSubMenus", JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadTheme.pending, (state) => {
        state.status = "loading";
      })
      .addCase(uploadTheme.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.themes = action.payload;
      })
      .addCase(uploadTheme.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchThemes.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchThemes.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.themes = action.payload?.themes || [];
      })
      .addCase(fetchThemes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchTheme.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchTheme.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.theme = action.payload;
      })
      .addCase(fetchTheme.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateTheme.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateTheme.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedTheme = action.payload;
        state.themes = state.themes.map((theme) =>
          theme.id === updatedTheme.id ? updatedTheme : theme
        );
      })
      .addCase(updateTheme.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteTheme.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteTheme.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.themes = state.themes.filter(
          (theme) => theme.id !== action.payload
        );
      })
      .addCase(deleteTheme.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export const {
  resetThemeStatus,
  setThemePage,
  updateSingleTheme,
  setLocalTheme,
  toggleLocalTheme,
  setSidebarExpanded,
  toggleSidebar,
  toggleSubMenu,
  setSubMenus,
} = themeSlice.actions;

// Selectors
export const selectLocalTheme = (state) => state.themes.local;
export const selectSidebarExpanded = (state) => state.themes.sidebarExpanded;
export const selectOpenSubMenus = (state) => state.themes.openSubMenus;

export default themeSlice.reducer;
