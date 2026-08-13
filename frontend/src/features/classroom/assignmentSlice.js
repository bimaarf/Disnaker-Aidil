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
export const fetchAssignments = createAsyncThunk(
  "assignment/fetchAssignments",
  async (
    { classroomCode, params = {}, signal, forceRefresh = false },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState();
      const cacheKey = generateCacheKey(classroomCode, params);
      const cachedData = state.assignment.cache[cacheKey];

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
        `${API_BASE_URL}api/classrooms/${classroomCode}/assignments?${queryParams.toString()}`,
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

export const createAssignment = createAsyncThunk(
  "assignment/createAssignment",
  async ({ classroomCode, assignmentData }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");

      const formData = new FormData();

      // Handle multiple files properly
      Object.entries(assignmentData).forEach(([key, value]) => {
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
        `${API_BASE_URL}api/classrooms/${classroomCode}/assignments`,
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
        message: error.response?.data?.message || "Gagal menambahkan tugas",
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
    }
  }
);

export const updateAssignment = createAsyncThunk(
  "assignment/updateAssignment",
  async (
    { classroomCode, assignmentId, assignmentData },
    { rejectWithValue }
  ) => {
    try {
      await axios.get("sanctum/csrf-cookie");

      const formData = new FormData();
      formData.append("_method", "PUT");

      // Handle multiple files properly for updates
      Object.entries(assignmentData).forEach(([key, value]) => {
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
        `${API_BASE_URL}api/classrooms/${classroomCode}/assignments/${assignmentId}`,
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
        assignmentId,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message: error.response?.data?.message || "Gagal mengupdate tugas",
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
    }
  }
);

export const deleteAssignment = createAsyncThunk(
  "assignment/deleteAssignment",
  async ({ classroomCode, assignmentId }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");

      await axios.delete(
        `${API_BASE_URL}api/classrooms/${classroomCode}/assignments/${assignmentId}`
      );

      return { classroomCode, assignmentId };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message: error.response?.data?.message || "Gagal menghapus tugas",
        status: error.response?.status,
      });
    }
  }
);

export const downloadAssignment = createAsyncThunk(
  "assignment/downloadAssignment",
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
        `${API_BASE_URL}api/classrooms/${classroomCode}/assignments/${fileId}/download`,
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

export const incrementAssignmentView = createAsyncThunk(
  "assignment/incrementView",
  async ({ classroomCode, fileId }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");

      const response = await axios.post(
        `${API_BASE_URL}api/classrooms/${classroomCode}/assignments/files/${fileId}/view`
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
  "assignment/viewExternalLink",
  async ({ classroomCode, fileId }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");

      const response = await axios.get(
        `${API_BASE_URL}api/classrooms/${classroomCode}/assignments/files/${fileId}/view-or-link`,
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

export const getAssignmentStatistics = createAsyncThunk(
  "assignment/getStatistics",
  async ({ classroomCode }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");

      const response = await axios.get(
        `${API_BASE_URL}api/classrooms/${classroomCode}/assignments/statistics`
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

// NEW: Submission related async thunks
export const getSubmission = createAsyncThunk(
  "assignment/getSubmission",
  async ({ classroomCode, assignmentId }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");

      const response = await axios.get(
        `${API_BASE_URL}api/classrooms/${classroomCode}/assignments/${assignmentId}/submission`
      );

      return {
        data: response.data.data,
        classroomCode,
        assignmentId,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message: error.response?.data?.message || "Gagal mengambil submission",
        status: error.response?.status,
      });
    }
  }
);

export const submitAssignmentSubmission = createAsyncThunk(
  "assignment/submitAssignmentSubmission",
  async (
    { classroomCode, assignmentId, submissionData },
    { rejectWithValue }
  ) => {
    try {
      await axios.get("sanctum/csrf-cookie");

      const formData = new FormData();

      // Handle submission data
      Object.entries(submissionData).forEach(([key, value]) => {
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
        } else if (key === "removeFileIds" && value) {
          if (Array.isArray(value)) {
            value.forEach((id, index) => {
              formData.append(`remove_file_ids[${index}]`, id);
            });
          }
        } else if (key === "submissionText") {
          formData.append("submission_text", value || "");
        } else if (value !== null && value !== undefined && value !== "") {
          formData.append(key, value);
        }
      });

      const response = await axios.post(
        `${API_BASE_URL}api/classrooms/${classroomCode}/assignments/${assignmentId}/submit`,
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
        assignmentId,
        message: response.data.message,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message: error.response?.data?.message || "Gagal submit assignment",
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
    }
  }
);

// NEW: Thunk for updating submission (grading)
export const updateAssignmentSubmission = createAsyncThunk(
  "assignment/updateAssignmentSubmission",
  async (
    { classroomCode, assignmentId, submissionId, updateData },
    { rejectWithValue }
  ) => {
    try {
      await axios.get("sanctum/csrf-cookie");

      // PERBAIKAN: Pastikan submissionId ada
      if (!submissionId) {
        throw new Error("Submission ID tidak ditemukan");
      }

      const response = await axios.put(
        `${API_BASE_URL}api/classrooms/${classroomCode}/assignments/${assignmentId}/submissions/${submissionId}`,
        updateData,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      return {
        data: response.data.data,
        classroomCode,
        assignmentId,
        submissionId,
        message: response.data.message,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }

      // PERBAIKAN: Better error handling
      let errorMessage = "Gagal update submission";

      if (error.response) {
        if (error.response.status === 403) {
          errorMessage =
            "Anda tidak memiliki akses untuk mengupdate submission ini";
        } else if (error.response.status === 404) {
          errorMessage = "Submission tidak ditemukan";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      return rejectWithValue({
        message: errorMessage,
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
    }
  }
);

// Perbaikan untuk removeSubmissionFile async thunk
export const removeSubmissionFile = createAsyncThunk(
  "assignment/removeSubmissionFile",
  async ({ classroomCode, assignmentId, fileId }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");

      // PERBAIKAN: Gunakan DELETE method sesuai dengan route Laravel
      const response = await axios.delete(
        `${API_BASE_URL}api/classrooms/${classroomCode}/assignments/${assignmentId}/submission/files/${fileId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      return {
        data: response.data.data,
        classroomCode,
        assignmentId,
        fileId,
        message: response.data.message || "File berhasil dihapus",
      };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }

      // Handle different error status codes
      let errorMessage = "Gagal menghapus file submission";

      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = "Anda tidak memiliki akses untuk menghapus file ini";
        } else if (error.response.status === 404) {
          errorMessage = "File tidak ditemukan";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      }

      return rejectWithValue({
        message: errorMessage,
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
    }
  }
);

// Initial state
const initialState = {
  assignments: {},
  pagination: {},
  cache: {},
  statistics: {},
  submissions: {}, // NEW: Store submissions by assignment ID
  currentClassroomCode: null,
  currentAssignment: null,
  currentSubmission: {}, // NEW: Current active submission
  status: "idle",
  createStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  downloadStatus: "idle",
  statisticsStatus: "idle",
  submissionStatus: "idle", // NEW: Submission status
  submitStatus: "idle", // NEW: Submit status
  error: null,
  submissionError: null, // NEW: Separate submission errors
  validationErrors: null,
  lastUpdated: {},
  cacheStats: {
    hits: 0,
    misses: 0,
    totalRequests: 0,
  },
};

// Enhanced Assignment slice with submission support
const assignmentSlice = createSlice({
  name: "assignment",
  initialState,
  reducers: {
    resetAssignmentState: () => initialState,

    cleanSpecificCacheEntries: (state, action) => {
      const keysToRemove = action.payload;
      keysToRemove.forEach((key) => {
        delete state.cache[key];
      });
    },

    // CRITICAL: Smart cache update function that updates ALL cache entries
    updateAssignmentInAllCaches: (state, action) => {
      const { classroomCode, assignmentId, updatedAssignment, operation } =
        action.payload;
      const currentTime = Date.now();
      const timestamp = new Date().toISOString();

      // Update in main assignments list
      if (operation === "create") {
        // Add to assignments list
        if (!state.assignments[classroomCode]) {
          state.assignments[classroomCode] = [];
        }
        // Add at the beginning for newest first
        state.assignments[classroomCode].unshift(updatedAssignment);

        // Update pagination total
        if (state.pagination[classroomCode]) {
          state.pagination[classroomCode].total += 1;
        }
      } else if (operation === "update") {
        // Update existing assignment
        if (state.assignments[classroomCode]) {
          const index = state.assignments[classroomCode].findIndex(
            (m) => String(m.id) === String(assignmentId)
          );
          if (index !== -1) {
            state.assignments[classroomCode][index] = updatedAssignment;
          }
        }
      } else if (operation === "delete") {
        // Remove from assignments list
        if (state.assignments[classroomCode]) {
          state.assignments[classroomCode] = state.assignments[
            classroomCode
          ].filter((m) => String(m.id) !== String(assignmentId));
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

          if (cacheEntry?.data?.assignments) {
            if (operation === "create") {
              // Add to cache
              cacheEntry.data.assignments.unshift(updatedAssignment);

              // Update pagination in cache
              if (cacheEntry.data.pagination) {
                cacheEntry.data.pagination.total += 1;
              }
            } else if (operation === "update") {
              // Update in cache
              const assignmentIndex = cacheEntry.data.assignments.findIndex(
                (m) => String(m.id) === String(assignmentId)
              );
              if (assignmentIndex !== -1) {
                cacheEntry.data.assignments[assignmentIndex] =
                  updatedAssignment;
              }
            } else if (operation === "delete") {
              // Remove from cache
              cacheEntry.data.assignments = cacheEntry.data.assignments.filter(
                (m) => String(m.id) !== String(assignmentId)
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

      // Update current assignment if it matches
      if (state.currentAssignment?.id === assignmentId) {
        if (operation === "delete") {
          state.currentAssignment = null;
        } else {
          state.currentAssignment = updatedAssignment;
        }
      }

      state.lastUpdated[classroomCode] = timestamp;
    },

    syncAssignmentAcrossCache: (state, action) => {
      const {
        classroomCode,
        assignmentId,
        updatedAssignment,
        source = "update",
      } = action.payload;

      const currentTime = Date.now();
      const timestamp = new Date().toISOString();

      let updatedCacheCount = 0;

      // Cari semua cache entry yang mengandung assignment ini
      Object.keys(state.cache).forEach((cacheKey) => {
        if (cacheKey.startsWith(`${classroomCode}_`)) {
          const cacheEntry = state.cache[cacheKey];

          if (cacheEntry?.data?.assignments) {
            const assignmentIndex = cacheEntry.data.assignments.findIndex(
              (m) => String(m.id) === String(assignmentId)
            );

            if (assignmentIndex !== -1) {
              cacheEntry.data.assignments[assignmentIndex] = updatedAssignment;
              cacheEntry.timestamp = timestamp;
              cacheEntry.lastAccessed = currentTime;
              cacheEntry.lastModified = currentTime;
              cacheEntry.syncSource = source;
              updatedCacheCount++;
            }
          }
        }
      });

      // Update daftar assignments utama
      if (state.assignments[classroomCode]) {
        const index = state.assignments[classroomCode].findIndex(
          (m) => String(m.id) === String(assignmentId)
        );
        if (index !== -1) {
          state.assignments[classroomCode][index] = updatedAssignment;
        }
      }

      // Update current assignment jika cocok
      if (state.currentAssignment?.id === assignmentId) {
        state.currentAssignment = updatedAssignment;
      }

      // Simpan timestamp terakhir update
      state.lastUpdated[classroomCode] = timestamp;

      // Simpan jumlah cache yang diperbarui (opsional, bisa dipakai untuk debug atau monitoring)
      state.updatedCacheCount = updatedCacheCount;

      // Logging (opsional, bisa dihapus di production)
      if (process.env.NODE_ENV === "development") {
        console.log(
          `✅ syncAssignmentAcrossCache: ${updatedCacheCount} cache entry diperbarui untuk assignment ${assignmentId}`
        );
      }
    },

    resetAssignmentStatus: (state) => {
      state.status = "idle";
      state.createStatus = "idle";
      state.updateStatus = "idle";
      state.deleteStatus = "idle";
      state.downloadStatus = "idle";
      state.statisticsStatus = "idle";
      state.submissionStatus = "idle";
      state.submitStatus = "idle";
      state.error = null;
      state.submissionError = null;
      state.validationErrors = null;
    },

    clearAssignmentErrors: (state) => {
      state.error = null;
      state.submissionError = null;
      state.validationErrors = null;
    },

    setCurrentClassroom: (state, action) => {
      state.currentClassroomCode = action.payload;
    },

    setCurrentAssignment: (state, action) => {
      state.currentAssignment = action.payload;
    },

    // NEW: Submission related reducers
    setSubmissions: (state, action) => {
      state.currentSubmission = action.payload;
    },

    updateSubmissionOptimistic: (state, action) => {
      const { assignmentId, submissionData } = action.payload;

      // Update current submission
      if (
        state.currentSubmission &&
        state.currentSubmission.assignment_id === assignmentId
      ) {
        state.currentSubmission = {
          ...state.currentSubmission,
          ...submissionData,
          updated_at: new Date().toISOString(),
        };
      }

      // Update submission in submissions store
      if (state.submissions[assignmentId]) {
        state.submissions[assignmentId] = {
          ...state.submissions[assignmentId],
          ...submissionData,
          updated_at: new Date().toISOString(),
        };
      }

      // Update submissions in assignment data
      if (
        state.currentAssignment &&
        state.currentAssignment.id === assignmentId
      ) {
        state.currentAssignment.submissions = {
          ...state.currentAssignment.submissions,
          ...submissionData,
          updated_at: new Date().toISOString(),
        };
      }
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

    updateAssignmentOptimistic: (state, action) => {
      const { classroomCode, assignmentId, updates } = action.payload;

      // Update in assignments list
      if (state.assignments[classroomCode]) {
        const index = state.assignments[classroomCode].findIndex(
          (m) => m.id === assignmentId
        );
        if (index !== -1) {
          state.assignments[classroomCode][index] = {
            ...state.assignments[classroomCode][index],
            ...updates,
          };
        }
      }

      // Update in cache
      Object.keys(state.cache).forEach((key) => {
        if (key.startsWith(`${classroomCode}_`)) {
          const cachedAssignments = state.cache[key].data.assignments || [];
          const index = cachedAssignments.findIndex(
            (m) => m.id === assignmentId
          );
          if (index !== -1) {
            cachedAssignments[index] = {
              ...cachedAssignments[index],
              ...updates,
            };
          }
        }
      });

      // Update current assignment if it matches
      if (state.currentAssignment?.id === assignmentId) {
        state.currentAssignment = {
          ...state.currentAssignment,
          ...updates,
        };
      }
    },

    removeAssignmentOptimistic: (state, action) => {
      const { classroomCode, assignmentId } = action.payload;

      // Remove from assignments list
      if (state.assignments[classroomCode]) {
        state.assignments[classroomCode] = state.assignments[
          classroomCode
        ].filter((m) => m.id !== assignmentId);
      }

      // Remove from cache
      Object.keys(state.cache).forEach((key) => {
        if (key.startsWith(`${classroomCode}_`)) {
          const cachedAssignments = state.cache[key].data.assignments || [];
          state.cache[key].data.assignments = cachedAssignments.filter(
            (m) => m.id !== assignmentId
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

      // Clear current assignment if it matches
      if (state.currentAssignment?.id === assignmentId) {
        state.currentAssignment = null;
      }

      // Clear submission if it matches
      if (state.currentSubmission?.assignment_id === assignmentId) {
        state.currentSubmission = null;
      }
      delete state.submissions[assignmentId];
    },
    updateSubmissionInCache: (state, action) => {
      const { classroomCode, assignmentId, submissionData } = action.payload;
      const currentTime = Date.now();
      const timestamp = new Date().toISOString();

      // Normalize submission data to ensure consistency
      const normalizedSubmission = Array.isArray(submissionData)
        ? submissionData
        : [submissionData];

      // Update in main assignments list
      if (state.assignments[classroomCode]) {
        const assignmentIndex = state.assignments[classroomCode].findIndex(
          (a) => String(a.id) === String(assignmentId)
        );
        if (assignmentIndex !== -1) {
          state.assignments[classroomCode][assignmentIndex].submissions =
            normalizedSubmission;
        }
      }

      // Update ALL cache entries for this classroom
      Object.keys(state.cache).forEach((cacheKey) => {
        if (cacheKey.startsWith(`${classroomCode}_`)) {
          const cacheEntry = state.cache[cacheKey];

          if (cacheEntry?.data?.assignments) {
            const assignmentIndex = cacheEntry.data.assignments.findIndex(
              (a) => String(a.id) === String(assignmentId)
            );

            if (assignmentIndex !== -1) {
              // Update submissions in cached assignment
              cacheEntry.data.assignments[assignmentIndex].submissions =
                normalizedSubmission;

              // Update cache metadata
              cacheEntry.lastAccessed = currentTime;
              cacheEntry.lastModified = currentTime;
              cacheEntry.syncSource = "local_submission_update";
            }
          }
        }
      });

      // Update current assignment if it matches
      if (state.currentAssignment?.id === assignmentId) {
        state.currentAssignment.submissions = normalizedSubmission;
      }

      // Update submissions store
      state.submissions[assignmentId] = normalizedSubmission;

      // Update current submission
      state.currentSubmission = Array.isArray(submissionData)
        ? submissionData[0]
        : submissionData;

      // Update last updated timestamp
      state.lastUpdated[classroomCode] = timestamp;

      if (process.env.NODE_ENV === "development") {
        console.log(
          `✅ Updated submission in cache for assignment ${assignmentId}`
        );
      }
    },

    removeSubmissionFileFromCache: (state, action) => {
      const { classroomCode, assignmentId, fileId, updatedSubmission } =
        action.payload;
      const currentTime = Date.now();
      const timestamp = new Date().toISOString();

      // Normalize updated submission data
      const normalizedSubmission = Array.isArray(updatedSubmission)
        ? updatedSubmission
        : [updatedSubmission];

      // Helper function to update submission in an assignment
      const updateAssignmentSubmission = (assignment) => {
        if (assignment && String(assignment.id) === String(assignmentId)) {
          // Update the entire submissions array with the server response
          assignment.submissions = normalizedSubmission;

          // Alternative: If you want to manually remove the file instead
          // if (assignment.submissions) {
          //   const submissions = Array.isArray(assignment.submissions)
          //     ? assignment.submissions
          //     : [assignment.submissions];
          //
          //   submissions.forEach(sub => {
          //     if (sub.files) {
          //       sub.files = sub.files.filter(f => String(f.id) !== String(fileId));
          //     }
          //   });
          //
          //   assignment.submissions = submissions;
          // }
        }
      };

      // Update in main assignments list
      if (state.assignments[classroomCode]) {
        state.assignments[classroomCode].forEach(updateAssignmentSubmission);
      }

      // Update ALL cache entries
      Object.keys(state.cache).forEach((cacheKey) => {
        if (cacheKey.startsWith(`${classroomCode}_`)) {
          const cacheEntry = state.cache[cacheKey];

          if (cacheEntry?.data?.assignments) {
            cacheEntry.data.assignments.forEach(updateAssignmentSubmission);

            // Update cache metadata
            cacheEntry.lastAccessed = currentTime;
            cacheEntry.lastModified = currentTime;
            cacheEntry.syncSource = "local_file_removal";
          }
        }
      });

      // Update current assignment
      if (state.currentAssignment?.id === assignmentId) {
        updateAssignmentSubmission(state.currentAssignment);
      }

      // Update submissions store
      state.submissions[assignmentId] = normalizedSubmission;

      // Update current submission
      state.currentSubmission = Array.isArray(updatedSubmission)
        ? updatedSubmission[0]
        : updatedSubmission;

      // Update last updated timestamp
      state.lastUpdated[classroomCode] = timestamp;

      if (process.env.NODE_ENV === "development") {
        console.log(
          `✅ Removed file ${fileId} from submission cache for assignment ${assignmentId}`
        );
      }
    },

    updateSubmissionOptimisticLocal: (state, action) => {
      const { classroomCode, assignmentId, submissionUpdate } = action.payload;
      const currentTime = Date.now();
      const timestamp = new Date().toISOString();

      // Helper function to apply optimistic update
      const applyOptimisticUpdate = (assignment) => {
        if (assignment && String(assignment.id) === String(assignmentId)) {
          if (!assignment.submissions) {
            assignment.submissions = [];
          }

          const submissions = Array.isArray(assignment.submissions)
            ? assignment.submissions
            : [assignment.submissions];

          // Update or add submission
          if (submissions.length > 0) {
            submissions[0] = {
              ...submissions[0],
              ...submissionUpdate,
              updated_at: timestamp,
            };
          } else {
            submissions.push({
              ...submissionUpdate,
              assignment_id: assignmentId,
              created_at: timestamp,
              updated_at: timestamp,
            });
          }

          assignment.submissions = submissions;
        }
      };

      // Apply optimistic update everywhere
      if (state.assignments[classroomCode]) {
        state.assignments[classroomCode].forEach(applyOptimisticUpdate);
      }

      Object.keys(state.cache).forEach((cacheKey) => {
        if (cacheKey.startsWith(`${classroomCode}_`)) {
          const cacheEntry = state.cache[cacheKey];
          if (cacheEntry?.data?.assignments) {
            cacheEntry.data.assignments.forEach(applyOptimisticUpdate);
            cacheEntry.lastModified = currentTime;
            cacheEntry.syncSource = "optimistic_update";
          }
        }
      });

      if (state.currentAssignment?.id === assignmentId) {
        applyOptimisticUpdate(state.currentAssignment);
      }

      state.lastUpdated[classroomCode] = timestamp;
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch Assignments
      .addCase(fetchAssignments.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.cacheStats.totalRequests += 1;
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
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
          state.assignments[classroomCode] = data.assignments || [];
          state.pagination[classroomCode] = data.pagination || {};
          state.lastUpdated[classroomCode] = new Date().toISOString();
          state.currentClassroomCode = classroomCode;
        }
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.status = "failed";
          state.error = action.payload?.message;
        }
      })

      // Create Assignment - Now with smart cache update
      .addCase(createAssignment.pending, (state) => {
        state.createStatus = "loading";
        state.error = null;
        state.validationErrors = null;
      })
      .addCase(createAssignment.fulfilled, (state, action) => {
        const { data, classroomCode } = action.payload;

        if (data && !action.meta.aborted) {
          state.createStatus = "succeeded";

          // Use the smart cache update function
          assignmentSlice.caseReducers.updateAssignmentInAllCaches(state, {
            payload: {
              classroomCode,
              assignmentId: data.id,
              updatedAssignment: data,
              operation: "create",
            },
          });
        }
      })
      .addCase(createAssignment.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.createStatus = "failed";
          state.error = action.payload?.message || "Gagal menambahkan tugas";
          state.validationErrors = action.payload?.errors;
        }
      })

      // Update Assignment - Now with smart cache update
      .addCase(updateAssignment.pending, (state) => {
        state.updateStatus = "loading";
        state.error = null;
        state.validationErrors = null;
      })
      .addCase(updateAssignment.fulfilled, (state, action) => {
        const { data, classroomCode, assignmentId } = action.payload;

        if (data && !action.meta.aborted) {
          state.updateStatus = "succeeded";

          // Use the smart cache update function
          assignmentSlice.caseReducers.updateAssignmentInAllCaches(state, {
            payload: {
              classroomCode,
              assignmentId,
              updatedAssignment: data,
              operation: "update",
            },
          });
        }
      })
      .addCase(updateAssignment.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.updateStatus = "failed";
          state.error = action.payload?.message || "Gagal mengupdate tugas";
          state.validationErrors = action.payload?.errors;
        }
      })

      // Delete Assignment - Now with smart cache update
      .addCase(deleteAssignment.pending, (state) => {
        state.deleteStatus = "loading";
        state.error = null;
      })
      .addCase(deleteAssignment.fulfilled, (state, action) => {
        const { classroomCode, assignmentId } = action.payload;

        if (!action.meta.aborted) {
          state.deleteStatus = "succeeded";

          // Use the smart cache update function
          assignmentSlice.caseReducers.updateAssignmentInAllCaches(state, {
            payload: {
              classroomCode,
              assignmentId,
              operation: "delete",
            },
          });
        }
      })
      .addCase(deleteAssignment.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.deleteStatus = "failed";
          state.error = action.payload?.message || "Gagal menghapus tugas";
        }
      })

      // Download Assignment
      .addCase(downloadAssignment.pending, (state) => {
        state.downloadStatus = "loading";
      })
      .addCase(downloadAssignment.fulfilled, (state, action) => {
        const { classroomCode, fileId } = action.payload;

        if (!action.meta.aborted) {
          state.downloadStatus = "succeeded";

          // Update download count for the specific file
          const updateFileInAssignment = (assignment) => {
            if (assignment?.files) {
              const file = assignment.files.find(
                (f) => String(f.id) === String(fileId)
              );
              if (file) {
                file.download_count = (file.download_count || 0) + 1;
              }
            }
          };

          // Update in assignments list
          if (state.assignments[classroomCode]) {
            state.assignments[classroomCode].forEach(updateFileInAssignment);
          }

          // Update in cache
          Object.keys(state.cache).forEach((key) => {
            if (key.startsWith(`${classroomCode}_`)) {
              const cachedAssignments = state.cache[key].data.assignments || [];
              cachedAssignments.forEach(updateFileInAssignment);
            }
          });

          // Update current assignment
          if (state.currentAssignment) {
            updateFileInAssignment(state.currentAssignment);
          }
        }
      })
      .addCase(downloadAssignment.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.downloadStatus = "failed";
          state.error = action.payload?.message || "Gagal mengunduh file";
        }
      })

      // Increment View
      .addCase(incrementAssignmentView.fulfilled, (state, action) => {
        const { data, classroomCode, fileId } = action.payload;

        if (data && !action.meta.aborted) {
          // Update view count for the specific file
          const updateFileInAssignment = (assignment) => {
            if (assignment?.files) {
              const file = assignment.files.find(
                (f) => String(f.id) === String(fileId)
              );
              if (file && data.view_count) {
                file.view_count = data.view_count;
              }
            }
          };

          // Update in assignments list
          if (state.assignments[classroomCode]) {
            state.assignments[classroomCode].forEach(updateFileInAssignment);
          }

          // Update in cache
          Object.keys(state.cache).forEach((key) => {
            if (key.startsWith(`${classroomCode}_`)) {
              const cachedAssignments = state.cache[key].data.assignments || [];
              cachedAssignments.forEach(updateFileInAssignment);
            }
          });

          // Update current assignment
          if (state.currentAssignment) {
            updateFileInAssignment(state.currentAssignment);
          }
        }
      })

      // View External Link
      .addCase(viewExternalLink.fulfilled, (state, action) => {
        const { classroomCode, fileId } = action.payload;

        if (!action.meta.aborted) {
          // Update view count for the specific link file
          const updateFileInAssignment = (assignment) => {
            if (assignment?.files) {
              const file = assignment.files.find(
                (f) => String(f.id) === String(fileId)
              );
              if (file) {
                file.view_count = (file.view_count || 0) + 1;
              }
            }
          };

          // Update in assignments list
          if (state.assignments[classroomCode]) {
            state.assignments[classroomCode].forEach(updateFileInAssignment);
          }

          // Update in cache
          Object.keys(state.cache).forEach((key) => {
            if (key.startsWith(`${classroomCode}_`)) {
              const cachedAssignments = state.cache[key].data.assignments || [];
              cachedAssignments.forEach(updateFileInAssignment);
            }
          });

          // Update current assignment
          if (state.currentAssignment) {
            updateFileInAssignment(state.currentAssignment);
          }
        }
      })

      // Get Statistics
      .addCase(getAssignmentStatistics.pending, (state) => {
        state.statisticsStatus = "loading";
      })
      .addCase(getAssignmentStatistics.fulfilled, (state, action) => {
        const { data, classroomCode } = action.payload;

        if (data && !action.meta.aborted) {
          state.statisticsStatus = "succeeded";
          state.statistics[classroomCode] = data;
        }
      })
      .addCase(getAssignmentStatistics.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.statisticsStatus = "failed";
          state.error = action.payload?.message || "Gagal mengambil statistik";
        }
      })

      // NEW: Submission related reducers
      // Get Submission
      .addCase(getSubmission.pending, (state) => {
        state.submissionStatus = "loading";
        state.submissionError = null;
      })
      .addCase(getSubmission.fulfilled, (state, action) => {
        const { data, assignmentId } = action.payload;

        if (data && !action.meta.aborted) {
          state.submissionStatus = "succeeded";

          // PERBAIKAN: Pastikan data submissions selalu dalam format yang konsisten
          const submissionData = Array.isArray(data) ? data : [data];

          state.submissions[assignmentId] = submissionData;
          state.currentSubmission = data; // Keep as single object for currentSubmission

          // Update submissions in assignment if it exists
          if (
            state.currentAssignment &&
            state.currentAssignment.id === assignmentId
          ) {
            // PERBAIKAN: Pastikan submissions selalu array
            state.currentAssignment.submissions = submissionData;
          }

          // Update in assignments list
          Object.values(state.assignments).forEach((assignments) => {
            const assignmentIndex = assignments.findIndex(
              (a) => String(a.id) === String(assignmentId)
            );
            if (assignmentIndex !== -1) {
              // PERBAIKAN: Pastikan submissions selalu array
              assignments[assignmentIndex].submissions = submissionData;
            }
          });

          // Update in cache
          Object.keys(state.cache).forEach((cacheKey) => {
            if (state.cache[cacheKey]?.data?.assignments) {
              const assignmentIndex = state.cache[
                cacheKey
              ].data.assignments.findIndex(
                (a) => String(a.id) === String(assignmentId)
              );
              if (assignmentIndex !== -1) {
                // PERBAIKAN: Pastikan submissions di cache selalu array
                state.cache[cacheKey].data.assignments[
                  assignmentIndex
                ].submissions = submissionData;
              }
            }
          });
        }
      })
      .addCase(submitAssignmentSubmission.fulfilled, (state, action) => {
        const { data, classroomCode, assignmentId } = action.payload;
        if (data && !action.meta.aborted) {
          state.submitStatus = "succeeded";
          // Use the local cache update instead of requiring a refetch
          const normalizedSubmission = Array.isArray(data) ? data : [data];

          assignmentSlice.caseReducers.updateSubmissionInCache(state, {
            payload: {
              classroomCode,
              assignmentId,
              submissionData: normalizedSubmission,
            },
          });
        }
      })

      .addCase(submitAssignmentSubmission.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.submitStatus = "failed";
          state.submissionError =
            action.payload?.message || "Gagal submit assignment";
          state.validationErrors = action.payload?.errors;
        }
      })

      // Remove Submission File
      .addCase(removeSubmissionFile.pending, (state, action) => {
        state.submitStatus = "loading";
        state.submissionError = null;

        // Store file ID yang sedang dihapus untuk loading state
        const { fileId } = action.meta.arg;
        if (!state.deletingFileIds) {
          state.deletingFileIds = [];
        }
        state.deletingFileIds.push(fileId);
      })
      .addCase(removeSubmissionFile.fulfilled, (state, action) => {
        const { data, classroomCode, assignmentId, fileId } = action.payload;

        if (data && !action.meta.aborted) {
          state.submitStatus = "succeeded";

          // Use the local cache update instead of requiring a refetch
          assignmentSlice.caseReducers.removeSubmissionFileFromCache(state, {
            payload: {
              classroomCode,
              assignmentId,
              fileId,
              updatedSubmission: data,
            },
          });

          // Remove file ID from deleting list
          if (state.deletingFileIds) {
            state.deletingFileIds = state.deletingFileIds.filter(
              (id) => id !== fileId
            );
          }

          // Store success message
          state.successMessage = action.payload.message;
        }
      })
      .addCase(removeSubmissionFile.rejected, (state, action) => {
        const { fileId } = action.meta.arg;

        if (!action.payload?.cancelled) {
          state.submitStatus = "failed";
          state.submissionError =
            action.payload?.message || "Gagal menghapus file submission";
        }

        // Remove file ID from deleting list even on error
        if (state.deletingFileIds) {
          state.deletingFileIds = state.deletingFileIds.filter(
            (id) => id !== fileId
          );
        }
      })

      // NEW: Update Submission (Grading)
      .addCase(updateAssignmentSubmission.pending, (state) => {
        state.submitStatus = "loading";
        state.submissionError = null;
        state.validationErrors = null;
      })
      .addCase(updateAssignmentSubmission.fulfilled, (state, action) => {
        const { data, classroomCode, assignmentId } = action.payload;

        if (data && !action.meta.aborted) {
          state.submitStatus = "succeeded";

          // PERBAIKAN: Hanya update submission yang di-grade, jangan replace semua submissions
          const updatedSubmission = data;

          // Helper function untuk update single submission dalam array
          const updateSingleSubmissionInArray = (submissions) => {
            if (!submissions) return [updatedSubmission];

            const submissionsArray = Array.isArray(submissions)
              ? submissions
              : [submissions];
            const updatedIndex = submissionsArray.findIndex(
              (s) => s.id === updatedSubmission.id
            );

            if (updatedIndex !== -1) {
              // Update existing submission
              const newSubmissions = [...submissionsArray];
              newSubmissions[updatedIndex] = updatedSubmission;
              return newSubmissions;
            } else {
              // Add new submission if not found
              return [...submissionsArray, updatedSubmission];
            }
          };

          // Update in main assignments list
          if (state.assignments[classroomCode]) {
            const assignmentIndex = state.assignments[classroomCode].findIndex(
              (a) => String(a.id) === String(assignmentId)
            );
            if (assignmentIndex !== -1) {
              const currentSubmissions =
                state.assignments[classroomCode][assignmentIndex].submissions;
              state.assignments[classroomCode][assignmentIndex].submissions =
                updateSingleSubmissionInArray(currentSubmissions);
            }
          }

          // Update ALL cache entries for this classroom
          Object.keys(state.cache).forEach((cacheKey) => {
            if (cacheKey.startsWith(`${classroomCode}_`)) {
              const cacheEntry = state.cache[cacheKey];

              if (cacheEntry?.data?.assignments) {
                const assignmentIndex = cacheEntry.data.assignments.findIndex(
                  (a) => String(a.id) === String(assignmentId)
                );

                if (assignmentIndex !== -1) {
                  const currentSubmissions =
                    cacheEntry.data.assignments[assignmentIndex].submissions;
                  cacheEntry.data.assignments[assignmentIndex].submissions =
                    updateSingleSubmissionInArray(currentSubmissions);

                  // Update cache metadata
                  cacheEntry.lastAccessed = Date.now();
                  cacheEntry.lastModified = Date.now();
                  cacheEntry.syncSource = "grading_update";
                }
              }
            }
          });

          // Update current assignment if it matches
          if (state.currentAssignment?.id === assignmentId) {
            const currentSubmissions = state.currentAssignment.submissions;
            state.currentAssignment.submissions =
              updateSingleSubmissionInArray(currentSubmissions);
          }

          // Update submissions store (preserve other submissions)
          if (state.submissions[assignmentId]) {
            state.submissions[assignmentId] = updateSingleSubmissionInArray(
              state.submissions[assignmentId]
            );
          }

          // Update current submission only if it's the same one being graded
          if (state.currentSubmission?.id === updatedSubmission.id) {
            state.currentSubmission = updatedSubmission;
          }

          // Store success message
          state.successMessage =
            action.payload.message || "Submission berhasil diupdate";
        }
      })
      .addCase(updateAssignmentSubmission.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.submitStatus = "failed";
          state.submissionError =
            action.payload?.message || "Gagal update submission";
          state.validationErrors = action.payload?.errors;
        }
      });
  },
});

// Export actions
export const {
  resetAssignmentState,
  resetAssignmentStatus,
  clearAssignmentErrors,
  setCurrentClassroom,
  setCurrentAssignment,
  setSubmissions,
  updateSubmissionOptimistic,
  clearCache,
  clearExpiredCache,
  updateAssignmentOptimistic,
  removeAssignmentOptimistic,
  syncAssignmentAcrossCache,
  updateAssignmentInAllCaches,
  cleanSpecificCacheEntries,
  updateSubmissionInCache,
  removeSubmissionFileFromCache,
  updateSubmissionOptimisticLocal,
} = assignmentSlice.actions;

// Selectors
export const selectAssignmentsByClassroom = (state, classroomCode) =>
  state.assignment.assignments[classroomCode] || [];

export const selectCurrentAssignment = (state) =>
  state.assignment.currentAssignment;

export const selectSubmissions = (state) => state.assignment.currentSubmission;

export const selectSubmissionByAssignment = (state, assignmentId) =>
  state.assignment.submissions[assignmentId] || null;

export const selectCurrentClassroomCode = (state) =>
  state.assignment.currentClassroomCode;

export const selectAssignmentPagination = (state, classroomCode) =>
  state.assignment.pagination[classroomCode] || {};

export const selectAssignmentStatistics = (state, classroomCode) =>
  state.assignment.statistics[classroomCode] || {};

export const selectAssignmentStatus = (state) => state.assignment.status;

export const selectAssignmentCreateStatus = (state) =>
  state.assignment.createStatus;

export const selectAssignmentUpdateStatus = (state) =>
  state.assignment.updateStatus;

export const selectAssignmentDeleteStatus = (state) =>
  state.assignment.deleteStatus;

export const selectAssignmentDownloadStatus = (state) =>
  state.assignment.downloadStatus;

export const selectAssignmentStatisticsStatus = (state) =>
  state.assignment.statisticsStatus;

// NEW: Submission selectors
export const selectSubmissionStatus = (state) =>
  state.assignment.submissionStatus;

export const selectSubmitStatus = (state) => state.assignment.submitStatus;

export const selectSubmissionError = (state) =>
  state.assignment.submissionError;

export const selectIsSubmitting = (state) =>
  state.assignment.submitStatus === "loading";

export const selectAssignmentError = (state) => state.assignment.error;

export const selectAssignmentValidationErrors = (state) =>
  state.assignment.validationErrors;

export const selectAssignmentLastUpdated = (state, classroomCode) =>
  state.assignment.lastUpdated[classroomCode];

// Cache-related selectors
export const selectCacheStats = (state) => state.assignment.cacheStats;

export const selectCacheSize = (state) =>
  Object.keys(state.assignment.cache).length;

export const selectIsCached = (state, classroomCode, params = {}) => {
  const cacheKey = generateCacheKey(classroomCode, params);
  const cachedData = state.assignment.cache[cacheKey];
  return cachedData && !isCacheExpired(cachedData.timestamp);
};

// Loading state selectors
export const selectIsAssignmentLoading = (state) =>
  state.assignment.status === "loading";

export const selectIsAssignmentCreating = (state) =>
  state.assignment.createStatus === "loading";

export const selectIsAssignmentUpdating = (state) =>
  state.assignment.updateStatus === "loading";

export const selectIsAssignmentDeleting = (state) =>
  state.assignment.deleteStatus === "loading";

export const selectIsAssignmentDownloading = (state) =>
  state.assignment.downloadStatus === "loading";

export const selectIsAssignmentStatisticsLoading = (state) =>
  state.assignment.statisticsStatus === "loading";

export const selectIsSubmissionLoading = (state) =>
  state.assignment.submissionStatus === "loading";

// Utility selector for cache hit rate
export const selectCacheHitRate = (state) => {
  const { hits, totalRequests } = state.assignment.cacheStats;
  return totalRequests > 0 ? Math.round((hits / totalRequests) * 100) : 0;
};

// Assignment file selectors
export const selectAssignmentFiles = (state, classroomCode, assignmentId) => {
  const assignments = selectAssignmentsByClassroom(state, classroomCode);
  const assignment = assignments.find(
    (m) => String(m.id) === String(assignmentId)
  );
  return assignment?.files || [];
};

export const selectAssignmentFilesByType = (
  state,
  classroomCode,
  assignmentId,
  fileType
) => {
  const files = selectAssignmentFiles(state, classroomCode, assignmentId);
  return files.filter((file) => file.type === fileType);
};

export const selectAssignmentLinks = (state, classroomCode, assignmentId) => {
  return selectAssignmentFilesByType(
    state,
    classroomCode,
    assignmentId,
    "link"
  );
};

export const selectAssignmentUploadedFiles = (
  state,
  classroomCode,
  assignmentId
) => {
  return selectAssignmentFilesByType(
    state,
    classroomCode,
    assignmentId,
    "file"
  );
};
export const selectIsFileDeleting = (state, fileId) =>
  state.assignment.deletingFileIds?.includes(fileId) || false;
export default assignmentSlice.reducer;
