import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileIcon,
  FileText,
  Flag,
  Globe,
  History,
  Link,
  Lock,
  MoreHorizontal,
  Play,
  RefreshCw,
  Share2,
  Star,
  Sword,
  Trash,
  User,
  Video,
  VideoIcon,
} from "lucide-react";
import React, {
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Player } from "react-tuby";
import "react-tuby/css/main.css";
import useIsMobile from "../../../../../../Context/__useIsMobile";
import "../../../../../../custom-quill-tooltip.css";
import { useMaterialDetail } from "../../../../../../features/classroom/materialHook";
import { useQuillCodeCopy } from "../../../../../../hooks/useCopyCode";

// ==================== CONSTANTS ====================
const MATERIAL_TYPES = [
  {
    value: "document",
    label: "Dokumen",
    icon: FileText,
    color: "text-blue-600",
  },
  { value: "video", label: "Video", icon: Video, color: "text-red-600" },
  { value: "link", label: "Link", icon: Link, color: "text-green-600" },
  {
    value: "assignment",
    label: "Tugas",
    icon: BookOpen,
    color: "text-purple-600",
  },
  { value: "quiz", label: "Kuis", icon: Sword, color: "text-orange-600" },
];

// Video file extensions
const VIDEO_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".ogg",
  ".avi",
  ".mov",
  ".wmv",
  ".flv",
  ".mkv",
  ".m4v",
];

// Video MIME types
const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-ms-wmv",
  "video/x-flv",
  "video/x-matroska",
];
const VIEWABLE_MIME_TYPES = [
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

// ==================== UTILITY FUNCTIONS ====================

const EXTENSION_TO_MIME = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  mp4: "video/mp4",
  mp3: "audio/mpeg",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
};
// ==================== UTILITY FUNCTIONS ====================
const isFileViewable = (file) => {
  if (!file) return false;

  let mimeType = file.type;

  // Pastikan mimeType adalah string yang valid
  if (mimeType && typeof mimeType === "string") {
    mimeType = mimeType.toLowerCase().trim();
  } else if (file.file_name && typeof file.file_name === "string") {
    // fallback kalau type tidak ada
    const ext = file.file_name.split(".").pop()?.toLowerCase();
    mimeType = ext ? EXTENSION_TO_MIME[ext] : null;
  }

  // Pastikan mimeType adalah string yang valid sebelum melakukan includes check
  if (!mimeType || typeof mimeType !== "string") return false;

  return VIEWABLE_MIME_TYPES.includes(mimeType);
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

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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

const isVideoFile = (file) => {
  if (!file) return false;

  // Check by MIME type first
  if (
    file.type &&
    typeof file.type === "string" &&
    VIDEO_MIME_TYPES.includes(file.type.toLowerCase())
  ) {
    return true;
  }

  // Check by file extension
  if (file.path || file.original_name || file.file_name) {
    const fileName = file.path || file.original_name || file.file_name;
    if (typeof fileName === "string") {
      const lowerFileName = fileName.toLowerCase();
      return VIDEO_EXTENSIONS.some((ext) => lowerFileName.endsWith(ext));
    }
  }

  return false;
};

const getTypeConfig = (type) =>
  MATERIAL_TYPES.find((t) => t.value === type) || MATERIAL_TYPES[0];
const getTypeIcon = (type) => getTypeConfig(type).icon;
const getTypeLabel = (type) => getTypeConfig(type).label || type;
const getTypeColor = (type) => getTypeConfig(type).color;

// ==================== OPTIMIZED VIDEO PLAYER COMPONENT ====================

const globalViewTracker = {
  updatedViews: new Set(),
  pendingRequests: new Map(),

  // Check if view has already been updated for this video
  hasViewBeenUpdated(fileId) {
    return this.updatedViews.has(String(fileId));
  },

  // Mark view as updated
  markViewAsUpdated(fileId) {
    this.updatedViews.add(String(fileId));
  },

  // Check if request is currently pending
  isRequestPending(fileId) {
    return this.pendingRequests.has(String(fileId));
  },

  // Set request as pending
  setPendingRequest(fileId, promise) {
    this.pendingRequests.set(String(fileId), promise);
    return promise.finally(() => {
      this.pendingRequests.delete(String(fileId));
    });
  },

  // Clear tracking for a specific video (useful for testing)
  clearVideo(fileId) {
    this.updatedViews.delete(String(fileId));
    this.pendingRequests.delete(String(fileId));
  },

  // Reset all tracking (useful for full page refresh)
  reset() {
    this.updatedViews.clear();
    this.pendingRequests.clear();
  },
};
// Fixed VideoPlayer Component
// Fixed VideoPlayer Component
// Fixed VideoPlayer Component
const VideoPlayer = memo(({ videoFile, onViewUpdate }) => {
  const playerRef = useRef(null);
  const viewUpdateTimeoutRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [poster, setPoster] = useState(null);
  const fileName = videoFile.file_name || "Video";

  const updateViewCount = useCallback(
    (fileId) => {
      if (globalViewTracker.hasViewBeenUpdated(fileId)) {
        return Promise.resolve({ success: true, cached: true });
      }

      if (globalViewTracker.isRequestPending(fileId)) {
        return globalViewTracker.pendingRequests.get(String(fileId));
      }

      const requestPromise = new Promise((resolve) => {
        (async () => {
          try {
            const result = await onViewUpdate(fileId);
            if (result?.success !== false) {
              globalViewTracker.markViewAsUpdated(fileId);
              resolve({ success: true, data: result });
            } else {
              resolve({
                success: false,
                error: result.error || "Update failed",
              });
            }
          } catch (error) {
            resolve({ success: false, error: error.message });
          }
        })();
      });

      return globalViewTracker.setPendingRequest(fileId, requestPromise);
    },
    [onViewUpdate]
  );

  useEffect(() => {
    const generatePoster = async () => {
      try {
        const video = document.createElement("video");
        video.src = videoFile.path;
        video.crossOrigin = "anonymous";
        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;

        await new Promise((resolve, reject) => {
          video.onloadedmetadata = resolve;
          video.onerror = reject;
        });

        video.currentTime = 5;
        video.play().catch(() => {});

        await new Promise((resolve, reject) => {
          video.onseeked = resolve;
          video.onerror = reject;
        });

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setPoster(canvas.toDataURL("image/jpeg", 0.95));
        setDuration(video.duration || 0);

        video.pause();
      } catch (error) {
        console.error("Poster generation error:", error);
        setHasError(true);
      }
    };

    if (!poster && !hasError) {
      generatePoster();
    }
  }, [videoFile.path, poster, hasError]);

  useEffect(() => {
    const player = playerRef.current;
    if (player && player.video) {
      const video = player.video;
      video.preload = "metadata";
      video.crossOrigin = "anonymous";

      const handleLoadedMetadata = () => {
        setDuration(video.duration || 0);
      };

      const handlePlay = () => {
        if (!globalViewTracker.hasViewBeenUpdated(videoFile.id)) {
          if (viewUpdateTimeoutRef.current) {
            clearTimeout(viewUpdateTimeoutRef.current);
          }
          viewUpdateTimeoutRef.current = setTimeout(() => {
            updateViewCount(videoFile.id).catch(console.error);
          }, 2000);
        }
      };

      const handleError = () => {
        setHasError(true);
      };

      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      video.addEventListener("play", handlePlay);
      video.addEventListener("error", handleError);

      return () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("error", handleError);
        if (viewUpdateTimeoutRef.current) {
          clearTimeout(viewUpdateTimeoutRef.current);
        }
      };
    }
  }, [videoFile, updateViewCount]);

  // Reset state when video changes
  useEffect(() => {
    setDuration(0);
    setHasError(false);
    setPoster(null);
    if (viewUpdateTimeoutRef.current) {
      clearTimeout(viewUpdateTimeoutRef.current);
    }
  }, [videoFile.id, videoFile.path]);

  if (hasError) {
    return (
      <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl shadow-error/10">
        <div className="aspect-video flex items-center justify-center bg-base-100">
          <div className="text-center text-white p-4">
            <VideoIcon className="w-16 h-16 mx-auto mb-4 text-white/50" />
            <p className="text-lg font-semibold mb-2">
              Video tidak dapat dimuat
            </p>
            <p className="text-sm text-white/60 mb-2">{fileName}</p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setHasError(false);
                  if (playerRef.current && playerRef.current.video) {
                    playerRef.current.video.src = videoFile.path;
                    playerRef.current.video.load();
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors mr-2">
                Coba Lagi
              </button>
              <button
                onClick={() => window.open(videoFile.path, "_blank")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
                Buka di Tab Baru
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl group shadow-error/10">
      <Player
        src={videoFile.path}
        primaryColor="#ef4444"
        playerRef={playerRef}
        keyboardShortcut={true}
        pictureInPicture={true}
        poster={poster}
      />
      <div className="p-4 bg-base-100 dark:bg-base-200 border-t border-base-300">
        <h4 className="font-semibold text-base-content mb-2 text-lg">
          {fileName}
        </h4>
        <div className="flex items-center gap-4 text-sm text-base-content/40">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{(videoFile.view_count || 0).toLocaleString()} tayangan</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            <span>
              {(videoFile.download_count || 0).toLocaleString()} unduhan
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Durasi: {formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

VideoPlayer.displayName = "VideoPlayer";
const VideoListSidebar = memo(({ videos, activeVideoId, onSelectVideo }) => {
  const [thumbnailErrors, setThumbnailErrors] = useState({});
  const [thumbnails, setThumbnails] = useState({});

  const handleThumbnailError = useCallback((videoId) => {
    setThumbnailErrors((prev) => ({ ...prev, [videoId]: true }));
  }, []);

  const generateThumbnail = useCallback(
    async (videoUrl, videoId) => {
      try {
        const video = document.createElement("video");
        video.src = videoUrl;
        video.crossOrigin = "anonymous";
        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;

        await new Promise((resolve, reject) => {
          video.onloadedmetadata = resolve;
          video.onerror = reject;
        });

        video.currentTime = 5;
        video.play().catch(() => {});

        await new Promise((resolve, reject) => {
          video.onseeked = resolve;
          video.onerror = reject;
        });

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setThumbnails((prev) => ({ ...prev, [videoId]: dataUrl }));

        video.pause();
      } catch (error) {
        console.error("Thumbnail generation error:", error);
        handleThumbnailError(videoId);
      }
    },
    [handleThumbnailError]
  );

  return (
    <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm rounded-2xl border border-base-200/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-base-300/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <VideoIcon className="w-4 h-4 text-red-600" />
            <h3 className="text-base font-semibold text-base-content">
              Daftar Video
            </h3>
          </div>
          <span className="text-xs text-base-content/50 font-medium">
            {videos.length} video
          </span>
        </div>
      </div>

      {/* Video List */}
      <div className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
        {videos.length === 0 ? (
          <div className="text-center py-8 text-base-content/50">
            <VideoIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Tidak ada video</p>
            <p className="text-xs mt-1">Upload video untuk memulai</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {videos.map((video, index) => {
              const isActive = video.id === activeVideoId;
              const videoTitle =
                video.original_name || video.file_name || `Video ${index + 1}`;
              const hasError = thumbnailErrors[video.id];

              return (
                <div
                  key={video.id}
                  onClick={() => onSelectVideo(video)}
                  className={`group cursor-pointer rounded-lg transition-all duration-200 border ${
                    isActive
                      ? "bg-primary/10 border-primary/30 shadow-sm"
                      : "bg-transparent border-transparent hover:bg-base-200/50 hover:border-base-300/50"
                  }`}>
                  <div className="flex gap-3 p-2">
                    {/* Thumbnail Container */}
                    <div
                      ref={(el) => {
                        if (!el) return;

                        const observer = new IntersectionObserver(
                          (entries) => {
                            entries.forEach((entry) => {
                              if (
                                entry.isIntersecting &&
                                !thumbnails[video.id] &&
                                !thumbnailErrors[video.id]
                              ) {
                                generateThumbnail(video.path, video.id);
                                observer.disconnect();
                              }
                            });
                          },
                          { threshold: 0.25 }
                        );

                        observer.observe(el);
                      }}
                      className="relative flex-shrink-0 w-28 h-16 rounded-md overflow-hidden bg-base-300/50">
                      {!hasError ? (
                        thumbnails[video.id] ? (
                          <img
                            src={thumbnails[video.id]}
                            alt={videoTitle}
                            className="w-full h-auto object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-base-300/80 to-base-300/40">
                            <LoadingSpinner
                              size="sm"
                              className="text-base-content/50"
                            />
                          </div>
                        )
                      ) : (
                        /* Fallback Thumbnail */
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-base-300/80 to-base-300/40">
                          <VideoIcon
                            className={`w-6 h-6 ${
                              isActive ? "text-primary" : "text-base-content/30"
                            }`}
                          />
                        </div>
                      )}
                      {/* Play Overlay */}
                      <div
                        className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                          isActive
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }`}>
                        <div className="bg-black/70 rounded-full p-1.5 backdrop-blur-sm shadow-sm">
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                      {/* Duration Badge (if available) */}
                      {video.duration && (
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 py-0.5 rounded backdrop-blur-sm shadow-sm font-mono">
                          {formatTime(video.duration)}
                        </div>
                      )}
                      {/* Active Indicator Bar */}
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"></div>
                      )}
                    </div>

                    {/* Video Info */}
                    <div className="flex-1 min-w-0 py-0.5">
                      <h4
                        className={`font-medium text-xs line-clamp-2 mb-1 ${
                          isActive
                            ? "text-primary"
                            : "text-base-content group-hover:text-base-content/90"
                        }`}>
                        {videoTitle}
                      </h4>

                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-3 text-[10px] text-base-content/50">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {(video.view_count || 0).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            {(video.download_count || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-[10px] text-base-content/40">
                          {formatFileSize(video.file_size)}
                          {video.uploaded_at && (
                            <span className="ml-2">
                              • {formatDateRelative(video.uploaded_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Playing Indicator */}
                    {isActive && (
                      <div className="flex items-center justify-center pr-1">
                        <div className="flex gap-0.5">
                          <div className="w-0.5 h-3 bg-primary rounded-full animate-pulse"></div>
                          <div className="w-0.5 h-4 bg-primary rounded-full animate-pulse delay-75"></div>
                          <div className="w-0.5 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
});
VideoListSidebar.displayName = "VideoListSidebar";
// ==================== OPTIMIZED UI COMPONENTS ====================
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

const ErrorMessage = memo(({ error, onRetry, className = "" }) => {
  if (!error) return null;
  const errorText =
    typeof error === "string"
      ? error
      : error?.message ||
        (Array.isArray(error) ? error.join(", ") : "Terjadi kesalahan");

  return (
    <div
      className={`flex items-center justify-between gap-3 text-error text-sm bg-error/5 border border-error/20 rounded-2xl px-4 py-3 backdrop-blur-sm shadow-sm ${className}`}>
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span className="font-semibold">{errorText}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-3 py-1 bg-error/10 hover:bg-error/20 rounded-lg text-xs font-medium transition-all">
          <RefreshCw className="w-3 h-3" />
          Coba Lagi
        </button>
      )}
    </div>
  );
});
ErrorMessage.displayName = "ErrorMessage";

const SuccessMessage = memo(({ message, className = "" }) => {
  if (!message) return null;
  return (
    <div
      className={`flex items-center gap-3 text-success text-sm bg-success/10 border border-success/30 rounded-2xl px-4 py-3 backdrop-blur-sm shadow-sm ${className}`}>
      <CheckCircle className="w-5 h-5 flex-shrink-0" />
      <span className="font-semibold">{message}</span>
    </div>
  );
});
SuccessMessage.displayName = "SuccessMessage";

const EmptyState = memo(({ onBack, onRefresh }) => (
  <div className="w-full mx-auto min-h-screen overflow-x-hidden px-1 md:px-0">
    <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm rounded-3xl  border border-base-300/50">
      <div className="p-4">
        <div className="text-center py-16">
          <FileText className="w-20 h-20 mx-auto mb-6 text-base-content/30" />
          <h3 className="text-2xl font-bold text-base-content mb-4">
            Materi Tidak Ditemukan
          </h3>
          <p className="text-base-content/60  max-w-md mx-auto">
            Materi yang Anda cari tidak dapat ditemukan. Mungkin telah dihapus
            atau tidak tersedia.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-content hover:bg-primary/90 rounded-2xl font-semibold transition-all">
              <RefreshCw className="w-5 h-5" />
              Muat Ulang
            </button>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-content hover:bg-secondary/90 rounded-2xl font-semibold transition-all">
              <ArrowLeft className="w-5 h-5" />
              Kembali ke Daftar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
));
EmptyState.displayName = "EmptyState";

const LoadingState = memo(() => (
  <div className="w-full mx-auto min-h-screen">
    <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm rounded-3xl  border border-base-300/50">
      <div className="p-4">
        <div className="text-center py-16">
          <div className="flex justify-center">
            <LoadingSpinner size="xl" className="mx-auto mb-6" />
          </div>
          <h3 className="text-xl font-bold text-base-content mb-2">
            Memuat Detail Materi
          </h3>
          <p className="text-base-content/60">
            Sedang mengambil informasi materi pembelajaran...
          </p>
        </div>
      </div>
    </div>
  </div>
));
LoadingState.displayName = "LoadingState";

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
      "flex items-center gap-2 font-semibold transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none rounded-2xl";
    const sizeClasses = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };
    const colorClasses = {
      primary:
        "bg-primary text-primary-content hover:bg-primary/90 hover:shadow-primary/25",
      warning:
        "bg-warning text-warning-content hover:bg-warning/90 hover:shadow-warning/25",
      error:
        "bg-error text-error-content hover:bg-error/90 hover:shadow-error/25",
      success:
        "bg-success text-success-content hover:bg-success/90 hover:shadow-success/25",
      info: "bg-info text-info-content hover:bg-info/90 hover:shadow-info/25",
      secondary:
        "bg-secondary text-secondary-content hover:bg-secondary/90 hover:shadow-secondary/25",
      ghost:
        "bg-base-200 text-base-content hover:bg-base-300 hover:shadow-base-300/25",
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`${baseClasses} ${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
        {loading ? <LoadingSpinner size="sm" /> : <Icon className="w-5 h-5" />}
        <span>{loading ? "Memuat..." : label}</span>
      </button>
    );
  }
);
ActionButton.displayName = "ActionButton";

const StatCard = memo(({ icon: Icon, label, value, color, className = "" }) => {
  const colorConfig = useMemo(
    () => ({
      blue: {
        bg: "bg-gradient-to-br from-primary/10 to-primary/10 border-transparent hover:shadow-primary/25 text-primary",
        icon: "text-primary",
      },
      green: {
        bg: "bg-gradient-to-br from-success/10 to-success/10 border-transparent hover:shadow-success/25 text-success",
        icon: "text-success",
      },
      yellow: {
        bg: "bg-gradient-to-br from-warning/10 to-warning/10 border-transparent hover:shadow-warning/25 text-warning",
        icon: "text-warning",
      },
      purple: {
        bg: "bg-gradient-to-br from-primary/10 to-primary/10 border-transparent hover:shadow-primary/25 text-primary",
        icon: "text-primary",
      },
      red: {
        bg: "bg-gradient-to-br from-error/10 to-error/10 border-transparent hover:shadow-error/25 text-error",
        icon: "text-error",
      },
    }),
    []
  );

  const config = colorConfig[color] || colorConfig.blue;

  return (
    <div
      className={`p-3 rounded-xl border backdrop-blur-sm shadow-sm transition-all duration-200 hover:scale-105 ${config.bg} ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <Icon className={`w-4 h-4 ${config.icon}`} />
        <span className="text-xs font-medium text-base-content/70">
          {label}
        </span>
      </div>
      <div className="text-lg font-bold mt-1">{value}</div>
    </div>
  );
});
StatCard.displayName = "StatCard";

const PropertyItem = memo(({ icon: Icon, label, value, color = "primary" }) => {
  const colorClasses = {
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
    primary: "bg-primary/10 text-primary",
    error: "bg-error/10 text-error",
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-base-100/60 rounded-xl hover:bg-base-100/80 transition-all duration-300 border-base-300">
      <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <div className="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-1">
          {label}
        </div>
        <div className="text-sm font-bold text-base-content">{value}</div>
      </div>
    </div>
  );
});
PropertyItem.displayName = "PropertyItem";

// PERBAIKAN 1: Fix isFileViewable function di AssignmentDetailPage
const FileDetailItem = memo(({ file, onView, onDownload }) => {
  const fileName = file.file_name || "Unknown";
  const fileSize = file.file_size
    ? formatFileSize(file.file_size)
    : file.size
    ? formatFileSize(file.size)
    : "Unknown";

  // PERBAIKAN: Check if file is viewable based on MIME type
  const isViewable = isFileViewable(file);

  return (
    <div className="flex items-center gap-3 p-4 bg-base-300/30 dark:bg-base-100 rounded-xl transition-all duration-300">
      <div className="p-2 rounded-lg bg-info/10 text-info">
        <FileIcon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-base-content">{fileName}</div>
        <div className="text-xs text-base-content/60 mt-1">
          {fileSize} • Dilihat: {file.view_count || 0} • Diunduh:{" "}
          {file.download_count || 0}
        </div>
      </div>
      <div className="flex gap-2">
        {isViewable && (
          <button
            onClick={() => onView(file.id)}
            className="px-2 py-1 rounded bg-base-200 duration-200 transition-all active:-translate-y-1 active:scale-95 text-center text-base-content/60 hover:text-info/60">
            <Eye size={16} />
          </button>
        )}
        <button
          onClick={() => onDownload(file.id)}
          className="px-2 py-1 rounded bg-base-200 duration-200 transition-all active:-translate-y-1 active:scale-95 text-center text-base-content/60 hover:text-primary/60">
          <Download size={16} />
        </button>
      </div>
    </div>
  );
});

FileDetailItem.displayName = "FileDetailItem";

const LinkDetailItem = memo(({ link, onOpen }) => (
  <div className="flex items-center gap-3 p-4 bg-base-300/30 dark:bg-base-100 rounded-xl transition-all duration-300">
    <div className="p-2 rounded-lg bg-info/10 text-info">
      <Link className="w-4 h-4" />
    </div>
    <div className="w-full overflow-hidden">
      <div className="flex items-center gap-1">
        <div className="w-full px-2 py-1.5 bg-base-200/30 dark:bg-base-300 border rounded outline-none focus:outline-none focus:border-primary focus:bg-transparent transition-all duration-200 text-base-content/80 border-transparent text-xs truncate">
          {link.url}
        </div>
        <button
          onClick={() => onOpen(link.url)}
          className="px-2 py-1.5 rounded bg-base-200 duration-200 transition-all active:-translate-y-1 active:scale-95 text-center text-base-content/60 hover:text-primary/60">
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
));
LinkDetailItem.displayName = "LinkDetailItem";

// ==================== OPTIMIZED MATERIAL CONTENT COMPONENT ====================
const MaterialContent = memo(({ material, showMore, onToggleMore }) => {
  // Hook khusus untuk code blocks Quill saja
  const { elementRef } = useQuillCodeCopy([material?.description, showMore]);

  return (
    <div className="mb-6 relative">
      {/* Header */}
      <h2 className="text-lg font-bold text-base-content flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        Deskripsi Materi
      </h2>

      {/* Content Container */}
      <div className="relative p-4 rounded-2xl bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm border border-base-300/20">
        {/* Description - Copy button akan otomatis muncul hanya di code blocks */}
        <div className="text-sm text-base-content/80">
          {/* Wrapper untuk content dengan copy buttons otomatis di code blocks */}
          <div
            ref={elementRef}
            className={`porse porse-sm quill-content ${
              !showMore ? "line-clamp-4" : ""
            }`}
            dangerouslySetInnerHTML={{
              __html: material.description,
            }}
          />

          {/* Show More/Less Button */}
          {material.description && material.description.length > 300 && (
            <button
              onClick={onToggleMore}
              className="mt-3 text-primary hover:text-primary/80 font-medium transition-colors text-sm flex items-center gap-2 hover:gap-3 group">
              <span>
                {showMore ? "Tampilkan Lebih Sedikit" : "Baca Selengkapnya"}
              </span>
              {showMore ? (
                <ChevronUp className="w-4 h-4 transition-transform group-hover:transform group-hover:-translate-y-0.5" />
              ) : (
                <ChevronDown className="w-4 h-4 transition-transform group-hover:transform group-hover:translate-y-0.5" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
MaterialContent.displayName = "MaterialContent";

// ==================== OPTIMIZED MAIN COMPONENT ====================
// Add this at the top of your AssignmentDetailPage component, replacing the existing code

const MaterialDetailPage = () => {
  const { code: classroomCode, materialId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedVideo, setSelectedVideo] = useState(null);
  // Move ALL useState hooks to the top, before any conditions
  const [successMessage, setSuccessMessage] = useState("");
  const [showMore, setShowMore] = useState(false);

  // Refs should also be at the top
  const successTimeoutRef = useRef(null);

  // Early return check AFTER all hooks
  const hasRequiredParams = classroomCode && materialId;
  // Optimized file filtering with memoization

  useEffect(() => {
    if (!hasRequiredParams) {
      console.error("[MaterialDetailPage] Missing required params:", {
        classroomCode,
        materialId,
      });
      navigate("/classrooms", { replace: true });
    }
  }, [hasRequiredParams, classroomCode, materialId, navigate]);

  // Optimized hook options - this is fine as useMemo
  const hookOptions = useMemo(
    () => ({
      autoLoad: true,
      enablePolling: false,
      pollingInterval: 30000,
      retryOnError: false,
      cacheTimeout: 300000,
      staleWhileRevalidate: true,
    }),
    []
  );

  // Custom hook call - make sure this is always called
  const {
    material,
    isLoading,
    isDeleting,
    error,
    isCacheStale,
    hasCachedData,
    refreshDetail,
    handleDelete,
    handleDownloadFile,
    handleViewExternal,
    downloadFileDirectly,
    fetchAttempts = 0,
  } = useMaterialDetail(classroomCode, materialId, hookOptions);

  const { videoFiles, nonVideoFiles } = useMemo(() => {
    const files = material?.file_urls || [];
    return {
      videoFiles: files.filter(isVideoFile),
      nonVideoFiles: files.filter((file) => !isVideoFile(file)),
    };
  }, [material?.file_urls]);

  // Optimasi: Update selectedVideo saat videoFiles berubah (misalnya update data dari server)
  useEffect(() => {
    if (selectedVideo) {
      const updatedVideo = videoFiles.find((v) => v.id === selectedVideo.id);
      if (updatedVideo && updatedVideo !== selectedVideo) {
        setSelectedVideo(updatedVideo);
      }
    }
  }, [videoFiles, selectedVideo]);

  // Optimasi: Auto-select first video jika belum ada yang dipilih
  useEffect(() => {
    if (videoFiles.length > 0 && !selectedVideo) {
      setSelectedVideo(videoFiles[0]);
    }
  }, [videoFiles, selectedVideo]);

  // Optimized derived state calculation
  const derivedState = useMemo(() => {
    const hasData = !!material;
    const hasError = !!error;
    const isInitialLoading = isLoading && !hasData && !hasError;
    const isDataAvailable = hasData || (hasCachedData && !hasError);
    const shouldShowLoading =
      isInitialLoading || (isLoading && !isDataAvailable);
    const isInitialized = hasData || hasError || fetchAttempts > 0;

    return {
      hasData,
      hasError,
      isInitialLoading,
      isDataAvailable,
      shouldShowLoading,
      isInitialized,
    };
  }, [material, isLoading, error, hasCachedData, fetchAttempts]);

  const TypeIcon = useMemo(() => getTypeIcon(material?.type), [material?.type]);

  // All your callback functions remain the same
  const handleBack = useCallback(() => {
    navigate(`/classrooms/${classroomCode}/material`);
  }, [navigate, classroomCode]);

  const handleEditClick = useCallback(() => {
    navigate(`/classrooms/${classroomCode}/material/${materialId}/edit`);
  }, [navigate, classroomCode, materialId]);

  const handleDeleteClick = useCallback(async () => {
    const result = await handleDelete(
      "Apakah Anda yakin ingin menghapus materi ini? Tindakan ini tidak dapat dibatalkan."
    );
    if (result?.success) {
      setSuccessMessage("Materi berhasil dihapus");
      setTimeout(() => handleBack(), 2000);
    }
  }, [handleDelete, handleBack]);

  const handleDownloadClick = useCallback(
    async (fileId) => {
      const file = material?.file_urls?.find(
        (f) => String(f.id) === String(fileId)
      );

      if (!file) {
        toast.error("File tidak ditemukan");
        return { success: false, error: "File not found" };
      }

      try {
        if (file.download_url) {
          const result = await handleDownloadFile(fileId, file.file_name, file);

          if (result?.success) {
            setSuccessMessage(`${file.file_name} berhasil diunduh`);
          }
          return result;
        } else {
          await downloadFileDirectly(file.path, file.path.split("/").pop());
          setSuccessMessage(`${file.file_name} berhasil diunduh`);
          return { success: true };
        }
      } catch (error) {
        console.error("Download error:", error);
        toast.error("Gagal mengunduh file");
        return { success: false, error };
      }
    },
    [handleDownloadFile, material, downloadFileDirectly]
  );

  const handleViewClick = useCallback(
    async (fileId) => {
      const file = material?.file_urls?.find(
        (f) => String(f.id) === String(fileId)
      );

      if (!file) {
        toast.error("File tidak ditemukan");
        return { success: false, error: "File not found" };
      }

      try {
        if (
          [
            "image/jpeg",
            "image/png",
            "image/jpg",
            "image/gif",
            "image/webp",
            "application/pdf",
          ].includes(file.type)
        ) {
          window.open(file.path, "_blank", "noopener,noreferrer");
          setSuccessMessage("File dibuka di tab baru");

          const result = await handleViewExternal(fileId);
          return { success: true, data: result };
        } else {
          return handleDownloadClick(fileId);
        }
      } catch (err) {
        console.error("View file error:", err);
        toast.error("Gagal membuka file");
        return { success: false, error: err };
      }
    },
    [material, handleViewExternal, handleDownloadClick]
  );

  const handleViewExternalClick = useCallback(
    async (linkUrl) => {
      if (!linkUrl) return;

      window.open(linkUrl, "_blank", "noopener,noreferrer");

      const linkObject = material.links?.find((link) => link.url === linkUrl);

      if (linkObject) {
        try {
          const result = await handleViewExternal(linkObject);
          if (result?.success) {
            setSuccessMessage("Link berhasil dibuka");
          }
        } catch (error) {
          console.error("External link view error:", error);
        }
      } else {
        setSuccessMessage("Link berhasil dibuka");
      }
    },
    [material, handleViewExternal]
  );

  const handleRefresh = useCallback(async () => {
    try {
      const result = await refreshDetail();
      if (result?.success) {
        setSuccessMessage("Data berhasil diperbarui");
      }
    } catch (error) {
      console.error("Refresh error:", error);
    }
  }, [refreshDetail]);

  const handleToggleMore = useCallback(() => {
    setShowMore((prev) => !prev);
  }, []);

  const handleRetry = useCallback(async () => {
    await refreshDetail();
  }, [refreshDetail]);

  const handleVideoViewUpdate = useCallback(
    async (fileId) => {
      try {
        const requestKey = `video-view-${fileId}`;
        const lastUpdate = sessionStorage.getItem(requestKey);

        if (lastUpdate) {
          const timeSinceLastUpdate = Date.now() - parseInt(lastUpdate);
          if (timeSinceLastUpdate < 300000) {
            console.log("Video view already updated recently, skipping");
            return;
          }
        }

        const result = await handleViewExternal(fileId);
        if (result?.success) {
          sessionStorage.setItem(requestKey, Date.now().toString());
          console.log("Video view count updated for file:", fileId);
        }
      } catch (error) {
        console.error("Failed to update video view count:", error);
      }
    },
    [handleViewExternal]
  );

  // Optimasi: Handler untuk memilih video tanpa rerender ulang jika video sama
  const handleSelectVideo = useCallback((video) => {
    setSelectedVideo((prev) => (prev?.id === video.id ? prev : video));
  }, []);

  // Success message cleanup effect
  useEffect(() => {
    if (successMessage) {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = setTimeout(() => setSuccessMessage(""), 5000);
    }
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, [successMessage]);

  // Early returns AFTER all hooks have been called
  if (!hasRequiredParams) {
    return null;
  }

  if (derivedState.shouldShowLoading) {
    return <LoadingState />;
  }

  if (derivedState.hasError && !derivedState.isDataAvailable) {
    return (
      <div className="w-full mx-auto min-h-screen">
        <div className="">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleBack}
              className="p-3 hover:bg-base-200/80 rounded-xl transition-all duration-200 hover:scale-105 group">
              <ArrowLeft className="w-6 h-6 text-base-content/60 group-hover:text-base-content transition-colors" />
            </button>
          </div>
          <ErrorMessage error={error} onRetry={handleRetry} />
        </div>
        <EmptyState onBack={handleBack} onRefresh={handleRefresh} />
      </div>
    );
  }

  if (!material && derivedState.isInitialized && !isLoading) {
    return <EmptyState onBack={handleBack} onRefresh={handleRefresh} />;
  }

  if (!material) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen px-1 md:px-0">
      {/* Header Navigation */}
      <div className="">
        {/* Cache status - only show if relevant */}
        {hasCachedData && (
          <div className="flex items-center gap-2 mb-4">
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                isCacheStale
                  ? "bg-warning/10 text-warning border border-warning/20"
                  : "bg-success/10 text-success border border-success/20"
              }`}>
              <div
                className={`w-2 h-2 rounded-full ${
                  isCacheStale ? "bg-warning" : "bg-success"
                } ${isLoading ? "animate-pulse" : ""}`}
              />
              {isLoading
                ? "Memperbarui..."
                : isCacheStale
                ? "Data mungkin sudah lama"
                : "Data terbaru"}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-1.5 hover:bg-base-200 rounded-lg transition-all group"
              aria-label="Refresh data">
              <RefreshCw
                className={`w-4 h-4 text-base-content/60 group-hover:text-base-content ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        )}

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 animate-fade-in">
            <SuccessMessage message={successMessage} />
          </div>
        )}

        {error && material && (
          <div className="mb-6 animate-fade-in">
            <ErrorMessage error={error} onRetry={handleRetry} />
          </div>
        )}
      </div>

      {/* Material Header */}
      <div
        className={`mb-6 p-4 rounded-2xl bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm ${
          isLoading ? "opacity-70" : ""
        }`}>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between">
            <div className="flex items-start md:items-center gap-4">
              <div
                className={`p-4 rounded-xl bg-gradient-to-br ${
                  material.type === "document"
                    ? "from-blue-100 to-blue-200 shadow-blue-200/50"
                    : material.type === "video"
                    ? "from-red-100 to-red-200 shadow-red-200/50"
                    : material.type === "link"
                    ? "from-green-100 to-green-200 shadow-green-200/50"
                    : material.type === "assignment"
                    ? "from-purple-100 to-purple-200 shadow-purple-200/50"
                    : "from-orange-100 to-orange-200 shadow-orange-200/50"
                }`}>
                <TypeIcon
                  className={`w-8 h-8 ${getTypeColor(material.type)}`}
                />
              </div>
              <div>
                <h1 className="md:text-xl font-bold text-base-content mb-3 leading-tight">
                  {material.title}
                </h1>
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-medium text-sm bg-gradient-to-r backdrop-blur-sm shadow-sm border shadow-sm ${
                    material.type === "document"
                      ? "from-blue-100/90 to-blue-200/90 text-blue-800 border-blue-300/50"
                      : material.type === "video"
                      ? "from-red-100/90 to-red-200/90 text-red-800 border-red-300/50"
                      : material.type === "link"
                      ? "from-green-100/90 to-green-200/90 text-green-800 border-green-300/50"
                      : material.type === "assignment"
                      ? "from-purple-100/90 to-purple-200/90 text-purple-800 border-purple-200/50"
                      : "from-orange-100/90 to-orange-200/90 text-orange-800 border-orange-300/50"
                  }`}>
                  <TypeIcon className="w-4 h-4" />
                  {getTypeLabel(material.type)}
                </span>
              </div>
            </div>
            <div className="dropdown dropdown-end w-fit">
              <div
                tabIndex={0}
                role="button"
                className="p-2 hover:bg-base-200 rounded-lg">
                <MoreHorizontal className="w-5 h-5" />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 bg-base-100 rounded-xl w-48 border border-base-300/50">
                <li>
                  <button
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                    className="flex items-center gap-2 text-error disabled:opacity-50">
                    {isDeleting ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Trash className="w-4 h-4" />
                    )}
                    {isDeleting ? "Menghapus..." : "Hapus Materi"}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-base-content/70 mb-4">
              <div className="flex items-center gap-2 px-2 py-1 bg-base-100/50 rounded-full">
                <Calendar className="w-3 h-3" />
                <span>Dibuat {formatDateRelative(material.created_at)}</span>
              </div>
              {material.updated_at !== material.created_at && (
                <div className="flex items-center gap-2 px-2 py-1 bg-base-100/50 rounded-full">
                  <Clock className="w-3 h-3" />
                  <span>
                    Diperbarui {formatDateRelative(material.updated_at)}
                  </span>
                </div>
              )}
              {material.uploader && (
                <div className="flex items-center gap-2 px-2 py-1 bg-base-100/50 rounded-full">
                  <User className="w-3 h-3" />
                  <span>{material.uploader.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 px-2 py-1 bg-base-100/50 rounded-full">
                {material.is_visible ? (
                  <>
                    <Globe className="w-3 h-3 text-success" />
                    <span className="text-success">Publik</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 text-warning" />
                    <span className="text-warning">Tersembunyi</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton
                onClick={handleEditClick}
                icon={Edit}
                label="Edit"
                color="warning"
              />
              {material.links?.length > 0 && (
                <ActionButton
                  onClick={() => handleViewExternalClick(material.links[0].url)}
                  icon={ExternalLink}
                  label={`Buka Link`}
                  color="info"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}

      <div className="grid gap-4 md:gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={Eye}
              label="Dilihat"
              value={
                Array.isArray(material?.file_urls)
                  ? material.file_urls
                      .reduce((sum, file) => sum + file.view_count, 0)
                      .toLocaleString()
                  : "0"
              }
              color="blue"
            />
            <StatCard
              icon={Download}
              label="Diunduh"
              value={
                Array.isArray(material?.file_urls)
                  ? material.file_urls
                      .reduce((sum, file) => sum + file.download_count, 0)
                      .toLocaleString()
                  : "0"
              }
              color="green"
            />
            <StatCard
              icon={Star}
              label="File Materi"
              value={material.file_urls?.length || 0}
              color="yellow"
            />
            <StatCard
              icon={Video}
              label="Video"
              value={videoFiles.length}
              color="red"
            />
          </div>
          {/* Statistics Overview */}
          <>
            {/* Description */}
            {material.description && (
              <Suspense
                fallback={<LoadingSpinner size="lg" className="mx-auto" />}>
                <MaterialContent
                  material={material}
                  showMore={showMore}
                  onToggleMore={handleToggleMore}
                />
              </Suspense>
            )}

            {/* Video Section - Display below description */}
            {videoFiles.length > 0 && (
              <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className={isMobile ? "max-w-full" : "col-span-1"}>
                  <VideoListSidebar
                    videos={videoFiles}
                    activeVideoId={selectedVideo?.id}
                    onSelectVideo={handleSelectVideo}
                  />
                </div>
                <div
                  className={isMobile ? "min-w-full px-1" : "col-span-2 px-1"}>
                  {selectedVideo ? (
                    <VideoPlayer
                      videoFile={selectedVideo}
                      onViewUpdate={handleVideoViewUpdate}
                    />
                  ) : (
                    <p className="text-center py-6 text-base-content/50">
                      Pilih video dari sidebar
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-4">
          {/* Non-Video Files */}
          {nonVideoFiles.length > 0 && (
            <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm rounded-2xl border border-base-200/50 p-4">
              <h3 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                File ({nonVideoFiles.length})
              </h3>
              <div className="space-y-2">
                {nonVideoFiles.map((file) => (
                  <FileDetailItem
                    key={file.id}
                    file={file}
                    onView={() => handleViewClick(file.id)}
                    onDownload={handleDownloadClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Link */}
          {material.links?.length > 0 && (
            <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm rounded-2xl border border-base-200/50 p-4">
              <h3 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
                <Link className="w-5 h-5 text-primary" />
                Link Eksternal
              </h3>
              <div className="space-y-2">
                {material.links.map((link, index) => (
                  <LinkDetailItem
                    key={index}
                    link={link}
                    onOpen={handleViewExternalClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Material Properties */}
          <div
            className={`mb-6 p-4 rounded-2xl bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm ${
              isLoading ? "opacity-70" : ""
            }`}>
            <h3 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Properti Materi
            </h3>
            <div className="space-y-2">
              <PropertyItem
                icon={material.is_visible ? Globe : Lock}
                label="Visibilitas"
                value={
                  material.is_visible ? "Terlihat oleh Siswa" : "Tersembunyi"
                }
                color={material.is_visible ? "success" : "warning"}
              />
              <PropertyItem
                icon={Calendar}
                label="Dibuat"
                value={formatDate(material.created_at)}
                color="info"
              />
              {material.available_from && (
                <PropertyItem
                  icon={Calendar}
                  label="Tersedia Dari"
                  value={formatDate(material.available_from)}
                  color="primary"
                />
              )}
              {material.available_until && (
                <PropertyItem
                  icon={Calendar}
                  label="Tersedia Hingga"
                  value={formatDate(material.available_until)}
                  color="warning"
                />
              )}
              <PropertyItem
                icon={User}
                label="Pengajar"
                value={material.uploader?.name || "Tidak Diketahui"}
                color="info"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 rounded-2xl bg-base-100 dark:bg-base-200 border border-base-200/50 backdrop-blur-sm shadow-sm">
            <h3 className="text-lg font-bold text-base-content mb-4">
              Aksi Cepat
            </h3>
            <div className="space-y-2">
              <button
                onClick={() =>
                  navigate(
                    `/classrooms/${classroomCode}/material/create?duplicate=${materialId}`
                  )
                }
                className="w-full flex items-center gap-2 p-3 bg-info/10 text-info hover:bg-info/20 rounded-xl transition-all duration-200 font-medium">
                <Copy className="w-4 h-4" />
                <span>Duplikat Materi</span>
              </button>
              <button
                onClick={() =>
                  navigate(
                    `/classrooms/${classroomCode}/material/${materialId}/history`
                  )
                }
                className="w-full flex items-center gap-2 p-3 bg-secondary/10 text-secondary hover:bg-secondary/20 rounded-xl transition-all duration-200 font-medium">
                <History className="w-4 h-4" />
                <span>Lihat Riwayat</span>
              </button>
              <button
                onClick={() => {
                  const data = {
                    ...material,
                    exported_at: new Date().toISOString(),
                  };
                  const blob = new Blob([JSON.stringify(data, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `material-${material.id}-export.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  setSuccessMessage("Data materi berhasil diekspor");
                }}
                className="w-full flex items-center gap-2 p-3 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-all duration-200 font-medium">
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </button>
              <button
                onClick={async () => {
                  const shareData = {
                    title: material?.title || "Materi Pembelajaran",
                    text: `Lihat materi pembelajaran: ${material?.title}`,
                    url: window.location.href,
                  };
                  if (navigator.share) {
                    try {
                      await navigator.share(shareData);
                      setSuccessMessage("Berhasil membagikan materi");
                    } catch (err) {
                      console.log("Share cancelled");
                    }
                  } else {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      setSuccessMessage("Link berhasil disalin ke clipboard");
                    } catch (err) {
                      console.error("Failed to copy link");
                    }
                  }
                }}
                className="w-full flex items-center gap-2 p-3 bg-secondary/10 text-secondary hover:bg-secondary/20 rounded-xl transition-all duration-200 font-medium">
                <Share2 className="w-4 h-4" />
                <span>Bagikan Materi</span>
              </button>
              <div className="divider my-2"></div>
              <button
                onClick={() => alert("Fitur laporan akan segera tersedia")}
                className="w-full flex items-center gap-2 p-3 bg-warning/10 text-warning hover:bg-warning/20 rounded-xl transition-all duration-200 font-medium">
                <Flag className="w-4 h-4" />
                <span>Laporkan Masalah</span>
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="w-full flex items-center gap-2 p-3 bg-error/10 text-error hover:bg-error/20 rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                {isDeleting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Trash className="w-4 h-4" />
                )}
                <span>{isDeleting ? "Menghapus..." : "Hapus Materi"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(MaterialDetailPage);
