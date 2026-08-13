import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API;

// Cache configuration
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_CACHE_SIZE = 10; // Maximum number of classrooms to cache

// Helper function to check if cache is expired
const isCacheExpired = (timestamp) => {
  if (!timestamp) return true;
  return Date.now() - new Date(timestamp).getTime() > CACHE_EXPIRY_TIME;
};

// Helper function to generate cache key
const generateCacheKey = (classroomCode, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {});
  return `${classroomCode}_${JSON.stringify(sortedParams)}`;
};

// Helper function to clean old cache entries
const cleanOldCacheEntries = (state) => {
  const cacheKeys = Object.keys(state.cache);
  if (cacheKeys.length > MAX_CACHE_SIZE) {
    const sortedEntries = cacheKeys
      .map((key) => ({
        key,
        lastAccessed: state.cache[key].lastAccessed || 0,
      }))
      .sort((a, b) => a.lastAccessed - b.lastAccessed);

    const entriesToRemove = sortedEntries.slice(
      0,
      cacheKeys.length - MAX_CACHE_SIZE
    );
    entriesToRemove.forEach((entry) => {
      delete state.cache[entry.key];
    });
  }
};

// Async Thunks
export const fetchMaterials = createAsyncThunk(
  "material/fetchMaterials",
  async (
    { classroomCode, params = {}, signal, forceRefresh = false },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState();
      const cacheKey = generateCacheKey(classroomCode, params);
      const cachedData = state.material.cache[cacheKey];

      // Check cache first (unless force refresh)
      if (
        !forceRefresh &&
        cachedData &&
        !isCacheExpired(cachedData.timestamp)
      ) {
        return {
          data: cachedData.data,
          classroomCode,
          params,
          fromCache: true,
          cacheKey,
        };
      }

      await axios.get("sanctum/csrf-cookie", { signal });
      const queryParams = new URLSearchParams({
        sort_by: params.sort_by || "created_at",
        sort_order: params.sort_order || "desc",
        ...params,
      });

      const response = await axios.get(
        `${API_BASE_URL}api/classrooms/${classroomCode}/materials?${queryParams.toString()}`,
        { signal }
      );

      return {
        data: response.data.data,
        classroomCode,
        params,
        fromCache: false,
        cacheKey,
      };
    } catch (error) {
      if (error.name === "AbortError" || error.code === "ECONNABORTED") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message: error.response?.data?.message,
        status: error.response?.status,
      });
    }
  }
);

export const createMaterial = createAsyncThunk(
  "material/createMaterial",
  async ({ classroomCode, materialData }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");

      const formData = new FormData();

      // Handle multiple files properly
      Object.entries(materialData).forEach(([key, value]) => {
        if (key === "files" && value) {
          if (Array.isArray(value)) {
            value.forEach((file, index) => {
              if (file instanceof File) {
                formData.append(`files[${index}]`, file);
              }
            });
          } else if (value instanceof FileList) {
            Array.from(value).forEach((file, index) => {
              formData.append(`files[${index}]`, file);
            });
          } else if (value instanceof File) {
            formData.append("files[0]", value);
          }
        } else if (key === "links" && value) {
          if (Array.isArray(value)) {
            value.forEach((link, index) => {
              if (link && link.trim()) {
                formData.append(`links[${index}]`, link.trim());
              }
            });
          } else if (typeof value === "string" && value.trim()) {
            formData.append("links[0]", value.trim());
          }
        } else if (value !== null && value !== undefined && value !== "") {
          formData.append(key, value);
        }
      });

      const response = await axios.post(
        `${API_BASE_URL}api/classrooms/${classroomCode}/materials`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return {
        data: response.data.data,
        classroomCode,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message: error.response?.data?.message || "Gagal menambahkan materi",
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
    }
  }
);

export const updateMaterial = createAsyncThunk(
  "material/updateMaterial",
  async ({ classroomCode, materialId, materialData }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");

      const formData = new FormData();
      formData.append("_method", "PUT");

      // Handle multiple files properly for updates
      Object.entries(materialData).forEach(([key, value]) => {
        if (key === "files" && value) {
          if (Array.isArray(value)) {
            value.forEach((file, index) => {
              if (file instanceof File) {
                formData.append(`files[${index}]`, file);
              }
            });
          } else if (value instanceof FileList) {
            Array.from(value).forEach((file, index) => {
              formData.append(`files[${index}]`, file);
            });
          } else if (value instanceof File) {
            formData.append("files[0]", value);
          }
        } else if (key === "links" && value) {
          if (Array.isArray(value)) {
            value.forEach((link, index) => {
              if (link && link.trim()) {
                formData.append(`links[${index}]`, link.trim());
              }
            });
          } else if (typeof value === "string" && value.trim()) {
            formData.append("links[0]", value.trim());
          }
        } else if (key === "remove_file_ids" && value) {
          if (Array.isArray(value)) {
            value.forEach((id, index) => {
              formData.append(`remove_file_ids[${index}]`, id);
            });
          }
        } else if (value !== null && value !== undefined && value !== "") {
          formData.append(key, value);
        }
      });

      const response = await axios.post(
        `${API_BASE_URL}api/classrooms/${classroomCode}/materials/${materialId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return {
        data: response.data.data,
        classroomCode,
        materialId,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message: error.response?.data?.message || "Gagal mengupdate materi",
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
    }
  }
);

export const deleteMaterial = createAsyncThunk(
  "material/deleteMaterial",
  async ({ classroomCode, materialId }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");

      await axios.delete(
        `${API_BASE_URL}api/classrooms/${classroomCode}/materials/${materialId}`
      );

      return { classroomCode, materialId };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message: error.response?.data?.message || "Gagal menghapus materi",
        status: error.response?.status,
      });
    }
  }
);

export const downloadMaterial = createAsyncThunk(
  "material/downloadMaterial",
  async ({ classroomCode, fileId, downloadUrl }, { rejectWithValue }) => {
    try {
      // If downloadUrl is provided (from hashed URLs), use it directly
      if (downloadUrl) {
        const response = await axios.get(downloadUrl, {
          responseType: "blob",
          headers: {
            Accept: "*/*",
          },
        });

        // Try to get filename from Content-Disposition header
        const contentDisposition = response.headers["content-disposition"];
        let fileName = "download";

        if (contentDisposition) {
          const patterns = [
            /filename\*=UTF-8''(.+)/i,
            /filename="([^"]+)"/i,
            /filename=([^;]+)/i,
          ];

          for (const pattern of patterns) {
            const match = contentDisposition.match(pattern);
            if (match) {
              fileName = decodeURIComponent(match[1].trim());
              break;
            }
          }
        }

        const blob = new Blob([response.data], {
          type: response.headers["content-type"] || "application/octet-stream",
        });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;

        // Trigger download
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);

        return { classroomCode, fileId, fileName };
      }

      // Fallback to old API endpoint if no downloadUrl provided
      await axios.get("sanctum/csrf-cookie");

      const response = await axios.get(
        `${API_BASE_URL}api/classrooms/${classroomCode}/materials/${fileId}/download`,
        {
          responseType: "blob",
          headers: {
            Accept: "*/*",
          },
        }
      );

      const contentDisposition = response.headers["content-disposition"];
      let fileName = "download";

      if (contentDisposition) {
        const patterns = [
          /filename\*=UTF-8''(.+)/i,
          /filename="([^"]+)"/i,
          /filename=([^;]+)/i,
        ];

        for (const pattern of patterns) {
          const match = contentDisposition.match(pattern);
          if (match) {
            fileName = decodeURIComponent(match[1].trim());
            break;
          }
        }
      }

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);

      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      return { classroomCode, fileId, fileName };
    } catch (error) {
      console.error("Download error:", error);

      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }

      return rejectWithValue({
        message:
          error.response?.data?.message ||
          error.message ||
          "Gagal mengunduh file",
        status: error.response?.status,
      });
    }
  }
);

export const incrementMaterialView = createAsyncThunk(
  "material/incrementView",
  async ({ classroomCode, fileId }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");

      const response = await axios.post(
        `${API_BASE_URL}api/classrooms/${classroomCode}/materials/files/${fileId}/view`
      );

      return {
        data: response.data.data,
        classroomCode,
        fileId,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message: error.response?.data?.message || "Gagal update view count",
        status: error.response?.status,
      });
    }
  }
);

export const viewExternalLink = createAsyncThunk(
  "material/viewExternalLink",
  async ({ classroomCode, fileId }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");

      const response = await axios.get(
        `${API_BASE_URL}api/classrooms/${classroomCode}/materials/files/${fileId}/view-or-link`,
        {
          maxRedirects: 0,
          validateStatus: (status) => status < 400 || status === 302,
        }
      );

      if (response.status === 302) {
        const redirectUrl = response.headers.location;
        window.open(redirectUrl, "_blank", "noopener,noreferrer");
      }

      return { classroomCode, fileId };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message: error.response?.data?.message || "Gagal mengakses link",
        status: error.response?.status,
      });
    }
  }
);

export const getMaterialStatistics = createAsyncThunk(
  "material/getStatistics",
  async ({ classroomCode }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");

      const response = await axios.get(
        `${API_BASE_URL}api/classrooms/${classroomCode}/materials/statistics`
      );

      return {
        data: response.data.data,
        classroomCode,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message: error.response?.data?.message || "Gagal mengambil statistik",
        status: error.response?.status,
      });
    }
  }
);

// Initial state
const initialState = {
  materials: {},
  pagination: {},
  cache: {},
  statistics: {},
  currentClassroomCode: null,
  currentMaterial: null,
  status: "idle",
  createStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  downloadStatus: "idle",
  statisticsStatus: "idle",
  error: null,
  validationErrors: null,
  lastUpdated: {},
  cacheStats: {
    hits: 0,
    misses: 0,
    totalRequests: 0,
  },
};

// Enhanced Material slice with smart cache synchronization
const materialSlice = createSlice({
  name: "material",
  initialState,
  reducers: {
    resetMaterialState: () => initialState,

    cleanSpecificCacheEntries: (state, action) => {
      const keysToRemove = action.payload;
      keysToRemove.forEach((key) => {
        delete state.cache[key];
      });
    },

    // CRITICAL: Smart cache update function that updates ALL cache entries
    updateMaterialInAllCaches: (state, action) => {
      const { classroomCode, materialId, updatedMaterial, operation } =
        action.payload;
      const currentTime = Date.now();
      const timestamp = new Date().toISOString();

      // Update in main materials list
      if (operation === "create") {
        // Add to materials list
        if (!state.materials[classroomCode]) {
          state.materials[classroomCode] = [];
        }
        // Add at the beginning for newest first
        state.materials[classroomCode].unshift(updatedMaterial);

        // Update pagination total
        if (state.pagination[classroomCode]) {
          state.pagination[classroomCode].total += 1;
        }
      } else if (operation === "update") {
        // Update existing material
        if (state.materials[classroomCode]) {
          const index = state.materials[classroomCode].findIndex(
            (m) => String(m.id) === String(materialId)
          );
          if (index !== -1) {
            state.materials[classroomCode][index] = updatedMaterial;
          }
        }
      } else if (operation === "delete") {
        // Remove from materials list
        if (state.materials[classroomCode]) {
          state.materials[classroomCode] = state.materials[
            classroomCode
          ].filter((m) => String(m.id) !== String(materialId));
        }

        // Update pagination total
        if (state.pagination[classroomCode]) {
          state.pagination[classroomCode].total = Math.max(
            0,
            state.pagination[classroomCode].total - 1
          );
        }
      }

      // Update ALL cache entries for this classroom
      Object.keys(state.cache).forEach((cacheKey) => {
        if (cacheKey.startsWith(`${classroomCode}_`)) {
          const cacheEntry = state.cache[cacheKey];

          if (cacheEntry?.data?.materials) {
            if (operation === "create") {
              // Add to cache
              cacheEntry.data.materials.unshift(updatedMaterial);

              // Update pagination in cache
              if (cacheEntry.data.pagination) {
                cacheEntry.data.pagination.total += 1;
              }
            } else if (operation === "update") {
              // Update in cache
              const materialIndex = cacheEntry.data.materials.findIndex(
                (m) => String(m.id) === String(materialId)
              );
              if (materialIndex !== -1) {
                cacheEntry.data.materials[materialIndex] = updatedMaterial;
              }
            } else if (operation === "delete") {
              // Remove from cache
              cacheEntry.data.materials = cacheEntry.data.materials.filter(
                (m) => String(m.id) !== String(materialId)
              );

              // Update pagination in cache
              if (cacheEntry.data.pagination) {
                cacheEntry.data.pagination.total = Math.max(
                  0,
                  cacheEntry.data.pagination.total - 1
                );
              }
            }

            // Update cache metadata
            cacheEntry.timestamp = timestamp;
            cacheEntry.lastAccessed = currentTime;
            cacheEntry.lastModified = currentTime;
          }
        }
      });

      // Update current material if it matches
      if (state.currentMaterial?.id === materialId) {
        if (operation === "delete") {
          state.currentMaterial = null;
        } else {
          state.currentMaterial = updatedMaterial;
        }
      }

      state.lastUpdated[classroomCode] = timestamp;
    },

    syncMaterialAcrossCache: (state, action) => {
      const {
        classroomCode,
        materialId,
        updatedMaterial,
        source = "update",
      } = action.payload;

      const currentTime = Date.now();
      const timestamp = new Date().toISOString();

      let updatedCacheCount = 0;

      // Cari semua cache entry yang mengandung material ini
      Object.keys(state.cache).forEach((cacheKey) => {
        if (cacheKey.startsWith(`${classroomCode}_`)) {
          const cacheEntry = state.cache[cacheKey];

          if (cacheEntry?.data?.materials) {
            const materialIndex = cacheEntry.data.materials.findIndex(
              (m) => String(m.id) === String(materialId)
            );

            if (materialIndex !== -1) {
              cacheEntry.data.materials[materialIndex] = updatedMaterial;
              cacheEntry.timestamp = timestamp;
              cacheEntry.lastAccessed = currentTime;
              cacheEntry.lastModified = currentTime;
              cacheEntry.syncSource = source;
              updatedCacheCount++;
            }
          }
        }
      });

      // Update daftar materials utama
      if (state.materials[classroomCode]) {
        const index = state.materials[classroomCode].findIndex(
          (m) => String(m.id) === String(materialId)
        );
        if (index !== -1) {
          state.materials[classroomCode][index] = updatedMaterial;
        }
      }

      // Update current material jika cocok
      if (state.currentMaterial?.id === materialId) {
        state.currentMaterial = updatedMaterial;
      }

      // Simpan timestamp terakhir update
      state.lastUpdated[classroomCode] = timestamp;

      // Simpan jumlah cache yang diperbarui (opsional, bisa dipakai untuk debug atau monitoring)
      state.updatedCacheCount = updatedCacheCount;

      // Logging (opsional, bisa dihapus di production)
      if (process.env.NODE_ENV === "development") {
        console.log(
          `✅ syncMaterialAcrossCache: ${updatedCacheCount} cache entry diperbarui untuk material ${materialId}`
        );
      }
    },

    resetMaterialStatus: (state) => {
      state.status = "idle";
      state.createStatus = "idle";
      state.updateStatus = "idle";
      state.deleteStatus = "idle";
      state.downloadStatus = "idle";
      state.statisticsStatus = "idle";
      state.error = null;
      state.validationErrors = null;
    },

    clearMaterialErrors: (state) => {
      state.error = null;
      state.validationErrors = null;
    },

    setCurrentClassroom: (state, action) => {
      state.currentClassroomCode = action.payload;
    },

    setCurrentMaterial: (state, action) => {
      state.currentMaterial = action.payload;
    },

    clearCache: (state, action) => {
      if (action.payload) {
        // Clear cache for specific classroom
        const classroomCode = action.payload;
        Object.keys(state.cache).forEach((key) => {
          if (key.startsWith(`${classroomCode}_`)) {
            delete state.cache[key];
          }
        });
      } else {
        // Clear all cache
        state.cache = {};
        state.cacheStats = {
          hits: 0,
          misses: 0,
          totalRequests: 0,
        };
      }
    },

    clearExpiredCache: (state) => {
      Object.keys(state.cache).forEach((key) => {
        if (isCacheExpired(state.cache[key].timestamp)) {
          delete state.cache[key];
        }
      });
    },

    updateMaterialOptimistic: (state, action) => {
      const { classroomCode, materialId, updates } = action.payload;

      // Update in materials list
      if (state.materials[classroomCode]) {
        const index = state.materials[classroomCode].findIndex(
          (m) => m.id === materialId
        );
        if (index !== -1) {
          state.materials[classroomCode][index] = {
            ...state.materials[classroomCode][index],
            ...updates,
          };
        }
      }

      // Update in cache
      Object.keys(state.cache).forEach((key) => {
        if (key.startsWith(`${classroomCode}_`)) {
          const cachedMaterials = state.cache[key].data.materials || [];
          const index = cachedMaterials.findIndex((m) => m.id === materialId);
          if (index !== -1) {
            cachedMaterials[index] = {
              ...cachedMaterials[index],
              ...updates,
            };
          }
        }
      });

      // Update current material if it matches
      if (state.currentMaterial?.id === materialId) {
        state.currentMaterial = {
          ...state.currentMaterial,
          ...updates,
        };
      }
    },

    removeMaterialOptimistic: (state, action) => {
      const { classroomCode, materialId } = action.payload;

      // Remove from materials list
      if (state.materials[classroomCode]) {
        state.materials[classroomCode] = state.materials[classroomCode].filter(
          (m) => m.id !== materialId
        );
      }

      // Remove from cache
      Object.keys(state.cache).forEach((key) => {
        if (key.startsWith(`${classroomCode}_`)) {
          const cachedMaterials = state.cache[key].data.materials || [];
          state.cache[key].data.materials = cachedMaterials.filter(
            (m) => m.id !== materialId
          );

          // Update pagination count
          if (state.cache[key].data.pagination) {
            state.cache[key].data.pagination.total = Math.max(
              0,
              state.cache[key].data.pagination.total - 1
            );
          }
        }
      });

      // Update pagination
      if (state.pagination[classroomCode]) {
        state.pagination[classroomCode].total = Math.max(
          0,
          state.pagination[classroomCode].total - 1
        );
      }

      // Clear current material if it matches
      if (state.currentMaterial?.id === materialId) {
        state.currentMaterial = null;
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch Materials
      .addCase(fetchMaterials.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.cacheStats.totalRequests += 1;
      })
      .addCase(fetchMaterials.fulfilled, (state, action) => {
        const { data, classroomCode, fromCache, cacheKey } = action.payload;

        if (data && !action.meta.aborted) {
          state.status = "succeeded";

          // Update cache statistics
          if (fromCache) {
            state.cacheStats.hits += 1;

            // Update last accessed time for cache entry
            if (state.cache[cacheKey]) {
              state.cache[cacheKey].lastAccessed = Date.now();
            }
          } else {
            state.cacheStats.misses += 1;

            // Clean old cache entries if needed
            cleanOldCacheEntries(state);

            // Store in cache
            state.cache[cacheKey] = {
              data,
              timestamp: new Date().toISOString(),
              lastAccessed: Date.now(),
              classroomCode,
            };
          }

          // Update main state
          state.materials[classroomCode] = data.materials || [];
          state.pagination[classroomCode] = data.pagination || {};
          state.lastUpdated[classroomCode] = new Date().toISOString();
          state.currentClassroomCode = classroomCode;
        }
      })
      .addCase(fetchMaterials.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.status = "failed";
          state.error = action.payload?.message;
        }
      })

      // Create Material - Now with smart cache update
      .addCase(createMaterial.pending, (state) => {
        state.createStatus = "loading";
        state.error = null;
        state.validationErrors = null;
      })
      .addCase(createMaterial.fulfilled, (state, action) => {
        const { data, classroomCode } = action.payload;

        if (data && !action.meta.aborted) {
          state.createStatus = "succeeded";

          // Use the smart cache update function
          materialSlice.caseReducers.updateMaterialInAllCaches(state, {
            payload: {
              classroomCode,
              materialId: data.id,
              updatedMaterial: data,
              operation: "create",
            },
          });
        }
      })
      .addCase(createMaterial.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.createStatus = "failed";
          state.error = action.payload?.message || "Gagal menambahkan materi";
          state.validationErrors = action.payload?.errors;
        }
      })

      // Update Material - Now with smart cache update
      .addCase(updateMaterial.pending, (state) => {
        state.updateStatus = "loading";
        state.error = null;
        state.validationErrors = null;
      })
      .addCase(updateMaterial.fulfilled, (state, action) => {
        const { data, classroomCode, materialId } = action.payload;

        if (data && !action.meta.aborted) {
          state.updateStatus = "succeeded";

          // Use the smart cache update function
          materialSlice.caseReducers.updateMaterialInAllCaches(state, {
            payload: {
              classroomCode,
              materialId,
              updatedMaterial: data,
              operation: "update",
            },
          });
        }
      })
      .addCase(updateMaterial.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.updateStatus = "failed";
          state.error = action.payload?.message || "Gagal mengupdate materi";
          state.validationErrors = action.payload?.errors;
        }
      })

      // Delete Material - Now with smart cache update
      .addCase(deleteMaterial.pending, (state) => {
        state.deleteStatus = "loading";
        state.error = null;
      })
      .addCase(deleteMaterial.fulfilled, (state, action) => {
        const { classroomCode, materialId } = action.payload;

        if (!action.meta.aborted) {
          state.deleteStatus = "succeeded";

          // Use the smart cache update function
          materialSlice.caseReducers.updateMaterialInAllCaches(state, {
            payload: {
              classroomCode,
              materialId,
              operation: "delete",
            },
          });
        }
      })
      .addCase(deleteMaterial.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.deleteStatus = "failed";
          state.error = action.payload?.message || "Gagal menghapus materi";
        }
      })

      // Download Material
      .addCase(downloadMaterial.pending, (state) => {
        state.downloadStatus = "loading";
      })
      .addCase(downloadMaterial.fulfilled, (state, action) => {
        const { classroomCode, fileId } = action.payload;

        if (!action.meta.aborted) {
          state.downloadStatus = "succeeded";

          // Update download count for the specific file
          const updateFileInMaterial = (material) => {
            if (material?.files) {
              const file = material.files.find(
                (f) => String(f.id) === String(fileId)
              );
              if (file) {
                file.download_count = (file.download_count || 0) + 1;
              }
            }
          };

          // Update in materials list
          if (state.materials[classroomCode]) {
            state.materials[classroomCode].forEach(updateFileInMaterial);
          }

          // Update in cache
          Object.keys(state.cache).forEach((key) => {
            if (key.startsWith(`${classroomCode}_`)) {
              const cachedMaterials = state.cache[key].data.materials || [];
              cachedMaterials.forEach(updateFileInMaterial);
            }
          });

          // Update current material
          if (state.currentMaterial) {
            updateFileInMaterial(state.currentMaterial);
          }
        }
      })
      .addCase(downloadMaterial.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.downloadStatus = "failed";
          state.error = action.payload?.message || "Gagal mengunduh file";
        }
      })

      // Increment View
      .addCase(incrementMaterialView.fulfilled, (state, action) => {
        const { data, classroomCode, fileId } = action.payload;

        if (data && !action.meta.aborted) {
          // Update view count for the specific file
          const updateFileInMaterial = (material) => {
            if (material?.files) {
              const file = material.files.find(
                (f) => String(f.id) === String(fileId)
              );
              if (file && data.view_count) {
                file.view_count = data.view_count;
              }
            }
          };

          // Update in materials list
          if (state.materials[classroomCode]) {
            state.materials[classroomCode].forEach(updateFileInMaterial);
          }

          // Update in cache
          Object.keys(state.cache).forEach((key) => {
            if (key.startsWith(`${classroomCode}_`)) {
              const cachedMaterials = state.cache[key].data.materials || [];
              cachedMaterials.forEach(updateFileInMaterial);
            }
          });

          // Update current material
          if (state.currentMaterial) {
            updateFileInMaterial(state.currentMaterial);
          }
        }
      })

      // View External Link
      .addCase(viewExternalLink.fulfilled, (state, action) => {
        const { classroomCode, fileId } = action.payload;

        if (!action.meta.aborted) {
          // Update view count for the specific link file
          const updateFileInMaterial = (material) => {
            if (material?.files) {
              const file = material.files.find(
                (f) => String(f.id) === String(fileId)
              );
              if (file) {
                file.view_count = (file.view_count || 0) + 1;
              }
            }
          };

          // Update in materials list
          if (state.materials[classroomCode]) {
            state.materials[classroomCode].forEach(updateFileInMaterial);
          }

          // Update in cache
          Object.keys(state.cache).forEach((key) => {
            if (key.startsWith(`${classroomCode}_`)) {
              const cachedMaterials = state.cache[key].data.materials || [];
              cachedMaterials.forEach(updateFileInMaterial);
            }
          });

          // Update current material
          if (state.currentMaterial) {
            updateFileInMaterial(state.currentMaterial);
          }
        }
      })

      // Get Statistics
      .addCase(getMaterialStatistics.pending, (state) => {
        state.statisticsStatus = "loading";
      })
      .addCase(getMaterialStatistics.fulfilled, (state, action) => {
        const { data, classroomCode } = action.payload;

        if (data && !action.meta.aborted) {
          state.statisticsStatus = "succeeded";
          state.statistics[classroomCode] = data;
        }
      })
      .addCase(getMaterialStatistics.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.statisticsStatus = "failed";
          state.error = action.payload?.message || "Gagal mengambil statistik";
        }
      });
  },
});

// Export actions
export const {
  resetMaterialState,
  resetMaterialStatus,
  clearMaterialErrors,
  setCurrentClassroom,
  setCurrentMaterial,
  clearCache,
  clearExpiredCache,
  updateMaterialOptimistic,
  removeMaterialOptimistic,
  syncMaterialAcrossCache,
  updateMaterialInAllCaches,
  cleanSpecificCacheEntries,
} = materialSlice.actions;

// Selectors
export const selectMaterialsByClassroom = (state, classroomCode) =>
  state.material.materials[classroomCode] || [];

export const selectCurrentMaterial = (state) => state.material.currentMaterial;

export const selectCurrentClassroomCode = (state) =>
  state.material.currentClassroomCode;

export const selectMaterialPagination = (state, classroomCode) =>
  state.material.pagination[classroomCode] || {};

export const selectMaterialStatistics = (state, classroomCode) =>
  state.material.statistics[classroomCode] || {};

export const selectMaterialStatus = (state) => state.material.status;

export const selectMaterialCreateStatus = (state) =>
  state.material.createStatus;

export const selectMaterialUpdateStatus = (state) =>
  state.material.updateStatus;

export const selectMaterialDeleteStatus = (state) =>
  state.material.deleteStatus;

export const selectMaterialDownloadStatus = (state) =>
  state.material.downloadStatus;

export const selectMaterialStatisticsStatus = (state) =>
  state.material.statisticsStatus;

export const selectMaterialError = (state) => state.material.error;

export const selectMaterialValidationErrors = (state) =>
  state.material.validationErrors;

export const selectMaterialLastUpdated = (state, classroomCode) =>
  state.material.lastUpdated[classroomCode];

// Cache-related selectors
export const selectCacheStats = (state) => state.material.cacheStats;

export const selectCacheSize = (state) =>
  Object.keys(state.material.cache).length;

export const selectIsCached = (state, classroomCode, params = {}) => {
  const cacheKey = generateCacheKey(classroomCode, params);
  const cachedData = state.material.cache[cacheKey];
  return cachedData && !isCacheExpired(cachedData.timestamp);
};

// Loading state selectors
export const selectIsMaterialLoading = (state) =>
  state.material.status === "loading";

export const selectIsMaterialCreating = (state) =>
  state.material.createStatus === "loading";

export const selectIsMaterialUpdating = (state) =>
  state.material.updateStatus === "loading";

export const selectIsMaterialDeleting = (state) =>
  state.material.deleteStatus === "loading";

export const selectIsMaterialDownloading = (state) =>
  state.material.downloadStatus === "loading";

export const selectIsMaterialStatisticsLoading = (state) =>
  state.material.statisticsStatus === "loading";

// Utility selector for cache hit rate
export const selectCacheHitRate = (state) => {
  const { hits, totalRequests } = state.material.cacheStats;
  return totalRequests > 0 ? Math.round((hits / totalRequests) * 100) : 0;
};

// Material file selectors
export const selectMaterialFiles = (state, classroomCode, materialId) => {
  const materials = selectMaterialsByClassroom(state, classroomCode);
  const material = materials.find((m) => String(m.id) === String(materialId));
  return material?.files || [];
};

export const selectMaterialFilesByType = (
  state,
  classroomCode,
  materialId,
  fileType
) => {
  const files = selectMaterialFiles(state, classroomCode, materialId);
  return files.filter((file) => file.type === fileType);
};

export const selectMaterialLinks = (state, classroomCode, materialId) => {
  return selectMaterialFilesByType(state, classroomCode, materialId, "link");
};

export const selectMaterialUploadedFiles = (
  state,
  classroomCode,
  materialId
) => {
  return selectMaterialFilesByType(state, classroomCode, materialId, "file");
};

export default materialSlice.reducer;
