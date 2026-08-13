import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  addClassroomToList,
  addStudent,
  addTeacher,
  clearClassroomCache,
  clearErrors,
  createClassroom,
  deleteClassroom,
  fetchAvailableStudents,
  fetchAvailableTeachers,
  fetchClassroomDetail,
  fetchClassrooms,
  getDetailCache,
  invalidateCache,
  invalidateDetailCacheByCode,
  optimisticCreateClassroom,
  removeStudent,
  removeTeacher,
  replaceOptimisticClassroom,
  resetCurrentClassroom,
  resetFilters,
  resetStatus,
  revertOptimisticClassroom,
  selectAvailableStudents,
  selectAvailableTeachers,
  selectCacheMetadata,
  selectCanLoadMore,
  selectClassroomById,
  selectClassroomError,
  selectClassrooms,
  selectClassroomStatus,
  selectClassroomStudents,
  selectClassroomTeachers,
  selectCreateStatus,
  selectCurrentClassroom,
  selectCurrentClassroomWithCache,
  selectDeleteStatus,
  selectDetailStatus,
  selectFilteredClassroomsCount,
  selectFilters,
  selectHasClassrooms,
  selectIsCreating,
  selectIsCurrentClassroom,
  selectIsDeleting,
  selectIsDetailStale,
  selectIsListStale,
  selectIsLoading,
  selectIsLoadingDetail,
  selectIsLoadingStudents,
  selectIsLoadingTeachers,
  selectIsStudentsStale,
  selectIsTeachersStale,
  selectIsUpdating,
  selectLastUpdated,
  selectPagination,
  selectSearchTerm,
  selectStudentStatus,
  selectTeacherStatus,
  selectUpdateStatus,
  selectValidationErrors,
  selectViewMode,
  setCurrentPage,
  setFilters,
  setPerPage,
  setSearchTerm,
  setViewMode,
  updateCache,
  updateClassroom,
  updateClassroomInList,
  updateClassroomTeachersAndStudents,
  updateCurrentClassroom,
  updateDetailCache,
  updateStudentStatus,
} from "./classroomSlice";

// Cache configuration constants
const CACHE_CONFIG = {
  LIST_TIMEOUT: 2 * 60 * 1000, // 2 minutes
  DETAIL_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  TEACHERS_TIMEOUT: 10 * 60 * 1000, // 10 minutes
  STUDENTS_TIMEOUT: 10 * 60 * 1000, // 10 minutes
  POLLING_INTERVAL: 30 * 1000, // 30 seconds
  DEBOUNCE_DELAY: 500, // 500ms for search
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook for debounced search
 * @param {string} initialValue - Initial search term
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Object} - Search term, debounced term, and handler
 */


export const useClassroomList = (options = {}) => {
  const {
    autoLoad = true,
    cacheTimeout = CACHE_CONFIG.LIST_TIMEOUT,
    enablePolling = false,
    pollingInterval = CACHE_CONFIG.POLLING_INTERVAL,
    dataProps = null,
    enableDetailCaching = true,
  } = options;

  const dispatch = useDispatch();

  // Selectors with fallback values
  const classrooms = useSelector(selectClassrooms) || [];
  const pagination = useSelector(selectPagination) || {};
  const filters = useSelector(selectFilters) || {};
  const viewMode = useSelector(selectViewMode) || "grid";
  const isLoading = useSelector(selectIsLoading) || false;
  const error = useSelector(selectClassroomError);
  const canLoadMore = useSelector(selectCanLoadMore) || false;
  const status = useSelector(selectClassroomStatus) || "idle";
  const lastUpdated = useSelector(selectLastUpdated);
  const isStale = useSelector((state) =>
    selectIsListStale(state, cacheTimeout)
  );
  const hasClassrooms = useSelector(selectHasClassrooms) || false;
  const filteredCount = useSelector(selectFilteredClassroomsCount) || 0;
  const storeSearchTerm = useSelector(selectSearchTerm) || "";

  // OPTIMIZATION: Add request tracking and throttling
  const activeRequestRef = useRef(null);
  const lastSuccessfulParamsRef = useRef(null);
  const searchTimeoutRef = useRef(null); // New ref for throttling search

  // Use store search term directly
  const debouncedSearchTerm = useDebounce(
    storeSearchTerm,
    CACHE_CONFIG.DEBOUNCE_DELAY
  );

  // Initialize cache with props data
  useEffect(() => {
    if (dataProps && Array.isArray(dataProps) && dataProps.length > 0) {
      dispatch(
        addClassroomToList({ classroomData: dataProps, position: "start" })
      );
    }
  }, [dataProps, dispatch]);

  // Memoized query params
  const currentParams = useMemo(
    () => ({
      page: pagination.currentPage ?? 1,
      per_page: pagination.perPage ?? 10,
      search: debouncedSearchTerm?.trim() ?? "",
      status: filters.status !== "all" ? filters.status : undefined,
    }),
    [
      pagination.currentPage,
      pagination.perPage,
      debouncedSearchTerm,
      filters.status,
    ]
  );

  // OPTIMIZATION: Check if params changed significantly
  const hasParamsChanged = useCallback((newParams, oldParams) => {
    if (!oldParams) return true;
    return (
      newParams.page !== oldParams.page ||
      newParams.per_page !== oldParams.per_page ||
      newParams.search !== oldParams.search ||
      newParams.status !== oldParams.status
    );
  }, []);

  // Enhanced load function with request deduplication and throttling
  const loadClassrooms = useCallback(
    async (params = {}, forceRefresh = false) => {
      // Cancel previous request if still pending
      if (activeRequestRef.current && !forceRefresh) {
        activeRequestRef.current.cancelled = true;
      }

      if (isLoading && !forceRefresh) {
        return { success: false, reason: "already-loading" };
      }

      const queryParams = {
        ...currentParams,
        ...params,
        page: Math.max(1, parseInt(params.page || currentParams.page, 10)),
        per_page: params.per_page || currentParams.per_page,
      };

      // Skip if same params as last successful request
      if (
        !forceRefresh &&
        !hasParamsChanged(queryParams, lastSuccessfulParamsRef.current)
      ) {
        console.log(
          "[useClassroomList] Skipping duplicate request:",
          queryParams
        );
        return { success: false, reason: "duplicate-params" };
      }

      const shouldLoad =
        forceRefresh ||
        status === "idle" ||
        isStale ||
        !hasClassrooms ||
        hasParamsChanged(queryParams, lastSuccessfulParamsRef.current);

      if (!shouldLoad) {
        return { success: false, reason: "no-need-to-load" };
      }

      // Create cancellable request
      const requestRef = { cancelled: false };
      activeRequestRef.current = requestRef;

      try {
        console.log("[useClassroomList] Loading classrooms:", queryParams);

        if (requestRef.cancelled) {
          return { success: false, reason: "cancelled" };
        }

        const result = await dispatch(fetchClassrooms(queryParams)).unwrap();

        if (requestRef.cancelled) {
          console.log("[useClassroomList] Request cancelled after API call");
          return { success: false, reason: "cancelled" };
        }

        // Enhanced detail caching from list response
        if (enableDetailCaching && result.data?.data) {
          const timestamp = new Date().toISOString();
          result.data.data.forEach((classroom) => {
            updateDetailCache(classroom.id, classroom, timestamp);
          });
        }

        lastSuccessfulParamsRef.current = { ...queryParams };
        activeRequestRef.current = null;

        return { success: true, data: result };
      } catch (error) {
        if (!requestRef.cancelled) {
          console.error("[useClassroomList] Load failed:", error);
          toast.error(error.message || "Gagal memuat data kelas");
        }

        activeRequestRef.current = null;
        return { success: false, error };
      }
    },
    [
      dispatch,
      currentParams,
      status,
      isStale,
      hasClassrooms,
      isLoading,
      enableDetailCaching,
      hasParamsChanged,
    ]
  );

  // OPTIMIZATION: Throttled search handler
  const handleSearch = useCallback(
    (term) => {
      // Cancel any pending requests
      if (activeRequestRef.current) {
        activeRequestRef.current.cancelled = true;
      }

      // Cancel any pending search timeouts
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      dispatch(setSearchTerm(term));

      // Throttle the loadClassrooms call
      searchTimeoutRef.current = setTimeout(() => {
        dispatch(setCurrentPage(1));
        loadClassrooms({ search: term, page: 1 }, true);
      }, CACHE_CONFIG.DEBOUNCE_DELAY);
    },
    [dispatch, loadClassrooms]
  );

  // Remove redundant useEffect for search term synchronization
  // Initial load
  useEffect(() => {
    if (autoLoad && status === "idle" && !isLoading && !dataProps) {
      loadClassrooms();
    }
  }, [autoLoad, status, isLoading, loadClassrooms, dataProps]);

  // Polling
  useEffect(() => {
    if (enablePolling && !isLoading) {
      const interval = setInterval(() => {
        if (!activeRequestRef.current) {
          loadClassrooms({}, true);
        }
      }, pollingInterval);
      return () => clearInterval(interval);
    }
  }, [enablePolling, isLoading, loadClassrooms, pollingInterval]);

  // Handle filter change
  const handleFilterChange = useCallback(
    (newFilters) => {
      if (activeRequestRef.current) {
        activeRequestRef.current.cancelled = true;
      }

      dispatch(setFilters(newFilters));
      dispatch(setCurrentPage(1));

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        loadClassrooms(
          {
            page: 1,
            per_page: pagination.perPage,
            search: debouncedSearchTerm,
            status: newFilters.status !== "all" ? newFilters.status : undefined,
          },
          true
        );
      }, CACHE_CONFIG.DEBOUNCE_DELAY);

      return () => clearTimeout(searchTimeoutRef.current);
    },
    [dispatch, loadClassrooms, pagination.perPage, debouncedSearchTerm]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (page) => {
      const targetPage = Math.max(1, parseInt(page, 10));
      const maxPage = pagination.lastPage || 1;

      if (targetPage === pagination.currentPage || targetPage > maxPage) {
        return;
      }

      dispatch(setCurrentPage(targetPage));
      loadClassrooms({ page: targetPage }, true);
    },
    [dispatch, loadClassrooms, pagination.currentPage, pagination.lastPage]
  );

  // Handle per page change
  const handlePerPageChange = useCallback(
    (perPage) => {
      if (activeRequestRef.current) {
        activeRequestRef.current.cancelled = true;
      }

      const newPerPage = Math.max(1, parseInt(perPage, 10));
      dispatch(setPerPage(newPerPage));
      dispatch(setCurrentPage(1));
      loadClassrooms({ per_page: newPerPage, page: 1 }, true);
    },
    [dispatch, loadClassrooms]
  );

  // Load more
  const loadMore = useCallback(() => {
    if (!canLoadMore || isLoading || activeRequestRef.current) return;
    const nextPage = (pagination.currentPage || 1) + 1;
    handlePageChange(nextPage);
  }, [canLoadMore, isLoading, pagination.currentPage, handlePageChange]);

  // Refresh
  const refresh = useCallback(() => {
    loadClassrooms({ page: pagination.currentPage }, true);
  }, [loadClassrooms, pagination.currentPage]);

  // Smart refresh
  const smartRefresh = useCallback(() => {
    if (isStale) refresh();
  }, [isStale, refresh]);

  // Clear filters
  const clearFilters = useCallback(() => {
    if (activeRequestRef.current) {
      activeRequestRef.current.cancelled = true;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    dispatch(resetFilters());
    dispatch(setSearchTerm(""));
    dispatch(setCurrentPage(1));
    loadClassrooms({ page: 1, search: "", status: undefined }, true);
  }, [dispatch, loadClassrooms]);

  // Change view mode
  const handleViewModeChange = useCallback(
    (mode) => dispatch(setViewMode(mode)),
    [dispatch]
  );

  // Invalidate cache
  const invalidateListCache = useCallback(
    () => dispatch(invalidateCache({ type: "list" })),
    [dispatch]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeRequestRef.current) {
        activeRequestRef.current.cancelled = true;
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Safe pagination
  const safePagination = useMemo(
    () => ({
      ...pagination,
      currentPage: Math.max(1, pagination.currentPage || 1),
      perPage: Math.max(1, pagination.perPage || 10),
      totalPages: Math.max(1, pagination.lastPage || 1),
      totalItems: Math.max(0, pagination.total || 0),
      lastPage: Math.max(1, pagination.lastPage || 1),
      hasNextPage: pagination.currentPage < (pagination.lastPage || 1),
      hasPrevPage: pagination.currentPage > 1,
    }),
    [pagination]
  );

  return {
    classrooms,
    pagination: safePagination,
    searchTerm: storeSearchTerm, // Use store search term directly
    filters,
    viewMode,
    isLoading,
    error,
    canLoadMore,
    lastUpdated,
    isStale,
    hasClassrooms,
    filteredCount,
    handleSearch,
    handleFilterChange,
    handlePageChange,
    handlePerPageChange,
    handleViewModeChange,
    loadMore,
    refresh,
    smartRefresh,
    clearFilters,
    invalidateListCache,
    loadClassrooms,
    isValidPage: (page) => page >= 1 && page <= (pagination.lastPage || 1),
  };
};

/**
 * Hook for classroom detail with anti-spam protection and optimized re-renders
 * @param {string} classroomCode - CODE of the classroom
 * @param {Object} options - Configuration options
 * @returns {Object} - Classroom detail management utilities
 */

export const useClassroomDetail = (classroomCode, options = {}) => {
  const {
    cacheTimeout = CACHE_CONFIG.DETAIL_TIMEOUT,
    enablePolling = false,
    pollingInterval = CACHE_CONFIG.POLLING_INTERVAL,
    dataProps = null,
    preferCache = true,
    autoFetch = true,
  } = options;

  const dispatch = useDispatch();
  const initializationRef = useRef({
    hasInitialized: false,
    lastClassroomCode: null,
    dataPropsProcessed: false,
  });

  // Semua useSelector di top-level
  const currentClassroom = useSelector((state) =>
    selectCurrentClassroomWithCache(state, classroomCode)
  );
  const teachers = useSelector((state) =>
    selectClassroomTeachers(state, classroomCode)
  );
  const students = useSelector((state) =>
    selectClassroomStudents(state, classroomCode)
  );
  const isLoading = useSelector(selectIsLoadingDetail) || false;
  const error = useSelector(selectClassroomError);
  const lastUpdated = useSelector(selectLastUpdated);
  const reduxStale = useSelector((state) =>
    selectIsDetailStale(state, cacheTimeout)
  );

  // Reset initialization saat classroomCode berubah
  useEffect(() => {
    if (initializationRef.current.lastClassroomCode !== classroomCode) {
      initializationRef.current = {
        hasInitialized: false,
        lastClassroomCode: classroomCode,
        dataPropsProcessed: false,
      };
    }
  }, [classroomCode]);

  // Status cache
  const cacheStatus = useMemo(() => {
    if (!classroomCode) {
      return {
        isStale: true,
        hasDetailCache: false,
        hasReduxData: false,
        cacheAge: null,
        reason: "no-classroom-code",
      };
    }

    const detailCacheData = getDetailCache(classroomCode);
    const hasDetailCache = Boolean(detailCacheData?.timestamp);
    const detailCacheAge = hasDetailCache
      ? new Date() - new Date(detailCacheData.timestamp)
      : Infinity;
    const isDetailCacheStale = detailCacheAge > cacheTimeout;
    const hasReduxData = Boolean(currentClassroom);

    const isStale =
      (!hasDetailCache || isDetailCacheStale) && (!hasReduxData || reduxStale);

    return {
      isStale,
      hasDetailCache,
      hasReduxData,
      cacheAge: Math.min(detailCacheAge, reduxStale ? Infinity : 0),
      detailCacheAge,
      isDetailCacheStale,
      reduxStale,
      reason: isStale ? "cache-stale" : "cache-fresh",
    };
  }, [classroomCode, cacheTimeout, currentClassroom, reduxStale]);

  // Status data
  const dataStatus = useMemo(() => {
    const hasValidDataProps = Boolean(
      dataProps?.code === classroomCode &&
        typeof dataProps === "object" &&
        !initializationRef.current.dataPropsProcessed
    );

    const hasCompleteCurrentClassroom = Boolean(
      currentClassroom?.id === classroomCode &&
        Array.isArray(teachers) &&
        Array.isArray(students) &&
        !cacheStatus.isStale
    );

    const hasValidDetailCache = Boolean(
      cacheStatus.hasDetailCache &&
        !cacheStatus.isDetailCacheStale &&
        getDetailCache(classroomCode)?.data
    );

    const hasBasicCurrentClassroom = Boolean(
      currentClassroom?.id === classroomCode
    );

    const hasSufficientData =
      hasValidDataProps ||
      hasCompleteCurrentClassroom ||
      (hasValidDetailCache && hasBasicCurrentClassroom);

    console.log("[useClassroomDetail] Data status check:", {
      classroomCode,
      hasValidDataProps,
      hasCompleteCurrentClassroom,
      hasValidDetailCache,
      hasBasicCurrentClassroom,
      hasSufficientData,
      cacheStatus: cacheStatus.reason,
      teachersCount: teachers?.length || 0,
      studentsCount: students?.length || 0,
    });

    return {
      hasSufficientData,
      hasValidDataProps,
      hasCompleteCurrentClassroom,
      hasValidDetailCache,
      hasBasicCurrentClassroom,
      priority: hasValidDataProps
        ? 1
        : hasCompleteCurrentClassroom
        ? 2
        : hasValidDetailCache
        ? 3
        : hasBasicCurrentClassroom
        ? 4
        : 0,
    };
  }, [
    dataProps,
    classroomCode,
    currentClassroom,
    teachers,
    students,
    cacheStatus,
  ]);

  // Initialize dari dataProps
  useEffect(() => {
    if (
      dataProps?.code === classroomCode &&
      !initializationRef.current.dataPropsProcessed
    ) {
      console.log(
        "[useClassroomDetail] Initializing from dataProps (highest priority)"
      );

      const timestamp = new Date().toISOString();
      updateDetailCache(classroomCode, dataProps, timestamp);
      updateCache(
        "teachers",
        classroomCode,
        dataProps?.teachers || [],
        timestamp
      );
      updateCache(
        "students",
        classroomCode,
        dataProps?.students || [],
        timestamp
      );

      dispatch(
        updateCurrentClassroom({
          classroomData: {
            ...dataProps,
            id: classroomCode,
            teachers: dataProps.teachers || [],
            students: dataProps.students || [],
            teacher_count: dataProps.teachers?.length || 0,
            student_count: dataProps.students?.length || 0,
          },
        })
      );

      initializationRef.current.dataPropsProcessed = true;
      initializationRef.current.hasInitialized = true;
    }
  }, [dataProps, classroomCode, dispatch]);

  // Keputusan fetch
  const shouldFetch = useCallback(() => {
    if (!classroomCode) return { should: false, reason: "no-classroom-code" };
    if (!autoFetch) return { should: false, reason: "auto-fetch-disabled" };
    if (isLoading) return { should: false, reason: "already-loading" };
    if (dataStatus.hasSufficientData && preferCache)
      return { should: false, reason: "sufficient-cached-data" };
    if (dataStatus.hasValidDataProps)
      return { should: false, reason: "has-data-props" };
    if (!cacheStatus.isStale)
      return { should: false, reason: "cache-is-fresh" };

    return {
      should: true,
      reason: cacheStatus.hasReduxData ? "cache-stale" : "no-data",
    };
  }, [
    classroomCode,
    autoFetch,
    isLoading,
    dataStatus.hasSufficientData,
    dataStatus.hasValidDataProps,
    preferCache,
    cacheStatus.isStale,
    cacheStatus.hasReduxData,
  ]);

  // Fetch detail
  const fetchDetail = useCallback(
    async (forceRefresh = false) => {
      const fetchDecision = shouldFetch();
      if (!forceRefresh && !fetchDecision.should) {
        console.log("[useClassroomDetail] Skipping fetch:", {
          classroomCode,
          reason: fetchDecision.reason,
          cacheAge: cacheStatus.cacheAge,
          hasSufficientData: dataStatus.hasSufficientData,
        });
        return { success: false, reason: fetchDecision.reason, skipped: true };
      }

      try {
        const result = await dispatch(
          fetchClassroomDetail(classroomCode)
        ).unwrap();
        console.log("[useClassroomDetail] Fetch successful");
        return { success: true, data: result };
      } catch (err) {
        if (err.status !== 404 && !dataStatus.hasSufficientData) {
          toast.error(err.message || "Gagal memuat detail kelas");
        }
        return { success: false, error: err };
      }
    },
    [
      dispatch,
      classroomCode,
      shouldFetch,
      cacheStatus,
      dataStatus.hasSufficientData,
    ]
  );

  // Initial fetch
  useEffect(() => {
    if (!initializationRef.current.hasInitialized && classroomCode) {
      const fetchDecision = shouldFetch();
      if (fetchDecision.should) fetchDetail();
      initializationRef.current.hasInitialized = true;
    }
  }, [classroomCode, fetchDetail, shouldFetch]);

  // Polling
  useEffect(() => {
    if (!enablePolling || !classroomCode) return;
    if (dataStatus.hasSufficientData && !cacheStatus.isStale) return;

    const interval = setInterval(() => {
      const fetchDecision = shouldFetch();
      if (fetchDecision.should) fetchDetail();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [
    enablePolling,
    classroomCode,
    pollingInterval,
    dataStatus.hasSufficientData,
    cacheStatus.isStale,
    fetchDetail,
    shouldFetch,
  ]);

  // Refresh
  const refreshDetail = useCallback(() => {
    if (!classroomCode) {
      return Promise.resolve({ success: false, reason: "no-classroom-code" });
    }
    invalidateDetailCacheByCode(classroomCode);
    dispatch(invalidateCache({ type: "detail", classroomCode }));
    dispatch(invalidateCache({ type: "teachers", classroomCode }));
    dispatch(invalidateCache({ type: "students", classroomCode }));
    return fetchDetail(true);
  }, [classroomCode, dispatch, fetchDetail]);

  const smartRefresh = useCallback(() => {
    if (cacheStatus.isStale || !dataStatus.hasSufficientData) {
      return refreshDetail();
    }
    return Promise.resolve({ success: false, reason: "data-is-fresh" });
  }, [cacheStatus.isStale, dataStatus.hasSufficientData, refreshDetail]);

  // Reset
  const resetDetail = useCallback(() => {
    dispatch(resetCurrentClassroom());
    invalidateDetailCacheByCode(classroomCode);
    clearClassroomCache(classroomCode);
    initializationRef.current = {
      hasInitialized: false,
      lastClassroomCode: classroomCode,
      dataPropsProcessed: false,
    };
  }, [dispatch, classroomCode]);

  // Data efektif
  const effectiveClassroom = useMemo(() => {
    if (currentClassroom) {
      return {
        ...currentClassroom,
        teachers: teachers || currentClassroom.teachers || [],
        students: students || currentClassroom.students || [],
        teacher_count: teachers?.length || currentClassroom.teacher_count || 0,
        student_count: students?.length || currentClassroom.student_count || 0,
      };
    }
    const detailCacheData = getDetailCache(classroomCode);
    if (detailCacheData?.data) {
      return {
        ...detailCacheData.data,
        id: classroomCode,
        teachers: teachers || detailCacheData.data.teachers || [],
        students: students || detailCacheData.data.students || [],
        teacher_count:
          teachers?.length || detailCacheData.data.teacher_count || 0,
        student_count:
          students?.length || detailCacheData.data.student_count || 0,
      };
    }
    return null;
  }, [currentClassroom, teachers, students, classroomCode]);

  return {
    currentClassroom: effectiveClassroom,
    teachers: teachers || [],
    students: students || [],
    isLoading,
    error,
    lastUpdated,
    isStale: cacheStatus.isStale,
    cacheAge: cacheStatus.cacheAge,
    hasSufficientData: dataStatus.hasSufficientData,
    dataSource:
      dataStatus.priority === 1
        ? "dataProps"
        : dataStatus.priority === 2
        ? "complete-cache"
        : dataStatus.priority === 3
        ? "detail-cache"
        : dataStatus.priority === 4
        ? "basic-cache"
        : "none",
    cacheStatus,
    dataStatus,
    loadClassroomDetail: fetchDetail,
    refreshDetail,
    smartRefresh,
    resetDetail,
    invalidateDetailCache: () => invalidateDetailCacheByCode(classroomCode),
    invalidateTeacherCache: () =>
      dispatch(invalidateCache({ type: "teachers", classroomCode })),
    invalidateStudentCache: () =>
      dispatch(invalidateCache({ type: "students", classroomCode })),
  };
};

/**
 * Hook for create/update classroom with props initialization
 * @param {Object} dataProps - Initial classroom data
 * @returns {Object} - Classroom form management utilities
 */
export const useClassroomForm = (dataProps = null) => {
  const dispatch = useDispatch();
  const classrooms = useSelector(selectClassrooms) || [];
  const pagination = useSelector(selectPagination) || {};
  const isCreating = useSelector(selectIsCreating) || false;
  const isUpdating = useSelector(selectIsUpdating) || false;
  const error = useSelector(selectClassroomError);
  const validationErrors = useSelector(selectValidationErrors);

  // Initialize form data with props
  const initialFormData = useMemo(
    () => ({
      ...dataProps,
      teachers: [],
      students: [],
      teacher_count: 0,
      student_count: 0,
    }),
    [dataProps]
  );

  // Optimistic create
  const handleOptimisticCreate = useCallback(
    async (classroomData, options = {}) => {
      const {
        successMessage = "Kelas berhasil dibuat",
        showOptimistic = true,
      } = options;

      const tempId = `temp_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      try {
        if (showOptimistic) {
          dispatch(
            optimisticCreateClassroom({
              tempId,
              classroomData: {
                ...classroomData,
                status: classroomData.status || "active",
                teachers: [],
                students: [],
                teacher_count: 0,
                student_count: 0,
              },
            })
          );
        }

        const result = await dispatch(createClassroom(classroomData)).unwrap();

        if (showOptimistic) {
          dispatch(
            replaceOptimisticClassroom({ tempId, realClassroom: result.data })
          );
        } else {
          dispatch(
            addClassroomToList({
              classroomData: result.data,
              position: "start",
            })
          );
        }

        toast.success(successMessage);
        return {
          success: true,
          data: result.data,
          tempId: showOptimistic ? tempId : null,
        };
      } catch (error) {
        if (showOptimistic) {
          dispatch(revertOptimisticClassroom({ tempId }));
        }
        toast.error(error.message || "Gagal membuat kelas");
        return {
          success: false,
          error,
          tempId: showOptimistic ? tempId : null,
        };
      }
    },
    [dispatch]
  );

  // Standard create
  const handleCreate = useCallback(
    async (classroomData, options = {}) => {
      const {
        successMessage = "Kelas berhasil dibuat",
        updateCache = true,
        position = "start",
      } = options;

      try {
        const result = await dispatch(createClassroom(classroomData)).unwrap();
        if (updateCache) {
          dispatch(
            addClassroomToList({
              classroomData: {
                ...result.data,
                teachers: [],
                students: [],
                teacher_count: 0,
                student_count: 0,
              },
              position,
            })
          );
        }

        toast.success(successMessage);
        return { success: true, data: result.data };
      } catch (error) {
        toast.error(error.message || "Gagal membuat kelas");
        return { success: false, error };
      }
    },
    [dispatch]
  );

  // Create with navigation
  const handleCreateWithNavigation = useCallback(
    async (classroomData, navigate, options = {}) => {
      const {
        redirectPath = "/classrooms",
        redirectToFirst = true,
        optimistic = false,
        ...createOptions
      } = options;

      const result = optimistic
        ? await handleOptimisticCreate(classroomData, createOptions)
        : await handleCreate(classroomData, createOptions);

      if (result.success) {
        if (redirectToFirst) {
          navigate(`${redirectPath}/${result.data.id}`, {
            state: {
              dataProps: {
                ...result.data,
                teachers: [],
                students: [],
                teacher_count: 0,
                student_count: 0,
              },
              newlyCreated: true,
              classroomCode: result.data.id,
              fromCreate: true,
            },
            replace: true,
          });
        } else {
          navigate(redirectPath);
        }
      }

      return result;
    },
    [handleCreate, handleOptimisticCreate]
  );

  // Optimistic update
  const handleOptimisticUpdate = useCallback(
    async (classroomCode, classroomData, options = {}) => {
      const {
        successMessage = "Kelas berhasil diupdate",
        refreshDetail = false,
      } = options;

      const originalClassroom =
        classrooms.find((c) => c.code === classroomCode) || {};

      try {
        // Optimistic update di UI
        if (originalClassroom.code) {
          const optimisticData = {
            ...originalClassroom,
            ...classroomData,
            id: classroomCode,
          };

          dispatch(updateClassroomInList({ classroomData: optimisticData }));

          // Update cache juga
          const timestamp = new Date().toISOString();
          updateDetailCache(classroomCode, optimisticData, timestamp);
        }

        // API call
        const result = await dispatch(
          updateClassroom({ classroomCode, classroomData })
        ).unwrap();

        // Update dengan data real dari server
        const finalData = {
          ...result.data,
          id: classroomCode,
          teachers: originalClassroom.teachers || [],
          students: originalClassroom.students || [],
          teacher_count: originalClassroom.teacher_count || 0,
          student_count: originalClassroom.student_count || 0,
        };

        dispatch(updateClassroomInList({ classroomData: finalData }));

        // Force update semua cache terkait
        const timestamp = new Date().toISOString();
        updateDetailCache(classroomCode, finalData, timestamp);
        dispatch(invalidateCache({ type: "list" })); // Invalidate list cache

        if (refreshDetail) {
          await dispatch(fetchClassroomDetail(classroomCode)).unwrap();
        }

        toast.success(successMessage);
        return { success: true, data: result.data };
      } catch (error) {
        // Revert optimistic update
        if (originalClassroom.id) {
          dispatch(updateClassroomInList({ classroomData: originalClassroom }));
          updateDetailCache(classroomCode, originalClassroom);
        }
        toast.error(error.message || "Gagal mengupdate kelas");
        return { success: false, error };
      }
    },
    [dispatch, classrooms]
  );

  // Standard update
  const handleUpdate = useCallback(
    async (classroomCode, classroomData, options = {}) => {
      const {
        successMessage = "Kelas berhasil diupdate",
        refreshDetail = false,
        updateCacheOnly = false,
        optimistic = false,
      } = options;

      try {
        let result;

        if (updateCacheOnly) {
          // Update cache saja
          const updatedData = {
            ...classroomData,
            id: classroomCode,
          };
          dispatch(updateClassroomInList({ classroomData: updatedData }));
          dispatch(updateCurrentClassroom({ classroomData: updatedData }));

          // Update detail cache
          updateDetailCache(classroomCode, updatedData);

          result = { data: updatedData };
        } else if (optimistic) {
          return await handleOptimisticUpdate(
            classroomCode,
            classroomData,
            options
          );
        } else {
          // Standard update
          result = await dispatch(
            updateClassroom({ classroomCode, classroomData })
          ).unwrap();

          const finalData = {
            ...result.data,
            code: classroomCode,
          };

          // Update semua state dan cache
          dispatch(updateClassroomInList({ classroomData: finalData }));
          dispatch(updateCurrentClassroom({ classroomData: finalData }));

          // Update detail cache
          const timestamp = new Date().toISOString();
          updateDetailCache(classroomCode, finalData, timestamp);

          // Invalidate list cache untuk refresh
          dispatch(invalidateCache({ type: "list" }));
        }

        if (refreshDetail) {
          await dispatch(fetchClassroomDetail(classroomCode));
        }

        toast.success(successMessage);
        return { success: true, data: result.data };
      } catch (error) {
        toast.error(error.message || "Gagal mengupdate kelas");
        return { success: false, error };
      }
    },
    [dispatch, handleOptimisticUpdate]
  );

  const forceRefreshAfterUpdate = useCallback(
    (classroomCode) => {
      // Invalidate semua cache terkait
      dispatch(invalidateCache({ type: "list" }));
      dispatch(invalidateCache({ type: "detail", classroomCode }));
      invalidateDetailCacheByCode(classroomCode);

      // Force refresh list
      setTimeout(() => {
        dispatch(
          fetchClassrooms({
            page: pagination.currentPage || 1,
            per_page: pagination.perPage || 10,
          })
        );
      }, 100);

      // Force refresh detail jika ada
      if (classroomCode) {
        setTimeout(() => {
          dispatch(fetchClassroomDetail(classroomCode));
        }, 150);
      }
    },
    [dispatch, pagination]
  );

  // Manual cache update
  const updateCacheData = useCallback(
    (classroomData, updateDetail = false) => {
      const updatedData = {
        ...classroomData,
        teachers: [],
        students: [],
        teacher_count: 0,
        student_count: 0,
      };
      dispatch(updateClassroomInList({ classroomData: updatedData }));
      if (updateDetail) {
        dispatch(updateCurrentClassroom({ classroomData: updatedData }));
      }
    },
    [dispatch]
  );

  // Reset form status
  const resetFormStatus = useCallback(() => {
    dispatch(resetStatus());
  }, [dispatch]);

  // Clear errors
  const clearFormErrors = useCallback(() => {
    dispatch(clearErrors());
  }, [dispatch]);

  return {
    initialFormData,
    forceRefreshAfterUpdate,
    isCreating,
    isUpdating,
    error,
    validationErrors,
    pagination,
    handleCreate,
    handleUpdate,
    handleOptimisticCreate,
    handleCreateWithNavigation,
    handleOptimisticUpdate,
    updateCache: updateCacheData,
    resetFormStatus,
    clearFormErrors,
  };
};

/**
 * Hook for delete classroom
 * @returns {Object} - Classroom deletion utilities
 */
export const useClassroomDelete = () => {
  const dispatch = useDispatch();
  const isDeleting = useSelector(selectIsDeleting) || false;

  const handleDelete = useCallback(
    async (classroomCode, options = {}) => {
      const {
        confirmMessage = "Apakah Anda yakin ingin menghapus kelas ini?",
        successMessage = "Kelas berhasil dihapus",
        showConfirm = true,
      } = options;

      if (showConfirm && !window.confirm(confirmMessage)) {
        return { success: false, cancelled: true };
      }

      try {
        const result = await dispatch(deleteClassroom(classroomCode)).unwrap();
        toast.success(successMessage);
        return { success: true, data: result.data };
      } catch (error) {
        toast.error(error.message || "Gagal menghapus kelas");
        return { success: false, error };
      }
    },
    [dispatch]
  );

  const handleBatchDelete = useCallback(
    async (classroomCodes, options = {}) => {
      const {
        confirmMessage = `Apakah Anda yakin ingin menghapus ${classroomCodes.length} kelas?`,
        successMessage = "Semua kelas berhasil dihapus",
        showConfirm = true,
      } = options;

      if (showConfirm && !window.confirm(confirmMessage)) {
        return { success: false, cancelled: true };
      }

      try {
        const results = await Promise.allSettled(
          classroomCodes.map((id) => dispatch(deleteClassroom(id)).unwrap())
        );

        const successful = results.filter((r) => r.status === "fulfilled");
        const failed = results.filter((r) => r.status === "rejected");

        if (successful.length > 0) {
          toast.success(`${successful.length} kelas berhasil dihapus`);
        }
        if (failed.length > 0) {
          toast.error(`${failed.length} kelas gagal dihapus`);
        }
        toast.success(successMessage);

        return {
          success: successful.length > 0,
          successful: successful.length,
          failed: failed.length,
          results,
        };
      } catch (error) {
        toast.error("Gagal melakukan batch delete");
        return { success: false, error };
      }
    },
    [dispatch]
  );

  return {
    isDeleting,
    handleDelete,
    handleBatchDelete,
  };
};

/**
 * Hook for managing teachers with debounced search
 * @param {string} classroomCode - ID of the classroom
 * @param {Object} options - Configuration options
 * @returns {Object} - Teacher management utilities
 */
export const useClassroomTeachers = (classroomCode, options = {}) => {
  const { autoLoadAvailable = false } = options;
  const dispatch = useDispatch();
  const searchTimeoutRef = useRef(null);

  // Get teachers from cache-aware selector
  const teachers =
    useSelector((state) => selectClassroomTeachers(state, classroomCode)) || [];
  const availableTeachers = useSelector(selectAvailableTeachers) || [];
  const isLoading = useSelector(selectIsLoadingTeachers) || false;
  const error = useSelector(selectTeacherStatus).error || null;
  const isTeachersStale = useSelector((state) =>
    selectIsTeachersStale(state, CACHE_CONFIG.TEACHERS_TIMEOUT, classroomCode)
  );

  // Track last classroom ID to detect changes
  const lastClassroomIdRef = useRef(classroomCode);

  // Local state for search term
  const [searchTerm, setSearchTerm] = React.useState("");

  // Load available teachers with minimum search length
  const loadAvailableTeachers = useCallback(
    async (search = "", forceRefresh = false) => {
      if (!classroomCode) return { success: false, error: "No classroom ID" };
      if (isLoading && !forceRefresh)
        return { success: false, error: "Loading in progress" };
      if (
        !forceRefresh &&
        !isTeachersStale &&
        availableTeachers.length > 0 &&
        !search
      ) {
        return { success: true, data: availableTeachers };
      }
      if (search && search.trim().length < 2) {
        return { success: false, error: "Search term too short" };
      }

      try {
        const result = await dispatch(
          fetchAvailableTeachers({ classroomCode, search: search.trim() })
        ).unwrap();
        return { success: true, data: result.data };
      } catch (err) {
        toast.error(err.message || "Gagal memuat data guru yang tersedia");
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, isLoading, isTeachersStale, availableTeachers]
  );

  // Debounced search handler
  const handleSearch = useCallback(
    (value) => {
      setSearchTerm(value);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        loadAvailableTeachers(value, true);
      }, CACHE_CONFIG.DEBOUNCE_DELAY);
    },
    [loadAvailableTeachers]
  );

  // Add teacher with optimistic cache update
  const handleAddTeacher = useCallback(
    async (teacherId, options = {}) => {
      const { successMessage = "Guru berhasil ditambahkan" } = options;
      if (!classroomCode || !teacherId)
        return { success: false, error: "Invalid classroom or teacher ID" };

      try {
        const result = await dispatch(
          addTeacher({ classroomCode, teacherId })
        ).unwrap();
        dispatch(
          updateClassroomTeachersAndStudents({
            classroomCode,
            teachers: [...teachers, result.data],
            teacher_count: teachers.length + 1,
          })
        );
        toast.success(successMessage);
        return { success: true, data: result.data };
      } catch (err) {
        toast.error(err.message || "Gagal menambahkan guru");
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, teachers]
  );

  // Remove teacher
  const handleRemoveTeacher = useCallback(
    async (teacherId, options = {}) => {
      const { successMessage = "Guru berhasil dihapus" } = options;
      if (!classroomCode || !teacherId)
        return { success: false, error: "Invalid classroom or teacher ID" };

      try {
        const result = await dispatch(
          removeTeacher({ classroomCode, teacherId })
        ).unwrap();
        const updatedTeachers = teachers.filter((t) => t.id !== teacherId);
        dispatch(
          updateClassroomTeachersAndStudents({
            classroomCode,
            teachers: updatedTeachers,
            teacher_count: updatedTeachers.length,
          })
        );
        toast.success(successMessage);
        return { success: true, data: result.data };
      } catch (err) {
        toast.error(err.message || "Gagal menghapus guru");
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, teachers]
  );

  // Auto-load available teachers if enabled
  useEffect(() => {
    if (autoLoadAvailable && classroomCode) {
      loadAvailableTeachers("", true);
    }
  }, [autoLoadAvailable, classroomCode, loadAvailableTeachers]);

  // Detect classroom ID changes
  useEffect(() => {
    if (lastClassroomIdRef.current !== classroomCode && classroomCode) {
      lastClassroomIdRef.current = classroomCode;
      setSearchTerm("");
    }
  }, [classroomCode]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    teachers,
    availableTeachers,
    searchTerm,
    handleSearch,
    loadAvailableTeachers,
    handleAddTeacher,
    handleRemoveTeacher,
    isLoading,
    error,
    isTeachersStale,
  };
};

/**
 * Hook for managing students with debounced search
 * @param {string} classroomCode - ID of the classroom
 * @param {Object} options - Configuration options
 * @returns {Object} - Student management utilities
 */
export const useClassroomStudents = (classroomCode, options = {}) => {
  const { autoLoadAvailable = false } = options;
  const dispatch = useDispatch();
  const searchTimeoutRef = useRef(null);

  // Get students from cache-aware selector
  const students =
    useSelector((state) => selectClassroomStudents(state, classroomCode)) || [];
  const availableStudents = useSelector(selectAvailableStudents) || [];
  const isLoading = useSelector(selectIsLoadingStudents) || false;
  const error = useSelector(selectStudentStatus).error || null;
  const isStudentsStale = useSelector((state) =>
    selectIsStudentsStale(state, CACHE_CONFIG.STUDENTS_TIMEOUT, classroomCode)
  );

  // Track last classroom ID to detect changes
  const lastClassroomIdRef = useRef(classroomCode);

  // Local state for search term
  const [searchTerm, setSearchTerm] = React.useState("");

  // Load available students with minimum search length
  const loadAvailableStudents = useCallback(
    async (search = "", forceRefresh = false) => {
      if (!classroomCode) return { success: false, error: "No classroom ID" };
      if (isLoading && !forceRefresh)
        return { success: false, error: "Loading in progress" };
      if (
        !forceRefresh &&
        !isStudentsStale &&
        availableStudents.length > 0 &&
        !search
      ) {
        return { success: true, data: availableStudents };
      }
      if (search && search.trim().length < 2) {
        return { success: false, error: "Search term too short" };
      }

      try {
        const result = await dispatch(
          fetchAvailableStudents({ classroomCode, search: search.trim() })
        ).unwrap();
        return { success: true, data: result.data };
      } catch (err) {
        toast.error(err.message || "Gagal memuat data siswa yang tersedia");
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, isLoading, isStudentsStale, availableStudents]
  );

  // Debounced search handler
  const handleSearch = useCallback(
    (value) => {
      setSearchTerm(value);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        loadAvailableStudents(value, true);
      }, CACHE_CONFIG.DEBOUNCE_DELAY);
    },
    [loadAvailableStudents]
  );

  // Add student
  const handleAddStudent = useCallback(
    async (studentId, options = {}) => {
      const { successMessage = "Siswa berhasil ditambahkan" } = options;
      if (!classroomCode || !studentId)
        return { success: false, error: "Invalid classroom or student ID" };

      try {
        const result = await dispatch(
          addStudent({ classroomCode, studentId })
        ).unwrap();
        dispatch(
          updateClassroomTeachersAndStudents({
            classroomCode,
            students: [...students, result.data],
            student_count: students.length + 1,
          })
        );
        toast.success(successMessage);
        return { success: true, data: result.data };
      } catch (err) {
        toast.error(err.message || "Gagal menambahkan siswa");
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, students]
  );

  // Remove student
  const handleRemoveStudent = useCallback(
    async (studentId, options = {}) => {
      const { successMessage = "Siswa berhasil dihapus" } = options;
      if (!classroomCode || !studentId)
        return { success: false, error: "Invalid classroom or student ID" };

      try {
        const result = await dispatch(
          removeStudent({ classroomCode, studentId })
        ).unwrap();
        const updatedStudents = students.filter((s) => s.id !== studentId);
        dispatch(
          updateClassroomTeachersAndStudents({
            classroomCode,
            students: updatedStudents,
            student_count: updatedStudents.length,
          })
        );
        toast.success(successMessage);
        return { success: true, data: result.data };
      } catch (err) {
        toast.error(err.message || "Gagal menghapus siswa");
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, students]
  );

  // Update student status
  const handleUpdateStudentStatus = useCallback(
    async (studentId, status, options = {}) => {
      const { successMessage = "Status siswa berhasil diperbarui" } = options;
      if (!classroomCode || !studentId || !status)
        return {
          success: false,
          error: "Invalid classroom, student ID, or status",
        };

      try {
        const result = await dispatch(
          updateStudentStatus({ classroomCode, studentId, status })
        ).unwrap();
        const updatedStudents = students.map((s) =>
          s.id === studentId ? { ...s, status } : s
        );
        dispatch(
          updateClassroomTeachersAndStudents({
            classroomCode,
            students: updatedStudents,
            student_count: updatedStudents.length,
          })
        );
        toast.success(successMessage);
        return { success: true, data: result.data };
      } catch (err) {
        toast.error(err.message || "Gagal memperbarui status siswa");
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, students]
  );

  // Auto-load available students if enabled
  useEffect(() => {
    if (autoLoadAvailable && classroomCode) {
      loadAvailableStudents("", true);
    }
  }, [autoLoadAvailable, classroomCode, loadAvailableStudents]);

  // Detect classroom ID changes
  useEffect(() => {
    if (lastClassroomIdRef.current !== classroomCode && classroomCode) {
      lastClassroomIdRef.current = classroomCode;
      setSearchTerm("");
    }
  }, [classroomCode]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    students,
    availableStudents,
    searchTerm,
    handleSearch,
    loadAvailableStudents,
    handleAddStudent,
    handleRemoveStudent,
    handleUpdateStudentStatus,
    isLoading,
    error,
    isStudentsStale,
  };
};

/**
 * Hook for cache management
 * @returns {Object} - Cache management utilities
 */
export const useClassroomCache = () => {
  const dispatch = useDispatch();
  const cacheMetadata = useSelector(selectCacheMetadata) || {};
  const lastUpdated = useSelector(selectLastUpdated);

  const checkStaleness = useCallback(
    (type, maxAge, classroomCode = null) => {
      const key = classroomCode ? `${type}_${classroomCode}` : type;
      const timestamp =
        type === "general" ? lastUpdated : cacheMetadata[`${key}LastFetch`];
      if (!timestamp) return true;
      return new Date() - new Date(timestamp) > maxAge;
    },
    [lastUpdated, cacheMetadata]
  );

  const invalidateCacheAction = useCallback(
    (type, classroomCode = null) =>
      dispatch(invalidateCache({ type, classroomCode })),
    [dispatch]
  );

  const invalidateAllCache = useCallback(
    () => dispatch(invalidateCache({ type: "all" })),
    [dispatch]
  );

  const getCacheInfo = useCallback(
    (classroomCode = null) => ({
      metadata: cacheMetadata,
      lastUpdated,
      staleness: {
        list: checkStaleness("list", CACHE_CONFIG.LIST_TIMEOUT),
        detail: checkStaleness("detail", CACHE_CONFIG.DETAIL_TIMEOUT),
        teachers: checkStaleness(
          "teachers",
          CACHE_CONFIG.TEACHERS_TIMEOUT,
          classroomCode
        ),
        students: checkStaleness(
          "students",
          CACHE_CONFIG.STUDENTS_TIMEOUT,
          classroomCode
        ),
      },
    }),
    [cacheMetadata, lastUpdated, checkStaleness]
  );

  return {
    cacheMetadata,
    lastUpdated,
    checkStaleness,
    invalidateCache: invalidateCacheAction,
    invalidateAllCache,
    getCacheInfo,
  };
};

/**
 * Composite hook for complete classroom management
 * @param {string} classroomCode - ID of the classroom
 * @param {Object} options - Configuration options
 * @returns {Object} - Comprehensive classroom management utilities
 */
export const useClassroomManager = (classroomCode, options = {}) => {
  const {
    enableAutoLoad = true,
    enablePolling = false,
    pollingInterval = CACHE_CONFIG.POLLING_INTERVAL,
    cacheTimeout = CACHE_CONFIG.DETAIL_TIMEOUT,
    dataProps = null,
    enableDetailCaching = true,
    preferCache = true,
  } = options;

  // Enhanced hooks with better caching
  const listHook = useClassroomList({
    autoLoad: enableAutoLoad,
    enablePolling,
    pollingInterval,
    dataProps,
    enableDetailCaching,
  });

  const detailHook = useClassroomDetail(classroomCode, {
    cacheTimeout,
    enablePolling,
    pollingInterval,
    dataProps,
    preferCache,
    autoFetch: enableAutoLoad,
  });

  const formHook = useClassroomForm(dataProps);
  const deleteHook = useClassroomDelete();

  const teachersHook = useClassroomTeachers(classroomCode, {
    autoLoadAvailable: enableAutoLoad,
  });

  const studentsHook = useClassroomStudents(classroomCode, {
    autoLoadAvailable: enableAutoLoad,
  });

  const cacheHook = useClassroomCache();

  // Enhanced refresh strategies
  const refreshAll = useCallback(() => {
    console.log("[useClassroomManager] Refreshing all data");

    listHook.refresh();
    if (classroomCode) {
      detailHook.refreshDetail();
      teachersHook.loadAvailableTeachers("", true);
      studentsHook.loadAvailableStudents("", true);
    }
  }, [listHook, detailHook, teachersHook, studentsHook, classroomCode]);

  const smartRefreshAll = useCallback(() => {
    console.log("[useClassroomManager] Smart refreshing stale data");

    listHook.smartRefresh();
    if (classroomCode) {
      detailHook.smartRefresh();

      // Only refresh if stale
      if (teachersHook.isTeachersStale) {
        teachersHook.loadAvailableTeachers("", true);
      }
      if (studentsHook.isStudentsStale) {
        studentsHook.loadAvailableStudents("", true);
      }
    }
  }, [listHook, detailHook, teachersHook, studentsHook, classroomCode]);

  // Enhanced loading states
  const isLoading = useMemo(
    () => ({
      list: listHook.isLoading,
      detail: detailHook.isLoading,
      form: formHook.isCreating || formHook.isUpdating,
      delete: deleteHook.isDeleting,
      teachers: teachersHook.isLoading,
      students: studentsHook.isLoading,
      any:
        listHook.isLoading ||
        detailHook.isLoading ||
        formHook.isCreating ||
        formHook.isUpdating ||
        deleteHook.isDeleting ||
        teachersHook.isLoading ||
        studentsHook.isLoading,
      critical: detailHook.isLoading && !detailHook.hasSufficientData,
    }),
    [listHook, detailHook, formHook, deleteHook, teachersHook, studentsHook]
  );

  // Enhanced error states
  const errors = useMemo(
    () => ({
      list: listHook.error,
      detail: detailHook.error,
      form: formHook.error,
      validation: formHook.validationErrors,
      teachers: teachersHook.error,
      students: studentsHook.error,
      any:
        listHook.error ||
        detailHook.error ||
        formHook.error ||
        formHook.validationErrors ||
        teachersHook.error ||
        studentsHook.error,
      critical: detailHook.error && !detailHook.hasSufficientData,
    }),
    [listHook, detailHook, formHook, teachersHook, studentsHook]
  );

  // Cache insights
  const cacheInsights = useMemo(
    () => ({
      detail: {
        source: detailHook.dataSource,
        age: detailHook.cacheAge,
        isStale: detailHook.isStale,
        hasSufficientData: detailHook.hasSufficientData,
      },
      list: {
        isStale: listHook.isStale,
        hasData: listHook.hasClassrooms,
        count: listHook.classrooms?.length || 0,
      },
      teachers: {
        isStale: teachersHook.isTeachersStale,
        count: teachersHook.teachers?.length || 0,
      },
      students: {
        isStale: studentsHook.isStudentsStale,
        count: studentsHook.students?.length || 0,
      },
      overall: {
        preferCache,
        enableDetailCaching,
        cacheTimeout,
      },
    }),
    [
      detailHook,
      listHook,
      teachersHook,
      studentsHook,
      preferCache,
      enableDetailCaching,
      cacheTimeout,
    ]
  );

  return {
    // Core hooks
    list: listHook,
    detail: detailHook,
    form: formHook,
    delete: deleteHook,
    teachers: teachersHook,
    students: studentsHook,
    cache: cacheHook,

    // Enhanced states
    isLoading,
    errors,
    cacheInsights,

    // Actions
    refreshAll,
    smartRefreshAll,

    // Quick access to common data
    classroom: detailHook.currentClassroom,
    classrooms: listHook.classrooms,

    // Status checks
    hasData: detailHook.hasSufficientData || listHook.hasClassrooms,
    isReady: !isLoading.critical && detailHook.hasSufficientData,
    needsRefresh: detailHook.isStale || listHook.isStale,
  };
};

// Export selectors
export {
  selectAvailableStudents,
  selectAvailableTeachers,
  selectCacheMetadata,
  selectCanLoadMore,
  selectClassroomById,
  selectClassroomError,
  selectClassrooms,
  selectClassroomStatus,
  selectClassroomStudents,
  selectClassroomTeachers,
  selectCreateStatus,
  selectCurrentClassroom,
  selectDeleteStatus,
  selectDetailStatus,
  selectFilteredClassroomsCount,
  selectFilters,
  selectHasClassrooms,
  selectIsCreating,
  selectIsCurrentClassroom,
  selectIsDeleting,
  selectIsDetailStale,
  selectIsListStale,
  selectIsLoading,
  selectIsLoadingDetail,
  selectIsLoadingStudents,
  selectIsLoadingTeachers,
  selectIsStudentsStale,
  selectIsTeachersStale,
  selectIsUpdating,
  selectLastUpdated,
  selectPagination,
  selectSearchTerm,
  selectStudentStatus,
  selectTeacherStatus,
  selectUpdateStatus,
  selectValidationErrors,
  selectViewMode,
};
