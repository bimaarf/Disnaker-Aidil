import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  memo,
} from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  useClassroomDetail,
  useClassroomStudents,
  useClassroomTeachers,
} from "../../../../features/classroom/classroomHook";
import ClassroomDetailParent from "./_classroomParent";
import { useSelector } from "react-redux";

export const ClassRoomDetailPage = () => {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const itemCode = useMemo(() => code || null, [code]);
  const currentUser = useSelector((state) => state.auth.user);
  // Refs to prevent unnecessary operations
  const lastRefreshTimeRef = useRef(null);
  const modalStateRef = useRef({ teachers: false, students: false });
  const initialLoadAttemptedRef = useRef(false);
  const retryTimeoutRef = useRef(null);

  // State for managing error and retry logic
  const [retryCount, setRetryCount] = useState(0);
  const [showRetry, setShowRetry] = useState(false);
  const [manualRefreshTriggered, setManualRefreshTriggered] = useState(false);

  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 2000; // 2 seconds

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
      console.warn("[ClassRoomDetailPage] Error parsing dataProps:", error);
      return null;
    }
  }, [location?.state?.dataProps]);

  const classroomOnlyProps = useMemo(() => {
    const isValid =
      initialDataProps && itemCode && initialDataProps.code === itemCode;
    return isValid ? initialDataProps : null;
  }, [initialDataProps, itemCode]);

  const {
    currentClassroom,
    isLoading,
    error,
    smartRefresh,
    refreshDetail,
    isStale: isDetailStale,
    teachers,
    students,
    isTeachersStale,
    isStudentsStale,
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

  const {
    availableTeachers = [],
    handleAddTeacher,
    handleRemoveTeacher,
    isLoading: isTeachersLoading = false,
    searchTerm: teacherSearch,
    handleSearch: handleTeacherSearch,
  } = useClassroomTeachers(itemCode, {
    autoLoadAvailable: false,
  });

  const {
    availableStudents = [],
    handleAddStudent,
    handleRemoveStudent,
    handleUpdateStudentStatus,
    isLoading: isStudentsLoading = false,
    searchTerm: studentSearch,
    handleSearch: handleStudentSearch,
  } = useClassroomStudents(itemCode, {
    autoLoadAvailable: false,
  });

  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  const cacheStatus = useMemo(() => {
    return {
      detail: isDetailStale ? "stale" : "fresh",
      teachers: isTeachersStale ? "stale" : "fresh",
      students: isStudentsStale ? "stale" : "fresh",
      anyStale: isDetailStale || isTeachersStale || isStudentsStale,
    };
  }, [isDetailStale, isTeachersStale, isStudentsStale]);

  const displayClassroom = useMemo(() => {
    try {
      const baseClassroom = classroomOnlyProps || currentClassroom;
      if (!baseClassroom) {
        console.log("[ClassRoomDetailPage] No baseClassroom available", {
          classroomOnlyProps,
          currentClassroom,
          isNotFound,
          error: error?.message,
        });
        return null;
      }
      return {
        id: baseClassroom.id || itemCode,
        name: baseClassroom.name || "Unnamed Classroom",
        code: baseClassroom.code || "No Code",
        description: baseClassroom.description || "",
        status: baseClassroom.status || "active",
        teacher_count: teachers?.length || baseClassroom.teacher_count || 0,
        student_count: students?.length || baseClassroom.student_count || 0,
        teachers: teachers || [],
        students: students || [],
        _source: classroomOnlyProps ? "props" : "api",
        _cacheStatus: cacheStatus,
      };
    } catch (error) {
      console.error(
        "[ClassRoomDetailPage] Error computing displayClassroom:",
        error
      );
      return null;
    }
  }, [
    classroomOnlyProps,
    currentClassroom,
    teachers,
    students,
    itemCode,
    cacheStatus,
    isNotFound,
    error,
  ]);

  // Enhanced error checking
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
    if (error && !isLoading && !displayClassroom) {
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
  }, [isLoading, isNotFound, error, displayClassroom, canRetry]);

  // Enhanced loading check
  const shouldShowLoading = useMemo(() => {
    // Show loading if we're loading and don't have display data
    return (isLoading || isFetching) && !displayClassroom && !shouldShowError;
  }, [isLoading, isFetching, displayClassroom, shouldShowError]);

  // Auto-retry logic for failed loads
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
        `[ClassRoomDetailPage] Auto-retry ${
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

  // Track initial load attempt
  useEffect(() => {
    if (itemCode && (isLoading || displayClassroom || error)) {
      initialLoadAttemptedRef.current = true;
    }
  }, [itemCode, isLoading, displayClassroom, error]);

  // Enhanced teacher operations
  const handleAddTeacherEnhanced = useCallback(
    async (teacherId) => {
      if (!teacherId || !handleAddTeacher) {
        toast.error("ID guru tidak valid");
        return { success: false };
      }

      try {
        console.log("[ClassRoomDetailPage] Adding teacher:", teacherId);
        const result = await handleAddTeacher(teacherId);

        if (result.success) {
          return result;
        } else {
          console.error(
            "[ClassRoomDetailPage] Failed to add teacher:",
            result.error
          );
          return result;
        }
      } catch (error) {
        console.error("[ClassRoomDetailPage] Error adding teacher:", error);
        return { success: false, error };
      }
    },
    [handleAddTeacher]
  );

  const handleRemoveTeacherEnhanced = useCallback(
    async (teacherId) => {
      if (!teacherId || !handleRemoveTeacher) {
        toast.error("ID guru tidak valid");
        return { success: false };
      }

      if (!confirm("Apakah Anda yakin ingin menghapus guru ini dari kelas?")) {
        return { success: false, cancelled: true };
      }

      try {
        console.log("[ClassRoomDetailPage] Removing teacher:", teacherId);
        const result = await handleRemoveTeacher(teacherId);

        if (result.success) {
          console.log("[ClassRoomDetailPage] Teacher removed successfully");
          return result;
        } else {
          console.error(
            "[ClassRoomDetailPage] Failed to remove teacher:",
            result.error
          );
          return result;
        }
      } catch (error) {
        console.error("[ClassRoomDetailPage] Error removing teacher:", error);
        return { success: false, error };
      }
    },
    [handleRemoveTeacher]
  );

  // Enhanced student operations
  const handleAddStudentEnhanced = useCallback(
    async (studentId) => {
      if (!studentId || !handleAddStudent) {
        toast.error("ID siswa tidak valid");
        return { success: false };
      }

      try {
        console.log("[ClassRoomDetailPage] Adding student:", studentId);
        const result = await handleAddStudent(studentId);

        if (result.success) {
          console.log("[ClassRoomDetailPage] Student added successfully");
          return result;
        } else {
          console.error(
            "[ClassRoomDetailPage] Failed to add student:",
            result.error
          );
          return result;
        }
      } catch (error) {
        console.error("[ClassRoomDetailPage] Error adding student:", error);
        return { success: false, error };
      }
    },
    [handleAddStudent]
  );

  const handleRemoveStudentEnhanced = useCallback(
    async (studentId) => {
      if (!studentId || !handleRemoveStudent) {
        toast.error("ID siswa tidak valid");
        return { success: false };
      }

      if (!confirm("Apakah Anda yakin ingin menghapus siswa ini dari kelas?")) {
        return { success: false, cancelled: true };
      }

      try {
        console.log("[ClassRoomDetailPage] Removing student:", studentId);
        const result = await handleRemoveStudent(studentId);

        if (result.success) {
          console.log("[ClassRoomDetailPage] Student removed successfully");
          return result;
        } else {
          console.error(
            "[ClassRoomDetailPage] Failed to remove student:",
            result.error
          );
          return result;
        }
      } catch (error) {
        console.error("[ClassRoomDetailPage] Error removing student:", error);
        return { success: false, error };
      }
    },
    [handleRemoveStudent]
  );

  const handleUpdateStudentStatusEnhanced = useCallback(
    async (studentId, status) => {
      if (!studentId || !status || !handleUpdateStudentStatus) {
        toast.error("Data tidak lengkap");
        return { success: false };
      }

      try {
        console.log("[ClassRoomDetailPage] Updating student status:", {
          studentId,
          status,
        });
        const result = await handleUpdateStudentStatus(studentId, status);

        if (result.success) {
          console.log(
            "[ClassRoomDetailPage] Student status updated successfully"
          );
          return result;
        } else {
          console.error(
            "[ClassRoomDetailPage] Failed to update student status:",
            result.error
          );

          return result;
        }
      } catch (error) {
        console.error(
          "[ClassRoomDetailPage] Error updating student status:",
          error
        );
        return { success: false, error };
      }
    },
    [handleUpdateStudentStatus]
  );

  // Enhanced manual refresh
  const handleRefreshAll = useCallback(() => {
    try {
      // Prevent too frequent refreshes
      const now = Date.now();
      if (
        lastRefreshTimeRef.current &&
        now - lastRefreshTimeRef.current < 2000
      ) {
        console.log("[ClassRoomDetailPage] Refresh cooldown active, skipping");
        return;
      }

      lastRefreshTimeRef.current = now;
      setLastRefreshTime(new Date());
      setManualRefreshTriggered(true);
      setRetryCount(0);
      setShowRetry(false);

      console.log("[ClassRoomDetailPage] Manual refresh triggered");

      // Force refresh detail
      refreshDetail().finally(() => {
        setManualRefreshTriggered(false);
      });
    } catch (error) {
      console.error("[ClassRoomDetailPage] Error refreshing:", error);
      toast.error("Gagal menyegarkan data");
      setManualRefreshTriggered(false);
    }
  }, [refreshDetail]);

  // Manual retry after max attempts
  const handleManualRetry = useCallback(() => {
    setRetryCount(0);
    setShowRetry(false);
    setManualRefreshTriggered(true);

    refreshDetail().finally(() => {
      setManualRefreshTriggered(false);
    });
  }, [refreshDetail]);

  // Smart modal handlers
  const handleShowAddTeacher = useCallback(() => {
    try {
      modalStateRef.current.teachers = true;
      setShowAddTeacher(true);
    } catch (error) {
      console.error(
        "[ClassRoomDetailPage] Error showing add teacher modal:",
        error
      );
      toast.error("Gagal membuka modal tambah guru");
    }
  }, []);

  const handleShowAddStudent = useCallback(() => {
    try {
      modalStateRef.current.students = true;
      setShowAddStudent(true);
    } catch (error) {
      console.error(
        "[ClassRoomDetailPage] Error showing add student modal:",
        error
      );
      toast.error("Gagal membuka modal tambah siswa");
    }
  }, []);

  const handleCloseAddTeacher = useCallback(() => {
    modalStateRef.current.teachers = false;
    setShowAddTeacher(false);
    handleTeacherSearch(""); // Clear search
  }, [handleTeacherSearch]);

  const handleCloseAddStudent = useCallback(() => {
    modalStateRef.current.students = false;
    setShowAddStudent(false);
    handleStudentSearch(""); // Clear search
  }, [handleStudentSearch]);

  // Navigation handlers
  const handleBackToList = useCallback(() => {
    navigate("/classrooms");
  }, [navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Debug logging - only in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && displayClassroom) {
      console.log("[ClassRoomDetailPage] Debug info:", {
        classroom: {
          id: displayClassroom.id,
          teacherCount: displayClassroom.teacher_count,
          studentCount: displayClassroom.student_count,
          source: displayClassroom._source,
        },
        state: {
          isLoading,
          isNotFound,
          error: error?.message,
          retryCount,
          showRetry,
          canRetry,
        },
        debug: debugInfo,
        lastRefresh: lastRefreshTime?.toLocaleString("id-ID"),
      });
    }
  }, [
    displayClassroom?.id,
    displayClassroom?.teacher_count,
    displayClassroom?.student_count,
    isLoading,
    isNotFound,
    error,
    retryCount,
    showRetry,
    canRetry,
    debugInfo,
    lastRefreshTime,
  ]);

  // Early returns with better error handling

  // Invalid classroom code
  if (!itemCode) {
    return (
      <div className="min-h-[90vh] flex justify-center items-center p-4">
        <div className="relative overflow-hidden p-4 bg-base-100/90 backdrop-blur-lg border border-error/20 rounded-3xl text-center max-w-md shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-error/5 to-error/10"></div>
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-error/20 to-error/30 rounded-full flex items-center justify-center shadow-lg">
              <svg
                className="w-10 h-10 text-error"
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
            <h2 className="text-xl font-bold text-error mb-3">
              Kode Kelas Tidak Valid
            </h2>
            <p className="text-sm text-error/80 mb-4 leading-relaxed">
              Kode kelas yang Anda akses tidak valid atau tidak tersedia.
            </p>
            <button
              onClick={handleBackToList}
              className="px-8 py-3 bg-base-100 dark:bg-base-300 border border-base-300 text-base-content/80 rounded-2xl hover:bg-base-200/50 transform active:scale-105 transition-all duration-300">
              Kembali ke Daftar Kelas
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (shouldShowLoading) {
    return (
      <div className="min-h-[90vh] flex justify-center items-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-primary/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold text-base-content mb-3">
            Memuat Data Kelas...
          </h2>
          <p className="text-base-content/70 mb-4 text-sm">
            Sedang mengambil informasi kelas {itemCode}
          </p>
          {retryCount > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning rounded-xl text-sm">
              <div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
              Percobaan ke-{retryCount} dari {MAX_RETRY_ATTEMPTS}
            </div>
          )}
          <div className="mt-6">
            <button
              onClick={handleBackToList}
              className="px-6 py-2 text-base-content/60 hover:text-base-content transition-colors duration-300">
              Batal
            </button>
          </div>
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
      <div className="min-h-[90vh] flex justify-center items-center p-4">
        <div className="relative overflow-hidden p-4 bg-base-100/90 backdrop-blur-lg border border-error/20 rounded-3xl text-center max-w-lg shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-error/5 to-error/10"></div>
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-error/20 to-error/30 rounded-full flex items-center justify-center shadow-lg">
              <svg
                className="w-10 h-10 text-error"
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
            <h2 className="text-xl font-bold text-error mb-3">
              {isNotFound ? "Kelas Tidak Ditemukan" : "Gagal Memuat Kelas"}
            </h2>
            <p className="text-sm text-error/80 mb-4 leading-relaxed">
              {errorDescription}
            </p>
            {process.env.NODE_ENV === "development" && (
              <details className="mb-4 text-left">
                <summary className="text-xs text-error/60 cursor-pointer hover:text-error/80 transition-colors">
                  Debug Info
                </summary>
                <pre className="mt-2 text-xs text-error/60 bg-error/5 p-3 rounded-xl overflow-auto max-h-32">
                  {JSON.stringify(
                    {
                      itemCode,
                      isNotFound,
                      error: error?.message,
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
                  className="px-6 py-3 bg-primary text-white rounded-2xl hover:bg-primary/80 transform active:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none">
                  {isLoading ? "Mencoba..." : "Coba Lagi"}
                </button>
              )}
              <button
                onClick={handleRefreshAll}
                disabled={isLoading}
                className="px-6 py-3 bg-warning/20 text-warning rounded-2xl hover:bg-warning/30 transform active:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none">
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
              <button
                onClick={handleBackToList}
                className="px-6 py-3 bg-base-100 dark:bg-base-300 border border-base-300 text-base-content/80 rounded-2xl hover:bg-base-200/50 transform active:scale-105 transition-all duration-300">
                Kembali ke Daftar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main render - only if we have valid classroom data
  if (!displayClassroom) {
    return (
      <div className="min-h-[90vh] flex justify-center items-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-warning/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 border-4 border-warning border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold text-base-content mb-3">
            Memproses Data...
          </h2>
          <p className="text-base-content/70 text-sm">
            Sedang memproses informasi kelas
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClassroomDetailParent>
      <div className="space-y-2">
        {/* Main Layout - Left: Detail, Right: Teachers & Students */}
        <div className="lg:col-span-4">
          <div className="h-full space-y-2 md:space-y-0 md:grid md:grid-cols-2 gap-2">
            {/* Teachers Section */}
            <div className="relative group overflow-hidden bg-base-100 dark:bg-base-200 backdrop-blur-sm p-4 rounded-3xl shadow-primary/5 border border-base-200/50 h-fit shadow-sm">
              <div className="absolute inset-0 "></div>
              <div className="relative p-4 h-full flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shadow-lg">
                      <svg
                        className="w-5 h-5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-base-content">
                        Guru ({Array.isArray(teachers) ? teachers.length : 0})
                      </h2>
                      {isTeachersStale && (
                        <div className="inline-flex items-center gap-1 mt-1 px-2 py-1 bg-warning/10 text-warning rounded-lg text-xs">
                          <div className="w-1.5 h-1.5 bg-warning rounded-full animate-pulse"></div>
                          Memperbarui...
                        </div>
                      )}
                    </div>
                  </div>
                  {currentUser.role !== "user" && (
                    <button
                      onClick={handleShowAddTeacher}
                      className="mt-3 sm:mt-0 inline-flex items-center gap-2 px-8 py-2.5 rounded-lg bg-gradient-to-r from-primary to-blue-700 text-white text-sm rouded-xl transform active:scale-[98%] hover:scale-[99%] transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      disabled={isTeachersLoading}>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Tambah
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto">
                  {!Array.isArray(teachers) || teachers.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-primary/40"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                      <p className="text-base-content/60 mb-1">
                        {isTeachersLoading
                          ? "Memuat data guru..."
                          : "Belum ada guru"}
                      </p>
                      <p className="text-base-content/40 text-sm">
                        {`Klik "Tambah" untuk menambahkan guru`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 p-4">
                      {teachers.map((teacher, index) => (
                        <div
                          key={teacher?.id || Math.random()}
                          className="group relative overflow-hidden bg-gradient-to-br from-base-200/40 to-base-200/20 backdrop-blur-sm rounded-2xl p-4 border shadow-primary/10 border-primary/10 transform active:scale-[1.02] transition-all duration-300"
                          style={{ animationDelay: `${index * 100}ms` }}>
                          <div className="relative flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                                <span className="text-primary font-bold text-sm">
                                  {teacher?.name?.charAt(0)?.toUpperCase() ||
                                    "?"}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base-content mb-1 truncate">
                                  {teacher?.name || "Unnamed Teacher"}
                                </h3>
                                <p className="text-base-content/70 text-sm mb-1 truncate">
                                  {teacher?.email || "No email"}
                                </p>
                                {teacher?.phone && (
                                  <p className="text-base-content/60 text-sm mb-1 truncate">
                                    📞 {teacher.phone}
                                  </p>
                                )}
                                {teacher?.assigned_at && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <svg
                                      className="w-3 h-3 text-base-content/40"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3a4 4 0 118 0v4M3 7h18a2 2 0 012 2v8a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2z"
                                      />
                                    </svg>
                                    <span className="text-xs text-base-content/50">
                                      {new Date(
                                        teacher.assigned_at
                                      ).toLocaleDateString("id-ID")}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {currentUser.role !== "user" && (
                              <button
                                onClick={() =>
                                  handleRemoveTeacherEnhanced(teacher?.id)
                                }
                                className="p-1.5 text-error/70 hover:text-error hover:bg-error/10 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 flex-shrink-0"
                                disabled={isTeachersLoading || !teacher?.id}
                                title="Hapus guru">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Students Section */}
            <div className="relative group overflow-hidden bg-base-100 dark:bg-base-200 backdrop-blur-sm p-4 rounded-3xl shadow-success/5 border border-base-200/50 h-fit shadow-sm">
              <div className="absolute inset-0"></div>
              <div className="relative p-4 h-full flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success/20 rounded-xl flex items-center justify-center shadow-lg">
                      <svg
                        className="w-5 h-5 text-success"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-base-content">
                        Siswa ({Array.isArray(students) ? students.length : 0})
                      </h2>
                      {isStudentsStale && (
                        <div className="inline-flex items-center gap-1 mt-1 px-2 py-1 bg-warning/10 text-warning rounded-lg text-xs">
                          <div className="w-1.5 h-1.5 bg-warning rounded-full animate-pulse"></div>
                          Memperbarui...
                        </div>
                      )}
                    </div>
                  </div>
                  {currentUser.role !== "user" && (
                    <button
                      onClick={handleShowAddStudent}
                      className="mt-3 sm:mt-0 inline-flex items-center gap-2 px-8 py-2.5 rounded-lg bg-gradient-to-r from-primary to-blue-700 text-white text-sm rouded-xl transform active:scale-[98%] hover:scale-[99%] transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      disabled={isStudentsLoading}>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Tambah
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto">
                  {!Array.isArray(students) || students.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-success/10 rounded-2xl flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-success/40"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      </div>
                      <p className="text-base-content/60 mb-1">
                        {isStudentsLoading
                          ? "Memuat data siswa..."
                          : "Belum ada siswa"}
                      </p>
                      <p className="text-base-content/40 text-sm">
                        {`Klik "Tambah" untuk menambahkan siswa`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 p-4">
                      {students.map((student, index) => (
                        <div
                          key={student?.id || Math.random()}
                          className="group relative overflow-hidden bg-gradient-to-br from-base-200/40 to-base-200/20 backdrop-blur-sm rounded-2xl p-4 border shadow-success/10 border-success/10 transform active:scale-[1.02] transition-all duration-300"
                          style={{ animationDelay: `${index * 100}ms` }}>
                          <div className="relative">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="w-10 h-10 bg-success/20 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                                  <span className="text-success font-bold text-sm">
                                    {student?.name?.charAt(0)?.toUpperCase() ||
                                      "?"}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-base-content mb-1 truncate">
                                    {student?.name || "Unnamed Student"}
                                  </h3>
                                  <p className="text-base-content/70 text-sm mb-1 truncate">
                                    {student?.email || "No email"}
                                  </p>
                                  {student?.student_id && (
                                    <p className="text-base-content/50 text-xs mb-1 truncate">
                                      ID: {student.student_id}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {currentUser.role !== "user" && (
                                <button
                                  onClick={() =>
                                    handleRemoveStudentEnhanced(student?.id)
                                  }
                                  className="p-1.5 text-error/70 hover:text-error hover:bg-error/10 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 flex-shrink-0"
                                  disabled={isStudentsLoading || !student?.id}
                                  title="Hapus siswa">
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              )}
                            </div>

                            {/* Student Details Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-base-300/20">
                              <div className="flex items-center gap-3 text-sm">
                                <div className="flex items-center gap-1">
                                  <svg
                                    className="w-3 h-3 text-base-content/40"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <select
                                    value={student?.status || "active"}
                                    onChange={(e) =>
                                      handleUpdateStudentStatusEnhanced(
                                        student?.id,
                                        e.target.value
                                      )
                                    }
                                    className="px-2 py-1 bg-base-200/50 dark:bg-base-300/50 border border-base-300/50 rounded-lg text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200 text-base-content/80 disabled:opacity-50 hover:bg-base-200/70"
                                    disabled={
                                      isStudentsLoading ||
                                      !student?.id ||
                                      currentUser.role === "user"
                                    }>
                                    <option value="active">Aktif</option>
                                    <option value="inactive">
                                      Tidak Aktif
                                    </option>
                                    <option value="suspended">Suspended</option>
                                  </select>
                                </div>
                              </div>
                              {student?.joined_date && (
                                <div className="flex items-center gap-1 text-xs text-base-content/50">
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 7V3a4 4 0 118 0v4M3 7h18a2 2 0 012 2v8a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2z"
                                    />
                                  </svg>
                                  <span>
                                    {new Date(
                                      student.joined_date
                                    ).toLocaleDateString("id-ID")}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Teacher Modal - Modern Design */}
      {showAddTeacher && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative overflow-hidden bg-base-100/95 dark:bg-base-200/95 backdrop-blur-lg rounded-3xl w-full max-w-lg border border-base-200/50 max-h-[85vh] shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent"></div>
            <div className="relative p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-base-content">
                    Tambah Guru
                  </h3>
                </div>
                <button
                  onClick={handleCloseAddTeacher}
                  className="p-2 hover:bg-base-200/50 rounded-xl transition-colors duration-200">
                  <svg
                    className="w-6 h-6 text-base-content/60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-base-content/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Cari guru berdasarkan nama atau email..."
                  value={teacherSearch}
                  onChange={(e) => handleTeacherSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-base-200/50 dark:bg-base-300/50 border border-base-300/50 rounded-2xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-base-content/80 placeholder:text-base-content/40"
                  autoFocus
                />
              </div>

              <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
                {isTeachersLoading ? (
                  <div className="text-center py-12">
                    <div className="relative w-12 h-12 mx-auto mb-4">
                      <div className="absolute inset-0 border-4 border-primary/30 rounded-full animate-pulse"></div>
                      <div className="absolute inset-2 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-base-content/60">
                      Memuat guru tersedia...
                    </p>
                  </div>
                ) : !Array.isArray(availableTeachers) ||
                  availableTeachers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-base-200/50 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-base-content/40"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0120 12a8 8 0 10-2.343 5.657l.343.343a2 2 0 002.828 0l2.829-2.829a2 2 0 000-2.828l-.343-.343z"
                        />
                      </svg>
                    </div>
                    <p className="text-base-content/60 text-lg mb-2">
                      {teacherSearch
                        ? "Tidak ada guru yang ditemukan"
                        : "Cari guru"}
                    </p>
                    <p className="text-base-content/40 text-sm">
                      {teacherSearch
                        ? "Coba dengan kata kunci yang berbeda"
                        : "Ketik nama atau email guru untuk mencari"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableTeachers.map((teacher, index) => (
                      <div
                        key={teacher?.id || Math.random()}
                        className="group relative overflow-hidden p-4 hover:bg-base-200/30 rounded-2xl cursor-pointer transition-all duration-200 border border-transparent hover:border-base-300/50"
                        onClick={() => {
                          if (teacher?.id) {
                            handleAddTeacherEnhanced(teacher.id);
                            handleCloseAddTeacher();
                          }
                        }}
                        style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="relative flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                            <span className="text-success font-bold text-lg">
                              {teacher?.name?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-base-content text-lg mb-1 truncate">
                              {teacher?.name || "Unnamed Teacher"}
                            </p>
                            <p className="text-base-content/70 text-sm mb-1 truncate">
                              {teacher?.email || "No email"}
                            </p>
                            {teacher?.specialization && (
                              <p className="text-base-content/50 text-xs truncate">
                                {teacher.specialization}
                              </p>
                            )}
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <svg
                              className="w-5 h-5 text-primary"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={handleCloseAddTeacher}
                  className="flex-1 px-6 py-4 bg-base-200/50 dark:bg-base-300/50 border border-base-300/50 text-base-content/80 rounded-2xl hover:bg-base-200/70 transform active:scale-[1.02] transition-all duration-300">
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal - Modern Design */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative overflow-hidden bg-base-100/95 dark:bg-base-200/95 backdrop-blur-lg rounded-3xl w-full max-w-lg border border-base-200/50 max-h-[85vh] shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/3 to-transparent"></div>
            <div className="relative p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-success/20 rounded-2xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-success"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-base-content">
                    Tambah Siswa
                  </h3>
                </div>
                <button
                  onClick={handleCloseAddStudent}
                  className="p-2 hover:bg-base-200/50 rounded-xl transition-colors duration-200">
                  <svg
                    className="w-6 h-6 text-base-content/60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-base-content/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Cari siswa berdasarkan nama atau email..."
                  value={studentSearch}
                  onChange={(e) => handleStudentSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-base-200/50 dark:bg-base-300/50 border border-base-300/50 rounded-2xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-base-content/80 placeholder:text-base-content/40"
                  autoFocus
                />
              </div>

              <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
                {isStudentsLoading ? (
                  <div className="text-center py-12">
                    <div className="relative w-12 h-12 mx-auto mb-4">
                      <div className="absolute inset-0 border-4 border-primary/30 rounded-full animate-pulse"></div>
                      <div className="absolute inset-2 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-base-content/60">
                      Memuat siswa tersedia...
                    </p>
                  </div>
                ) : !Array.isArray(availableStudents) ||
                  availableStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-base-200/50 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-base-content/40"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0120 12a8 8 0 10-2.343 5.657l.343.343a2 2 0 002.828 0l2.829-2.829a2 2 0 000-2.828l-.343-.343z"
                        />
                      </svg>
                    </div>
                    <p className="text-base-content/60 text-lg mb-2">
                      {studentSearch
                        ? "Tidak ada siswa yang ditemukan"
                        : "Cari siswa"}
                    </p>
                    <p className="text-base-content/40 text-sm">
                      {studentSearch
                        ? "Coba dengan kata kunci yang berbeda"
                        : "Ketik nama atau email siswa untuk mencari"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableStudents.map((student, index) => (
                      <div
                        key={student?.id || Math.random()}
                        className="group relative overflow-hidden p-4 hover:bg-base-200/30 rounded-2xl cursor-pointer transition-all duration-200 border border-transparent hover:border-base-300/50"
                        onClick={() => {
                          if (student?.id) {
                            handleAddStudentEnhanced(student.id);
                            handleCloseAddStudent();
                          }
                        }}
                        style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="relative flex items-center gap-4">
                          <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                            <span className="text-success font-bold text-lg">
                              {student?.name?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-base-content text-lg mb-1 truncate">
                              {student?.name || "Unnamed Student"}
                            </p>
                            <p className="text-base-content/70 text-sm mb-1 truncate">
                              {student?.email || "No email"}
                            </p>
                            {student?.student_id && (
                              <p className="text-base-content/50 text-xs truncate">
                                ID: {student.student_id}
                              </p>
                            )}
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <svg
                              className="w-5 h-5 text-success"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={handleCloseAddStudent}
                  className="flex-1 px-6 py-4 bg-base-200/50 dark:bg-base-300/50 border border-base-300/50 text-base-content/80 rounded-2xl hover:bg-base-200/70 transform active:scale-[1.02] transition-all duration-300">
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ClassroomDetailParent>
  );
};

export default memo(ClassRoomDetailPage);
