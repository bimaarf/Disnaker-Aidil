import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  BookOpen,
  Calendar,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Grid,
  List,
  MoreHorizontal,
  NotebookText,
  Plus,
  Trash,
  User,
  Users,
} from "lucide-react";
import React, { memo, useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CircularLoader } from "../../../../../../Components/_CircularLoader";
import MaterialFilters from "../../../../../../features/classroom/materialFilters";
import useMaterials from "../../../../../../features/classroom/materialHook";
import ClassroomDetailParent from "../../_classroomParent";
import { useSelector } from "react-redux";

// ==================== CONSTANTS ====================
const MATERIAL_TYPES = [
  {
    value: "document",
    label: "Dokumen",
    icon: BookOpen,
    color: "text-white",
  },
  {
    value: "material",
    label: "Catatan",
    icon: NotebookText,
    color: "text-white",
  },
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
  const typeConfig = MATERIAL_TYPES.find((t) => t.value === type);
  return typeConfig?.icon || FileText;
};

const getTypeLabel = (type) => {
  const typeConfig = MATERIAL_TYPES.find((t) => t.value === type);
  return typeConfig?.label || type;
};

const getTypeColor = (type) => {
  const typeConfig = MATERIAL_TYPES.find((t) => t.value === type);
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
// Material List Item Component
const MaterialListItem = memo(
  ({
    currentUser,
    material,
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
    const TypeIcon = getTypeIcon(material.type);

    const mobileStats = useMemo(() => {
      return [
        {
          icon: Eye,
          value: material.view_count || 0,
          label: "views",
        },
        {
          icon: Download,
          value: material.download_count || 0,
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
    }, [material.view_count, material.download_count]);

    const desktopStats = useMemo(() => {
      return [
        {
          icon: Eye,
          value: material.view_count || 0,
          label: "views",
        },
        {
          icon: Download,
          value: material.download_count || 0,
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
    }, [material.view_count, material.download_count]);

    const desktopActions = useMemo(() => {
      return [
        {
          onClick: () => onViewDetail(material.id),
          icon: Eye,
          color: "primary",
          label: "Detail",
        },
        ...(currentUser.role !== "user"
          ? [
              {
                onClick: () => onEdit(material.id),
                icon: Edit,
                color: "warning",
                label: "Edit",
              },
            ]
          : []),
        ...(material.file_path
          ? [
              {
                onClick: () => onDownload(material.id),
                icon: Download,
                color: "success",
                label: "Download",
                loading: isDownloading,
              },
            ]
          : []),
        ...(material.external_link
          ? [
              {
                onClick: () => onViewExternal(material),
                icon: ExternalLink,
                color: "info",
                label: "Open",
              },
            ]
          : []),
      ].map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          disabled={action.loading}
          className={`p-2.5 rounded-xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
            action.color === "primary"
              ? "bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-primary/25"
              : action.color === "warning"
              ? "bg-warning/10 text-warning hover:bg-warning/20 hover:shadow-warning/25"
              : action.color === "error"
              ? "bg-error/10 text-error hover:bg-error/20 hover:shadow-error/25"
              : "bg-base-200 text-base-content hover:bg-base-300"
          }`}
          aria-label={`${action.label} ${material.title}`}>
          {action.loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <action.icon className="w-4 h-4" />
          )}
        </button>
      ));
    }, [
      material.id,
      material.file_path,
      material.external_link,
      material.title,
      onViewDetail,
      onEdit,
      onDownload,
      onViewExternal,
      isDownloading,
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
                className={`p-3 rounded-xl bg-gradient-to-br flex-shrink-0 shadow-md transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ${
                  material.type === "document"
                    ? "from-warning/80 via-warning to-warning/80 dark:from-warning/80 dark:via-warning/40 dark:to-warning/80"
                    : material.type === "material"
                    ? "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80"
                    : ""
                }`}>
                <TypeIcon
                  className={`w-5 h-5 ${getTypeColor(
                    material.type
                  )} group-hover:scale-110 transition-transform duration-300`}
                />
              </div>

              {/* Title and Type */}
              <div className="flex-1 min-w-0">
                <h3
                  className="text-base sm:text-lg font-bold text-base-content line-clamp-2 cursor-pointer group-hover:scale-105 transform-gpu duration-300 leading-tight"
                  onClick={() =>
                    navigate(
                      `/classrooms/${classroomCode}/material/${material.id}/preview?isTop=true`
                    )
                  }>
                  {material.title}
                </h3>
                <span
                  className={`inline-flex text-white items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r backdrop-blur-sm  transform hover:scale-105 transition-all duration-300 mt-2 ${
                    material.type === "document"
                      ? "from-warning/80 via-warning to-warning/80 dark:from-warning/80 dark:via-warning/40 dark:to-warning/80"
                      : material.type === "material"
                      ? "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80"
                      : ""
                  }`}>
                  <TypeIcon className="w-3 h-3" />
                  {getTypeLabel(material.type)}
                </span>
              </div>

              {/* Mobile Actions */}
              <div className="relative group/menu">
                <button className="p-2 hover:bg-base-100 dark:hover:bg-base-200 rounded-lg transition-all duration-300">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-44 bg-base-100 dark:bg-base-200/95 backdrop-blur-lg border border-base-200 rounded-2xl shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-300 z-20 transform scale-95 group-hover/menu:scale-100">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => onViewDetail(material.id)}
                      className="w-full px-3 py-2.5 text-left text-sm hover:bg-blue-500/10 text-blue-600 rounded-lg transition-all duration-300 flex items-center gap-2 font-medium">
                      <Eye className="w-4 h-4" />
                      Lihat Detail
                    </button>
                    {currentUser.role !== "user" && (
                      <>
                        <button
                          onClick={() => onEdit(material.id)}
                          className="w-full px-3 py-2.5 text-left text-sm hover:bg-yellow-500/10 text-yellow-600 rounded-lg transition-all duration-300 flex items-center gap-2 font-medium">
                          <Edit className="w-4 h-4" />
                          Edit Materi
                        </button>
                        <div className="border-t border-base-200 my-1"></div>
                        <button
                          onClick={() => onDelete(material.id)}
                          disabled={isDeleting}
                          className="w-full px-3 py-2.5 text-left text-sm hover:bg-red-500/10 text-red-600 rounded-lg transition-all duration-300 disabled:opacity-50 flex items-center gap-2 font-medium">
                          {isDeleting ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Trash className="w-4 h-4" />
                          )}
                          Hapus Materi
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Meta Info - Mobile */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-base-content/60 mb-3">
              <div className="flex items-center gap-1 px-2 py-1 bg-base-100/40 dark:bg-base-200/40 rounded-lg">
                <Calendar className="w-3 h-3" />
                <span>{formatDateRelative(material.created_at)}</span>
              </div>
              {material.uploader && (
                <div className="flex items-center gap-1 px-2 py-1 bg-base-100/40 dark:bg-base-200/40 rounded-lg">
                  <User className="w-3 h-3" />
                  <span className="truncate max-w-20">
                    {material.uploader.name}
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
              className={`p-4 rounded-2xl bg-gradient-to-br flex-shrink-0 shadow-md transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ${
                material.type === "document"
                  ? "from-warning/80 via-warning to-warning/80 dark:from-warning/80 dark:via-warning/40 dark:to-warning/80"
                  : material.type === "material"
                  ? "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80"
                  : ""
              }`}>
              <TypeIcon
                className={`w-6 h-6 ${getTypeColor(
                  material.type
                )} group-hover:scale-110 transition-transform duration-300`}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3
                    className="text-lg font-bold text-base-content transition-all cursor-pointer truncate group-hover:scale-105 transform-gpu duration-300"
                    onClick={() =>
                      navigate(
                        `/classrooms/${classroomCode}/material/${material.id}/preview?isTop=true`
                      )
                    }>
                    {material.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 mb-4 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r backdrop-blur-sm text-white transform hover:scale-105 transition-all duration-300 ${
                        material.type === "document"
                          ? "from-warning/80 via-warning to-warning/80 dark:from-warning/80 dark:via-warning/40 dark:to-warning/80"
                          : material.type === "material"
                          ? "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80"
                          : ""
                      }`}>
                      <TypeIcon className="w-3.5 h-3.5" />
                      {getTypeLabel(material.type)}
                    </span>

                    <div className="flex items-center gap-1.5 px-2 py-1 bg-base-100/60 dark:bg-base-200/60 rounded-lg text-xs text-base-content/60">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDateRelative(material.created_at)}</span>
                    </div>
                    {material.uploader && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-base-100/60 dark:bg-base-200/60 rounded-lg text-xs text-base-content/60">
                        <User className="w-3.5 h-3.5" />
                        <span>{material.uploader.name}</span>
                      </div>
                    )}
                  </div>
                  {/* Description */}
                  {/* {material.description && (
                    <div className="porse-xs bg-base-200 dark:bg-base-300/50 line-clamp-3 mb-1 leading-relaxed p-1.5 rounded">
                      <div
                        className="quill-content text-[16px]"
                        dangerouslySetInnerHTML={{
                          __html: truncateHTML(material.description, 100),
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
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                  {desktopActions}
                  {currentUser.role !== "user" && (
                    <>
                      <div className="relative group/menu">
                        <button className="p-2.5 hover:bg-base-100 dark:hover:bg-base-200 rounded-xl transition-all duration-300 transform hover:scale-110">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-40 bg-base-100 dark:bg-base-200/95 backdrop-blur-lg border border-base-200 rounded-2xl shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-300 z-10 transform scale-95 group-hover/menu:scale-100">
                          <div className="p-2">
                            <button
                              onClick={() => onDelete(material.id)}
                              disabled={isDeleting}
                              className="w-full px-4 py-3 text-left text-sm hover:bg-red-500/10 text-red-600 rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center gap-2 font-medium">
                              {isDeleting ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <Trash className="w-4 h-4" />
                              )}
                              Hapus Materi
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
MaterialListItem.displayName = "MaterialListItem";

// Material Grid Item Component
const MaterialGridItem = memo(
  ({
    currentUser,
    material,
    onEdit,
    onDownload,
    onViewExternal,
    onViewDetail,
    isDownloading,
    navigate,
    classroomCode,
  }) => {
    const TypeIcon = getTypeIcon(material.type);

    const statsGrid = useMemo(() => {
      return [
        {
          icon: Eye,
          label: "Dilihat",
          shortLabel: "View",
          value: material.view_count || 0,
          color: "blue",
        },
        {
          icon: Download,
          label: "Diunduh",
          shortLabel: "Download",
          value: material.download_count || 0,
          color: "green",
        },
      ].map((stat) => (
        <div
          key={stat.label}
          className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 cursor-pointer ${
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
    }, [material.view_count, material.download_count]);

    const actionsGrid = useMemo(() => {
      return [
        {
          onClick: () => onViewDetail(material.id),
          icon: Eye,
          label: "Detail",
          shortLabel: "Detail",
          color: "primary",
        },
        ...(currentUser.role !== "user"
          ? [
              {
                onClick: () => onEdit(material.id),
                icon: Edit,
                label: "Edit",
                shortLabel: "Edit",
                color: "warning",
              },
            ]
          : []),
        ...(material.file_path
          ? [
              {
                onClick: () => onDownload(material.id),
                icon: Download,
                label: "Unduh",
                shortLabel: "Unduh",
                color: "success",
                loading: isDownloading,
              },
            ]
          : []),
        ...(material.external_link
          ? [
              {
                onClick: () => onViewExternal(material),
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
          className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm rounded-lg sm:rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
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
      material.id,
      material.file_path,
      material.external_link,
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
            material.type === "document"
              ? "from-warning/80 via-warning to-warning/80 dark:from-warning/80 dark:via-warning/40 dark:to-warning/80"
              : material.type === "material"
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
                material.type === "document"
                  ? "from-warning/80 via-warning to-warning/80 dark:from-warning/80 dark:via-warning/40 dark:to-warning/80"
                  : material.type === "material"
                  ? "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80"
                  : ""
              }`}>
              <TypeIcon
                className={`w-6 sm:w-8 h-6 sm:h-8 ${getTypeColor(
                  material.type
                )} group-hover:scale-110 transition-transform duration-300`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="font-bold text-white bg-base-100/10 w-fit p-[4px] rounded transition-all cursor-pointer line-clamp-2 group-hover:scale-105 transform-gpu duration-300 text-base sm:text-lg leading-tight"
                onClick={() =>
                  navigate(
                    `/classrooms/${classroomCode}/material/${material.id}/preview?isTop=true`
                  )
                }>
                {material.title}
              </h3>
              <span
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold rounded-full mt-2 sm:mt-3 bg-gradient-to-r text-white backdrop-blur-sm shadow-sm transform hover:scale-105 transition-all duration-300 ${
                  material.type === "document"
                    ? "from-warning/80 via-warning to-warning/80 dark:from-warning/80 dark:via-warning/40 dark:to-warning/80"
                    : material.type === "material"
                    ? "from-error/80 via-error to-error/80 dark:from-error/80 dark:via-error/40 dark:to-error/80"
                    : ""
                }`}>
                <TypeIcon className="w-3 sm:w-4 h-3 sm:h-4" />
                <span className="hidden sm:inline">
                  {getTypeLabel(material.type)}
                </span>
                <span className="sm:hidden">
                  {getTypeLabel(material.type).slice(0, 4)}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* Description */}
          {/* {material.description && (
            <div className="text-sm text-base-content/70 mb-4 sm:mb-5 line-clamp-2 sm:line-clamp-3 leading-relaxed">
              <div
                className="prose prose-sm max-w-none text-base-content/80 leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                dangerouslySetInnerHTML={{
                  __html: truncateHTML(material.description, 100),
                }}
              />
            </div>
          )} */}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2 mb-4 sm:mb-5">
            {statsGrid}
          </div>

          {/* Metadata */}
          <div className="space-y-2 mb-4 sm:mb-5 text-xs text-base-content/60">
            {material.uploader && (
              <div className="flex items-center gap-2 p-2 bg-base-100/50 rounded-lg">
                <User className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" />
                <span className="truncate text-xs sm:text-sm">
                  {material.uploader.name}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 p-2 bg-base-100/50 rounded-lg">
              <Calendar className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" />
              <span className="text-xs sm:text-sm">
                {formatDateRelative(material.created_at)}
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
MaterialGridItem.displayName = "MaterialGridItem";

// ==================== MAIN COMPONENT ====================
const MaterialPage = memo(() => {
  const { code: classroomCode } = useParams();
  const navigate = useNavigate();

  const {
    materials,
    pagination,
    filters,
    status,
    deleteStatus,
    downloadStatus,
    isCached,
    fetchMaterialsData,
    clearFilters,
    removeMaterial,
    downloadFile,
    incrementView,
    handlePageChange,
  } = useMaterials(classroomCode);

  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
  const [showFilters, setShowFilters] = useState(false);
  const currentUser = useSelector((state) => state.auth.user);
  // Memoized values
  const isLoading = useMemo(() => status === "loading", [status]);
  const isDeleting = useMemo(() => deleteStatus === "loading", [deleteStatus]);
  const isDownloading = useMemo(
    () => downloadStatus === "loading",
    [downloadStatus]
  );

  // ==================== EVENT HANDLERS ====================

  const handleDelete = useCallback(
    async (materialId) => {
      if (!window.confirm("Apakah Anda yakin ingin menghapus materi ini?")) {
        return;
      }
      await removeMaterial(materialId);
    },
    [removeMaterial]
  );

  const handleDownload = useCallback(
    async (materialId) => {
      await downloadFile(materialId);
    },
    [downloadFile]
  );

  const handleViewExternal = useCallback(
    (material) => {
      incrementView(material.id);
      window.open(material.external_link, "_blank", "noopener,noreferrer");
    },
    [incrementView]
  );
  const handleEdit = useCallback(
    (materialId) => {
      navigate(`/classrooms/${classroomCode}/material/${materialId}/edit`);
    },
    [incrementView]
  );

  const handleViewDetail = useCallback(
    (materialId) => {
      navigate(
        `/classrooms/${classroomCode}/material/${materialId}/preview?isTop=true`
      );
    },
    [incrementView]
  );

  const handleAddNew = useCallback((classroomCode) => {
    navigate(`/classrooms/${classroomCode}/material/create`);
    // setEditingMaterial(null);
    // setFormData(INITIAL_FORM_STATE);
    // setFormErrors({});
    // setShowModal(true);
  }, []);

  const listItems = useMemo(() => {
    return materials.map((material) => (
      <div key={material.id} className="">
        <MaterialListItem
          currentUser={currentUser}
          navigate={navigate}
          classroomCode={classroomCode}
          material={material}
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
    materials,
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
    return materials.map((material) => (
      <div key={material.id} className="">
        <MaterialGridItem
          currentUser={currentUser}
          classroomCode={classroomCode}
          navigate={navigate}
          material={material}
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
    materials,
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
          className={`px-4 py-2 text-sm rounded-xl font-semibold transition-all duration-300 transform hover:scale-110 ${
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
  if (!materials && isLoading) {
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
                Memuat Materi Pembelajaran
              </h3>
              <p className="text-base-content/60">
                Sedang mengambil data materi untuk kelas Anda...
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
                Materi Pembelajaran
              </h1>
              <p className="text-base-content/70 text-sm">
                Kelola dan bagikan materi pembelajaran untuk siswa Anda
              </p>
              <div className="flex items-center gap-2 text-xs text-base-content/60">
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span>Total: {materials?.length || 0} materi</span>
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
                  className={`p-3 rounded-xl transition-all duration-300 transform ${
                    viewMode === VIEW_MODES.LIST
                      ? "bg-gradient-to-r from-primary to-primary/80 text-primary-content scale-105"
                      : "text-base-content/60 hover:text-base-content hover:bg-base-200/50"
                  }`}
                  aria-label="Tampilan list">
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode(VIEW_MODES.GRID)}
                  className={`p-3 rounded-xl transition-all duration-300 transform ${
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
                className="inline-flex text-sm active:-translate-y-1 items-center px-4 py-3 border md:hover:brightness-95 border-base-300 rounded-xl bg-base-100 dark:bg-base-300 text-base-content/80 font-semibold hover:bg-base-200/50 transition-all duration-200">
                {showFilters ? <ArrowUpNarrowWide /> : <ArrowDownNarrowWide />}
                <span className="md:block hidden">Search</span>
              </button>
              {currentUser.role !== "user" && (
                <button
                  onClick={() => handleAddNew(classroomCode)}
                  className="flex text-sm justify-center items-center gap-2 active:-translate-y-1 md:hover:brightness-95 px-4 py-3 border border-base-300 rounded-xl bg-primary text-gray-50 font-semibold transition-all duration-200">
                  <Plus className="w-5 h-5" />
                  <span>{"Materi"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <MaterialFilters
              fetchMaterialsData={fetchMaterialsData}
              filters={filters}
              clearFilters={clearFilters}
              isCached={isCached}
              status={status}
            />
          )}
        </div>

        {/* Materials Content */}
        {isLoading && materials.length === 0 ? (
          <div className="text-center py-16">
            <LoadingSpinner size="lg" className="mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-base-content mb-2">
              Memuat materi...
            </h3>
            <p className="text-base-content/60">
              Tunggu sebentar, sedang mengambil data terbaru
            </p>
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/30 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <FileText className="w-16 h-16 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-base-content mb-4">
              Belum Ada Materi
            </h3>
            <p className="text-base-content/60 mb-4 max-w-md mx-auto text-lg">
              Mulai dengan menambahkan materi pertama untuk kelas ini. Anda
              dapat mengunggah dokumen, video, atau menambahkan link
              pembelajaran.
            </p>
            {currentUser.role !== "user" && (
              <button
                onClick={() => handleAddNew(classroomCode)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-primary/80 text-primary-content rounded-2xl hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-2xl hover:shadow-primary/25 transform hover:scale-105 hover:-translate-y-1 font-semibold text-lg">
                <Plus className="w-6 h-6" />
                <span>Tambah Materi Pertama</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Materials List/Grid */}
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
                      materi
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handlePageChange(pagination.current_page - 1)
                        }
                        disabled={pagination.current_page === 1}
                        className="px-4 py-2 text-sm bg-base-200/80 text-base-content rounded-xl hover:bg-base-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium hover:scale-105 hover:shadow-lg"
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
                        className="px-4 py-2 text-sm bg-base-200/80 text-base-content rounded-xl hover:bg-base-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium hover:scale-105 hover:shadow-lg"
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
      </div>
    </ClassroomDetailParent>
  );
});
MaterialPage.displayName = "MaterialPage";

export default MaterialPage;
