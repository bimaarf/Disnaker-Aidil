import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  useClassroomForm,
  useClassroomDetail,
} from "../../../../features/classroom/classroomHook";
import { toast } from "react-toastify";
import ReactQuill from "react-quill";

// Custom CSS untuk ReactQuill theme integration

export const ClassRoomUpdatePage = () => {
  const navigate = useNavigate();
  const { code } = useParams();
  const location = useLocation();
  const itemCode = useMemo(() => code || null, [code]);

  const { handleOptimisticUpdate, isUpdating, error, validationErrors } =
    useClassroomForm();

  // Refs to prevent unnecessary operations - matching ClassroomDetailPage
  const initialLoadAttemptedRef = useRef(false);
  const retryTimeoutRef = useRef(null);
  // const quillRef = useRef(null);

  // State for managing error and retry logic - matching ClassroomDetailPage
  const [retryCount, setRetryCount] = useState(0);
  const [showRetry, setShowRetry] = useState(false);
  const [manualRefreshTriggered, setManualRefreshTriggered] = useState(false);

  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  // Parse initial data props - EXACT same logic as ClassroomDetailPage
  const initialDataProps = useMemo(() => {
    try {
      const dataProps = location?.state?.dataProps;
      if (!dataProps || typeof dataProps !== "object" || !dataProps.id) {
        return null;
      }
      return {
        id: dataProps.id,
        name: dataProps.name || "",
        code: dataProps.code || "",
        description: dataProps.description || "",
        status: dataProps.status || "active",
        teachers: dataProps.teachers || [],
        students: dataProps.students || [],
        teacher_count:
          dataProps.teachers?.length || dataProps.teacher_count || 0,
        student_count:
          dataProps.students?.length || dataProps.student_count || 0,
      };
    } catch (error) {
      console.warn("[ClassRoomUpdatePage] Error parsing dataProps:", error);
      return null;
    }
  }, [location?.state?.dataProps]);

  // Validate that code matches dataProps - EXACT same logic as ClassroomDetailPage
  const classroomOnlyProps = useMemo(() => {
    const isValid =
      initialDataProps && itemCode && initialDataProps.code === itemCode;
    return isValid ? initialDataProps : null;
  }, [initialDataProps, itemCode]);

  // Use useClassroomDetail with SAME configuration as ClassroomDetailPage
  const {
    currentClassroom,
    isLoading,
    error: detailError,
    smartRefresh,
    refreshDetail,
    isStale: isDetailStale,
    isFetching,
    isNotFound,
    canRetry,
    debugInfo,
  } = useClassroomDetail(itemCode, {
    dataProps: classroomOnlyProps,
    autoLoad: true, // Changed to true for better initial loading
    enablePolling: false,
    cacheTimeout: 5 * 60 * 1000,
  });

  // Initialize form data with proper fallbacks - enhanced with cache data
  const [description, setDescription] = useState("");
  const [formData, setFormData] = useState(() => {
    // Prioritize classroomOnlyProps, then defaults
    const sourceData = classroomOnlyProps || {};
    return {
      name: sourceData.name || "",
      code: sourceData.code || itemCode || "",
      description: sourceData.description || "",
      status: sourceData.status || "active",
    };
  });

  // Track if form has been initialized from API data
  const [formInitialized, setFormInitialized] = useState(!!classroomOnlyProps);

  // ReactQuill configuration
  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "code-block"],
          ["link", "image"],
          ["clean"],
        ],
      },
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  const quillFormats = useMemo(
    () => [
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "list",
      "bullet",
      "blockquote",
      "code-block",
      "link",
    ],
    []
  );

  // Determine display data - same logic as ClassroomDetailPage
  const displayClassroom = useMemo(() => {
    try {
      const baseClassroom = classroomOnlyProps || currentClassroom;
      if (!baseClassroom) {
        console.log("[ClassRoomUpdatePage] No baseClassroom available", {
          classroomOnlyProps,
          currentClassroom,
          isNotFound,
          error: detailError?.message,
        });
        return null;
      }
      return {
        id: baseClassroom.id || itemCode,
        name: baseClassroom.name || "Unnamed Classroom",
        code: baseClassroom.code || "No Code",
        description: baseClassroom.description || "",
        status: baseClassroom.status || "active",
        teacher_count: baseClassroom.teacher_count || 0,
        student_count: baseClassroom.student_count || 0,
        teachers: baseClassroom.teachers || [],
        students: baseClassroom.students || [],
        _source: classroomOnlyProps ? "props" : "api",
        _cacheStatus: isDetailStale ? "stale" : "fresh",
      };
    } catch (error) {
      console.error(
        "[ClassRoomUpdatePage] Error computing displayClassroom:",
        error
      );
      return null;
    }
  }, [
    classroomOnlyProps,
    currentClassroom,
    itemCode,
    isDetailStale,
    isNotFound,
    detailError,
  ]);

  // Enhanced error checking - same logic as ClassroomDetailPage
  const shouldShowError = useMemo(() => {
    // Don't show error while loading initially
    if (isLoading && !initialLoadAttemptedRef.current) {
      return false;
    }

    // Show error if classroom not found
    if (isNotFound) {
      return true;
    }

    // Show error if there's an actual error and we're not loading
    if ((detailError || error) && !isLoading && !displayClassroom) {
      return true;
    }

    // Show error if we've attempted to load but have no data and can't retry
    if (
      initialLoadAttemptedRef.current &&
      !displayClassroom &&
      !isLoading &&
      !canRetry
    ) {
      return true;
    }

    return false;
  }, [isLoading, isNotFound, detailError, error, displayClassroom, canRetry]);

  // Enhanced loading check - same logic as ClassroomDetailPage
  const shouldShowLoading = useMemo(() => {
    // Show loading if we're loading and don't have display data
    return (isLoading || isFetching) && !displayClassroom && !shouldShowError;
  }, [isLoading, isFetching, displayClassroom, shouldShowError]);

  // Auto-retry logic for failed loads - same as ClassroomDetailPage
  useEffect(() => {
    if (
      itemCode &&
      !isLoading &&
      !displayClassroom &&
      !isNotFound &&
      canRetry &&
      retryCount < MAX_RETRY_ATTEMPTS &&
      !manualRefreshTriggered
    ) {
      console.log(
        `[ClassRoomUpdatePage] Auto-retry ${
          retryCount + 1
        }/${MAX_RETRY_ATTEMPTS}`
      );

      setRetryCount((prev) => prev + 1);

      retryTimeoutRef.current = setTimeout(() => {
        smartRefresh();
      }, RETRY_DELAY * (retryCount + 1)); // Exponential backoff

      return () => {
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
      };
    }

    // Show retry button after max attempts
    if (retryCount >= MAX_RETRY_ATTEMPTS && !displayClassroom && !isNotFound) {
      setShowRetry(true);
    }
  }, [
    itemCode,
    isLoading,
    displayClassroom,
    isNotFound,
    canRetry,
    retryCount,
    smartRefresh,
    manualRefreshTriggered,
  ]);

  // Track initial load attempt - same as ClassroomDetailPage
  useEffect(() => {
    if (itemCode && (isLoading || displayClassroom || detailError)) {
      initialLoadAttemptedRef.current = true;
    }
  }, [itemCode, isLoading, displayClassroom, detailError]);

  // Update form data when displayClassroom changes - only once and only if not from props
  useEffect(() => {
    if (
      displayClassroom &&
      !formInitialized &&
      displayClassroom._source === "api" &&
      !classroomOnlyProps
    ) {
      console.log("[ClassRoomUpdatePage] Initializing form with API data");
      const newFormData = {
        name: displayClassroom.name || "",
        code: displayClassroom.code || itemCode || "",
        description: displayClassroom.description || "",
        status: displayClassroom.status || "active",
      };

      setFormData(newFormData);
      setDescription(displayClassroom.description || "");
      setFormInitialized(true);
    }
  }, [displayClassroom, formInitialized, classroomOnlyProps, itemCode]);

  // Initialize description from classroomOnlyProps
  useEffect(() => {
    if (classroomOnlyProps && !description) {
      setDescription(classroomOnlyProps.description || "");
    }
  }, [classroomOnlyProps, description]);

  // Manual refresh handler - same as ClassroomDetailPage
  const handleManualRetry = useCallback(() => {
    setRetryCount(0);
    setShowRetry(false);
    setManualRefreshTriggered(true);

    refreshDetail().finally(() => {
      setManualRefreshTriggered(false);
    });
  }, [refreshDetail]);

  // Enhanced refresh handler
  const handleRefreshAll = useCallback(() => {
    try {
      setManualRefreshTriggered(true);
      setRetryCount(0);
      setShowRetry(false);

      console.log("[ClassRoomUpdatePage] Manual refresh triggered");

      // Force refresh detail
      refreshDetail().finally(() => {
        setManualRefreshTriggered(false);
      });
    } catch (error) {
      console.error("[ClassRoomUpdatePage] Error refreshing:", error);
      toast.error("Gagal menyegarkan data");
      setManualRefreshTriggered(false);
    }
  }, [refreshDetail]);

  // Cleanup on unmount - same as ClassroomDetailPage
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Debug logging - only in development - same as ClassroomDetailPage
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[ClassRoomUpdatePage] Debug info:", {
        classroom: displayClassroom
          ? {
              id: displayClassroom.id,
              name: displayClassroom.name,
              source: displayClassroom._source,
              cacheStatus: displayClassroom._cacheStatus,
            }
          : null,
        formData: formData,
        description: description,
        formInitialized,
        state: {
          isLoading,
          isNotFound,
          error: (detailError || error)?.message,
          retryCount,
          showRetry,
          canRetry,
        },
        debug: debugInfo,
      });
    }
  }, [
    displayClassroom?.id,
    displayClassroom?.name,
    displayClassroom?._source,
    formData,
    description,
    formInitialized,
    isLoading,
    isNotFound,
    detailError,
    error,
    retryCount,
    showRetry,
    canRetry,
    debugInfo,
  ]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleDescriptionChange = useCallback((content) => {
    setDescription(content);
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!itemCode) {
        toast.error("Kode kelas tidak valid");
        return;
      }

      // Clean up description - remove empty paragraphs and trim
      const cleanDescription = description
        ? description.replace(/<p><br><\/p>/g, "").trim()
        : "";

      const submitData = {
        ...formData,
        description: cleanDescription || null,
      };

      // Remove empty code to let server handle it
      if (!submitData.code || submitData.code.trim() === "") {
        delete submitData.code;
      }

      console.log(
        "[ClassRoomUpdatePage] Submitting update for:",
        itemCode,
        submitData
      );

      try {
        // Use optimistic update to avoid refetching
        const result = await handleOptimisticUpdate(itemCode, submitData, {
          successMessage: "Kelas berhasil diperbarui!",
          refreshDetail: false,
        });

        if (result.success) {
          navigate("/classrooms");
        }
      } catch (err) {
        console.error("[ClassRoomUpdatePage] Update failed:", err);
        toast.error("Gagal memperbarui kelas");
      }
    },
    [itemCode, formData, description, handleOptimisticUpdate, navigate]
  );

  // Early returns with better error handling - same as ClassroomDetailPage

  // Invalid classroom code
  if (!itemCode) {
    return (
      <div className="min-h-[90vh]">
        <div className="p-6 sm:p-8 bg-error/10 border border-error/20 rounded-2xl text-center max-w-md w-full">
          <div className="w-16 h-16 mx-auto mb-4 bg-error/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-error"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-error mb-2">
            Kode Kelas Tidak Valid
          </h2>
          <p className="text-sm text-error/80 mb-6">
            Kode kelas yang Anda akses tidak valid atau tidak tersedia.
          </p>
          <Link
            to="/classrooms"
            className="inline-block px-6 py-3 bg-base-100 dark:bg-base-300 border border-base-300 text-base-content/80 rounded-xl hover:bg-base-200/50 transition-colors duration-200">
            Kembali ke Daftar Kelas
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (shouldShowLoading) {
    return (
      <div className="min-h-[90vh] bg-base-200/50 flex justify-center items-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-lg font-semibold text-base-content mb-2">
            Memuat Data Kelas...
          </h2>
          <p className="text-base-content/60 mb-4">
            Sedang mengambil informasi kelas {itemCode}
          </p>
          {retryCount > 0 && (
            <p className="text-sm text-warning">
              Percobaan ke-{retryCount} dari {MAX_RETRY_ATTEMPTS}
            </p>
          )}
          <Link
            to="/classrooms"
            className="mt-4 px-4 py-2 text-base-content/60 hover:text-base-content transition-colors duration-200">
            Batal
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  if (shouldShowError) {
    const errorDescription = isNotFound
      ? "Kelas yang Anda cari mungkin telah dihapus atau kode yang digunakan tidak valid."
      : "Terjadi kesalahan saat memuat data kelas. Silakan coba lagi atau hubungi administrator.";

    return (
      <div className="min-h-[90vh] bg-base-200/50 flex justify-center items-center px-4">
        <div className="p-6 sm:p-8 bg-error/10 border border-error/20 rounded-2xl text-center max-w-lg w-full">
          <div className="w-16 h-16 mx-auto mb-4 bg-error/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-error"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-error mb-2">
            {isNotFound ? "Kelas Tidak Ditemukan" : "Gagal Memuat Kelas"}
          </h2>
          <p className="text-sm text-error/80 mb-6">{errorDescription}</p>
          {process.env.NODE_ENV === "development" && (
            <details className="mb-4 text-left">
              <summary className="text-xs text-error/60 cursor-pointer">
                Debug Info
              </summary>
              <pre className="mt-2 text-xs text-error/60 bg-error/5 p-2 rounded overflow-auto">
                {JSON.stringify(
                  {
                    itemCode,
                    isNotFound,
                    error: (detailError || error)?.message,
                    canRetry,
                    retryCount,
                  },
                  null,
                  2
                )}
              </pre>
            </details>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {showRetry && canRetry && (
              <button
                onClick={handleManualRetry}
                disabled={isLoading}
                className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/80 transition-colors duration-200 disabled:opacity-50">
                {isLoading ? "Mencoba..." : "Coba Lagi"}
              </button>
            )}
            <button
              onClick={handleRefreshAll}
              disabled={isLoading}
              className="px-6 py-3 bg-warning/20 text-warning rounded-xl hover:bg-warning/30 transition-colors duration-200 disabled:opacity-50">
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
            <Link
              to="/classrooms"
              className="px-6 py-3 bg-base-100 dark:bg-base-300 border border-base-300 text-base-content/80 rounded-xl hover:bg-base-200/50 transition-colors duration-200">
              Kembali ke Daftar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main render - only if we have valid classroom data
  if (!displayClassroom) {
    return (
      <div className="min-h-[90vh] bg-base-200/50 flex justify-center items-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-warning border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-lg font-semibold text-base-content mb-2">
            Memproses Data...
          </h2>
          <p className="text-base-content/60">
            Sedang memproses informasi kelas
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 bg-base-100 dark:bg-base-200 p-4 sm:p-6 rounded-2xl shadow-sm border border-base-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-base-content break-words">
                Edit Kelas: {displayClassroom.name}
              </h1>
              <p className="mt-1 text-sm text-base-content/60 break-words">
                Kode: {displayClassroom.code}
              </p>
              <p className="mt-1 text-sm text-base-content/40">
                Perbarui detail kelas untuk mengelola guru dan siswa.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      displayClassroom._cacheStatus === "stale"
                        ? "bg-warning animate-pulse"
                        : "bg-success"
                    }`}></div>
                  <span
                    className={
                      displayClassroom._cacheStatus === "stale"
                        ? "text-warning"
                        : "text-success"
                    }>
                    Cache:{" "}
                    {displayClassroom._cacheStatus === "stale"
                      ? "Updating"
                      : "Fresh"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span
                    className={
                      displayClassroom._source === "props"
                        ? "text-success"
                        : "text-info"
                    }>
                    {displayClassroom._source === "props"
                      ? "Data dari cache (optimized)"
                      : "Data dari server"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
              <button
                onClick={handleRefreshAll}
                disabled={isLoading}
                className="px-4 py-2 bg-base-100 dark:bg-base-300 border border-base-300 text-base-content/80 rounded-xl hover:bg-base-200/50 transition-colors duration-200 disabled:opacity-50 text-sm">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Loading...
                  </span>
                ) : (
                  "Refresh"
                )}
              </button>
              <Link
                to={`/classrooms/${itemCode}`}
                state={{ dataProps: displayClassroom }}
                className="px-4 py-2 bg-base-100 dark:bg-base-300 border border-base-300 text-base-content/80 rounded-xl hover:bg-base-200/50 transition-colors duration-200 text-sm">
                Kembali ke Detail
              </Link>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-base-100 dark:bg-base-200 rounded-2xl shadow-sm border border-base-200 p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-base-content/80 mb-2">
                Nama Kelas *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                  validationErrors?.name ? "border-error" : "border-base-300"
                }`}
                placeholder="Masukkan nama kelas"
                required
              />
              {validationErrors?.name && (
                <p className="mt-2 text-sm text-error">
                  {validationErrors.name[0]}
                </p>
              )}
            </div>

            {/* Code Field */}
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-semibold text-base-content/80 mb-2">
                Kode Kelas (Opsional)
              </label>
              <input
                type="text"
                name="code"
                id="code"
                value={formData.code}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                  validationErrors?.code ? "border-error" : "border-base-300"
                }`}
                placeholder="Masukkan kode kelas atau biarkan kosong"
              />
              {validationErrors?.code && (
                <p className="mt-2 text-sm text-error">
                  {validationErrors.code[0]}
                </p>
              )}
              <p className="mt-1 text-xs text-base-content/50 break-words">
                Kode saat ini: {itemCode}. Jika diubah, URL akan tetap
                menggunakan kode lama.
              </p>
            </div>

            {/* Description Field */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-base-content/80 mb-2">
                Deskripsi
              </label>
              <div
                className={`custom-quill ${
                  validationErrors?.description ? "error" : ""
                }`}>
                <ReactQuill
                  className="quill-content"
                  value={description}
                  onChange={handleDescriptionChange}
                  theme="snow"
                  placeholder="Tulis deskripsi kelas..."
                  modules={quillModules}
                  formats={quillFormats}
                  style={{
                    backgroundColor: "transparent",
                  }}
                />
              </div>
              {validationErrors?.description && (
                <p className="mt-2 text-sm text-error">
                  {validationErrors.description[0]}
                </p>
              )}
              <p className="mt-1 text-xs text-base-content/50">
                Gunakan editor untuk memformat teks dengan bold, italic, list,
                dan lainnya.
              </p>
            </div>

            {/* Status Field */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-semibold text-base-content/80 mb-2">
                Status
              </label>
              <select
                name="status"
                id="status"
                value={formData.status}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                  validationErrors?.status ? "border-error" : "border-base-300"
                }`}>
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
              </select>
              {validationErrors?.status && (
                <p className="mt-2 text-sm text-error">
                  {validationErrors.status[0]}
                </p>
              )}
            </div>

            {/* General Error */}
            {(error || detailError) && (
              <div className="p-4 bg-error/10 border border-error/20 rounded-xl">
                <p className="text-sm text-error break-words">
                  {error?.message ||
                    detailError?.message ||
                    "Terjadi kesalahan"}
                </p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <Link
                to={`/classrooms/${itemCode}`}
                state={{ dataProps: displayClassroom }}
                className="w-full sm:w-auto text-center px-6 py-3 bg-base-100 dark:bg-base-300 border border-base-300 text-base-content/80 rounded-xl hover:bg-base-200/50 transition-colors duration-200">
                Batal
              </Link>
              <button
                type="submit"
                disabled={isUpdating}
                className={`w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-primary to-blue-700 text-white rounded-xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center`}>
                {isUpdating ? (
                  <>
                    <svg
                      className="w-4 h-4 mr-2 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Memperbarui...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Perbarui Kelas
                  </>
                )}
              </button>
            </div>

            {/* Performance Info */}
            <div className="mt-4 pt-4 border-t border-base-200">
              <div className="flex items-start text-xs text-base-content/60">
                <svg
                  className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="break-words">
                  Update menggunakan optimistic update - UI akan langsung
                  terupdate
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClassRoomUpdatePage;
