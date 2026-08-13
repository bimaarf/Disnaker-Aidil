// src/features/classroom/assignmentAnswerHook.js - IMPROVED VERSION
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createAssignmentAnswers,
  fetchAssignmentAnswers,
  fetchAssignmentSummary,
  gradeAssignmentAnswer,
  selectAssignmentAnswersByAssignment,
  selectAssignmentAnswerStatus,
  selectAssignmentAnswerError,
  selectIsAssignmentAnswerCacheValid,
  selectCanViewAll,
  selectHasSubmitted,
  selectIsReadonly,
  selectGroupedAnswers,
  selectTotalRespondents,
  selectAssignmentSummary,
  selectIsSubmitting,
  selectLocalAnswers,
  invalidateAssignmentAnswerCache,
  updateSubmissionStatus,
  updateLocalAnswer,
  normalizeAnswer,
} from "./assignmentAnswerSlice";
import { toast } from "react-toastify";
import { store } from "../store";

/* ---------------- Helper Functions for Answer Preview ---------------- */
export const formatAnswerPreview = (answer) => {
  const questionType = answer.question_type_snapshot || "text";
  const answerData = answer.answer_data;
  const options = answer.question_options_snapshot || [];

  switch (questionType) {
    case "text":
      return formatTextPreview(answerData);
    case "radio":
      return formatRadioPreview(answerData, options);
    case "checkbox":
      return formatCheckboxPreview(answerData, options);
    case "file":
    case "multiple_file":
      return formatFilePreview(answerData);
    default:
      return "Unknown answer type";
  }
};

const formatTextPreview = (answerData) => {
  if (!answerData || answerData === "") return "No answer provided";
  const text = Array.isArray(answerData)
    ? answerData.join(", ")
    : String(answerData);
  return text.length > 100 ? text.substring(0, 100) + "..." : text;
};

const formatRadioPreview = (answerData, options) => {
  if (!answerData) return "No selection made";

  // Handle jika answer tersimpan sebagai array (untuk backward compatibility)
  const selectedValue = Array.isArray(answerData) ? answerData[0] : answerData;

  // Cari label dari options menggunakan snapshot
  const selectedOption = options.find(
    (opt) =>
      (opt.id && String(opt.id) === String(selectedValue)) ||
      (opt.value && String(opt.value) === String(selectedValue)) ||
      (opt.label && String(opt.label) === String(selectedValue))
  );

  return selectedOption ? selectedOption.label : String(selectedValue);
};

const formatCheckboxPreview = (answerData, options) => {
  if (!Array.isArray(answerData) || answerData.length === 0) {
    return "No selections made";
  }

  const selectedLabels = answerData.map((selectedValue) => {
    const selectedOption = options.find(
      (opt) =>
        (opt.id && String(opt.id) === String(selectedValue)) ||
        (opt.value && String(opt.value) === String(selectedValue)) ||
        (opt.label && String(opt.label) === String(selectedValue))
    );
    return selectedOption ? selectedOption.label : String(selectedValue);
  });

  return selectedLabels.join(", ");
};

const formatFilePreview = (answerData) => {
  if (!answerData || (Array.isArray(answerData) && answerData.length === 0)) {
    return "No files uploaded";
  }

  const files = Array.isArray(answerData) ? answerData : [answerData];
  const fileCount = files.length;

  if (fileCount === 1) {
    const file = files[0];
    return file instanceof File ? file.name : file.split("/").pop();
  }

  const displayFiles = files
    .slice(0, 2)
    .map((file) => (file instanceof File ? file.name : file.split("/").pop()));
  const remaining = fileCount - displayFiles.length;

  return (
    displayFiles.join(", ") + (remaining > 0 ? ` and ${remaining} more` : "")
  );
};

const normalizeGroupedAnswers = (grouped) => {
  if (!grouped) return {};
  const result = {};
  for (const [userId, respondent] of Object.entries(grouped)) {
    result[userId] = {
      ...respondent,
      answers: respondent.answers.map(normalizeAnswer),
    };
  }
  return result;
};

/* ---------------- Main Hook ---------------- */
export const useAssignmentAnswers = (assignmentId, options = {}) => {
  const { autoLoad = true, onError = null, forceRefresh = false } = options;
  const dispatch = useDispatch();

  // Selectors
  const rawAnswers = useSelector((state) =>
    selectAssignmentAnswersByAssignment(state, assignmentId)
  );
  const status = useSelector((state) =>
    selectAssignmentAnswerStatus(state, assignmentId)
  );
  const error = useSelector((state) =>
    selectAssignmentAnswerError(state, assignmentId)
  );
  const isCacheValid = useSelector((state) =>
    selectIsAssignmentAnswerCacheValid(state, assignmentId)
  );
  const canViewAll = useSelector((state) =>
    selectCanViewAll(state, assignmentId)
  );
  const hasSubmitted = useSelector((state) =>
    selectHasSubmitted(state, assignmentId)
  );
  const isReadonly = useSelector((state) =>
    selectIsReadonly(state, assignmentId)
  );
  const rawGroupedAnswers = useSelector((state) =>
    selectGroupedAnswers(state, assignmentId)
  );
  const totalRespondents = useSelector((state) =>
    selectTotalRespondents(state, assignmentId)
  );
  const isSubmitting = useSelector((state) =>
    selectIsSubmitting(state, assignmentId)
  );
  const localAnswers = useSelector((state) =>
    selectLocalAnswers(state, assignmentId)
  );

  // Normalize data
  const answers = rawAnswers.map(normalizeAnswer);
  const groupedAnswers = normalizeGroupedAnswers(rawGroupedAnswers);

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef(null);

  // Load answers with better error handling
  const loadAnswers = useCallback(
    async (force = false) => {
      if (!assignmentId) return;

      const state = store.getState();
      const cached = selectAssignmentAnswersByAssignment(state, assignmentId);
      const cacheValid = selectIsAssignmentAnswerCacheValid(
        state,
        assignmentId
      );

      if (!force && cacheValid && cached.length > 0) {
        return { answers: cached, fromCache: true };
      }

      setIsLoading(true);
      try {
        abortControllerRef.current = new AbortController();
        const result = await dispatch(
          fetchAssignmentAnswers({
            assignmentId,
            force: force || forceRefresh,
          })
        ).unwrap();
        return result;
      } catch (err) {
        if (err.name !== "AbortError") {
          const errorMessage = err.message || "Failed to load answers";
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

  // Load summary
  const loadSummary = useCallback(async () => {
    if (!assignmentId || !canViewAll) return;

    try {
      const result = await dispatch(
        fetchAssignmentSummary({ assignmentId })
      ).unwrap();
      return result;
    } catch (err) {
      const errorMessage = err.message || "Failed to load assignment summary";
      toast.error(errorMessage);
      throw err;
    }
  }, [assignmentId, canViewAll, dispatch]);

  // Auto load on mount
  useEffect(() => {
    if (autoLoad && assignmentId) {
      loadAnswers();
    }
  }, [assignmentId, autoLoad, loadAnswers]);

  // Cache invalidation
  const invalidateCache = useCallback(() => {
    if (assignmentId) {
      dispatch(invalidateAssignmentAnswerCache({ assignmentId }));
    }
  }, [assignmentId, dispatch]);

  // Update local answer - improved for better performance
  const updateAnswer = useCallback(
    (questionId, value, questionType) => {
      if (isReadonly || hasSubmitted) return;

      dispatch(
        updateLocalAnswer({
          assignmentId,
          questionId,
          value,
          questionType,
        })
      );
    },
    [assignmentId, dispatch, isReadonly, hasSubmitted]
  );

  // Get answer for question - checks local first, then server
  const getAnswerForQuestion = useCallback(
    (questionId) => {
      if (canViewAll) {
        // For admins, don't use local answers
        return null;
      }

      // Check local answers first
      const localAnswer = localAnswers[questionId];
      if (localAnswer !== undefined) {
        return localAnswer;
      }

      // Fallback to server answers
      const serverAnswer = answers.find((a) => a.question_id === questionId);
      return serverAnswer ? serverAnswer.answer_data : null;
    },
    [localAnswers, answers, canViewAll]
  );

  // Submit answers with better file handling
  const submitAnswers = useCallback(
    async (answersToSubmit) => {
      if (!Array.isArray(answersToSubmit)) {
        throw new Error("Answers must be an array");
      }

      // Validate and normalize answers
      const validatedAnswers = answersToSubmit
        .filter(
          (answer) => answer.question_id && answer.answer_data !== undefined
        )
        .map((answer) => {
          // Ensure proper normalization based on question type
          let normalizedData = answer.answer_data;

          // Handle file objects specially
          if (Array.isArray(normalizedData)) {
            const hasFiles = normalizedData.some(
              (item) => item instanceof File
            );
            if (hasFiles) {
              // Keep array as-is, FormData di slice akan handle
              return {
                ...answer,
                answer_data: normalizedData,
              };
            }
          }

          return {
            ...answer,
            answer_data: normalizedData,
          };
        });

      if (validatedAnswers.length === 0) {
        throw new Error("No valid answers to submit");
      }

      try {
        const result = await dispatch(
          createAssignmentAnswers({ assignmentId, answers: validatedAnswers })
        ).unwrap();

        toast.success("Answers submitted successfully");

        if (result.isReadonly) {
          dispatch(
            updateSubmissionStatus({
              assignmentId,
              hasSubmitted: true,
              isReadonly: true,
            })
          );
        }

        return result;
      } catch (err) {
        if (err.code === "ALREADY_SUBMITTED") {
          toast.error(
            "You have already submitted your answers. Each user can only submit once."
          );
        } else {
          toast.error(err.message || "Failed to submit answers");
        }
        throw err;
      }
    },
    [assignmentId, dispatch]
  );

  // Grade answer
  const gradeAnswer = useCallback(
    async (answerId, isCorrect, awardedPoints) => {
      if (!canViewAll) {
        throw new Error("Unauthorized to grade answers");
      }

      try {
        const result = await dispatch(
          gradeAssignmentAnswer({
            assignmentId,
            answerId,
            is_correct: isCorrect,
            awarded_points: awardedPoints,
          })
        ).unwrap();

        toast.success("Answer graded successfully");
        return result;
      } catch (err) {
        toast.error(err.message || "Failed to grade answer");
        throw err;
      }
    },
    [assignmentId, dispatch, canViewAll]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Helper untuk mendapatkan preview answer
  const getAnswerPreview = useCallback((answer) => {
    return formatAnswerPreview(answer);
  }, []);

  // Helper untuk mendapatkan sorted answers
  const getSortedAnswers = useCallback(() => {
    return [...answers].sort((a, b) => {
      // Sort by created_at jika ada, atau by id
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateA - dateB;
    });
  }, [answers]);

  // Convert local answers to submission format
  const getLocalAnswersForSubmission = useCallback(() => {
    return Object.entries(localAnswers).map(([questionId, answerData]) => ({
      question_id: parseInt(questionId),
      answer_data: answerData,
    }));
  }, [localAnswers]);

  return {
    // Data
    answers,
    groupedAnswers,
    totalRespondents,
    sortedAnswers: getSortedAnswers(),
    localAnswers,

    // States
    isLoading: isLoading || status === "loading",
    isSubmitting,
    error,
    isCacheValid,

    // Permissions
    canViewAll,
    hasSubmitted,
    isReadonly,

    // Actions
    loadAnswers,
    loadSummary,
    invalidateCache,
    submitAnswers,
    updateAnswer,
    getAnswerForQuestion,
    getLocalAnswersForSubmission,
    gradeAnswer,

    // Helpers
    getAnswerPreview,
    formatAnswerPreview: getAnswerPreview, // alias untuk backward compatibility
  };
};

// Simplified hook for summary data only
export const useAssignmentSummary = (assignmentId, options = {}) => {
  const { autoLoad = false } = options;
  const dispatch = useDispatch();

  const summary = useSelector((state) =>
    selectAssignmentSummary(state, assignmentId)
  );
  const canViewAll = useSelector((state) =>
    selectCanViewAll(state, assignmentId)
  );

  const [isLoading, setIsLoading] = useState(false);

  const loadSummary = useCallback(async () => {
    if (!assignmentId || !canViewAll) return;

    setIsLoading(true);
    try {
      const result = await dispatch(
        fetchAssignmentSummary({ assignmentId })
      ).unwrap();
      return result;
    } catch (err) {
      const errorMessage = err.message || "Failed to load assignment summary";
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, canViewAll, dispatch]);

  useEffect(() => {
    if (autoLoad && assignmentId && canViewAll) {
      loadSummary();
    }
  }, [autoLoad, assignmentId, canViewAll, loadSummary]);

  return {
    summary,
    isLoading,
    canViewAll,
    loadSummary,
  };
};
