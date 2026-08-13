import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
const API_BASE_URL = process.env.REACT_APP_API;
// Cache configuration
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 15;
// Helper functions
const isCacheExpired = (timestamp) => {
  if (!timestamp) return true;
  return Date.now() - new Date(timestamp).getTime() > CACHE_EXPIRY_TIME;
};
const generateCacheKey = (classroomCode, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {});
  return `${classroomCode}_${JSON.stringify(sortedParams)}`;
};
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
// ==================== ASYNC THUNKS ====================
export const fetchMeetings = createAsyncThunk(
  "attendance/fetchMeetings",
  async (
    { classroomCode, params = {}, signal, forceRefresh = false },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState();
      const cacheKey = generateCacheKey(classroomCode, params);
      const cachedData = state.attendance.cache[cacheKey];
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
        sort_by: params.sort_by || "meeting_date",
        sort_order: params.sort_order || "desc",
        ...params,
      });
      const response = await axios.get(
        `${API_BASE_URL}api/classrooms/${classroomCode}/attendance/meetings?${queryParams.toString()}`,
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
        message: error.response?.data?.message || "Failed to fetch meetings",
        status: error.response?.status,
      });
    }
  }
);
export const createMeeting = createAsyncThunk(
  "attendance/createMeeting",
  async ({ classroomCode, meetingData }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const response = await axios.post(
        `${API_BASE_URL}api/classrooms/${classroomCode}/attendance/meetings`,
        meetingData
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
        message: error.response?.data?.message || "Failed to create meeting",
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
    }
  }
);
export const getMeetingDetail = createAsyncThunk(
  "attendance/getMeetingDetail",
  async ({ classroomCode, meetingId, signal }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie", { signal });
      const response = await axios.get(
        `${API_BASE_URL}api/classrooms/${classroomCode}/attendance/meetings/${meetingId}`,
        { signal }
      );
      return {
        data: response.data.data,
        classroomCode,
        meetingId,
      };
    } catch (error) {
      if (error.name === "AbortError" || error.code === "ECONNABORTED") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message:
          error.response?.data?.message || "Failed to fetch meeting detail",
        status: error.response?.status,
      });
    }
  }
);
export const updateMeeting = createAsyncThunk(
  "attendance/updateMeeting",
  async ({ classroomCode, meetingId, meetingData }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const response = await axios.put(
        `${API_BASE_URL}api/classrooms/${classroomCode}/attendance/meetings/${meetingId}`,
        meetingData
      );
      return {
        data: response.data.data,
        classroomCode,
        meetingId,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message: error.response?.data?.message || "Failed to update meeting",
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
    }
  }
);
export const deleteMeeting = createAsyncThunk(
  "attendance/deleteMeeting",
  async ({ classroomCode, meetingId }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      await axios.delete(
        `${API_BASE_URL}api/classrooms/${classroomCode}/attendance/meetings/${meetingId}`
      );
      return { classroomCode, meetingId };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message: error.response?.data?.message || "Failed to delete meeting",
        status: error.response?.status,
      });
    }
  }
);
export const updateAttendance = createAsyncThunk(
  "attendance/updateAttendance",
  async ({ classroomCode, meetingId, attendances }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const response = await axios.put(
        `${API_BASE_URL}api/classrooms/${classroomCode}/attendance/meetings/${meetingId}/attendance`,
        { attendances }
      );
      return {
        data: response.data.data,
        classroomCode,
        meetingId,
        attendances,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message: error.response?.data?.message || "Failed to update attendance",
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
    }
  }
);
export const bulkUpdateAttendance = createAsyncThunk(
  "attendance/bulkUpdateAttendance",
  async ({ classroomCode, meetingId, bulkData }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const response = await axios.post(
        `${API_BASE_URL}api/classrooms/${classroomCode}/attendance/meetings/${meetingId}/attendance/bulk`,
        bulkData
      );
      return {
        data: response.data.data,
        classroomCode,
        meetingId,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message:
          error.response?.data?.message || "Failed to bulk update attendance",
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
    }
  }
);
export const updateIndividualAttendance = createAsyncThunk(
  "attendance/updateIndividualAttendance",
  async (
    { classroomCode, attendanceId, attendanceData },
    { rejectWithValue }
  ) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const response = await axios.put(
        `${API_BASE_URL}api/classrooms/${classroomCode}/attendance/${attendanceId}`,
        attendanceData
      );
      return {
        data: response.data.data,
        classroomCode,
        attendanceId,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message:
          error.response?.data?.message ||
          "Failed to update individual attendance",
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
    }
  }
);
export const deleteIndividualAttendance = createAsyncThunk(
  "attendance/deleteIndividualAttendance",
  async ({ classroomCode, attendanceId }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      await axios.delete(
        `${API_BASE_URL}api/classrooms/${classroomCode}/attendance/${attendanceId}`
      );
      return { classroomCode, attendanceId };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message: error.response?.data?.message || "Failed to delete attendance",
        status: error.response?.status,
      });
    }
  }
);
export const updateAttendanceList = createAsyncThunk(
  "attendance/updateAttendanceList",
  async (
    { classroomCode, meetingId, addStudents, removeStudentIds },
    { rejectWithValue }
  ) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const response = await axios.put(
        `${API_BASE_URL}api/classrooms/${classroomCode}/attendance/meetings/${meetingId}/attendance-list`,
        {
          add_students: addStudents,
          remove_student_ids: removeStudentIds,
        }
      );
      return {
        data: response.data.data,
        classroomCode,
        meetingId,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message:
          error.response?.data?.message || "Failed to update attendance list",
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
    }
  }
);
export const getAvailableStudents = createAsyncThunk(
  "attendance/getAvailableStudents",
  async ({ classroomCode, meetingId }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const response = await axios.get(
        `${API_BASE_URL}api/classrooms/${classroomCode}/attendance/meetings/${meetingId}/available-students`
      );
      return {
        data: response.data.data,
        classroomCode,
        meetingId,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message:
          error.response?.data?.message || "Failed to get available students",
        status: error.response?.status,
      });
    }
  }
);
export const addAttendanceNote = createAsyncThunk(
  "attendance/addAttendanceNote",
  async ({ classroomCode, attendanceId, noteData }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const response = await axios.post(
        `${API_BASE_URL}api/classrooms/${classroomCode}/attendance/${attendanceId}/notes`,
        noteData
      );
      return {
        data: response.data.data,
        classroomCode,
        attendanceId,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message: error.response?.data?.message || "Failed to add note",
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
    }
  }
);
export const updateAttendanceNote = createAsyncThunk(
  "attendance/updateAttendanceNote",
  async (
    { classroomCode, attendanceId, noteId, noteData },
    { rejectWithValue }
  ) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const response = await axios.put(
        `${API_BASE_URL}api/classrooms/${classroomCode}/attendance/${attendanceId}/notes/${noteId}`,
        noteData
      );
      return {
        data: response.data.data,
        classroomCode,
        attendanceId,
        noteId,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message: error.response?.data?.message || "Failed to update note",
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
    }
  }
);
export const deleteAttendanceNote = createAsyncThunk(
  "attendance/deleteAttendanceNote",
  async ({ classroomCode, attendanceId, noteId }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      await axios.delete(
        `${API_BASE_URL}api/classrooms/${classroomCode}/attendance/${attendanceId}/notes/${noteId}`
      );
      return { classroomCode, attendanceId, noteId };
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message: error.response?.data?.message || "Failed to delete note",
        status: error.response?.status,
      });
    }
  }
);
export const fetchAttendanceStatistics = createAsyncThunk(
  "attendance/fetchStatistics",
  async ({ classroomCode, signal }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie", { signal });
      const response = await axios.get(
        `${API_BASE_URL}api/classrooms/${classroomCode}/attendance/statistics`,
        { signal }
      );
      return {
        data: response.data.data,
        classroomCode,
      };
    } catch (error) {
      if (error.name === "AbortError" || error.code === "ECONNABORTED") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message: error.response?.data?.message || "Failed to fetch statistics",
        status: error.response?.status,
      });
    }
  }
);
export const fetchStudentAttendanceSummary = createAsyncThunk(
  "attendance/fetchStudentSummary",
  async (
    { classroomCode, studentId, params = {}, signal },
    { rejectWithValue }
  ) => {
    try {
      await axios.get("sanctum/csrf-cookie", { signal });
      const queryParams = new URLSearchParams(params);
      const response = await axios.get(
        `${API_BASE_URL}api/classrooms/${classroomCode}/attendance/students/${studentId}/summary?${queryParams.toString()}`,
        { signal }
      );
      return {
        data: response.data.data,
        classroomCode,
        studentId,
        params,
      };
    } catch (error) {
      if (error.name === "AbortError" || error.code === "ECONNABORTED") {
        return rejectWithValue({
          message: "Request cancelled",
          cancelled: true,
        });
      }
      return rejectWithValue({
        message:
          error.response?.data?.message || "Failed to fetch student summary",
        status: error.response?.status,
      });
    }
  }
);
// ==================== SLICE DEFINITION ====================
const initialState = {
  meetings: {},
  pagination: {},
  statistics: {},
  studentSummaries: {},
  cache: {},
  currentClassroomCode: null,
  currentMeeting: null,
  attendanceDetails: {},
  attendanceNotes: {},
  availableStudents: {},
  // Status states
  bulkUpdateStatus: "idle",
  status: "idle",
  createStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  statisticsStatus: "idle",
  studentSummaryStatus: "idle",
  individualUpdateStatus: "idle",
  noteUpdateStatus: "idle",
  availableStudentsStatus: "idle",
  error: null,
  validationErrors: null,
  lastUpdated: {},
  cacheStats: {
    hits: 0,
    misses: 0,
    totalRequests: 0,
  },
};
const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {
    resetAttendanceState: () => initialState,
    resetAttendanceStatus: (state) => {
      state.status = "idle";
      state.bulkUpdateStatus = "idle";
      state.createStatus = "idle";
      state.updateStatus = "idle";
      state.deleteStatus = "idle";
      state.statisticsStatus = "idle";
      state.studentSummaryStatus = "idle";
      state.individualUpdateStatus = "idle";
      state.noteUpdateStatus = "idle";
      state.availableStudentsStatus = "idle";
      state.error = null;
      state.validationErrors = null;
    },
    clearAttendanceErrors: (state) => {
      state.error = null;
      state.validationErrors = null;
    },
    setCurrentClassroom: (state, action) => {
      state.currentClassroomCode = action.payload;
    },
    setCurrentMeeting: (state, action) => {
      state.currentMeeting = action.payload;
    },
    clearCache: (state, action) => {
      if (action.payload) {
        const classroomCode = action.payload;
        Object.keys(state.cache).forEach((key) => {
          if (key.startsWith(`${classroomCode}_`)) {
            delete state.cache[key];
          }
        });
      } else {
        state.cache = {};
        state.cacheStats = { hits: 0, misses: 0, totalRequests: 0 };
      }
    },
    clearExpiredCache: (state) => {
      Object.keys(state.cache).forEach((key) => {
        if (isCacheExpired(state.cache[key].timestamp)) {
          delete state.cache[key];
        }
      });
    },
    // Optimistic update for meeting creation
    addMeetingOptimistic: (state, action) => {
      const { classroomCode, meeting } = action.payload;
      const currentTime = Date.now();
      const timestamp = new Date().toISOString();
      if (!state.meetings[classroomCode]) {
        state.meetings[classroomCode] = [];
      }
      state.meetings[classroomCode].unshift(meeting);
      if (state.pagination[classroomCode]) {
        state.pagination[classroomCode].total += 1;
      }
      Object.keys(state.cache).forEach((cacheKey) => {
        if (cacheKey.startsWith(`${classroomCode}_`)) {
          const cacheEntry = state.cache[cacheKey];
          if (cacheEntry?.data?.meetings) {
            cacheEntry.data.meetings.unshift(meeting);
            if (cacheEntry.data.pagination) {
              cacheEntry.data.pagination.total += 1;
            }
            cacheEntry.timestamp = timestamp;
            cacheEntry.lastAccessed = currentTime;
            cacheEntry.lastModified = currentTime;
          }
        }
      });
      state.lastUpdated[classroomCode] = timestamp;
    },
    // Optimistic update for meeting updates
    updateMeetingOptimistic: (state, action) => {
      const { classroomCode, meetingId, updatedMeeting } = action.payload;
      const currentTime = Date.now();
      const timestamp = new Date().toISOString();
      if (state.meetings[classroomCode]) {
        const index = state.meetings[classroomCode].findIndex(
          (m) => String(m.id) === String(meetingId)
        );
        if (index !== -1) {
          state.meetings[classroomCode][index] = {
            ...state.meetings[classroomCode][index],
            ...updatedMeeting,
            updated_at: timestamp,
          };
        }
      }
      Object.keys(state.cache).forEach((cacheKey) => {
        if (cacheKey.startsWith(`${classroomCode}_`)) {
          const cacheEntry = state.cache[cacheKey];
          if (cacheEntry?.data?.meetings) {
            const meetingIndex = cacheEntry.data.meetings.findIndex(
              (m) => String(m.id) === String(meetingId)
            );
            if (meetingIndex !== -1) {
              cacheEntry.data.meetings[meetingIndex] = {
                ...cacheEntry.data.meetings[meetingIndex],
                ...updatedMeeting,
                updated_at: timestamp,
              };
              cacheEntry.timestamp = timestamp;
              cacheEntry.lastAccessed = currentTime;
              cacheEntry.lastModified = currentTime;
            }
          }
        }
      });
      if (state.currentMeeting?.id === meetingId) {
        state.currentMeeting = {
          ...state.currentMeeting,
          ...updatedMeeting,
          updated_at: timestamp,
        };
      }
      state.lastUpdated[classroomCode] = timestamp;
    },
    // Optimistic update for attendance updates
    updateAttendanceOptimistic: (state, action) => {
      const { classroomCode, meetingId, attendances } = action.payload;
      const currentTime = Date.now();
      const timestamp = new Date().toISOString();
      const updateMeetingAttendance = (meeting, attendanceUpdates) => {
        if (String(meeting.id) === String(meetingId) && meeting.attendances) {
          attendanceUpdates.forEach((attendanceUpdate) => {
            const existingIndex = meeting.attendances.findIndex(
              (a) => a.student.id === attendanceUpdate.student_id
            );
            if (existingIndex !== -1) {
              meeting.attendances[existingIndex] = {
                ...meeting.attendances[existingIndex],
                status:
                  attendanceUpdate.status ||
                  meeting.attendances[existingIndex].status,
                check_in_time:
                  attendanceUpdate.check_in_time ||
                  meeting.attendances[existingIndex].check_in_time,
                check_out_time:
                  attendanceUpdate.check_out_time ||
                  meeting.attendances[existingIndex].check_out_time,
                notes:
                  attendanceUpdate.notes !== undefined
                    ? attendanceUpdate.notes
                    : meeting.attendances[existingIndex].notes,
                participation_score:
                  attendanceUpdate.participation_score !== undefined
                    ? attendanceUpdate.participation_score
                    : meeting.attendances[existingIndex].participation_score,
                participation_notes:
                  attendanceUpdate.participation_notes !== undefined
                    ? attendanceUpdate.participation_notes
                    : meeting.attendances[existingIndex].participation_notes,
                is_late: attendanceUpdate.status === "late",
                marked_at: timestamp,
                updated_at: timestamp,
              };
            }
          });
          const totalAttendances = meeting.attendances.length;
          const presentCount = meeting.attendances.filter((a) =>
            ["present", "late"].includes(a.status)
          ).length;
          const absentCount = meeting.attendances.filter(
            (a) => a.status === "absent"
          ).length;
          const excusedCount = meeting.attendances.filter((a) =>
            ["excused", "sick", "permit"].includes(a.status)
          ).length;
          meeting.present_count = presentCount;
          meeting.absent_count = absentCount;
          meeting.excused_count = excusedCount;
          meeting.attendance_percentage =
            totalAttendances > 0
              ? Math.round((presentCount / totalAttendances) * 100 * 100) / 100
              : 0;
          meeting.updated_at = timestamp;
        }
      };
      if (state.meetings[classroomCode]) {
        state.meetings[classroomCode].forEach((meeting) => {
          updateMeetingAttendance(meeting, attendances);
        });
      }
      Object.keys(state.cache).forEach((cacheKey) => {
        if (cacheKey.startsWith(`${classroomCode}_`)) {
          const cacheEntry = state.cache[cacheKey];
          if (cacheEntry?.data?.meetings) {
            cacheEntry.data.meetings.forEach((meeting) => {
              updateMeetingAttendance(meeting, attendances);
            });
            cacheEntry.timestamp = timestamp;
            cacheEntry.lastAccessed = currentTime;
            cacheEntry.lastModified = currentTime;
          }
        }
      });
      if (state.currentMeeting?.id === meetingId) {
        updateMeetingAttendance(state.currentMeeting, attendances);
      }
      state.lastUpdated[classroomCode] = timestamp;
    },
    // Optimistic removal of meeting
    removeMeetingOptimistic: (state, action) => {
      const { classroomCode, meetingId } = action.payload;
      if (state.meetings[classroomCode]) {
        state.meetings[classroomCode] = state.meetings[classroomCode].filter(
          (m) => String(m.id) !== String(meetingId)
        );
      }
      Object.keys(state.cache).forEach((key) => {
        if (key.startsWith(`${classroomCode}_`)) {
          const cachedMeetings = state.cache[key].data.meetings || [];
          state.cache[key].data.meetings = cachedMeetings.filter(
            (m) => String(m.id) !== String(meetingId)
          );
          if (state.cache[key].data.pagination) {
            state.cache[key].data.pagination.total = Math.max(
              0,
              state.cache[key].data.pagination.total - 1
            );
          }
        }
      });
      if (state.pagination[classroomCode]) {
        state.pagination[classroomCode].total = Math.max(
          0,
          state.pagination[classroomCode].total - 1
        );
      }
      if (state.currentMeeting?.id === meetingId) {
        state.currentMeeting = null;
      }
    },
    // Add attendance note optimistically
    addAttendanceNoteOptimistic: (state, action) => {
      const { classroomCode, attendanceId, note } = action.payload;
      const currentTime = Date.now();
      const timestamp = new Date().toISOString();
      const addNoteToAttendance = (meetings) => {
        meetings.forEach((meeting) => {
          if (meeting.attendances) {
            const attendance = meeting.attendances.find(
              (a) => a.id === attendanceId
            );
            if (attendance) {
              if (!attendance.additional_notes) {
                attendance.additional_notes = [];
              }
              attendance.additional_notes.push({
                ...note,
                noted_at: timestamp,
              });
            }
          }
        });
      };
      if (state.meetings[classroomCode]) {
        addNoteToAttendance(state.meetings[classroomCode]);
      }
      Object.keys(state.cache).forEach((cacheKey) => {
        if (cacheKey.startsWith(`${classroomCode}_`)) {
          const cacheEntry = state.cache[cacheKey];
          if (cacheEntry?.data?.meetings) {
            addNoteToAttendance(cacheEntry.data.meetings);
            cacheEntry.timestamp = timestamp;
            cacheEntry.lastAccessed = currentTime;
          }
        }
      });
      if (state.currentMeeting?.attendances) {
        const attendance = state.currentMeeting.attendances.find(
          (a) => a.id === attendanceId
        );
        if (attendance) {
          if (!attendance.additional_notes) {
            attendance.additional_notes = [];
          }
          attendance.additional_notes.push({
            ...note,
            noted_at: timestamp,
          });
        }
      }
    },
    updateAttendanceNoteInAllCaches: (state, action) => {
      const { classroomCode, attendanceId, updatedNote, operation } =
        action.payload;
      const currentTime = Date.now();
      const timestamp = new Date().toISOString();
      // Helper function to update notes in a meeting's attendances
      const updateMeetingNotes = (meeting) => {
        if (meeting.attendances) {
          const attendanceIndex = meeting.attendances.findIndex(
            (a) => String(a.id) === String(attendanceId)
          );
          if (attendanceIndex !== -1) {
            const attendance = meeting.attendances[attendanceIndex];
            if (!attendance.additional_notes) {
              attendance.additional_notes = [];
            }
            if (operation === "create") {
              // Add new note - PERUBAHAN: dari unshift ke push untuk ascending order
              attendance.additional_notes.push(updatedNote);
            } else if (operation === "update") {
              // Update existing note
              const noteIndex = attendance.additional_notes.findIndex(
                (n) => String(n.id) === String(updatedNote.id)
              );
              if (noteIndex !== -1) {
                attendance.additional_notes[noteIndex] = updatedNote;
              }
            } else if (operation === "delete") {
              // Remove note
              attendance.additional_notes = attendance.additional_notes.filter(
                (n) => String(n.id) !== String(updatedNote.id)
              );
            }
            // Update meeting timestamp
            meeting.updated_at = timestamp;
          }
        }
      };
      // Update in main meetings list
      if (state.meetings[classroomCode]) {
        state.meetings[classroomCode].forEach(updateMeetingNotes);
      }
      // Update ALL cache entries for this classroom
      Object.keys(state.cache).forEach((cacheKey) => {
        if (cacheKey.startsWith(`${classroomCode}_`)) {
          const cacheEntry = state.cache[cacheKey];
          if (cacheEntry?.data?.meetings) {
            cacheEntry.data.meetings.forEach(updateMeetingNotes);
            // Update cache metadata
            cacheEntry.timestamp = timestamp;
            cacheEntry.lastAccessed = currentTime;
            cacheEntry.lastModified = currentTime;
          }
        }
      });
      // Update current meeting if it exists
      if (state.currentMeeting) {
        updateMeetingNotes(state.currentMeeting);
      }
      // Update attendance notes if tracked separately
      if (state.attendanceNotes[classroomCode]?.[attendanceId]) {
        if (operation === "create") {
          // PERUBAHAN: dari unshift ke push untuk ascending order
          state.attendanceNotes[classroomCode][attendanceId].push(updatedNote);
        } else if (operation === "update") {
          const noteIndex = state.attendanceNotes[classroomCode][
            attendanceId
          ].findIndex((n) => String(n.id) === String(updatedNote.id));
          if (noteIndex !== -1) {
            state.attendanceNotes[classroomCode][attendanceId][noteIndex] =
              updatedNote;
          }
        } else if (operation === "delete") {
          state.attendanceNotes[classroomCode][attendanceId] =
            state.attendanceNotes[classroomCode][attendanceId].filter(
              (n) => String(n.id) !== String(updatedNote.id)
            );
        }
      }
      state.lastUpdated[classroomCode] = timestamp;
    },
    // Remove attendance note optimistically
    removeAttendanceNoteOptimistic: (state, action) => {
      const { classroomCode, attendanceId, noteId } = action.payload;
      const currentTime = Date.now();
      const timestamp = new Date().toISOString();
      const removeNoteFromAttendance = (meetings) => {
        meetings.forEach((meeting) => {
          if (meeting.attendances) {
            const attendance = meeting.attendances.find(
              (a) => String(a.id) === String(attendanceId)
            );
            if (attendance && attendance.additional_notes) {
              attendance.additional_notes = attendance.additional_notes.filter(
                (note) => String(note.id) !== String(noteId)
              );
            }
          }
        });
      };
      if (state.meetings[classroomCode]) {
        removeNoteFromAttendance(state.meetings[classroomCode]);
      }
      Object.keys(state.cache).forEach((cacheKey) => {
        if (cacheKey.startsWith(`${classroomCode}_`)) {
          const cacheEntry = state.cache[cacheKey];
          if (cacheEntry?.data?.meetings) {
            removeNoteFromAttendance(cacheEntry.data.meetings);
            cacheEntry.timestamp = timestamp;
            cacheEntry.lastAccessed = currentTime;
          }
        }
      });
      if (state.currentMeeting?.attendances) {
        const attendance = state.currentMeeting.attendances.find(
          (a) => String(a.id) === String(attendanceId)
        );
        if (attendance && attendance.additional_notes) {
          attendance.additional_notes = attendance.additional_notes.filter(
            (note) => String(note.id) !== String(noteId)
          );
        }
      }
      if (state.attendanceNotes[classroomCode]?.[attendanceId]) {
        state.attendanceNotes[classroomCode][attendanceId] =
          state.attendanceNotes[classroomCode][attendanceId].filter(
            (note) => String(note.id) !== String(noteId)
          );
      }
    },
    // Update note optimistically
    updateAttendanceNoteOptimistic: (state, action) => {
      const { classroomCode, attendanceId, noteId, updatedNote } =
        action.payload;
      const currentTime = Date.now();
      const timestamp = new Date().toISOString();
      const updateNoteInAttendance = (meetings) => {
        meetings.forEach((meeting) => {
          if (meeting.attendances) {
            const attendance = meeting.attendances.find(
              (a) => String(a.id) === String(attendanceId)
            );
            if (attendance && attendance.additional_notes) {
              const noteIndex = attendance.additional_notes.findIndex(
                (note) => String(note.id) === String(noteId)
              );
              if (noteIndex !== -1) {
                attendance.additional_notes[noteIndex] = {
                  ...attendance.additional_notes[noteIndex],
                  ...updatedNote,
                  updated_at: timestamp,
                };
              }
            }
          }
        });
      };
      if (state.meetings[classroomCode]) {
        updateNoteInAttendance(state.meetings[classroomCode]);
      }
      Object.keys(state.cache).forEach((cacheKey) => {
        if (cacheKey.startsWith(`${classroomCode}_`)) {
          const cacheEntry = state.cache[cacheKey];
          if (cacheEntry?.data?.meetings) {
            updateNoteInAttendance(cacheEntry.data.meetings);
            cacheEntry.timestamp = timestamp;
            cacheEntry.lastAccessed = currentTime;
            cacheEntry.lastModified = currentTime;
          }
        }
      });
      if (state.currentMeeting?.attendances) {
        const attendance = state.currentMeeting.attendances.find(
          (a) => String(a.id) === String(attendanceId)
        );
        if (attendance && attendance.additional_notes) {
          const noteIndex = attendance.additional_notes.findIndex(
            (note) => String(note.id) === String(noteId)
          );
          if (noteIndex !== -1) {
            attendance.additional_notes[noteIndex] = {
              ...attendance.additional_notes[noteIndex],
              ...updatedNote,
              updated_at: timestamp,
            };
          }
        }
      }
      if (state.attendanceNotes[classroomCode]?.[attendanceId]) {
        const noteIndex = state.attendanceNotes[classroomCode][
          attendanceId
        ].findIndex((note) => String(note.id) === String(noteId));
        if (noteIndex !== -1) {
          state.attendanceNotes[classroomCode][attendanceId][noteIndex] = {
            ...state.attendanceNotes[classroomCode][attendanceId][noteIndex],
            ...updatedNote,
            updated_at: timestamp,
          };
        }
      }
    },
    syncMeetingAcrossCache: (state, action) => {
      const { classroomCode, meetingId, updatedMeeting } = action.payload;
      Object.keys(state.cache).forEach((cacheKey) => {
        if (cacheKey.startsWith(`${classroomCode}_`)) {
          const cacheEntry = state.cache[cacheKey];
          if (cacheEntry?.data?.meetings) {
            const index = cacheEntry.data.meetings.findIndex(
              (m) => String(m.id) === String(meetingId)
            );
            if (index !== -1) {
              cacheEntry.data.meetings[index] = updatedMeeting;
              cacheEntry.timestamp = new Date().toISOString();
              cacheEntry.lastAccessed = Date.now();
            }
          }
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Meetings
      .addCase(fetchMeetings.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.cacheStats.totalRequests += 1;
      })
      .addCase(fetchMeetings.fulfilled, (state, action) => {
        const { data, classroomCode, fromCache, cacheKey } = action.payload;
        if (data && !action.meta.aborted) {
          state.status = "succeeded";
          if (fromCache) {
            state.cacheStats.hits += 1;
            if (state.cache[cacheKey]) {
              state.cache[cacheKey].lastAccessed = Date.now();
            }
          } else {
            state.cacheStats.misses += 1;
            cleanOldCacheEntries(state);
            state.cache[cacheKey] = {
              data,
              timestamp: new Date().toISOString(),
              lastAccessed: Date.now(),
              classroomCode,
            };
          }
          state.meetings[classroomCode] = data.meetings || [];
          state.pagination[classroomCode] = data.pagination || {};
          state.lastUpdated[classroomCode] = new Date().toISOString();
          state.currentClassroomCode = classroomCode;
        }
      })
      .addCase(fetchMeetings.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.status = "failed";
          state.error = action.payload?.message;
        }
      })
      // Create Meeting
      .addCase(createMeeting.pending, (state) => {
        state.createStatus = "loading";
        state.error = null;
        state.validationErrors = null;
      })
      .addCase(createMeeting.fulfilled, (state, action) => {
        const { data, classroomCode } = action.payload;
        if (data && !action.meta.aborted) {
          state.createStatus = "succeeded";
          attendanceSlice.caseReducers.addMeetingOptimistic(state, {
            payload: {
              classroomCode,
              meeting: data,
            },
          });
        }
      })
      .addCase(createMeeting.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.createStatus = "failed";
          state.error = action.payload?.message || "Failed to create meeting";
          state.validationErrors = action.payload?.errors;
        }
      })
      // Get Meeting Detail
      .addCase(getMeetingDetail.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getMeetingDetail.fulfilled, (state, action) => {
        const { data, classroomCode, meetingId } = action.payload;
        if (data && !action.meta.aborted) {
          state.status = "succeeded";
          state.currentMeeting = data;
          const index = state.meetings[classroomCode]?.findIndex(
            (m) => m.id === meetingId
          );
          if (index !== -1) {
            state.meetings[classroomCode][index] = data;
          }
        }
      })
      .addCase(getMeetingDetail.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.status = "failed";
          state.error = action.payload?.message;
        }
      })
      // Update Meeting
      .addCase(updateMeeting.pending, (state) => {
        state.updateStatus = "loading";
        state.error = null;
        state.validationErrors = null;
      })
      .addCase(updateMeeting.fulfilled, (state, action) => {
        const { data, classroomCode, meetingId } = action.payload;
        if (data && !action.meta.aborted) {
          state.updateStatus = "succeeded";
          attendanceSlice.caseReducers.updateMeetingOptimistic(state, {
            payload: {
              classroomCode,
              meetingId,
              updatedMeeting: data,
            },
          });
        }
      })
      .addCase(updateMeeting.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.updateStatus = "failed";
          state.error = action.payload?.message || "Failed to update meeting";
          state.validationErrors = action.payload?.errors;
        }
      })
      // Delete Meeting
      .addCase(deleteMeeting.pending, (state) => {
        state.deleteStatus = "loading";
        state.error = null;
      })
      .addCase(deleteMeeting.fulfilled, (state, action) => {
        if (!action.meta.aborted) {
          state.deleteStatus = "succeeded";
        }
      })
      .addCase(deleteMeeting.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.deleteStatus = "failed";
          state.error = action.payload?.message || "Failed to delete meeting";
        }
      })
      // Update Attendance
      .addCase(updateAttendance.pending, (state) => {
        state.updateStatus = "loading";
        state.error = null;
        state.validationErrors = null;
      })
      .addCase(updateAttendance.fulfilled, (state, action) => {
        const { data, classroomCode, meetingId } = action.payload;
        if (data && !action.meta.aborted) {
          state.updateStatus = "succeeded";
          const updateMeetingInState = (meetings) => {
            const index = meetings.findIndex(
              (m) => String(m.id) === String(meetingId)
            );
            if (index !== -1) {
              meetings[index] = data;
            }
          };
          if (state.meetings[classroomCode]) {
            updateMeetingInState(state.meetings[classroomCode]);
          }
          Object.keys(state.cache).forEach((cacheKey) => {
            if (cacheKey.startsWith(`${classroomCode}_`)) {
              const cacheEntry = state.cache[cacheKey];
              if (cacheEntry?.data?.meetings) {
                updateMeetingInState(cacheEntry.data.meetings);
                cacheEntry.timestamp = new Date().toISOString();
                cacheEntry.lastAccessed = Date.now();
              }
            }
          });
          if (state.currentMeeting?.id === meetingId) {
            state.currentMeeting = data;
          }
          state.lastUpdated[classroomCode] = new Date().toISOString();
        }
      })
      .addCase(updateAttendance.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.updateStatus = "failed";
          state.error =
            action.payload?.message || "Failed to update attendance";
          state.validationErrors = action.payload?.errors;
        }
      })
      // Bulk Update Attendance
      .addCase(bulkUpdateAttendance.pending, (state) => {
        state.bulkUpdateStatus = "loading"; // Changed from state.updateStatus
        state.error = null;
        state.validationErrors = null;
      })
      .addCase(bulkUpdateAttendance.fulfilled, (state, action) => {
        const { data, classroomCode, meetingId } = action.payload;
        if (data && !action.meta.aborted) {
          state.bulkUpdateStatus = "succeeded"; // Changed from state.updateStatus
          const updateMeetingInState = (meetings) => {
            const index = meetings.findIndex(
              (m) => String(m.id) === String(meetingId)
            );
            if (index !== -1) {
              meetings[index] = data;
            }
          };
          if (state.meetings[classroomCode]) {
            updateMeetingInState(state.meetings[classroomCode]);
          }
          Object.keys(state.cache).forEach((cacheKey) => {
            if (cacheKey.startsWith(`${classroomCode}_`)) {
              const cacheEntry = state.cache[cacheKey];
              if (cacheEntry?.data?.meetings) {
                updateMeetingInState(cacheEntry.data.meetings);
                cacheEntry.timestamp = new Date().toISOString();
                cacheEntry.lastAccessed = Date.now();
              }
            }
          });
          if (state.currentMeeting?.id === meetingId) {
            state.currentMeeting = data;
          }
          state.lastUpdated[classroomCode] = new Date().toISOString();
        }
      })
      .addCase(bulkUpdateAttendance.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.bulkUpdateStatus = "failed"; // Changed from state.updateStatus
          state.error =
            action.payload?.message || "Failed to bulk update attendance";
          state.validationErrors = action.payload?.errors;
        }
      })
      // Update Individual Attendance
      .addCase(updateIndividualAttendance.pending, (state) => {
        state.individualUpdateStatus = "loading";
      })
      .addCase(updateIndividualAttendance.fulfilled, (state, action) => {
        const { data, classroomCode, attendanceId } = action.payload;
        if (data && !action.meta.aborted) {
          state.individualUpdateStatus = "succeeded";
          if (!state.attendanceDetails[classroomCode]) {
            state.attendanceDetails[classroomCode] = {};
          }
          state.attendanceDetails[classroomCode][attendanceId] = data;
        }
      })
      .addCase(updateIndividualAttendance.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.individualUpdateStatus = "failed";
          state.error = action.payload?.message;
        }
      })
      // Delete Individual Attendance
      .addCase(deleteIndividualAttendance.pending, (state) => {
        state.individualUpdateStatus = "loading";
      })
      .addCase(deleteIndividualAttendance.fulfilled, (state, action) => {
        if (!action.meta.aborted) {
          state.individualUpdateStatus = "succeeded";
        }
      })
      .addCase(deleteIndividualAttendance.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.individualUpdateStatus = "failed";
          state.error = action.payload?.message;
        }
      })
      // Update Attendance List
      .addCase(updateAttendanceList.pending, (state) => {
        state.updateStatus = "loading";
      })
      .addCase(updateAttendanceList.fulfilled, (state, action) => {
        const { data, classroomCode, meetingId } = action.payload;
        if (data && !action.meta.aborted) {
          state.updateStatus = "succeeded";
          const updateMeetingInState = (meetings) => {
            const index = meetings.findIndex(
              (m) => String(m.id) === String(meetingId)
            );
            if (index !== -1) {
              meetings[index] = data;
            }
          };
          if (state.meetings[classroomCode]) {
            updateMeetingInState(state.meetings[classroomCode]);
          }
          Object.keys(state.cache).forEach((cacheKey) => {
            if (cacheKey.startsWith(`${classroomCode}_`)) {
              const cacheEntry = state.cache[cacheKey];
              if (cacheEntry?.data?.meetings) {
                updateMeetingInState(cacheEntry.data.meetings);
                cacheEntry.timestamp = new Date().toISOString();
                cacheEntry.lastAccessed = Date.now();
              }
            }
          });
          if (state.currentMeeting?.id === meetingId) {
            state.currentMeeting = data;
          }
          state.lastUpdated[classroomCode] = new Date().toISOString();
        }
      })
      .addCase(updateAttendanceList.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.updateStatus = "failed";
          state.error = action.payload?.message;
        }
      })
      // Get Available Students
      .addCase(getAvailableStudents.pending, (state) => {
        state.availableStudentsStatus = "loading";
      })
      .addCase(getAvailableStudents.fulfilled, (state, action) => {
        const { data, classroomCode, meetingId } = action.payload;
        if (data && !action.meta.aborted) {
          state.availableStudentsStatus = "succeeded";
          if (!state.availableStudents[classroomCode]) {
            state.availableStudents[classroomCode] = {};
          }
          state.availableStudents[classroomCode][meetingId] = data;
        }
      })
      .addCase(getAvailableStudents.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.availableStudentsStatus = "failed";
          state.error = action.payload?.message;
        }
      })
      // Add Note
      .addCase(addAttendanceNote.pending, (state) => {
        state.noteUpdateStatus = "loading";
      })
      .addCase(addAttendanceNote.fulfilled, (state, action) => {
        const { data, classroomCode, attendanceId } = action.payload;
        if (data && !action.meta.aborted) {
          state.noteUpdateStatus = "succeeded";
          attendanceSlice.caseReducers.updateAttendanceNoteInAllCaches(state, {
            payload: {
              classroomCode,
              attendanceId,
              updatedNote: data,
              operation: "create",
            },
          });
        }
      })
      .addCase(addAttendanceNote.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.noteUpdateStatus = "failed";
          state.error = action.payload?.message || "Failed to add note";
        }
      })
      // Update Note
      .addCase(updateAttendanceNote.pending, (state) => {
        state.noteUpdateStatus = "loading";
      })
      .addCase(updateAttendanceNote.fulfilled, (state, action) => {
        const { data, classroomCode, attendanceId } = action.payload;
        if (data && !action.meta.aborted) {
          state.noteUpdateStatus = "succeeded";
          attendanceSlice.caseReducers.updateAttendanceNoteInAllCaches(state, {
            payload: {
              classroomCode,
              attendanceId,
              updatedNote: data,
              operation: "update",
            },
          });
        }
      })
      .addCase(updateAttendanceNote.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.noteUpdateStatus = "failed";
          state.error = action.payload?.message;
        }
      })
      // Delete Note
      .addCase(deleteAttendanceNote.pending, (state) => {
        state.noteUpdateStatus = "loading";
      })
      .addCase(deleteAttendanceNote.fulfilled, (state, action) => {
        const { classroomCode, attendanceId, noteId } = action.payload;
        if (!action.meta.aborted) {
          state.noteUpdateStatus = "succeeded";
          attendanceSlice.caseReducers.updateAttendanceNoteInAllCaches(state, {
            payload: {
              classroomCode,
              attendanceId,
              updatedNote: { id: noteId },
              operation: "delete",
            },
          });
        }
      })
      .addCase(deleteAttendanceNote.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.noteUpdateStatus = "failed";
          state.error = action.payload?.message;
        }
      })
      // Fetch Statistics
      .addCase(fetchAttendanceStatistics.pending, (state) => {
        state.statisticsStatus = "loading";
      })
      .addCase(fetchAttendanceStatistics.fulfilled, (state, action) => {
        const { data, classroomCode } = action.payload;
        if (data && !action.meta.aborted) {
          state.statisticsStatus = "succeeded";
          state.statistics[classroomCode] = data;
        }
      })
      .addCase(fetchAttendanceStatistics.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.statisticsStatus = "failed";
          state.error = action.payload?.message;
        }
      })
      // Fetch Student Summary
      .addCase(fetchStudentAttendanceSummary.pending, (state) => {
        state.studentSummaryStatus = "loading";
      })
      .addCase(fetchStudentAttendanceSummary.fulfilled, (state, action) => {
        const { data, classroomCode, studentId } = action.payload;
        if (data && !action.meta.aborted) {
          state.studentSummaryStatus = "succeeded";
          if (!state.studentSummaries[classroomCode]) {
            state.studentSummaries[classroomCode] = {};
          }
          state.studentSummaries[classroomCode][studentId] = data;
        }
      })
      .addCase(fetchStudentAttendanceSummary.rejected, (state, action) => {
        if (!action.payload?.cancelled) {
          state.studentSummaryStatus = "failed";
          state.error = action.payload?.message;
        }
      });
  },
});
// Export actions
export const {
  resetAttendanceState,
  resetAttendanceStatus,
  clearAttendanceErrors,
  setCurrentClassroom,
  setCurrentMeeting,
  clearCache,
  clearExpiredCache,
  addMeetingOptimistic,
  updateMeetingOptimistic,
  updateAttendanceOptimistic,
  removeMeetingOptimistic,
  addAttendanceNoteOptimistic,
  updateAttendanceNoteInAllCaches,
  removeAttendanceNoteOptimistic,
  updateAttendanceNoteOptimistic,
  syncMeetingAcrossCache,
} = attendanceSlice.actions;
// ==================== SELECTORS ====================
export const selectMeetingsByClassroom = (state, classroomCode) =>
  state.attendance.meetings[classroomCode] || [];
export const selectMeetingPagination = (state, classroomCode) =>
  state.attendance.pagination[classroomCode] || {};
export const selectAttendanceStatistics = (state, classroomCode) =>
  state.attendance.statistics[classroomCode] || null;
export const selectStudentSummary = (state, classroomCode, studentId) =>
  state.attendance.studentSummaries[classroomCode]?.[studentId] || null;
export const selectCurrentMeeting = (state) => state.attendance.currentMeeting;
export const selectCurrentClassroomCode = (state) =>
  state.attendance.currentClassroomCode;
export const selectAvailableStudents = (state, classroomCode, meetingId) =>
  state.attendance.availableStudents[classroomCode]?.[meetingId] || [];
// Status selectors
export const selectAttendanceStatus = (state) => state.attendance.status;
export const selectCreateStatus = (state) => state.attendance.createStatus;
export const selectUpdateStatus = (state) => state.attendance.updateStatus;
export const selectDeleteStatus = (state) => state.attendance.deleteStatus;
export const selectStatisticsStatus = (state) =>
  state.attendance.statisticsStatus;
export const selectStudentSummaryStatus = (state) =>
  state.attendance.studentSummaryStatus;
export const selectIndividualUpdateStatus = (state) =>
  state.attendance.individualUpdateStatus;
export const selectNoteUpdateStatus = (state) =>
  state.attendance.noteUpdateStatus;
export const selectAvailableStudentsStatus = (state) =>
  state.attendance.availableStudentsStatus;
export const selectAttendanceError = (state) => state.attendance.error;
export const selectValidationErrors = (state) =>
  state.attendance.validationErrors;
export const selectLastUpdated = (state, classroomCode) =>
  state.attendance.lastUpdated[classroomCode];
// Loading state selectors
export const selectIsLoading = (state) => state.attendance.status === "loading";
export const selectIsCreating = (state) =>
  state.attendance.createStatus === "loading";
export const selectIsUpdating = (state) =>
  state.attendance.updateStatus === "loading";
export const selectIsDeleting = (state) =>
  state.attendance.deleteStatus === "loading";
export const selectIsLoadingStatistics = (state) =>
  state.attendance.statisticsStatus === "loading";
export const selectIsLoadingStudentSummary = (state) =>
  state.attendance.studentSummaryStatus === "loading";
export const selectIsIndividualUpdating = (state) =>
  state.attendance.individualUpdateStatus === "loading";
export const selectIsNoteUpdating = (state) =>
  state.attendance.noteUpdateStatus === "loading";
export const selectIsLoadingAvailableStudents = (state) =>
  state.attendance.availableStudentsStatus === "loading";
// Cache selectors
export const selectCacheStats = (state) => state.attendance.cacheStats;
export const selectCacheSize = (state) =>
  Object.keys(state.attendance.cache).length;
export const selectIsCached = (state, classroomCode, params = {}) => {
  const cacheKey = generateCacheKey(classroomCode, params);
  const cachedData = state.attendance.cache[cacheKey];
  return cachedData && !isCacheExpired(cachedData.timestamp);
};
export const selectCacheHitRate = (state) => {
  const { hits, totalRequests } = state.attendance.cacheStats;
  return totalRequests > 0 ? Math.round((hits / totalRequests) * 100) : 0;
};
// Meeting filtering selectors
export const selectUpcomingMeetings = (state, classroomCode) => {
  const meetings = selectMeetingsByClassroom(state, classroomCode);
  const today = new Date().toDateString();
  return meetings
    .filter((meeting) => new Date(meeting.meeting_date).toDateString() >= today)
    .sort((a, b) => new Date(a.meeting_date) - new Date(b.meeting_date));
};
export const selectPastMeetings = (state, classroomCode) => {
  const meetings = selectMeetingsByClassroom(state, classroomCode);
  const today = new Date().toDateString();
  return meetings
    .filter((meeting) => new Date(meeting.meeting_date).toDateString() < today)
    .sort((a, b) => new Date(b.meeting_date) - new Date(a.meeting_date));
};
export const selectTodaysMeetings = (state, classroomCode) => {
  const meetings = selectMeetingsByClassroom(state, classroomCode);
  const today = new Date().toDateString();
  return meetings.filter(
    (meeting) => new Date(meeting.meeting_date).toDateString() === today
  );
};
export const selectMeetingById = (state, classroomCode, meetingId) => {
  const meetings = selectMeetingsByClassroom(state, classroomCode);
  return meetings.find((m) => String(m.id) === String(meetingId)) || null;
};
export const selectAttendanceByStatus = (
  state,
  classroomCode,
  meetingId,
  status
) => {
  const meeting = selectMeetingById(state, classroomCode, meetingId);
  return (
    meeting?.attendances?.filter(
      (attendance) => attendance.status === status
    ) || []
  );
};
export const selectAttendanceRateForMeeting = (
  state,
  classroomCode,
  meetingId
) => {
  const meeting = selectMeetingById(state, classroomCode, meetingId);
  return meeting?.attendance_percentage || 0;
};
export const selectOverallAttendanceStats = (state, classroomCode) => {
  const meetings = selectMeetingsByClassroom(state, classroomCode);
  if (meetings.length === 0) {
    return {
      totalMeetings: 0,
      averageAttendanceRate: 0,
      totalStudentsTracked: 0,
      meetingsWithPerfectAttendance: 0,
    };
  }
  const totalMeetings = meetings.length;
  const attendanceRates = meetings.map(
    (meeting) => meeting.attendance_percentage || 0
  );
  const averageAttendanceRate =
    attendanceRates.reduce((sum, rate) => sum + rate, 0) / totalMeetings;
  const meetingsWithPerfectAttendance = meetings.filter(
    (meeting) => (meeting.attendance_percentage || 0) === 100
  ).length;
  const mostRecentMeeting = meetings[0];
  const totalStudentsTracked = mostRecentMeeting?.attendance_count || 0;
  return {
    totalMeetings,
    averageAttendanceRate: Math.round(averageAttendanceRate),
    totalStudentsTracked,
    meetingsWithPerfectAttendance,
  };
};
export const selectStudentAttendanceForMeeting = (
  state,
  classroomCode,
  meetingId,
  studentId
) => {
  const meeting = selectMeetingById(state, classroomCode, meetingId);
  return (
    meeting?.attendances?.find(
      (attendance) => String(attendance.student.id) === String(studentId)
    ) || null
  );
};
export const selectStudentAttendanceHistory = (
  state,
  classroomCode,
  studentId
) => {
  const meetings = selectMeetingsByClassroom(state, classroomCode);
  return meetings
    .map((meeting) => {
      const attendance = meeting.attendances?.find(
        (a) => String(a.student.id) === String(studentId)
      );
      return {
        meeting: {
          id: meeting.id,
          title: meeting.title,
          meeting_date: meeting.meeting_date,
          type: meeting.type,
        },
        attendance: attendance || null,
      };
    })
    .filter((item) => item.attendance !== null);
};
export const selectBulkUpdateStatus = (state) =>
  state.attendance.bulkUpdateStatus;
export const selectIsBulkUpdating = (state) =>
  state.attendance.bulkUpdateStatus === "loading";
export default attendanceSlice.reducer;
