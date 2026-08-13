import { CircularProgress } from "@mui/material";
import React, {
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  createBody,
  fetchBody,
} from "../../../../features/LandingPages/bodySlice";
import { FileText, MapPin, Link, Save } from "lucide-react";
import { debounce } from "lodash";

// Memoized InputField component
const InputField = React.memo(
  ({
    icon: Icon,
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    themeClasses,
  }) => {
    // Debug re-renders
    useEffect(() => {
      console.log(`${label} InputField rendered`);
    });

    return (
      <div className="space-y-2">
        <label className={`block text-sm font-medium ${themeClasses.muted}`}>
          {label}
        </label>
        <div className="relative">
          <input
            type={type}
            value={value}
            onChange={onChange}
            className={`w-full px-4 py-3 rounded-xl ${themeClasses.input} transition-all duration-200 placeholder:text-base-content/50`}
            placeholder={placeholder}
          />
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <Icon className="w-5 h-5 text-blue-500" />
          </div>
        </div>
      </div>
    );
  }
);
InputField.displayName = "InputField";

// Memoized QuillField component
const QuillField = React.memo(
  ({
    label,
    value,
    onChange,
    className,
    placeholder,
    themeClasses,
    modules,
    formats,
  }) => (
    <div className="space-y-2">
      <label className={`block text-sm font-medium ${themeClasses.muted}`}>
        {label}
      </label>
      <div
        className={`border-2 border-base-300 dark:border-base-600 rounded-xl overflow-hidden ${themeClasses.input} hover:border-blue-300 transition-colors duration-200`}>
        <ReactQuill
          value={value}
          onChange={onChange}
          className={`react-quill custom-quill ${className}`}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
);
QuillField.displayName = "QuillField";

// Memoized ContentSection component
const ContentSection = React.memo(
  ({ icon: Icon, title, children, gradient }) => {
    const themeClasses = useSelector((state) =>
      state.themes.localTheme === "wireframe"
        ? {
            card: "bg-base-100",
            text: "text-base-content",
          }
        : {
            card: "bg-base-100 dark:bg-base-200",
            text: "text-base-content",
          }
    );

    return (
      <div
        className={`${themeClasses.card} rounded-2xl h-fit border border-base-300/50 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300`}>
        <div className={`h-1 bg-gradient-to-r ${gradient}`}></div>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient.replace(
                "to-r",
                "to-br"
              )} flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
              {title}
            </h3>
          </div>
          {children}
        </div>
      </div>
    );
  }
);
ContentSection.displayName = "ContentSection";

export const BodyPage = () => {
  const dispatch = useDispatch();
  const { body, status } = useSelector((state) => state.body);
  const theme = useSelector((state) => state.themes.localTheme);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [link, setLink] = useState("");

  // Debug BodyPage re-renders
  useEffect(() => {
    console.log("BodyPage rendered");
  });

  // Debounced state update functions for Quill fields
  const debouncedSetDescription = useCallback(
    debounce((value) => setDescription(value), 300),
    []
  );
  const debouncedSetAddress = useCallback(
    debounce((value) => setAddress(value), 300),
    []
  );

  useEffect(() => {
    const getBody = async () => {
      try {
        await dispatch(fetchBody()).unwrap();
      } catch (error) {
        console.error("Failed to fetch body data:", error);
      }
    };

    if (status === "idle") getBody();
  }, [dispatch, status]);

  useLayoutEffect(() => {
    if (body) {
      setDescription(body.description || "");
      setAddress(body.address || "");
      setLink(body.google_map_link || "");
    }
  }, [body]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("description", description);
      formData.append("address", address);
      formData.append("google_map_link", link);
      await dispatch(createBody(formData));
      toast.success("Body updated successfully.");
    } catch (error) {
      toast.error("Failed to update body.");
      console.error("Body update error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toolbarOptions = useMemo(
    () => [
      ["bold", "italic", "underline", "strike"],
      ["blockquote", "code-block"],
      ["link", "image", "video", "formula"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ script: "sub" }, { script: "super" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ direction: "rtl" }],
      [{ size: ["small", false, "large", "huge"] }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ color: [] }, { background: [] }],
      [{ font: [] }],
      [{ align: [] }],
      ["clean"],
    ],
    []
  );

  const modules = useMemo(
    () => ({ toolbar: toolbarOptions }),
    [toolbarOptions]
  );

  const formats = useMemo(
    () => [
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "list",
      "bullet",
      "indent",
      "align",
      "link",
      "image",
      "blockquote",
      "code-block",
      "script",
      "direction",
      "size",
      "color",
      "background",
      "font",
    ],
    []
  );

  const getThemeClasses = useCallback(() => {
    if (theme === "wireframe") {
      return {
        container: "bg-base-300/25",
        card: "bg-base-100",
        header: "bg-base-100/90",
        input:
          "bg-base-100 border-base-300 focus:border-blue-500 text-base-content",
        button: "bg-blue-600 hover:bg-blue-700 text-white",
        text: "text-base-content",
        muted: "text-base-content/60",
      };
    } else {
      return {
        container: "bg-base-300/25 dark:bg-base-100",
        card: "bg-base-100 dark:bg-base-200",
        header: "bg-base-100/90 dark:bg-base-200/90",
        input:
          "bg-base-100 dark:bg-base-300 border-base-300 dark:border-base-600 focus:border-blue-500 dark:focus:border-blue-400 text-base-content",
        button:
          "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white",
        text: "text-base-content",
        muted: "text-base-content/60 dark:text-base-content/70",
      };
    }
  }, [theme]);

  const themeClasses = useMemo(() => getThemeClasses(), [getThemeClasses]);

  return (
    <div className={`min-h-screen ${themeClasses.container} p-1 md:p-6`}>
      {/* Header */}
      <div
        className={`${themeClasses.header} backdrop-blur-xl border-b border-base-300/50 rounded-t-2xl mb-6`}>
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-start md:items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1
                  className={`text-xl md:text-3xl font-bold ${themeClasses.text}`}>
                  Body Content
                </h1>
                <p className={`text-sm ${themeClasses.muted} mt-1`}>
                  Kelola konten utama halaman landing page
                </p>
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
                <CircularProgress size={16} />
                <span className="text-sm font-medium text-blue-700">
                  Memperbarui...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        <form onSubmit={handleSubmit} className="space-y-2 md:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-6">
            <div className="col-span-1 space-y-2 md:space-y-6">
              <ContentSection
                icon={Link}
                title="Link Google Maps"
                gradient="from-green-500 to-emerald-600">
                <InputField
                  icon={Link}
                  label="URL Google Maps"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  type="url"
                  placeholder="https://maps.google.com/..."
                  themeClasses={themeClasses}
                />
              </ContentSection>

              <ContentSection
                icon={MapPin}
                title="Alamat Lengkap"
                gradient="from-purple-500 to-purple-600">
                <QuillField
                  label="Alamat"
                  value={address}
                  onChange={debouncedSetAddress}
                  className="address-editor"
                  placeholder="Masukkan alamat lengkap MAN 1 KETAPANG..."
                  themeClasses={themeClasses}
                  modules={modules}
                  formats={formats}
                />
              </ContentSection>
            </div>

            <div className="col-span-2">
              <ContentSection
                icon={FileText}
                title="Tentang Kami"
                gradient="from-blue-500 to-blue-600">
                <QuillField
                  label="Deskripsi"
                  value={description}
                  onChange={debouncedSetDescription}
                  className="description-editor"
                  placeholder="Masukkan deskripsi lengkap tentang MAN 1 KETAPANG..."
                  themeClasses={themeClasses}
                  modules={modules}
                  formats={formats}
                />
              </ContentSection>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={loading}
              className={`
                relative px-8 py-4 rounded-2xl text-base font-semibold
                ${themeClasses.button}
                shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30
                transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                flex items-center gap-3 min-w-[180px] justify-center
                border border-blue-500/20
              `}>
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{loading ? "Menyimpan..." : "Simpan Perubahan"}</span>
              <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-all duration-700"></div>
            </button>
          </div>
        </form>
      </div>

      {/* Custom Styles */}
      <style>{`
        .react-quill {
          background: transparent;
        }
        .react-quill .ql-toolbar {
          border: none;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          padding: 12px;
        }
        .dark .react-quill .ql-toolbar {
          border-bottom-color: #475569;
          background: #374151;
        }
        .react-quill .ql-container {
          border: none;
          background: white;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
        }
        .dark .react-quill .ql-container {
          background: #1e293b;
        }
        .react-quill .ql-editor {
          font-size: 14px;
          line-height: 1.6;
          color: #334155;
          padding: 16px;
        }
        .dark .react-quill .ql-editor {
          color: #e2e8f0;
        }
        .address-editor .ql-editor {
          min-height: 120px;
        }
        .description-editor .ql-editor {
          min-height: 200px;
        }
        .react-quill .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
        }
        .dark .react-quill .ql-editor.ql-blank::before {
          color: #64748b;
        }
        .react-quill .ql-toolbar .ql-stroke {
          stroke: #64748b;
        }
        .dark .react-quill .ql-toolbar .ql-stroke {
          stroke: #94a3b8;
        }
        .react-quill .ql-toolbar .ql-fill {
          fill: #64748b;
        }
        .dark .react-quill .ql-toolbar .ql-fill {
          fill: #94a3b8;
        }
        .react-quill .ql-toolbar button:hover .ql-stroke {
          stroke: #3b82f6;
        }
        .dark .react-quill .ql-toolbar button:hover .ql-stroke {
          stroke: #60a5fa;
        }
        .react-quill .ql-toolbar button:hover .ql-fill {
          fill: #3b82f6;
        }
        .dark .react-quill .ql-toolbar button:hover .ql-fill {
          fill: #60a5fa;
        }
        .react-quill .ql-toolbar button.ql-active .ql-stroke {
          stroke: #3b82f6;
        }
        .dark .react-quill .ql-toolbar button.ql-active .ql-stroke {
          stroke: #60a5fa;
        }
        .react-quill .ql-toolbar button.ql-active .ql-fill {
          fill: #3b82f6;
        }
        .dark .react-quill .ql-toolbar button.ql-active .ql-fill {
          fill: #60a5fa;
        }
        .react-quill .ql-toolbar .ql-picker-label {
          color: #64748b;
        }
        .dark .react-quill .ql-toolbar .ql-picker-label {
          color: #94a3b8;
        }
        .react-quill .ql-toolbar .ql-picker-options {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }
        .dark .react-quill .ql-toolbar .ql-picker-options {
          background: #374151;
          border-color: #475569;
        }
        .react-quill .ql-toolbar .ql-picker-item {
          color: #334155;
        }
        .dark .react-quill .ql-toolbar .ql-picker-item {
          color: #e2e8f0;
        }
        .react-quill .ql-toolbar .ql-picker-item:hover {
          background: #f1f5f9;
        }
        .dark .react-quill .ql-toolbar .ql-picker-item:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
};
