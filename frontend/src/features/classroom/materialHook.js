import { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  clearCache,
  clearExpiredCache,
  createMaterial,
  deleteMaterial,
  downloadMaterial,
  fetchMaterials,
  incrementMaterialView,
  removeMaterialOptimistic,
  resetMaterialStatus,
  selectCacheStats,
  selectCurrentClassroomCode,
  selectIsCached,
  selectIsMaterialDeleting,
  selectIsMaterialDownloading,
  selectIsMaterialLoading,
  selectMaterialCreateStatus,
  selectMaterialDeleteStatus,
  selectMaterialDownloadStatus,
  selectMaterialError,
  selectMaterialFiles,
  selectMaterialLinks,
  selectMaterialPagination,
  selectMaterialUploadedFiles,
  selectMaterialsByClassroom,
  selectMaterialStatus,
  selectMaterialUpdateStatus,
  selectMaterialValidationErrors,
  setCurrentClassroom,
  syncMaterialAcrossCache,
  updateMaterial,
  // updateMaterialOptimistic,
  viewExternalLink as viewExternalLinkThunk,
} from "./materialSlice";

/**
 * Hook for material detail with cache management and multiple files support
 * @param {string} classroomCode - ID of the classroom
 * @param {string} materialId - ID of the material
 * @param {Object} options - Configuration options
 * @returns {Object} - Material detail management utilities
 */

// Cache configuration
const MATERIAL_CACHE_CONFIG = {
  DETAIL_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  VIEW_INCREMENT_DELAY: 2000, // 2 seconds delay for view count
  FETCH_COOLDOWN: 3000, // 3 seconds between fetches
  MAX_FETCH_ATTEMPTS: 3,
};

/**
 * Optimized hook for material detail with intelligent caching and fetch management
 */

export const useMaterialDetail = (classroomCode, materialId, options = {}) => {
  const {
    autoLoad = true,
    // enablePolling = false,
    // pollingInterval = 30000,
    cacheTimeout = MATERIAL_CACHE_CONFIG.DETAIL_TIMEOUT,
  } = options;

  const dispatch = useDispatch();

  // State tracking refs for optimization
  const stateRef = useRef({
    lastFetchTime: null,
    fetchAttempts: 0,
    viewIncremented: false,
    currentMaterialId: null,
    fetchPromise: null,
    lastError: null,
    isInitialized: false,
    lastUpdateTime: null, // NEW: Track last update time
    autoRefreshTimer: null, // NEW: Timer for auto refresh
  });

  // Abort controller for cancellable requests
  const abortControllerRef = useRef(null);

  // Selectors with memoization
  const materials = useSelector((state) =>
    selectMaterialsByClassroom(state, classroomCode)
  );
  const materialFiles = useSelector((state) =>
    selectMaterialFiles(state, classroomCode, materialId)
  );
  const materialLinks = useSelector((state) =>
    selectMaterialLinks(state, classroomCode, materialId)
  );
  const materialUploadedFiles = useSelector((state) =>
    selectMaterialUploadedFiles(state, classroomCode, materialId)
  );
  const isLoading = useSelector(selectIsMaterialLoading);
  const isDeleting = useSelector(selectIsMaterialDeleting);
  const isDownloading = useSelector(selectIsMaterialDownloading);
  const error = useSelector(selectMaterialError);

  // Check cache status
  const isCached = useSelector((state) =>
    selectIsCached(state, classroomCode, { materialId })
  );

  // Memoized material lookup with enhanced file counting
  const material = useMemo(() => {
    if (!materials || !materialId) return null;

    const found = materials.find(
      (m) => m.id === materialId || String(m.id) === String(materialId)
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
        hasFiles: materialFiles.length > 0,
        hasLinks: materialLinks.length > 0,
        hasUploadedFiles: materialUploadedFiles.length > 0,
        totalFiles: materialFiles.length,
        totalDownloads: materialFiles.reduce(
          (sum, file) => sum + (file.download_count || 0),
          0
        ),
        totalViews: materialFiles.reduce(
          (sum, file) => sum + (file.view_count || 0),
          0
        ),
      };
    }

    return null;
  }, [
    materials,
    materialId,
    materialFiles,
    materialLinks,
    materialUploadedFiles,
  ]);

  // Reset state when material changes
  useEffect(() => {
    if (stateRef.current.currentMaterialId !== materialId) {
      // Clear any existing auto refresh timer
      if (stateRef.current.autoRefreshTimer) {
        clearTimeout(stateRef.current.autoRefreshTimer);
      }

      stateRef.current = {
        lastFetchTime: null,
        fetchAttempts: 0,
        viewIncremented: false,
        currentMaterialId: materialId,
        fetchPromise: null,
        lastError: null,
        isInitialized: false,
        lastUpdateTime: null,
        autoRefreshTimer: null,
      };
    }
  }, [materialId]);

  // Optimized fetch check
  const shouldFetch = useCallback(() => {
    if (!classroomCode || !materialId) {
      return { should: false, reason: "missing-params" };
    }

    if (material && !isStale(material.updated_at, cacheTimeout)) {
      return { should: false, reason: "fresh-cache" };
    }

    if (isLoading || stateRef.current.fetchPromise) {
      return { should: false, reason: "already-loading" };
    }

    // Check cooldown
    if (stateRef.current.lastFetchTime) {
      const elapsed = Date.now() - stateRef.current.lastFetchTime;
      if (elapsed < MATERIAL_CACHE_CONFIG.FETCH_COOLDOWN) {
        return {
          should: false,
          reason: "cooldown",
          remaining: MATERIAL_CACHE_CONFIG.FETCH_COOLDOWN - elapsed,
        };
      }
    }

    // Check max attempts
    if (
      stateRef.current.fetchAttempts >= MATERIAL_CACHE_CONFIG.MAX_FETCH_ATTEMPTS
    ) {
      const resetAfter = 60000; // 1 minute
      const elapsed = Date.now() - stateRef.current.lastFetchTime;
      if (elapsed < resetAfter) {
        return { should: false, reason: "max-attempts" };
      }
      stateRef.current.fetchAttempts = 0;
    }

    return { should: true, reason: "fetch-needed" };
  }, [classroomCode, materialId, material, isLoading, cacheTimeout]);

  // Enhanced fetch function with force refresh capability
  const fetchMaterialDetail = useCallback(
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
          fetchMaterials({
            classroomCode,
            params: {
              material_id: materialId,
              include: "uploader,classroom,files",
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

        // CRITICAL FIX: Sync updated data across all cache entries
        if (result && result.data && Array.isArray(result.data)) {
          const updatedMaterial = result.data.find(
            (m) => String(m.id) === String(materialId)
          );

          if (updatedMaterial) {
            dispatch(
              syncMaterialAcrossCache({
                classroomCode,
                materialId,
                updatedMaterial,
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
          err?.code === "ERR_CANCELED" ||
          err?.name === "CanceledError" ||
          err?.message === "canceled" ||
          err?.cancelled
        ) {
          return { success: false, cancelled: true };
        }

        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, materialId, shouldFetch]
  );

  // NEW: Auto-refresh after update
  // const scheduleAutoRefresh = useCallback(() => {
  //   if (!autoRefreshAfterUpdate) return;

  //   // Clear existing timer
  //   if (stateRef.current.autoRefreshTimer) {
  //     clearTimeout(stateRef.current.autoRefreshTimer);
  //   }

  //   // Schedule new refresh
  //   stateRef.current.autoRefreshTimer = setTimeout(() => {
  //     console.log("[useMaterialDetail] Auto refreshing after update...");
  //     fetchMaterialDetail(true);
  //   }, MATERIAL_CACHE_CONFIG.AUTO_REFRESH_INTERVAL);
  // }, [autoRefreshAfterUpdate, fetchMaterialDetail]);

  // Enhanced update handler with automatic cache refresh
  // Di useMaterialDetail hook
  const handleUpdate = useCallback(
    async (updates, options = {}) => {
      const { optimistic = true, syncCache = true } = options;

      try {
        let optimisticMaterial = null;

        // Create optimistic update
        if (optimistic && material) {
          optimisticMaterial = {
            ...material,
            ...updates,
            updated_at: new Date().toISOString(),
          };

          // Process file_urls and links for optimistic update
          if (updates.files || updates.remove_file_ids) {
            // Keep existing files except removed ones
            const remainingFiles =
              material.file_urls?.filter(
                (file) => !updates.remove_file_ids?.includes(file.id)
              ) || [];

            optimisticMaterial.file_urls = remainingFiles;
          }

          if (updates.links) {
            // Convert links to proper format
            optimisticMaterial.links = updates.links.map((link, index) => ({
              id: `temp_${index}`,
              url: typeof link === "string" ? link : link.url,
              view_count: 0,
              download_count: 0,
            }));
          }

          // Sync to all cache entries immediately
          if (syncCache) {
            dispatch(
              syncMaterialAcrossCache({
                classroomCode,
                materialId,
                updatedMaterial: optimisticMaterial,
                source: "optimistic_update",
              })
            );
          }
        }

        // Perform actual update
        const result = await dispatch(
          updateMaterial({
            classroomCode,
            materialId,
            materialData: updates,
          })
        ).unwrap();

        // Update cache with server response
        if (result.data && syncCache) {
          dispatch(
            syncMaterialAcrossCache({
              classroomCode,
              materialId,
              updatedMaterial: result.data,
              source: "server_update",
            })
          );
        }

        stateRef.current.lastUpdateTime = Date.now();

        toast.success("Materi berhasil diperbarui");
        return { success: true, data: result.data || optimisticMaterial };
      } catch (err) {
        // On error, refresh from server if online
        if (optimistic && navigator.onLine) {
          fetchMaterialDetail(true);
        }

        toast.error(err.message || "Gagal memperbarui materi");
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, materialId, material, fetchMaterialDetail]
  );

  // Smart refresh with immediate cache invalidation
  const refreshDetail = useCallback(async () => {
    // Clear expired cache first
    dispatch(clearExpiredCache());

    // Force refresh from server
    return fetchMaterialDetail(true);
  }, [dispatch, fetchMaterialDetail]);

  // Auto-fetch on mount with optimization
  useEffect(() => {
    if (autoLoad && !stateRef.current.isInitialized) {
      const check = shouldFetch();
      if (check.should || !material) {
        fetchMaterialDetail();
      } else {
        stateRef.current.isInitialized = true;
      }
    }
  }, [autoLoad, shouldFetch, material, fetchMaterialDetail]);

  // Increment view count with debouncing
  useEffect(() => {
    if (
      material &&
      !stateRef.current.viewIncremented &&
      material.id === materialId
    ) {
      const timer = setTimeout(() => {
        materialFiles.forEach((file) => {
          dispatch(
            incrementMaterialView({
              classroomCode,
              fileId: file.id,
            })
          );
        });
        stateRef.current.viewIncremented = true;
      }, MATERIAL_CACHE_CONFIG.VIEW_INCREMENT_DELAY);

      return () => clearTimeout(timer);
    }
  }, [material, materialId, materialFiles, classroomCode, dispatch]);

  // Enhanced delete handler
  const handleDelete = useCallback(
    async (confirmMessage) => {
      if (confirmMessage && !window.confirm(confirmMessage)) {
        return { success: false, cancelled: true };
      }

      try {
        const result = await dispatch(
          deleteMaterial({
            classroomCode,
            materialId,
          })
        ).unwrap();

        toast.success("Materi berhasil dihapus");
        return { success: true, data: result };
      } catch (err) {
        toast.error(err.message || "Gagal menghapus materi");
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, materialId]
  );

  // Enhanced download handler for multiple files
  const handleDownloadFile = useCallback(
    async (fileId, fileName, fileData) => {
      const file =
        fileData || materialFiles.find((f) => String(f.id) === String(fileId));

      if (!file) {
        toast.error("File tidak ditemukan");
        return { success: false, error: "File not found" };
      }

      try {
        const result = await dispatch(
          downloadMaterial({
            classroomCode,
            fileId,
            downloadUrl: file.download_url, // Pass the hashed download URL
          })
        ).unwrap();

        toast.success(
          `File ${file.file_name || "berhasil diunduh"}`
        );
        return { success: true, data: result };
      } catch (err) {
        toast.error(err.message || "Gagal mengunduh file");
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, materialFiles]
  );

  // View external link with file ID support
  // const viewExternalLink = useCallback(
  //   async (fileId) => {
  //     try {
  //       await dispatch(
  //         viewExternalLinkThunk({ classroomCode, fileId })
  //       ).unwrap();
  //       return { success: true };
  //     } catch (err) {
  //       if (err.name !== "AbortError" && !err.cancelled) {
  //         toast.error(err.message || "Gagal membuka link");
  //       }
  //       return { success: false, error: err };
  //     }
  //   },
  //   [dispatch, classroomCode]
  // );

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
      link.download = fileName || "download";

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
  const clearMaterialCache = useCallback(() => {
    dispatch(clearCache(classroomCode));
  }, [dispatch, classroomCode]);

  // Computed properties
  const isCacheStale = useMemo(() => {
    if (!material?.updated_at) return true;
    return isStale(material.updated_at, cacheTimeout);
  }, [material, cacheTimeout]);

  const hasCachedData = useMemo(() => {
    return !!material && isCached;
  }, [material, isCached]);

  const canDelete = useMemo(() => {
    return material?.can_delete || false;
  }, [material]);

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
    material,
    materials,
    materialFiles,
    materialLinks,
    materialUploadedFiles,

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
    fetchMaterialDetail,
    refreshDetail,
    handleDelete,
    handleDownloadFile,
    handleUpdate,
    clearMaterialCache,
    downloadFileDirectly,
    handleViewExternal,

    // Metadata
    fetchAttempts: stateRef.current.fetchAttempts,
    maxFetchAttempts: MATERIAL_CACHE_CONFIG.MAX_FETCH_ATTEMPTS,
    lastUpdateTime: stateRef.current.lastUpdateTime,
  };
};

// Utility function to check staleness
function isStale(timestamp, timeout) {
  if (!timestamp) return true;
  const age = Date.now() - new Date(timestamp).getTime();
  return age > timeout;
}

// Re-export the original hook for list management with enhanced file support

const useMaterials = (classroomCode) => {
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
  const materials = useSelector((state) =>
    selectMaterialsByClassroom(state, classroomCode)
  );
  const pagination = useSelector((state) =>
    selectMaterialPagination(state, classroomCode)
  );

  const status = useSelector(selectMaterialStatus);
  const createStatus = useSelector(selectMaterialCreateStatus);
  const updateStatus = useSelector(selectMaterialUpdateStatus);
  const deleteStatus = useSelector(selectMaterialDeleteStatus);
  const downloadStatus = useSelector(selectMaterialDownloadStatus);
  const error = useSelector(selectMaterialError);
  const validationErrors = useSelector(selectMaterialValidationErrors);
  const currentClassroomCode = useSelector(selectCurrentClassroomCode);
  const cacheStats = useSelector(selectCacheStats);

  // Check if current params are cached
  const isCached = useSelector((state) =>
    selectIsCached(state, classroomCode, filtersRef.current)
  );

  // Enhanced fetch function with smart caching
  const fetchMaterialsData = useCallback(
    (params = {}, options = {}) => {
      if (!classroomCode) return;

      const { forceRefresh = false, silent = false } = options;

      // Merge with current filters
      const mergedParams = { ...filtersRef.current, ...params };
      filtersRef.current = mergedParams;

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
        dispatch(resetMaterialStatus());
      }

      dispatch(
        fetchMaterials({
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
      fetchMaterialsData(updatedFilters, { forceRefresh });
    },
    [fetchMaterialsData]
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

    fetchMaterialsData(defaultFilters, { forceRefresh: true });
  }, [fetchMaterialsData, dispatch, classroomCode]);

  // Enhanced add material with multiple file support and optimistic updates
  const addMaterial = useCallback(
    async (materialData) => {
      try {
        // Validate multiple files if present
        if (materialData.files) {
          const files = Array.isArray(materialData.files)
            ? materialData.files
            : materialData.files instanceof FileList
            ? Array.from(materialData.files)
            : [materialData.files];

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
        if (materialData.links) {
          const links = Array.isArray(materialData.links)
            ? materialData.links
            : [materialData.links];

          for (const link of links) {
            if (link && !isValidUrl(link)) {
              throw new Error(`Link tidak valid: ${link}`);
            }
          }
        }

        const result = await dispatch(
          createMaterial({ classroomCode, materialData })
        ).unwrap();

        toast.success("Materi berhasil ditambahkan");

        return { success: true, data: result.data };
      } catch (err) {
        if (err.name !== "AbortError" && !err.cancelled) {
          toast.error(err.message || "Gagal menambahkan materi");
        }
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode]
  );

  // Enhanced edit material with multiple file support and optimistic updates
  const editMaterial = useCallback(
    async (materialId, materialData) => {
      try {
        // Validate multiple files if present
        if (materialData.files) {
          const files = Array.isArray(materialData.files)
            ? materialData.files
            : materialData.files instanceof FileList
            ? Array.from(materialData.files)
            : [materialData.files];

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
        if (materialData.links) {
          const links = Array.isArray(materialData.links)
            ? materialData.links
            : [materialData.links];

          for (const link of links) {
            if (link && !isValidUrl(link)) {
              throw new Error(`Link tidak valid: ${link}`);
            }
          }
        }

        // Optimistic update for better UX
        const currentMaterial = materials.find(
          (m) => String(m.id) === String(materialId)
        );
        const optimisticUpdatedMaterial = {
          ...currentMaterial,
          ...materialData,
          id: materialId,
          updated_at: new Date().toISOString(),
        };

        // Apply optimistic update to ALL cache entries
        dispatch(
          syncMaterialAcrossCache({
            classroomCode,
            materialId,
            updatedMaterial: optimisticUpdatedMaterial,
            source: "optimistic",
          })
        );

        const result = await dispatch(
          updateMaterial({ classroomCode, materialId, materialData })
        ).unwrap();

        toast.success("Materi berhasil diupdate");
        return { success: true, data: result.data };
      } catch (err) {
        // Revert optimistic update by refreshing from server
        // But only if we have internet connection
        if (navigator.onLine) {
          fetchMaterialsData(filtersRef.current, {
            forceRefresh: true,
            silent: true,
          });
        }

        if (err.name !== "AbortError" && !err.cancelled) {
          toast.error(err.message || "Gagal mengupdate materi");
        }
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, materials, fetchMaterialsData]
  );

  // Enhanced remove material with optimistic updates
  const removeMaterial = useCallback(
    async (materialId) => {
      try {
        // Optimistic update for immediate feedback
        dispatch(removeMaterialOptimistic({ classroomCode, materialId }));

        await dispatch(deleteMaterial({ classroomCode, materialId })).unwrap();

        toast.success("Materi berhasil dihapus");

        return { success: true };
      } catch (err) {
        // Revert optimistic update on error
        fetchMaterialsData(filtersRef.current, {
          forceRefresh: true,
          silent: true,
        });

        if (err.name !== "AbortError" && !err.cancelled) {
          toast.error(err.message || "Gagal menghapus materi");
        }
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, fetchMaterialsData]
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
      link.download = fileName || "download";

      // Trigger download
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
          downloadMaterial({ classroomCode, fileId })
        ).unwrap();

        // toast.success(`File ${fileName || "berhasil diunduh"}`);
        return { success: true, data: result.data };
      } catch (err) {
        console.error("API download failed:", err);

        // Cari file info dari materials
        const material = materials.find((m) =>
          m.file_urls?.some((f) => String(f.id) === String(fileId))
        );

        if (material) {
          const file = material.file_urls.find(
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
    [dispatch, classroomCode, materials]
  );

  // Enhanced increment view with file ID support
  const incrementView = useCallback(
    async (fileId) => {
      try {
        await dispatch(
          incrementMaterialView({ classroomCode, fileId })
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

  // Get material statistics

  // Enhanced page change handler
  const handlePageChange = useCallback(
    (page) => {
      setFilters({ page });
    },
    [setFilters]
  );

  // Cache management functions
  const refreshCache = useCallback(() => {
    fetchMaterialsData(filtersRef.current, { forceRefresh: true });
  }, [fetchMaterialsData]);

  const clearClassroomCache = useCallback(() => {
    dispatch(clearCache(classroomCode));
    fetchMaterialsData(filtersRef.current, { forceRefresh: true });
  }, [dispatch, classroomCode, fetchMaterialsData]);

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
    dispatch(resetMaterialStatus());

    // Fetch materials - will use cache if available and not expired
    fetchMaterialsData(defaultFilters);

    // Also fetch statistics

    // Cleanup on unmount or classroom change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      isFetchingRef.current = false;
    };
  }, [classroomCode, dispatch, fetchMaterialsData, currentClassroomCode]);

  // Auto-refresh expired cache on focus
  useEffect(() => {
    const handleFocus = () => {
      if (classroomCode && !isCached) {
        fetchMaterialsData(filtersRef.current, {
          forceRefresh: true,
          silent: true,
        });
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [classroomCode, isCached, fetchMaterialsData]);

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
    // Data
    materials,
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
    fetchMaterialsData,
    setFilters,
    clearFilters,
    addMaterial,
    editMaterial,
    removeMaterial,
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

// Combined hook for both list and detail management
export const useMaterialManager = (
  classroomCode,
  materialId = null,
  options = {}
) => {
  const listHook = useMaterials(classroomCode);
  const detailHook = useMaterialDetail(classroomCode, materialId, options);

  return {
    list: listHook,
    detail: detailHook,
    // Combined loading state
    isLoading: listHook.status === "loading" || detailHook?.isLoading,
    // Combined error state
    error: listHook.error || detailHook?.error,
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

export default useMaterials;
