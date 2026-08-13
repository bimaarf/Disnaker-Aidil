import React, { memo, useCallback, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import useAttendance, {
  useMeetingDetail,
} from "../../../../../../features/classroom/attendanceHook";
import ChatNotesPopup from "./components/ChatNotesPopup";
import { selectUser } from "../../../../../../features/authentication/AuthSlice";
// Assuming selectUser is your Redux selector for user state

// Format date untuk input date (YYYY-MM-DD) using local time
const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Format time untuk input time (HH:MM)
const formatTimeForInput = (timeString) => {
  if (!timeString) return "";
  if (timeString.includes("T")) {
    const date = new Date(timeString);
    return date.toTimeString().slice(0, 5);
  } else if (timeString.includes(":")) {
    return timeString.slice(0, 5);
  }
  return timeString;
};

const getStatusText = (status) => {
  switch (status) {
    case "present":
      return "Hadir";
    case "late":
      return "Terlambat";
    case "absent":
      return "Tidak Hadir";
    case "excused":
      return "Izin";
    case "sick":
      return "Sakit";
    case "permit":
      return "Izin Khusus";
    default:
      return "Tidak Diketahui";
  }
};

const AttendanceDetailPage = () => {
  const { code, meetingId } = useParams();
  const { meeting, attendances, attendanceStats, isLoading, error } =
    useMeetingDetail(code, meetingId);
  const {
    handleUpdateAttendance,
    handleBulkUpdateAttendance,
    handleAddNote,
    handleDeleteNote,
    isUpdating,
    isBulkUpdating,
    isIndividualUpdating,
    isNoteUpdating,
  } = useAttendance(code);

  const currentUserRole = useSelector(selectUser).role;
  const isReadOnly = currentUserRole === "user";

  const [editingAttendances, setEditingAttendances] = useState({});
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [bulkAction, setBulkAction] = useState("");
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [openChatIds, setOpenChatIds] = useState([]); // Updated state for multi chat popups

  const hasChanges = useMemo(
    () => Object.keys(editingAttendances).length > 0,
    [editingAttendances]
  );

  const hasSelectedStudents = useMemo(
    () => selectedStudents.size > 0,
    [selectedStudents]
  );

  const handleAttendanceChange = useCallback((attendanceId, field, value) => {
    setEditingAttendances((prev) => ({
      ...prev,
      [attendanceId]: {
        ...prev[attendanceId],
        [field]: value,
      },
    }));
  }, []);

  const handleStudentSelection = useCallback(
    (attendanceId, studentId, checked) => {
      setSelectedStudents((prev) => {
        const newSet = new Set(prev);
        if (checked) {
          newSet.add(studentId);
        } else {
          newSet.delete(studentId);
        }
        return newSet;
      });
    },
    []
  );

  const handleSelectAll = useCallback(() => {
    if (selectedStudents.size === attendances.length) {
      setSelectedStudents(new Set());
    } else {
      const allStudentIds = attendances.map((att) => att.student.id);
      setSelectedStudents(new Set(allStudentIds));
    }
  }, [selectedStudents, attendances]);

  const handleSaveAttendance = useCallback(
    async (attendanceId) => {
      const changes = editingAttendances[attendanceId];
      if (!changes) return;

      try {
        const attendance = attendances.find((a) => a.id === attendanceId);
        const updatedData = {
          student_id: attendance.student.id,
          ...changes,
        };

        const result = await handleUpdateAttendance(meetingId, [updatedData], {
          optimistic: true,
          syncCache: true,
        });

        if (result.success) {
          setEditingAttendances((prev) => {
            const newState = { ...prev };
            delete newState[attendanceId];
            return newState;
          });
        }
      } catch (error) {
        console.error("Failed to save attendance:", error);
      }
    },
    [editingAttendances, attendances, meetingId, handleUpdateAttendance]
  );

  const handleBulkSave = useCallback(async () => {
    if (Object.keys(editingAttendances).length === 0) return;

    try {
      const updatesArray = Object.entries(editingAttendances).map(
        ([attendanceId, changes]) => {
          const attendance = attendances.find(
            (a) => a.id === parseInt(attendanceId)
          );
          return {
            student_id: attendance.student.id,
            ...changes,
          };
        }
      );

      const result = await handleUpdateAttendance(meetingId, updatesArray, {
        optimistic: true,
        syncCache: true,
      });

      if (result.success) {
        setEditingAttendances({});
        toast.success(`Berhasil memperbarui ${updatesArray.length} kehadiran`);
      }
    } catch (error) {
      console.error("Failed to bulk save attendances:", error);
    }
  }, [editingAttendances, attendances, meetingId, handleUpdateAttendance]);

  const handleBulkActionSubmit = useCallback(async () => {
    if (!bulkAction || selectedStudents.size === 0) {
      toast.error("Pilih aksi dan siswa terlebih dahulu");
      return;
    }

    const studentIds = Array.from(selectedStudents);
    const additionalData = {};

    if (bulkAction === "mark_present" || bulkAction === "mark_late") {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      additionalData.check_in_time = `${hours}:${minutes}`;
    }

    try {
      const result = await handleBulkUpdateAttendance(
        meetingId,
        bulkAction,
        studentIds,
        additionalData,
        { optimistic: true, syncCache: true }
      );

      if (result.success) {
        setSelectedStudents(new Set());
        setBulkAction("");
        setShowBulkActions(false);
      }
    } catch (error) {
      console.error("Failed to perform bulk action:", error);
    }
  }, [bulkAction, selectedStudents, meetingId, handleBulkUpdateAttendance]);

  // Updated handler for opening chat notes popup
  const handleOpenChatNotes = useCallback((attendanceId) => {
    setOpenChatIds((prev) => {
      if (prev.includes(attendanceId)) return prev;
      return [...prev, attendanceId];
    });
  }, []);

  const handleCloseChatNotes = useCallback((attendanceId) => {
    setOpenChatIds((prev) => prev.filter((id) => id !== attendanceId));
  }, []);

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case "present":
        return "text-success bg-success/10 border-success/20";
      case "late":
        return "text-warning bg-warning/10 border-warning/20";
      case "absent":
        return "text-error bg-error/10 border-error/20";
      case "excused":
      case "sick":
      case "permit":
        return "text-info bg-info/10 border-info/20";
      default:
        return "text-base-content/60 bg-base-200/30 border-base-300";
    }
  }, []);

  const isEditing = useCallback(
    (attendanceId) => {
      return Object.prototype.hasOwnProperty.call(
        editingAttendances,
        attendanceId
      );
    },
    [editingAttendances]
  );

  const getCurrentValue = useCallback(
    (attendanceId, field, defaultValue) => {
      return editingAttendances[attendanceId]?.[field] ?? defaultValue;
    },
    [editingAttendances]
  );

  // Get current attendance data for chat popup
  const getCurrentAttendance = useCallback(
    (attendanceId) => {
      return attendances.find((att) => att.id === attendanceId);
    },
    [attendances]
  );

  if (isLoading) {
    return (
      <div className="min-h-[90vh] flex justify-center items-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-base-content/80 font-medium">
            Memuat data pertemuan...
          </p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen px-1 md:px-0">
        {/* Header Navigation */}
        <div className="text-center p-8 bg-error/5 backdrop-blur-sm shadow-sm border border-error/20 rounded-3xl">
          <div className="w-20 h-20 bg-gradient-to-br from-error/20 to-error/10 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
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
          <h2 className="text-xl font-bold text-error mb-2">
            Pertemuan Tidak Ditemukan
          </h2>
          <p className="text-sm text-error/80 mb-6">
            Pertemuan yang Anda cari tidak ditemukan atau telah dihapus.
          </p>
          <Link
            to={`/classrooms/${code}/attendance`}
            className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Kembali ke Daftar Pertemuan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-1 md:px-0">
      <div>
        {/* Header Section - keeping the same as original */}
        <div className="mb-8 bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm p-8 rounded-3xl border border-base-200/50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-base-content mb-3 bg-gradient-to-r from-base-content to-base-content/70 bg-clip-text">
                {meeting.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-base-content/70">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-base-200/50 rounded-full">
                  <svg
                    className="w-4 h-4"
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
                  <span className="font-medium">
                    {formatDateForInput(meeting.meeting_date)}
                  </span>
                </div>
                {meeting.start_time && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-base-200/50 rounded-full">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium">
                      {formatTimeForInput(meeting.start_time)} -{" "}
                      {formatTimeForInput(meeting.end_time) || "Selesai"}
                    </span>
                  </div>
                )}
                {meeting.location && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-base-200/50 rounded-full">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                    </svg>
                    <span className="font-medium">{meeting.location}</span>
                  </div>
                )}
                <div
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
                    meeting.status === "scheduled"
                      ? "text-info bg-info/15 border border-info/30"
                      : meeting.status === "ongoing"
                      ? "text-warning bg-warning/15 border border-warning/30"
                      : meeting.status === "completed"
                      ? "text-success bg-success/15 border border-success/30"
                      : "text-base-content/60 bg-base-200/30"
                  }`}>
                  {meeting.status === "scheduled" && "Terjadwal"}
                  {meeting.status === "ongoing" && "Berlangsung"}
                  {meeting.status === "completed" && "Selesai"}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-6 lg:mt-0">
              {!isReadOnly && hasChanges && (
                <button
                  onClick={handleBulkSave}
                  disabled={isUpdating}
                  className="relative px-4 py-3 bg-gradient-to-r from-success to-success/80 text-white rounded-2xl hover:shadow-lg transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200 font-semibold overflow-hidden group">
                  <span className="absolute inset-0 bg-base-100/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                  {isUpdating ? (
                    <span className="relative flex items-center gap-2">
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
                      Menyimpan...
                    </span>
                  ) : (
                    <span className="relative">
                      Simpan {Object.keys(editingAttendances).length} Perubahan
                    </span>
                  )}
                </button>
              )}
              {!isReadOnly && (
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="px-4 py-3 active:scale-[98%] active:translate-y-0 bg-primary/10 text-blue-600 border-2 border-primary/30 rounded-2xl hover:bg-primary/20 hover:border-primary/50 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 font-semibold">
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Aksi Massal
                  </span>
                </button>
              )}
              {!isReadOnly && (
                <Link
                  to={`/classrooms/${code}/attendance/${meetingId}/edit`}
                  className="px-4 py-3 active:scale-[98%] active:translate-y-0 bg-warning/10 text-warning border-2 border-warning/30 rounded-2xl hover:bg-warning/20 hover:border-warning/50 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 font-semibold">
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </span>
                </Link>
              )}
              <Link
                to={`/classrooms/${code}/attendance`}
                className="px-4 py-3 active:scale-[98%] active:translate-y-0 bg-base-100/80 dark:bg-base-300/80 backdrop-blur border-2 border-base-300/50 text-base-content/80 rounded-2xl hover:bg-base-200/50 hover:border-base-300 hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold">
                <span className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Kembali
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bulk Actions Panel */}
        {!isReadOnly && showBulkActions && (
          <div className="mb-6 bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm p-6 rounded-3xl border border-base-200/50 transform transition-all duration-300 animate-in slide-in-from-top">
            <h3 className="text-xl font-bold text-base-content mb-4 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Aksi Massal
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-5 py-3 bg-base-200/50 border-2 border-base-300/50 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 font-medium">
                <option value="">Pilih Aksi</option>
                <option value="mark_present">Tandai Hadir</option>
                <option value="mark_absent">Tandai Tidak Hadir</option>
                <option value="mark_late">Tandai Terlambat</option>
                <option value="mark_excused">Tandai Izin</option>
              </select>
              <button
                onClick={handleBulkActionSubmit}
                disabled={!bulkAction || !hasSelectedStudents || isBulkUpdating}
                className="px-4 py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-2xl hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200 font-semibold">
                {isBulkUpdating ? (
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
                    Memproses...
                  </span>
                ) : (
                  `Terapkan ke ${selectedStudents.size} Siswa`
                )}
              </button>
              <div className="px-4 py-2 bg-primary/10 rounded-2xl">
                <span className="text-sm font-semibold text-primary">
                  {selectedStudents.size} dari {attendances.length} siswa
                  dipilih
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:gap-4 grid-cols-1 lg:grid-cols-4">
          {/* Left Sidebar - Statistics */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm p-6 rounded-3xl border border-base-200/50">
                <h3 className="text-xl font-bold text-base-content mb-6 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Statistik Kehadiran
                </h3>
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-xl"></div>
                    <div className="relative bg-primary/5 rounded-3xl p-6 border border-primary/20">
                      <div className="text-5xl font-mono text-primary mb-2">
                        {attendanceStats.percentage}%
                      </div>
                      <div className="text-sm font-semibold text-primary/80">
                        Tingkat Kehadiran
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-success/10 rounded-2xl p-4 border border-success/20 hover:shadow-lg hover:scale-105 transition-all duration-200">
                      <div className="text-2xl font-bold text-success">
                        {attendanceStats.present}
                      </div>
                      <div className="text-xs font-medium text-success/80">
                        Hadir
                      </div>
                    </div>
                    <div className="bg-warning/10 rounded-2xl p-4 border border-warning/20 hover:shadow-lg hover:scale-105 transition-all duration-200">
                      <div className="text-2xl font-bold text-warning">
                        {attendanceStats.late}
                      </div>
                      <div className="text-xs font-medium text-warning/80">
                        Terlambat
                      </div>
                    </div>
                    <div className="bg-error/10 rounded-2xl p-4 border border-error/20 hover:shadow-lg hover:scale-105 transition-all duration-200">
                      <div className="text-2xl font-bold text-error">
                        {attendanceStats.absent}
                      </div>
                      <div className="text-xs font-medium text-error/80">
                        Tidak Hadir
                      </div>
                    </div>
                    <div className="bg-info/10 rounded-2xl p-4 border border-info/20 hover:shadow-lg hover:scale-105 transition-all duration-200">
                      <div className="text-2xl font-bold text-info">
                        {attendanceStats.excused}
                      </div>
                      <div className="text-xs font-medium text-info/80">
                        Izin
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meeting Details */}
              {meeting.description && (
                <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm p-6 rounded-3xl border border-base-200/50">
                  <h3 className="text-xl font-bold text-base-content mb-4 flex items-center gap-2">
                    <svg
                      className="w-6 h-6 text-primary"
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
                    Detail Pertemuan
                  </h3>
                  <div className="space-y-4">
                    {meeting.agenda && (
                      <div className="p-4 bg-base-200/30 rounded-2xl border border-base-300/30">
                        <h4 className="font-semibold text-base-content/80 mb-2 flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          Agenda
                        </h4>
                        <p className="text-sm text-base-content/70 pl-4">
                          {meeting.agenda}
                        </p>
                      </div>
                    )}
                    {meeting.materials_covered && (
                      <div className="p-4 bg-base-200/30 rounded-2xl border border-base-300/30">
                        <h4 className="font-semibold text-base-content/80 mb-2 flex items-center gap-2">
                          <div className="w-2 h-2 bg-info rounded-full"></div>
                          Materi
                        </h4>
                        <p className="text-sm text-base-content/70 pl-4">
                          {meeting.materials_covered}
                        </p>
                      </div>
                    )}
                    {meeting.homework_assigned && (
                      <div className="p-4 bg-base-200/30 rounded-2xl border border-base-300/30">
                        <h4 className="font-semibold text-base-content/80 mb-2 flex items-center gap-2">
                          <div className="w-2 h-2 bg-warning rounded-full"></div>
                          Tugas
                        </h4>
                        <p className="text-sm text-base-content/70 pl-4">
                          {meeting.homework_assigned}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Attendance List */}
          <div className="lg:col-span-3">
            <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm rounded-3xl border border-base-200/50 overflow-hidden">
              <div className="p-6 border-b border-base-300/50 bg-gradient-to-r from-base-100/50 to-base-200/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-base-content flex items-center gap-2">
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
                    Daftar Kehadiran
                    <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-full">
                      {attendances.length} siswa
                    </span>
                  </h3>
                  <div className="flex items-center gap-4">
                    {!isReadOnly && hasChanges && (
                      <div className="px-4 py-2 bg-warning/10 border border-warning/30 rounded-2xl animate-pulse">
                        <span className="text-sm text-warning font-semibold">
                          {Object.keys(editingAttendances).length} perubahan
                          belum disimpan
                        </span>
                      </div>
                    )}
                    {!isReadOnly && showBulkActions && (
                      <button
                        onClick={handleSelectAll}
                        className="px-4 py-2 text-sm text-primary hover:text-primary/80 font-semibold bg-primary/10 hover:bg-primary/20 rounded-xl transition-all duration-200">
                        {selectedStudents.size === attendances.length
                          ? "Batalkan Semua"
                          : "Pilih Semua"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-base-300/50">
                  <thead className="bg-gradient-to-r from-base-200/30 to-base-200/10">
                    <tr>
                      {!isReadOnly && showBulkActions && (
                        <th className="px-4 py-4 text-left">
                          <input
                            type="checkbox"
                            checked={
                              selectedStudents.size === attendances.length &&
                              attendances.length > 0
                            }
                            onChange={handleSelectAll}
                            className="w-5 h-5 rounded-lg border-2 border-base-300 text-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                          />
                        </th>
                      )}
                      <th className="px-4 py-4 text-left text-xs font-bold text-base-content/60 uppercase tracking-wider">
                        Siswa
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-base-content/60 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-base-content/60 uppercase tracking-wider">
                        Check In
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-base-content/60 uppercase tracking-wider">
                        Partisipasi
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-base-content/60 uppercase tracking-wider">
                        Catatan
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-base-content/60 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-base-100/50 divide-y divide-base-200/30">
                    {attendances.map((attendance) => (
                      <tr
                        key={attendance.id}
                        className={`hover:bg-base-200/20 transition-all duration-200 ${
                          isEditing(attendance.id)
                            ? "bg-gradient-to-r from-warning/5 to-warning/10 shadow-sm"
                            : ""
                        }`}>
                        {!isReadOnly && showBulkActions && (
                          <td className="px-4 py-5">
                            <input
                              type="checkbox"
                              checked={selectedStudents.has(
                                attendance.student.id
                              )}
                              onChange={(e) =>
                                handleStudentSelection(
                                  attendance.id,
                                  attendance.student.id,
                                  e.target.checked
                                )
                              }
                              className="w-5 h-5 rounded-lg border-2 border-base-300 text-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                            />
                          </td>
                        )}
                        <td className="px-4 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center shadow-md">
                                <span className="text-primary font-bold text-lg">
                                  {attendance.student.name
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>
                              <div
                                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-base-100 ${
                                  attendance.status === "present"
                                    ? "bg-success"
                                    : attendance.status === "late"
                                    ? "bg-warning"
                                    : attendance.status === "absent"
                                    ? "bg-error"
                                    : "bg-info"
                                }`}></div>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-base-content">
                                {attendance.student.name}
                              </div>
                              <div className="text-xs text-base-content/60">
                                {attendance.student.email}
                              </div>
                              {attendance.student.student_id && (
                                <div className="text-xs text-base-content/40 font-mono">
                                  ID: {attendance.student.student_id}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5 whitespace-nowrap">
                          {isReadOnly ? (
                            <span
                              className={`px-4 py-2.5 border-2 rounded-2xl text-sm font-semibold transition-all duration-200 ${getStatusColor(
                                attendance.status
                              )}`}>
                              {getStatusText(attendance.status)}
                            </span>
                          ) : (
                            <select
                              value={getCurrentValue(
                                attendance.id,
                                "status",
                                attendance.status
                              )}
                              onChange={(e) =>
                                handleAttendanceChange(
                                  attendance.id,
                                  "status",
                                  e.target.value
                                )
                              }
                              className={`px-4 py-2.5 border-2 rounded-2xl text-sm font-semibold transition-all duration-200 hover:shadow-md ${getStatusColor(
                                getCurrentValue(
                                  attendance.id,
                                  "status",
                                  attendance.status
                                )
                              )}`}>
                              <option value="present">Hadir</option>
                              <option value="late">Terlambat</option>
                              <option value="absent">Tidak Hadir</option>
                              <option value="excused">Izin</option>
                              <option value="sick">Sakit</option>
                              <option value="permit">Izin Khusus</option>
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-5 whitespace-nowrap">
                          <div className="space-y-2">
                            {isReadOnly ? (
                              <span className="px-4 py-2.5 bg-base-200/30 border-2 border-base-300/50 rounded-2xl text-sm font-medium">
                                {formatTimeForInput(attendance.check_in_time) ||
                                  "-"}
                              </span>
                            ) : (
                              <input
                                type="time"
                                value={getCurrentValue(
                                  attendance.id,
                                  "check_in_time",
                                  formatTimeForInput(
                                    attendance.check_in_time
                                  ) || ""
                                )}
                                onChange={(e) =>
                                  handleAttendanceChange(
                                    attendance.id,
                                    "check_in_time",
                                    e.target.value
                                  )
                                }
                                className="px-4 py-2.5 bg-base-200/30 border-2 border-base-300/50 rounded-2xl text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                              />
                            )}
                            {attendance.is_late && attendance.late_minutes && (
                              <div className="flex items-center gap-1 text-xs text-warning font-semibold">
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Terlambat {attendance.late_minutes} menit
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-5 whitespace-nowrap">
                          <div className="relative">
                            {isReadOnly ? (
                              <span className="w-24 px-4 py-2.5 bg-base-200/30 border-2 border-base-300/50 rounded-2xl text-sm font-semibold text-center">
                                {attendance.participation_score || "-"}/10
                              </span>
                            ) : (
                              <>
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.1"
                                  value={getCurrentValue(
                                    attendance.id,
                                    "participation_score",
                                    attendance.participation_score || ""
                                  )}
                                  onChange={(e) =>
                                    handleAttendanceChange(
                                      attendance.id,
                                      "participation_score",
                                      e.target.value
                                    )
                                  }
                                  className="w-24 px-4 py-2.5 bg-base-200/30 border-2 border-base-300/50 rounded-2xl text-sm font-semibold text-center focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                  placeholder="0-10"
                                />
                                <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                                  /10
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          <div className="space-y-3">
                            {isReadOnly ? (
                              <p className="w-full min-w-[200px] px-4 py-3 bg-base-200/30 border-2 border-base-300/50 rounded-2xl text-sm">
                                {attendance.notes || "Tidak ada catatan"}
                              </p>
                            ) : (
                              <textarea
                                value={getCurrentValue(
                                  attendance.id,
                                  "notes",
                                  attendance.notes || ""
                                )}
                                onChange={(e) =>
                                  handleAttendanceChange(
                                    attendance.id,
                                    "notes",
                                    e.target.value
                                  )
                                }
                                className="w-full min-w-[200px] px-4 py-3 bg-base-200/30 border-2 border-base-300/50 rounded-2xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none"
                                rows="2"
                                placeholder="Tambah catatan..."
                              />
                            )}

                            {/* Chat-style notes preview */}
                            {attendance.additional_notes &&
                              attendance.additional_notes.length > 0 && (
                                <div className="relative">
                                  <button
                                    onClick={() =>
                                      handleOpenChatNotes(attendance.id)
                                    }
                                    className="w-full group bg-gradient-to-br from-base-200/40 to-base-200/20 rounded-2xl p-4 border border-base-300/30 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-left">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                          <svg
                                            className="w-4 h-4 text-primary"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                            />
                                          </svg>
                                        </div>
                                        <span className="text-sm font-semibold text-base-content/80">
                                          {attendance.additional_notes.length}{" "}
                                          Pesan
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-base-content/60">
                                        <span>Klik untuk buka chat</span>
                                        <svg
                                          className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24">
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                          />
                                        </svg>
                                      </div>
                                    </div>

                                    {/* Latest message preview */}
                                    <div className="space-y-2">
                                      {attendance.additional_notes
                                        .slice(-2)
                                        .map((note) => (
                                          <div
                                            key={note.id}
                                            className="flex items-start gap-2 opacity-75">
                                            <span className="text-xs">
                                              {note.type === "teacher_note"
                                                ? "👨‍🏫"
                                                : note.type === "student_note"
                                                ? "👨‍🎓"
                                                : note.type === "parent_note"
                                                ? "👨‍👩‍👧"
                                                : "👔"}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                              <div className="text-xs font-medium text-base-content/70 truncate">
                                                {note.creator.name}:{" "}
                                                {note.content}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      {attendance.additional_notes.length >
                                        2 && (
                                        <div className="text-xs text-base-content/50 text-center">
                                          +
                                          {attendance.additional_notes.length -
                                            2}{" "}
                                          pesan lainnya
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                </div>
                              )}
                          </div>
                        </td>
                        <td className="px-4 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {!isReadOnly && isEditing(attendance.id) ? (
                              <>
                                <button
                                  onClick={() =>
                                    handleSaveAttendance(attendance.id)
                                  }
                                  disabled={isIndividualUpdating}
                                  className="p-2.5 text-success bg-success/10 hover:bg-success/20 rounded-xl transition-all duration-200 disabled:opacity-50 hover:shadow-md"
                                  title="Simpan perubahan">
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingAttendances((prev) => {
                                      const newState = { ...prev };
                                      delete newState[attendance.id];
                                      return newState;
                                    });
                                  }}
                                  className="p-2.5 text-error bg-error/10 hover:bg-error/20 rounded-xl transition-all duration-200 hover:shadow-md"
                                  title="Batalkan perubahan">
                                  <svg
                                    className="w-5 h-5"
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
                              </>
                            ) : (
                              <button
                                onClick={() =>
                                  handleOpenChatNotes(attendance.id)
                                }
                                disabled={isNoteUpdating}
                                className="p-2.5 text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-all duration-200 disabled:opacity-50 hover:shadow-md"
                                title="Buka chat catatan">
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Notes Popups - Multi open in bottom right */}
        <div className="fixed bottom-4 right-4 space-x-4 flex flex-row-reverse z-50 pointer-events-none">
          {openChatIds.map((id) => (
            <div key={id} className="pointer-events-auto">
              <ChatNotesPopup
                attendanceId={id}
                studentName={getCurrentAttendance(id)?.student.name || ""}
                notes={getCurrentAttendance(id)?.additional_notes || []}
                onClose={() => handleCloseChatNotes(id)}
                onAddNote={handleAddNote}
                onDeleteNote={isReadOnly ? undefined : handleDeleteNote}
                isLoading={isNoteUpdating}
                readOnly={isReadOnly} // Assuming ChatNotesPopup handles readOnly prop to disable editing
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(AttendanceDetailPage);
