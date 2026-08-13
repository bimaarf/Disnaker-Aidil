// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";
// import { logout } from "../authentication/AuthSlice";

// // Fetch all routes
// export const fetchAllRoutes = createAsyncThunk(
//   "routes/fetchAllRoutes",
//   async (_, { rejectWithValue }) => {
//     try {
//       const response = await axios.get(
//         `${process.env.REACT_APP_API}api/routes/all`
//       );
//       return {
//         allRoutes: response.data.data, // Ensure this is correct based on your API response structure
//       };
//     } catch (error) {
//       return rejectWithValue(error.response?.data || "Failed to fetch routes");
//     }
//   }
// );

// // Create a new route
// export const createRoute = createAsyncThunk(
//   "routes/createRoute",
//   async (routeData, { rejectWithValue }) => {
//     try {
//       const response = await axios.post(
//         `${process.env.REACT_APP_API}api/routes`,
//         routeData
//       );
//       return response.data.route;
//     } catch (error) {
//       return rejectWithValue(
//         error.response?.data?.errors || "Failed to create route"
//       );
//     }
//   }
// );
// // Fetch routes with pagination
// export const fetchRoutes = createAsyncThunk(
//   "routes/fetchRoutes",
//   async ({ page = 1, perPage = 10 }, { rejectWithValue }) => {
//     try {
//       const response = await axios.get(
//         `${process.env.REACT_APP_API}api/routes`,
//         { params: { page, perPage } }
//       );
//       return {
//         routes: response.data.data,
//         currentPage: response.data.current_page,
//         totalPages: response.data.last_page,
//         total: response.data.total,
//       };
//     } catch (error) {
//       return rejectWithValue(error.response?.data || "Failed to fetch routes");
//     }
//   }
// );
// export const fetchRoute = createAsyncThunk(
//   "routes/fetchRoute",
//   async (routeName, { rejectWithValue }) => {
//     try {
//       const response = await axios.get(
//         `${process.env.REACT_APP_API}api/routes/${routeName}`
//       );
//       return response.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data || "Failed to fetch route");
//     }
//   }
// );

// // Update an existing route
// export const updateRoute = createAsyncThunk(
//   "routes/updateRoute",
//   async ({ routeId, routeData }, { rejectWithValue }) => {
//     try {
//       const response = await axios.put(
//         `${process.env.REACT_APP_API}api/routes/${routeId}`,
//         routeData
//       );
//       return response.data.route;
//     } catch (error) {
//       return rejectWithValue(error.response?.data || "Failed to update route");
//     }
//   }
// );

// // Delete a route
// export const deleteRoute = createAsyncThunk(
//   "routes/deleteRoute",
//   async (routeId, { rejectWithValue, dispatch }) => {
//     try {
//       await axios.delete(`${process.env.REACT_APP_API}api/routes/${routeId}`);
//       return routeId;
//     } catch (error) {
//       if (error.response && error.response.status === 401) {
//         dispatch(logout());
//       }
//       return rejectWithValue(error.response?.data || "Failed to delete route");
//     }
//   }
// );

// // Delete multiple routes
// export const deleteRoutes = createAsyncThunk(
//   "routes/deleteRoutes",
//   async (routeIds, { rejectWithValue, dispatch }) => {
//     try {
//       await Promise.all(
//         routeIds.map(async (id) => {
//           try {
//             await axios.delete(`${process.env.REACT_APP_API}api/routes/${id}`);
//           } catch (error) {
//             if (error.response && error.response.status === 401) {
//               dispatch(logout());
//               throw new Error("Unauthorized - Logging out");
//             }
//             throw error;
//           }
//         })
//       );
//       return routeIds;
//     } catch (error) {
//       return rejectWithValue(error.message || "Failed to delete routes");
//     }
//   }
// );

// const routesSlice = createSlice({
//   name: "routes",
//   initialState: {
//     allRoutes: [],
//     routes: [],
//     status: "idle",
//     error: null,
//     page: 1,
//     perPage: 10,
//     totalPages: 1,
//     total: null,
//     route: null,
//   },
//   reducers: {
//     resetRouteStatus: (state) => {
//       state.status = "idle";
//       state.error = null;
//     },
//     setRoutePage(state, action) {
//       state.page = action.payload;
//     },
//     updateSingleRoute(state, action) {
//       const updatedRoute = action.payload;
//       const index = state.routes.findIndex(
//         (route) => route.name === updatedRoute.name
//       );
//       if (index !== -1) {
//         state.routes[index] = updatedRoute;
//       }
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchAllRoutes.pending, (state) => {
//         state.status = "loading";
//       })
//       .addCase(fetchAllRoutes.fulfilled, (state, action) => {
//         state.status = "succeeded";
//         state.allRoutes = action.payload.allRoutes;
//       })
//       .addCase(fetchAllRoutes.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload;
//       })
//       .addCase(fetchRoutes.pending, (state) => {
//         state.status = "loading";
//       })
//       .addCase(fetchRoutes.fulfilled, (state, action) => {
//         state.status = "succeeded";
//         state.routes = [...state.routes, ...action.payload.routes];
//         state.page = action.payload.currentPage;
//         state.totalPages = action.payload.totalPages;
//         state.totalVisible = action.payload.totalVisible;
//         state.totalHidden = action.payload.totalHidden;
//         state.total = action.payload.total;
//       })
//       .addCase(fetchRoutes.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload;
//       })
//       .addCase(createRoute.pending, (state) => {
//         state.status = "loading";
//       })
//       .addCase(createRoute.fulfilled, (state, action) => {
//         state.status = "succeeded";
//         state.allRoutes.unshift(action.payload);
//       })
//       .addCase(createRoute.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload;
//       })
//       .addCase(updateRoute.pending, (state) => {
//         state.status = "loading";
//       })
//       .addCase(updateRoute.fulfilled, (state, action) => {
//         state.status = "succeeded";
//         const updatedRoute = action.payload;
//         const index = state.allRoutes.findIndex(
//           (route) => route.id === updatedRoute.id
//         );
//         if (index !== -1) {
//           state.allRoutes[index] = updatedRoute;
//         }
//       })
//       .addCase(updateRoute.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload;
//       })
//       .addCase(deleteRoute.pending, (state) => {
//         state.status = "loading";
//       })
//       .addCase(deleteRoute.fulfilled, (state, action) => {
//         state.status = "succeeded";
//         state.allRoutes = state.allRoutes.filter(
//           (route) => route.id !== action.payload
//         );
//       })
//       .addCase(deleteRoute.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload;
//       })
//       .addCase(deleteRoutes.pending, (state) => {
//         state.status = "loading";
//       })
//       .addCase(deleteRoutes.fulfilled, (state, action) => {
//         state.status = "succeeded";
//         state.allRoutes = state.allRoutes.filter(
//           (route) => !action.payload.includes(route.id)
//         );
//       })
//       .addCase(deleteRoutes.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload;
//       });
//   },
// });

// export const { resetRouteStatus } = routesSlice.actions;
// export default routesSlice.reducer;
