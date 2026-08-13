import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  addAttendanceNote,
  addMeetingOptimistic,
  bulkUpdateAttendance,
  clearCache,
  clearExpiredCache,
  createMeeting,
  deleteMeeting,
  fetchAttendanceStatistics,
  fetchMeetings,
  fetchStudentAttendanceSummary,
  removeMeetingOptimistic,
  resetAttendanceStatus,
  selectAttendanceError,
  selectAttendanceStatistics,
  selectAttendanceStatus,
  selectBulkUpdateStatus,
  selectCacheStats,
  selectCreateStatus,
  selectCurrentClassroomCode,
  selectDeleteStatus,
  selectIndividualUpdateStatus,
  selectIsCached,
  selectIsCreating,
  selectIsDeleting,
  selectIsLoading,
  selectIsLoadingStatistics,
  selectIsLoadingStudentSummary,
  selectIsUpdating,
  selectIsBulkUpdating,
  selectIsIndividualUpdating,
  selectIsNoteUpdating,
  selectMeetingById,
  selectMeetingPagination,
  selectMeetingsByClassroom,
  selectNoteUpdateStatus,
  selectPastMeetings,
  selectStudentSummary,
  selectTodaysMeetings,
  selectUpdateStatus,
  selectUpcomingMeetings,
  selectValidationErrors,
  setCurrentClassroom,
  syncMeetingAcrossCache,
  updateAttendance,
  updateAttendanceNote,
  updateAttendanceOptimistic,
  updateIndividualAttendance,
  updateMeeting,
  updateMeetingOptimistic,
  deleteAttendanceNote,
  deleteIndividualAttendance,
  updateAttendanceNoteInAllCaches,
} from "./attendanceSlice";

// Cache configuration
const ATTENDANCE_CACHE_CONFIG = {
  LIST_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  FETCH_COOLDOWN: 3000, // 3 seconds between fetches
  MAX_FETCH_ATTEMPTS: 3,
  AUTO_REFRESH_INTERVAL: 10 * 60 * 1000, // 10 minutes
};

/**
 * Main hook for attendance management (meetings list with embedded attendance data)
 */
const useAttendance = (classroomCode, options = {}) => {
  const { autoLoad = true, enablePolling = false } = options;

  const dispatch = useDispatch();
  const lastFetchParamsRef = useRef(null);
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef(null);
  const filtersRef = useRef({
    search: "",
    status: "all",
    type: "all",
    date_from: "",
    date_to: "",
    sort_by: "meeting_date",
    sort_order: "desc",
    per_page: 15,
    page: 1,
  });

  // Selectors
  const meetings = useSelector((state) =>
    selectMeetingsByClassroom(state, classroomCode)
  );
  const upcomingMeetings = useSelector((state) =>
    selectUpcomingMeetings(state, classroomCode)
  );
  const pastMeetings = useSelector((state) =>
    selectPastMeetings(state, classroomCode)
  );
  const todaysMeetings = useSelector((state) =>
    selectTodaysMeetings(state, classroomCode)
  );
  const pagination = useSelector((state) =>
    selectMeetingPagination(state, classroomCode)
  );

  const status = useSelector(selectAttendanceStatus);
  const createStatus = useSelector(selectCreateStatus);
  const updateStatus = useSelector(selectUpdateStatus);
  const deleteStatus = useSelector(selectDeleteStatus);
  const bulkUpdateStatus = useSelector(selectBulkUpdateStatus);
  const individualUpdateStatus = useSelector(selectIndividualUpdateStatus);
  const noteUpdateStatus = useSelector(selectNoteUpdateStatus);
  const error = useSelector(selectAttendanceError);
  const validationErrors = useSelector(selectValidationErrors);
  const currentClassroomCode = useSelector(selectCurrentClassroomCode);
  const cacheStats = useSelector(selectCacheStats);

  // Loading states
  const isLoading = useSelector(selectIsLoading);
  const isCreating = useSelector(selectIsCreating);
  const isUpdating = useSelector(selectIsUpdating);
  const isDeleting = useSelector(selectIsDeleting);
  const isBulkUpdating = useSelector(selectIsBulkUpdating);
  const isIndividualUpdating = useSelector(selectIsIndividualUpdating);
  const isNoteUpdating = useSelector(selectIsNoteUpdating);

  // Check if current params are cached
  const isCached = useSelector((state) =>
    selectIsCached(state, classroomCode, filtersRef.current)
  );

  // Enhanced fetch function with smart caching
  const fetchMeetingsData = useCallback(
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
        dispatch(resetAttendanceStatus());
      }

      dispatch(
        fetchMeetings({
          classroomCode,
          params: mergedParams,
          signal: abortControllerRef.current.signal,
          forceRefresh,
        })
      )
        .unwrap()
        .catch((err) => {
          // Ignore if cancelled
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
      fetchMeetingsData(updatedFilters, { forceRefresh });
    },
    [fetchMeetingsData]
  );

  // Clear filters with cache invalidation
  const clearFilters = useCallback(() => {
    const defaultFilters = {
      search: "",
      status: "all",
      type: "all",
      date_from: "",
      date_to: "",
      sort_by: "meeting_date",
      sort_order: "desc",
      per_page: 15,
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

    fetchMeetingsData(defaultFilters, { forceRefresh: true });
  }, [fetchMeetingsData, dispatch, classroomCode]);

  // Create new meeting with optimistic update
  const addMeeting = useCallback(
    async (meetingData, options = {}) => {
      const { optimistic = true } = options;
      let optimisticId = null;

      try {
        // Validate required fields
        if (
          !meetingData.title ||
          !meetingData.meeting_date ||
          !meetingData.type
        ) {
          throw new Error("Title, meeting date, and type are required");
        }

        if (optimistic) {
          // Create optimistic meeting object
          optimisticId = `temp_${Date.now()}`;
          const optimisticMeeting = {
            id: optimisticId,
            title: meetingData.title,
            description: meetingData.description || "",
            meeting_date: meetingData.meeting_date,
            start_time: meetingData.start_time || null,
            end_time: meetingData.end_time || null,
            status: "scheduled",
            type: meetingData.type,
            location: meetingData.location || "",
            is_mandatory: meetingData.is_mandatory ?? true,
            agenda: meetingData.agenda || "",
            materials_covered: meetingData.materials_covered || "",
            homework_assigned: meetingData.homework_assigned || "",
            notes: meetingData.notes || "",
            duration_minutes: null,
            formatted_duration: null,
            is_past: false,
            is_today:
              meetingData.meeting_date ===
              new Date().toISOString().split("T")[0],
            attendance_count: 0,
            present_count: 0,
            absent_count: 0,
            excused_count: 0,
            attendance_percentage: 0,
            attendances: [],
            creator: {
              id: 1,
              name: "Current User",
              email: "user@example.com",
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          dispatch(
            addMeetingOptimistic({
              classroomCode,
              meeting: optimisticMeeting,
            })
          );
        }

        const result = await dispatch(
          createMeeting({ classroomCode, meetingData })
        ).unwrap();

        // Remove optimistic meeting after successful creation
        if (optimistic && optimisticId) {
          dispatch(
            removeMeetingOptimistic({
              classroomCode,
              meetingId: optimisticId,
            })
          );
        }

        toast.success("Pertemuan berhasil dibuat");
        return { success: true, data: result.data };
      } catch (err) {
        // Remove optimistic meeting on error
        if (optimistic && optimisticId) {
          dispatch(
            removeMeetingOptimistic({
              classroomCode,
              meetingId: optimisticId,
            })
          );
        }

        if (err.name !== "AbortError" && !err.cancelled) {
          toast.error(err.message || "Gagal membuat pertemuan");
        }
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode]
  );

  // Update meeting with optimistic updates and smart cache sync
  const editMeeting = useCallback(
    async (meetingId, meetingData, options = {}) => {
      const { optimistic = true, syncCache = true } = options;

      try {
        // Find current meeting for optimistic update
        const currentMeeting = meetings.find(
          (m) => String(m.id) === String(meetingId)
        );

        if (currentMeeting && optimistic) {
          // Apply optimistic update
          const optimisticUpdatedMeeting = {
            ...currentMeeting,
            ...meetingData,
            updated_at: new Date().toISOString(),
          };

          dispatch(
            updateMeetingOptimistic({
              classroomCode,
              meetingId,
              updatedMeeting: optimisticUpdatedMeeting,
            })
          );
        }

        // Perform actual update - use updateMeeting thunk, NOT createMeeting
        const result = await dispatch(
          updateMeeting({ classroomCode, meetingId, meetingData })
        ).unwrap();

        // Sync to all cache entries if enabled
        if (syncCache && result.data) {
          dispatch(
            syncMeetingAcrossCache({
              classroomCode,
              meetingId,
              updatedMeeting: result.data,
              source: "edit_meeting",
            })
          );
        }

        toast.success("Pertemuan berhasil diperbarui");
        return { success: true, data: result.data };
      } catch (err) {
        // Revert optimistic update by refreshing from server
        if (navigator.onLine && optimistic) {
          fetchMeetingsData(filtersRef.current, {
            forceRefresh: true,
            silent: true,
          });
        }

        if (err.name !== "AbortError" && !err.cancelled) {
          toast.error(err.message || "Gagal memperbarui pertemuan");
        }
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, meetings, fetchMeetingsData]
  );

  // Delete meeting with optimistic updates
  const removeMeeting = useCallback(
    async (meetingId, options = {}) => {
      const { optimistic = true } = options;

      try {
        if (optimistic) {
          // Optimistic update for immediate feedback
          dispatch(removeMeetingOptimistic({ classroomCode, meetingId }));
        }

        await dispatch(deleteMeeting({ classroomCode, meetingId })).unwrap();

        toast.success("Pertemuan berhasil dihapus");
        return { success: true };
      } catch (err) {
        // Revert optimistic update on error
        if (optimistic) {
          fetchMeetingsData(filtersRef.current, {
            forceRefresh: true,
            silent: true,
          });
        }

        if (err.name !== "AbortError" && !err.cancelled) {
          toast.error(err.message || "Gagal menghapus pertemuan");
        }
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, fetchMeetingsData]
  );

  // Update attendance with optimistic updates and smart cache sync
  const handleUpdateAttendance = useCallback(
    async (meetingId, attendances, options = {}) => {
      const { optimistic = true, syncCache = true } = options;

      try {
        // Find current meeting
        const currentMeeting = meetings.find(
          (m) => String(m.id) === String(meetingId)
        );

        if (!currentMeeting) {
          throw new Error("Meeting not found");
        }

        // Process attendances data
        const processedAttendances = attendances.map((a) => {
          const existing = currentMeeting.attendances?.find(
            (att) => att.student.id === a.student_id
          );
          return {
            student_id: a.student_id,
            status: a.status || existing?.status || "absent",
            check_in_time: a.check_in_time || existing?.check_in_time,
            check_out_time: a.check_out_time || existing?.check_out_time,
            notes: a.notes !== undefined ? a.notes : existing?.notes,
            participation_score:
              a.participation_score !== undefined
                ? a.participation_score
                : existing?.participation_score,
            participation_notes:
              a.participation_notes !== undefined
                ? a.participation_notes
                : existing?.participation_notes,
          };
        });

        if (optimistic) {
          dispatch(
            updateAttendanceOptimistic({
              classroomCode,
              meetingId,
              attendances: processedAttendances,
            })
          );
        }

        const result = await dispatch(
          updateAttendance({
            classroomCode,
            meetingId,
            attendances: processedAttendances,
          })
        ).unwrap();

        // Smart cache sync after server response
        if (syncCache && result.data) {
          dispatch(
            syncMeetingAcrossCache({
              classroomCode,
              meetingId,
              updatedMeeting: result.data,
              source: "attendance_update",
            })
          );
        }

        toast.success("Kehadiran berhasil diperbarui");
        return { success: true, data: result.data };
      } catch (err) {
        // Revert optimistic update on error
        if (optimistic && navigator.onLine) {
          fetchMeetingsData(filtersRef.current, {
            forceRefresh: true,
            silent: true,
          });
        }

        if (err.name !== "AbortError" && !err.cancelled) {
          toast.error(err.message || "Gagal memperbarui kehadiran");
        }
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, meetings, fetchMeetingsData]
  );

  // Bulk update attendance
  // Fixed handleBulkUpdateAttendance function from attendanceHook.js
  // Replace the existing handleBulkUpdateAttendance function with this:

  const handleBulkUpdateAttendance = useCallback(
    async (
      meetingId,
      action,
      studentIds,
      additionalData = {},
      options = {}
    ) => {
      const { optimistic = true, syncCache = true } = options;

      try {
        const statusMap = {
          mark_present: "present",
          mark_absent: "absent",
          mark_late: "late",
          mark_excused: "excused",
        };

        const status = statusMap[action];
        if (!status) {
          throw new Error("Invalid bulk action");
        }

        // Optimistic update
        if (optimistic) {
          const attendanceUpdates = studentIds.map((studentId) => ({
            student_id: studentId,
            status: status,
            check_in_time: additionalData.check_in_time,
            notes: additionalData.notes,
          }));

          dispatch(
            updateAttendanceOptimistic({
              classroomCode,
              meetingId,
              attendances: attendanceUpdates,
            })
          );
        }

        // FIX: Properly structure the bulk update data
        // The backend expects: action, student_ids, and any additional fields
        const bulkData = {
          action: action, // This is the required field
          student_ids: studentIds,
          ...additionalData, // Spread additional data (check_in_time, notes, etc.)
        };

        const result = await dispatch(
          bulkUpdateAttendance({
            classroomCode,
            meetingId,
            bulkData: bulkData, // Now properly structured
          })
        ).unwrap();

        // Smart cache sync
        if (syncCache && result.data) {
          dispatch(
            syncMeetingAcrossCache({
              classroomCode,
              meetingId,
              updatedMeeting: result.data,
              source: "bulk_attendance_update",
            })
          );
        }

        toast.success(
          `Berhasil ${action.replace("mark_", "")} ${studentIds.length} siswa`
        );
        return { success: true, data: result.data };
      } catch (err) {
        // Revert on error
        if (optimistic && navigator.onLine) {
          fetchMeetingsData(filtersRef.current, {
            forceRefresh: true,
            silent: true,
          });
        }

        if (err.name !== "AbortError" && !err.cancelled) {
          toast.error(err.message || "Gagal melakukan bulk update kehadiran");
        }
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, fetchMeetingsData]
  );

  // Update individual attendance
  const handleUpdateIndividualAttendance = useCallback(
    async (attendanceId, attendanceData, options = {}) => {
      const { optimistic = true, syncCache = true } = options;

      try {
        // Find the meeting and attendance for optimistic update
        if (optimistic) {
          const meetingWithAttendance = meetings.find((meeting) =>
            meeting.attendances?.some(
              (att) => String(att.id) === String(attendanceId)
            )
          );

          if (meetingWithAttendance) {
            const attendanceUpdates = [
              {
                student_id: meetingWithAttendance.attendances.find(
                  (att) => String(att.id) === String(attendanceId)
                )?.student.id,
                ...attendanceData,
              },
            ];

            dispatch(
              updateAttendanceOptimistic({
                classroomCode,
                meetingId: meetingWithAttendance.id,
                attendances: attendanceUpdates,
              })
            );
          }
        }

        const result = await dispatch(
          updateIndividualAttendance({
            classroomCode,
            attendanceId,
            attendanceData,
          })
        ).unwrap();

        // Smart cache sync
        if (syncCache && result.data?.meeting) {
          dispatch(
            syncMeetingAcrossCache({
              classroomCode,
              meetingId: result.data.meeting.id,
              updatedMeeting: result.data.meeting,
              source: "individual_attendance_update",
            })
          );
        }

        toast.success("Kehadiran individual berhasil diperbarui");
        return { success: true, data: result.data };
      } catch (err) {
        // Revert on error
        if (optimistic && navigator.onLine) {
          fetchMeetingsData(filtersRef.current, {
            forceRefresh: true,
            silent: true,
          });
        }

        if (err.name !== "AbortError" && !err.cancelled) {
          toast.error(err.message || "Gagal memperbarui kehadiran individual");
        }
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, meetings, fetchMeetingsData]
  );

  // Add attendance note with optimistic update
  const handleAddNote = useCallback(
    async (attendanceId, noteData, options = {}) => {
      const { optimistic = true } = options;
      let tempId = null;
      try {
        if (optimistic) {
          tempId = `temp_${Date.now()}`;
          const optimisticNote = {
            id: tempId,
            type: noteData.type,
            content: noteData.content,
            is_private: noteData.is_private || false,
            creator: {
              id: 1, // Current user
              name: "Current User",
              email: "user@example.com",
            },
            noted_at: new Date().toISOString(),
          };
          dispatch(
            updateAttendanceNoteInAllCaches({
              classroomCode,
              attendanceId,
              updatedNote: optimisticNote,
              operation: "create",
            })
          );
        }
        const result = await dispatch(
          addAttendanceNote({
            classroomCode,
            attendanceId,
            noteData,
          })
        ).unwrap();

        // PERBAIKAN: Hapus catatan optimistic dan tambahkan catatan asli hanya sekali
        if (optimistic && tempId) {
          // Hapus catatan optimistic
          dispatch(
            updateAttendanceNoteInAllCaches({
              classroomCode,
              attendanceId,
              updatedNote: { id: tempId },
              operation: "delete",
            })
          );

          // Tambahkan catatan asli dari server
          // dispatch(
          //   updateAttendanceNoteInAllCaches({
          //     classroomCode,
          //     attendanceId,
          //     updatedNote: result.data,
          //     operation: "create",
          //   })
          // );
        }

        toast.success("Catatan berhasil ditambahkan");
        return { success: true, data: result };
      } catch (err) {
        // Hapus catatan optimistic jika terjadi error
        if (optimistic && tempId) {
          dispatch(
            updateAttendanceNoteInAllCaches({
              classroomCode,
              attendanceId,
              updatedNote: { id: tempId },
              operation: "delete",
            })
          );
        }
        if (err.name !== "AbortError" && !err.cancelled) {
          toast.error(err.message || "Gagal menambahkan catatan");
        }
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode]
  );

  // Update attendance note
  const handleUpdateNote = useCallback(
    async (attendanceId, noteId, noteData, options = {}) => {
      const { optimistic = true } = options;

      let previousNote = null;

      try {
        if (optimistic) {
          // Find previous note
          let foundNote = null;
          for (const meeting of meetings) {
            const attendance = meeting.attendances?.find(
              (a) => String(a.id) === String(attendanceId)
            );
            if (attendance && attendance.additional_notes) {
              foundNote = attendance.additional_notes.find(
                (n) => String(n.id) === String(noteId)
              );
              if (foundNote) break;
            }
          }

          if (foundNote) {
            previousNote = { ...foundNote };
          }

          const optimisticUpdatedNote = {
            id: noteId,
            ...noteData,
            updated_at: new Date().toISOString(),
          };

          dispatch(
            updateAttendanceNoteInAllCaches({
              classroomCode,
              attendanceId,
              updatedNote: optimisticUpdatedNote,
              operation: "update",
            })
          );
        }

        const result = await dispatch(
          updateAttendanceNote({
            classroomCode,
            attendanceId,
            noteId,
            noteData,
          })
        ).unwrap();

        // Sync real data
        dispatch(
          updateAttendanceNoteInAllCaches({
            classroomCode,
            attendanceId,
            updatedNote: result.data,
            operation: "update",
          })
        );

        toast.success("Catatan berhasil diperbarui");
        return { success: true, data: result.data };
      } catch (err) {
        if (optimistic && previousNote) {
          dispatch(
            updateAttendanceNoteInAllCaches({
              classroomCode,
              attendanceId,
              updatedNote: previousNote,
              operation: "update",
            })
          );
        }

        if (err.name !== "AbortError" && !err.cancelled) {
          toast.error(err.message || "Gagal memperbarui catatan");
        }
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, meetings]
  );

  // Delete attendance note
  const handleDeleteNote = useCallback(
    async (attendanceId, noteId, options = {}) => {
      const { optimistic = true } = options;

      let deletedNote = null;

      try {
        if (optimistic) {
          // Find the note to store
          let foundNote = null;
          for (const meeting of meetings) {
            const attendance = meeting.attendances?.find(
              (a) => String(a.id) === String(attendanceId)
            );
            if (attendance && attendance.additional_notes) {
              foundNote = attendance.additional_notes.find(
                (n) => String(n.id) === String(noteId)
              );
              if (foundNote) break;
            }
          }

          if (foundNote) {
            deletedNote = { ...foundNote };
          }

          dispatch(
            updateAttendanceNoteInAllCaches({
              classroomCode,
              attendanceId,
              updatedNote: { id: noteId },
              operation: "delete",
            })
          );
        }

        await dispatch(
          deleteAttendanceNote({
            classroomCode,
            attendanceId,
            noteId,
          })
        ).unwrap();

        toast.success("Catatan berhasil dihapus");
        return { success: true };
      } catch (err) {
        if (optimistic && deletedNote) {
          dispatch(
            updateAttendanceNoteInAllCaches({
              classroomCode,
              attendanceId,
              updatedNote: deletedNote,
              operation: "create",
            })
          );
        }

        if (err.name !== "AbortError" && !err.cancelled) {
          toast.error(err.message || "Gagal menghapus catatan");
        }
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, meetings]
  );

  const handleDeleteIndividualAttendance = useCallback(
    async (attendanceId, options = {}) => {
      const { optimistic = true, confirmDialog = true } = options;

      try {
        // Show confirmation dialog
        if (confirmDialog) {
          const confirmed = window.confirm(
            "Apakah Anda yakin ingin menghapus data kehadiran ini? Tindakan ini tidak dapat dibatalkan."
          );
          if (!confirmed) {
            return { success: false, cancelled: true };
          }
        }

        // Find the attendance to remove for optimistic update
        const attendanceToRemove = meetings
          .flatMap((meeting) => meeting.attendances || [])
          .find((att) => String(att.id) === String(attendanceId));

        if (attendanceToRemove && optimistic) {
          // Apply optimistic removal
          const meetingId = meetings.find((meeting) =>
            meeting.attendances?.some(
              (att) => String(att.id) === String(attendanceId)
            )
          )?.id;

          if (meetingId) {
            // Remove the attendance from the meeting's attendances array
            dispatch(
              updateMeetingOptimistic({
                classroomCode,
                meetingId,
                updatedMeeting: {
                  ...meetings.find((m) => m.id === meetingId),
                  attendances: meetings
                    .find((m) => m.id === meetingId)
                    .attendances.filter(
                      (att) => String(att.id) !== String(attendanceId)
                    ),
                  attendance_count:
                    meetings.find((m) => m.id === meetingId).attendance_count -
                    1,
                  updated_at: new Date().toISOString(),
                },
              })
            );
          }
        }

        // Make API call to delete individual attendance
        const result = await dispatch(
          deleteIndividualAttendance({
            classroomCode,
            attendanceId,
          })
        ).unwrap();

        toast.success("Data kehadiran berhasil dihapus");
        return { success: true, data: result };
      } catch (err) {
        // Revert optimistic update on error
        if (optimistic && navigator.onLine) {
          fetchMeetingsData(filtersRef.current, {
            forceRefresh: true,
            silent: true,
          });
        }

        if (err.name !== "AbortError" && !err.cancelled) {
          toast.error(err.message || "Gagal menghapus data kehadiran");
        }
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, meetings, fetchMeetingsData]
  );

  // Page change handler
  const handlePageChange = useCallback(
    (page) => {
      setFilters({ page });
    },
    [setFilters]
  );

  // Search handler
  const handleSearch = useCallback(
    (searchTerm) => {
      setFilters({ search: searchTerm, page: 1 });
    },
    [setFilters]
  );

  // Cache management functions
  const refreshCache = useCallback(() => {
    fetchMeetingsData(filtersRef.current, { forceRefresh: true });
  }, [fetchMeetingsData]);

  const clearAttendanceCache = useCallback(() => {
    dispatch(clearCache(classroomCode));
    fetchMeetingsData(filtersRef.current, { forceRefresh: true });
  }, [dispatch, classroomCode, fetchMeetingsData]);

  // Enhanced initialization with caching logic
  useEffect(() => {
    if (!autoLoad || !classroomCode) return;

    // Clear any pending requests when classroom changes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Reset state for new classroom
    lastFetchParamsRef.current = null;
    isFetchingRef.current = false;

    // Set current classroom
    if (currentClassroomCode !== classroomCode) {
      dispatch(setCurrentClassroom(classroomCode));
    }

    // Clear any previous errors
    dispatch(resetAttendanceStatus());

    // Fetch meetings - will use cache if available and not expired
    fetchMeetingsData(filtersRef.current);

    // Cleanup on unmount or classroom change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      isFetchingRef.current = false;
    };
  }, [
    autoLoad,
    classroomCode,
    dispatch,
    fetchMeetingsData,
    currentClassroomCode,
  ]);

  // Auto-refresh expired cache on focus
  useEffect(() => {
    const handleFocus = () => {
      if (classroomCode && !isCached) {
        fetchMeetingsData(filtersRef.current, {
          forceRefresh: true,
          silent: true,
        });
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [classroomCode, isCached, fetchMeetingsData]);

  // Polling for real-time updates
  useEffect(() => {
    if (!enablePolling || !classroomCode) return;

    const interval = setInterval(() => {
      if (!isFetchingRef.current && !isCached) {
        fetchMeetingsData(filtersRef.current, {
          forceRefresh: true,
          silent: true,
        });
      }
    }, ATTENDANCE_CACHE_CONFIG.AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [enablePolling, classroomCode, isCached, fetchMeetingsData]);

  return {
    // Data
    meetings,
    upcomingMeetings,
    pastMeetings,
    todaysMeetings,
    pagination,
    filters: filtersRef.current,

    // Status
    status,
    createStatus,
    updateStatus,
    deleteStatus,
    bulkUpdateStatus,
    individualUpdateStatus,
    noteUpdateStatus,
    error,
    validationErrors,

    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isBulkUpdating,
    isIndividualUpdating,
    isNoteUpdating,

    // Cache info
    isCached,
    cacheStats,

    // Actions
    fetchMeetingsData,
    setFilters,
    clearFilters,
    addMeeting,
    editMeeting,
    removeMeeting,
    handleUpdateAttendance,
    handleBulkUpdateAttendance,
    handleUpdateIndividualAttendance,
    handleAddNote,
    handleUpdateNote,
    handleDeleteNote,
    handlePageChange,
    handleSearch,
    handleDeleteIndividualAttendance,
    // Cache management
    refreshCache,
    clearAttendanceCache,
  };
};

/**
 * Hook for getting specific meeting with embedded attendance data
 */
export const useMeetingDetail = (classroomCode, meetingId, options = {}) => {
  const {
    autoLoad = true,
    enablePolling = false,
    pollingInterval = 30000,
    // autoRefreshAfterUpdate = false,
  } = options;

  const dispatch = useDispatch();
  const abortControllerRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const lastFetchTimeRef = useRef(0);
  const isFetchingRef = useRef(false);
  const [fetchAttempts, setFetchAttempts] = useState(0);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  // Selectors
  const meeting = useSelector((state) =>
    selectMeetingById(state, classroomCode, meetingId)
  );
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectAttendanceError);
  const currentClassroomCode = useSelector(selectCurrentClassroomCode);

  // Cache selectors
  // const allMeetings = useSelector((state) =>
  //   selectMeetingsByClassroom(state, classroomCode)
  // );
  const isCached = useSelector((state) => {
    const filtersWithMeetingId = { meeting_id: meetingId };
    return selectIsCached(state, classroomCode, filtersWithMeetingId);
  });

  // Enhanced fetch function with spam prevention
  const fetchMeetingDetail = useCallback(
    async (options = {}) => {
      if (!classroomCode || !meetingId) {
        console.warn("Missing classroomCode or meetingId");
        return { success: false, error: "Missing required parameters" };
      }

      const { forceRefresh = false, silent = false } = options;
      const now = Date.now();

      // Prevent spam requests
      if (
        !forceRefresh &&
        isFetchingRef.current &&
        now - lastFetchTimeRef.current < ATTENDANCE_CACHE_CONFIG.FETCH_COOLDOWN
      ) {
        console.log("Fetch request throttled");
        return { success: false, throttled: true };
      }

      // If we already have the meeting and it's not a force refresh, skip
      if (!forceRefresh && meeting && !silent) {
        return { success: true, data: meeting, fromCache: true };
      }

      // Cancel previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;

      try {
        // Set current classroom if different
        if (currentClassroomCode !== classroomCode) {
          dispatch(setCurrentClassroom(classroomCode));
        }

        // Clear any previous errors if not silent
        if (!silent && error) {
          dispatch(resetAttendanceStatus());
        }

        // Fetch meetings with specific meeting filter
        const result = await dispatch(
          fetchMeetings({
            classroomCode,
            params: {
              per_page: 50, // Get more meetings to ensure we find the specific one
              include_attendances: true,
            },
            signal: abortControllerRef.current.signal,
            forceRefresh,
          })
        ).unwrap();

        setFetchAttempts((prev) => prev + 1);
        setHasAttemptedFetch(true);
        return { success: true, data: result };
      } catch (err) {
        setFetchAttempts((prev) => prev + 1);
        setHasAttemptedFetch(true);

        if (
          err?.name === "AbortError" ||
          err?.cancelled ||
          err?.code === "ERR_CANCELED"
        ) {
          return { success: false, cancelled: true };
        }

        console.error("Failed to fetch meeting detail:", err);
        return { success: false, error: err };
      } finally {
        isFetchingRef.current = false;
        abortControllerRef.current = null;
      }
    },
    [dispatch, classroomCode, meetingId, currentClassroomCode, error, meeting]
  );

  // Refresh function
  const refreshDetail = useCallback(() => {
    return fetchMeetingDetail({ forceRefresh: true });
  }, [fetchMeetingDetail]);

  // Initial fetch with proper conditions
  useEffect(() => {
    if (!autoLoad || !classroomCode || !meetingId) return;

    // Only fetch if:
    // 1. We don't have the meeting data yet
    // 2. We haven't attempted to fetch before
    // 3. We're not currently loading
    const shouldFetch = !meeting && !hasAttemptedFetch && !isLoading;

    if (shouldFetch) {
      console.log(`Fetching meeting detail for ${meetingId}`);
      fetchMeetingDetail({ silent: true });
    }
  }, [
    autoLoad,
    classroomCode,
    meetingId,
    meeting,
    hasAttemptedFetch,
    isLoading,
    fetchMeetingDetail,
  ]);

  // Reset state when parameters change
  useEffect(() => {
    setHasAttemptedFetch(false);
    setFetchAttempts(0);
    lastFetchTimeRef.current = 0;

    // Cancel any ongoing requests when parameters change
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      isFetchingRef.current = false;
    }
  }, [classroomCode, meetingId]);

  // Polling setup (disabled by default to prevent spam)
  useEffect(() => {
    if (!enablePolling || !classroomCode || !meetingId || !meeting) return;

    pollIntervalRef.current = setInterval(() => {
      if (!isFetchingRef.current) {
        fetchMeetingDetail({ silent: true, forceRefresh: true });
      }
    }, pollingInterval);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [
    enablePolling,
    classroomCode,
    meetingId,
    pollingInterval,
    fetchMeetingDetail,
    meeting,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      isFetchingRef.current = false;
    };
  }, []);

  // Memoized computed values
  const attendances = useMemo(() => {
    return meeting?.attendances || [];
  }, [meeting?.attendances]);

  const attendanceStats = useMemo(() => {
    if (!attendances.length) {
      return {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        percentage: 0,
      };
    }

    const total = attendances.length;
    const present = attendances.filter((a) => a.status === "present").length;
    const absent = attendances.filter((a) => a.status === "absent").length;
    const late = attendances.filter((a) => a.status === "late").length;
    const excused = attendances.filter((a) =>
      ["excused", "sick", "permit"].includes(a.status)
    ).length;
    const percentage =
      total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { total, present, absent, late, excused, percentage };
  }, [attendances]);

  // Check if cache is stale
  const isCacheStale = useMemo(() => {
    return !isCached;
  }, [isCached]);

  return {
    meeting,
    attendances,
    attendanceStats,
    isLoading: isLoading && !hasAttemptedFetch,
    error,
    hasAttemptedFetch,
    fetchAttempts,
    isCacheStale,
    hasCachedData: !!meeting,
    cachedData: meeting,
    fetchMeetingDetail,
    refreshDetail,
  };
};

/**
 * Hook for attendance statistics
 */
export const useAttendanceStatistics = (classroomCode, options = {}) => {
  const { autoLoad = true } = options;

  const dispatch = useDispatch();
  const abortControllerRef = useRef(null);

  const statistics = useSelector((state) =>
    selectAttendanceStatistics(state, classroomCode)
  );
  const isLoadingStatistics = useSelector(selectIsLoadingStatistics);
  const error = useSelector(selectAttendanceError);

  const fetchStatistics = useCallback(async () => {
    if (!classroomCode) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const result = await dispatch(
        fetchAttendanceStatistics({
          classroomCode,
          signal: abortControllerRef.current.signal,
        })
      ).unwrap();

      return { success: true, data: result };
    } catch (err) {
      if (err?.cancelled || err?.code === "ERR_CANCELED") {
        return { success: false, cancelled: true };
      }
      return { success: false, error: err };
    }
  }, [dispatch, classroomCode]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoLoad && classroomCode) {
      fetchStatistics();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [autoLoad, classroomCode, fetchStatistics]);

  return {
    statistics,
    isLoadingStatistics,
    error,
    fetchStatistics,
  };
};

/**
 * Hook for student attendance summary
 */
export const useStudentAttendanceSummary = (
  classroomCode,
  studentId,
  options = {}
) => {
  const { autoLoad = true, year, month } = options;

  const dispatch = useDispatch();
  const abortControllerRef = useRef(null);

  const studentSummary = useSelector((state) =>
    selectStudentSummary(state, classroomCode, studentId)
  );
  const isLoadingStudentSummary = useSelector(selectIsLoadingStudentSummary);
  const error = useSelector(selectAttendanceError);

  const fetchStudentSummary = useCallback(
    async (params = {}) => {
      if (!classroomCode || !studentId) return;

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const queryParams = {
        year: year || new Date().getFullYear(),
        month,
        ...params,
      };

      try {
        const result = await dispatch(
          fetchStudentAttendanceSummary({
            classroomCode,
            studentId,
            params: queryParams,
            signal: abortControllerRef.current.signal,
          })
        ).unwrap();

        return { success: true, data: result };
      } catch (err) {
        if (err?.cancelled || err?.code === "ERR_CANCELED") {
          return { success: false, cancelled: true };
        }
        return { success: false, error: err };
      }
    },
    [dispatch, classroomCode, studentId, year, month]
  );

  // Auto-fetch on mount
  useEffect(() => {
    if (autoLoad && classroomCode && studentId) {
      fetchStudentSummary();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [autoLoad, classroomCode, studentId, fetchStudentSummary]);

  return {
    studentSummary,
    isLoadingStudentSummary,
    error,
    fetchStudentSummary,
  };
};

export default useAttendance;
