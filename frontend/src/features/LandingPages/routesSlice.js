import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { logout } from "../authentication/AuthSlice";

// Fetch all routes without pagination
export const fetchAllRoutes = createAsyncThunk(
  "routes/fetchAllRoutes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/routes/all`
      );

      return {
        allRoutes: response.data.data,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch routes");
    }
  }
);

// Create new route
export const createRoute = createAsyncThunk(
  "routes/createRoute",
  async (routeData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/routes`,
        routeData,
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data.route;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create route"
      );
    }
  }
);

// Fetch routes with pagination
export const fetchRoutes = createAsyncThunk(
  "routes/fetchRoutes",
  async ({ page = 1, perPage = 10, search = "" }, { rejectWithValue }) => {
    try {
      const params = { page, perPage };
      if (search) params.search = search;

      const response = await axios.get(
        `${process.env.REACT_APP_API}api/routes`,
        { params }
      );
      return {
        routes: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        total: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch routes");
    }
  }
);

// Fetch single route
export const fetchRoute = createAsyncThunk(
  "routes/fetchRoute",
  async (routeId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/routes/${routeId}`
      );
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch route");
    }
  }
);

// Update route
export const updateRoute = createAsyncThunk(
  "routes/updateRoute",
  async ({ id, routeData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API}api/routes/${id}`,
        routeData,
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data.route;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update route");
    }
  }
);

// Delete route
export const deleteRoute = createAsyncThunk(
  "routes/deleteRoute",
  async (routeId, { rejectWithValue, dispatch }) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API}api/routes/${routeId}`);
      return routeId;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        dispatch(logout());
      }
      return rejectWithValue(err.response?.data || "Failed to delete route");
    }
  }
);

const routesSlice = createSlice({
  name: "routes",
  initialState: {
    allRoutes: [],
    routes: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 10,
    totalPages: 1,
    total: null,
    route: null,
  },
  reducers: {
    resetRouteStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setRoutePage(state, action) {
      state.page = action.payload;
    },
    updateSingleRoute(state, action) {
      const updatedRoute = action.payload;
      const index = state.routes.findIndex(
        (route) => route.id === updatedRoute.id
      );
      if (index !== -1) {
        state.routes[index] = updatedRoute;
      }
    },
    clearRoutes(state) {
      state.routes = [];
      state.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all routes
      .addCase(fetchAllRoutes.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllRoutes.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.allRoutes = action.payload.allRoutes;
      })
      .addCase(fetchAllRoutes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Create route
      .addCase(createRoute.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createRoute.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.routes.unshift(action.payload);
        state.allRoutes.unshift(action.payload);
      })
      .addCase(createRoute.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Fetch routes with pagination
      .addCase(fetchRoutes.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchRoutes.fulfilled, (state, action) => {
        state.status = "succeeded";
        if (action.payload.currentPage === 1) {
          state.routes = action.payload.routes;
        } else {
          state.routes = [...state.routes, ...action.payload.routes];
        }
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.total = action.payload.total;
      })
      .addCase(fetchRoutes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Fetch single route
      .addCase(fetchRoute.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchRoute.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.route = action.payload;
      })
      .addCase(fetchRoute.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Update route
      .addCase(updateRoute.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateRoute.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedRoute = action.payload;
        const index = state.routes.findIndex(
          (route) => route.id === updatedRoute.id
        );
        if (index !== -1) {
          state.routes[index] = updatedRoute;
        }
        if (state.route && state.route.id === updatedRoute.id) {
          state.route = updatedRoute;
        }
        // Update allRoutes as well
        const allIndex = state.allRoutes.findIndex(
          (route) => route.id === updatedRoute.id
        );
        if (allIndex !== -1) {
          state.allRoutes[allIndex] = updatedRoute;
        }
      })
      .addCase(updateRoute.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Delete route
      .addCase(deleteRoute.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteRoute.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.routes = state.routes.filter(
          (route) => route.id !== action.payload
        );
        state.allRoutes = state.allRoutes.filter(
          (route) => route.id !== action.payload
        );
      })
      .addCase(deleteRoute.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetRouteStatus,
  setRoutePage,
  updateSingleRoute,
  clearRoutes,
} = routesSlice.actions;
export default routesSlice.reducer;
