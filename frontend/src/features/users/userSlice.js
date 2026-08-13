import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Create a new user
export const createUser = createAsyncThunk(
  "users/createUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/users`,
        userData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.user;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create user"
      );
    }
  }
);

export const fetchAllUsers = createAsyncThunk(
  "users/fetchAllUsers",
  async (
    { search = "", sortKey = "created_at", sortDirection = "desc" },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/users/all`,
        { params: { search, sortKey, sortDirection } }
      );
      return {
        users: response.data.data,
        total: response.data.total,
        totalActive: response.data.total_active,
        totalSuspend: response.data.total_suspend,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch all users"
      );
    }
  }
);
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (
    {
      page = 1,
      perPage = 10,
      search = "",
      sortKey = "created_at",
      sortDirection = "desc",
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/users`,
        {
          params: { page, perPage, search, sortKey, sortDirection },
        }
      );
      return {
        users: response.data.data,
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        total: response.data.total,
        totalActive: response.data.total_active,
        totalSuspend: response.data.total_suspend,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch users");
    }
  }
);

export const fetchUser = createAsyncThunk(
  "users/fetchUser",
  async (userEmail, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/users/${userEmail}`
      );
      return response.data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch user");
    }
  }
);

export const updatePassword = createAsyncThunk(
  "users/updatePassword",
  async ({ id, userData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/users/update-password/${id}`,
        userData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update user");
    }
  }
);

// Update an existing user
export const updateUser = createAsyncThunk(
  "users/updateUser",
  async ({ id, userData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/users/${id}`,
        userData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update user");
    }
  }
);

export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API}api/users/${userId}`);
      return userId;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete user");
    }
  }
);

export const deleteUsers = createAsyncThunk(
  "users/deleteUsers",
  async (userIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        userIds.map((id) =>
          axios.delete(`${process.env.REACT_APP_API}api/users/${id}`)
        )
      );
      return userIds;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to delete users");
    }
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState: {
    allUsers: [],
    users: [],
    status: "idle",
    allUsersStatus: "idle",
    error: null,
    page: 1,
    perPage: 10,
    totalPages: 1,
    total: null,
    totalActive: null,
    totalSuspend: null,
    user: null,
    userDetails: {}, // { [email]: { data, status, error } }
  },
  reducers: {
    resetUsers: (state) => {
      state.users = [];
      state.allUsers = [];
      state.allUsersStatus = "idle";
      state.page = 1;
      state.totalPages = 1;
      state.total = 0;
      state.status = "idle";
    },
    resetUserStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    setPage(state, action) {
      state.page = action.payload;
    },
    updateSingleUser(state, action) {
      const updatedUser = action.payload;
      const index = state.users.findIndex((user) => user.id === updatedUser.id);
      if (index !== -1) {
        state.users[index] = updatedUser;
      }
      const allIndex = state.allUsers.findIndex(
        (user) => user.id === updatedUser.id
      );
      if (allIndex !== -1) {
        state.allUsers[allIndex] = updatedUser;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.users.unshift(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchAllUsers.pending, (state) => {
        state.allUsersStatus = "loading";
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.allUsersStatus = "succeeded";
        state.allUsers = action.payload.users;
        state.total = action.payload.total;
        state.totalActive = action.payload.totalActive;
        state.totalSuspend = action.payload.totalSuspend;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.allUsersStatus = "failed";
        state.error = action.payload;
      })
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.users =
          action.payload.currentPage === 1
            ? action.payload.users
            : [...state.users, ...action.payload.users];

        state.page = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalActive = action.payload.totalActive;
        state.totalSuspend = action.payload.totalSuspend;
        state.total = action.payload.total;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Fetch User
      .addCase(fetchUser.pending, (state, action) => {
        const email = action.meta.arg;
        state.userDetails[email] = {
          ...(state.userDetails[email] || {}),
          status: "loading",
          error: null,
        };
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        const email = action.meta.arg;
        state.userDetails[email] = {
          data: action.payload,
          status: "succeeded",
          error: null,
        };
      })
      .addCase(fetchUser.rejected, (state, action) => {
        const email = action.meta.arg;
        state.userDetails[email] = {
          ...(state.userDetails[email] || {}),
          status: "failed",
          error: action.payload,
        };
      })
      // Update Password
      .addCase(updatePassword.pending, (state, action) => {
        const email = action.meta.arg;
        state.userDetails[email] = {
          ...(state.userDetails[email] || {}),
          status: "loading",
          error: action.payload,
        };
      })
      .addCase(updatePassword.fulfilled, (state, action) => {
        state.message = action.payload;
        state.error = null;

        const updatedUser = action.payload;
        const index = state.users.findIndex(
          (user) => user.id === updatedUser.id
        );
        if (index !== -1) {
          state.users[index] = updatedUser;
        }
        if (state.user && state.user.id === updatedUser.id) {
          state.user = updatedUser;
        }
        if (updatedUser.email) {
          state.userDetails[updatedUser.email] = {
            data: updatedUser,
            status: "succeeded",
            error: null,
          };
        }
      })
      .addCase(updatePassword.rejected, (state, action) => {
        const email = action.meta.arg;
        state.userDetails[email] = {
          ...(state.userDetails[email] || {}),
          status: "failed",
          error: action.payload,
        };
      })
      // Update User
      .addCase(updateUser.pending, (state, action) => {
        const email = action.meta.arg;
        state.userDetails[email] = {
          ...(state.userDetails[email] || {}),
          status: "loading",
          error: action.payload,
        };
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const updatedUser = action.payload;

        // update di daftar
        const index = state.users.findIndex((u) => u.id === updatedUser.id);
        if (index !== -1) state.users[index] = updatedUser;

        const allIndex = state.allUsers.findIndex(
          (u) => u.id === updatedUser.id
        );
        if (allIndex !== -1) state.allUsers[allIndex] = updatedUser;

        // update detail per user
        if (updatedUser.email) {
          state.userDetails[updatedUser.email] = {
            data: updatedUser,
            status: "succeeded",
            error: null,
          };
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        const email = action.meta.arg;
        state.userDetails[email] = {
          ...(state.userDetails[email] || {}),
          status: "failed",
          error: action.payload,
        };
      })
      // Delete User
      .addCase(deleteUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.users = state.users.filter((user) => user.id !== action.payload);
        state.allUsers = state.allUsers.filter(
          (user) => user.id !== action.payload
        );
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Delete Users
      .addCase(deleteUsers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteUsers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.users = state.users.filter(
          (user) => !action.payload.includes(user.id)
        );
        state.allUsers = state.allUsers.filter(
          (user) => !action.payload.includes(user.id)
        );
      })
      .addCase(deleteUsers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});
export const selectUserDetail = (state, email) =>
  state.users.userDetails[email] || { data: null, status: "idle", error: null };

export const { resetUserStatus, setPage, updateSingleUser, resetUsers } =
  usersSlice.actions;
export default usersSlice.reducer;
