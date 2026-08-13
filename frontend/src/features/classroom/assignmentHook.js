import { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { toast } from "react-toastify";
import {
  clearCache,
  clearExpiredCache,
  createAssignment,
  deleteAssignment,
  downloadAssignment,
  fetchAssignments,
  incrementAssignmentView,
  removeAssignmentOptimistic,
  resetAssignmentStatus,
  selectCacheStats,
  selectCurrentClassroomCode,
  selectIsCached,
  selectIsAssignmentDeleting,
  selectIsAssignmentDownloading,
  selectIsAssignmentLoading,
  selectAssignmentCreateStatus,
  selectAssignmentDeleteStatus,
  selectAssignmentDownloadStatus,
  selectAssignmentError,
  selectAssignmentFiles,
  selectAssignmentLinks,
  selectAssignmentPagination,
  selectAssignmentUploadedFiles,
  selectAssignmentsByClassroom,
  selectAssignmentStatus,
  selectAssignmentUpdateStatus,
  selectAssignmentValidationErrors,
  setCurrentClassroom,
  syncAssignmentAcrossCache,
  updateAssignment,
  viewExternalLink as viewExternalLinkThunk,
  // Submission-related imports
  submitAssignmentSubmission,
  removeSubmissionFile,
  // selectSubmissionStatus,
  selectSubmissionError,
  selectIsSubmitting,
  updateSubmissionInCache,
  removeSubmissionFileFromCache,
  updateAssignmentSubmission,
} from "./assignmentSlice";
import { store } from "../store";

/**
 * Hook for assignment submission that integrates with assignment data
 * @param {string} classroomCode - ID of the classroom
 * @param {string} assignmentId - ID of the assignment
 * @param {Object} options - Configuration options
 * @returns {Object} - Submission management utilities
 */
// PERBAIKAN pada assignmentHook.js - Bagian useAssignmentSubmission

export const useAssignmentSubmission = (
  classroomCode,
  assignmentId,
  options = {}
) => {
  const {
    autoLoad = true,
    enablePolling = false,
    pollingInterval = 30000,
    onSubmissionUpdate = null,
    onError = null,
  } = options;

  const dispatch = useDispatch();

  // Get assignment data from the existing assignment state
  const assignments = useSelector((state) =>
    selectAssignmentsByClassroom(state, classroomCode)
  );
  // Get specific assignment with submission data
  const assignment = useMemo(() => {
    if (!assignments || !assignmentId) return null;
    return assignments.find(
      (a) => a.id === assignmentId || String(a.id) === String(assignmentId)
    );
  }, [assignments, assignmentId]);

  // Extract submission from assignment data
  const submission = useMemo(() => {
    const submissions = assignment?.submissions;

    if (!submissions) return null;

    // Jika submissions adalah array, ambil yang pertama (untuk current user)
    if (Array.isArray(submissions)) {
      return submissions.length > 0 ? submissions : null;
    }

    // Jika submissions adalah single object, return as is
    return submissions;
  }, [assignment]);

  // Get loading states from Redux
  const isLoading = useSelector(selectIsAssignmentLoading);
  const isSubmitting = useSelector(selectIsSubmitting);
  const isUpdatingSubmission = useSelector(
    (state) => state.assignment.submitStatus === "loading"
  );
  const error = useSelector(selectAssignmentError);
  const submissionError = useSelector(selectSubmissionError);

  // Refs for cleanup and optimization
  const abortControllerRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const lastFetchTime = useRef(null);
  const hasInitialLoad = useRef(false);
  const updateSubmission = useCallback(
    async (updateData) => {
      if (!classroomCode || !assignmentId) {
        throw new Error("Missing required parameters");
      }

      // ✅ Ambil ID langsung dari updateData (dikirim dari GradingForm)
      const submissionId = updateData?.submission_id;
      if (!submissionId) {
        throw new Error("Submission ID tidak ditemukan dari updateData");
      }

      try {
        // Dispatch update action
        const result = await dispatch(
          updateAssignmentSubmission({
            classroomCode,
            assignmentId,
            submissionId,
            updateData,
          })
        ).unwrap();

        // Call update callback if provided
        if (onSubmissionUpdate && result?.data) {
          const assignments = selectAssignmentsByClassroom(
            store.getState(),
            classroomCode
          );
          const updatedAssignment = assignments.find(
            (a) => String(a.id) === String(assignmentId)
          );

          if (updatedAssignment?.submissions) {
            onSubmissionUpdate(updatedAssignment.submissions);
          }
        }

        return { success: true, data: result, message: result.message };
      } catch (err) {
        console.error("Error updating submission:", err);
        const errorMessage = err.message || "Gagal mengupdate submission";
        return { success: false, error: errorMessage };
      }
    },
    [classroomCode, assignmentId, submission, dispatch, onSubmissionUpdate]
  );

  // OPTIMIZED: Fetch submission data only when necessary
  const fetchSubmission = useCallback(
    async (forceRefresh = false) => {
      if (!classroomCode || !assignmentId) return;

      // Prevent rapid successive calls
      const now = Date.now();
      if (
        !forceRefresh &&
        lastFetchTime.current &&
        now - lastFetchTime.current < 1000
      ) {
        return;
      }
      lastFetchTime.current = now;

      try {
        // Cancel previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        // Dispatch fetchAssignments to get updated assignment data with submission
        const result = await dispatch(
          fetchAssignments({
            classroomCode,
            params: {
              assignment_id: assignmentId,
              include: "uploader,classroom,files,submission",
              fields: "full",
            },
            signal: abortControllerRef.current.signal,
            forceRefresh,
          })
        ).unwrap();

        if (onSubmissionUpdate && result?.data?.assignments?.[0]?.submissions) {
          const submissionsData = result.data.assignments[0].submissions;
          onSubmissionUpdate(submissionsData);
        }

        return { success: true, data: result };
      } catch (err) {
        if (err.name === "AbortError") {
          return { success: false, cancelled: true };
        }

        console.error("Error fetching submission:", err);
        const errorMessage = err.message || "Gagal memuat submission";

        if (onError) {
          onError(err);
        }

        return { success: false, error: errorMessage };
      } finally {
        abortControllerRef.current = null;
      }
    },
    [classroomCode, assignmentId, dispatch, onSubmissionUpdate, onError]
  );

  // OPTIMIZED: Submit assignment with LOCAL cache update instead of refetch
  const submitAssignment = useCallback(
    async (submissionData) => {
      if (!classroomCode || !assignmentId) {
        throw new Error("Missing required parameters");
      }

      try {
        // Dispatch submission action
        const result = await dispatch(
          submitAssignmentSubmission({
            classroomCode,
            assignmentId,
            submissionData,
          })
        ).unwrap();

        // IMPORTANT: Update cache locally instead of refetching
        if (result?.data) {
          // Update cache with the new submission data
          dispatch(
            updateSubmissionInCache({
              classroomCode,
              assignmentId,
              submissionData: result.data,
            })
          );

          // Call update callback if provided
          if (onSubmissionUpdate) {
            const submissionArray = Array.isArray(result.data)
              ? result.data
              : [result.data];
            onSubmissionUpdate(submissionArray);
          }
        }

        return { success: true, data: result, message: result.message };
      } catch (err) {
        console.error("Error submitting assignment:", err);
        const errorMessage = err.message || "Gagal menyimpan submission";
        return { success: false, error: errorMessage };
      }
    },
    [classroomCode, assignmentId, dispatch, onSubmissionUpdate]
  );

  // Save draft - wrapper for submitAssignment
  const saveDraft = useCallback(
    async (submissionText, files = [], removeFileIds = []) => {
      return submitAssignment({
        submissionText,
        files,
        removeFileIds,
        status: "draft",
      });
    },
    [submitAssignment]
  );

  // Submit final - wrapper for submitAssignment
  const submitFinal = useCallback(
    async (submissionText, files = [], removeFileIds = []) => {
      return submitAssignment({
        submissionText,
        files,
        removeFileIds,
        status: "submitted",
      });
    },
    [submitAssignment]
  );

  // Download file with retry mechanism
  const downloadFile = useCallback(async (fileUrl, fileName, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(fileUrl, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          toast.success("File berhasil diunduh");
          return { success: true };
        } else if (attempt === retries) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        if (attempt === retries) {
          console.error("Download error:", error);
          toast.error(`Gagal mengunduh file: ${error.message}`);
          return { success: false, error: error.message };
        }
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }, []);

  // OPTIMIZED: Remove submitted file with LOCAL cache update
  const removeSubmittedFile = useCallback(
    async (fileIdOrObject) => {
      // Handle both file object and direct fileId
      const fileId =
        typeof fileIdOrObject === "object" && fileIdOrObject !== null
          ? fileIdOrObject.id
          : fileIdOrObject;

      // Validate fileId
      if (!fileId) {
        toast.error("File ID tidak valid");
        return { success: false, error: "Invalid file ID" };
      }

      // Confirm deletion
      if (!window.confirm("Apakah Anda yakin ingin menghapus file ini?")) {
        return { success: false, cancelled: true };
      }

      try {
        // Log for debugging
        console.log("Removing file with ID:", fileId);
        console.log("Classroom Code:", classroomCode);
        console.log("Assignment ID:", assignmentId);

        const result = await dispatch(
          removeSubmissionFile({
            classroomCode,
            assignmentId,
            fileId: fileId, // Make sure we're passing the raw ID
          })
        ).unwrap();

        // Show success message
        toast.success(result.message || "File berhasil dihapus");

        // Update cache locally instead of refetching
        if (result?.data) {
          dispatch(
            removeSubmissionFileFromCache({
              classroomCode,
              assignmentId,
              fileId: fileId,
              updatedSubmission: result.data,
            })
          );

          // Call update callback if provided
          if (onSubmissionUpdate) {
            const submissionArray = Array.isArray(result.data)
              ? result.data
              : [result.data];
            onSubmissionUpdate(submissionArray);
          }
        }

        return { success: true, data: result };
      } catch (err) {
        console.error("Error removing file:", err);

        let errorMessage = "Gagal menghapus file";

        if (err.status === 403) {
          errorMessage = "Anda tidak memiliki akses untuk menghapus file ini";
        } else if (err.status === 404) {
          errorMessage = "File tidak ditemukan";
        } else if (err.message) {
          errorMessage = err.message;
        }

        toast.error(errorMessage);
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, assignmentId, onSubmissionUpdate]
  );

  // Refresh submission - force refresh (only when explicitly needed)
  const refreshSubmission = useCallback(() => {
    return fetchSubmission(true);
  }, [fetchSubmission]);

  // Setup polling (if needed)
  const startPolling = useCallback(() => {
    if (!enablePolling) return;

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(() => {
      fetchSubmission(false);
    }, pollingInterval);
  }, [enablePolling, pollingInterval, fetchSubmission]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // OPTIMIZED: Auto-fetch only on initial mount or when data is missing
  useEffect(() => {
    if (autoLoad && classroomCode && assignmentId) {
      // Only fetch if we don't have data or it's the initial load
      if (!assignment || (!assignment.submissions && !hasInitialLoad.current)) {
        fetchSubmission();
        hasInitialLoad.current = true;
      }
    }
  }, [autoLoad, classroomCode, assignmentId]); // Removed assignment and fetchSubmission deps to prevent loops

  // Setup polling
  useEffect(() => {
    if (enablePolling) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enablePolling, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      stopPolling();
      hasInitialLoad.current = false;
    };
  }, [stopPolling]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && enablePolling) {
        startPolling();
      } else if (document.visibilityState === "hidden") {
        stopPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enablePolling, startPolling, stopPolling]);

  // Computed properties
  const getCurrentUserSubmission = () => {
    if (!submission) return null;

    // Jika submission adalah array, cari yang sesuai dengan current user
    if (Array.isArray(submission)) {
      return submission[0] || null;
    }

    // Jika submission adalah single object, return as is
    return submission;
  };

  const currentUserSubmission = getCurrentUserSubmission();

  const canEdit =
    currentUserSubmission?.status !== "submitted" &&
    currentUserSubmission?.status !== "graded";

  const isSubmitted = currentUserSubmission?.status === "submitted";

  const isGraded =
    currentUserSubmission?.status === "graded" ||
    currentUserSubmission?.status === "returned";

  const hasFiles =
    currentUserSubmission?.files && currentUserSubmission.files.length > 0;

  const isLate = currentUserSubmission?.is_late || false;

  const hasScore =
    currentUserSubmission?.points !== null &&
    currentUserSubmission?.points !== undefined;

  const isAssignmentAvailable = assignment?.is_available !== false;

  return {
    // Data
    assignment,
    submission: getCurrentUserSubmission(),
    allSubmissions: Array.isArray(submission)
      ? submission
      : submission
      ? [submission]
      : [],

    // Loading states
    isLoading,
    isSubmitting,
    isUpdatingSubmission, // PERBAIKAN: Add this

    // Error state
    error: error || submissionError,

    // Actions
    fetchSubmission,
    submitAssignment,
    saveDraft,
    submitFinal,
    downloadFile,
    removeSubmittedFile,
    refreshSubmission,
    updateSubmission, // PERBAIKAN: Add this

    // Polling control
    startPolling,
    stopPolling,

    // Computed properties
    canEdit: canEdit && isAssignmentAvailable,
    isSubmitted,
    isGraded,
    hasFiles,
    isLate,
    hasScore,
    isAssignmentAvailable,

    // Utility functions
    getFileCount: () => getCurrentUserSubmission()?.files?.length || 0,
    getStatusLabel: () => {
      const statusLabels = {
        draft: "Draft",
        submitted: "Dikumpulkan",
        graded: "Dinilai",
        returned: "Dikembalikan",
      };
      return (
        statusLabels[getCurrentUserSubmission()?.status] || "Tidak Diketahui"
      );
    },
    getGradePercentage: () => {
      if (!hasScore || !getCurrentUserSubmission()?.max_points) return null;
      return Math.round(
        (getCurrentUserSubmission().points /
          getCurrentUserSubmission().max_points) *
          100
      );
    },
  };
};

// Cache configuration for assignments with submission support
const ASSIGNMENT_CACHE_CONFIG = {
  DETAIL_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  VIEW_INCREMENT_DELAY: 2000, // 2 seconds delay for view count
  FETCH_COOLDOWN: 3000, // 3 seconds between fetches
  MAX_FETCH_ATTEMPTS: 3,
};

/**
 * Enhanced hook for assignment detail with submission support
 */
export const useAssignmentDetail = (
  classroomCode,
  assignmentId,
  options = {}
) => {
  const {
    autoLoad = true,
    cacheTimeout = ASSIGNMENT_CACHE_CONFIG.DETAIL_TIMEOUT,
  } = options;

  const dispatch = useDispatch();

  // State tracking refs for optimization
  const stateRef = useRef({
    lastFetchTime: null,
    fetchAttempts: 0,
    viewIncremented: false,
    currentAssignmentId: null,
    fetchPromise: null,
    lastError: null,
    isInitialized: false,
    lastUpdateTime: null,
    autoRefreshTimer: null,
  });

  // Abort controller for cancellable requests
  const abortControllerRef = useRef(null);

  // Selectors with memoization
  const assignments = useSelector((state) =>
    selectAssignmentsByClassroom(state, classroomCode)
  );
  const assignmentFiles = useSelector((state) =>
    selectAssignmentFiles(state, classroomCode, assignmentId)
  );
  const assignmentLinks = useSelector((state) =>
    selectAssignmentLinks(state, classroomCode, assignmentId)
  );
  const assignmentUploadedFiles = useSelector((state) =>
    selectAssignmentUploadedFiles(state, classroomCode, assignmentId)
  );
  const isLoading = useSelector(selectIsAssignmentLoading);
  const isDeleting = useSelector(selectIsAssignmentDeleting);
  const isDownloading = useSelector(selectIsAssignmentDownloading);
  const error = useSelector(selectAssignmentError);

  // Check cache status
  const isCached = useSelector((state) =>
    selectIsCached(state, classroomCode, { assignmentId })
  );

  // Memoized assignment lookup with enhanced file counting and submission data
  const assignment = useMemo(() => {
    if (!assignments || !assignmentId) return null;

    const found = assignments.find(
      (m) => m.id === assignmentId || String(m.id) === String(assignmentId)
    );

    if (found) {
      return {
        ...found,
        isAvailable:
          found.is_visible &&
          (!found.available_from ||
            new Date(found.available_from) <= new Date()) &&
          (!found.available_until ||
            new Date(found.available_until) >= new Date()),
        hasFiles: assignmentFiles.length > 0,
        hasLinks: assignmentLinks.length > 0,
        hasUploadedFiles: assignmentUploadedFiles.length > 0,
        totalFiles: assignmentFiles.length,
        totalDownloads: assignmentFiles.reduce(
          (sum, file) => sum + (file.download_count || 0),
          0
        ),
        totalViews: assignmentFiles.reduce(
          (sum, file) => sum + (file.view_count || 0),
          0
        ),
        // Add submission data from submissions field
        submission: found.submissions || null,
        hasSubmission: !!found.submissions,
        submissionStatus: found.submissions?.status || null,
        canSubmit:
          found.is_visible &&
          (!found.available_until ||
            new Date(found.available_until) >= new Date()),
      };
    }

    return null;
  }, [
    assignments,
    assignmentId,
    assignmentFiles,
    assignmentLinks,
    assignmentUploadedFiles,
  ]);

  // Reset state when assignment changes
  useEffect(() => {
    if (stateRef.current.currentAssignmentId !== assignmentId) {
      // Clear any existing auto refresh timer
      if (stateRef.current.autoRefreshTimer) {
        clearTimeout(stateRef.current.autoRefreshTimer);
      }

      stateRef.current = {
        lastFetchTime: null,
        fetchAttempts: 0,
        viewIncremented: false,
        currentAssignmentId: assignmentId,
        fetchPromise: null,
        lastError: null,
        isInitialized: false,
        lastUpdateTime: null,
        autoRefreshTimer: null,
      };
    }
  }, [assignmentId]);

  // Optimized fetch check
  const shouldFetch = useCallback(() => {
    if (!classroomCode || !assignmentId) {
      return { should: false, reason: "missing-params" };
    }

    if (assignment && !isStale(assignment.updated_at, cacheTimeout)) {
      return { should: false, reason: "fresh-cache" };
    }

    if (isLoading || stateRef.current.fetchPromise) {
      return { should: false, reason: "already-loading" };
    }

    // Check cooldown
    if (stateRef.current.lastFetchTime) {
      const elapsed = Date.now() - stateRef.current.lastFetchTime;
      if (elapsed < ASSIGNMENT_CACHE_CONFIG.FETCH_COOLDOWN) {
        return {
          should: false,
          reason: "cooldown",
          remaining: ASSIGNMENT_CACHE_CONFIG.FETCH_COOLDOWN - elapsed,
        };
      }
    }

    // Check max attempts
    if (
      stateRef.current.fetchAttempts >=
      ASSIGNMENT_CACHE_CONFIG.MAX_FETCH_ATTEMPTS
    ) {
      const resetAfter = 60000; // 1 minute
      const elapsed = Date.now() - stateRef.current.lastFetchTime;
      if (elapsed < resetAfter) {
        return { should: false, reason: "max-attempts" };
      }
      stateRef.current.fetchAttempts = 0;
    }

    return { should: true, reason: "fetch-needed" };
  }, [classroomCode, assignmentId, assignment, isLoading, cacheTimeout]);

  // Enhanced fetch function with force refresh capability and submission data
  const fetchAssignmentDetail = useCallback(
    async (forceRefresh = false) => {
      const check = shouldFetch();

      if (!check.should && !forceRefresh) {
        return { success: false, reason: check.reason };
      }

      // Cancel previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      stateRef.current.fetchAttempts++;
      stateRef.current.lastFetchTime = Date.now();

      try {
        const promise = dispatch(
          fetchAssignments({
            classroomCode,
            params: {
              assignment_id: assignmentId,
              include: "uploader,classroom,files,submission",
              fields: "full",
            },
            signal: abortControllerRef.current.signal,
            forceRefresh,
          })
        ).unwrap();

        stateRef.current.fetchPromise = promise;
        const result = await promise;

        stateRef.current.fetchPromise = null;
        stateRef.current.lastError = null;
        stateRef.current.isInitialized = true;

        // Sync updated data across all cache entries
        if (result && result.data && Array.isArray(result.data)) {
          const updatedAssignment = result.data.find(
            (m) => String(m.id) === String(assignmentId)
          );

          if (updatedAssignment) {
            dispatch(
              syncAssignmentAcrossCache({
                classroomCode,
                assignmentId,
                updatedAssignment,
                source: "fetch_refresh",
              })
            );
          }
        }

        return { success: true, data: result };
      } catch (err) {
        stateRef.current.fetchPromise = null;
        stateRef.current.lastError = err;

        if (
          err.name === "AbortError" ||
          err.name === "CanceledError" ||
          err.message === "canceled" ||
          err.cancelled
        ) {
          return { success: false, cancelled: true };
        }

        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, assignmentId, shouldFetch]
  );

  // Enhanced update handler with automatic cache refresh
  const handleUpdate = useCallback(
    async (updates, options = {}) => {
      const { optimistic = true, syncCache = true } = options;

      try {
        let optimisticAssignment = null;

        // Create optimistic update
        if (optimistic && assignment) {
          optimisticAssignment = {
            ...assignment,
            ...updates,
            updated_at: new Date().toISOString(),
          };

          // Process file_urls and links for optimistic update
          if (updates.files || updates.remove_file_ids) {
            // Keep existing files except removed ones
            const remainingFiles =
              assignment.file_urls?.filter(
                (file) => !updates.remove_file_ids?.includes(file.id)
              ) || [];

            optimisticAssignment.file_urls = remainingFiles;
          }

          if (updates.links) {
            // Convert links to proper format
            optimisticAssignment.links = updates.links.map((link, index) => ({
              id: `temp_${index}`,
              url: typeof link === "string" ? link : link.url,
              view_count: 0,
              download_count: 0,
            }));
          }

          // Sync to all cache entries immediately
          if (syncCache) {
            dispatch(
              syncAssignmentAcrossCache({
                classroomCode,
                assignmentId,
                updatedAssignment: optimisticAssignment,
                source: "optimistic_update",
              })
            );
          }
        }

        // Perform actual update
        const result = await dispatch(
          updateAssignment({
            classroomCode,
            assignmentId,
            assignmentData: updates,
          })
        ).unwrap();

        // Update cache with server response
        if (result.data && syncCache) {
          dispatch(
            syncAssignmentAcrossCache({
              classroomCode,
              assignmentId,
              updatedAssignment: result.data,
              source: "server_update",
            })
          );
        }

        stateRef.current.lastUpdateTime = Date.now();

        toast.success("Tugas berhasil diperbarui");
        return { success: true, data: result.data || optimisticAssignment };
      } catch (err) {
        // On error, refresh from server if online
        if (optimistic && navigator.onLine) {
          fetchAssignmentDetail(true);
        }

        toast.error(err.message || "Gagal memperbarui tugas");
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, assignmentId, assignment, fetchAssignmentDetail]
  );

  // Smart refresh with immediate cache invalidation
  const refreshDetail = useCallback(async () => {
    // Clear expired cache first
    dispatch(clearExpiredCache());

    // Force refresh from server
    return fetchAssignmentDetail(true);
  }, [dispatch, fetchAssignmentDetail]);

  // Auto-fetch on mount with optimization
  useEffect(() => {
    if (autoLoad && !stateRef.current.isInitialized) {
      const check = shouldFetch();
      if (check.should || !assignment) {
        fetchAssignmentDetail();
      } else {
        stateRef.current.isInitialized = true;
      }
    }
  }, [autoLoad, shouldFetch, assignment, fetchAssignmentDetail]);

  // Increment view count with debouncing
  useEffect(() => {
    if (
      assignment &&
      !stateRef.current.viewIncremented &&
      assignment.id === assignmentId
    ) {
      const timer = setTimeout(() => {
        assignmentFiles.forEach((file) => {
          dispatch(
            incrementAssignmentView({
              classroomCode,
              fileId: file.id,
            })
          );
        });
        stateRef.current.viewIncremented = true;
      }, ASSIGNMENT_CACHE_CONFIG.VIEW_INCREMENT_DELAY);

      return () => clearTimeout(timer);
    }
  }, [assignment, assignmentId, assignmentFiles, classroomCode, dispatch]);

  // Enhanced delete handler
  const handleDelete = useCallback(
    async (confirmMessage) => {
      if (confirmMessage && !window.confirm(confirmMessage)) {
        return { success: false, cancelled: true };
      }

      try {
        const result = await dispatch(
          deleteAssignment({
            classroomCode,
            assignmentId,
          })
        ).unwrap();

        toast.success("Tugas berhasil dihapus");
        return { success: true, data: result };
      } catch (err) {
        toast.error(err.message || "Gagal menghapus tugas");
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, assignmentId]
  );

  // Enhanced download handler for multiple files
  const handleDownloadFile = useCallback(
    async (fileId, fileName, fileData) => {
      const file =
        fileData ||
        assignmentFiles.find((f) => String(f.id) === String(fileId));

      if (!file) {
        toast.error("File tidak ditemukan");
        return { success: false, error: "File not found" };
      }

      try {
        const result = await dispatch(
          downloadAssignment({
            classroomCode,
            fileId,
            downloadUrl: file.download_url, // Pass the hashed download URL
          })
        ).unwrap();

        toast.success(`File ${file.file_name || "berhasil diunduh"}`);
        return { success: true, data: result };
      } catch (err) {
        toast.error(err.message || "Gagal mengunduh file");
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, assignmentFiles]
  );

  const handleViewExternal = (fileOrUrl) => {
    if (typeof fileOrUrl === "string" && /^https?:\/\//i.test(fileOrUrl)) {
      window.open(fileOrUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (typeof fileOrUrl === "object") {
      dispatch(
        viewExternalLinkThunk({
          classroomCode,
          fileId: fileOrUrl.id,
        })
      );
    } else {
      dispatch(
        viewExternalLinkThunk({
          classroomCode,
          fileId: fileOrUrl,
        })
      );
    }
  };

  // Direct file download fallback
  const downloadFileDirectly = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl, {
        method: "GET",
        headers: {
          Accept: "*/*",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error("Direct download failed:", error);
      throw error;
    }
  };

  // Cache management
  const clearAssignmentCache = useCallback(() => {
    dispatch(clearCache(classroomCode));
  }, [dispatch, classroomCode]);

  // Computed properties
  const isCacheStale = useMemo(() => {
    if (!assignment?.updated_at) return true;
    return isStale(assignment.updated_at, cacheTimeout);
  }, [assignment, cacheTimeout]);

  const hasCachedData = useMemo(() => {
    return !!assignment && isCached;
  }, [assignment, isCached]);

  const canDelete = useMemo(() => {
    return assignment?.can_delete || false;
  }, [assignment]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (stateRef.current.fetchPromise) {
        stateRef.current.fetchPromise = null;
      }
      // Clear auto refresh timer
      if (stateRef.current.autoRefreshTimer) {
        clearTimeout(stateRef.current.autoRefreshTimer);
      }
    };
  }, []);

  return {
    // Data
    assignment,
    assignments,
    assignmentFiles,
    assignmentLinks,
    assignmentUploadedFiles,

    // Submission data (extracted from assignment.submissions)
    submission: assignment?.submission,
    hasSubmission: assignment?.hasSubmission,
    submissionStatus: assignment?.submissionStatus,
    canSubmit: assignment?.canSubmit,

    // Loading states
    isLoading,
    isDeleting,
    isDownloading,
    isFetching: !!stateRef.current.fetchPromise,

    // Error handling
    error,
    lastError: stateRef.current.lastError,

    // Cache info
    isCacheStale,
    hasCachedData,
    isCached,

    // Permissions
    canDelete,

    // Actions
    fetchAssignmentDetail,
    refreshDetail,
    handleDelete,
    handleDownloadFile,
    handleUpdate,
    clearAssignmentCache,
    downloadFileDirectly,
    handleViewExternal,

    // Metadata
    fetchAttempts: stateRef.current.fetchAttempts,
    maxFetchAttempts: ASSIGNMENT_CACHE_CONFIG.MAX_FETCH_ATTEMPTS,
    lastUpdateTime: stateRef.current.lastUpdateTime,
  };
};

// Utility function to check staleness
function isStale(timestamp, timeout) {
  if (!timestamp) return true;
  const age = Date.now() - new Date(timestamp).getTime();
  return age > timeout;
}

// Enhanced useAssignments hook with submission support
const useAssignments = (classroomCode) => {
  const dispatch = useDispatch();
  const lastFetchParamsRef = useRef(null);
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef(null);
  const filtersRef = useRef({
    search: "",
    type: "",
    sort_by: "created_at",
    sort_order: "desc",
    per_page: 10,
    page: 1,
  });

  // Enhanced selectors with caching
  const assignments = useSelector((state) =>
    selectAssignmentsByClassroom(state, classroomCode)
  );
  const pagination = useSelector((state) =>
    selectAssignmentPagination(state, classroomCode)
  );

  const status = useSelector(selectAssignmentStatus);
  const createStatus = useSelector(selectAssignmentCreateStatus);
  const updateStatus = useSelector(selectAssignmentUpdateStatus);
  const deleteStatus = useSelector(selectAssignmentDeleteStatus);
  const downloadStatus = useSelector(selectAssignmentDownloadStatus);
  const error = useSelector(selectAssignmentError);
  const validationErrors = useSelector(selectAssignmentValidationErrors);
  const currentClassroomCode = useSelector(selectCurrentClassroomCode);
  const cacheStats = useSelector(selectCacheStats);

  // Check if current params are cached
  const isCached = useSelector((state) =>
    selectIsCached(state, classroomCode, filtersRef.current)
  );

  // Enhanced fetch function with smart caching and submission data
  const fetchAssignmentsData = useCallback(
    (params = {}, options = {}) => {
      if (!classroomCode) return;

      const { forceRefresh = false, silent = false } = options;

      // Merge with current filters
      const mergedParams = {
        ...filtersRef.current,
        ...params,
        // Always include submission data in assignment fetch
        include: "uploader,classroom,files,submission",
        fields: "full",
      };
      filtersRef.current = { ...filtersRef.current, ...params };

      // Generate request signature for comparison
      const currentParams = JSON.stringify({ classroomCode, ...mergedParams });

      // Prevent duplicate requests (unless force refresh)
      if (
        !forceRefresh &&
        lastFetchParamsRef.current === currentParams &&
        isFetchingRef.current
      ) {
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      lastFetchParamsRef.current = currentParams;
      isFetchingRef.current = true;

      // Set current classroom if different
      if (currentClassroomCode !== classroomCode) {
        dispatch(setCurrentClassroom(classroomCode));
      }

      // Clear expired cache periodically
      dispatch(clearExpiredCache());

      // Reset any previous errors (unless silent)
      if (!silent) {
        dispatch(resetAssignmentStatus());
      }

      dispatch(
        fetchAssignments({
          classroomCode,
          params: mergedParams,
          signal: abortControllerRef.current.signal,
          forceRefresh,
        })
      )
        .unwrap()
        .catch((err) => {
          // Abaikan kalau dibatalkan
          if (err?.cancelled || err?.code === "ERR_CANCELED") return;
        })
        .finally(() => {
          isFetchingRef.current = false;
          abortControllerRef.current = null;
        });
    },
    [dispatch, classroomCode, currentClassroomCode]
  );

  // Enhanced filter function with caching optimization
  const setFilters = useCallback(
    (newFilters, options = {}) => {
      const { forceRefresh = false } = options;
      const updatedFilters = { ...filtersRef.current, ...newFilters };

      // Reset page when changing filters (except for page changes)
      if (!Object.prototype.hasOwnProperty.call(newFilters, "page")) {
        updatedFilters.page = 1;
      }

      filtersRef.current = updatedFilters;
      fetchAssignmentsData(updatedFilters, { forceRefresh });
    },
    [fetchAssignmentsData]
  );

  // Clear filters with cache invalidation
  const clearFilters = useCallback(() => {
    const defaultFilters = {
      search: "",
      type: "",
      sort_by: "created_at",
      sort_order: "desc",
      per_page: 10,
      page: 1,
    };

    filtersRef.current = defaultFilters;

    // Clear any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear cache for current classroom and reset refs
    dispatch(clearCache(classroomCode));
    lastFetchParamsRef.current = null;
    isFetchingRef.current = false;

    fetchAssignmentsData(defaultFilters, { forceRefresh: true });
  }, [fetchAssignmentsData, dispatch, classroomCode]);

  // Enhanced add assignment with multiple file support and optimistic updates
  const addAssignment = useCallback(
    async (assignmentData) => {
      try {
        // Validate multiple files if present
        if (assignmentData.files) {
          const files = Array.isArray(assignmentData.files)
            ? assignmentData.files
            : assignmentData.files instanceof FileList
            ? Array.from(assignmentData.files)
            : [assignmentData.files];

          // Validate file size and type
          const maxSize = 20 * 1024 * 1024; // 20MB
          const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "video/mp4",
            "audio/mpeg",
            "image/jpeg",
            "image/png",
            "image/gif",
          ];

          for (const file of files) {
            if (file.size > maxSize) {
              throw new Error(
                `File ${file.name} melebihi ukuran maksimal 20MB`
              );
            }
            if (!allowedTypes.includes(file.type)) {
              throw new Error(`Tipe file ${file.name} tidak diizinkan`);
            }
          }
        }

        // Validate multiple links if present
        if (assignmentData.links) {
          const links = Array.isArray(assignmentData.links)
            ? assignmentData.links
            : [assignmentData.links];

          for (const link of links) {
            if (link && !isValidUrl(link)) {
              throw new Error(`Link tidak valid: ${link}`);
            }
          }
        }

        const result = await dispatch(
          createAssignment({ classroomCode, assignmentData })
        ).unwrap();

        toast.success("Tugas berhasil ditambahkan");

        return { success: true, data: result.data };
      } catch (err) {
        if (err.name !== "AbortError" && !err.cancelled) {
          toast.error(err.message || "Gagal menambahkan tugas");
        }
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode]
  );

  // Enhanced edit assignment with multiple file support and optimistic updates
  const editAssignment = useCallback(
    async (assignmentId, assignmentData) => {
      try {
        // Validate multiple files if present
        if (assignmentData.files) {
          const files = Array.isArray(assignmentData.files)
            ? assignmentData.files
            : assignmentData.files instanceof FileList
            ? Array.from(assignmentData.files)
            : [assignmentData.files];

          // Validate file size and type
          const maxSize = 20 * 1024 * 1024; // 20MB
          const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "video/mp4",
            "audio/mpeg",
            "image/jpeg",
            "image/png",
            "image/gif",
          ];

          for (const file of files) {
            if (file.size > maxSize) {
              throw new Error(
                `File ${file.name} melebihi ukuran maksimal 20MB`
              );
            }
            if (!allowedTypes.includes(file.type)) {
              throw new Error(`Tipe file ${file.name} tidak diizinkan`);
            }
          }
        }

        // Validate multiple links if present
        if (assignmentData.links) {
          const links = Array.isArray(assignmentData.links)
            ? assignmentData.links
            : [assignmentData.links];

          for (const link of links) {
            if (link && !isValidUrl(link)) {
              throw new Error(`Link tidak valid: ${link}`);
            }
          }
        }

        // Optimistic update for better UX
        const currentAssignment = assignments.find(
          (m) => String(m.id) === String(assignmentId)
        );
        const optimisticUpdatedAssignment = {
          ...currentAssignment,
          ...assignmentData,
          id: assignmentId,
          updated_at: new Date().toISOString(),
        };

        // Apply optimistic update to ALL cache entries
        dispatch(
          syncAssignmentAcrossCache({
            classroomCode,
            assignmentId,
            updatedAssignment: optimisticUpdatedAssignment,
            source: "optimistic",
          })
        );

        const result = await dispatch(
          updateAssignment({ classroomCode, assignmentId, assignmentData })
        ).unwrap();

        toast.success("Tugas berhasil diupdate");
        return { success: true, data: result.data };
      } catch (err) {
        // Revert optimistic update by refreshing from server
        // But only if we have internet connection
        if (navigator.onLine) {
          fetchAssignmentsData(filtersRef.current, {
            forceRefresh: true,
            silent: true,
          });
        }

        if (err.name !== "AbortError" && !err.cancelled) {
          toast.error(err.message || "Gagal mengupdate tugas");
        }
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, assignments, fetchAssignmentsData]
  );

  // Enhanced remove assignment with optimistic updates
  const removeAssignment = useCallback(
    async (assignmentId) => {
      try {
        // Optimistic update for immediate feedback
        dispatch(removeAssignmentOptimistic({ classroomCode, assignmentId }));

        await dispatch(
          deleteAssignment({ classroomCode, assignmentId })
        ).unwrap();

        toast.success("Tugas berhasil dihapus");

        return { success: true };
      } catch (err) {
        // Revert optimistic update on error
        fetchAssignmentsData(filtersRef.current, {
          forceRefresh: true,
          silent: true,
        });

        if (err.name !== "AbortError" && !err.cancelled) {
          toast.error(err.message || "Gagal menghapus tugas");
        }
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, fetchAssignmentsData]
  );

  const downloadFileDirectly = async (fileUrl, fileName) => {
    try {
      // Fetch file
      const response = await fetch(fileUrl, {
        method: "GET",
        headers: {
          Accept: "*/*",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error("Direct download failed:", error);
      throw error;
    }
  };

  // Enhanced download with file ID support
  const downloadFile = useCallback(
    async (fileId, fileName) => {
      try {
        const result = await dispatch(
          downloadAssignment({ classroomCode, fileId })
        ).unwrap();

        return { success: true, data: result.data };
      } catch (err) {
        console.error("API download failed:", err);

        // Cari file info dari assignments
        const assignment = assignments.find((m) =>
          m.file_urls?.some((f) => String(f.id) === String(fileId))
        );

        if (assignment) {
          const file = assignment.file_urls.find(
            (f) => String(f.id) === String(fileId)
          );
          if (file) {
            try {
              // Download langsung
              await downloadFileDirectly(
                file.path,
                fileName || file.path.split("/").pop()
              );
              toast.success(`File berhasil diunduh`);
              return { success: true, fallback: true };
            } catch (directErr) {
              console.error("Direct download failed:", directErr);
            }
          }
        }

        if (err.name !== "AbortError" && !err.cancelled) {
          toast.error(err.message || "Gagal mengunduh file");
        }
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, assignments]
  );

  // Enhanced increment view with file ID support
  const incrementView = useCallback(
    async (fileId) => {
      try {
        await dispatch(
          incrementAssignmentView({ classroomCode, fileId })
        ).unwrap();

        return { success: true };
      } catch (err) {
        // Silent failure for view count increment
        console.warn("Failed to increment view count:", err);
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode]
  );

  // View external link with file ID support
  const viewExternalLink = useCallback(
    async (fileId) => {
      try {
        await dispatch(
          viewExternalLinkThunk({ classroomCode, fileId })
        ).unwrap();

        return { success: true };
      } catch (err) {
        if (err.name !== "AbortError" && !err.cancelled) {
          toast.error(err.message || "Gagal membuka link");
        }
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode]
  );

  // Enhanced page change handler
  const handlePageChange = useCallback(
    (page) => {
      setFilters({ page });
    },
    [setFilters]
  );

  // Cache management functions
  const refreshCache = useCallback(() => {
    fetchAssignmentsData(filtersRef.current, { forceRefresh: true });
  }, [fetchAssignmentsData]);

  const clearClassroomCache = useCallback(() => {
    dispatch(clearCache(classroomCode));
    fetchAssignmentsData(filtersRef.current, { forceRefresh: true });
  }, [dispatch, classroomCode, fetchAssignmentsData]);

  const clearAllCache = useCallback(() => {
    dispatch(clearCache());
  }, [dispatch]);

  // Enhanced initialization with caching logic
  useEffect(() => {
    if (!classroomCode) return;

    // Clear any pending requests when classroom changes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Reset state for new classroom
    lastFetchParamsRef.current = null;
    isFetchingRef.current = false;

    // Reset filters to default for new classroom
    const defaultFilters = {
      search: "",
      type: "",
      sort_by: "created_at",
      sort_order: "desc",
      per_page: 10,
      page: 1,
    };

    filtersRef.current = defaultFilters;

    // Set current classroom
    if (currentClassroomCode !== classroomCode) {
      dispatch(setCurrentClassroom(classroomCode));
    }

    // Clear any previous errors
    dispatch(resetAssignmentStatus());

    // Fetch assignments - will use cache if available and not expired
    fetchAssignmentsData(defaultFilters);

    // Cleanup on unmount or classroom change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      isFetchingRef.current = false;
    };
  }, [classroomCode, dispatch, fetchAssignmentsData, currentClassroomCode]);

  // Auto-refresh expired cache on focus
  useEffect(() => {
    const handleFocus = () => {
      if (classroomCode && !isCached) {
        fetchAssignmentsData(filtersRef.current, {
          forceRefresh: true,
          silent: true,
        });
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [classroomCode, isCached, fetchAssignmentsData]);

  // Handle error toasts
  const prevErrorRef = useRef();
  const prevValidationErrorsRef = useRef();

  useEffect(() => {
    if (error && error !== prevErrorRef.current) {
      toast.error(error);
      prevErrorRef.current = error;
    }

    if (
      validationErrors &&
      validationErrors !== prevValidationErrorsRef.current
    ) {
      Object.entries(validationErrors).forEach(([key, errors]) => {
        const errorMessage = Array.isArray(errors) ? errors.join(", ") : errors;
        toast.error(`${key}: ${errorMessage}`);
      });
      prevValidationErrorsRef.current = validationErrors;
    }
  }, [error, validationErrors]);

  return {
    // Data - assignments now include submissions
    assignments,
    pagination,
    filters: filtersRef.current,

    // Status
    status,
    createStatus,
    updateStatus,
    deleteStatus,
    downloadStatus,
    error,
    validationErrors,

    // Cache info
    isCached,
    cacheStats,

    // Actions
    fetchAssignmentsData,
    setFilters,
    clearFilters,
    addAssignment,
    editAssignment,
    removeAssignment,
    downloadFile,
    incrementView,
    viewExternalLink,
    handlePageChange,
    downloadFileDirectly,
    // Cache management
    refreshCache,
    clearClassroomCache,
    clearAllCache,
  };
};

// Combined hook for both list and detail management with submission support
export const useAssignmentManager = (
  classroomCode,
  assignmentId = null,
  options = {}
) => {
  const listHook = useAssignments(classroomCode);
  const detailHook = useAssignmentDetail(classroomCode, assignmentId, options);
  const submissionHook = useAssignmentSubmission(
    classroomCode,
    assignmentId,
    options
  );

  return {
    list: listHook,
    detail: detailHook,
    submission: submissionHook,
    // Combined loading state
    isLoading:
      listHook.status === "loading" ||
      detailHook?.isLoading ||
      submissionHook?.isLoading,
    // Combined error state
    error: listHook.error || detailHook?.error || submissionHook?.error,
  };
};

// Utility functions
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Validation utilities for submission
export const validateSubmissionData = (submissionData) => {
  const errors = {};

  if (
    !submissionData.submissionText?.trim() &&
    (!submissionData.files || submissionData.files.length === 0)
  ) {
    errors.content = "Submission harus memiliki teks atau file";
  }

  if (submissionData.files) {
    const maxFileSize = 20 * 1024 * 1024; // 20MB
    const allowedTypes = [
      "pdf",
      "doc",
      "docx",
      "ppt",
      "pptx",
      "txt",
      "jpg",
      "jpeg",
      "png",
      "gif",
    ];

    submissionData.files.forEach((file, index) => {
      if (file.size > maxFileSize) {
        errors[
          `file_${index}`
        ] = `File ${file.name} melebihi ukuran maksimal 20MB`;
      }

      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!allowedTypes.includes(extension)) {
        errors[
          `file_${index}_type`
        ] = `Tipe file ${extension} tidak diperbolehkan`;
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Format utilities
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 bytes";

  const k = 1024;
  const sizes = ["bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getSubmissionStatusConfig = (status) => {
  const configs = {
    draft: {
      text: "Draft",
      color: "yellow",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-800",
      borderColor: "border-yellow-200",
      canEdit: true,
      icon: "📝",
    },
    submitted: {
      text: "Dikumpulkan",
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-800",
      borderColor: "border-green-200",
      canEdit: false,
      icon: "✅",
    },
    graded: {
      text: "Dinilai",
      color: "blue",
      bgColor: "bg-blue-100",
      textColor: "text-blue-800",
      borderColor: "border-blue-200",
      canEdit: false,
      icon: "📊",
    },
    returned: {
      text: "Dikembalikan",
      color: "red",
      bgColor: "bg-red-100",
      textColor: "text-red-800",
      borderColor: "border-red-200",
      canEdit: true,
      icon: "🔄",
    },
  };

  return configs[status] || configs.draft;
};

export default useAssignments;
