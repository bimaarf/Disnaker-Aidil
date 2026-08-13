import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const serviceCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // Cache 5 menit

// Setup axios interceptor untuk token
const setupAxiosInterceptor = () => {
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

setupAxiosInterceptor();

const isCacheValid = (cacheEntry) => {
  if (!cacheEntry) return false;
  const { timestamp } = cacheEntry;
  return Date.now() - timestamp < CACHE_DURATION;
};

const getCachedService = (key) => {
  const cacheEntry = serviceCache.get(key);
  if (isCacheValid(cacheEntry)) {
    return cacheEntry.data;
  }
  serviceCache.delete(key);
  return null;
};

const setCachedService = (key, data) => {
  serviceCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

// Create Service dengan Sub Items
export const createService = createAsyncThunk(
  "services/createService",
  async (serviceData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/services`,
        serviceData,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      // Clear cache setelah create
      serviceCache.delete("all_services");
      return response.data;
    } catch (err) {
      if (err.response?.status === 401) {
        return rejectWithValue("Unauthorized - Please login");
      }
      return rejectWithValue(
        err.response?.data?.message ||
          err.response?.data?.errors ||
          "Failed to create service"
      );
    }
  }
);

// Fetch All Services (Public)
export const fetchServices = createAsyncThunk(
  "services/fetchServices",
  async (_, { rejectWithValue }) => {
    const cacheKey = "all_services";
    const cachedData = getCachedService(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/services`,
        { headers: { Accept: "application/json" } }
      );
      const data = response.data;
      setCachedService(cacheKey, data);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch services"
      );
    }
  }
);

// Fetch Single Service (Public)
export const fetchService = createAsyncThunk(
  "services/fetchService",
  async (serviceId, { rejectWithValue }) => {
    const cachedData = getCachedService(`service_${serviceId}`);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/services/${serviceId}`,
        { headers: { Accept: "application/json" } }
      );
      const data = response.data;
      setCachedService(`service_${serviceId}`, data);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch service"
      );
    }
  }
);

// Update Service (Protected)
export const updateService = createAsyncThunk(
  "services/updateService",
  async ({ id, serviceData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API}api/services/${id}`,
        serviceData,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      // Clear cache setelah update
      serviceCache.delete("all_services");
      serviceCache.delete(`service_${id}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        return rejectWithValue("Unauthorized - Please login");
      }
      if (error.response?.status === 403) {
        return rejectWithValue("Forbidden - You don't have permission");
      }
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.errors ||
          "Failed to update service"
      );
    }
  }
);

// Delete Service (Protected)
export const deleteService = createAsyncThunk(
  "services/deleteService",
  async (serviceId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/services/${serviceId}`,
        { headers: { Accept: "application/json" } }
      );
      // Clear cache setelah delete
      serviceCache.delete("all_services");
      serviceCache.delete(`service_${serviceId}`);
      return serviceId;
    } catch (err) {
      if (err.response?.status === 401) {
        return rejectWithValue("Unauthorized - Please login");
      }
      if (err.response?.status === 403) {
        return rejectWithValue("Forbidden - You don't have permission");
      }
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete service"
      );
    }
  }
);

// Fetch Sub Items (Public)
export const fetchSubItems = createAsyncThunk(
  "services/fetchSubItems",
  async (serviceId, { rejectWithValue }) => {
    const cacheKey = `sub_items_${serviceId}`;
    const cachedData = getCachedService(cacheKey);
    if (cachedData) {
      return { serviceId, subItems: cachedData };
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/services/${serviceId}/sub-items`,
        { headers: { Accept: "application/json" } }
      );
      const data = response.data;
      setCachedService(cacheKey, data);
      return { serviceId, subItems: data };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch sub items"
      );
    }
  }
);

// Create Sub Item (Protected)
export const createSubItem = createAsyncThunk(
  "services/createSubItem",
  async ({ serviceId, subItemData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}api/services/${serviceId}/sub-items`,
        subItemData,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      // Clear cache
      serviceCache.delete("all_services");
      serviceCache.delete(`service_${serviceId}`);
      serviceCache.delete(`sub_items_${serviceId}`);
      return { serviceId, subItem: response.data };
    } catch (err) {
      if (err.response?.status === 401) {
        return rejectWithValue("Unauthorized - Please login");
      }
      if (err.response?.status === 403) {
        return rejectWithValue("Forbidden - You don't have permission");
      }
      return rejectWithValue(
        err.response?.data?.message ||
          err.response?.data?.errors ||
          "Failed to create sub item"
      );
    }
  }
);

// Update Sub Item (Protected)
export const updateSubItem = createAsyncThunk(
  "services/updateSubItem",
  async ({ serviceId, subItemId, subItemData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API}api/services/${serviceId}/sub-items/${subItemId}`,
        subItemData,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      // Clear cache
      serviceCache.delete("all_services");
      serviceCache.delete(`service_${serviceId}`);
      serviceCache.delete(`sub_items_${serviceId}`);
      return { serviceId, subItem: response.data };
    } catch (error) {
      if (error.response?.status === 401) {
        return rejectWithValue("Unauthorized - Please login");
      }
      if (error.response?.status === 403) {
        return rejectWithValue("Forbidden - You don't have permission");
      }
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.errors ||
          "Failed to update sub item"
      );
    }
  }
);

// Delete Sub Item (Protected)
export const deleteSubItem = createAsyncThunk(
  "services/deleteSubItem",
  async ({ serviceId, subItemId }, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}api/services/${serviceId}/sub-items/${subItemId}`,
        { headers: { Accept: "application/json" } }
      );
      // Clear cache
      serviceCache.delete("all_services");
      serviceCache.delete(`service_${serviceId}`);
      serviceCache.delete(`sub_items_${serviceId}`);
      return { serviceId, subItemId };
    } catch (err) {
      if (err.response?.status === 401) {
        return rejectWithValue("Unauthorized - Please login");
      }
      if (err.response?.status === 403) {
        return rejectWithValue("Forbidden - You don't have permission");
      }
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete sub item"
      );
    }
  }
);

const serviceSlice = createSlice({
  name: "services",
  initialState: {
    services: [],
    status: "idle",
    error: null,
    service: null,
  },
  reducers: {
    resetServiceStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
    updateSingleService(state, action) {
      const updatedService = action.payload;
      const index = state.services.findIndex(
        (service) => service.id === updatedService.id
      );
      if (index !== -1) {
        state.services[index] = updatedService;
      }
    },
    clearServiceCache: () => {
      serviceCache.clear();
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Service
      .addCase(createService.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.services.unshift(action.payload);
      })
      .addCase(createService.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Fetch Services
      .addCase(fetchServices.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.services = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Fetch Service
      .addCase(fetchService.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchService.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.service = action.payload;
      })
      .addCase(fetchService.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Update Service
      .addCase(updateService.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateService.fulfilled, (state, action) => {
        state.status = "succeeded";
        const updatedService = action.payload;
        const index = state.services.findIndex(
          (service) => service.id === updatedService.id
        );
        if (index !== -1) {
          state.services[index] = updatedService;
        }
        if (state.service && state.service.id === updatedService.id) {
          state.service = updatedService;
        }
      })
      .addCase(updateService.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Delete Service
      .addCase(deleteService.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.status = "succeeded";
        const deletedId = action.payload;
        state.services = state.services.filter(
          (service) => service.id !== deletedId
        );
        serviceCache.delete(deletedId);
      })
      .addCase(deleteService.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Fetch Sub Items
      .addCase(fetchSubItems.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSubItems.fulfilled, (state, action) => {
        state.status = "succeeded";
        const { serviceId, subItems } = action.payload;
        const service = state.services.find((s) => s.id === serviceId);
        if (service) {
          service.sub_items = subItems;
        }
        if (state.service && state.service.id === serviceId) {
          state.service.sub_items = subItems;
        }
      })
      .addCase(fetchSubItems.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Create Sub Item
      .addCase(createSubItem.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createSubItem.fulfilled, (state, action) => {
        state.status = "succeeded";
        const { serviceId, subItem } = action.payload;
        const service = state.services.find((s) => s.id === serviceId);
        if (service) {
          if (!service.sub_items) service.sub_items = [];
          service.sub_items.push(subItem);
        }
        if (state.service && state.service.id === serviceId) {
          if (!state.service.sub_items) state.service.sub_items = [];
          state.service.sub_items.push(subItem);
        }
      })
      .addCase(createSubItem.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Update Sub Item
      .addCase(updateSubItem.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateSubItem.fulfilled, (state, action) => {
        state.status = "succeeded";
        const { serviceId, subItem } = action.payload;
        const service = state.services.find((s) => s.id === serviceId);
        if (service && service.sub_items) {
          const index = service.sub_items.findIndex(
            (si) => si.id === subItem.id
          );
          if (index !== -1) service.sub_items[index] = subItem;
        }
        if (
          state.service &&
          state.service.id === serviceId &&
          state.service.sub_items
        ) {
          const index = state.service.sub_items.findIndex(
            (si) => si.id === subItem.id
          );
          if (index !== -1) state.service.sub_items[index] = subItem;
        }
      })
      .addCase(updateSubItem.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Delete Sub Item
      .addCase(deleteSubItem.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(deleteSubItem.fulfilled, (state, action) => {
        state.status = "succeeded";
        const { serviceId, subItemId } = action.payload;
        const service = state.services.find((s) => s.id === serviceId);
        if (service && service.sub_items) {
          service.sub_items = service.sub_items.filter(
            (si) => si.id !== subItemId
          );
        }
        if (
          state.service &&
          state.service.id === serviceId &&
          state.service.sub_items
        ) {
          state.service.sub_items = state.service.sub_items.filter(
            (si) => si.id !== subItemId
          );
        }
      })
      .addCase(deleteSubItem.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { resetServiceStatus, updateSingleService, clearServiceCache } =
  serviceSlice.actions;

export default serviceSlice.reducer;
