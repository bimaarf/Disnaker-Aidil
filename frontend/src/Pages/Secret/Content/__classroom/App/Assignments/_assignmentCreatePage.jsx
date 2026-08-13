import QuillResizeModule from "@botom/quill-resize-module";
import ImageResize from "@mgreminger/quill-image-resize-module";
import { saveAs } from "file-saver";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Download,
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
import * as XLSX from "xlsx";
import "../../../../../../custom-quill-tooltip.css";
import useAssignments from "../../../../../../features/classroom/assignmentHook";

// Register custom Quill formats
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

// Constants
const ASSIGNMENT_TYPES = [
  {
    value: "document",
    label: "Dokumen",
    icon: FileText,
    color: "text-blue-600",
  },
  // { value: "video", label: "Video", icon: Video, color: "text-red-600" },
  // { value: "link", label: "Link", icon: Link, color: "text-green-600" },
  // {
  //   value: "assignment",
  //   label: "Tugas",
  //   icon: BookOpen,
  //   color: "text-purple-600",
  // },
  {
    value: "form",
    label: "Form / Quizz",
    icon: Sword,
    color: "text-orange-600",
  },
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
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

const formatDateDisplay = (dateString) => {
  return dateString;
};

const getTypeConfig = (type) =>
  ASSIGNMENT_TYPES.find((t) => t.value === type) || ASSIGNMENT_TYPES[0];

const validateFile = (file) => {
  const errors = [];
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File ${file.name} melebihi ukuran maksimal 20MB`);
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

// UI Components
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

const FileItem = memo(({ file, onRemove }) => {
  const fileName = file.name;
  const fileSize = `${(file.size / 1024 / 1024).toFixed(2)} MB`;

  return (
    <div className="flex items-center gap-3 p-4 bg-base-300/30 dark:bg-base-100 rounded-xl transition-all duration-300">
      <div className="p-2 rounded-lg bg-info/10 text-info">
        <FileIcon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-base-content">{fileName}</div>
        <div className="text-xs text-base-content/60 mt-1">{fileSize}</div>
      </div>
      <button
        onClick={() => onRemove(file)}
        className="px-2 py-1 rounded bg-base-200 duration-200 transition-all active:-translate-y-1 active:scale-95 text-center text-base-content/60 hover:text-error/60">
        <X className="w-4 h-4" />
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
    <div className="flex-1">
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

// Main Component
const AssignmentCreatePage = () => {
  const { code: classroomCode } = useParams();
  const navigate = useNavigate();
  const quillRef = useRef(null);

  // Hook untuk assignment operations
  const { addAssignment, createStatus, error, validationErrors } =
    useAssignments(classroomCode);

  // State management
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "document",
    is_visible: true,
    available_from: "",
    available_until: "",
  });
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localValidationErrors, setLocalValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [description, setDescription] = useState("");
  const draftKey = `assignment_draft_create_${classroomCode}`;
  const fileInputRef = useRef(null);

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed.formData);
        setDescription(parsed.formData.description || "");
        setLinks(parsed.links || [""]);
        setIsDirty(true);
        toast.info("Memuat draft yang tersimpan");
      } catch (error) {
        console.error("Failed to load draft:", error);
      }
    }
  }, [draftKey]);

  // Save draft when dirty
  useEffect(() => {
    if (isDirty) {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          formData: { ...formData, description },
          links,
        })
      );
    } else {
      localStorage.removeItem(draftKey);
    }
  }, [draftKey, formData, links, description, isDirty]);

  // Track dirty state
  useEffect(() => {
    const hasContent =
      formData.title.trim() !== "" ||
      formData.type !== "document" ||
      !formData.is_visible ||
      formData.available_from !== "" ||
      formData.available_until !== "" ||
      description.trim() !== "" ||
      files.length > 0 ||
      links.some((link) => link.trim() !== "");
    setIsDirty(hasContent);
  }, [formData, files, links, description]);

  // Handlers
  const handleBack = useCallback(() => {
    if (
      isDirty &&
      !window.confirm("Perubahan belum disimpan. Yakin ingin keluar?")
    ) {
      return;
    }
    navigate(`/classrooms/${classroomCode}/assignment`);
  }, [navigate, classroomCode, isDirty]);

  const handleFormChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setLocalValidationErrors((prev) => ({ ...prev, [field]: null }));
  }, []);

  const handleFileSelect = useCallback(
    (event) => {
      const selectedFiles = Array.from(event.target.files || []);
      if (selectedFiles.length === 0) return;
      const errors = [];
      const validFiles = [];
      selectedFiles.forEach((file) => {
        const fileErrors = validateFile(file);
        if (fileErrors.length > 0) {
          errors.push(...fileErrors);
        } else {
          const isDuplicate = files.some(
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
        setFiles((prev) => [...prev, ...validFiles]);
        toast.success(`${validFiles.length} file berhasil ditambahkan`);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [files]
  );

  const handleRemoveFile = useCallback((fileToRemove) => {
    setFiles((prev) => prev.filter((file) => file !== fileToRemove));
  }, []);

  const handleAddLink = useCallback(() => {
    setLinks((prev) => [...prev, ""]);
  }, []);

  const handleUpdateLink = useCallback(
    (index, value) => {
      setLinks((prev) => prev.map((link, i) => (i === index ? value : link)));
      if (localValidationErrors[`link_${index}`]) {
        setLocalValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[`link_${index}`];
          return newErrors;
        });
      }
    },
    [localValidationErrors]
  );

  const handleRemoveLink = useCallback(
    (index) => {
      setLinks((prev) => prev.filter((_, i) => i !== index));
      if (localValidationErrors[`link_${index}`]) {
        setLocalValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[`link_${index}`];
          return newErrors;
        });
      }
    },
    [localValidationErrors]
  );

  const validateForm = useCallback(() => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = "Judul tugas harus diisi";
    }
    if (!description.trim()) {
      errors.description = "Deskripsi tugas harus diisi";
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
   
    return errors;
  }, [formData, links, files, description]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setLocalValidationErrors(errors);
        toast.error("Mohon perbaiki error pada form");
        return;
      }
      setIsSubmitting(true);
      setLocalValidationErrors({});
      try {
        const submitData = {
          ...formData,
          available_from: formData.available_from || null,
          available_until: formData.available_until || null,
          description: description || null,
        };
        if (files.length > 0) {
          submitData.files = files;
        }
        const validLinks = links
          .map((link) => link.trim())
          .filter((link) => link && validateUrl(link));
        if (validLinks.length > 0) {
          submitData.links = validLinks;
        }
        const result = await addAssignment(submitData);
        if (result.success) {
          setSuccessMessage("Tugas berhasil dibuat");
          setIsDirty(false);
          localStorage.removeItem(draftKey);
          navigate(
            `/classrooms/${classroomCode}/assignment/${result.data.id}/preview`
          );
        } else {
          if (result.error) {
            toast.error(result.error.message || "Gagal membuat tugas");
          }
        }
      } catch (err) {
        console.error("Create error:", err);
        toast.error("Gagal membuat tugas");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      formData,
      files,
      links,
      description,
      addAssignment,
      navigate,
      classroomCode,
      draftKey,
    ]
  );

  const handleReset = useCallback(() => {
    if (isDirty && !window.confirm("Reset semua data yang telah diisi?")) {
      return;
    }
    setFormData({
      title: "",
      description: "",
      type: "document",
      is_visible: true,
      available_from: "",
      available_until: "",
    });
    setFiles([]);
    setLinks([""]);
    setDescription("");
    setLocalValidationErrors({});
    setIsDirty(false);
    localStorage.removeItem(draftKey);
    toast.info("Form telah direset");
  }, [isDirty, draftKey]);

  // Auto-clear success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Prevent navigation with unsaved changes
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

  // Display server validation errors
  useEffect(() => {
    if (validationErrors) {
      setLocalValidationErrors((prev) => ({ ...prev, ...validationErrors }));
    }
  }, [validationErrors]);

  // Quill configuration
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
                element.style.display = "inline-block";
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
                  Kelas
                </RouterLink>
              </li>
              <li className="text-base-content/40">/</li>
              <li>
                <RouterLink
                  to={`/classrooms/${classroomCode}/assignment`}
                  className="hover:text-primary transition-colors">
                  Tugas Pembelajaran
                </RouterLink>
              </li>
              <li className="text-base-content/40">/</li>
              <li className="text-base-content font-medium">Buat Tugas Baru</li>
            </ul>
          </nav>
        </div>

        {successMessage && (
          <div className="mb-6 animate-fade-in">
            <SuccessMessage message={successMessage} />
          </div>
        )}

        {error && (
          <div className="mb-6 animate-fade-in">
            <ErrorMessage error={error} />
          </div>
        )}

        {localValidationErrors.content && (
          <div className="mb-6 animate-fade-in">
            <ErrorMessage error={localValidationErrors.content} />
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
                    Buat Tugas Baru
                  </h1>
                  <p className="text-sm text-base-content/60 mt-2">
                    Tambahkan tugas pembelajaran baru untuk kelas ini
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Judul Tugas <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleFormChange("title", e.target.value)}
                    className={`w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 ${
                      localValidationErrors.title
                        ? "border-error"
                        : "border-base-300"
                    }`}
                    placeholder="Masukkan judul tugas..."
                  />
                  {localValidationErrors.title && (
                    <p className="mt-2 text-sm text-error">
                      {localValidationErrors.title}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Tipe Tugas <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.type}
                      onChange={(e) => handleFormChange("type", e.target.value)}
                      className="w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 border-base-300 appearance-none">
                      {ASSIGNMENT_TYPES.map((type) => (
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
                        Tampilkan tugas kepada siswa
                      </span>
                      <p className="text-xs text-base-content/60 mt-1">
                        Siswa dapat melihat dan mengakses tugas ini
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
                      localValidationErrors.available_from
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
                      localValidationErrors.available_until
                        ? "border-error"
                        : "border-base-300"
                    }`}
                  />
                  {localValidationErrors.available_until && (
                    <p className="mt-2 text-sm text-error">
                      {localValidationErrors.available_until}
                    </p>
                  )}
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-base-content mb-2">
                    Deskripsi Tugas <span className="text-error">*</span>
                  </label>
                  <div
                    className={`custom-quill ${
                      localValidationErrors?.description ? "error" : ""
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
                  {localValidationErrors.description && (
                    <p className="mt-2 text-sm text-error">
                      {localValidationErrors.description}
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
              {files.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-normal text-base-content/80 mb-3">
                    File ({files.length})
                  </h3>
                  <div className="space-y-4">
                    {files.map((file, index) => (
                      <FileItem
                        key={`file-${index}`}
                        file={file}
                        onRemove={handleRemoveFile}
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
                Pilih file untuk ditambahkan ke tugas (Maks. 20MB per file)
              </p>
            </div>
          </div>

          {/* Links */}
          {formData.type !== "quiz" && (
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
                    {localValidationErrors[`link_${index}`] && (
                      <p className="mt-2 text-sm text-error">
                        {localValidationErrors[`link_${index}`]}
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
          )}

          {/* Properties */}
          <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-2xl shadow-sm border border-base-200/50 p-6">
            <h3 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Properti Tugas
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
                    {files.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-2xl shadow-sm border border-base-200/50 p-6">
            <h3 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Aksi Cepat
            </h3>
            <div className="space-y-3">
              <ActionButton
                onClick={handleSubmit}
                icon={Save}
                label={isSubmitting ? "Menyimpan..." : "Buat Tugas"}
                color="success"
                size="md"
                className="w-full"
                disabled={isSubmitting || createStatus === "loading"}
                loading={isSubmitting || createStatus === "loading"}
              />
              <ActionButton
                onClick={handleReset}
                icon={RefreshCw}
                label="Reset"
                color="warning"
                size="md"
                className="w-full"
                disabled={isSubmitting || !isDirty}
              />
              <ActionButton
                onClick={handleBack}
                icon={X}
                label="Batal"
                color="ghost"
                size="md"
                className="w-full"
                disabled={isSubmitting}
              />
              <ActionButton
                onClick={() => {
                  const data = {
                    ...formData,
                    description,
                    files: files.map((file) => ({
                      name: file.name,
                      size: file.size,
                      type: file.type,
                    })),
                    links,
                    created_at: new Date().toISOString(),
                  };
                  const rows = Object.entries(data).map(([key, value]) => {
                    if (Array.isArray(value)) {
                      return { field: key, value: JSON.stringify(value) };
                    } else if (typeof value === "object" && value !== null) {
                      return { field: key, value: JSON.stringify(value) };
                    } else {
                      return { field: key, value };
                    }
                  });
                  const worksheet = XLSX.utils.json_to_sheet(rows);
                  const workbook = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(workbook, worksheet, "Draft");
                  const excelBuffer = XLSX.write(workbook, {
                    bookType: "xlsx",
                    type: "array",
                  });
                  const blob = new Blob([excelBuffer], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  });
                  saveAs(blob, `assignment-create-${classroomCode}-draft.xlsx`);
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
                Maksimal ukuran file: 20MB per file. Anda dapat menambahkan
                beberapa file sekaligus.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-8 bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-3xl shadow-xl border border-base-300/50 p-6">
        <h3 className="text-xl font-bold text-base-content mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-info" />
          Tips Membuat Tugas
        </h3>
        <div className="space-y-3 text-sm text-base-content/70">
          <div className="flex gap-3">
            <span className="text-primary font-bold">•</span>
            <span>
              <strong>Judul yang Jelas:</strong> Gunakan judul yang deskriptif
              agar mudah dicari oleh siswa
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-primary font-bold">•</span>
            <span>
              <strong>Deskripsi Lengkap:</strong> Jelaskan tujuan pembelajaran
              dan apa yang akan dipelajari
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-primary font-bold">•</span>
            <span>
              <strong>Tipe yang Tepat:</strong> Pilih tipe tugas sesuai dengan
              konten yang akan dibagikan
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-primary font-bold">•</span>
            <span>
              <strong>File Berkualitas:</strong> Pastikan file yang diunggah
              memiliki kualitas yang baik dan ukuran yang wajar
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-primary font-bold">•</span>
            <span>
              <strong>Jadwal Ketersediaan:</strong> Atur jadwal jika tugas hanya
              tersedia pada waktu tertentu
            </span>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-base-200/30">
          <h4 className="text-sm font-semibold text-base-content mb-3">
            Draft Otomatis:
          </h4>
          <p className="text-xs text-base-content/60">
            Form ini akan menyimpan draft secara otomatis ke browser Anda. Jika
            Anda keluar dari halaman ini, data yang telah diisi akan tersimpan
            dan dapat dilanjutkan kembali nanti.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssignmentCreatePage;
