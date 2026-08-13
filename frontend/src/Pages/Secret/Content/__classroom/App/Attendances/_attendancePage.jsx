import {
  AlertCircle,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  BookOpen,
  Calendar,
  CalendarDays,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  FileText,
  Grid,
  List,
  MapPin,
  MoreHorizontal,
  Plus,
  Target,
  Trash,
  TrendingUp,
  Users,
} from "lucide-react";
import React, { memo, useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CircularLoader } from "../../../../../../Components/_CircularLoader";
import useAttendance from "../../../../../../features/classroom/attendanceHook";
import ClassroomDetailParent from "../../_classroomParent";
import ChartsPage from "./ChartsPage";
import { useSelector } from "react-redux";
import { selectUser } from "../../../../../../features/authentication/AuthSlice";

// ==================== CONSTANTS ====================
const MEETING_TYPES = [
  {
    value: "regular",
    label: "Reguler",
    icon: BookOpen,
    color: "text-white",
  },
  { value: "exam", label: "Ujian", icon: FileText, color: "text-white" },
  { value: "quiz", label: "Kuis", icon: Target, color: "text-white" },
  {
    value: "presentation",
    label: "Presentasi",
    icon: Users,
    color: "text-white",
  },
  {
    value: "field_trip",
    label: "Kunjungan",
    icon: MapPin,
    color: "text-white",
  },
];

const MEETING_STATUS = [
  {
    value: "scheduled",
    label: "Terjadwal",
    color: "bg-primary/20 text-primary",
  },
  {
    value: "ongoing",
    label: "Berlangsung",
    color: "bg-success/20 text-success",
  },
  {
    value: "completed",
    label: "Selesai",
    color: "bg-base-200 text-base-content/70",
  },
  { value: "cancelled", label: "Dibatalkan", color: "bg-error/20 text-error" },
];

const VIEW_MODES = {
  LIST: "list",
  GRID: "grid",
};

// ==================== UTILITY FUNCTIONS ====================
const formatTime = (timeString) => {
  if (!timeString) return "";
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTypeConfig = (type) =>
  MEETING_TYPES.find((t) => t.value === type) || MEETING_TYPES[0];

const getStatusConfig = (status) =>
  MEETING_STATUS.find((s) => s.value === status) || MEETING_STATUS[0];

const getTypeGradient = (type) => {
  switch (type) {
    case "regular":
      return "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80";
    case "exam":
      return "from-error/80 via-error/40 to-error/80";
    case "quiz":
      return "from-warning/80 via-warning to-warning/80 dark:from-warning/80 dark:via-warning/40 dark:to-warning/80";
    case "presentation":
      return "from-warning/80 via-warning to-warning/80 dark:from-warning/80 dark:via-warning/40 dark:to-warning/80";
    case "field_trip":
      return "from-error/80 via-error/40 to-error/80";
    default:
      return "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80";
  }
};

const getTypeIconBg = (type) => {
  switch (type) {
    case "regular":
      return "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80";
    case "exam":
      return "from-error/80 via-error/40 to-error/80";
    case "quiz":
      return "from-warning/80 via-warning to-warning/80 dark:from-warning/80 dark:via-warning/40 dark:to-warning/80";
    case "presentation":
      return "from-warning/80 via-warning to-warning/80 dark:from-warning/80 dark:via-warning/40 dark:to-warning/80";
    case "field_trip":
      return "from-error/80 via-error/40 to-error/80";
    default:
      return "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80";
  }
};

const getTypeSpanBg = (type) => {
  switch (type) {
    case "regular":
      return "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80";
    case "exam":
      return "from-error/80 via-error/40 to-error/80";
    case "quiz":
      return "from-warning/80 via-warning to-warning/80 dark:from-warning/80 dark:via-warning/40 dark:to-warning/80";
    case "presentation":
      return "from-warning/80 via-warning to-warning/80 dark:from-warning/80 dark:via-warning/40 dark:to-warning/80";
    case "field_trip":
      return "from-error/80 via-error/40 to-error/80";
    default:
      return "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80";
  }
};

const getStatusSpanBg = (status) => {
  switch (status) {
    case "scheduled":
      return "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80";

    case "ongoing":
      return "from-warning/80 via-warning to-warning/80 dark:from-warning/80 dark:via-warning/40 dark:to-warning/80";

    case "completed":
      return "from-success/80 via-success to-success/80 dark:from-success/80 dark:via-success/40 dark:to-success/80";

    case "cancelled":
      return "from-error/80 via-error/40 to-error/80";

    default:
      return "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80";
  }
};
// ==================== COMPONENTS ====================
// Meeting Grid Item Component - Enhanced Version
const MeetingGridItem = memo(
  ({ currentUser, meeting, onEdit, onDelete, onViewDetail }) => {
    const TypeIcon = getTypeConfig(meeting.type).icon;
    const typeColor = getTypeConfig(meeting.type).color;
    const typeLabel = getTypeConfig(meeting.type).label;
    const statusConfig = getStatusConfig(meeting.status);
    const statusLabel = statusConfig.label;

    const statsGrid = useMemo(() => {
      return [
        {
          icon: CheckCircle,
          label: "Hadir",
          shortLabel: "Hadir",
          value: meeting.present_count || 0,
          color: "success",
        },
        {
          icon: AlertCircle,
          label: "Tidak Hadir",
          shortLabel: "Absen",
          value: meeting.absent_count || 0,
          color: "error",
        },
        {
          icon: TrendingUp,
          label: "Kehadiran",
          shortLabel: "%",
          value: `${meeting.attendance_percentage || 0}%`,
          color: "primary",
        },
      ].map((stat) => (
        <div
          key={stat.label}
          className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 cursor-pointer border ${
            stat.color === "primary"
              ? "border-primary/10 bg-primary/10"
              : stat.color === "success"
              ? "border-success/10 bg-success/10"
              : "border-error/10 bg-error/10"
          }`}>
          <div className="flex items-center gap-1 sm:gap-2 mb-1">
            <stat.icon
              className={`w-3 sm:w-4 h-3 sm:h-4 ${
                stat.color === "primary"
                  ? "text-blue-600"
                  : stat.color === "success"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            />
            <span
              className={`text-xs font-semibold uppercase tracking-wide ${
                stat.color === "primary"
                  ? "text-blue-700"
                  : stat.color === "success"
                  ? "text-green-700"
                  : "text-red-700"
              }`}>
              <span className="hidden sm:inline">{stat.label}</span>
              <span className="sm:hidden">{stat.shortLabel}</span>
            </span>
          </div>
          <div
            className={`text-lg sm:text-xl font-bold ${
              stat.color === "primary"
                ? "text-blue-900"
                : stat.color === "success"
                ? "text-green-900"
                : "text-red-900"
            }`}>
            {stat.value}
          </div>
        </div>
      ));
    }, [
      meeting.present_count,
      meeting.absent_count,
      meeting.attendance_percentage,
    ]);

    const actionsGrid = useMemo(() => {
      return [
        {
          onClick: () => onViewDetail(meeting.id),
          icon: Eye,
          label: "Lihat Detail",
          shortLabel: "Lihat",
          color: "primary",
        },
        ...(currentUser.role !== "user"
          ? [
              {
                onClick: () => onEdit(meeting.id),
                icon: Edit,
                label: "Edit Pertemuan",
                shortLabel: "Edit",
                color: "warning",
              },
              {
                onClick: () => onDelete(meeting.id),
                icon: Trash,
                label: "Hapus Pertemuan",
                shortLabel: "Hapus",
                color: "error",
              },
            ]
          : []),
      ].map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm rounded-lg sm:rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
            action.color === "primary"
              ? "bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-primary/25"
              : action.color === "warning"
              ? "bg-warning/10 text-warning hover:bg-warning/20 hover:shadow-warning/25"
              : action.color === "error"
              ? "bg-error/10 text-error hover:bg-error/20 hover:shadow-error/25"
              : "bg-base-200 text-base-content hover:bg-base-300"
          }`}>
          <action.icon className="w-3 sm:w-4 h-3 sm:h-4" />
          <span className="hidden sm:inline">{action.label}</span>
          <span className="sm:hidden text-xs truncate">
            {action.shortLabel}
          </span>
        </button>
      ));
    }, [meeting.id, onViewDetail, onEdit, onDelete]);

    return (
      <div className="group cursor-pointer transition-transform duration-200 ease-out hover:scale-[99%] active:scale-[98%] rounded-2xl bg-gradient-to-br from-base-100 to-base-100 dark:from-base-200 dark:to-base-200 shadow-sm hover:shadow-lg hover:shadow-primary/10 border border-base-200/30 backdrop-blur-sm">
        {/* Header */}
        <div
          className={`p-4 sm:p-6 bg-gradient-to-br rounded-t-2xl relative overflow-hidden ${getTypeGradient(
            meeting.type
          )}`}>
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 opacity-10 transform rotate-12 translate-x-2 -translate-y-2">
            <TypeIcon className="w-full h-full" />
          </div>

          <div className="flex items-start gap-2 sm:gap-2 relative z-10">
            <div
              className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br flex-shrink-0 shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 text-white ${getTypeIconBg(
                meeting.type
              )}`}>
              <TypeIcon
                className={`w-6 sm:w-8 h-6 sm:h-8 ${typeColor} group-hover:scale-110 transition-transform duration-300`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="font-bold text-white bg-base-100/10 w-fit p-[4px] rounded transition-all cursor-pointer line-clamp-2 group-hover:scale-105 transform-gpu duration-300 text-base sm:text-lg leading-tight"
                onClick={() => onViewDetail(meeting.id)}>
                {meeting.title}
              </h3>
              <div className="flex items-center gap-2 mt-2 sm:mt-3 text-white">
                <span
                  className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r backdrop-blur-sm  shadow-sm transform hover:scale-105 transition-all duration-300 ${getTypeSpanBg(
                    meeting.type
                  )}`}>
                  <TypeIcon className="w-3 sm:w-4 h-3 sm:h-4" />
                  <span className="hidden sm:inline">{typeLabel}</span>
                  <span className="sm:hidden">{typeLabel.slice(0, 4)}</span>
                </span>
                <span
                  className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r backdrop-blur-sm shadow-sm transform hover:scale-105 transition-all duration-300 ${getStatusSpanBg(
                    meeting.status
                  )}`}>
                  {meeting.status === "completed" && (
                    <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4" />
                  )}
                  {meeting.status === "ongoing" && (
                    <Clock className="w-3 sm:w-4 h-3 sm:h-4" />
                  )}
                  <span className="hidden sm:inline">{statusLabel}</span>
                  <span className="sm:hidden">{statusLabel.slice(0, 4)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2 mb-4 sm:mb-5">
            {statsGrid}
          </div>

          {/* Metadata */}
          <div className="space-y-2 mb-4 sm:mb-5 text-xs text-base-content/60">
            <div className="flex items-center gap-2 p-2 bg-base-100/50 rounded-lg">
              <Calendar className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" />
              <span className="text-xs sm:text-sm">
                {new Date(meeting.meeting_date).toLocaleDateString("id-ID")}
              </span>
            </div>
            {meeting.start_time && (
              <div className="flex items-center gap-2 p-2 bg-base-100/50 rounded-lg">
                <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" />
                <span className="text-xs sm:text-sm">
                  {formatTime(meeting.start_time)}
                </span>
              </div>
            )}
            {meeting.location && (
              <div className="flex items-center gap-2 p-2 bg-base-100/50 rounded-lg">
                <MapPin className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" />
                <span className="text-xs sm:text-sm">{meeting.location}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
            {actionsGrid}
          </div>
        </div>
      </div>
    );
  }
);
MeetingGridItem.displayName = "MeetingGridItem";

// Meeting List Item Component
const MeetingListItem = memo(
  ({ currentUser, meeting, onEdit, onDelete, onViewDetail }) => {
    const TypeIcon = getTypeConfig(meeting.type).icon;
    const typeColor = getTypeConfig(meeting.type).color;
    const statusConfig = getStatusConfig(meeting.status);
    return (
      <div className="group cursor-pointer transition-transform duration-200 ease-out hover:scale-[99%] active:scale-[98%] rounded-2xl bg-gradient-to-br from-base-100 to-base-100 dark:from-base-200 dark:to-base-200 shadow-sm hover:shadow-lg hover:shadow-primary/10 border border-base-200/30 backdrop-blur-sm">
        <div className="p-4 sm:p-6">
          {/* Mobile Layout */}
          <div className="flex flex-col sm:hidden">
            <div className="flex items-start gap-2 mb-3">
              <div
                className={`p-3 rounded-xl bg-gradient-to-br flex-shrink-0 shadow-md transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ${
                  meeting.type === "regular"
                    ? "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80"
                    : meeting.type === "exam"
                    ? "from-error/80 via-red to-red/80 dark:from-red/80 dark:via-red/40 dark:to-red-80"
                    : meeting.type === "quiz"
                    ? "from-warning/80 via-warning to-warning/80 dark:from-warning/80 dark:via-warning/40 dark:to-warning/80"
                    : meeting.type === "presentation"
                    ? "from-success/80 via-success to-success/80 dark:from-success/80 dark:via-success/40 dark:to-success/80"
                    : "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80"
                }`}>
                <TypeIcon
                  className={`w-5 h-5 ${typeColor} group-hover:scale-110 transition-transform duration-300`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="text-base sm:text-lg font-bold text-base-content line-clamp-2 cursor-pointer group-hover:scale-105 transform-gpu duration-300 leading-tight"
                  onClick={() => onViewDetail(meeting.id)}>
                  {meeting.title}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${statusConfig.color} mt-2`}>
                  {meeting.status === "completed" && (
                    <CheckCircle className="w-3 h-3" />
                  )}
                  {meeting.status === "ongoing" && (
                    <Clock className="w-3 h-3" />
                  )}
                  {statusConfig.label}
                </span>
              </div>
              <div className="relative group/menu">
                <button className="p-2 hover:bg-base-100 dark:hover:bg-base-200 rounded-lg transition-all duration-300">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-44 bg-base-100 dark:bg-base-200/95 backdrop-blur-lg border border-base-200 rounded-2xl shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-300 z-20 transform scale-95 group-hover/menu:scale-100">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => onViewDetail(meeting.id)}
                      className="w-full px-3 py-2.5 text-left text-sm hover:bg-blue-500/10 text-blue-600 rounded-lg transition-all duration-300 flex items-center gap-2 font-medium">
                      <Eye className="w-4 h-4" />
                      Lihat Detail
                    </button>
                    {currentUser.role !== "user" && (
                      <>
                        <button
                          onClick={() => onEdit(meeting.id)}
                          className="w-full px-3 py-2.5 text-left text-sm hover:bg-yellow-500/10 text-yellow-600 rounded-lg transition-all duration-300 flex items-center gap-2 font-medium">
                          <Edit className="w-4 h-4" />
                          Edit Pertemuan
                        </button>
                        <div className="border-t border-base-200 my-1"></div>
                        <button
                          onClick={() => onDelete(meeting.id)}
                          className="w-full px-3 py-2.5 text-left text-sm hover:bg-red-500/10 text-red-600 rounded-lg transition-all duration-300 flex items-center gap-2 font-medium">
                          <Trash className="w-4 h-4" />
                          Hapus Pertemuan
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Meeting Details - Mobile */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-base-content/70">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(meeting.meeting_date).toLocaleDateString("id-ID")}
                </span>
                {meeting.start_time && (
                  <>
                    <span>•</span>
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(meeting.start_time)}</span>
                  </>
                )}
              </div>
              {meeting.location && (
                <div className="flex items-center gap-2 text-sm text-base-content/70">
                  <MapPin className="w-4 h-4" />
                  <span>{meeting.location}</span>
                </div>
              )}
            </div>
            {/* Stats - Mobile */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1.5 px-2 py-1.5 bg-success/5 rounded-lg">
                <CheckCircle className="w-3 h-3 text-success" />
                <span className="font-medium">
                  {meeting.present_count || 0}
                </span>
                <span className="opacity-70">hadir</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1.5 bg-error/5 rounded-lg">
                <AlertCircle className="w-3 h-3 text-red-600" />
                <span className="font-medium">{meeting.absent_count || 0}</span>
                <span className="opacity-70">tidak hadir</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1.5 bg-primary/5 rounded-lg">
                <TrendingUp className="w-3 h-3 text-blue-600" />
                <span className="font-medium">
                  {meeting.attendance_percentage || 0}%
                </span>
                <span className="opacity-70">kehadiran</span>
              </div>
            </div>
          </div>
          {/* Desktop Layout */}
          <div className="hidden sm:flex items-start gap-2">
            {/* Icon */}
            <div
              className={`p-4 rounded-2xl bg-gradient-to-br flex-shrink-0 shadow-md transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ${
                meeting.type === "regular"
                  ? "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80"
                  : meeting.type === "exam"
                  ? "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error-80"
                  : meeting.type === "quiz"
                  ? "from-warning/80 via-warning to-warning/80 dark:from-warning/80 dark:via-warning/40 dark:to-warning/80"
                  : meeting.type === "presentation"
                  ? "from-success/80 via-success to-success/80 dark:from-success/80 dark:via-success/40 dark:to-success/80"
                  : "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80"
              }`}>
              <TypeIcon
                className={`w-6 h-6 ${typeColor} group-hover:scale-110 transition-transform duration-300`}
              />
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3
                    className="text-lg font-bold text-base-content transition-all cursor-pointer truncate group-hover:scale-105 transform-gpu duration-300"
                    onClick={() => onViewDetail(meeting.id)}>
                    {meeting.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 mb-3 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full ${statusConfig.color}`}>
                      {meeting.status === "completed" && (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      {meeting.status === "ongoing" && (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      {statusConfig.label}
                    </span>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-base-100/60 dark:bg-base-200/60 rounded-lg text-xs text-base-content/60">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {new Date(meeting.meeting_date).toLocaleDateString(
                          "id-ID"
                        )}
                      </span>
                    </div>
                    {meeting.start_time && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-base-100/60 dark:bg-base-200/60 rounded-lg text-xs text-base-content/60">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTime(meeting.start_time)}</span>
                      </div>
                    )}
                    {meeting.location && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-base-100/60 dark:bg-base-200/60 rounded-lg text-xs text-base-content/60">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{meeting.location}</span>
                      </div>
                    )}
                  </div>
                  {/* Stats - Desktop */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-2 px-3 py-2 bg-success/5 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-700">
                        {meeting.present_count || 0} hadir
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-error/5 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="font-semibold text-red-700">
                        {meeting.absent_count || 0} tidak hadir
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-blue-700">
                        {meeting.attendance_percentage || 0}% kehadiran
                      </span>
                    </div>
                  </div>
                </div>
                {/* Desktop Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                  <button
                    onClick={() => onViewDetail(meeting.id)}
                    className="p-2.5 rounded-xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-0.5 hover:bg-blue-500/15 text-blue-600 hover:shadow-lg hover:shadow-blue-500/25">
                    <Eye className="w-4 h-4" />
                  </button>
                  {currentUser.role !== "user" && (
                    <>
                      <button
                        onClick={() => onEdit(meeting.id)}
                        className="p-2.5 rounded-xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-0.5 hover:bg-yellow-500/15 text-yellow-600 hover:shadow-lg hover:shadow-yellow-500/25">
                        <Edit className="w-4 h-4" />
                      </button>
                      <div className="relative group/menu">
                        <button className="p-2.5 hover:bg-base-100 dark:hover:bg-base-200 rounded-xl transition-all duration-300 transform hover:scale-110">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-40 bg-base-100 dark:bg-base-200/95 backdrop-blur-lg border border-base-200 rounded-2xl shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-300 z-10 transform scale-95 group-hover/menu:scale-100">
                          <div className="p-2">
                            <button
                              onClick={() => onDelete(meeting.id)}
                              className="w-full px-4 py-3 text-left text-sm hover:bg-red-500/10 text-red-600 rounded-xl transition-all duration-300 flex items-center gap-2 font-medium">
                              <Trash className="w-4 h-4" />
                              Hapus Pertemuan
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
MeetingListItem.displayName = "MeetingListItem";

// ==================== MAIN ATTENDANCE PAGE COMPONENT ====================
const AttendancePage = memo(() => {
  const { code: classroomCode } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
  const [showFilters, setShowFilters] = useState(false);
  const { meetings, upcomingMeetings, todaysMeetings, removeMeeting, status } =
    useAttendance(classroomCode);
  const [isManage, setIsManage] = useState(true);
  const currentUser = useSelector(selectUser);
  // Memoized values
  const isLoading = useMemo(() => status === "loading", [status]);

  // Event handlers
  const handleDelete = useCallback(
    async (meetingId) => {
      if (!window.confirm("Apakah Anda yakin ingin menghapus pertemuan ini?")) {
        return;
      }
      const result = await removeMeeting(meetingId, { optimistic: true });
      if (result.success) {
        console.log("Meeting deleted successfully:", meetingId);
      }
    },
    [removeMeeting]
  );

  const handleEdit = useCallback(
    (data) => {
      navigate(`/classrooms/${classroomCode}/attendance/${data.id}/edit`);
    },
    [navigate, classroomCode]
  );

  const handleViewDetail = useCallback(
    (data) => {
      navigate(
        `/classrooms/${classroomCode}/attendance/${data.id}/preview?isTop=true`
      );
    },
    [navigate, classroomCode]
  );

  const handleAddNew = useCallback(() => {
    navigate(`/classrooms/${classroomCode}/attendance/create`);
  }, [navigate, classroomCode]);

  // Render loading state
  if (!meetings && isLoading) {
    return (
      <div className="max-w-full mx-auto">
        <div className="bg-gradient-to-br from-base-100/80 to-base-200/50 backdrop-blur-sm rounded-3xl shadow-xl border border-base-300/50">
          <div className="p-8">
            <div className="text-center py-16">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/40 rounded-2xl mx-auto flex items-center justify-center animate-pulse">
                  <CalendarDays className="w-10 h-10 text-primary animate-bounce" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full animate-ping" />
              </div>
              <div className="flex justify-center">
                <CircularLoader />
              </div>
              <h3 className="text-xl font-bold text-base-content mb-2">
                Memuat Data Kehadiran
              </h3>
              <p className="text-base-content/60">
                Sedang mengambil data pertemuan untuk kelas Anda...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClassroomDetailParent>
      <div className="max-w-full mx-auto min-h-screen bg-gradient-to-br from-base-50/30 to-base-100/50">
        {/* Header */}
        <div className="mb-4 relative z-10 p-8 bg-base-100 dark:bg-base-200 rounded-3xl border border-base-200 backdrop-blur-sm shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-base-content">
                Kehadiran & Pertemuan
              </h1>
              <p className="text-base-content/70 text-sm">
                Kelola jadwal pertemuan dan catat kehadiran siswa
              </p>
              <div className="flex items-center gap-2 text-xs text-base-content/60">
                <div className="flex items-center gap-1">
                  <CalendarDays className="w-4 h-4" />
                  <span>Total: {meetings?.length || 0} pertemuan</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Hari ini: {todaysMeetings?.length || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>Mendatang: {upcomingMeetings?.length || 0}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-base-100/80 backdrop-blur-sm rounded-2xl p-1.5 border border-base-200/50">
                <button
                  onClick={() => setViewMode(VIEW_MODES.LIST)}
                  className={`p-3 rounded-xl transition-all duration-300 transform ${
                    viewMode === VIEW_MODES.LIST
                      ? "bg-gradient-to-r from-primary to-primary/80 text-primary-content scale-105"
                      : "text-base-content/60 hover:text-base-content hover:bg-base-200/50"
                  }`}>
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode(VIEW_MODES.GRID)}
                  className={`p-3 rounded-xl transition-all duration-300 transform ${
                    viewMode === VIEW_MODES.GRID
                      ? "bg-gradient-to-r from-primary to-primary/80 text-primary-content scale-105"
                      : "text-base-content/60 hover:text-base-content hover:bg-base-200/50"
                  }`}>
                  <Grid className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex text-sm active:-translate-y-1 items-center px-4 py-3 border md:hover:brightness-95 border-base-300 rounded-xl bg-base-100 dark:bg-base-300 text-base-content/80 font-semibold hover:bg-base-200/50 transition-all duration-200">
                {showFilters ? <ArrowUpNarrowWide /> : <ArrowDownNarrowWide />}
                <span className="md:block hidden">Filter</span>
              </button>
              {currentUser.role !== "user" && (
                <button
                  onClick={handleAddNew}
                  className="flex text-sm justify-center items-center gap-2 active:-translate-y-1 md:hover:brightness-95 px-4 py-3 border border-base-300 rounded-xl bg-primary text-gray-50 font-semibold transition-all duration-200">
                  <Plus className="w-5 h-5" />
                  <span>Pertemuan</span>
                </button>
              )}
            </div>
          </div>
          {/* Filters - Add filter component here when implemented */}
          {showFilters && (
            <div className="mb-6 p-4 bg-base-200/30 rounded-2xl">
              <p className="text-sm text-base-content/60">
                Filter belum diimplementasi
              </p>
            </div>
          )}
        </div>
        {/* View Chart Toggle */}
        <div className="flex w-fit justify-end gap-2 mb-4 items-center bg-base-100/80 backdrop-blur-sm rounded-2xl p-1.5 border border-base-200/50">
          <button
            onClick={() => setIsManage(true)}
            className={`flex items-center gap-2 p-3 rounded-xl transition-all duration-200 transform whitespace-nowrap  hover:scale-[99%] active:scale-[98%] ${
              isManage === true
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-content scale-105"
                : "text-base-content/60 hover:text-base-content hover:bg-base-200/50"
            }`}
            aria-label="Manage">
            <List className="w-5 h-5" />
            <span className="text-sm">Manage</span>
          </button>

          <button
            onClick={() => setIsManage(false)}
            className={`flex items-center gap-2 p-3 rounded-xl transition-all duration-200 transform whitespace-nowrap  hover:scale-[99%] active:scale-[98%] ${
              isManage === false
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-content scale-105"
                : "text-base-content/60 hover:text-base-content hover:bg-base-200/50"
            }`}
            aria-label="Statistic">
            <Grid className="w-5 h-5" />
            <span className="text-sm">Statistic</span>
          </button>
        </div>
        {/* Content */}
        {isManage === true ? (
          <>
            {isLoading && meetings.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex justify-center mb-6">
                  <CircularLoader />
                </div>
                <h3 className="text-xl font-semibold text-base-content mb-2">
                  Memuat pertemuan...
                </h3>
                <p className="text-base-content/60">
                  Tunggu sebentar, sedang mengambil data terbaru
                </p>
              </div>
            ) : meetings.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/30 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <CalendarDays className="w-16 h-16 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-base-content mb-4">
                  Belum Ada Pertemuan
                </h3>
                <p className="text-base-content/60 mb-4 max-w-md mx-auto text-lg">
                  Mulai dengan membuat jadwal pertemuan pertama untuk kelas ini.
                </p>
                {currentUser.role !== "user" && (
                  <button
                    onClick={handleAddNew}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-primary/80 text-primary-content rounded-2xl hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-2xl hover:shadow-primary/25 transform hover:scale-105 hover:-translate-y-1 font-semibold text-lg">
                    <Plus className="w-6 h-6" />
                    <span>Buat Pertemuan Pertama</span>
                  </button>
                )}
              </div>
            ) : (
              <div
                className={`${
                  viewMode === VIEW_MODES.GRID
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"
                    : "space-y-2"
                }`}>
                {meetings.map((meeting) =>
                  viewMode === VIEW_MODES.GRID ? (
                    <MeetingGridItem
                      currentUser={currentUser}
                      key={meeting.id}
                      meeting={meeting}
                      onEdit={() => handleEdit(meeting)}
                      onDelete={handleDelete}
                      onViewDetail={() => handleViewDetail(meeting)}
                    />
                  ) : (
                    <MeetingListItem
                      currentUser={currentUser}
                      key={meeting.id}
                      meeting={meeting}
                      onEdit={() => handleEdit(meeting)}
                      onDelete={handleDelete}
                      onViewDetail={() => handleViewDetail(meeting)}
                    />
                  )
                )}
              </div>
            )}
          </>
        ) : (
          <div>
            <ChartsPage meetings={meetings} />
          </div>
        )}
      </div>
    </ClassroomDetailParent>
  );
});
AttendancePage.displayName = "AttendancePage";
export default AttendancePage;
