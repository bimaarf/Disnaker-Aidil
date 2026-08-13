import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle,
  Download,
  Eye,
  FileIcon,
  FileText,
  Globe,
  Link,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Sword,
  Upload,
  Video,
  X,
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
import { useMaterialDetail } from "../../../../../../features/classroom/materialHook";
import QuillResizeModule from "@botom/quill-resize-module";
import ImageResize from "@mgreminger/quill-image-resize-module";
import "../../../../../../custom-quill-tooltip.css";

// Register custom Quill formats and modules (unchanged)
const ImageAlign = Quill.import("formats/image");
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

const MAX_FILE_SIZE = 20 * 4096 * 4096; // 40MB
const ALLOWED_FILE_TYPES = [
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
  "text/plain",
];

// Utility Functions (unchanged)
const formatDate = (dateString) => {
  return dateString;
};

const formatDateDisplay = (dateString) => {
  return dateString;
};

const getTypeConfig = (type) =>
  MATERIAL_TYPES.find((t) => t.value === type) || MATERIAL_TYPES[0];

const validateFile = (file) => {
  const errors = [];
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File ${file.name} melebihi ukuran maksimal 40MB`);
  }
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    errors.push(`Tipe file ${file.name} tidak diizinkan`);
  }
  return errors;
};

const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

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
          Materi Tidak Ditemukan
        </h3>
        <p className="text-base-content/60 mb-8 max-w-md mx-auto">
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
));
EmptyState.displayName = "EmptyState";

const LoadingState = memo(() => (
  <div className="w-full mx-auto px-4 py-6 min-h-screen bg-gradient-to-br from-base-50/30 to-base-100/50">
    <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-3xl border border-base-300/50">
      <div className="p-8">
        <div className="text-center py-16">
          <LoadingSpinner size="xl" className="mx-auto mb-6" />
          <h3 className="text-xl font-bold text-base-content mb-2">
            Memuat Data Materi
          </h3>
          <p className="text-base-content/60">
            Sedang mengambil informasi materi untuk diedit...
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

const MaterialUpdatePage = () => {
  const { code: classroomCode, materialId } = useParams();
  const navigate = useNavigate();
  const quillRef = useRef(null);

  // State management (unchanged)
  const [description, setDescription] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "document",
    is_visible: true,
    available_from: "",
    available_until: "",
  });
  const [newFiles, setNewFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [removedFileIds, setRemovedFileIds] = useState([]);
  const [links, setLinks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  // Refs (unchanged)
  const fileInputRef = useRef(null);
  const initialDataRef = useRef(null);
  const isInitialized = useRef(false);
  const draftLoaded = useRef(false);

  // Material detail hook (unchanged)
  const {
    material,
    isLoading,
    error,
    isCacheStale,
    hasCachedData,
    refreshDetail,
    handleUpdate,
    cachedData,
    fetchAttempts = 0,
  } = useMaterialDetail(classroomCode, materialId, {
    autoLoad: true,
    enablePolling: false,
    autoRefreshAfterUpdate: false,
  });

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

  const draftKey = `material_draft_${classroomCode}_${materialId}`;

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
    const dataSource = material || cachedData;
    if (
      dataSource &&
      (!isInitialized.current ||
        dataSource.updated_at !== initialDataRef.current?.updated_at)
    ) {
      const initialData = {
        title: dataSource.title || "",
        description: dataSource.description || "",
        type: dataSource.type || "document",
        is_visible: dataSource.is_visible ?? true,
        available_from: formatDate(dataSource.available_from),
        available_until: formatDate(dataSource.available_until),
      };
      setFormData(initialData);
      setDescription(initialData.description || "");
      setExistingFiles(dataSource.file_urls || []);
      const linkUrls =
        dataSource.links && Array.isArray(dataSource.links)
          ? dataSource.links
              .map((link) => (typeof link === "object" ? link.url : link))
              .filter(Boolean)
          : [];
      setLinks(linkUrls.length > 0 ? linkUrls : [""]);
      initialDataRef.current = {
        ...initialData,
        existingFiles: dataSource.file_urls || [],
        links: linkUrls.length > 0 ? linkUrls : [""],
        updated_at: dataSource.updated_at,
      };
      isInitialized.current = true;
      setNewFiles([]);
      setRemovedFileIds([]);
      setValidationErrors({});
      if (!draftLoaded.current) {
        const saved = localStorage.getItem(draftKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setFormData(parsed.formData);
          setLinks(parsed.links);
          setExistingFiles(parsed.existingFiles);
          setRemovedFileIds(parsed.removedFileIds);
          setIsDirty(true);
          toast.info("Memuat draft yang tersimpan");
        }
        draftLoaded.current = true;
      }
    }
  }, [material, cachedData, draftKey]);

  useEffect(() => {
    if (!initialDataRef.current) return;
    const currentFormData = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      is_visible: formData.is_visible,
      available_from: formData.available_from,
      available_until: formData.available_until,
    };
    const initialFormData = {
      title: initialDataRef.current.title,
      description: initialDataRef.current.description,
      type: initialDataRef.current.type,
      is_visible: initialDataRef.current.is_visible,
      available_from: initialDataRef.current.available_from,
      available_until: initialDataRef.current.available_until,
    };
    const isFormDirty =
      JSON.stringify(currentFormData) !== JSON.stringify(initialFormData);
    const isFilesDirty = newFiles.length > 0 || removedFileIds.length > 0;
    const currentLinks = links.filter((link) => link.trim());
    const initialLinks = (initialDataRef.current.links || []).filter((link) =>
      link.trim()
    );
    const isLinksDirty =
      JSON.stringify(currentLinks.sort()) !==
      JSON.stringify(initialLinks.sort());
    setIsDirty(isFormDirty || isFilesDirty || isLinksDirty);
  }, [formData, newFiles, removedFileIds, links]);

  useEffect(() => {
    if (isDirty) {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          formData,
          links,
          existingFiles,
          removedFileIds,
        })
      );
    } else {
      localStorage.removeItem(draftKey);
    }
  }, [draftKey, formData, links, existingFiles, removedFileIds, isDirty]);

  const handleBack = useCallback(() => {
    if (
      isDirty &&
      !window.confirm("Perubahan belum disimpan. Yakin ingin keluar?")
    ) {
      return;
    }
    navigate(`/classrooms/${classroomCode}/material/${materialId}/preview`);
  }, [navigate, classroomCode, materialId, isDirty]);

  const handleFormChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationErrors((prev) => ({ ...prev, [field]: null }));
  }, []);

  const handleFileSelect = useCallback(
    (event) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;
      const errors = [];
      const validFiles = [];
      files.forEach((file) => {
        const fileErrors = validateFile(file);
        if (fileErrors.length > 0) {
          errors.push(...fileErrors);
        } else {
          const isDuplicate = newFiles.some(
            (existingFile) =>
              existingFile.name === file.name && existingFile.size === file.size
          );
          if (isDuplicate) {
            errors.push(`File ${file.name} sudah ditambahkan sebelumnya`);
          } else {
            validFiles.push(file);
          }
        }
      });
      if (errors.length > 0) {
        toast.error(errors.join(". "));
      }
      if (validFiles.length > 0) {
        setNewFiles((prev) => [...prev, ...validFiles]);
        toast.success(`${validFiles.length} file berhasil ditambahkan`);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [newFiles]
  );

  const handleRemoveNewFile = useCallback((fileToRemove) => {
    setNewFiles((prev) => prev.filter((file) => file !== fileToRemove));
  }, []);

  const handleRemoveExistingFile = useCallback((fileId) => {
    setExistingFiles((prev) => prev.filter((file) => file.id !== fileId));
    setRemovedFileIds((prev) => [...prev, fileId]);
  }, []);

  const handleAddLink = useCallback(() => {
    setLinks((prev) => [...prev, ""]);
  }, []);

  const handleUpdateLink = useCallback(
    (index, value) => {
      setLinks((prev) => prev.map((link, i) => (i === index ? value : link)));
      if (validationErrors[`link_${index}`]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[`link_${index}`];
          return newErrors;
        });
      }
    },
    [validationErrors]
  );

  const handleRemoveLink = useCallback(
    (index) => {
      setLinks((prev) => prev.filter((_, i) => i !== index));
      if (validationErrors[`link_${index}`]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[`link_${index}`];
          return newErrors;
        });
      }
    },
    [validationErrors]
  );

  const validateForm = useCallback(() => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = "Judul materi harus diisi";
    }
    if (!description.trim()) {
      errors.description = "Deskripsi materi harus diisi";
    }
    if (formData.available_from && formData.available_until) {
      const from = new Date(formData.available_from);
      const until = new Date(formData.available_until);
      if (from >= until) {
        errors.available_until =
          "Tanggal akhir harus lebih besar dari tanggal awal";
      }
    }
    const nonEmptyLinks = links.filter((link) => link.trim());
    nonEmptyLinks.forEach((link) => {
      if (!validateUrl(link.trim())) {
        const actualIndex = links.indexOf(link);
        errors[`link_${actualIndex}`] = `Format URL tidak valid`;
      }
    });
    // const currentExistingFiles = existingFiles.length - removedFileIds.length;
    // const hasNewFiles = newFiles.length > 0;
    // const validLinksCount = nonEmptyLinks.length;
    // const totalContent =
    //   currentExistingFiles +
    //   (hasNewFiles ? newFiles.length : 0) +
    //   validLinksCount;
    // if (formData.type === "link") {
    //   if (validLinksCount === 0) {
    //     errors.content =
    //       "Tipe Link harus memiliki minimal satu link yang valid";
    //   }
    // } else if (["document", "video", "assignment"].includes(formData.type)) {
    //   if (totalContent === 0) {
    //     errors.content = "Harus memiliki minimal satu file atau link";
    //   }
    // }
    return errors;
  }, [formData, links, existingFiles, newFiles, removedFileIds]);

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
          available_from: formData.available_from || null,
          available_until: formData.available_until || null,
          description: description || null,
        };
        if (newFiles.length > 0) {
          submitData.files = newFiles;
        }
        if (removedFileIds.length > 0) {
          submitData.remove_file_ids = removedFileIds;
        }
        const allCurrentLinks = links
          .map((link) => link.trim())
          .filter((link) => link && validateUrl(link));
        submitData.links = allCurrentLinks;
        const result = await handleUpdate(submitData, {
          optimistic: true,
          syncCache: true,
        });
        if (result.success) {
          setSuccessMessage("Materi berhasil diperbarui");
          setIsDirty(false);
          setNewFiles([]);
          setRemovedFileIds([]);
          const updatedMaterial = result.data || {
            ...material,
            ...submitData,
            file_urls: result.data?.file_urls || existingFiles,
            links:
              result.data?.links || allCurrentLinks.map((url) => ({ url })),
            updated_at: new Date().toISOString(),
          };
          initialDataRef.current = {
            ...formData,
            existingFiles: updatedMaterial.file_urls || existingFiles,
            links: allCurrentLinks.length > 0 ? allCurrentLinks : [""],
            updated_at: updatedMaterial.updated_at,
          };
          localStorage.removeItem(draftKey);
          // navigate(
          //   `/classrooms/${classroomCode}/material/${materialId}/preview`
          // );
        }
      } catch (err) {
        console.error("Update error:", err);
        toast.error("Gagal memperbarui materi");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      formData,
      newFiles,
      removedFileIds,
      links,
      validateForm,
      handleUpdate,
      material,
      existingFiles,
      navigate,
      classroomCode,
      materialId,
      draftKey,
      description,
    ]
  );

  useEffect(() => {
    const dataSource = hasCachedData && cachedData ? cachedData : material;
    if (dataSource && !initialDataRef.current) {
      const initialData = {
        title: dataSource.title || "",
        description: dataSource.description || "",
        type: dataSource.type || "document",
        is_visible: dataSource.is_visible ?? true,
        available_from: formatDate(dataSource.available_from),
        available_until: formatDate(dataSource.available_until),
      };
      setFormData(initialData);
      setDescription(initialData.description || "");
      setExistingFiles(dataSource.file_urls || []);
      let initialLinks = [];
      if (dataSource.links && Array.isArray(dataSource.links)) {
        initialLinks = dataSource.links
          .map((link) => (typeof link === "object" ? link.url : link))
          .filter(Boolean);
      }
      if (initialLinks.length === 0) {
        initialLinks = [""];
      }
      setLinks(initialLinks);
      initialDataRef.current = {
        ...initialData,
        existingFiles: dataSource.file_urls || [],
        links: initialLinks,
      };
    }
  }, [material, hasCachedData, cachedData]);

  const handleRefresh = useCallback(async () => {
    try {
      const result = await refreshDetail();
      if (result?.success && result.data) {
        const refreshedData = result.data;
        const serverUpdatedAt = new Date(refreshedData.updated_at).getTime();
        const localUpdatedAt = initialDataRef.current?.updated_at
          ? new Date(initialDataRef.current.updated_at).getTime()
          : 0;
        if (serverUpdatedAt > localUpdatedAt) {
          if (
            isDirty &&
            !window.confirm(
              "Data server lebih baru. Timpa perubahan lokal Anda?"
            )
          ) {
            setSuccessMessage(
              "Refresh dibatalkan untuk menjaga perubahan lokal"
            );
            return;
          }
          const newFormData = {
            title: refreshedData.title || "",
            description: refreshedData.description || "",
            type: refreshedData.type || "document",
            is_visible: refreshedData.is_visible ?? true,
            available_from: formatDate(refreshedData.available_from),
            available_until: formatDate(refreshedData.available_until),
          };
          setFormData(newFormData);
          setDescription(newFormData.description);
          setExistingFiles(refreshedData.file_urls || []);
          const refreshedLinks =
            refreshedData.links && Array.isArray(refreshedData.links)
              ? refreshedData.links
                  .map((link) => (typeof link === "object" ? link.url : link))
                  .filter(Boolean)
              : [];
          setLinks(refreshedLinks.length > 0 ? refreshedLinks : [""]);
          setNewFiles([]);
          setRemovedFileIds([]);
          setValidationErrors({});
          initialDataRef.current = {
            ...newFormData,
            existingFiles: refreshedData.file_urls || [],
            links: refreshedLinks.length > 0 ? refreshedLinks : [""],
            updated_at: refreshedData.updated_at,
          };
          localStorage.removeItem(draftKey);
          setSuccessMessage(
            "Data berhasil diperbarui dengan data terbaru dari server"
          );
        } else {
          setSuccessMessage("Data sudah terbaru");
        }
        setIsDirty(false);
      }
    } catch (err) {
      console.error("Refresh error:", err);
      toast.error("Gagal memperbarui data");
    }
  }, [refreshDetail, isDirty, draftKey]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (!classroomCode || !materialId) {
      navigate("/classrooms", { replace: true });
    }
  }, [classroomCode, materialId, navigate]);

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

  if (!classroomCode || !materialId) {
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
          <ErrorMessage error={error} onRetry={refreshDetail} />
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
                  {material?.classroom?.name || "Kelas"}
                </RouterLink>
              </li>
              <li className="text-base-content/40">/</li>
              <li>
                <RouterLink
                  to={`/classrooms/${classroomCode}/material`}
                  className="hover:text-primary transition-colors">
                  Materi Pembelajaran
                </RouterLink>
              </li>
              <li className="text-base-content/40">/</li>
              <li>
                <RouterLink
                  to={`/classrooms/${classroomCode}/material/${materialId}/preview`}
                  className="hover:text-primary transition-colors">
                  Detail Materi
                </RouterLink>
              </li>
              <li className="text-base-content/40">/</li>
              <li className="text-base-content font-medium">Edit Materi</li>
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
              onClick={handleRefresh}
              icon={RefreshCw}
              label="Refresh"
              color="ghost"
              size="sm"
              disabled={isLoading}
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
            <ErrorMessage error={error} onRetry={refreshDetail} />
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
                    formData.type === "document"
                      ? "from-blue-100 to-blue-200 shadow-blue-200/50"
                      : formData.type === "video"
                      ? "from-red-100 to-red-200 shadow-red-200/50"
                      : formData.type === "link"
                      ? "from-green-100 to-green-200 shadow-green-200/50"
                      : formData.type === "assignment"
                      ? "from-purple-100 to-purple-200 shadow-purple-200/50"
                      : "from-orange-100 to-orange-200 shadow-orange-200/50"
                  }`}>
                  <TypeIcon
                    className={`w-8 h-8 ${getTypeConfig(formData.type).color}`}
                  />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-base-content">
                    Edit Materi
                  </h1>
                  <p className="text-sm text-base-content/60 mt-2">
                    Perbarui informasi materi pembelajaran
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Judul Materi <span className="text-error">*</span>
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
                    placeholder="Masukkan judul materi..."
                  />
                  {validationErrors.title && (
                    <p className="mt-2 text-sm text-error">
                      {validationErrors.title}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Tipe Materi <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.type}
                      onChange={(e) => handleFormChange("type", e.target.value)}
                      className="w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 border-base-300 appearance-none">
                      {MATERIAL_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Visibilitas
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-base-100/60 rounded-2xl hover:bg-base-100/80 border border-base-200/30 transition-all duration-300 cursor-pointer">
                    <input
                      id="is_visible"
                      type="checkbox"
                      name="is_visible"
                      checked={formData.is_visible}
                      onChange={(e) =>
                        handleFormChange("is_visible", e.target.checked)
                      }
                      className="h-5 w-5 text-primary border-base-300 rounded focus:ring-primary/30 transition-colors"
                    />
                    <div>
                      <span className="text-sm font-medium text-base-content">
                        Tampilkan materi kepada siswa
                      </span>
                      <p className="text-xs text-base-content/60 mt-1">
                        Siswa dapat melihat dan mengakses materi ini
                      </p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Tersedia Dari
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.available_from}
                    onChange={(e) =>
                      handleFormChange("available_from", e.target.value)
                    }
                    className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                      validationErrors.available_from
                        ? "border-error"
                        : "border-base-300"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Tersedia Hingga
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.available_until}
                    onChange={(e) =>
                      handleFormChange("available_until", e.target.value)
                    }
                    className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                      validationErrors.available_until
                        ? "border-error"
                        : "border-base-300"
                    }`}
                  />
                  {validationErrors.available_until && (
                    <p className="mt-2 text-sm text-error">
                      {validationErrors.available_until}
                    </p>
                  )}
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Deskripsi Materi <span className="text-error">*</span>
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
              </div>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Files */}
          <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-2xl shadow-sm border border-base-200/50 p-6">
            <h3 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              File
            </h3>
            <div className="space-y-3">
              {newFiles.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-normal text-base-content/80 mb-3">
                    File Baru ({newFiles.length})
                  </h3>
                  <div className="space-y-4">
                    {newFiles.map((file, index) => (
                      <FileItem
                        key={`new-${index}`}
                        file={file}
                        onRemove={handleRemoveNewFile}
                      />
                    ))}
                  </div>
                </div>
              )}
              {existingFiles.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-normal text-base-content/80 mb-3">
                    File yang Ada ({existingFiles.length})
                  </h3>
                  <div className="space-y-4">
                    {existingFiles.map((file) => (
                      <FileItem
                        key={file.id}
                        file={file}
                        onRemove={handleRemoveExistingFile}
                        isExisting
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-base-300/30 dark:bg-base-100 rounded-2xl">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 cursor-pointer border-dashed rounded-2xl p-4 text-center border-primary/30 hover:border-primary/50 hover:text-primary/80 text-base-content/50 transition-all">
                  <div className="flex items-center gap-2 justify-center">
                    <Upload className="w-4 h-4" />
                    <h3 className="text-sm font-medium">Unggah File</h3>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mp3,.jpg,.jpeg,.png,.gif,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>
              <p className="text-[11px] text-base-content/60 mb-4">
                Pilih file untuk ditambahkan ke materi (Maks. 40MB per file)
              </p>
            </div>
          </div>
          {/* Link */}
          <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-2xl shadow-sm border border-base-200/50 p-6">
            <h3 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
              <Link className="w-5 h-5 text-primary" />
              Link Eksternal{" "}
              {formData.type === "link" && (
                <span className="text-error">*</span>
              )}
            </h3>
            <div className="space-y-3">
              {links.map((link, index) => (
                <div key={index}>
                  <LinkItem
                    link={link}
                    index={index}
                    onUpdate={handleUpdateLink}
                    onRemove={handleRemoveLink}
                  />
                  {validationErrors[`link_${index}`] && (
                    <p className="mt-2 text-sm text-error">
                      {validationErrors[`link_${index}`]}
                    </p>
                  )}
                </div>
              ))}
              <div className="bg-base-300/30 dark:bg-base-100 rounded-2xl">
                <div
                  onClick={handleAddLink}
                  className="border-2 cursor-pointer border-dashed rounded-2xl p-4 text-center border-primary/30 hover:border-primary/50 hover:text-primary/80 text-base-content/50 transition-all">
                  <div className="flex items-center gap-2 justify-center">
                    <Plus className="w-4 h-4" />
                    <h3 className="text-sm font-medium">Tambah Link</h3>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-base-content/60 mb-4">
                Opsional - Anda dapat menambahkan link sebagai alternatif atau
                tambahan untuk file.
              </p>
            </div>
          </div>
          {/* Properti Materi */}
          <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-2xl shadow-sm border border-base-200/50 p-6">
            <h3 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Properti Materi
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-base-200 dark:bg-base-100 rounded-xl transition-all duration-300">
                <div
                  className={`p-2 rounded-lg ${
                    formData.is_visible
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}>
                  {formData.is_visible ? (
                    <Globe className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-1">
                    Visibilitas
                  </div>
                  <div className="text-sm font-bold text-base-content">
                    {formData.is_visible
                      ? "Terlihat oleh Siswa"
                      : "Tersembunyi"}
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
                    {formatDateDisplay(material?.created_at)}
                  </div>
                </div>
              </div>
              {formData.available_from && (
                <div className="flex items-center gap-3 p-4 bg-base-200 dark:bg-base-100 rounded-xl transition-all duration-300">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-1">
                      Tersedia Dari
                    </div>
                    <div className="text-sm font-bold text-base-content">
                      {formatDateDisplay(formData.available_from)}
                    </div>
                  </div>
                </div>
              )}
              {formData.available_until && (
                <div className="flex items-center gap-3 p-4 bg-base-200 dark:bg-base-100 rounded-xl transition-all duration-300">
                  <div className="p-2 rounded-lg bg-warning/10 text-warning">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-1">
                      Tersedia Hingga
                    </div>
                    <div className="text-sm font-bold text-base-content">
                      {formatDateDisplay(formData.available_until)}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-4 bg-base-200 dark:bg-base-100 rounded-xl transition-all duration-300">
                <div className="p-2 rounded-lg bg-info/10 text-info">
                  <FileIcon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-1">
                    Total File
                  </div>
                  <div className="text-sm font-bold text-base-content">
                    {(material?.file_urls?.length || 0) +
                      newFiles.length -
                      removedFileIds.length}
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
                    `/classrooms/${classroomCode}/material/${materialId}/preview`
                  )
                }
                icon={Eye}
                label="Lihat Detail"
                color="info"
                size="md"
                className="w-full"
              />
              <ActionButton
                onClick={() => {
                  const data = {
                    ...formData,
                    description,
                    existingFiles,
                    newFiles: newFiles.map((file) => ({
                      name: file.name,
                      size: file.size,
                      type: file.type,
                    })),
                    removedFileIds,
                    links,
                    exported_at: new Date().toISOString(),
                  };

                  // Ubah ke array agar bisa dimasukkan ke sheet
                  const rows = Object.entries(data).map(([key, value]) => {
                    if (Array.isArray(value)) {
                      return { field: key, value: JSON.stringify(value) }; // stringify array/obj
                    } else if (typeof value === "object" && value !== null) {
                      return { field: key, value: JSON.stringify(value) };
                    } else {
                      return { field: key, value };
                    }
                  });

                  // Buat worksheet
                  const worksheet = XLSX.utils.json_to_sheet(rows);

                  // Buat workbook
                  const workbook = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(workbook, worksheet, "Draft");

                  // Simpan ke file
                  const excelBuffer = XLSX.write(workbook, {
                    bookType: "xlsx",
                    type: "array",
                  });

                  const blob = new Blob([excelBuffer], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  });

                  saveAs(blob, `material-${materialId}-draft.xlsx`);
                  toast.success("Berhasil diekspor ke Excel");
                }}
                icon={Download}
                label="Export Excel"
                color="secondary"
                size="md"
                className="w-full"
              />
            </div>
            <div className="mt-6 pt-6 border-t border-base-200/30">
              <h4 className="text-sm font-semibold text-base-content mb-3">
                Tipe File yang Didukung:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs text-base-content/60">
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  <span>PDF, DOC, DOCX</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="w-3 h-3" />
                  <span>MP4, MP3</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileIcon className="w-3 h-3" />
                  <span>PPT, PPTX</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileIcon className="w-3 h-3" />
                  <span>JPG, PNG, GIF</span>
                </div>
              </div>
              <p className="text-xs text-base-content/50 mt-3">
                Maksimal ukuran file: 40MB per file. File yang ada akan tetap
                tersimpan kecuali dihapus secara manual.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialUpdatePage;
