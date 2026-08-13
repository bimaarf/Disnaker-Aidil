import {
  AlertTriangle,
  Clock,
  Download,
  Eye,
  FileIcon,
  NotebookPen,
  Save,
  Send,
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  Users,
  User,
  Calendar,
  Award,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  memo,
  useMemo,
} from "react";
import { useAssignmentSubmission } from "../../../../../../features/classroom/assignmentHook";
import { toast } from "react-toastify";
import useIsMobile from "../../../../../../Context/__useIsMobile";

// ==================== CONSTANTS ====================
// File size limit (40MB)
const MAX_FILE_SIZE = 20 * 4096 * 4096;

// Allowed file types for submission
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/png",
  "image/gif",
];

// ==================== UTILITY FUNCTIONS ====================
const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFileSize = (bytes) => {
  // Handle undefined, null, or non-numeric values
  if (!bytes || isNaN(bytes) || bytes === 0) return "0 bytes";

  // Convert to number if it's a string
  const numBytes = typeof bytes === "string" ? parseInt(bytes, 10) : bytes;
  if (isNaN(numBytes)) return "0 bytes";

  const k = 1024;
  const sizes = ["bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));

  return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getSubmissionStatusConfig = (status) => {
  const configs = {
    draft: {
      text: "Draft",
      color: "yellow",
      bgColor: "bg-warning/5",
      textColor: "text-warning",
      borderColor: "border-warning/10",
      canEdit: true,
      icon: "📝",
    },
    submitted: {
      text: "Dikumpulkan",
      color: "green",
      bgColor: "bg-success/5",
      textColor: "text-success",
      borderColor: "border-success/10",
      canEdit: false,
      icon: "✅",
    },
    graded: {
      text: "Dinilai",
      color: "blue",
      bgColor: "bg-primary/5",
      textColor: "text-primary",
      borderColor: "border-primary/10",
      canEdit: false,
      icon: "📊",
    },
    returned: {
      text: "Dikembalikan",
      color: "red",
      bgColor: "bg-error/5",
      textColor: "text-error",
      borderColor: "border-error/10",
      canEdit: true,
      icon: "🔄",
    },
  };

  return configs[status] || configs.draft;
};

// ==================== UI COMPONENTS ====================
const LoadingSpinner = memo(({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  return (
    <div className="relative inline-block">
      <div
        className={`border-2 border-primary/20 rounded-full animate-spin ${sizeClasses[size]} ${className}`}
        aria-label="Memuat"
      />
      <div
        className={`absolute inset-0 border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin ${sizeClasses[size]}`}
      />
    </div>
  );
});
LoadingSpinner.displayName = "LoadingSpinner";

const ErrorMessage = memo(({ error, className = "" }) => {
  if (!error) return null;
  const errorText =
    typeof error === "string"
      ? error
      : error?.message ||
        (Array.isArray(error) ? error.join(", ") : "Terjadi kesalahan");

  return (
    <div
      className={`flex items-center gap-2 text-error text-sm bg-error/5 border border-error/20 rounded-lg px-4 py-3 shadow-sm ${className}`}>
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span className="font-medium">{errorText}</span>
    </div>
  );
});
ErrorMessage.displayName = "ErrorMessage";

const ActionButton = memo(
  ({
    onClick,
    icon: Icon,
    label,
    color = "primary",
    disabled = false,
    loading = false,
    size = "md",
    className = "",
  }) => {
    const baseClasses =
      "flex items-center justify-center gap-2 font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed rounded-lg";
    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };
    const colorClasses = {
      primary: "bg-primary text-primary-content hover:bg-primary/90",
      warning: "bg-warning text-warning-content hover:bg-warning/90",
      error: "bg-error text-error-content hover:bg-error/90",
      success: "bg-success text-success-content hover:bg-success/90",
      info: "bg-info text-info-content hover:bg-info/90",
      secondary: "bg-secondary text-secondary-content hover:bg-secondary/90",
      ghost: "bg-base-200 text-base-content hover:bg-base-300",
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`${baseClasses} ${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
        {loading ? <LoadingSpinner size="sm" /> : <Icon className="w-4 h-4" />}
        <span>{loading ? "Memuat..." : label}</span>
      </button>
    );
  }
);
ActionButton.displayName = "ActionButton";

// ==================== SUBMISSION LIST SIDEBAR COMPONENT ====================
const SubmissionListSidebar = memo(
  ({ submissions, activeSubmissionId, onSelectSubmission, currentUserId }) => {
    const [activeTab, setActiveTab] = useState("all");

    // Memoize filtered submissions and stats
    const { filteredSubmissions, stats } = useMemo(() => {
      const filtered =
        submissions?.filter((submission) => {
          if (activeTab === "all") return true;
          if (activeTab === "submitted")
            return submission.status === "submitted";
          if (activeTab === "graded") return submission.status === "graded";
          if (activeTab === "draft") return submission.status === "draft";
          if (activeTab === "returned") return submission.status === "returned";
          return true;
        }) || [];

      const statsCalc = {
        all: submissions?.length || 0,
        submitted:
          submissions?.filter((s) => s.status === "submitted").length || 0,
        graded: submissions?.filter((s) => s.status === "graded").length || 0,
        draft: submissions?.filter((s) => s.status === "draft").length || 0,
        returned:
          submissions?.filter((s) => s.status === "returned").length || 0,
      };

      return { filteredSubmissions: filtered, stats: statsCalc };
    }, [submissions, activeTab]);

    return (
      <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm rounded-2xl border border-base-200/50 p-2 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-base-300/80">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="text-base font-semibold text-base-content">
              Daftar Pengumpulan
            </h3>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1">
            {[
              { id: "all", label: "Semua", icon: Users },
              { id: "submitted", label: "Dikumpul", icon: Send },
              { id: "graded", label: "Dinilai", icon: Award },
              { id: "draft", label: "Draft", icon: NotebookPen },
              { id: "returned", label: "Dikembalikan", icon: X },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1 active:-scale[99%] duration-200 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-content"
                    : "bg-base-200/50 text-base-content/70 hover:bg-base-200"
                }`}>
                <tab.icon className="w-3 h-3" />
                {tab.label}
                <span
                  className={`ml-1 px-1 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? "bg-primary-content/20 text-primary-content"
                      : "bg-base-content/10 text-base-content/70"
                  }`}>
                  {stats[tab.id]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Submission List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-96">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-6 text-base-content/50">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Tidak ada pengumpulan</p>
            </div>
          ) : (
            filteredSubmissions.map((submission) => {
              const isActive = submission.id === activeSubmissionId;
              const statusConfig = getSubmissionStatusConfig(submission.status);
              const isOwn = submission.student_id === currentUserId;

              return (
                <button
                  key={submission.id}
                  onClick={() => onSelectSubmission(submission)}
                  className={`w-full text-left p-3 rounded-lg transition-all border ${
                    isActive
                      ? "bg-primary/5 border-primary/20"
                      : "bg-transparent border-base-300/80 hover:bg-base-200/50"
                  }`}>
                  <div className="flex items-start gap-2">
                    {/* Avatar/Icon */}
                    <div
                      className={`p-1.5 rounded-md ${
                        isActive ? "bg-primary/10" : "bg-base-200/50"
                      }`}>
                      <User
                        className={`w-3 h-3 ${
                          isActive ? "text-primary" : "text-base-content/50"
                        }`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className={`font-medium text-sm truncate ${
                            isActive ? "text-primary" : "text-base-content"
                          }`}>
                          {submission.student?.name || "Siswa Tidak Dikenal"}
                          {isOwn && (
                            <span className="ml-1 text-xs text-primary/80">
                              (Anda)
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 justify-end">
                          {submission.points !== null &&
                            submission.points !== undefined && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium text-warning">
                                <Award className="w-2.5 h-2.5" />
                                {submission.points}
                                {submission.max_points
                                  ? `/${submission.max_points}`
                                  : ""}
                              </span>
                            )}
                          {isActive && (
                            <ChevronRight className="w-3 h-3 text-primary" />
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-base-content/50 truncate">
                        {submission.student?.email}
                      </p>

                      {/* Status Badge */}
                      <div className="flex items-baseline gap-1 mt-2 justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}>
                            <span className="text-xs">{statusConfig.text}</span>
                          </span>

                          {submission.is_late && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-error/5 text-error border border-error/10">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Terlambat
                            </span>
                          )}
                        </div>

                        {/* Submission Time */}
                        {submission.submitted_at && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-base-content/40">
                            <Calendar className="w-3 h-3" />
                            {new Date(
                              submission.submitted_at
                            ).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-base-300/80 bg-base-100/50">
          <div className="grid grid-cols-2 gap-2 text-xs text-base-content/60">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
              Dikumpul: {stats.submitted}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              Dinilai: {stats.graded}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-warning"></div>
              Draft: {stats.draft}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-error"></div>
              Dikembalikan: {stats.returned}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
SubmissionListSidebar.displayName = "SubmissionListSidebar";

// ==================== SUBMISSION COMPONENTS ====================
const SubmissionStatusBadge = memo(({ status, isLate }) => {
  const config = getSubmissionStatusConfig(status);

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
        <span>{config.icon}</span>
        {config.text}
      </span>
      {isLate && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-error/10 text-error border border-error/20">
          <AlertTriangle className="w-3 h-3" />
          Terlambat
        </span>
      )}
    </div>
  );
});
SubmissionStatusBadge.displayName = "SubmissionStatusBadge";

const SubmissionFileItem = memo(
  ({
    file,
    onRemove,
    onDownloadFile,
    onView,
    disabled = false,
    isDeleting = false,
  }) => {
    const [isRemoving, setIsRemoving] = useState(false);

    const handleRemove = useCallback(async () => {
      if (disabled || isRemoving) return;

      setIsRemoving(true);
      try {
        const result = await onRemove(file);
        if (!result?.success) {
          setIsRemoving(false);
        }
      } catch (error) {
        console.error("Remove file error:", error);
        setIsRemoving(false);
      }
    }, [disabled, isRemoving, onRemove, file]);

    const handleView = useCallback(() => {
      if (onView) onView(file);
    }, [onView, file]);

    const handleDownload = useCallback(() => {
      if (onDownloadFile) onDownloadFile(file);
    }, [onDownloadFile, file]);

    return (
      <div className="flex items-center justify-between gap-2 p-3 bg-base-200/30 rounded-lg border border-base-300/80">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="p-1.5 rounded-md bg-info/10 text-info">
            <FileIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-base-content truncate">
              {file.original_name || file.name}
            </div>
            <div className="text-xs text-base-content/50">
              {formatFileSize(file.file_size || file.size)}
              {file.uploaded_at && (
                <span className="ml-2">• {formatDate(file.uploaded_at)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {onView && (file.path || file.download_url) && (
            <button
              onClick={handleView}
              disabled={disabled}
              className="p-1 rounded bg-info/10 text-info hover:bg-info/20 transition-colors disabled:opacity-50"
              title="Lihat file">
              <Eye className="w-4 h-4" />
            </button>
          )}
          {onDownloadFile && (file.download_url || file.path) && (
            <button
              onClick={handleDownload}
              disabled={disabled}
              className="p-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
              title="Download file">
              <Download className="w-4 h-4" />
            </button>
          )}
          {onRemove && (
            <button
              onClick={handleRemove}
              disabled={disabled}
              className="p-1 rounded bg-error/10 text-error hover:bg-error/20 transition-colors disabled:opacity-50"
              title={isRemoving ? "Menghapus..." : "Hapus file"}>
              {isRemoving || isDeleting ? (
                <LoadingSpinner size="sm" className="text-error" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  }
);

SubmissionFileItem.displayName = "SubmissionFileItem";

const FileUploadArea = memo(
  ({
    onFilesSelected,
    acceptedTypes = ALLOWED_FILE_TYPES,
    maxSize = MAX_FILE_SIZE,
    disabled = false,
  }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = useCallback(
      (e) => {
        e.preventDefault();
        if (!disabled) setIsDragOver(true);
      },
      [disabled]
    );

    const handleDragLeave = useCallback((e) => {
      e.preventDefault();
      setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(
      (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (disabled) return;
        const files = Array.from(e.dataTransfer.files);
        onFilesSelected(files);
      },
      [onFilesSelected, disabled]
    );

    const handleFileSelect = useCallback(
      (e) => {
        const files = Array.from(e.target.files);
        onFilesSelected(files);
        e.target.value = "";
      },
      [onFilesSelected]
    );

    const handleClick = useCallback(() => {
      if (!disabled && fileInputRef.current) fileInputRef.current.click();
    }, [disabled]);

    return (
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all ${
          disabled
            ? "border-base-300/80 bg-base-100/30 cursor-not-allowed"
            : isDragOver
            ? "border-primary bg-primary/5"
            : "border-base-300/80 hover:border-primary/50 bg-base-100/50 cursor-pointer"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileSelect}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="space-y-2">
          <div
            className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
              disabled ? "bg-base-200/50" : "bg-primary/10"
            }`}>
            <Upload
              className={`w-5 h-5 ${
                disabled ? "text-base-content/30" : "text-primary"
              }`}
            />
          </div>

          <div>
            <p
              className={`font-medium text-sm ${
                disabled ? "text-base-content/30" : "text-base-content"
              }`}>
              {disabled
                ? "Upload tidak tersedia"
                : "Klik atau seret file ke sini untuk upload"}
            </p>
            <p className="text-xs text-base-content/50 mt-1">
              Maksimal {formatFileSize(maxSize)} per file
            </p>
            <p className="text-xs text-base-content/40 mt-0.5">
              Format yang didukung: PDF, DOC/X, PPT/X, TXT, JPG, PNG, GIF
            </p>
          </div>
        </div>
      </div>
    );
  }
);
FileUploadArea.displayName = "FileUploadArea";

// ==================== SUBMISSION SECTION COMPONENT ====================
const SubmissionSection = memo(
  ({
    assignment,
    setShowSidebar,
    showSidebar,
    submission,
    error,
    onRemove,
    onDownloadFile,
    onView,
    isAdminOrTeacher,
    allSubmissions,
  }) => {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            {isAdminOrTeacher && allSubmissions?.length > 0 && (
              <div
                onClick={() => setShowSidebar(!showSidebar)}
                className="cursor-pointer flex items-center gap-1 hover:scale-[99%] active:scale-[98%]">
                <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  {allSubmissions.length}
                </span>
                <ChevronLeft
                  className={`w-5 h-5 text-primary transition-all duration-500  ${
                    showSidebar ? "rotate-0" : "rotate-180"
                  }`}
                />
              </div>
            )}
            <div>
              <h2 className="text-base font-semibold text-base-content flex items-center gap-2">
                {submission.student?.name}
              </h2>
              <p className="text-sm text-base-content/60">
                {submission.student?.email}
              </p>
            </div>
          </div>
          {submission && (
            <SubmissionStatusBadge
              status={submission.status}
              isLate={submission.is_late}
            />
          )}
        </div>

        {submission.submission_text && (
          <div className="pt-4 border-t border-base-300/80">
            <h4 className="text-sm font-medium text-base-content mb-2">
              Jawaban:
            </h4>
            <div className="p-4 bg-info/10 dark:bg-info/10 border border-info/20 rounded-2xl">
              <div className="flex items-start gap-2 text-base-content/80">
                <NotebookPen className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="font-normal whitespace-pre-line text-sm">
                  {submission.submission_text}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && <ErrorMessage error={error} />}

        {/* Assignment Deadline Info */}
        {assignment?.available_until && (
          <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
            <div className="flex items-center gap-2 text-warning text-sm">
              <Clock className="w-4 h-4" />
              <span className="font-medium">
                Batas Waktu: {formatDate(assignment.available_until)}
              </span>
            </div>
            {new Date() > new Date(assignment.available_until) && (
              <p className="text-xs text-warning/70 mt-1">
                Batas waktu telah lewat. Pengumpulan akan ditandai terlambat.
              </p>
            )}
          </div>
        )}

        {/* Submission Info */}
        {submission && (
          <div className="p-4 bg-base-100/50 rounded-lg border border-base-300/80 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
              <div className="flex items-center gap-2">
                <span className="text-base-content/60 min-w-[80px]">
                  Status:
                </span>
                <span className="font-medium">
                  {getSubmissionStatusConfig(submission.status).text}
                </span>
              </div>
              {submission.submitted_at && (
                <div className="flex items-center gap-2">
                  <span className="text-base-content/60 min-w-[80px]">
                    Dikumpul:
                  </span>
                  <span className="font-medium">
                    {formatDate(submission.submitted_at)}
                  </span>
                </div>
              )}
              {submission.points !== null &&
                submission.points !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-base-content/60 min-w-[80px]">
                      Nilai:
                    </span>
                    <span className="font-medium">
                      {submission.points}
                      {submission.max_points ? `/${submission.max_points}` : ""}
                    </span>
                  </div>
                )}
              {submission.graded_at && (
                <div className="flex items-center gap-2">
                  <span className="text-base-content/60 min-w-[80px]">
                    Dinilai:
                  </span>
                  <span className="font-medium">
                    {formatDate(submission.graded_at)}
                  </span>
                </div>
              )}
            </div>

            {/* Feedback */}
            {submission.teacher_feedback && (
              <div className="pt-4 border-t border-base-300/80">
                <h4 className="text-sm font-medium text-base-content mb-2">
                  Catatan Tutor:
                </h4>
                <div className="p-4 bg-warning/10 dark:bg-warning/10 border border-warning/20 rounded-2xl">
                  <div className="flex items-start gap-2 text-base-content/80">
                    <NotebookPen className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-normal whitespace-pre-line">
                      {submission.teacher_feedback}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Files */}
            {submission.files?.length > 0 && (
              <div className="pt-4 border-t border-base-300/80">
                <h4 className="text-sm font-medium text-base-content mb-2">
                  File yang Dikumpul:
                </h4>
                <div className="space-y-2">
                  {submission.files
                    .filter((f) => f.is_active)
                    .map((file) => (
                      <SubmissionFileItem
                        key={file.id}
                        file={file}
                        onRemove={onRemove}
                        onDownloadFile={onDownloadFile}
                        onView={onView}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

SubmissionSection.displayName = "SubmissionSection";

// ==================== SUBMISSION FORM COMPONENT ====================
const SubmissionForm = memo(
  ({
    submission,
    isSubmitting,
    onSubmit,
    onSaveDraft,
    onDownloadFile,
    onView,
  }) => {
    const [submissionText, setSubmissionText] = useState("");
    const [files, setFiles] = useState([]);
    const [removeFileIds, setRemoveFileIds] = useState([]);
    const [isDirty, setIsDirty] = useState(false);

    // Init form with stable dependency array
    useEffect(() => {
      if (submission) {
        setSubmissionText(submission.submission_text || "");
        setFiles([]);
        setRemoveFileIds([]);
        setIsDirty(false);
      }
    }, [submission?.id]); // Only depend on submission.id to avoid unnecessary updates

    // Track dirty state with useMemo
    const isDirtyMemo = useMemo(() => {
      const hasTextChanged =
        submissionText !== (submission?.submission_text || "");
      const hasFileChanges = files.length > 0 || removeFileIds.length > 0;
      return hasTextChanged || hasFileChanges;
    }, [submissionText, files, removeFileIds, submission?.submission_text]);

    // Update isDirty when memoized value changes
    useEffect(() => {
      setIsDirty(isDirtyMemo);
    }, [isDirtyMemo]);

    // Handlers
    const handleTextChange = useCallback((e) => {
      setSubmissionText(e.target.value);
    }, []);

    const handleFilesSelected = useCallback((selectedFiles) => {
      const validFiles = [];
      const errors = [];

      selectedFiles.forEach((file) => {
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`File ${file.name} melebihi 40MB`);
          return;
        }
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          errors.push(`Tipe file ${file.name} tidak didukung`);
          return;
        }
        validFiles.push(file);
      });

      if (errors.length > 0) toast.error(errors.join("\n"));
      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
      }
    }, []);

    const handleRemoveNewFile = useCallback((fileToRemove) => {
      setFiles((prev) => prev.filter((file) => file !== fileToRemove));
    }, []);

    const handleRemoveSubmittedFile = useCallback((file) => {
      if (file?.id) {
        setRemoveFileIds((prev) => [...prev, file.id]);
        toast.success("File akan dihapus saat disimpan");
      }
    }, []);

    const handleSaveDraft = useCallback(async () => {
      const result = await onSaveDraft(submissionText, files, removeFileIds);
      if (result.success) {
        setFiles([]);
        setRemoveFileIds([]);
        setIsDirty(false);
      }
    }, [onSaveDraft, submissionText, files, removeFileIds]);

    const handleSubmitFinal = useCallback(async () => {
      if (
        !submissionText.trim() &&
        files.length === 0 &&
        (!submission?.files || submission.files.length === 0)
      ) {
        toast.error("Harap isi teks atau unggah file");
        return;
      }

      const result = await onSubmit(submissionText, files, removeFileIds);
      if (result.success) {
        setFiles([]);
        setRemoveFileIds([]);
        setIsDirty(false);
      }
    }, [onSubmit, submissionText, files, removeFileIds, submission?.files]);

    const canEdit = useMemo(() => {
      return (
        !submission ||
        submission.status === "draft" ||
        submission.status === "returned"
      );
    }, [submission]);

    const submittedFiles = useMemo(() => {
      return (
        submission?.files?.filter(
          (file) => file.is_active && !removeFileIds.includes(file.id)
        ) || []
      );
    }, [submission?.files, removeFileIds]);

    return (
      <div className="space-y-4">
        {/* Text Area */}
        <div>
          <label className="block text-sm font-medium text-base-content mb-1.5">
            Teks Pengumpulan
          </label>
          <textarea
            value={submissionText}
            onChange={handleTextChange}
            disabled={!canEdit || isSubmitting}
            rows={4}
            className="w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 border-base-300/80"
            placeholder={
              canEdit
                ? "Masukkan jawaban atau keterangan tugas..."
                : "Tidak dapat mengedit pengumpulan yang telah disubmit"
            }
          />
        </div>

        {/* File Upload */}
        {canEdit && (
          <div>
            <label className="block text-sm font-medium text-base-content mb-1.5">
              Unggah File
            </label>
            <FileUploadArea
              onFilesSelected={handleFilesSelected}
              disabled={!canEdit || isSubmitting}
            />
          </div>
        )}

        {/* New Files */}
        {files.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-base-content mb-1.5">
              File Baru ({files.length})
            </h3>
            <div className="space-y-2">
              {files.map((file, index) => (
                <SubmissionFileItem
                  key={`new-${index}`}
                  file={{ name: file.name, size: file.size }}
                  onRemove={() => handleRemoveNewFile(file)}
                  disabled={isSubmitting}
                />
              ))}
            </div>
          </div>
        )}

        {/* Submitted Files */}
        {submittedFiles.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-base-content mb-1.5">
              File yang Diunggah ({submittedFiles.length})
            </h3>
            <div className="space-y-2">
              {submittedFiles.map((file) => (
                <SubmissionFileItem
                  key={file.id}
                  file={file}
                  onRemove={() => handleRemoveSubmittedFile(file)}
                  onDownloadFile={onDownloadFile}
                  onView={onView}
                  disabled={!canEdit || isSubmitting}
                />
              ))}
            </div>
          </div>
        )}

        {/* Files to be removed */}
        {removeFileIds.length > 0 && (
          <div className="p-3 bg-error/5 border border-error/20 rounded-lg text-sm text-error">
            {removeFileIds.length} file akan dihapus saat disimpan
          </div>
        )}

        {/* Action Buttons */}
        {canEdit && (
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <ActionButton
              onClick={handleSaveDraft}
              icon={Save}
              label="Simpan Draft"
              color="secondary"
              disabled={!isDirty || isSubmitting}
              loading={isSubmitting}
              className="flex-1"
            />
            <ActionButton
              onClick={handleSubmitFinal}
              icon={Send}
              label="Kumpulkan Tugas"
              color="primary"
              disabled={isSubmitting}
              loading={isSubmitting}
              className="flex-1"
            />
          </div>
        )}
      </div>
    );
  }
);

SubmissionForm.displayName = "SubmissionForm";

// ==================== GRADING FORM COMPONENT ====================
const GradingForm = memo(({ submission, onUpdateSubmission, isUpdating }) => {
  const [formState, setFormState] = useState({
    points: "",
    maxPoints: 100,
    feedback: "",
    status: "graded",
    isDirty: false,
  });

  // Initialize form state
  useEffect(() => {
    if (submission) {
      const initialState = {
        points: submission.points || "",
        maxPoints: submission.max_points || 100,
        feedback: submission.teacher_feedback || "",
        status: submission.status || "graded",
        isDirty: false,
      };
      setFormState(initialState);
    }
  }, [submission?.id]); // Only depend on submission.id

  // Update dirty state when form values change
  useEffect(() => {
    if (!submission) return;

    const hasChanges =
      formState.points !== (submission.points || "") ||
      formState.maxPoints !== (submission.max_points || 100) ||
      formState.feedback !== (submission.teacher_feedback || "") ||
      formState.status !== (submission.status || "graded");

    if (hasChanges !== formState.isDirty) {
      setFormState((prev) => ({ ...prev, isDirty: hasChanges }));
    }
  }, [
    formState.points,
    formState.maxPoints,
    formState.feedback,
    formState.status,
    submission,
  ]);

  const handleFieldChange = useCallback((field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (
        formState.status === "graded" &&
        (!formState.points || formState.points === "")
      ) {
        toast.error("Nilai harus diisi untuk status 'Dinilai'");
        return;
      }

      if (
        formState.maxPoints &&
        formState.points &&
        parseFloat(formState.points) > parseFloat(formState.maxPoints)
      ) {
        toast.error("Nilai tidak boleh melebihi nilai maksimal");
        return;
      }

      const updateData = {
        submission_id: submission?.id,
        status: formState.status,
        points: formState.points ? parseFloat(formState.points) : null,
        max_points: formState.maxPoints
          ? parseFloat(formState.maxPoints)
          : null,
        teacher_feedback: formState.feedback.trim() || null,
      };

      try {
        const result = await onUpdateSubmission(updateData);
        if (result?.success) {
          setFormState((prev) => ({ ...prev, isDirty: false }));
          toast.success("Penilaian berhasil disimpan");
        }
      } catch (error) {
        console.error("Grading error:", error);
        toast.error("Gagal menyimpan penilaian");
      }
    },
    [submission?.id, formState, onUpdateSubmission]
  );

  const handleReset = useCallback(() => {
    if (submission) {
      setFormState({
        points: submission.points || "",
        maxPoints: submission.max_points || 100,
        feedback: submission.teacher_feedback || "",
        status: submission.status || "graded",
        isDirty: false,
      });
    }
  }, [submission]);

  if (!submission) return null;

  return (
    <div className="">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
          <NotebookPen className="w-4 h-4" />
        </div>
        <h3 className="text-base font-semibold text-base-content">
          Penilaian dan Feedback
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Status Selection */}
        <div>
          <label className="block text-sm font-semibold text-base-content mb-2">
            Status Penilaian <span className="text-error">*</span>
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleFieldChange("status", "graded")}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200
        ${
          formState.status === "graded"
            ? "bg-primary text-white shadow-md"
            : "bg-base-200 dark:bg-base-300 text-base-content/70 hover:bg-base-300"
        }`}>
              Dinilai
            </button>

            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleFieldChange("status", "returned")}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200
        ${
          formState.status === "returned"
            ? "bg-warning text-white shadow-md"
            : "bg-base-200 dark:bg-base-300 text-base-content/70 hover:bg-base-300"
        }`}>
              Dikembalikan
            </button>
          </div>

          <p className="text-xs text-base-content/50 mt-2">
            Pilih <span className="font-medium">{`"Dikembalikan"`}</span> jika
            memerlukan revisi
          </p>
        </div>

        {/* Points Input */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-base-content mb-1.5">
              Nilai <span className="text-error">*</span>
            </label>
            <input
              type="number"
              value={formState.points}
              onChange={(e) => handleFieldChange("points", e.target.value)}
              min="0"
              max={formState.maxPoints}
              step="0.01"
              disabled={isUpdating}
              className="w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 border-base-300/80"
              placeholder="Masukkan nilai"
              required={formState.status === "graded"}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-base-content mb-1.5">
              Nilai Maksimal
            </label>
            <input
              type="number"
              value={formState.maxPoints}
              onChange={(e) => handleFieldChange("maxPoints", e.target.value)}
              min="0"
              step="1"
              disabled={isUpdating}
              className="w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 border-base-300/80"
              placeholder="Nilai maksimal"
            />
          </div>
        </div>

        {/* Points Percentage Display */}
        {formState.points && formState.maxPoints && (
          <div className="p-3 bg-info/5 border border-info/10 rounded-lg flex items-center justify-between text-sm">
            <span className="font-medium text-info">Persentase:</span>
            <span className="font-semibold text-info">
              {Math.round(
                (parseFloat(formState.points) /
                  parseFloat(formState.maxPoints)) *
                  100
              )}
              %
            </span>
          </div>
        )}

        {/* Feedback */}
        <div>
          <label className="block text-sm font-medium text-base-content mb-1.5">
            Feedback untuk Siswa
          </label>
          <textarea
            value={formState.feedback}
            onChange={(e) => handleFieldChange("feedback", e.target.value)}
            rows={3}
            disabled={isUpdating}
            className="w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 border-base-300/80"
            placeholder="Berikan feedback yang konstruktif..."
            maxLength={2000}
          />
          <div className="flex justify-between items-center mt-1 text-xs text-base-content/50">
            <p>Feedback akan terlihat oleh siswa setelah dinilai</p>
            <span>{formState.feedback.length}/2000</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <ActionButton
            type="submit"
            icon={Save}
            label={
              formState.status === "graded"
                ? "Simpan Penilaian"
                : "Kembalikan untuk Revisi"
            }
            color={formState.status === "graded" ? "primary" : "warning"}
            disabled={isUpdating}
            loading={isUpdating}
            className="flex-1"
          />

          {formState.isDirty && (
            <ActionButton
              type="button"
              icon={X}
              label="Batal"
              color="ghost"
              disabled={isUpdating}
              onClick={handleReset}
              className="sm:w-auto w-full"
            />
          )}
        </div>
      </form>
    </div>
  );
});

GradingForm.displayName = "GradingForm";

// ==================== MAIN SUBMISSION ASSIGNMENT DETAIL COMPONENT ====================
const SubmissionAssignmentDetail = memo(
  ({
    assignment,
    classroomCode,
    assignmentId,
    currentUser,
    currentUserRole,
  }) => {
    // State untuk selected submission
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [successMessage, setSuccessMessage] = useState("");
    const isMobile = useIsMobile();
    const successTimeoutRef = useRef(null);

    // Optimized derived state calculation
    const {
      isSubmitting,
      submissionError,
      saveDraft,
      submitFinal,
      downloadFile: downloadSubmissionFile,
      removeSubmittedFile,
      updateSubmission,
      isUpdatingSubmission,
    } = useAssignmentSubmission(classroomCode, assignmentId, {
      autoLoad: true,
      enablePolling: false,
      onSubmissionUpdate: (updatedSubmission) => {
        if (selectedSubmission?.id === updatedSubmission.id) {
          setSelectedSubmission(updatedSubmission);
        }
      },
      onError: (err) => {
        console.error("Submission error:", err);
      },
    });

    // Get all submissions with memoization
    const allSubmissions = useMemo(() => {
      return Array.isArray(assignment?.submissions)
        ? assignment.submissions
        : assignment?.submissions
        ? [assignment.submissions]
        : [];
    }, [assignment?.submissions]);

    // Auto-select first submission or user's own submission
    useEffect(() => {
      if (allSubmissions.length > 0 && !selectedSubmission) {
        // Try to find user's own submission first
        const ownSubmission = allSubmissions.find(
          (s) => s.student_id === currentUser?.id
        );
        setSelectedSubmission(ownSubmission || allSubmissions[0]);
      }
    }, [allSubmissions, currentUser?.id, selectedSubmission]);

    // Submission handlers with better error handling
    const handleSubmissionSave = useCallback(
      async (text, files, removeFileIds) => {
        try {
          const result = await saveDraft(text, files, removeFileIds);
          if (result.success) {
            setSuccessMessage("Draft berhasil disimpan");
          }
          return result;
        } catch (error) {
          console.error("Save draft error:", error);
          return { success: false, error: error.message };
        }
      },
      [saveDraft]
    );

    const handleSubmissionSubmit = useCallback(
      async (text, files, removeFileIds) => {
        try {
          const result = await submitFinal(text, files, removeFileIds);
          if (result.success) {
            setSuccessMessage("Tugas berhasil dikumpulkan");
          }
          return result;
        } catch (error) {
          console.error("Submit assignment error:", error);
          return { success: false, error: error.message };
        }
      },
      [submitFinal]
    );

    const handleSubmissionFileDownload = useCallback(
      async (downloadUrlOrFile, fileName) => {
        try {
          let downloadUrl;
          let fileNameToUse;

          if (typeof downloadUrlOrFile === "string") {
            downloadUrl = downloadUrlOrFile;
            fileNameToUse = fileName || "download";
          } else if (
            downloadUrlOrFile &&
            typeof downloadUrlOrFile === "object"
          ) {
            downloadUrl =
              downloadUrlOrFile.download_url || downloadUrlOrFile.path;
            fileNameToUse =
              downloadUrlOrFile.original_name ||
              downloadUrlOrFile.file_name ||
              fileName ||
              "download";
          } else {
            toast.error("URL download tidak valid");
            return { success: false, error: "Invalid download URL" };
          }

          if (!downloadUrl) {
            toast.error("URL download tidak ditemukan");
            return { success: false, error: "Download URL not found" };
          }

          const result = await downloadSubmissionFile(
            downloadUrl,
            fileNameToUse
          );
          if (result.success) {
            setSuccessMessage(`${fileNameToUse} berhasil diunduh`);
          }
          return result;
        } catch (error) {
          console.error("Download submission file error:", error);
          toast.error("Gagal mengunduh file");
          return { success: false, error: error.message };
        }
      },
      [downloadSubmissionFile]
    );

    const handleSubmissionFileView = useCallback((urlOrFile) => {
      try {
        let viewUrl;

        if (typeof urlOrFile === "string") {
          viewUrl = urlOrFile;
        } else if (urlOrFile && typeof urlOrFile === "object") {
          viewUrl = urlOrFile.path || urlOrFile.download_url;
        }

        if (!viewUrl) {
          toast.error("URL file tidak ditemukan");
          return;
        }

        window.open(viewUrl, "_blank", "noopener,noreferrer");
        setSuccessMessage("File dibuka di tab baru");
      } catch (error) {
        console.error("View submission file error:", error);
        toast.error("Gagal membuka file");
      }
    }, []);

    const handleSubmissionFileRemove = useCallback(
      async (fileOrFileId) => {
        try {
          const result = await removeSubmittedFile(fileOrFileId);
          if (result.success) {
            setSuccessMessage("File berhasil dihapus");
          }
          return result;
        } catch (error) {
          console.error("Remove submission file error:", error);
          return { success: false, error: error.message };
        }
      },
      [removeSubmittedFile]
    );

    const handleUpdateSubmission = useCallback(
      async (updateData) => {
        try {
          const result = await updateSubmission(updateData);
          if (result.success) {
            setSuccessMessage("Pengumpulan berhasil diupdate");
            // Update selected submission with new data
            setSelectedSubmission((prev) => ({
              ...prev,
              ...updateData,
              updated_at: new Date().toISOString(),
            }));
          }
          return result;
        } catch (error) {
          console.error("Update submission error:", error);
          return { success: false, error: error.message };
        }
      },
      [updateSubmission]
    );

    // Optimized success message cleanup with proper cleanup
    useEffect(() => {
      if (successMessage) {
        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }
        successTimeoutRef.current = setTimeout(
          () => setSuccessMessage(""),
          5000
        );
      }

      return () => {
        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
          successTimeoutRef.current = null;
        }
      };
    }, [successMessage]);

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }
      };
    }, []);

    // Check if current user is admin/teacher
    const isAdminOrTeacher = useMemo(() => {
      return ["administrator", "teacher", "super admin"].includes(
        currentUserRole
      );
    }, [currentUserRole]);

    // Get user's submission
    const userSubmission = useMemo(() => {
      return allSubmissions.find((s) => s.student_id === currentUser?.id);
    }, [allSubmissions, currentUser?.id]);

    return (
      <>
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Sidebar - Only show for admin/teacher */}
          {isAdminOrTeacher && showSidebar && allSubmissions.length > 0 && (
            <div className={isMobile ? "max-w-full" : "col-span-1"}>
              <SubmissionListSidebar
                submissions={allSubmissions}
                activeSubmissionId={selectedSubmission?.id}
                onSelectSubmission={setSelectedSubmission}
                currentUserId={currentUser?.id}
              />
            </div>
          )}

          {/* Main Content Area */}
          <div
            className={
              isMobile
                ? "min-w-full px-1"
                : showSidebar
                ? "col-span-2 px-1"
                : "col-span-3 px-1"
            }>
            <div className="">
              {/* Success Message */}
              {successMessage && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-success text-sm bg-success/5 border border-success/20 rounded-lg px-4 py-3">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">{successMessage}</span>
                  </div>
                </div>
              )}

              {/* Content based on selected submission or user role */}
              {(() => {
                if (isAdminOrTeacher && selectedSubmission) {
                  // Show selected submission for admin/teacher
                  return (
                    <div className="space-y-2">
                      <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm rounded-2xl border border-base-200/50 p-4">
                        <SubmissionSection
                          isAdminOrTeacher={isAdminOrTeacher}
                          setShowSidebar={setShowSidebar}
                          allSubmissions={allSubmissions}
                          showSidebar={showSidebar}
                          assignment={assignment}
                          submission={selectedSubmission}
                          error={submissionError}
                          onRemove={handleSubmissionFileRemove}
                          onDownloadFile={handleSubmissionFileDownload}
                          onView={handleSubmissionFileView}
                        />
                      </div>

                      <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm rounded-2xl border border-base-200/50 p-4">
                        <GradingForm
                          submission={selectedSubmission}
                          onUpdateSubmission={handleUpdateSubmission}
                          isUpdating={isUpdatingSubmission}
                        />
                      </div>
                    </div>
                  );
                }

                // Student logic: Determine if can edit
                const submission = userSubmission;
                const status = submission?.status || "new";
                const canEdit =
                  status === "draft" ||
                  status === "returned" ||
                  status === "new";

                if (canEdit) {
                  // Show form for new submission, draft, or returned
                  return (
                    <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm rounded-2xl border border-base-200/50 p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-base font-semibold text-base-content flex items-center gap-2">
                            <Send className="w-4 h-4 text-primary" />
                            {submission
                              ? "Edit Pengumpulan"
                              : "Kumpulkan Tugas"}
                          </h2>
                        </div>

                        {/* Assignment Deadline Info */}
                        {assignment?.available_until && (
                          <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
                            <div className="flex items-center gap-2 text-warning text-sm">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">
                                Batas Waktu:{" "}
                                {formatDate(assignment.available_until)}
                              </span>
                            </div>
                            {new Date() >
                              formatDate(assignment.available_until) && (
                              <p className="text-xs text-warning/70 mt-1">
                                Batas waktu telah lewat. Pengumpulan akan
                                ditandai terlambat.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Error Message */}
                        {submissionError && (
                          <ErrorMessage error={submissionError} />
                        )}

                        {/* Form untuk submission */}
                        <SubmissionForm
                          assignment={assignment}
                          submission={submission}
                          isSubmitting={isSubmitting}
                          error={submissionError}
                          onSubmit={handleSubmissionSubmit}
                          onSaveDraft={handleSubmissionSave}
                          onDownloadFile={handleSubmissionFileDownload}
                          onView={handleSubmissionFileView}
                          onRemove={handleSubmissionFileRemove}
                        />
                      </div>
                    </div>
                  );
                } else if (submission) {
                  // Show read-only section for submitted or graded
                  return (
                    <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm rounded-2xl border border-base-200/50 p-4">
                      <SubmissionSection
                        assignment={assignment}
                        submission={submission}
                        error={submissionError}
                        onRemove={handleSubmissionFileRemove}
                        onDownloadFile={handleSubmissionFileDownload}
                        onView={handleSubmissionFileView}
                      />
                    </div>
                  );
                }

                // Fallback: No submission and cannot edit (should not happen)
                return null;
              })()}
            </div>
          </div>
        </div>
      </>
    );
  }
);

SubmissionAssignmentDetail.displayName = "SubmissionAssignmentDetail";

export default SubmissionAssignmentDetail;
