import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { logout } from "../authentication/AuthSlice";
export const fetchAllRoles = createAsyncThunk(
  "roles/fetchAllRoles",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/roles/all`
      );
      console.log("Fetched all roles data:", response.data); // Log correct data

      return {
        allRoles: response.data.data, // Ensure this is correct based on API response structure
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch roles" // Ensure error handling is proper
      );
    }
  }
);
export const createRole = createAsyncThunk(
  "roles/createRole",
  async (roleRata, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/roles`,
        roleRata,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.role;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create role"
      );
    }
  }
);
// Fetch roles with pagination
export const fetchRoles = createAsyncThunk(
  "roles/fetchRoles",
  async ({ page = 1, perPage = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/roles`,
        { params: { page, perPage } }
      );
      return {
        roles: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        total: response.data.total,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch roles");
    }
  }
);
export const fetchRole = createAsyncThunk(
  "roles/fetchRole",
  async (roleName, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/roles/${roleName}`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch role");
    }
  }
);
export const updateRole = createAsyncThunk(
  "roles/updateRole",
  async ({ params, roleData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/roles/${params}`,
        roleData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.role;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update role");
    }
  }
);
export const deleteRole = createAsyncThunk(
  "roles/deleteRole",
  async (roleId, { rejectWithValue, dispatch }) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API}api/roles/${roleId}`);
      return roleId;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        dispatch(logout());
      }
      return rejectWithValue(err.response?.data || "Failed to delete role");
    }
  }
);
export const deleteRoles = createAsyncThunk(
  "roles/deleteRoles",
  async (roleIds, { rejectWithValue, dispatch }) => {
    try {
      await Promise.all(
        roleIds.map(async (id) => {
          try {
            await axios.delete(`${process.env.REACT_APP_API}api/roles/${id}`);
          } catch (err) {
            if (err.response && err.response.status === 401) {
              dispatch(logout());
              throw new Error("Unauthorized - Logging out");
            }
            throw err;
          }
        })
      );
      return roleIds;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete roles");
    }
  }
);
const rolesSlice = createSlice({
  name: "roles",
  initialState: {
    allRoles: [],
    roles: [],
    status: "idle",
    error: null,
    page: 1,
    perPage: 10,
    totalPages: 1,
    total: null,
    role: null,
  },
  reducers: {
    resetRoleStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setRolePage(state, action) {
      state.page = action.payload;
    },
    updateSingleRole(state, action) {
      const updatedRole = action.payload;
      const index = state.roles.findIndex(
        (role) => role.name === updatedRole.name
      );
      if (index !== -1) {
        state.roles[index] = updatedRole;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllRoles.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllRoles.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.allRoles = action.payload.allRoles; // Update allRoles state
      })
      .addCase(fetchAllRoles.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // added
      .addCase(createRole.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.roles.unshift(action.payload);
      })
      .addCase(createRole.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchRoles.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.roles = [...state.roles, ...action.payload.roles];
        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalVisible = action.payload.totalVisible;
        state.totalHidden = action.payload.totalHidden;
        state.total = action.payload.total;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchRole.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchRole.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.role = action.payload;
      })
      .addCase(fetchRole.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateRole.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedRole = action.payload;
        const index = state.roles.findIndex(
          (role) => role.name === updatedRole.name
        );
        if (index !== -1) {
          state.roles[index] = updatedRole;
        }
        if (state.role && state.role.name === updatedRole.name) {
          state.role = updatedRole;
        }
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteRole.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.roles = state.roles.filter((role) => role.id !== action.payload);
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteRoles.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteRoles.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.roles = state.roles.filter(
          (role) => !action.payload.includes(role.id)
        );
      })
      .addCase(deleteRoles.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { resetRoleStatus } = rolesSlice.actions;
export default rolesSlice.reducer;
