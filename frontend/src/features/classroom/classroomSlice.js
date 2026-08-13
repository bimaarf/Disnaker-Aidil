import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { isEqual } from "lodash";

// Base API URL
const API_BASE_URL = process.env.REACT_APP_API;

// Cache configuration constants
const CACHE_CONFIG = {
  LIST_TIMEOUT: 2 * 60 * 1000, // 2 minutes
  DETAIL_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  TEACHERS_TIMEOUT: 10 * 60 * 1000, // 10 minutes
  STUDENTS_TIMEOUT: 10 * 60 * 1000, // 10 minutes
  POLLING_INTERVAL: 30 * 1000, // 30 seconds
};

// Cache store for teachers and students per classroom
// Structure: Map<classroomCode, { data: Array, timestamp: string, count: number }>
const teachersCache = new Map();
const studentsCache = new Map();

// Enhanced utility to update cache with validation
export const updateCache = (
  type,
  classroomCode,
  data,
  timestamp = new Date().toISOString()
) => {
  if (!classroomCode) return;

  const cache = type === "teachers" ? teachersCache : studentsCache;
  const validData = Array.isArray(data) ? data : [];
  const cacheKey = String(classroomCode); // Ensure consistent string key

  cache.set(cacheKey, {
    data: validData,
    timestamp,
    count: validData.length,
    classroomCode: classroomCode,
  });

  console.log(
    `[Cache Update] ${type} for classroom ${cacheKey}:`,
    validData.length,
    "items"
  );
};

// Enhanced utility to get cache with validation
export const getCache = (type, classroomCode) => {
  if (!classroomCode) return null;

  const cache = type === "teachers" ? teachersCache : studentsCache;
  const cacheKey = String(classroomCode); // Ensure consistent string key
  const cached = cache.get(cacheKey);

  return cached;
};

// Utility to invalidate cache
export const invalidateCacheByType = (type, classroomCode) => {
  if (!classroomCode) return;

  const cache = type === "teachers" ? teachersCache : studentsCache;
  const cacheKey = String(classroomCode); // Ensure consistent string key

  if (cache.has(cacheKey)) {
    cache.delete(cacheKey);
    console.log(`[Cache Invalidated] ${type} for classroom ${cacheKey}`);
  }
};

// Get all cached data for debugging
export const getCacheStats = () => {
  const stats = {
    teachers: {},
    students: {},
  };

  teachersCache.forEach((value, key) => {
    stats.teachers[key] = {
      count: value.count,
      timestamp: value.timestamp,
    };
  });

  studentsCache.forEach((value, key) => {
    stats.students[key] = {
      count: value.count,
      timestamp: value.timestamp,
    };
  });

  return stats;
};

// Async Thunks

// Enhanced classroom detail caching improvements

// 1. Add detail cache storage to classroomSlice.js
const detailCache = new Map(); // Add this alongside teachersCache and studentsCache

// Enhanced cache utilities for detail data
export const updateDetailCache = (
  classroomCode,
  data,
  timestamp = new Date().toISOString()
) => {
  if (!classroomCode) return;

  const cacheKey = String(classroomCode);
  detailCache.set(cacheKey, {
    data: data || {},
    timestamp,
    classroomCode,
  });

  console.log(
    `[Detail Cache Update] classroom ${cacheKey}:`,
    data?.name || "Unknown"
  );
};

export const getDetailCache = (classroomCode) => {
  if (!classroomCode) return null;

  const cacheKey = String(classroomCode);
  return detailCache.get(cacheKey);
};

export const invalidateDetailCacheByCode = (classroomCode) => {
  if (!classroomCode) return;

  const cacheKey = String(classroomCode);
  if (detailCache.has(cacheKey)) {
    detailCache.delete(cacheKey);
    console.log(`[Detail Cache Invalidated] classroom ${cacheKey}`);
  }
};

// Enhanced clear function
export const clearClassroomCache = (classroomCode) => {
  if (!classroomCode) return;

  invalidateCacheByType("teachers", classroomCode);
  invalidateCacheByType("students", classroomCode);
  invalidateDetailCacheByCode(classroomCode);
};

// 2. Update fetchClassrooms async thunk to cache detail data
export const fetchClassrooms = createAsyncThunk(
  "classroom/fetchClassrooms",
  async (params = {}, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append("page", params.page);
      if (params.per_page) queryParams.append("per_page", params.per_page);
      if (params.search && params.search.trim())
        queryParams.append("search", params.search.trim());
      if (params.status && params.status !== "all")
        queryParams.append("status", params.status);

      const response = await axios.get(
        `${API_BASE_URL}api/classrooms?${queryParams.toString()}`
      );

      if (!response.data || !response.data.data || !response.data.data.data) {
        throw new Error("Invalid response structure from server");
      }

      const classrooms = response.data.data.data;
      const timestamp = new Date().toISOString();

      classrooms.forEach((classroom) => {
        const classroomId = classroom.id;

        // Cache detail data from list
        updateDetailCache(classroomId, classroom, timestamp);

        // Update teachers and students cache
        if (classroom.teachers) {
          updateCache("teachers", classroomId, classroom.teachers, timestamp);
        }
        if (classroom.students) {
          updateCache("students", classroomId, classroom.students, timestamp);
        }
      });

      return {
        data: response.data.data,
        params,
        meta: response.data.meta || {},
      };
    } catch (error) {
      return rejectWithValue({
        message:
          error.response?.data?.message ||
          error.message ||
          "Gagal mengambil data kelas",
        status: error.response?.status,
      });
    }
  }
);

// 3. Enhanced fetchClassroomDetail to use cache first
export const fetchClassroomDetail = createAsyncThunk(
  "classroom/fetchClassroomDetail",
  async (classroomCode, { rejectWithValue }) => {
    try {
      // Check if we have fresh detail cache first
      const detailCacheData = getDetailCache(classroomCode);
      const now = new Date();

      if (detailCacheData && detailCacheData.timestamp) {
        const cacheAge = now - new Date(detailCacheData.timestamp);
        if (cacheAge < CACHE_CONFIG.DETAIL_TIMEOUT) {
          console.log(
            `[fetchClassroomDetail] Using cached data for ${classroomCode}`
          );

          // Return cached data with fresh timestamp
          const cachedResult = {
            data: {
              ...detailCacheData.data,
              teachers:
                getCache("teachers", classroomCode)?.data ||
                detailCacheData.data.teachers ||
                [],
              students:
                getCache("students", classroomCode)?.data ||
                detailCacheData.data.students ||
                [],
            },
          };

          return cachedResult;
        }
      }

      // Fetch from API if cache is stale or missing
      await axios.get("sanctum/csrf-cookie");
      const response = await axios.get(
        `${API_BASE_URL}api/classrooms/${classroomCode}`
      );

      if (response.data?.data) {
        const classroom = response.data.data;
        const timestamp = new Date().toISOString();

        // Update detail cache
        updateDetailCache(classroomCode, classroom, timestamp);

        // Update teachers and students cache
        if (Array.isArray(classroom.teachers)) {
          updateCache("teachers", classroomCode, classroom.teachers, timestamp);
        }
        if (Array.isArray(classroom.students)) {
          updateCache("students", classroomCode, classroom.students, timestamp);
        }
      }

      return response.data;
    } catch (error) {
      return rejectWithValue({
        message:
          error.response?.data?.message || "Gagal mengambil detail kelas",
        status: error.response?.status,
      });
    }
  }
);

// 5. Enhanced selector for current classroom with cache fallback
export const selectCurrentClassroomWithCache = (state, classroomCode) => {
  const currentClassroom = state.classroom.currentClassroom;

  // If we have current classroom and it matches, return it
  if (
    currentClassroom &&
    getClassroomIdentifier(currentClassroom) === classroomCode
  ) {
    return updateClassroomWithCache(currentClassroom);
  }

  // Try to get from detail cache
  const detailCacheData = getDetailCache(classroomCode);
  if (detailCacheData) {
    return updateClassroomWithCache(detailCacheData.data);
  }

  // Fallback to classroom from list
  const classroom = state.classroom.classrooms.find(
    (c) => getClassroomIdentifier(c) === classroomCode
  );

  return classroom ? updateClassroomWithCache(classroom) : null;
};

export const createClassroom = createAsyncThunk(
  "classroom/createClassroom",
  async (classroomData, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const response = await axios.post(
        `${API_BASE_URL}api/classrooms`,
        classroomData
      );

      // Initialize empty cache for new classroom
      const newClassroomId = response.data.data.id;
      updateCache("teachers", newClassroomId, []);
      updateCache("students", newClassroomId, []);

      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || "Gagal membuat kelas",
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
    }
  }
);

export const updateClassroom = createAsyncThunk(
  "classroom/updateClassroom",
  async ({ classroomCode, classroomData }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const response = await axios.put(
        `${API_BASE_URL}api/classrooms/${classroomCode}`,
        classroomData
      );
      return {
        data: response.data.data || response.data,
        classroomCode,
      };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || "Gagal mengupdate kelas",
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
    }
  }
);

export const deleteClassroom = createAsyncThunk(
  "classroom/deleteClassroom",
  async (classroomCode, { rejectWithValue, dispatch }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const response = await axios.delete(
        `${API_BASE_URL}api/classrooms/${classroomCode}`
      );

      // Clear cache on delete
      clearClassroomCache(classroomCode);
      dispatch(invalidateCache({ type: "list" }));

      return { data: response.data, classroomCode };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || "Gagal menghapus kelas",
        status: error.response?.status,
      });
    }
  }
);

export const fetchAvailableTeachers = createAsyncThunk(
  "classroom/fetchAvailableTeachers",
  async ({ classroomCode, search = "" }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);

      const response = await axios.get(
        `${API_BASE_URL}api/classrooms/${classroomCode}/available-teachers?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || "Gagal mengambil data guru",
        status: error.response?.status,
      });
    }
  }
);

export const addTeacher = createAsyncThunk(
  "classroom/addTeacher",
  async ({ classroomCode, teacherId }, { rejectWithValue, dispatch }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const response = await axios.post(
        `${API_BASE_URL}api/classrooms/${classroomCode}/teachers`,
        { teacher_id: teacherId }
      );

      // Update teacher cache for this specific classroom
      const currentCache = getCache("teachers", classroomCode);
      const currentTeachers = currentCache?.data || [];
      const newTeacher = response.data.data;

      // Add new teacher to cache
      const updatedTeachers = [...currentTeachers, newTeacher];
      updateCache("teachers", classroomCode, updatedTeachers);

      dispatch(invalidateCache({ type: "detail", classroomCode }));
      return { ...response.data, classroomCode };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || "Gagal menambahkan guru",
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
    }
  }
);

export const removeTeacher = createAsyncThunk(
  "classroom/removeTeacher",
  async ({ classroomCode, teacherId }, { rejectWithValue, dispatch }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const response = await axios.delete(
        `${API_BASE_URL}api/classrooms/${classroomCode}/teachers/${teacherId}`
      );

      // Update teacher cache for this specific classroom
      const currentCache = getCache("teachers", classroomCode);
      if (currentCache?.data) {
        const updatedTeachers = currentCache.data.filter(
          (t) => t.id !== teacherId
        );
        updateCache("teachers", classroomCode, updatedTeachers);
      }

      dispatch(invalidateCache({ type: "detail", classroomCode }));
      return { data: response.data, teacherId, classroomCode };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || "Gagal menghapus guru",
        status: error.response?.status,
      });
    }
  }
);

export const fetchAvailableStudents = createAsyncThunk(
  "classroom/fetchAvailableStudents",
  async ({ classroomCode, search = "" }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);

      const response = await axios.get(
        `${API_BASE_URL}api/classrooms/${classroomCode}/available-students?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || "Gagal mengambil data siswa",
        status: error.response?.status,
      });
    }
  }
);

export const addStudent = createAsyncThunk(
  "classroom/addStudent",
  async ({ classroomCode, studentId }, { rejectWithValue, dispatch }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const response = await axios.post(
        `${API_BASE_URL}api/classrooms/${classroomCode}/students`,
        { student_id: studentId }
      );

      // Update student cache for this specific classroom
      const currentCache = getCache("students", classroomCode);
      const currentStudents = currentCache?.data || [];
      const newStudent = response.data.data;

      // Add new student to cache
      const updatedStudents = [...currentStudents, newStudent];
      updateCache("students", classroomCode, updatedStudents);

      dispatch(invalidateCache({ type: "detail", classroomCode }));
      return { ...response.data, classroomCode };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || "Gagal menambahkan siswa",
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
    }
  }
);

export const addMultipleStudents = createAsyncThunk(
  "classroom/addMultipleStudents",
  async ({ classroomCode, studentIds }, { rejectWithValue, dispatch }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const response = await axios.post(
        `${API_BASE_URL}api/classrooms/${classroomCode}/students/bulk`,
        { student_ids: studentIds }
      );

      // Update student cache for this specific classroom
      const currentCache = getCache("students", classroomCode);
      const currentStudents = currentCache?.data || [];
      const newStudents = response.data.data;

      // Add new students to cache
      const updatedStudents = [...currentStudents, ...newStudents];
      updateCache("students", classroomCode, updatedStudents);

      dispatch(invalidateCache({ type: "detail", classroomCode }));
      return { ...response.data, classroomCode };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || "Gagal menambahkan siswa",
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
    }
  }
);

export const removeStudent = createAsyncThunk(
  "classroom/removeStudent",
  async ({ classroomCode, studentId }, { rejectWithValue, dispatch }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const response = await axios.delete(
        `${API_BASE_URL}api/classrooms/${classroomCode}/students/${studentId}`
      );

      // Update student cache for this specific classroom
      const currentCache = getCache("students", classroomCode);
      if (currentCache?.data) {
        const updatedStudents = currentCache.data.filter(
          (s) => s.id !== studentId
        );
        updateCache("students", classroomCode, updatedStudents);
      }

      dispatch(invalidateCache({ type: "detail", classroomCode }));
      return { data: response.data, studentId, classroomCode };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || "Gagal menghapus siswa",
        status: error.response?.status,
      });
    }
  }
);

export const updateStudentStatus = createAsyncThunk(
  "classroom/updateStudentStatus",
  async (
    { classroomCode, studentId, status },
    { rejectWithValue, dispatch }
  ) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const response = await axios.put(
        `${API_BASE_URL}api/classrooms/${classroomCode}/students/${studentId}`,
        { status }
      );

      // Update student cache for this specific classroom
      const currentCache = getCache("students", classroomCode);
      if (currentCache?.data) {
        const updatedStudents = currentCache.data.map((s) =>
          s.id === studentId ? { ...s, status } : s
        );
        updateCache("students", classroomCode, updatedStudents);
      }

      dispatch(invalidateCache({ type: "detail", classroomCode }));
      return { ...response.data, classroomCode };
    } catch (error) {
      return rejectWithValue({
        message:
          error.response?.data?.message || "Gagal mengupdate status siswa",
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
    }
  }
);

// Initial state
const initialState = {
  classrooms: [],
  currentClassroom: null,
  availableTeachers: [],
  availableStudents: [],
  pagination: {
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
    from: null,
    to: null,
    hasMorePages: false,
    prevPageUrl: null,
    nextPageUrl: null,
  },
  viewMode: "grid",
  searchTerm: "",
  filters: {
    status: "all",
    dateFrom: null,
    dateTo: null,
  },
  status: "idle",
  detailStatus: "idle",
  createStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  teacherStatus: "idle",
  studentStatus: "idle",
  error: null,
  validationErrors: null,
  lastUpdated: null,
  cacheMetadata: {
    listLastFetch: null,
    detailLastFetch: null,
    teachersLastFetch: {}, // Per classroom
    studentsLastFetch: {}, // Per classroom
  },
};

// Helper function to safely get classroom identifier
const getClassroomIdentifier = (classroom) => {
  return classroom.id || classroom.code;
};

// Helper function to update classroom data with cache
const updateClassroomWithCache = (classroom) => {
  const classroomId = getClassroomIdentifier(classroom);
  const teacherCache = getCache("teachers", classroomId);
  const studentCache = getCache("students", classroomId);

  return {
    ...classroom,
    teachers: teacherCache?.data || classroom.teachers || [],
    students: studentCache?.data || classroom.students || [],
    teacher_count: teacherCache?.count || classroom.teacher_count || 0,
    student_count: studentCache?.count || classroom.student_count || 0,
  };
};

// Classroom slice
const classroomSlice = createSlice({
  name: "classroom",
  initialState,
  reducers: {
    resetClassroomState: () => {
      teachersCache.clear();
      studentsCache.clear();
      return initialState;
    },
    resetCurrentClassroom: (state) => {
      state.currentClassroom = null;
      state.detailStatus = "idle";
      state.error = null;
      state.cacheMetadata.detailLastFetch = null;
    },
    resetStatus: (state) => {
      state.status = "idle";
      state.createStatus = "idle";
      state.updateStatus = "idle";
      state.deleteStatus = "idle";
      state.teacherStatus = "idle";
      state.studentStatus = "idle";
      state.error = null;
      state.validationErrors = null;
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
      state.pagination.currentPage = 1;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1;
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.searchTerm = "";
      state.pagination.currentPage = 1;
    },
    setCurrentPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
    setPerPage: (state, action) => {
      state.pagination.perPage = action.payload;
      state.pagination.currentPage = 1;
    },
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    clearErrors: (state) => {
      state.error = null;
      state.validationErrors = null;
    },
    updateClassroomInList: (state, action) => {
      const { classroomData } = action.payload;
      const classroomId = getClassroomIdentifier(classroomData);
      const index = state.classrooms.findIndex(
        (c) => getClassroomIdentifier(c) === classroomId
      );

      if (index !== -1) {
        // Merge dengan data existing untuk preserve teachers/students
        const existingClassroom = state.classrooms[index];
        const mergedData = {
          ...existingClassroom,
          ...classroomData,
          teachers: classroomData.teachers || existingClassroom.teachers || [],
          students: classroomData.students || existingClassroom.students || [],
          teacher_count:
            classroomData.teacher_count !== undefined
              ? classroomData.teacher_count
              : existingClassroom.teacher_count || 0,
          student_count:
            classroomData.student_count !== undefined
              ? classroomData.student_count
              : existingClassroom.student_count || 0,
        };

        state.classrooms[index] = updateClassroomWithCache(mergedData);

        // Update detail cache juga
        const timestamp = new Date().toISOString();
        updateDetailCache(classroomId, mergedData, timestamp);
      }

      // Update current classroom jika sama
      if (
        state.currentClassroom &&
        getClassroomIdentifier(state.currentClassroom) === classroomId
      ) {
        const mergedCurrentData = {
          ...state.currentClassroom,
          ...classroomData,
          teachers:
            classroomData.teachers || state.currentClassroom.teachers || [],
          students:
            classroomData.students || state.currentClassroom.students || [],
        };

        state.currentClassroom = updateClassroomWithCache(mergedCurrentData);

        // Update detail cache
        const timestamp = new Date().toISOString();
        updateDetailCache(classroomId, mergedCurrentData, timestamp);
      }

      state.lastUpdated = new Date().toISOString();
    },
    removeClassroomFromList: (state, action) => {
      const { classroomCode } = action.payload;
      state.classrooms = state.classrooms.filter(
        (c) => getClassroomIdentifier(c) !== classroomCode
      );
      state.pagination.total = Math.max(0, state.pagination.total - 1);

      if (
        state.currentClassroom &&
        getClassroomIdentifier(state.currentClassroom) === classroomCode
      ) {
        state.currentClassroom = null;
      }

      // Clear cache for removed classroom
      clearClassroomCache(classroomCode);
    },
    updateCurrentClassroom: (state, action) => {
      const { classroomData } = action.payload;
      if (state.currentClassroom) {
        const classroomId = getClassroomIdentifier(classroomData);

        state.currentClassroom = updateClassroomWithCache({
          ...state.currentClassroom,
          ...classroomData,
        });

        const index = state.classrooms.findIndex(
          (c) => getClassroomIdentifier(c) === classroomId
        );
        if (index !== -1) {
          state.classrooms[index] = {
            ...state.classrooms[index],
            ...state.currentClassroom,
          };
        }
      }
    },
    updateClassroomTeachersAndStudents: (state, action) => {
      const {
        classroomCode,
        teachers,
        students,
        teacher_count,
        student_count,
      } = action.payload;

      // Update cache first
      if (teachers !== undefined) {
        updateCache("teachers", classroomCode, teachers);
      }
      if (students !== undefined) {
        updateCache("students", classroomCode, students);
      }

      // Update in classrooms list
      const index = state.classrooms.findIndex(
        (c) => getClassroomIdentifier(c) === classroomCode
      );
      if (index !== -1) {
        if (teachers !== undefined) {
          state.classrooms[index].teachers = teachers;
          state.classrooms[index].teacher_count =
            teacher_count || teachers.length;
        }
        if (students !== undefined) {
          state.classrooms[index].students = students;
          state.classrooms[index].student_count =
            student_count || students.length;
        }
      }

      // Update current classroom
      if (
        state.currentClassroom &&
        getClassroomIdentifier(state.currentClassroom) === classroomCode
      ) {
        if (teachers !== undefined) {
          state.currentClassroom.teachers = teachers;
          state.currentClassroom.teacher_count =
            teacher_count || teachers.length;
        }
        if (students !== undefined) {
          state.currentClassroom.students = students;
          state.currentClassroom.student_count =
            student_count || students.length;
        }
      }

      state.lastUpdated = new Date().toISOString();
    },
    invalidateCache: (state, action) => {
      const { type, classroomCode } = action.payload || {};

      if (type === "list" || !type) {
        state.cacheMetadata.listLastFetch = null;
      }
      if (type === "detail" || !type) {
        state.cacheMetadata.detailLastFetch = null;
      }
      if (type === "teachers" || !type) {
        if (classroomCode) {
          state.cacheMetadata.teachersLastFetch[classroomCode] = null;
          invalidateCacheByType("teachers", classroomCode);
        } else {
          state.cacheMetadata.teachersLastFetch = {};
          teachersCache.clear();
        }
      }
      if (type === "students" || !type) {
        if (classroomCode) {
          state.cacheMetadata.studentsLastFetch[classroomCode] = null;
          invalidateCacheByType("students", classroomCode);
        } else {
          state.cacheMetadata.studentsLastFetch = {};
          studentsCache.clear();
        }
      }
    },
    optimisticCreateClassroom: (state, action) => {
      const { tempId, classroomData } = action.payload;
      const optimisticClassroom = {
        ...classroomData,
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        teacher_count: 0,
        student_count: 0,
        teachers: [],
        students: [],
        _isOptimistic: true,
      };

      state.classrooms.unshift(optimisticClassroom);
      state.pagination.total += 1;

      if (
        state.pagination.currentPage === 1 &&
        state.classrooms.length > state.pagination.perPage
      ) {
        state.classrooms = state.classrooms.slice(0, state.pagination.perPage);
      }

      state.pagination.lastPage = Math.ceil(
        state.pagination.total / state.pagination.perPage
      );

      // Initialize empty cache for optimistic classroom
      updateCache("teachers", tempId, []);
      updateCache("students", tempId, []);
    },
    replaceOptimisticClassroom: (state, action) => {
      const { tempId, realClassroom } = action.payload;
      const index = state.classrooms.findIndex(
        (c) => c.id === tempId && c._isOptimistic
      );

      if (index !== -1) {
        state.classrooms[index] = {
          ...realClassroom,
          _isOptimistic: false,
        };

        // Transfer cache from tempId to realId
        const realClassroomId = getClassroomIdentifier(realClassroom);
        const tempTeacherCache = getCache("teachers", tempId);
        const tempStudentCache = getCache("students", tempId);

        if (tempTeacherCache) {
          updateCache("teachers", realClassroomId, tempTeacherCache.data);
          invalidateCacheByType("teachers", tempId);
        }
        if (tempStudentCache) {
          updateCache("students", realClassroomId, tempStudentCache.data);
          invalidateCacheByType("students", tempId);
        }
      }
    },
    revertOptimisticClassroom: (state, action) => {
      const { tempId } = action.payload;
      state.classrooms = state.classrooms.filter(
        (c) => !(c.id === tempId && c._isOptimistic)
      );
      state.pagination.total = Math.max(0, state.pagination.total - 1);
      state.pagination.lastPage = Math.ceil(
        state.pagination.total / state.pagination.perPage
      );

      // Clear cache for optimistic classroom
      clearClassroomCache(tempId);
    },
    addClassroomToList: (state, action) => {
      const { classroomData, position = "start" } = action.payload;
      const classroomId = getClassroomIdentifier(classroomData);

      const existingIndex = state.classrooms.findIndex(
        (c) => getClassroomIdentifier(c) === classroomId
      );
      if (existingIndex !== -1) {
        return;
      }

      if (position === "start") {
        state.classrooms.unshift(classroomData);
      } else {
        state.classrooms.push(classroomData);
      }

      state.pagination.total += 1;

      if (state.pagination.currentPage === 1 && position === "start") {
        if (state.classrooms.length > state.pagination.perPage) {
          state.classrooms = state.classrooms.slice(
            0,
            state.pagination.perPage
          );
        }
      }

      state.pagination.lastPage = Math.ceil(
        state.pagination.total / state.pagination.perPage
      );
      state.lastUpdated = new Date().toISOString();

      // Initialize cache for new classroom
      updateCache("teachers", classroomId, classroomData.teachers || []);
      updateCache("students", classroomId, classroomData.students || []);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Classrooms
      .addCase(fetchClassrooms.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchClassrooms.fulfilled, (state, action) => {
        state.status = "succeeded";
        const { data, params } = action.payload;

        if (data && data.data && Array.isArray(data.data)) {
          let classrooms = data.data;

          // Update each classroom with cache data
          classrooms = classrooms.map((classroom) =>
            updateClassroomWithCache(classroom)
          );

          if (params.page && params.page > 1) {
            state.classrooms = [...state.classrooms, ...classrooms];
          } else {
            state.classrooms = classrooms;
          }

          state.pagination = {
            currentPage: data.current_page || 1,
            lastPage: data.last_page || 1,
            perPage: data.per_page || 10,
            total: data.total || 0,
            from: data.from,
            to: data.to,
            hasMorePages: data.has_more_pages || false,
            prevPageUrl: data.prev_page_url,
            nextPageUrl: data.next_page_url,
          };

          // Update cache for each classroom
          data.data.forEach((classroom) => {
            const classroomId = getClassroomIdentifier(classroom);
            if (classroom.teachers) {
              updateCache("teachers", classroomId, classroom.teachers);
            }
            if (classroom.students) {
              updateCache("students", classroomId, classroom.students);
            }
          });
        } else {
          state.error = "Format data tidak valid dari server";
          state.status = "failed";
          return;
        }

        const now = new Date().toISOString();
        state.lastUpdated = now;
        state.cacheMetadata.listLastFetch = now;
      })
      .addCase(fetchClassrooms.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Gagal mengambil data kelas";
      })
      // Fetch Classroom Detail
      .addCase(fetchClassroomDetail.pending, (state) => {
        state.detailStatus = "loading";
        state.error = null;
      })
      .addCase(fetchClassroomDetail.fulfilled, (state, action) => {
        state.detailStatus = "succeeded";
        const data = action.payload?.data;

        if (data) {
          const classroom = data;
          const classroomId = getClassroomIdentifier(classroom);

          const currentClassroomData = updateClassroomWithCache(classroom);

          if (!isEqual(state.currentClassroom, currentClassroomData)) {
            state.currentClassroom = currentClassroomData;
          }

          const index = state.classrooms.findIndex(
            (c) => getClassroomIdentifier(c) === classroomId
          );
          if (
            index !== -1 &&
            !isEqual(state.classrooms[index], currentClassroomData)
          ) {
            state.classrooms[index] = {
              ...state.classrooms[index],
              ...currentClassroomData,
            };
          }

          const now = new Date().toISOString();
          state.lastUpdated = now;
          state.cacheMetadata.detailLastFetch = now;

          if (classroom.teachers && Array.isArray(classroom.teachers)) {
            updateCache("teachers", classroomId, classroom.teachers, now);
            state.cacheMetadata.teachersLastFetch[classroomId] = now;
          }
          if (classroom.students && Array.isArray(classroom.students)) {
            updateCache("students", classroomId, classroom.students, now);
            state.cacheMetadata.studentsLastFetch[classroomId] = now;
          }
        }
      })
      .addCase(fetchClassroomDetail.rejected, (state, action) => {
        state.detailStatus = "failed";
        state.error = action.payload?.message || "Gagal mengambil detail kelas";
      })
      // Create Classroom
      .addCase(createClassroom.pending, (state) => {
        state.createStatus = "loading";
        state.error = null;
        state.validationErrors = null;
      })
      .addCase(createClassroom.fulfilled, (state) => {
        state.createStatus = "succeeded";
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(createClassroom.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error = action.payload?.message || "Gagal membuat kelas";
        state.validationErrors = action.payload?.errors;
      })
      // Update Classroom
      .addCase(updateClassroom.pending, (state) => {
        state.updateStatus = "loading";
        state.error = null;
        state.validationErrors = null;
      })
      .addCase(updateClassroom.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        const { data, classroomCode } = action.payload;
        const updatedClassroom = data;

        // Update detail cache dengan data terbaru
        const timestamp = new Date().toISOString();
        updateDetailCache(classroomCode, updatedClassroom, timestamp);

        // Update classroom di list
        const index = state.classrooms.findIndex(
          (c) => getClassroomIdentifier(c) === classroomCode
        );
        if (index !== -1) {
          state.classrooms[index] = updateClassroomWithCache({
            ...state.classrooms[index],
            ...updatedClassroom,
          });
        }

        if (
          state.currentClassroom &&
          getClassroomIdentifier(state.currentClassroom) === classroomCode
        ) {
          state.currentClassroom = updateClassroomWithCache({
            ...state.currentClassroom,
            ...updatedClassroom,
          });
        }

        // Update cache metadata
        state.lastUpdated = timestamp;
        state.cacheMetadata.detailLastFetch = timestamp;
        state.cacheMetadata.listLastFetch = timestamp;
      })
      .addCase(updateClassroom.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error = action.payload?.message || "Gagal mengupdate kelas";
        state.validationErrors = action.payload?.errors;
      })
      // Delete Classroom
      .addCase(deleteClassroom.pending, (state) => {
        state.deleteStatus = "loading";
        state.error = null;
      })
      .addCase(deleteClassroom.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        const { classroomCode } = action.payload;
        state.classrooms = state.classrooms.filter(
          (c) => getClassroomIdentifier(c) !== classroomCode
        );
        state.pagination.total = Math.max(0, state.pagination.total - 1);

        if (
          state.currentClassroom &&
          getClassroomIdentifier(state.currentClassroom) === classroomCode
        ) {
          state.currentClassroom = null;
        }

        state.lastUpdated = new Date().toISOString();
      })
      .addCase(deleteClassroom.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error = action.payload?.message || "Gagal menghapus kelas";
      })
      // Fetch Available Teachers
      .addCase(fetchAvailableTeachers.pending, (state) => {
        state.teacherStatus = "loading";
      })
      .addCase(fetchAvailableTeachers.fulfilled, (state, action) => {
        state.teacherStatus = "succeeded";
        state.availableTeachers = action.payload.data;
      })
      .addCase(fetchAvailableTeachers.rejected, (state, action) => {
        state.teacherStatus = "failed";
        state.error = action.payload?.message;
      })
      // Add Teacher
      .addCase(addTeacher.pending, (state) => {
        state.teacherStatus = "loading";
        state.error = null;
        state.validationErrors = null;
      })
      .addCase(addTeacher.fulfilled, (state, action) => {
        state.teacherStatus = "succeeded";
        const { data, classroomCode } = action.payload;
        const newTeacher = data;

        // Get updated cache data
        const teacherCache = getCache("teachers", classroomCode);

        // Update in classrooms list
        const classroomIndex = state.classrooms.findIndex(
          (c) => getClassroomIdentifier(c) === classroomCode
        );
        if (classroomIndex !== -1) {
          state.classrooms[classroomIndex].teachers = teacherCache?.data || [];
          state.classrooms[classroomIndex].teacher_count =
            teacherCache?.count || 0;
        }

        // Update current classroom
        if (
          state.currentClassroom &&
          getClassroomIdentifier(state.currentClassroom) === classroomCode
        ) {
          state.currentClassroom.teachers = teacherCache?.data || [];
          state.currentClassroom.teacher_count = teacherCache?.count || 0;
        }

        // Remove from available teachers
        state.availableTeachers = state.availableTeachers.filter(
          (t) => t.id !== newTeacher.id
        );

        state.lastUpdated = new Date().toISOString();
        state.cacheMetadata.teachersLastFetch[classroomCode] =
          new Date().toISOString();
      })
      .addCase(addTeacher.rejected, (state, action) => {
        state.teacherStatus = "failed";
        state.error = action.payload?.message;
        state.validationErrors = action.payload?.errors;
      })
      // Remove Teacher
      .addCase(removeTeacher.pending, (state) => {
        state.teacherStatus = "loading";
        state.error = null;
      })
      .addCase(removeTeacher.fulfilled, (state, action) => {
        state.teacherStatus = "succeeded";
        const { classroomCode } = action.payload;

        // Get updated cache data
        const teacherCache = getCache("teachers", classroomCode);

        // Update in classrooms list
        const classroomIndex = state.classrooms.findIndex(
          (c) => getClassroomIdentifier(c) === classroomCode
        );
        if (classroomIndex !== -1) {
          state.classrooms[classroomIndex].teachers = teacherCache?.data || [];
          state.classrooms[classroomIndex].teacher_count =
            teacherCache?.count || 0;
        }

        // Update current classroom
        if (
          state.currentClassroom &&
          getClassroomIdentifier(state.currentClassroom) === classroomCode
        ) {
          state.currentClassroom.teachers = teacherCache?.data || [];
          state.currentClassroom.teacher_count = teacherCache?.count || 0;
        }

        state.lastUpdated = new Date().toISOString();
        state.cacheMetadata.teachersLastFetch[classroomCode] =
          new Date().toISOString();
      })
      .addCase(removeTeacher.rejected, (state, action) => {
        state.teacherStatus = "failed";
        state.error = action.payload?.message;
      })
      // Fetch Available Students
      .addCase(fetchAvailableStudents.pending, (state) => {
        state.studentStatus = "loading";
      })
      .addCase(fetchAvailableStudents.fulfilled, (state, action) => {
        state.studentStatus = "succeeded";
        state.availableStudents = action.payload.data;
      })
      .addCase(fetchAvailableStudents.rejected, (state, action) => {
        state.studentStatus = "failed";
        state.error = action.payload?.message;
      })
      // Add Student
      .addCase(addStudent.pending, (state) => {
        state.studentStatus = "loading";
        state.error = null;
        state.validationErrors = null;
      })
      .addCase(addStudent.fulfilled, (state, action) => {
        state.studentStatus = "succeeded";
        const { data, classroomCode } = action.payload;
        const newStudent = data;

        // Get updated cache data
        const studentCache = getCache("students", classroomCode);

        // Update in classrooms list
        const classroomIndex = state.classrooms.findIndex(
          (c) => getClassroomIdentifier(c) === classroomCode
        );
        if (classroomIndex !== -1) {
          state.classrooms[classroomIndex].students = studentCache?.data || [];
          state.classrooms[classroomIndex].student_count =
            studentCache?.count || 0;
        }

        // Update current classroom
        if (
          state.currentClassroom &&
          getClassroomIdentifier(state.currentClassroom) === classroomCode
        ) {
          state.currentClassroom.students = studentCache?.data || [];
          state.currentClassroom.student_count = studentCache?.count || 0;
        }

        // Remove from available students
        state.availableStudents = state.availableStudents.filter(
          (s) => s.id !== newStudent.id
        );

        state.lastUpdated = new Date().toISOString();
        state.cacheMetadata.studentsLastFetch[classroomCode] =
          new Date().toISOString();
      })
      .addCase(addStudent.rejected, (state, action) => {
        state.studentStatus = "failed";
        state.error = action.payload?.message;
        state.validationErrors = action.payload?.errors;
      })
      // Add Multiple Students
      .addCase(addMultipleStudents.pending, (state) => {
        state.studentStatus = "loading";
        state.error = null;
        state.validationErrors = null;
      })
      .addCase(addMultipleStudents.fulfilled, (state, action) => {
        state.studentStatus = "succeeded";
        const { data, classroomCode } = action.payload;

        // Get updated cache data
        const studentCache = getCache("students", classroomCode);

        // Update in classrooms list
        const classroomIndex = state.classrooms.findIndex(
          (c) => getClassroomIdentifier(c) === classroomCode
        );
        if (classroomIndex !== -1) {
          state.classrooms[classroomIndex].students = studentCache?.data || [];
          state.classrooms[classroomIndex].student_count =
            studentCache?.count || 0;
        }

        // Update current classroom
        if (
          state.currentClassroom &&
          getClassroomIdentifier(state.currentClassroom) === classroomCode
        ) {
          state.currentClassroom.students = studentCache?.data || [];
          state.currentClassroom.student_count = studentCache?.count || 0;
        }

        // Remove added students from available
        const addedIds = data.map((s) => s.id);
        state.availableStudents = state.availableStudents.filter(
          (s) => !addedIds.includes(s.id)
        );

        state.lastUpdated = new Date().toISOString();
        state.cacheMetadata.studentsLastFetch[classroomCode] =
          new Date().toISOString();
      })
      .addCase(addMultipleStudents.rejected, (state, action) => {
        state.studentStatus = "failed";
        state.error = action.payload?.message;
        state.validationErrors = action.payload?.errors;
      })
      // Remove Student
      .addCase(removeStudent.pending, (state) => {
        state.studentStatus = "loading";
        state.error = null;
      })
      .addCase(removeStudent.fulfilled, (state, action) => {
        state.studentStatus = "succeeded";
        const { classroomCode } = action.payload;

        // Get updated cache data
        const studentCache = getCache("students", classroomCode);

        // Update in classrooms list
        const classroomIndex = state.classrooms.findIndex(
          (c) => getClassroomIdentifier(c) === classroomCode
        );
        if (classroomIndex !== -1) {
          state.classrooms[classroomIndex].students = studentCache?.data || [];
          state.classrooms[classroomIndex].student_count =
            studentCache?.count || 0;
        }

        // Update current classroom
        if (
          state.currentClassroom &&
          getClassroomIdentifier(state.currentClassroom) === classroomCode
        ) {
          state.currentClassroom.students = studentCache?.data || [];
          state.currentClassroom.student_count = studentCache?.count || 0;
        }

        state.lastUpdated = new Date().toISOString();
        state.cacheMetadata.studentsLastFetch[classroomCode] =
          new Date().toISOString();
      })
      .addCase(removeStudent.rejected, (state, action) => {
        state.studentStatus = "failed";
        state.error = action.payload?.message;
      })
      // Update Student Status
      .addCase(updateStudentStatus.pending, (state) => {
        state.studentStatus = "loading";
        state.error = null;
        state.validationErrors = null;
      })
      .addCase(updateStudentStatus.fulfilled, (state, action) => {
        state.studentStatus = "succeeded";
        const { classroomCode } = action.payload;

        // Get updated cache data
        const studentCache = getCache("students", classroomCode);

        // Update in classrooms list
        const classroomIndex = state.classrooms.findIndex(
          (c) => getClassroomIdentifier(c) === classroomCode
        );
        if (classroomIndex !== -1) {
          state.classrooms[classroomIndex].students = studentCache?.data || [];
        }

        // Update current classroom
        if (
          state.currentClassroom &&
          getClassroomIdentifier(state.currentClassroom) === classroomCode
        ) {
          state.currentClassroom.students = studentCache?.data || [];
        }

        state.lastUpdated = new Date().toISOString();
        state.cacheMetadata.studentsLastFetch[classroomCode] =
          new Date().toISOString();
      })
      .addCase(updateStudentStatus.rejected, (state, action) => {
        state.studentStatus = "failed";
        state.error = action.payload?.message;
        state.validationErrors = action.payload?.errors;
      });
  },
});

// Export actions
export const {
  resetClassroomState,
  resetCurrentClassroom,
  resetStatus,
  setSearchTerm,
  setFilters,
  resetFilters,
  setCurrentPage,
  setPerPage,
  setViewMode,
  clearErrors,
  updateClassroomInList,
  removeClassroomFromList,
  updateCurrentClassroom,
  updateClassroomTeachersAndStudents,
  invalidateCache,
  optimisticCreateClassroom,
  replaceOptimisticClassroom,
  revertOptimisticClassroom,
  addClassroomToList,
} = classroomSlice.actions;
export const syncAllCacheAfterUpdate = (classroomCode, updatedData) => {
  const timestamp = new Date().toISOString();

  // Update detail cache
  updateDetailCache(classroomCode, updatedData, timestamp);

  // Preserve existing teachers/students di cache
  const existingTeachers = getCache("teachers", classroomCode);
  const existingStudents = getCache("students", classroomCode);

  if (existingTeachers?.data) {
    updateCache("teachers", classroomCode, existingTeachers.data, timestamp);
  }
  if (existingStudents?.data) {
    updateCache("students", classroomCode, existingStudents.data, timestamp);
  }

  return updatedData;
};
// Enhanced Selectors
export const selectClassrooms = (state) => state.classroom.classrooms;
export const selectCurrentClassroom = (state) =>
  state.classroom.currentClassroom;

// Enhanced selectors for teachers and students per classroom
export const selectClassroomTeachers = (state, classroomCode) => {
  if (!classroomCode) return [];

  // First check cache
  const cache = getCache("teachers", classroomCode);
  if (cache?.data) {
    return cache.data;
  }

  // Then check current classroom
  if (
    state.classroom.currentClassroom &&
    getClassroomIdentifier(state.classroom.currentClassroom) === classroomCode
  ) {
    return state.classroom.currentClassroom.teachers || [];
  }

  // Finally check classrooms list
  const classroom = state.classroom.classrooms.find(
    (c) => getClassroomIdentifier(c) === classroomCode
  );
  return classroom?.teachers || [];
};

export const selectClassroomStudents = (state, classroomCode) => {
  if (!classroomCode) return [];

  // First check cache
  const cache = getCache("students", classroomCode);
  if (cache?.data) {
    return cache.data;
  }

  // Then check current classroom
  if (
    state.classroom.currentClassroom &&
    getClassroomIdentifier(state.classroom.currentClassroom) === classroomCode
  ) {
    return state.classroom.currentClassroom.students || [];
  }

  // Finally check classrooms list
  const classroom = state.classroom.classrooms.find(
    (c) => getClassroomIdentifier(c) === classroomCode
  );
  return classroom?.students || [];
};

export const selectAvailableTeachers = (state) =>
  state.classroom.availableTeachers;
export const selectAvailableStudents = (state) =>
  state.classroom.availableStudents;
export const selectClassroomStatus = (state) => state.classroom.status;
export const selectDetailStatus = (state) => state.classroom.detailStatus;
export const selectCreateStatus = (state) => state.classroom.createStatus;
export const selectUpdateStatus = (state) => state.classroom.updateStatus;
export const selectDeleteStatus = (state) => state.classroom.deleteStatus;
export const selectTeacherStatus = (state) => state.classroom.teacherStatus;
export const selectStudentStatus = (state) => state.classroom.studentStatus;
export const selectClassroomError = (state) => state.classroom.error;
export const selectValidationErrors = (state) =>
  state.classroom.validationErrors;
export const selectSearchTerm = (state) => state.classroom.searchTerm;
export const selectFilters = (state) => state.classroom.filters;
export const selectViewMode = (state) => state.classroom.viewMode;
export const selectPagination = (state) => state.classroom.pagination;
export const selectIsLoading = (state) => state.classroom.status === "loading";
export const selectIsLoadingDetail = (state) =>
  state.classroom.detailStatus === "loading";
export const selectIsCreating = (state) =>
  state.classroom.createStatus === "loading";
export const selectIsUpdating = (state) =>
  state.classroom.updateStatus === "loading";
export const selectIsDeleting = (state) =>
  state.classroom.deleteStatus === "loading";
export const selectIsLoadingTeachers = (state) =>
  state.classroom.teacherStatus === "loading";
export const selectIsLoadingStudents = (state) =>
  state.classroom.studentStatus === "loading";
export const selectCanLoadMore = (state) => {
  const pagination = state.classroom.pagination;
  return pagination.currentPage < pagination.lastPage;
};
export const selectLastUpdated = (state) => state.classroom.lastUpdated;
export const selectCacheMetadata = (state) => state.classroom.cacheMetadata;

// Enhanced cache staleness selectors
export const selectIsListStale = (
  state,
  maxAge = CACHE_CONFIG.LIST_TIMEOUT
) => {
  if (!state.classroom.cacheMetadata.listLastFetch) return true;
  return (
    new Date() - new Date(state.classroom.cacheMetadata.listLastFetch) > maxAge
  );
};

export const selectIsDetailStale = (
  state,
  maxAge = CACHE_CONFIG.DETAIL_TIMEOUT
) => {
  if (!state.classroom.cacheMetadata.detailLastFetch) return true;
  return (
    new Date() - new Date(state.classroom.cacheMetadata.detailLastFetch) >
    maxAge
  );
};

export const selectIsTeachersStale = (
  state,
  classroomCode,
  maxAge = CACHE_CONFIG.TEACHERS_TIMEOUT
) => {
  if (!classroomCode) return true;

  // Check cache timestamp
  const cache = getCache("teachers", classroomCode);
  if (!cache?.timestamp) return true;

  // Also check metadata timestamp
  const metadataTimestamp =
    state.classroom.cacheMetadata.teachersLastFetch[classroomCode];
  const cacheTimestamp = cache.timestamp;
  const latestTimestamp =
    metadataTimestamp && cacheTimestamp
      ? new Date(metadataTimestamp) > new Date(cacheTimestamp)
        ? metadataTimestamp
        : cacheTimestamp
      : cacheTimestamp || metadataTimestamp;

  if (!latestTimestamp) return true;

  return new Date() - new Date(latestTimestamp) > maxAge;
};

export const selectIsStudentsStale = (
  state,
  classroomCode,
  maxAge = CACHE_CONFIG.STUDENTS_TIMEOUT
) => {
  if (!classroomCode) return true;

  // Check cache timestamp
  const cache = getCache("students", classroomCode);
  if (!cache?.timestamp) return true;

  // Also check metadata timestamp
  const metadataTimestamp =
    state.classroom.cacheMetadata.studentsLastFetch[classroomCode];
  const cacheTimestamp = cache.timestamp;
  const latestTimestamp =
    metadataTimestamp && cacheTimestamp
      ? new Date(metadataTimestamp) > new Date(cacheTimestamp)
        ? metadataTimestamp
        : cacheTimestamp
      : cacheTimestamp || metadataTimestamp;

  if (!latestTimestamp) return true;

  return new Date() - new Date(latestTimestamp) > maxAge;
};

export const selectClassroomById = (state, classroomCode) =>
  state.classroom.classrooms.find(
    (c) => getClassroomIdentifier(c) === classroomCode
  );

export const selectIsCurrentClassroom = (state, classroomCode) =>
  state.classroom.currentClassroom &&
  getClassroomIdentifier(state.classroom.currentClassroom) === classroomCode;

export const selectHasClassrooms = (state) =>
  state.classroom.classrooms.length > 0;

export const selectFilteredClassroomsCount = (state) => {
  return state.classroom.pagination.total || 0;
};

// Enhanced selector for cached teachers and students count
export const selectClassroomTeachersCount = (state, classroomCode) => {
  const cache = getCache("teachers", classroomCode);
  if (cache) return cache.count;

  const classroom = selectClassroomById(state, classroomCode);
  return classroom?.teacher_count || 0;
};

export const selectClassroomStudentsCount = (state, classroomCode) => {
  const cache = getCache("students", classroomCode);
  if (cache) return cache.count;

  const classroom = selectClassroomById(state, classroomCode);
  return classroom?.student_count || 0;
};

// Export cache utilities for debugging
export const getCacheDebugInfo = () => {
  return getCacheStats();
};

// Export reducer
export default classroomSlice.reducer;
