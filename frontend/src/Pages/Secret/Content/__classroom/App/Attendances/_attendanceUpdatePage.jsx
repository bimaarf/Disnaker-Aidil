import QuillResizeModule from "@botom/quill-resize-module";
import ImageResize from "@mgreminger/quill-image-resize-module";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle,
  Eye,
  FileIcon,
  FileText,
  Globe,
  Link,
  Lock,
  RefreshCw,
  Save,
  X
} from "lucide-react";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactQuill, { Quill } from "react-quill";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "../../../../../../custom-quill-tooltip.css";
import useAttendance, {
  useMeetingDetail,
} from "../../../../../../features/classroom/attendanceHook";

// Register custom Quill formats and modules (unchanged)
const ImageAlign = Quill.import("formats/image");
// Format date untuk input date (YYYY-MM-DD)
// Format date untuk input date (YYYY-MM-DD) using local time

class CustomImage extends ImageAlign {
  static create(value) {
    const node = super.create(value);
    if (typeof value === "object") {
      if (value.src) node.setAttribute("src", value.src);
      if (value.alt) node.setAttribute("alt", value.alt);
      if (value.width) node.setAttribute("width", value.width);
      if (value.height) node.setAttribute("height", value.height);
      if (value.style) node.setAttribute("style", value.style);
      if (value.class) node.setAttribute("class", value.class);
    }
    return node;
  }
  static value(node) {
    return {
      src: node.getAttribute("src"),
      alt: node.getAttribute("alt"),
      width: node.getAttribute("width"),
      height: node.getAttribute("height"),
      style: node.getAttribute("style"),
      class: node.getAttribute("class"),
    };
  }
  format(name, value) {
    if (["width", "height", "style", "class"].includes(name)) {
      if (value) this.domNode.setAttribute(name, value);
      else this.domNode.removeAttribute(name);
    } else {
      super.format(name, value);
    }
  }
}

const VideoAlign = Quill.import("formats/video");
class CustomVideo extends VideoAlign {
  static create(value) {
    const node = super.create(value);
    if (typeof value === "object") {
      if (value.src) node.setAttribute("src", value.src);
      if (value.width) node.setAttribute("width", value.width);
      if (value.height) node.setAttribute("height", value.height);
      if (value.style) node.setAttribute("style", value.style);
      if (value.class) node.setAttribute("class", value.class);
    }
    return node;
  }
  static value(node) {
    return {
      src: node.getAttribute("src"),
      width: node.getAttribute("width"),
      height: node.getAttribute("height"),
      style: node.getAttribute("style"),
      class: node.getAttribute("class"),
    };
  }
  format(name, value) {
    if (["width", "height", "style", "class"].includes(name)) {
      if (value) this.domNode.setAttribute(name, value);
      else this.domNode.removeAttribute(name);
    } else {
      super.format(name, value);
    }
  }
}

Quill.register(CustomImage, true);
Quill.register(CustomVideo, true);
if (!Quill.imports["modules/imageResize"]) {
  Quill.register("modules/imageResize", ImageResize);
}
if (!Quill.imports["modules/resize"]) {
  Quill.register("modules/resize", QuillResizeModule);
}

// Constants (unchanged)
const MEETING_TYPES = [
  {
    value: "regular",
    label: "Reguler",
    icon: BookOpen,
    color: "text-blue-600",
  },
];

const getTypeConfig = (type) =>
  MEETING_TYPES.find((t) => t.value === type) || MEETING_TYPES[0];

// UI Components (reuse from MaterialDetailPage where possible)
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
  <div className="w-full py-6 min-h-screen bg-gradient-to-br from-base-50/30 to-base-100/50">
    <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-3xl border border-base-300/50">
      <div className="text-center py-16">
        <FileText className="w-20 h-20 mx-auto mb-6 text-base-content/30" />
        <h3 className="text-2xl font-bold text-base-content mb-4">
          Pertemuan Tidak Ditemukan
        </h3>
        <p className="text-base-content/60 mb-8 max-w-md mx-auto">
          Pertemuan yang Anda cari tidak dapat ditemukan. Mungkin telah dihapus
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
));
EmptyState.displayName = "EmptyState";

const LoadingState = memo(() => (
  <div className="w-full mx-auto px-4 py-6 min-h-screen bg-gradient-to-br from-base-50/30 to-base-100/50">
    <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-3xl border border-base-300/50">
      <div className="p-8">
        <div className="text-center py-16">
          <LoadingSpinner size="xl" className="mx-auto mb-6" />
          <h3 className="text-xl font-bold text-base-content mb-2">
            Memuat Data Pertemuan
          </h3>
          <p className="text-base-content/60">
            Sedang mengambil informasi pertemuan untuk diedit...
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
      "flex items-center gap-2 font-semibold transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none rounded-2xl";
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
        type="button"
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

const FileItem = memo(({ file, onRemove, isExisting = false }) => {
  const fileName = isExisting ? file.file_name || "Unknown" : file.name;
  const fileSize = isExisting
    ? file.size || "Unknown"
    : `${(file.size / 1024 / 1024).toFixed(2)} MB`;

  return (
    <div className="flex items-center gap-3 p-4 bg-base-300/30 dark:bg-base-100 rounded-xl transition-all duration-300">
      <div className="p-2 rounded-lg bg-info/10 text-info">
        <FileIcon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-base-content">{fileName}</div>
        <div className="text-xs text-base-content/60 mt-1">
          {fileSize} {isExisting && "• File yang ada"}
        </div>
      </div>
      <button
        onClick={() => onRemove(file.id || file)}
        className="px-2 py-1 rounded bg-base-200 duration-200 transition-all active:-translate-y-1 active:scale-95 text-center text-base-content/60 hover:text-error/60">
        <X size={16} />
      </button>
    </div>
  );
});
FileItem.displayName = "FileItem";

const LinkItem = memo(({ link, index, onUpdate, onRemove }) => (
  <div className="flex items-center gap-3 p-4 bg-base-300/30 dark:bg-base-100 rounded-xl transition-all duration-300">
    <div className="p-2 rounded-lg bg-info/10 text-info">
      <Link className="w-4 h-4" />
    </div>
    <div className="w-full overflow-hidden">
      {/* <div className="text-xs text-base-content/60 mt-1">Link URL</div> */}
      <div className="flex items-center gap-1">
        <input
          type="url"
          value={link}
          onChange={(e) => onUpdate(index, e.target.value)}
          placeholder="https://example.com"
          className="w-full px-2 py-1.5 bg-base-200/30 dark:bg-base-300 border rounded outline-none focus:outline-none focus:border-primary focus:bg-transparent transition-all duration-200 text-base-content/80 border-transparent text-xs"
        />
        <button
          onClick={() => onRemove(index)}
          className="px-2 py-1.5 rounded bg-base-200 duration-200 transition-all active:-translate-y-1 active:scale-95 text-center text-base-content/60 hover:text-error/60">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
));
LinkItem.displayName = "LinkItem";

const AttendanceUpdatePage = () => {
  const { code: classroomCode, meetingId } = useParams();
  const navigate = useNavigate();
  const quillRef = useRef(null);

  // State management
  const [description, setDescription] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    meeting_date: "",
    start_time: "",
    end_time: "",
    type: "regular",
    location: "",
    is_mandatory: true,
    agenda: "",
    materials_covered: "",
    homework_assigned: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  // Refs
  const initialDataRef = useRef(null);
  const isInitialized = useRef(false);
  const draftLoaded = useRef(false);

  // Meeting detail hook
  const {
    meeting,
    isLoading,
    error,
    isCacheStale,
    hasCachedData,
    refreshDetail: refreshMeetingDetail,
    cachedData,
    fetchAttempts = 0,
  } = useMeetingDetail(classroomCode, meetingId, {
    autoLoad: true,
    enablePolling: false,
    autoRefreshAfterUpdate: false,
  });

  const { editMeeting } = useAttendance(classroomCode);

  const derivedState = useMemo(() => {
    const hasData = !!meeting;
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
  }, [meeting, isLoading, error, hasCachedData, fetchAttempts]);

  const draftKey = `attendance_draft_${classroomCode}_${meetingId}`;

  const toolbarOptions = [
    ["bold", "italic", "underline", "strike"],
    ["blockquote", "code-block"],
    ["link", "image", "video"],
    [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
    [{ script: "sub" }, { script: "super" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ direction: "rtl" }],
    [{ size: ["small", false, "large", "huge"] }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ color: [] }, { background: [] }],
    [{ font: [] }],
    // tombol align custom kita
    // [{ align: [] }],
    ["alignLeft", "alignCenter", "alignRight"],
    ["clean"],
  ];

  const quillModules = useMemo(() => {
    const modules = {
      toolbar: {
        container: toolbarOptions,
        handlers: {
          image: function () {
            const input = document.createElement("input");
            input.setAttribute("type", "file");
            input.setAttribute("accept", "image/*");
            input.click();
            input.onchange = () => {
              const file = input.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  const range = this.quill.getSelection();
                  this.quill.insertEmbed(range.index, "image", {
                    src: e.target.result,
                    alt: file.name,
                    style: "max-width: 100%; height: auto;",
                  });
                  this.quill.setSelection(range.index + 1);
                };
                reader.readAsDataURL(file);
              }
            };
          },
          alignLeft: function () {
            const range = this.quill.getSelection();
            if (!range) return;
            const [leaf] = this.quill.getLeaf(range.index);
            if (!leaf) return;
            const node = leaf.domNode;
            if (node.tagName === "IMG") {
              node.style.display = "block";
              node.style.float = "left";
              node.style.margin = "0 1em 1em 0";
            } else if (node.classList && node.classList.contains("ql-video")) {
              node.style.display = "block";
              node.style.float = "left";
              node.style.margin = "0 1em 1em 0";
            } else {
              this.quill.format("align", false);
            }
          },
          alignCenter: function () {
            const range = this.quill.getSelection();
            if (!range) return;
            const [leaf] = this.quill.getLeaf(range.index);
            if (!leaf) return;
            const node = leaf.domNode;
            if (node.tagName === "IMG") {
              node.style.display = "block";
              node.style.margin = "0 auto";
              node.style.float = "none";
            } else if (node.classList && node.classList.contains("ql-video")) {
              node.style.display = "block";
              node.style.margin = "0 auto";
              node.style.float = "none";
            } else {
              this.quill.format("align", "center");
            }
          },
          alignRight: function () {
            const range = this.quill.getSelection();
            if (!range) return;
            const [leaf] = this.quill.getLeaf(range.index);
            if (!leaf) return;
            const node = leaf.domNode;
            if (node.tagName === "IMG") {
              node.style.display = "block";
              node.style.float = "right";
              node.style.margin = "0 0 1em 1em";
            } else if (node.classList && node.classList.contains("ql-video")) {
              node.style.display = "block";
              node.style.float = "right";
              node.style.margin = "0 0 1em 1em";
            } else {
              this.quill.format("align", "right");
            }
          },
        },
      },
      clipboard: { matchVisual: false },
      history: { delay: 1000, maxStack: 100, userOnly: true },
    };

    try {
      if (typeof ImageResize === "function") {
        modules.imageResize = {
          modules: ["Resize", "DisplaySize"],
        };
      }
    } catch (e) {
      console.warn("ImageResize module could not be loaded:", e);
    }

    try {
      if (typeof QuillResizeModule === "function") {
        modules.resize = {
          showToolbar: false,
          onResize: (element) => {
            document.querySelector(".custom-align-tooltip")?.remove();
            const tooltip = document.createElement("div");
            tooltip.className = "custom-align-tooltip";
            tooltip.style.position = "absolute";
            tooltip.style.top =
              element.getBoundingClientRect().top - 45 + window.scrollY + "px";
            tooltip.style.left =
              element.getBoundingClientRect().left + window.scrollX + "px";
            tooltip.style.display = "flex";
            tooltip.style.gap = "6px";
            tooltip.style.zIndex = 9999;

            const setAlign = (dir) => {
              if (element.tagName === "IMG") {
                element.style.display = "block";
                element.style.margin = "";
                element.style.float = "";
                if (dir === "left") {
                  element.style.float = "left";
                  element.style.margin = "0 1em 1em 0";
                } else if (dir === "right") {
                  element.style.float = "right";
                  element.style.margin = "0 0 1em 1em";
                } else if (dir === "center") {
                  element.style.margin = "0 auto";
                }
              } else if (element.classList.contains("ql-video")) {
                const wrapper = element.parentNode;
                wrapper.style.textAlign = dir;
                element.style.display = "block";
                element.style.float = "none";
                element.style.margin = dir === "center" ? "0 auto" : "0";
              }
            };

            const makeButton = (label, dir) => {
              const btn = document.createElement("button");
              btn.innerText = label;
              btn.className = "align-btn";
              btn.onclick = () => {
                setAlign(dir);
                tooltip.remove();
              };
              return btn;
            };

            tooltip.appendChild(makeButton("Left", "left"));
            tooltip.appendChild(makeButton("Center", "center"));
            tooltip.appendChild(makeButton("Right", "right"));
            document.body.appendChild(tooltip);
            element.onmouseleave = () => tooltip.remove();
          },
        };
      }
    } catch (e) {
      console.warn("QuillResizeModule could not be loaded:", e);
    }

    return modules;
  }, []);

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "code-block",
    "list",
    "bullet",
    "check",
    "script",
    "indent",
    "direction",
    "size",
    "color",
    "background",
    "font",
    "align",
    "link",
    "image",
    "video",
    "width",
    "height",
    "alt",
    "style",
    "class",
  ];

  // Handlers (unchanged except for minor adjustments)
  const handleDescriptionChange = useCallback((content, source) => {
    setDescription(content);
    if (source === "user" && quillRef.current) {
      const quillInstance = quillRef.current.getEditor();
      const images = quillInstance.root.querySelectorAll("img");
      const videos = quillInstance.root.querySelectorAll("iframe.ql-video");
      images.forEach((img) => {
        if (!img.style.maxWidth) {
          img.style.maxWidth = "100%";
          img.style.height = "auto";
        }
      });
      videos.forEach((video) => {
        if (!video.style.maxWidth) {
          video.style.maxWidth = "100%";
          video.style.height = "auto";
        }
      });
    }
  }, []);

  useEffect(() => {
    const dataSource = meeting || cachedData;
    if (
      dataSource &&
      (!isInitialized.current ||
        dataSource.updated_at !== initialDataRef.current?.updated_at)
    ) {
      const initialData = {
        title: dataSource.title || "",
        meeting_date: dataSource.meeting_date,
        start_time: dataSource.start_time,
        end_time: dataSource.end_time,
        type: dataSource.type || "regular",
        location: dataSource.location || "",
        is_mandatory: dataSource.is_mandatory ?? true,
        agenda: dataSource.agenda || "",
        materials_covered: dataSource.materials_covered || "",
        homework_assigned: dataSource.homework_assigned || "",
        notes: dataSource.notes || "",
      };
      setFormData(initialData);
      setDescription(dataSource.description || "");
      initialDataRef.current = {
        ...initialData,
        description: dataSource.description || "",
        updated_at: dataSource.updated_at,
      };
      isInitialized.current = true;
      if (!draftLoaded.current) {
        const saved = localStorage.getItem(draftKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setFormData(parsed.formData);
          setDescription(parsed.description || "");
          setIsDirty(true);
          toast.info("Memuat draft yang tersimpan");
        }
        draftLoaded.current = true;
      }
    }
  }, [meeting, cachedData, draftKey]);

  useEffect(() => {
    if (!initialDataRef.current) return;
    const currentFormData = { ...formData, description };
    const initialFormData = { ...initialDataRef.current };
    const isFormDirty =
      JSON.stringify(currentFormData) !== JSON.stringify(initialFormData);
    setIsDirty(isFormDirty);
  }, [formData, description]);

  useEffect(() => {
    if (isDirty) {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          formData,
          description,
        })
      );
    } else {
      localStorage.removeItem(draftKey);
    }
  }, [draftKey, formData, description, isDirty]);

  const handleBack = useCallback(() => {
    if (
      isDirty &&
      !window.confirm("Perubahan belum disimpan. Yakin ingin keluar?")
    ) {
      return;
    }
    navigate(`/classrooms/${classroomCode}/attendance/${meetingId}`);
  }, [navigate, classroomCode, meetingId, isDirty]);

  const handleFormChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationErrors((prev) => ({ ...prev, [field]: null }));
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = "Judul pertemuan harus diisi";
    }

    if (!formData.meeting_date) {
      errors.meeting_date = "Tanggal pertemuan harus diisi";
    }

    if (!formData.type) {
      errors.type = "Tipe pertemuan harus dipilih";
    }

    if (formData.start_time && formData.end_time) {
      if (formData.start_time >= formData.end_time) {
        errors.end_time = "Waktu selesai harus setelah waktu mulai";
      }
    }

    return errors;
  }, [formData]);

  // Updated handleSubmit function
  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast.error("Mohon perbaiki error pada form");
        return;
      }
      setIsSubmitting(true);
      setValidationErrors({});
      try {
        const submitData = {
          ...formData,
          is_mandatory: formData.is_mandatory ? 1 : 0 || null,
          description: description || null,
          // Convert time fields to H:i format
          start_time: formData.start_time,
          end_time: formData.end_time,
        };

        const result = await editMeeting(meetingId, submitData, {
          optimistic: true,
          syncCache: true,
        });

        if (result.success) {
          setSuccessMessage("Pertemuan berhasil diperbarui");
          setIsDirty(false);
          const updatedMeeting = result.data || {
            ...meeting,
            ...submitData,
            updated_at: new Date().toISOString(),
          };
          initialDataRef.current = {
            ...formData,
            description,
            updated_at: updatedMeeting.updated_at,
          };
          localStorage.removeItem(draftKey);
          // navigate(
          //   `/classrooms/${classroomCode}/attendance/${meetingId}`
          // );
        }
      } catch (err) {
        console.error("Update error:", err);
        toast.error("Gagal memperbarui pertemuan");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      formData,
      validateForm,
      editMeeting,
      meetingId,
      meeting,
      draftKey,
      description,
    ]
  );

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (!classroomCode || !meetingId) {
      navigate("/classrooms", { replace: true });
    }
  }, [classroomCode, meetingId, navigate]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  if (!classroomCode || !meetingId) {
    return null;
  }

  if (derivedState.shouldShowLoading) {
    return <LoadingState />;
  }

  if (derivedState.hasError && !derivedState.isDataAvailable) {
    return (
      <div className="w-full py-6 min-h-screen bg-gradient-to-br from-base-50/30 to-base-100/50">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleBack}
              className="p-3 hover:bg-base-200/80 rounded-xl transition-all duration-200 hover:scale-105 group">
              <ArrowLeft className="w-6 h-6 text-base-content/60 group-hover:text-base-content transition-colors" />
            </button>
          </div>
          <ErrorMessage error={error} onRetry={refreshMeetingDetail} />
        </div>
        <EmptyState onBack={handleBack} onRefresh={refreshMeetingDetail} />
      </div>
    );
  }

  if (!meeting && derivedState.isInitialized && !isLoading) {
    return <EmptyState onBack={handleBack} onRefresh={refreshMeetingDetail} />;
  }

  if (!meeting) {
    return <LoadingState />;
  }

  const TypeIcon = getTypeConfig(formData.type).icon;

  return (
    <div className="w-full py-6 min-h-screen bg-gradient-to-br from-base-50/30 to-base-100/50">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="p-3 hover:bg-base-200/80 rounded-xl transition-all duration-200 hover:scale-105 group">
            <ArrowLeft className="w-6 h-6 text-base-content/60 group-hover:text-base-content transition-colors" />
          </button>
          <nav className="text-sm breadcrumbs">
            <ul className="flex items-center gap-2 text-base-content/60">
              <li>
                <RouterLink
                  to={`/classrooms/${classroomCode}`}
                  className="hover:text-primary transition-colors">
                  {meeting?.classroom?.name || "Kelas"}
                </RouterLink>
              </li>
              <li className="text-base-content/40">/</li>
              <li>
                <RouterLink
                  to={`/classrooms/${classroomCode}/attendance`}
                  className="hover:text-primary transition-colors">
                  Pertemuan
                </RouterLink>
              </li>
              <li className="text-base-content/40">/</li>
              <li>
                <RouterLink
                  to={`/classrooms/${classroomCode}/attendance/${meetingId}`}
                  className="hover:text-primary transition-colors">
                  Detail Pertemuan
                </RouterLink>
              </li>
              <li className="text-base-content/40">/</li>
              <li className="text-base-content font-medium">Edit Pertemuan</li>
            </ul>
          </nav>
        </div>

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
                : "Data dari cache"}
            </div>
            <ActionButton
              onClick={refreshMeetingDetail}
              icon={RefreshCw}
              label="Refresh"
              color="ghost"
              size="sm"
              className="p-1.5"
            />
          </div>
        )}

        {successMessage && (
          <div className="mb-6 animate-fade-in">
            <SuccessMessage message={successMessage} />
          </div>
        )}

        {error && hasCachedData && (
          <div className="mb-6 animate-fade-in">
            <ErrorMessage error={error} onRetry={refreshMeetingDetail} />
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Main Form Card */}
            <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-2xl shadow-sm border border-base-200/50 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`p-4 rounded-xl bg-gradient-to-br ${
                    formData.type === "regular"
                      ? "from-blue-100 to-blue-200 shadow-blue-200/50"
                      : formData.type === "exam"
                      ? "from-red-100 to-red-200 shadow-red-200/50"
                      : formData.type === "quiz"
                      ? "from-orange-100 to-orange-200 shadow-orange-200/50"
                      : formData.type === "presentation"
                      ? "from-purple-100 to-purple-200 shadow-purple-200/50"
                      : "from-green-100 to-green-200 shadow-green-200/50"
                  }`}>
                  <TypeIcon
                    className={`w-8 h-8 ${getTypeConfig(formData.type).color}`}
                  />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-base-content">
                    Edit Pertemuan
                  </h1>
                  <p className="text-sm text-base-content/60 mt-2">
                    Perbarui informasi pertemuan
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Judul Pertemuan <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleFormChange("title", e.target.value)}
                    className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                      validationErrors.title
                        ? "border-error"
                        : "border-base-300"
                    }`}
                    placeholder="Masukkan judul pertemuan..."
                  />
                  {validationErrors.title && (
                    <p className="mt-2 text-sm text-error">
                      {validationErrors.title}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Tipe Pertemuan <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.type}
                      onChange={(e) => handleFormChange("type", e.target.value)}
                      className="w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 border-base-300 appearance-none">
                      {MEETING_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Wajib Dihadiri
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-base-100/60 rounded-2xl hover:bg-base-100/80 border border-base-200/30 transition-all duration-300 cursor-pointer">
                    <input
                      id="is_mandatory"
                      type="checkbox"
                      name="is_mandatory"
                      checked={formData.is_mandatory}
                      onChange={(e) =>
                        handleFormChange("is_mandatory", e.target.checked)
                      }
                      className="h-5 w-5 text-primary border-base-300 rounded focus:ring-primary/30 transition-colors"
                    />
                    <div>
                      <span className="text-sm font-medium text-base-content">
                        Pertemuan wajib dihadiri
                      </span>
                      <p className="text-xs text-base-content/60 mt-1">
                        Siswa diwajibkan menghadiri pertemuan ini
                      </p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Tanggal Pertemuan <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.meeting_date}
                    onChange={(e) =>
                      handleFormChange("meeting_date", e.target.value)
                    }
                    className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                      validationErrors.meeting_date
                        ? "border-error"
                        : "border-base-300"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Lokasi
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      handleFormChange("location", e.target.value)
                    }
                    className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                      validationErrors.location
                        ? "border-error"
                        : "border-base-300"
                    }`}
                    placeholder="Masukkan lokasi pertemuan (opsional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Waktu Mulai
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) =>
                      handleFormChange("start_time", e.target.value)
                    }
                    className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                      validationErrors.start_time
                        ? "border-error"
                        : "border-base-300"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Waktu Selesai
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) =>
                      handleFormChange("end_time", e.target.value)
                    }
                    className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                      validationErrors.end_time
                        ? "border-error"
                        : "border-base-300"
                    }`}
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Deskripsi Pertemuan
                  </label>
                  <div
                    className={`custom-quill ${
                      validationErrors?.description ? "error" : ""
                    }`}>
                    <ReactQuill
                      ref={quillRef}
                      theme="snow"
                      value={description}
                      onChange={handleDescriptionChange}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder="Tulis keterangan..."
                      className="bg-transparent"
                      style={{
                        backgroundColor: "transparent",
                        minHeight: "200px",
                      }}
                    />
                  </div>
                  {validationErrors.description && (
                    <p className="mt-2 text-sm text-error">
                      {validationErrors.description}
                    </p>
                  )}
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Agenda
                  </label>
                  <textarea
                    value={formData.agenda}
                    onChange={(e) => handleFormChange("agenda", e.target.value)}
                    rows={3}
                    className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                      validationErrors.agenda
                        ? "border-error"
                        : "border-base-300"
                    }`}
                    placeholder="Masukkan agenda pertemuan"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Materi yang Dibahas
                  </label>
                  <textarea
                    value={formData.materials_covered}
                    onChange={(e) =>
                      handleFormChange("materials_covered", e.target.value)
                    }
                    rows={3}
                    className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                      validationErrors.materials_covered
                        ? "border-error"
                        : "border-base-300"
                    }`}
                    placeholder="Masukkan materi yang dibahas"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Tugas yang Diberikan
                  </label>
                  <textarea
                    value={formData.homework_assigned}
                    onChange={(e) =>
                      handleFormChange("homework_assigned", e.target.value)
                    }
                    rows={3}
                    className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                      validationErrors.homework_assigned
                        ? "border-error"
                        : "border-base-300"
                    }`}
                    placeholder="Masukkan tugas yang diberikan"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Catatan
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleFormChange("notes", e.target.value)}
                    rows={3}
                    className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                      validationErrors.notes
                        ? "border-error"
                        : "border-base-300"
                    }`}
                    placeholder="Masukkan catatan tambahan"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Properti Pertemuan */}
          <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-2xl shadow-sm border border-base-200/50 p-6">
            <h3 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Properti Pertemuan
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-base-200 dark:bg-base-100 rounded-xl transition-all duration-300">
                <div
                  className={`p-2 rounded-lg ${
                    formData.is_mandatory
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}>
                  {formData.is_mandatory ? (
                    <Globe className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-1">
                    Kewajiban
                  </div>
                  <div className="text-sm font-bold text-base-content">
                    {formData.is_mandatory ? "Wajib Dihadiri" : "Tidak Wajib"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-base-200 dark:bg-base-100 rounded-xl transition-all duration-300">
                <div className="p-2 rounded-lg bg-info/10 text-info">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-1">
                    Dibuat
                  </div>
                  <div className="text-sm font-bold text-base-content">
                    {meeting?.created_at}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-2xl shadow-sm border border-base-200/50 p-6">
            <h3 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Aksi Cepat
            </h3>
            <div className="space-y-3">
              <ActionButton
                onClick={handleSubmit}
                icon={Save}
                label={isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                color="success"
                size="md"
                className="w-full"
                disabled={isSubmitting}
                loading={isSubmitting}
              />
              <ActionButton
                onClick={() =>
                  navigate(
                    `/classrooms/${classroomCode}/attendance/${meetingId}`
                  )
                }
                icon={Eye}
                label="Lihat Detail"
                color="info"
                size="md"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceUpdatePage;
