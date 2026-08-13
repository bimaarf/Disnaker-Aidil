import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { logout } from "../authentication/AuthSlice";

// Fetch struktur organisasi
export const fetchOrganizations = createAsyncThunk(
  "organizations/fetchOrganizations",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/organization-structures`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch organizations"
      );
    }
  }
);

// Create jabatan baru
export const createOrganization = createAsyncThunk(
  "organizations/createOrganization",
  async (organizationData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/organization-structures`,
        organizationData,
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.errors || "Failed to create organization"
      );
    }
  }
);

// Update jabatan
export const updateOrganization = createAsyncThunk(
  "organizations/updateOrganization",
  async ({ id, organizationData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API}api/organization-structures/${id}`,
        organizationData,
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update organization"
      );
    }
  }
);

// Delete jabatan
export const deleteOrganization = createAsyncThunk(
  "organizations/deleteOrganization",
  async (organizationId, { rejectWithValue, dispatch }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/organization-structures/${organizationId}`
      );
      return organizationId;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        dispatch(logout());
      }
      return rejectWithValue(
        err.response?.data || "Failed to delete organization"
      );
    }
  }
);

// Helper function untuk menambahkan item ke tree
const addToTree = (organizations, newOrg) => {
  if (!newOrg.parent_id) {
    // Root level - tambah langsung
    return [...organizations, { ...newOrg, children: [] }];
  }

  // Recursive function untuk mencari dan menambah ke parent
  const addToParent = (items) => {
    return items.map((item) => {
      if (item.id === newOrg.parent_id) {
        return {
          ...item,
          children: [...(item.children || []), { ...newOrg, children: [] }],
        };
      }
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: addToParent(item.children),
        };
      }
      return item;
    });
  };

  return addToParent(organizations);
};

// Helper function untuk update item di tree
const updateInTree = (organizations, updatedOrg) => {
  const updateItem = (items) => {
    return items.map((item) => {
      if (item.id === updatedOrg.id) {
        return { ...item, ...updatedOrg };
      }
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: updateItem(item.children),
        };
      }
      return item;
    });
  };

  return updateItem(organizations);
};

// Helper function untuk remove item dari tree dan pindahkan children ke parent atas
const removeFromTree = (organizations, removedId) => {
  const removeItem = (items, parentId = null) => {
    const result = [];

    items.forEach((item) => {
      if (item.id === removedId) {
        // Pindahkan children ke parent atas (sesuai logika backend)
        if (item.children && item.children.length > 0) {
          const movedChildren = item.children.map((child) => ({
            ...child,
            parent_id: parentId,
            level: parentId
              ? (organizations.find((p) => p.id === parentId)?.level || 0) + 1
              : 0,
          }));
          result.push(...movedChildren);
        }
      } else {
        const updatedItem = {
          ...item,
          children: item.children ? removeItem(item.children, item.id) : [],
        };
        result.push(updatedItem);
      }
    });

    return result;
  };

  return removeItem(organizations);
};

const organizationsSlice = createSlice({
  name: "organizations",
  initialState: {
    organizations: [],
    status: "idle",
    error: null,
  },
  reducers: {
    resetOrganizationStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    clearOrganizations: (state) => {
      state.organizations = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch organizations
      .addCase(fetchOrganizations.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchOrganizations.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.organizations = action.payload;
      })
      .addCase(fetchOrganizations.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Create organization
      .addCase(createOrganization.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createOrganization.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.organizations = addToTree(state.organizations, action.payload);
      })
      .addCase(createOrganization.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Update organization
      .addCase(updateOrganization.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateOrganization.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.organizations = updateInTree(state.organizations, action.payload);
      })
      .addCase(updateOrganization.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Delete organization
      .addCase(deleteOrganization.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteOrganization.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.organizations = removeFromTree(
          state.organizations,
          action.payload
        );
      })
      .addCase(deleteOrganization.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { resetOrganizationStatus, clearOrganizations } =
  organizationsSlice.actions;

export default organizationsSlice.reducer;
