import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CircularProgress } from "@mui/material";
import { createCategoryBlog } from "../../../../../features/blog/categoryBlogSlice";
import { PlusCircle, ArrowLeft, Tag, Save } from "lucide-react";
const CategorySection = ({
  icon: Icon,
  title,
  children,
  gradient,
  themeClasses,
}) => {
  const gradientBr = gradient.replace("to-r", "to-br");

  return (
    <div
      className={`${themeClasses?.card} rounded-2xl border border-base-300/50 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300`}>
      <div className={`h-1 bg-gradient-to-r ${gradient}`}></div>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientBr} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h3 className={`text-lg font-semibold ${themeClasses?.text}`}>
            {title}
          </h3>
        </div>
        {children}
      </div>
    </div>
  );
};

const CategoryBlogCreatePage = () => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useSelector((state) => state.themes.localTheme);
  const { error } = useSelector((state) => state.categoryBlogs);
  const [localError, setLocalError] = useState(null);

  const handleNameChange = (e) => {
    setName(e.target.value);
  };
  useEffect(() => {
    if (error?.name) {
      setLocalError(error.name);
    } else {
      setLocalError(null);
    }
  }, [error]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    try {
      await dispatch(createCategoryBlog(formData)).unwrap();
      navigate("/category/blog");
      toast.success("CategoryBlog created successfully!");
    } catch (err) {
      toast.error("Validation error occurred. Please check the fields.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/category/blog");
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

  const renderErrorMessages = (error) => {
    if (typeof error === "object" && error !== null) {
      return Object.keys(error).map((key) => {
        const messages = error[key];
        if (Array.isArray(messages)) {
          return messages.map((message, index) => (
            <div key={index} className="text-xs text-red-500 mt-1">
              {message}
            </div>
          ));
        }
        return null;
      });
    }
    return null;
  };

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
                <PlusCircle className="w-6 h-6 text-white" />
              </div>

              <div>
                <h1
                  className={`text-xl md:text-3xl font-bold ${themeClasses.text}`}>
                  Create Category
                </h1>
                <p className={`text-sm ${themeClasses.muted} mt-1`}>
                  Tambahkan kategori blog baru
                </p>
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
                <CircularProgress size={16} />
                <span className="text-sm font-medium text-blue-700">
                  Membuat...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        <form
          onSubmit={handleSubmit}
          className="gap-2 md:gap-6 grid grid-cols-1">
          {/* Category Name Section */}
          <CategorySection
            themeClasses={themeClasses}
            icon={Tag}
            title="Category Information"
            gradient="from-blue-500 to-blue-600">
            <div className="space-y-2">
              <label
                className={`block text-sm font-medium ${themeClasses.muted}`}>
                Nama Kategori <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  className={`w-full px-4 py-3 rounded-xl ${themeClasses.input} transition-all duration-100 placeholder:text-base-content/50`}
                  placeholder="Masukkan nama kategori blog..."
                  required
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <Tag className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              {!name.trim() && (
                <p className="text-xs text-red-500 mt-1">
                  Nama Kategori wajib diisi
                </p>
              )}
              {localError && renderErrorMessages({ name: localError })}
            </div>
          </CategorySection>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={handleBack}
              className={`
                px-6 py-3 rounded-xl text-base font-medium transition-all duration-200 
                hover:scale-[1.02] active:scale-[0.98] border-2
                ${themeClasses.cancelButton}
              `}>
              Batal
            </button>

            <button
              type="submit"
              disabled={loading || !name.trim()}
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

              <span>{loading ? "Membuat..." : "Buat Kategori"}</span>

              {/* Shine effect */}
              <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-all duration-700"></div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryBlogCreatePage;
