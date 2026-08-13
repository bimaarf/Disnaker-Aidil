// src/features/classroom/assignmentQuestionHook.js
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createAssignmentQuestions,
  deleteAssignmentQuestion,
  fetchAssignmentQuestions,
  updateAssignmentQuestionOrder,
  updateAssignmentQuestions,
  selectAssignmentQuestionsByAssignment,
  selectAssignmentStatus,
  selectAssignmentError,
  selectIsAssignmentCacheValid,
  invalidateAssignmentCache,
} from "./assignmentQuestionSlice";
import { toast } from "react-toastify";
import { store } from "../store";

export const useAssignmentQuestions = (assignmentId, options = {}) => {
  const { autoLoad = true, onError = null, forceRefresh = false } = options;
  const dispatch = useDispatch();

  const questions = useSelector((state) =>
    selectAssignmentQuestionsByAssignment(state, assignmentId)
  );
  const status = useSelector((state) =>
    selectAssignmentStatus(state, assignmentId)
  );
  const error = useSelector((state) =>
    selectAssignmentError(state, assignmentId)
  );
  const isCacheValid = useSelector((state) =>
    selectIsAssignmentCacheValid(state, assignmentId)
  );

  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef(null);

  const loadQuestions = useCallback(
    async (force = false) => {
      if (!assignmentId) return;

      const state = store.getState();
      const cached = selectAssignmentQuestionsByAssignment(state, assignmentId);
      const cacheValid = selectIsAssignmentCacheValid(state, assignmentId);

      // 🛑 jika cache valid → skip
      if (!force && cacheValid && cached.length > 0) {
        return { questions: cached, fromCache: true };
      }

      // 🛑 jika cache valid tapi kosong → jangan spam fetch
      if (!force && cacheValid && cached.length === 0) {
        return { questions: [], fromCache: true };
      }

      setIsLoading(true);
      try {
        abortControllerRef.current = new AbortController();
        const result = await dispatch(
          fetchAssignmentQuestions({
            assignmentId,
            force: force || forceRefresh,
          })
        ).unwrap();
        return result;
      } catch (err) {
        if (err.name !== "AbortError") {
          const errorMessage = err.message || "Failed to load questions";
          toast.error(errorMessage);
          if (onError) onError(err);
        }
        throw err;
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [assignmentId, dispatch, onError, forceRefresh]
  );

  useEffect(() => {
    if (autoLoad && assignmentId) {
      loadQuestions();
    }
    // hanya jalan ulang kalau assignmentId atau autoLoad berubah
  }, [assignmentId, autoLoad]);

  const invalidateCache = useCallback(() => {
    if (assignmentId) {
      dispatch(invalidateAssignmentCache({ assignmentId }));
    }
  }, [assignmentId, dispatch]);

  const addQuestions = useCallback(
    async (newQuestions) => {
      try {
        const result = await dispatch(
          createAssignmentQuestions({ assignmentId, questions: newQuestions })
        ).unwrap();

        // Jangan tampilkan toast di sini karena akan ditangani di component
        // toast.success("Questions added successfully");

        return result;
      } catch (err) {
        const errorMessage = err.message || "Failed to add questions";
        toast.error(errorMessage);
        throw err;
      }
    },
    [assignmentId, dispatch]
  );

  const editQuestions = useCallback(
    async (updatedQuestions) => {
      try {
        const result = await dispatch(
          updateAssignmentQuestions({
            assignmentId,
            questions: updatedQuestions,
          })
        ).unwrap();
        toast.success("Questions updated successfully");
        return result;
      } catch (err) {
        const errorMessage = err.message || "Failed to update questions";
        toast.error(errorMessage);
        throw err;
      }
    },
    [assignmentId, dispatch]
  );

  const reorderQuestions = useCallback(
    async (page, reorderedQuestions) => {
      try {
        const result = await dispatch(
          updateAssignmentQuestionOrder({
            assignmentId,
            page,
            questions: reorderedQuestions,
          })
        ).unwrap();
        return result;
      } catch (err) {
        const errorMessage = err.message || "Failed to reorder questions";
        toast.error(errorMessage);
        throw err;
      }
    },
    [assignmentId, dispatch]
  );

  const removeQuestion = useCallback(
    async (questionId) => {
      try {
        await dispatch(deleteAssignmentQuestion(questionId)).unwrap();
        toast.success("Question deleted successfully");
      } catch (err) {
        const errorMessage = err.message || "Failed to delete question";
        toast.error(errorMessage);
        throw err;
      }
    },
    [dispatch]
  );

  // Fungsi baru untuk mendapatkan questions by page
  const getQuestionsByPage = useCallback(
    (page) => {
      const state = store.getState();
      const allQuestions = selectAssignmentQuestionsByAssignment(
        state,
        assignmentId
      );
      return allQuestions
        .filter((q) => q.page === page)
        .sort((a, b) => a.sort_order - b.sort_order);
    },
    [assignmentId]
  );

  return {
    questions,
    getQuestionsByPage,
    isLoading: isLoading || status === "loading",
    error,
    isCacheValid,
    loadQuestions,
    invalidateCache,
    addQuestions,
    editQuestions,
    reorderQuestions,
    removeQuestion,
  };
};
