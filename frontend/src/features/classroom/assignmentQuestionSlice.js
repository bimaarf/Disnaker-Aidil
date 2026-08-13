// src/features/classroom/assignmentQuestionSlice.js
import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import axios from "axios";

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

const normalizeQuestion = (q) => ({
  ...q,
  options: safeJsonDecode(q.options, []),
  file_types: safeJsonDecode(q.file_types, []),
});

const sortQuestions = (questions) =>
  [...questions].sort((a, b) => a.page - b.page || a.sort_order - b.sort_order);

const mergeQuestions = (existing, incoming) => {
  const incomingIds = incoming.map((q) => q.id);
  const filtered = existing.filter((q) => !incomingIds.includes(q.id));
  return sortQuestions([...filtered, ...incoming]);
};

// ============ THUNKS ============

export const fetchAssignmentQuestions = createAsyncThunk(
  "assignmentQuestion/fetchAssignmentQuestions",
  async (
    { assignmentId, force = false },
    { getState, signal, rejectWithValue }
  ) => {
    const state = getState().assignmentQuestion;

    // Check cache first unless force refresh is requested
    if (!force && state.byAssignment[assignmentId]?.length) {
      const lastUpdated = state.lastUpdatedByAssignment[assignmentId];
      const isStale = lastUpdated ? Date.now() - lastUpdated > 300000 : false; // 5 minutes cache

      if (!isStale) {
        return {
          assignmentId,
          questions: state.byAssignment[assignmentId],
          fromCache: true,
        };
      }
    }

    try {
      await axios.get("sanctum/csrf-cookie", { signal });
      const res = await axios.get(
        `${API_BASE_URL}api/assignments/${assignmentId}/questions`,
        { signal }
      );
      return { assignmentId, questions: res.data.questions || [] };
    } catch (err) {
      return rejectWithValue({
        assignmentId,
        message: `Failed to fetch questions: ${err.message}`,
      });
    }
  }
);

export const createAssignmentQuestions = createAsyncThunk(
  "assignmentQuestion/createAssignmentQuestions",
  async ({ assignmentId, questions }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const res = await axios.post(
        `${API_BASE_URL}api/assignments/${assignmentId}/questions`,
        { questions }
      );
      return { assignmentId, questions: res.data.questions || [] };
    } catch (err) {
      return rejectWithValue({
        assignmentId,
        ...(err.response?.data || { message: "Failed to create questions" }),
      });
    }
  }
);

export const updateAssignmentQuestions = createAsyncThunk(
  "assignmentQuestion/updateAssignmentQuestions",
  async ({ assignmentId, questions }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const res = await axios.put(
        `${API_BASE_URL}api/assignments/${assignmentId}/questions`,
        { questions }
      );
      return { assignmentId, questions: res.data.questions || [] };
    } catch (err) {
      return rejectWithValue({
        assignmentId,
        ...(err.response?.data || { message: "Failed to update questions" }),
      });
    }
  }
);

export const updateAssignmentQuestionOrder = createAsyncThunk(
  "assignmentQuestion/updateAssignmentQuestionOrder",
  async ({ assignmentId, page, questions }, { rejectWithValue }) => {
    try {
      await axios.get("sanctum/csrf-cookie");
      const res = await axios.put(
        `${API_BASE_URL}api/assignments/${assignmentId}/questions/order`,
        { page, questions }
      );
      return { assignmentId, questions: res.data.questions || [] };
    } catch (err) {
      return rejectWithValue({
        assignmentId,
        ...(err.response?.data || { message: "Failed to update order" }),
      });
    }
  }
);

export const deleteAssignmentQuestion = createAsyncThunk(
  "assignmentQuestion/deleteAssignmentQuestion",
  async (id, { getState, rejectWithValue }) => {
    try {
      // Find assignmentId from state before deleting
      const state = getState().assignmentQuestion;
      let assignmentId = null;

      for (const [aId, questions] of Object.entries(state.byAssignment)) {
        if (questions.find((q) => q.id === id)) {
          assignmentId = aId;
          break;
        }
      }

      await axios.get("sanctum/csrf-cookie");
      const res = await axios.delete(`${API_BASE_URL}api/questions/${id}`);
      return { id, assignmentId: assignmentId || res.data.assignment_id };
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Failed to delete question" }
      );
    }
  }
);

// ============ SLICE ============

const initialState = {
  byAssignment: {},
  statusByAssignment: {},
  errorByAssignment: {},
  lastUpdatedByAssignment: {},
};

const assignmentQuestionSlice = createSlice({
  name: "assignmentQuestion",
  initialState,
  reducers: {
    resetAssignmentQuestionState: (state, action) => {
      if (action.payload?.assignmentId) {
        const id = action.payload.assignmentId;
        delete state.byAssignment[id];
        delete state.statusByAssignment[id];
        delete state.errorByAssignment[id];
        delete state.lastUpdatedByAssignment[id];
      } else {
        return initialState;
      }
    },
    hydrateAssignmentQuestions: (state, action) => {
      const { assignmentId, questions } = action.payload;
      state.byAssignment[assignmentId] = sortQuestions(
        questions.map(normalizeQuestion)
      );
      state.statusByAssignment[assignmentId] = "succeeded";
      state.lastUpdatedByAssignment[assignmentId] = Date.now();
    },
    invalidateAssignmentCache: (state, action) => {
      const { assignmentId } = action.payload;
      delete state.lastUpdatedByAssignment[assignmentId];
    },
    clearAssignmentQuestionsCache: () => initialState,
    // Optimistic update untuk reordering
    optimisticReorderQuestions: (state, action) => {
      const { assignmentId, page, questions } = action.payload;

      if (state.byAssignment[assignmentId]) {
        const otherPagesQuestions = state.byAssignment[assignmentId].filter(
          (q) => q.page !== page
        );

        const updatedPageQuestions = questions.map((q, index) => {
          const existingQuestion = state.byAssignment[assignmentId].find(
            (item) => item.id === q.id
          );

          return {
            ...existingQuestion,
            sort_order: index,
          };
        });

        state.byAssignment[assignmentId] = [
          ...otherPagesQuestions,
          ...updatedPageQuestions,
        ].sort((a, b) => a.page - b.page || a.sort_order - b.sort_order);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH - pending
      .addCase(fetchAssignmentQuestions.pending, (state, action) => {
        const { assignmentId } = action.meta.arg;
        state.statusByAssignment[assignmentId] = "loading";
        state.errorByAssignment[assignmentId] = null;
      })
      // FETCH - fulfilled
      .addCase(fetchAssignmentQuestions.fulfilled, (state, action) => {
        const { assignmentId, questions, fromCache } = action.payload;
        if (!fromCache) {
          state.byAssignment[assignmentId] = sortQuestions(
            questions.map(normalizeQuestion)
          );
          state.lastUpdatedByAssignment[assignmentId] = Date.now();
        }
        state.statusByAssignment[assignmentId] = "succeeded";
        state.errorByAssignment[assignmentId] = null;
      })
      // FETCH - rejected
      .addCase(fetchAssignmentQuestions.rejected, (state, action) => {
        const { assignmentId } = action.meta.arg;
        state.statusByAssignment[assignmentId] = "failed";
        state.errorByAssignment[assignmentId] =
          action.payload?.message || action.error.message;
      })

      // CREATE - fulfilled
      .addCase(createAssignmentQuestions.fulfilled, (state, action) => {
        const { assignmentId, questions } = action.payload;
        const existing = state.byAssignment[assignmentId] || [];

        // Merge questions baru dengan yang sudah ada
        state.byAssignment[assignmentId] = mergeQuestions(
          existing,
          questions.map(normalizeQuestion)
        );

        state.statusByAssignment[assignmentId] = "succeeded";
        state.lastUpdatedByAssignment[assignmentId] = Date.now();
        state.errorByAssignment[assignmentId] = null;
      })

      // UPDATE - fulfilled
      .addCase(updateAssignmentQuestions.fulfilled, (state, action) => {
        const { assignmentId, questions } = action.payload;
        state.byAssignment[assignmentId] = questions.map(normalizeQuestion);
        state.statusByAssignment[assignmentId] = "succeeded";
        state.lastUpdatedByAssignment[assignmentId] = Date.now();
        state.errorByAssignment[assignmentId] = null;
      })

      // ORDER - pending (optimistic update)
      .addCase(updateAssignmentQuestionOrder.pending, (state, action) => {
        const { assignmentId, page, questions } = action.meta.arg;
        const { optimisticReorderQuestions } = assignmentQuestionSlice.actions;

        // Gunakan reducer untuk optimistic update
        optimisticReorderQuestions({ assignmentId, page, questions });
      })

      // ORDER - fulfilled
      .addCase(updateAssignmentQuestionOrder.fulfilled, (state, action) => {
        const { assignmentId, questions } = action.payload;
        state.byAssignment[assignmentId] = questions.map(normalizeQuestion);
        state.statusByAssignment[assignmentId] = "succeeded";
        state.lastUpdatedByAssignment[assignmentId] = Date.now();
        state.errorByAssignment[assignmentId] = null;
      })

      // ORDER - rejected (rollback)
      .addCase(updateAssignmentQuestionOrder.rejected, (state, action) => {
        const { assignmentId } = action.meta.arg;
        state.statusByAssignment[assignmentId] = "failed";
        state.errorByAssignment[assignmentId] =
          action.payload?.message || action.error.message;

        // Invalidate cache untuk memaksa reload
        delete state.lastUpdatedByAssignment[assignmentId];
      })

      // DELETE - fulfilled
      .addCase(deleteAssignmentQuestion.fulfilled, (state, action) => {
        const { id, assignmentId } = action.payload;
        if (assignmentId && state.byAssignment[assignmentId]) {
          state.byAssignment[assignmentId] = state.byAssignment[assignmentId]
            .filter((q) => q.id !== id)
            .sort((a, b) => a.page - b.page || a.sort_order - b.sort_order);
          state.lastUpdatedByAssignment[assignmentId] = Date.now();
        }
        state.errorByAssignment[assignmentId] = null;
      })

      // Handle errors for all operations
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          const assignmentId =
            action.meta?.arg?.assignmentId || action.payload?.assignmentId;
          if (assignmentId) {
            state.statusByAssignment[assignmentId] = "failed";
            state.errorByAssignment[assignmentId] =
              action.payload?.message || action.error.message;
          }
        }
      );
  },
});

export const {
  resetAssignmentQuestionState,
  hydrateAssignmentQuestions,
  invalidateAssignmentCache,
  clearAssignmentQuestionsCache,
  optimisticReorderQuestions,
} = assignmentQuestionSlice.actions;

// Selectors
export const selectAssignmentQuestionsByAssignment = (state, assignmentId) =>
  state.assignmentQuestion.byAssignment[assignmentId] || [];

export const selectAssignmentStatus = (state, assignmentId) =>
  state.assignmentQuestion.statusByAssignment[assignmentId] || "idle";

export const selectAssignmentError = (state, assignmentId) =>
  state.assignmentQuestion.errorByAssignment[assignmentId] || null;

export const selectAssignmentLastUpdated = (state, assignmentId) =>
  state.assignmentQuestion.lastUpdatedByAssignment[assignmentId] || null;

export const selectIsAssignmentCacheValid = (state, assignmentId) => {
  const lastUpdated =
    state.assignmentQuestion.lastUpdatedByAssignment[assignmentId];
  if (!lastUpdated) return false;
  return Date.now() - lastUpdated < 300000; // 5 minutes
};

// Memoized selectors
export const selectAssignmentQuestionsCount = createSelector(
  [selectAssignmentQuestionsByAssignment],
  (questions) => questions.length
);

export const selectAssignmentQuestionsByPage = createSelector(
  [selectAssignmentQuestionsByAssignment, (_, page) => page],
  (questions, page) => questions.filter((q) => q.page === page)
);

export default assignmentQuestionSlice.reducer;
