import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  Calendar,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Grid,
  List,
  MoreHorizontal,
  Plus,
  Sword,
  Trash,
  User,
  Users,
} from "lucide-react";
import React, { memo, useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CircularLoader } from "../../../../../../Components/_CircularLoader";
import AssignmentFilters from "../../../../../../features/classroom/assignmentFilters";
import useAssignments from "../../../../../../features/classroom/assignmentHook";
import ClassroomDetailParent from "../../_classroomParent";
import { useSelector } from "react-redux";
import AssignmentChartPage from "./components/_assignmentChartPage";

// ==================== CONSTANTS ====================
const ASSIGNMENT_TYPES = [
  {
    value: "document",
    label: "Dokumen",
    icon: FileText,
    color: "text-white",
  },
  { value: "form", label: "Kuis", icon: Sword, color: "text-white" },
];

const VIEW_MODES = {
  LIST: "list",
  GRID: "grid",
};

const formatDateRelative = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "1 hari yang lalu";
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} minggu yang lalu`;
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} bulan yang lalu`;
  return `${Math.ceil(diffDays / 365)} tahun yang lalu`;
};

const getTypeIcon = (type) => {
  const typeConfig = ASSIGNMENT_TYPES.find((t) => t.value === type);
  return typeConfig?.icon || FileText;
};

const getTypeLabel = (type) => {
  const typeConfig = ASSIGNMENT_TYPES.find((t) => t.value === type);
  return typeConfig?.label || type;
};

const getTypeColor = (type) => {
  const typeConfig = ASSIGNMENT_TYPES.find((t) => t.value === type);
  return typeConfig?.color || "text-base-content/60";
};

// ==================== CUSTOM HOOKS ====================
// Enhanced Form Validation Hook for Multiple Files
// Updated Form Validation Hook with Better File Handling
// Updated useFormValidation Hook with better error handling

// ==================== UI COMPONENTS ====================

// Loading Spinner Component
const LoadingSpinner = memo(({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  return (
    <div className="relative">
      <div
        className={`border-4 border-primary/20 rounded-full animate-spin ${sizeClasses[size]} ${className}`}
        aria-label="Memuat"
      />
      <div
        className={`absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin ${sizeClasses[size]}`}
      />
    </div>
  );
});
LoadingSpinner.displayName = "LoadingSpinner";
// Assignment List Item Component
const AssignmentListItem = memo(
  ({
    currentUser,
    assignment,
    onEdit,
    onDelete,
    onDownload,
    onViewExternal,
    onViewDetail,
    isDeleting,
    isDownloading,
    navigate,
    classroomCode,
  }) => {
    const TypeIcon = getTypeIcon(assignment.type);

    const mobileStats = useMemo(() => {
      return [
        {
          icon: Eye,
          value: assignment.view_count || 0,
          label: "views",
        },
        {
          icon: Download,
          value: assignment.download_count || 0,
          label: "downloads",
        },
      ].map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-1.5 px-2 py-1.5 bg-base-100/40 rounded-lg hover:bg-base-200/60 transition-colors">
          <stat.icon className="w-3 h-3" />
          <span className="font-medium">{stat.value}</span>
          <span className="text-xs opacity-70">{stat.label}</span>
        </div>
      ));
    }, [assignment.view_count, assignment.download_count]);

    const desktopStats = useMemo(() => {
      return [
        {
          icon: Eye,
          value: assignment.view_count || 0,
          label: "views",
        },
        {
          icon: Download,
          value: assignment.download_count || 0,
          label: "downloads",
        },
      ].map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-1.5 px-2 py-1 bg-base-100/40 rounded-lg hover:bg-base-200/60 transition-colors">
          <stat.icon className="w-3.5 h-3.5" />
          <span className="font-medium">{stat.value}</span>
        </div>
      ));
    }, [assignment.view_count, assignment.download_count]);

    const desktopActions = useMemo(() => {
      let actions = [
        {
          onClick: () => onViewDetail(assignment.id),
          icon: Eye,
          color: "primary",
          label: "Detail",
        },
        // hanya tampil kalau bukan role user
        ...(currentUser.role !== "user"
          ? [
              {
                onClick: () => onEdit(assignment.id),
                icon: Edit,
                color: "warning",
                label: "Edit",
              },
              {
                onClick: () => onDelete(assignment.id),
                icon: Trash,
                color: "error",
                label: "Delete",
              },
            ]
          : []),
        ...(assignment.file_path
          ? [
              {
                onClick: () => onDownload(assignment.id),
                icon: Download,
                color: "success",
                label: "Download",
                loading: isDownloading,
              },
            ]
          : []),
        ...(assignment.external_link
          ? [
              {
                onClick: () => onViewExternal(assignment),
                icon: ExternalLink,
                color: "info",
                label: "Open",
              },
            ]
          : []),
      ];

      return actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          disabled={action.loading}
          className={`p-2.5 rounded-xl transition-all duration-100 transform hover:scale-110 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
            action.color === "primary"
              ? "bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-primary/25"
              : action.color === "warning"
              ? "bg-warning/10 text-warning hover:bg-warning/20 hover:shadow-warning/25"
              : action.color === "error"
              ? "bg-error/10 text-error hover:bg-error/20 hover:shadow-error/25"
              : "bg-base-200 text-base-content hover:bg-base-300"
          }`}
          aria-label={`${action.label} ${assignment.title}`}>
          {action.loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <action.icon className="w-4 h-4" />
          )}
        </button>
      ));
    }, [
      assignment.id,
      assignment.file_path,
      assignment.external_link,
      assignment.title,
      onViewDetail,
      onEdit,
      onDelete, // tambahin kalau ada fungsi hapus
      onDownload,
      onViewExternal,
      isDownloading,
      currentUser.role,
    ]);

    return (
      <div className="group cursor-pointer transition-transform duration-200 ease-out hover:scale-[99%] active:scale-[98%] rounded-2xl bg-gradient-to-br from-base-100 to-base-100 dark:from-base-200 dark:to-base-200 shadow-sm hover:shadow-lg hover:shadow-primary/10 border border-base-200/30 backdrop-blur-sm">
        <div className="p-4 sm:p-6">
          {/* Mobile Layout */}
          <div className="flex flex-col sm:hidden">
            {/* Header with Icon, Title and Actions */}
            <div className="flex items-start gap-2 mb-3">
              {/* Icon */}
              <div
                className={`p-3 rounded-xl bg-gradient-to-br flex-shrink-0 shadow-md transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-100 ${
                  assignment.type === "document"
                    ? "from-primary/80 via-primary to-primary/80 dark:from-primary/80 dark:via-primary/40 dark:to-primary/80"
                    : assignment.type === "form"
                    ? "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80"
                    : ""
                }`}>
                <TypeIcon
                  className={`w-5 h-5 ${getTypeColor(
                    assignment.type
                  )} group-hover:scale-110 transition-transform duration-100`}
                />
              </div>

              {/* Title and Type */}
              <div className="flex-1 min-w-0">
                <h3
                  className="text-base sm:text-lg font-bold text-base-content line-clamp-2 cursor-pointer group-hover:scale-105 transform-gpu duration-100 leading-tight"
                  onClick={() =>
                    navigate(
                      `/classrooms/${classroomCode}/assignment/${assignment.id}/preview?isTop=true`
                    )
                  }>
                  {assignment.title}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r backdrop-blur-sm transform hover:scale-105 transition-all text-white duration-100 mt-2 ${
                    assignment.type === "document"
                      ? "from-primary/80 via-primary to-primary/80 dark:from-primary/80 dark:via-primary/40 dark:to-primary/80"
                      : assignment.type === "form"
                      ? "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80"
                      : ""
                  }`}>
                  <TypeIcon className="w-3 h-3" />
                  {getTypeLabel(assignment.type)}
                </span>
              </div>

              {/* Mobile Actions */}
              <div className="relative group/menu">
                <button className="p-2.5 hover:bg-base-100 dark:hover:bg-base-200 rounded-xl transition-all duration-100 transform hover:scale-110">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                <div
                  className="absolute right-0 top-full mt-2 w-40 
                  bg-base-100 dark:bg-base-200/95 backdrop-blur-lg border border-base-200 
                  rounded-2xl shadow-xl 
                  opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible 
                  transition-all duration-100 
                  z-50 transform scale-95 group-hover/menu:scale-100">
                  <div className="p-2">
                    <button
                      onClick={() => onDelete(assignment.id)}
                      disabled={isDeleting}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-red-500/10 text-red-600 
                   rounded-xl transition-all duration-100 disabled:opacity-50 
                   flex items-center gap-2 font-medium">
                      {isDeleting ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Trash className="w-4 h-4" />
                      )}
                      Hapus Tugas
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Description - Mobile */}
            {/* {assignment.description && (
              <div className="text-sm text-base-content/60 mb-4 line-clamp-2 leading-relaxed">
                <div
                  className="prose prose-sm quill-content max-w-none text-base-content-70 leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                  dangerouslySetInnerHTML={{
                    __html: truncateHTML(assignment.description, 100),
                  }}
                />
              </div>
            )} */}

            {/* Meta Info - Mobile */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-base-content/60 mb-3">
              <div className="flex items-center gap-1 px-2 py-1 bg-base-100/40 dark:bg-base-200/40 rounded-lg">
                <Calendar className="w-3 h-3" />
                <span>{formatDateRelative(assignment.created_at)}</span>
              </div>
              {assignment.uploader && (
                <div className="flex items-center gap-1 px-2 py-1 bg-base-100/40 dark:bg-base-200/40 rounded-lg">
                  <User className="w-3 h-3" />
                  <span className="truncate max-w-20">
                    {assignment.uploader.name}
                  </span>
                </div>
              )}
            </div>

            {/* Stats - Mobile Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs text-base-content/60">
              {mobileStats}
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-start gap-2">
            {/* Icon */}
            <div
              className={`p-4 rounded-2xl bg-gradient-to-br flex-shrink-0 shadow-md transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-100 ${
                assignment.type === "document"
                  ? "from-primary/80 via-primary to-primary/80 dark:from-primary/80 dark:via-primary/40 dark:to-primary/80"
                  : assignment.type === "form"
                  ? "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80"
                  : ""
              }`}>
              <TypeIcon
                className={`w-6 h-6 ${getTypeColor(
                  assignment.type
                )} group-hover:scale-110 transition-transform duration-100`}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3
                    className="text-lg font-bold text-base-content transition-all cursor-pointer truncate group-hover:scale-105 transform-gpu duration-100"
                    onClick={() =>
                      navigate(
                        `/classrooms/${classroomCode}/assignment/${assignment.id}/preview?isTop=true`
                      )
                    }>
                    {assignment.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 mb-4 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r backdrop-blur-sm text-white transform hover:scale-105 transition-all duration-100 ${
                        assignment.type === "document"
                          ? "from-primary/80 via-primary to-primary/80 dark:from-primary/80 dark:via-primary/40 dark:to-primary/80"
                          : assignment.type === "form"
                          ? "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80"
                          : ""
                      }`}>
                      <TypeIcon className="w-3.5 h-3.5" />
                      {getTypeLabel(assignment.type)}
                    </span>

                    <div className="flex items-center gap-1.5 px-2 py-1 bg-base-100/60 dark:bg-base-200/60 rounded-lg text-xs text-base-content/60">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDateRelative(assignment.created_at)}</span>
                    </div>
                    {assignment.uploader && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-base-100/60 dark:bg-base-200/60 rounded-lg text-xs text-base-content/60">
                        <User className="w-3.5 h-3.5" />
                        <span>{assignment.uploader.name}</span>
                      </div>
                    )}
                  </div>
                  {/* Description */}
                  {/* {assignment.description && (
                    <div className="porse-xs bg-base-200 dark:bg-base-300/50 line-clamp-3 mb-1 leading-relaxed p-1.5 rounded">
                      <div
                        className="quill-content text-[16px]"
                        dangerouslySetInnerHTML={{
                          __html: truncateHTML(assignment.description, 100),
                        }}
                      />
                    </div>
                  )} */}

                  {/* Stats - Desktop */}
                  <div className="flex items-center gap-2 text-xs text-base-content/60 flex-wrap">
                    {desktopStats}
                  </div>
                </div>

                {/* Desktop Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-100 transform translate-x-4 group-hover:translate-x-0">
                  {desktopActions}
                  {currentUser.role !== "user" && (
                    <div className="relative group/menu">
                      <button className="p-2.5 hover:bg-base-100 dark:hover:bg-base-200 rounded-xl transition-all duration-100 transform hover:scale-110">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 top-full mt-2 w-40 bg-base-100 dark:bg-base-200/95 backdrop-blur-lg border border-base-200 rounded-2xl shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-100 z-10 transform scale-95 group-hover/menu:scale-100">
                        <div className="p-2">
                          <button
                            onClick={() => onDelete(assignment.id)}
                            disabled={isDeleting}
                            className="w-full px-4 py-3 text-left text-sm hover:bg-red-500/10 text-red-600 rounded-xl transition-all duration-100 disabled:opacity-50 flex items-center gap-2 font-medium">
                            {isDeleting ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Trash className="w-4 h-4" />
                            )}
                            Hapus Tugas
                          </button>
                        </div>
                      </div>
                    </div>
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
AssignmentListItem.displayName = "AssignmentListItem";

// Assignment Grid Item Component
const AssignmentGridItem = memo(
  ({
    currentUser,
    assignment,
    onEdit,
    onDelete,
    onDownload,
    onViewExternal,
    onViewDetail,
    isDownloading,
    navigate,
    classroomCode,
  }) => {
    const TypeIcon = getTypeIcon(assignment.type);

    const statsGrid = useMemo(() => {
      return [
        {
          icon: Eye,
          label: "Dilihat",
          shortLabel: "View",
          value: assignment.view_count || 0,
          color: "blue",
        },
        {
          icon: Download,
          label: "Diunduh",
          shortLabel: "Download",
          value: assignment.download_count || 0,
          color: "green",
        },
      ].map((stat) => (
        <div
          key={stat.label}
          className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-100 transform hover:scale-105 cursor-pointer ${
            stat.color === "blue"
              ? "border border-primary/10 bg-primary/10"
              : "border border-success/10 bg-success/10"
          }`}>
          <div className="flex items-center gap-1 sm:gap-2 mb-1">
            <stat.icon
              className={`w-3 sm:w-4 h-3 sm:h-4 ${
                stat.color === "blue" ? "text-blue-600" : "text-green-600"
              }`}
            />
            <span
              className={`text-xs font-semibold uppercase tracking-wide ${
                stat.color === "blue" ? "text-blue-700" : "text-green-700"
              }`}>
              <span className="hidden sm:inline">{stat.label}</span>
              <span className="sm:hidden">{stat.shortLabel}</span>
            </span>
          </div>
          <div
            className={`text-lg sm:text-xl font-bold ${
              stat.color === "blue" ? "text-blue-900" : "text-green-900"
            }`}>
            {stat.value}
          </div>
        </div>
      ));
    }, [assignment.view_count, assignment.download_count]);

    const actionsGrid = useMemo(() => {
      return [
        {
          onClick: () => onViewDetail(assignment.id),
          icon: Eye,
          label: "Detail",
          shortLabel: "Detail",
          color: "primary",
        },
        // hanya tampil kalau bukan role user
        ...(currentUser.role !== "user"
          ? [
              {
                onClick: () => onEdit(assignment.id),
                icon: Edit,
                color: "warning",
                label: "Edit",
              },
              {
                onClick: () => onDelete(assignment.id),
                icon: Trash,
                color: "error",
                label: "Delete",
              },
            ]
          : []),
        ...(assignment.file_path
          ? [
              {
                onClick: () => onDownload(assignment.id),
                icon: Download,
                label: "Unduh",
                shortLabel: "Unduh",
                color: "success",
                loading: isDownloading,
              },
            ]
          : []),
        ...(assignment.external_link
          ? [
              {
                onClick: () => onViewExternal(assignment),
                icon: ExternalLink,
                label: "Buka",
                shortLabel: "Buka",
                color: "info",
              },
            ]
          : []),
      ].map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          disabled={action.loading}
          className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm rounded-lg sm:rounded-xl font-medium transition-all duration-100 transform hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
            action.color === "primary"
              ? "bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-primary/25"
              : action.color === "warning"
              ? "bg-warning/10 text-warning hover:bg-warning/20 hover:shadow-warning/25"
              : action.color === "error"
              ? "bg-error/10 text-error hover:bg-error/20 hover:shadow-error/25"
              : "bg-base-200 text-base-content hover:bg-base-300"
          }`}>
          {action.loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <action.icon className="w-3 sm:w-4 h-3 sm:h-4" />
          )}
          <span className="hidden sm:inline">{action.label}</span>
          <span className="sm:hidden text-xs truncate">
            {action.shortLabel}
          </span>
        </button>
      ));
    }, [
      assignment.id,
      assignment.file_path,
      assignment.external_link,
      onViewDetail,
      onEdit,
      onDownload,
      onViewExternal,
      isDownloading,
    ]);

    return (
      <div className="group cursor-pointer transition-transform duration-200 ease-out hover:scale-[99%] active:scale-[98%] rounded-2xl bg-gradient-to-br from-base-100 to-base-100 dark:from-base-200 dark:to-base-200 shadow-sm hover:shadow-lg hover:shadow-primary/10 border border-base-200/30 backdrop-blur-sm">
        {/* Header */}
        <div
          className={`p-4 sm:p-6 bg-gradient-to-br rounded-t-2xl relative overflow-hidden ${
            assignment.type === "document"
              ? "from-primary/80 via-primary to-primary/80 dark:from-primary/80 dark:via-primary/40 dark:to-primary/80"
              : assignment.type === "form"
              ? "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80"
              : ""
          }`}>
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 opacity-10 transform rotate-12 translate-x-2 -translate-y-2">
            <TypeIcon className="w-full h-full" />
          </div>

          <div className="flex items-start gap-2 sm:gap-2 relative z-10">
            <div
              className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br flex-shrink-0 shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ${
                assignment.type === "document"
                  ? "from-primary/80 via-primary to-primary/80 dark:from-primary/80 dark:via-primary/40 dark:to-primary/80"
                  : assignment.type === "form"
                  ? "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80"
                  : ""
              }`}>
              <TypeIcon
                className={`w-6 sm:w-8 h-6 sm:h-8 ${getTypeColor(
                  assignment.type
                )} group-hover:scale-110 transition-transform duration-100`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="font-bold text-white bg-base-100/10 w-fit p-[4px] rounded transition-all cursor-pointer line-clamp-2 group-hover:scale-105 transform-gpu duration-100 text-base sm:text-lg leading-tight"
                onClick={() =>
                  navigate(
                    `/classrooms/${classroomCode}/assignment/${assignment.id}/preview?isTop=true`
                  )
                }>
                {assignment.title}
              </h3>
              <span
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold rounded-full mt-2 sm:mt-3 bg-gradient-to-r text-white backdrop-blur-sm shadow-sm transform hover:scale-105 transition-all duration-100 ${
                  assignment.type === "document"
                    ? "from-primary/80 via-primary to-primary/80 dark:from-primary/80 dark:via-primary/40 dark:to-primary/80"
                    : assignment.type === "form"
                    ? "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80"
                    : ""
                }`}>
                <TypeIcon className="w-3 sm:w-4 h-3 sm:h-4" />
                <span className="hidden sm:inline">
                  {getTypeLabel(assignment.type)}
                </span>
                <span className="sm:hidden">
                  {getTypeLabel(assignment.type).slice(0, 4)}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-2 sm:gap-2 mb-4 sm:mb-5">
            {statsGrid}
          </div>

          {/* Metadata */}
          <div className="space-y-2 mb-4 sm:mb-5 text-xs text-base-content/60">
            {assignment.uploader && (
              <div className="flex items-center gap-2 p-2 bg-base-100/50 rounded-lg">
                <User className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" />
                <span className="truncate text-xs sm:text-sm">
                  {assignment.uploader.name}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 p-2 bg-base-100/50 rounded-lg">
              <Calendar className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" />
              <span className="text-xs sm:text-sm">
                {formatDateRelative(assignment.created_at)}
              </span>
            </div>
          </div>

          {/* Actions - Mobile: Grid, Desktop: Flex */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            {actionsGrid}
          </div>
        </div>
      </div>
    );
  }
);
AssignmentGridItem.displayName = "AssignmentGridItem";

// ==================== MAIN COMPONENT ====================
const AssignmentPage = memo(() => {
  const { code: classroomCode } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);
  const {
    assignments,
    pagination,
    filters,
    status,
    deleteStatus,
    downloadStatus,
    isCached,
    fetchAssignmentsData,
    clearFilters,
    removeAssignment,
    downloadFile,
    incrementView,
    handlePageChange,
  } = useAssignments(classroomCode);

  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
  const [showFilters, setShowFilters] = useState(false);
  const [isManage, setIsManage] = useState(true);

  // Memoized values
  const isLoading = useMemo(() => status === "loading", [status]);
  const isDeleting = useMemo(() => deleteStatus === "loading", [deleteStatus]);
  const isDownloading = useMemo(
    () => downloadStatus === "loading",
    [downloadStatus]
  );

  // ==================== EVENT HANDLERS ====================

  const handleDelete = useCallback(
    async (assignmentId) => {
      if (!window.confirm("Apakah Anda yakin ingin menghapus tugas ini?")) {
        return;
      }
      await removeAssignment(assignmentId);
    },
    [removeAssignment]
  );

  const handleDownload = useCallback(
    async (assignmentId) => {
      await downloadFile(assignmentId);
    },
    [downloadFile]
  );

  const handleViewExternal = useCallback(
    (assignment) => {
      incrementView(assignment.id);
      window.open(assignment.external_link, "_blank", "noopener,noreferrer");
    },
    [incrementView]
  );
  const handleEdit = useCallback(
    (assignmentId) => {
      navigate(`/classrooms/${classroomCode}/assignment/${assignmentId}/edit`);
    },
    [incrementView]
  );

  const handleViewDetail = useCallback(
    (assignmentId) => {
      navigate(
        `/classrooms/${classroomCode}/assignment/${assignmentId}/preview?isTop=true`
      );
    },
    [incrementView]
  );

  const handleAddNew = useCallback((classroomCode) => {
    navigate(`/classrooms/${classroomCode}/assignment/create`);
    // setEditingAssignment(null);
    // setFormData(INITIAL_FORM_STATE);
    // setFormErrors({});
    // setShowModal(true);
  }, []);

  const listItems = useMemo(() => {
    return assignments.map((assignment) => (
      <div key={assignment.id} className="">
        <AssignmentListItem
          currentUser={currentUser}
          navigate={navigate}
          classroomCode={classroomCode}
          assignment={assignment}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onViewExternal={handleViewExternal}
          onViewDetail={handleViewDetail}
          isDeleting={isDeleting}
          isDownloading={isDownloading}
        />
      </div>
    ));
  }, [
    assignments,
    navigate,
    classroomCode,
    handleEdit,
    handleDelete,
    handleDownload,
    handleViewExternal,
    handleViewDetail,
    isDeleting,
    isDownloading,
  ]);

  const gridItems = useMemo(() => {
    return assignments.map((assignment) => (
      <div key={assignment.id} className="">
        <AssignmentGridItem
          currentUser={currentUser}
          classroomCode={classroomCode}
          navigate={navigate}
          assignment={assignment}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onViewExternal={handleViewExternal}
          onViewDetail={handleViewDetail}
          isDeleting={isDeleting}
          isDownloading={isDownloading}
        />
      </div>
    ));
  }, [
    assignments,
    navigate,
    classroomCode,
    handleEdit,
    handleDelete,
    handleDownload,
    handleViewExternal,
    handleViewDetail,
    isDeleting,
    isDownloading,
  ]);

  const paginationButtons = useMemo(() => {
    const currentPage = pagination.current_page;
    const lastPage = pagination.last_page;
    const pages = [];

    // Always show first page
    if (lastPage > 1) pages.push(1);

    // Add ellipsis if needed
    if (currentPage > 3) pages.push("...");

    // Add pages around current page
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(lastPage - 1, currentPage + 1);
      i++
    ) {
      if (!pages.includes(i)) pages.push(i);
    }

    // Add ellipsis if needed
    if (currentPage < lastPage - 2) pages.push("...");

    // Always show last page
    if (lastPage > 1 && !pages.includes(lastPage)) pages.push(lastPage);

    return pages.map((page, index) =>
      page === "..." ? (
        <span
          key={`ellipsis-${index}`}
          className="px-3 py-2 text-base-content/40 font-medium">
          ...
        </span>
      ) : (
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`px-4 py-2 text-sm rounded-xl font-semibold transition-all duration-100 transform hover:scale-110 ${
            pagination.current_page === page
              ? "bg-gradient-to-r from-primary to-primary/80 text-primary-content shadow-lg hover:shadow-xl hover:shadow-primary/25"
              : "bg-base-200/80 text-base-content hover:bg-base-300 hover:shadow-lg"
          }`}
          aria-current={pagination.current_page === page ? "page" : undefined}
          aria-label={`Halaman ${page}`}>
          {page}
        </button>
      )
    );
  }, [pagination.current_page, pagination.last_page, handlePageChange]);

  // ==================== RENDER ====================

  // Loading state
  if (!assignments && isLoading) {
    return (
      <div className="max-w-full mx-auto px-4 py-6">
        <div className="bg-gradient-to-br from-base-100/80 to-base-200/50 backdrop-blur-sm rounded-3xl shadow-xl border border-base-300/50">
          <div className="p-8">
            <div className="text-center py-16">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/40 rounded-2xl mx-auto flex items-center justify-center animate-pulse">
                  <FileText className="w-10 h-10 text-primary animate-bounce" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full animate-ping" />
              </div>
              <div className="flex justify-center">
                <CircularLoader />
              </div>
              <h3 className="text-xl font-bold text-base-content mb-2">
                Memuat Tugas Pembelajaran
              </h3>
              <p className="text-base-content/60">
                Sedang mengambil data tugas untuk kelas Anda...
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
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
                Tugas Pembelajaran
              </h1>
              <p className="text-base-content/70 text-sm">
                Kelola dan bagikan tugas pembelajaran untuk siswa Anda
              </p>
              <div className="flex items-center gap-2 text-xs text-base-content/60">
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span>Total: {assignments?.length || 0} tugas</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>siswa aktif</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-base-100/80 backdrop-blur-sm rounded-2xl p-1.5 border border-base-200/50">
                <button
                  onClick={() => setViewMode(VIEW_MODES.LIST)}
                  className={`p-3 rounded-xl transition-all duration-100 transform ${
                    viewMode === VIEW_MODES.LIST
                      ? "bg-gradient-to-r from-primary to-primary/80 text-primary-content scale-105"
                      : "text-base-content/60 hover:text-base-content hover:bg-base-200/50"
                  }`}
                  aria-label="Tampilan list">
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode(VIEW_MODES.GRID)}
                  className={`p-3 rounded-xl transition-all duration-100 transform ${
                    viewMode === VIEW_MODES.GRID
                      ? "bg-gradient-to-r from-primary to-primary/80 text-primary-content scale-105"
                      : "text-base-content/60 hover:text-base-content hover:bg-base-200/50"
                  }`}
                  aria-label="Tampilan grid">
                  <Grid className="w-5 h-5" />
                </button>
              </div>

              {/* Add New Button */}

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex text-sm active:-translate-y-1 items-center px-4 py-3 border md:hover:brightness-95 border-base-300 rounded-xl bg-base-100 dark:bg-base-300 text-base-content/80 font-semibold hover:bg-base-200/50 transition-all duration-100">
                {showFilters ? <ArrowUpNarrowWide /> : <ArrowDownNarrowWide />}
                <span className="md:block hidden">Search</span>
              </button>
              {currentUser.role !== "user" && (
                <button
                  onClick={() => handleAddNew(classroomCode)}
                  className="flex text-sm justify-center items-center gap-2 active:-translate-y-1 md:hover:brightness-95 px-4 py-3 border border-base-300 rounded-xl bg-primary text-gray-50 font-semibold transition-all duration-100">
                  <Plus className="w-5 h-5" />
                  <span>{"Tugas"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <AssignmentFilters
              fetchAssignmentsData={fetchAssignmentsData}
              filters={filters}
              clearFilters={clearFilters}
              isCached={isCached}
              status={status}
            />
          )}
        </div>
        <div className="flex w-fit justify-end gap-2 mb-4 items-center bg-base-100/80 backdrop-blur-sm rounded-2xl p-1.5 border border-base-200/50">
          <button
            onClick={() => setIsManage(true)}
            className={`flex items-center gap-2 p-3 rounded-xl transition-all duration-100 transform whitespace-nowrap  hover:scale-[99%] active:scale-[98%] ${
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
            className={`flex items-center gap-2 p-3 rounded-xl transition-all duration-100 transform whitespace-nowrap  hover:scale-[99%] active:scale-[98%] ${
              isManage === false
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-content scale-105"
                : "text-base-content/60 hover:text-base-content hover:bg-base-200/50"
            }`}
            aria-label="Statistic">
            <Grid className="w-5 h-5" />
            <span className="text-sm">Statistic</span>
          </button>
        </div>
        {/* Assignments Content */}
        {isManage === true ? (
          <>
            {isLoading && assignments.length === 0 ? (
              <div className="text-center py-16">
                <LoadingSpinner size="lg" className="mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-base-content mb-2">
                  Memuat tugas...
                </h3>
                <p className="text-base-content/60">
                  Tunggu sebentar, sedang mengambil data terbaru
                </p>
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/30 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                  <FileText className="w-16 h-16 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-base-content mb-4">
                  Belum Ada Tugas
                </h3>
                <p className="text-base-content/60  max-w-md mx-auto text-lg">
                  Mulai dengan menambahkan tugas pertama untuk kelas ini. Anda
                  dapat mengunggah dokumen, video, atau menambahkan link
                  pembelajaran.
                </p>
                {currentUser.role !== "user" && (
                  <button
                    onClick={() => handleAddNew(classroomCode)}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-primary/80 text-primary-content rounded-2xl hover:from-primary/90 hover:to-primary/70 transition-all duration-100 shadow-2xl hover:shadow-primary/25 transform hover:scale-105 hover:-translate-y-1 font-semibold text-lg">
                    <Plus className="w-6 h-6" />
                    <span>Tambah Tugas Pertama</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Assignments List/Grid */}
                <div className="">
                  {viewMode === VIEW_MODES.LIST ? (
                    <div className="space-y-2">{listItems}</div>
                  ) : (
                    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {gridItems}
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {pagination.total > pagination.per_page && (
                  <div className="mt-12 mx-4">
                    <div className="bg-gradient-to-r from-base-100/80 to-base-200/50 backdrop-blur-sm p-6 rounded-3xl border border-base-300/50 shadow-xl">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                        {/* Page Info */}
                        <div className="text-sm text-base-content/70 font-medium">
                          Menampilkan{" "}
                          <span className="font-bold text-primary">
                            {pagination.from || 0}
                          </span>{" "}
                          -{" "}
                          <span className="font-bold text-primary">
                            {pagination.to || 0}
                          </span>{" "}
                          dari{" "}
                          <span className="font-bold text-primary">
                            {pagination.total || 0}
                          </span>{" "}
                          tugas
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handlePageChange(pagination.current_page - 1)
                            }
                            disabled={pagination.current_page === 1}
                            className="px-4 py-2 text-sm bg-base-200/80 text-base-content rounded-xl hover:bg-base-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 font-medium hover:scale-105 hover:shadow-lg"
                            aria-label="Halaman sebelumnya">
                            Sebelumnya
                          </button>

                          <div className="flex items-center gap-2">
                            {paginationButtons}
                          </div>

                          <button
                            onClick={() =>
                              handlePageChange(pagination.current_page + 1)
                            }
                            disabled={
                              pagination.current_page === pagination.last_page
                            }
                            className="px-4 py-2 text-sm bg-base-200/80 text-base-content rounded-xl hover:bg-base-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 font-medium hover:scale-105 hover:shadow-lg"
                            aria-label="Halaman selanjutnya">
                            Selanjutnya
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div>
            <AssignmentChartPage assignments={assignments} />
          </div>
        )}
      </div>
    </ClassroomDetailParent>
  );
});
AssignmentPage.displayName = "AssignmentPage";

export default AssignmentPage;
