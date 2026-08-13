// src/features/classroom/assignmentAnswerSlice.js
import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const API_BASE_URL = process.env.REACT_APP_API;

// ============ HELPERS ============
const safeJsonDecode = (json, defaultValue = []) => {
  if (!json) return defaultValue;
  try {
    return typeof json === "string" ? JSON.parse(json) || defaultValue : json;
  } catch (e) {
    console.warn("Failed to decode JSON:", e);
    return defaultValue;
  }
};

/**
 * Normalisasi nilai jawaban berdasarkan tipe pertanyaan
 * Supaya konsisten saat disimpan di localAnswers / dikirim ke server
 */
export function normalizeAnswerValue(type, value) {
  if (!type) return value;

  switch (type) {
    case "text":
      return typeof value === "string" ? value.trim() : String(value || "");

    case "radio":
      if (Array.isArray(value)) {
        return value.length > 0 ? String(value[0]) : "";
      }
      if (typeof value === "object" && value !== null) {
        return String(value.id || value.value || value.label || "");
      }
      return String(value || "");

    case "checkbox":
      if (!value) return [];
      if (Array.isArray(value)) {
        return value
          .map((v) => {
            if (typeof v === "object" && v !== null) {
              return String(v.id || v.value || v.label || "");
            }
            return String(v);
          })
          .filter(Boolean); // Remove empty strings
      }
      if (typeof value === "object" && value !== null) {
        const val = String(value.id || value.value || value.label || "");
        return val ? [val] : [];
      }
      return value ? [String(value)] : [];

    case "file":
    case "multiple_file":
      if (!value) return [];
      if (Array.isArray(value)) {
        return value
          .map((f) => {
            if (f instanceof File) {
              return f; // Keep File objects as-is for upload
            }
            if (typeof f === "object" && f !== null) {
              return f.name || f.path || String(f);
            }
            return String(f);
          })
          .filter(Boolean);
      }
      if (value instanceof File) {
        return [value];
      }
      if (typeof value === "object" && value !== null) {
        const val = value.name || value.path || String(value);
        return val ? [val] : [];
      }
      return value ? [String(value)] : [];

    default:
      return value;
  }
}

/**
 * Membuat jawaban kosong berdasarkan daftar pertanyaan
 */
export function createEmptyAnswers(questions) {
  return questions.map((q) => ({
    id: uuidv4(),
    question_id: q.id,
    answer_data: normalizeAnswerValue(q.type, null),
  }));
}

/**
 * Normalisasi jawaban dari server → ke format konsisten localAnswers
 */
export function normalizeServerAnswers(serverAnswers) {
  return serverAnswers.map((a) => ({
    ...a,
    answer_data: normalizeAnswerValue(
      a.question_type_snapshot || a.type,
      a.answer_data
    ),
  }));
}

export const normalizeAnswer = (a) => {
  const type = a.question_type_snapshot || a.question?.type || "text";
  let data = a.answer_data;

  // Normalize based on type
  switch (type) {
    case "checkbox":
    case "file":
    case "multiple_file":
      if (!Array.isArray(data)) {
        data = data ? [String(data)] : [];
      } else {
        data = data.map((item) => String(item)).filter(Boolean);
      }
      break;

    case "radio":
    case "text":
    default:
      if (Array.isArray(data)) {
        data = data.length > 0 ? String(data[0]) : "";
      } else if (data === null || data === undefined) {
        data = "";
      } else {
        data = String(data);
      }
      break;
  }

  return {
    ...a,
    question_options_snapshot: safeJsonDecode(a.question_options_snapshot, []),
    question_file_types_snapshot: safeJsonDecode(
      a.question_file_types_snapshot,
      []
    ),
    answer_data: data,
  };
};

// ============ THUNKS ============

export const fetchAssignmentAnswers = createAsyncThunk(
  "assignmentAnswer/fetchAssignmentAnswers",
  async (
    { assignmentId, force = false },
    { getState, signal, rejectWithValue }
  ) => {
    const state = getState().assignmentAnswer;

    // Check cache first unless force refresh is requested
    if (!force && state.byAssignment[assignmentId]?.length) {
      const lastUpdated = state.lastUpdatedByAssignment[assignmentId];
      const isStale = lastUpdated ? Date.now() - lastUpdated > 300000 : false; // 5 minutes cache

      if (!isStale) {
        return {
          assignmentId,
          answers: state.byAssignment[assignmentId],
          fromCache: true,
        };
      }
    }

    try {
      await axios.get("sanctum/csrf-cookie", { signal });
      const res = await axios.get(
        `${API_BASE_URL}api/assignments/${assignmentId}/answers`,
        { signal }
      );

      return {
        assignmentId,
        answers: res.data.answers || [],
        canViewAll: res.data.can_view_all || false,
        hasSubmitted: res.data.has_submitted || false,
        isReadonly: res.data.is_readonly || false,
        groupedAnswers: res.data.grouped_answers || {},
        totalRespondents: res.data.total_respondents || 0,
      };
    } catch (err) {
      return rejectWithValue({
        assignmentId,
        message: `Failed to fetch answers: ${err.message}`,
      });
    }
  }
);

export const createAssignmentAnswers = createAsyncThunk(
  "assignmentAnswer/createAssignmentAnswers",
  async ({ assignmentId, answers }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");

      // Create FormData for file uploads
      const formData = new FormData();

      // Check if any answers contain files
      const hasFiles = answers.some(
        (answer) =>
          Array.isArray(answer.answer_data) &&
          answer.answer_data.some((item) => item instanceof File)
      );

      if (hasFiles) {
        // Use FormData for file uploads
        const processedAnswers = answers.map((answer) => {
          if (Array.isArray(answer.answer_data)) {
            const files = [];
            const nonFiles = [];

            answer.answer_data.forEach((item) => {
              if (item instanceof File) {
                files.push(item);
              } else {
                nonFiles.push(item);
              }
            });

            // Add files to FormData
            files.forEach((file) => {
              formData.append(`answer_${answer.question_id}_files[]`, file);
            });

            // Return non-file data
            return {
              ...answer,
              answer_data: nonFiles,
              has_files: files.length > 0,
            };
          }
          return answer;
        });

        formData.append("answers", JSON.stringify(processedAnswers));
      } else {
        // Regular JSON request
        const res = await axios.post(
          `${API_BASE_URL}api/assignments/${assignmentId}/answers`,
          { answers }
        );

        return {
          assignmentId,
          answers: res.data.answers || [],
          isReadonly: res.data.is_readonly || false,
        };
      }

      // Send FormData request
      const res = await axios.post(
        `${API_BASE_URL}api/assignments/${assignmentId}/answers`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return {
        assignmentId,
        answers: res.data.answers || [],
        isReadonly: res.data.is_readonly || false,
      };
    } catch (err) {
      const errorData = err.response?.data || {};
      return rejectWithValue({
        assignmentId,
        code: errorData.code,
        message: errorData.error || "Failed to create answers",
        ...errorData,
      });
    }
  }
);

export const gradeAssignmentAnswer = createAsyncThunk(
  "assignmentAnswer/gradeAssignmentAnswer",
  async (
    { assignmentId, answerId, is_correct, awarded_points },
    { rejectWithValue }
  ) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const res = await axios.post(
        `${API_BASE_URL}api/assignments/${assignmentId}/answers/${answerId}/grade`,
        { is_correct, awarded_points }
      );

      return {
        assignmentId,
        answer: res.data.answer,
      };
    } catch (err) {
      const errorData = err.response?.data || {};
      return rejectWithValue({
        assignmentId,
        message: errorData.error || "Failed to grade answer",
      });
    }
  }
);

export const fetchAssignmentSummary = createAsyncThunk(
  "assignmentAnswer/fetchAssignmentSummary",
  async ({ assignmentId }, { signal, rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie", { signal });
      const res = await axios.get(
        `${API_BASE_URL}api/assignments/${assignmentId}/summary`,
        { signal }
      );
      return { assignmentId, summary: res.data };
    } catch (err) {
      return rejectWithValue({
        assignmentId,
        message: `Failed to fetch summary: ${err.message}`,
      });
    }
  }
);

// ============ SLICE ============

const initialState = {
  byAssignment: {},
  statusByAssignment: {},
  errorByAssignment: {},
  lastUpdatedByAssignment: {},
  metadataByAssignment: {},
  summaryByAssignment: {},
};

const assignmentAnswerSlice = createSlice({
  name: "assignmentAnswer",
  initialState,
  reducers: {
    resetAssignmentAnswerState: (state, action) => {
      if (action.payload?.assignmentId) {
        const id = action.payload.assignmentId;
        delete state.byAssignment[id];
        delete state.statusByAssignment[id];
        delete state.errorByAssignment[id];
        delete state.lastUpdatedByAssignment[id];
        delete state.metadataByAssignment[id];
        delete state.summaryByAssignment[id];
      } else {
        return initialState;
      }
    },
    hydrateAssignmentAnswers: (state, action) => {
      const { assignmentId, answers, metadata = {} } = action.payload;
      state.byAssignment[assignmentId] = answers.map(normalizeAnswer);
      state.statusByAssignment[assignmentId] = "succeeded";
      state.lastUpdatedByAssignment[assignmentId] = Date.now();
      state.metadataByAssignment[assignmentId] = metadata;
    },
    invalidateAssignmentAnswerCache: (state, action) => {
      const { assignmentId } = action.payload;
      delete state.lastUpdatedByAssignment[assignmentId];
    },
    clearAssignmentAnswersCache: () => initialState,
    updateSubmissionStatus: (state, action) => {
      const { assignmentId, hasSubmitted, isReadonly } = action.payload;
      if (state.metadataByAssignment[assignmentId]) {
        state.metadataByAssignment[assignmentId].hasSubmitted = hasSubmitted;
        state.metadataByAssignment[assignmentId].isReadonly = isReadonly;
      } else {
        state.metadataByAssignment[assignmentId] = { hasSubmitted, isReadonly };
      }
    },
    // New reducer for updating local answers
    updateLocalAnswer: (state, action) => {
      const { assignmentId, questionId, value, questionType } = action.payload;
      const normalizedValue = normalizeAnswerValue(questionType, value);

      if (!state.localAnswers) state.localAnswers = {};
      if (!state.localAnswers[assignmentId])
        state.localAnswers[assignmentId] = {};

      state.localAnswers[assignmentId][questionId] = normalizedValue;
    },
    updateSubmissionInGroup: (state, action) => {
      const { assignmentId, submission } = action.payload;
      const studentId = submission.student_id;

      if (
        state.metadataByAssignment[assignmentId]?.groupedAnswers?.[studentId]
      ) {
        state.metadataByAssignment[assignmentId].groupedAnswers[
          studentId
        ].submission = submission;
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // FETCH - pending
      .addCase(fetchAssignmentAnswers.pending, (state, action) => {
        const { assignmentId } = action.meta.arg;
        state.statusByAssignment[assignmentId] = "loading";
        state.errorByAssignment[assignmentId] = null;
      })
      // FETCH - fulfilled
      .addCase(fetchAssignmentAnswers.fulfilled, (state, action) => {
        const {
          assignmentId,
          answers,
          fromCache,
          canViewAll,
          hasSubmitted,
          isReadonly,
          groupedAnswers,
          totalRespondents,
        } = action.payload;

        if (!fromCache) {
          state.byAssignment[assignmentId] = answers.map(normalizeAnswer);
          state.lastUpdatedByAssignment[assignmentId] = Date.now();
        }

        // Store metadata
        state.metadataByAssignment[assignmentId] = {
          canViewAll,
          hasSubmitted,
          isReadonly,
          groupedAnswers,
          totalRespondents,
        };

        state.statusByAssignment[assignmentId] = "succeeded";
        state.errorByAssignment[assignmentId] = null;
      })
      // FETCH - rejected
      .addCase(fetchAssignmentAnswers.rejected, (state, action) => {
        const { assignmentId } = action.meta.arg;
        state.statusByAssignment[assignmentId] = "failed";
        state.errorByAssignment[assignmentId] = {
          message: action.payload?.message || action.error.message,
          code: action.payload?.code,
        };
      })
      // CREATE - pending
      .addCase(createAssignmentAnswers.pending, (state, action) => {
        const { assignmentId } = action.meta.arg;
        state.statusByAssignment[assignmentId] = "submitting";
        state.errorByAssignment[assignmentId] = null;
      })
      // CREATE - fulfilled
      .addCase(createAssignmentAnswers.fulfilled, (state, action) => {
        const { assignmentId, answers, isReadonly } = action.payload;
        state.byAssignment[assignmentId] = answers.map(normalizeAnswer);
        state.lastUpdatedByAssignment[assignmentId] = Date.now();
        state.metadataByAssignment[assignmentId] = {
          ...state.metadataByAssignment[assignmentId],
          hasSubmitted: true,
          isReadonly,
        };
        state.statusByAssignment[assignmentId] = "succeeded";
        state.errorByAssignment[assignmentId] = null;
      })
      // CREATE - rejected
      .addCase(createAssignmentAnswers.rejected, (state, action) => {
        const { assignmentId } = action.meta.arg;
        state.statusByAssignment[assignmentId] = "failed";
        state.errorByAssignment[assignmentId] = action.payload;
      })
      // GRADE - pending
      .addCase(gradeAssignmentAnswer.pending, (state, action) => {
        const { assignmentId } = action.meta.arg;
        state.statusByAssignment[assignmentId] = "grading";
        state.errorByAssignment[assignmentId] = null;
      })
      // GRADE - fulfilled
      .addCase(gradeAssignmentAnswer.fulfilled, (state, action) => {
        const { assignmentId, answer } = action.payload;
        const normalized = normalizeAnswer(answer);

        // Update in main list
        const index =
          state.byAssignment[assignmentId]?.findIndex(
            (a) => a.id === normalized.id
          ) ?? -1;
        if (index !== -1) {
          state.byAssignment[assignmentId][index] = normalized;
        } else if (state.byAssignment[assignmentId]) {
          state.byAssignment[assignmentId].push(normalized);
        }

        // Update in grouped if exists
        const grouped =
          state.metadataByAssignment[assignmentId]?.groupedAnswers;
        if (grouped) {
          const userId = normalized.user_id;
          if (grouped[userId]) {
            const gIndex = grouped[userId].answers.findIndex(
              (a) => a.id === normalized.id
            );
            if (gIndex !== -1) {
              grouped[userId].answers[gIndex] = normalized;
            }
          }
        }

        state.statusByAssignment[assignmentId] = "succeeded";
        state.errorByAssignment[assignmentId] = null;
      })
      // GRADE - rejected
      .addCase(gradeAssignmentAnswer.rejected, (state, action) => {
        const { assignmentId } = action.meta.arg;
        state.statusByAssignment[assignmentId] = "failed";
        state.errorByAssignment[assignmentId] = action.payload;
      })
      // SUMMARY - pending
      .addCase(fetchAssignmentSummary.pending, (state, action) => {
        const { assignmentId } = action.meta.arg;
        state.statusByAssignment[assignmentId] = "loading";
        state.errorByAssignment[assignmentId] = null;
      })
      // SUMMARY - fulfilled
      .addCase(fetchAssignmentSummary.fulfilled, (state, action) => {
        const { assignmentId, summary } = action.payload;
        state.summaryByAssignment[assignmentId] = summary;
        state.statusByAssignment[assignmentId] = "succeeded";
        state.errorByAssignment[assignmentId] = null;
      })
      // SUMMARY - rejected
      .addCase(fetchAssignmentSummary.rejected, (state, action) => {
        const { assignmentId } = action.meta.arg;
        state.statusByAssignment[assignmentId] = "failed";
        state.errorByAssignment[assignmentId] = action.payload;
      });
  },
});

export const {
  resetAssignmentAnswerState,
  hydrateAssignmentAnswers,
  invalidateAssignmentAnswerCache,
  clearAssignmentAnswersCache,
  updateSubmissionStatus,
  updateLocalAnswer,
  updateSubmissionInGroup,
} = assignmentAnswerSlice.actions;

// ============ SELECTORS ============
export const selectAssignmentAnswersByAssignment = (state, assignmentId) =>
  state.assignmentAnswer.byAssignment[assignmentId] || [];

export const selectAssignmentAnswerStatus = (state, assignmentId) =>
  state.assignmentAnswer.statusByAssignment[assignmentId] || "idle";

export const selectAssignmentAnswerError = (state, assignmentId) => {
  const error = state.assignmentAnswer.errorByAssignment[assignmentId];
  return typeof error === "object" ? error : { message: error };
};

export const selectAssignmentAnswerLastUpdated = (state, assignmentId) =>
  state.assignmentAnswer.lastUpdatedByAssignment[assignmentId] || null;

export const selectIsAssignmentAnswerCacheValid = (state, assignmentId) => {
  const lastUpdated =
    state.assignmentAnswer.lastUpdatedByAssignment[assignmentId];
  if (!lastUpdated) return false;
  return Date.now() - lastUpdated < 300000; // 5 minutes
};

export const selectAssignmentAnswerMetadata = (state, assignmentId) =>
  state.assignmentAnswer.metadataByAssignment[assignmentId] || {};

export const selectCanViewAll = (state, assignmentId) =>
  state.assignmentAnswer.metadataByAssignment[assignmentId]?.canViewAll ||
  false;

export const selectHasSubmitted = (state, assignmentId) =>
  state.assignmentAnswer.metadataByAssignment[assignmentId]?.hasSubmitted ||
  false;

export const selectIsReadonly = (state, assignmentId) =>
  state.assignmentAnswer.metadataByAssignment[assignmentId]?.isReadonly ||
  false;

export const selectGroupedAnswers = (state, assignmentId) =>
  state.assignmentAnswer.metadataByAssignment[assignmentId]?.groupedAnswers ||
  {};

export const selectTotalRespondents = (state, assignmentId) =>
  state.assignmentAnswer.metadataByAssignment[assignmentId]?.totalRespondents ||
  0;

export const selectAssignmentSummary = (state, assignmentId) =>
  state.assignmentAnswer.summaryByAssignment[assignmentId] || null;

export const selectLocalAnswers = (state, assignmentId) =>
  state.assignmentAnswer.localAnswers?.[assignmentId] || {};

// Memoized selectors
export const selectAssignmentAnswersCount = createSelector(
  [selectAssignmentAnswersByAssignment],
  (answers) => answers.length
);

export const selectIsSubmitting = createSelector(
  [selectAssignmentAnswerStatus],
  (status) => status === "submitting"
);

export default assignmentAnswerSlice.reducer;
