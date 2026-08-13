import { CircularProgress } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  fetchCategoryBlogs as fetch,
  updateCategoryBlog,
} from "../../../../../features/blog/categoryBlogSlice";
import { Edit3, ArrowLeft, Tag } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

const CategorySection = ({
  icon: Icon,
  title,
  children,
  gradient,
  themeClasses,
}) => (
  <div
    className={`${themeClasses.card} rounded-2xl border border-base-300/50 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300`}>
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

const InputField = ({
  icon: Icon,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  themeClasses,
}) => (
  <div className="space-y-2">
    <label className={`block text-sm font-medium ${themeClasses.muted}`}>
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 rounded-xl ${themeClasses.input} transition-all duration-100 placeholder:text-base-content/50`}
        placeholder={placeholder}
        required={required}
      />
      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
        <Icon className="w-5 h-5 text-blue-500" />
      </div>
    </div>
    {required && !value && (
      <p className="text-xs text-red-500 mt-1">{label} wajib diisi</p>
    )}
  </div>
);

const CategoryBlogUpdatePage = () => {
  const { key } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.themes.localTheme);

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const dataProps = location.state?.dataProps;

  useEffect(() => {
    if (dataProps) {
      setName(dataProps.name || "");
    }
    window.scrollTo(0, 0);
  }, [dataProps]);

  // 🚫 remove dataProps from dependency!
  useEffect(() => {
    if (key && !dataProps) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const res = await dispatch(fetch(key)).unwrap();
          setName(res.name || "");
        } catch (error) {
          console.error("Failed to fetch categoryBlog data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [dispatch, key]);

  useEffect(() => {
    if (!location.state?.dataProps && !key) {
      navigate("/category/blog");
    }
  }, [location.state, key, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("name", name);

    setLoading(true);
    try {
      await dispatch(
        updateCategoryBlog({ key, categoryBlogData: formData })
      ).unwrap();
      toast.success("CategoryBlog updated successfully!");
      if (dataProps) {
        navigate(-1);
      } else {
        navigate("/blog/category");
      }
    } catch (error) {
      toast.error("Failed to update the categoryBlog.");
      console.error("Failed to update the categoryBlog:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (dataProps) {
      navigate(-1);
    } else {
      navigate("/blog/category");
    }
  };

  const getThemeClasses = () => {
    if (theme === "wireframe") {
      return {
        container: "bg-base-300/25",
        card: "bg-base-100",
        header: "bg-base-100/90",
        input:
          "bg-base-100 border-base-300 focus:border-blue-500 text-base-content",
        button: "bg-blue-600 hover:bg-blue-700 text-white",
        cancelButton:
          "bg-base-200 hover:bg-base-300 text-base-content border-base-300",
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
        cancelButton:
          "bg-base-200 hover:bg-base-300 dark:bg-base-600 dark:hover:bg-base-700 text-base-content border-base-300 dark:border-base-600",
        text: "text-base-content",
        muted: "text-base-content/60 dark:text-base-content/70",
      };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div className={`min-h-screen ${themeClasses.container} p-1 md:p-6`}>
      {/* Header */}
      <div
        className={`${themeClasses.header} backdrop-blur-xl border-b border-base-300/50 rounded-t-2xl mb-6`}>
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-start md:items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={handleBack}
                className="w-10 h-10 bg-base-200 hover:bg-base-300 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105">
                <ArrowLeft className="w-5 h-5 text-base-content" />
              </button>

              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Edit3 className="w-6 h-6 text-white" />
              </div>

              <div>
                <h1
                  className={`text-xl md:text-3xl font-bold ${themeClasses.text}`}>
                  Update Category
                </h1>
                <p className={`text-sm ${themeClasses.muted} mt-1`}>
                  Perbarui informasi kategori blog baru
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
      <form onSubmit={handleSubmit} className="gap-2 md:gap-6 grid grid-cols-1">
        <CategorySection
          icon={Tag}
          themeClasses={themeClasses}
          title="Informasi Kategori"
          gradient="from-blue-500 to-blue-600">
          <InputField
            icon={Tag}
            label="Nama Kategori"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama kategori blog..."
            required={true}
            themeClasses={themeClasses}
          />
        </CategorySection>

        <div className="flex justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={handleBack}
            className={`px-6 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border-2 ${themeClasses.cancelButton}`}>
            Batal
          </button>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className={`relative px-8 py-4 rounded-2xl text-base font-semibold ${themeClasses.button} shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3 min-w-[180px] justify-center border border-blue-500/20`}>
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Edit3 className="w-5 h-5" />
            )}
            <span>{loading ? "Memperbarui..." : "Perbarui Kategori"}</span>
            <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-all duration-700" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryBlogUpdatePage;
