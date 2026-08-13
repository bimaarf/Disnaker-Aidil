import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectViewMode } from "../../../../features/classroom/classroomSlice";
import {
  useClassroomDelete,
  useClassroomList,
  useClassroomCache,
} from "../../../../features/classroom/classroomHook";
import { toast } from "react-toastify";
import { formatDate } from "../../../../Context/__formatDate";
import { truncateHTML } from "../../../../Context/__useTruncate";
import useIsMobile from "../../../../Context/__useIsMobile";
import Calendar from "../../../../Components/Template/Calendar/calendar";
import useSaveLastClassroomParams from "../../../../hooks/useSaveLastClassroomParams";
/* Styles untuk menampilkan konten HTML dari Quill Editor */
const quillDisplayStyles = `
  /* Base prose styles untuk konten Quill */
  .quill-content {
    max-width: none;
    line-height: 1.625;
    font-size: 0.875rem; /* text-sm */
  }
  
  /* Wireframe theme */
  [data-theme="wireframe"] .quill-content {
    color: rgba(31, 41, 55, 0.8); /* text-base-content/80 */
  }
  
  /* Black theme */
  [data-theme="black"] .quill-content {
    color: rgba(255, 255, 255, 0.8); /* text-base-content/80 */
  }
  
  /* Remove margin dari elemen pertama dan terakhir */
  .quill-content > *:first-child {
    margin-top: 0 !important;
  }
  
  .quill-content > *:last-child {
    margin-bottom: 0 !important;
  }
  
  /* Heading styles */
  .quill-content h1 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    line-height: 1.25;
  }
  
  [data-theme="wireframe"] .quill-content h1 {
    color: #1f2937;
  }
  
  [data-theme="black"] .quill-content h1 {
    color: #ffffff;
  }
  
  .quill-content h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
    line-height: 1.3;
  }
  
  [data-theme="wireframe"] .quill-content h2 {
    color: #1f2937;
  }
  
  [data-theme="black"] .quill-content h2 {
    color: #ffffff;
  }
  
  .quill-content h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    line-height: 1.4;
  }
  
  [data-theme="wireframe"] .quill-content h3 {
    color: #1f2937;
  }
  
  [data-theme="black"] .quill-content h3 {
    color: #ffffff;
  }
  
  /* Paragraph styles */
  .quill-content p {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .quill-content p:empty {
    display: none;
  }
  
  /* Remove empty paragraphs with only <br> */
  .quill-content p:has(br:only-child) {
    display: none;
  }
  
  /* List styles */
  .quill-content ul,
  .quill-content ol {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    padding-left: 1.5rem;
  }
  
  .quill-content ul {
    list-style-type: disc;
  }
  
  .quill-content ol {
    list-style-type: decimal;
  }
  
  .quill-content li {
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
  }
  
  .quill-content ul ul,
  .quill-content ol ol,
  .quill-content ul ol,
  .quill-content ol ul {
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
  }
  
  /* Nested list styles */
  .quill-content ul ul {
    list-style-type: circle;
  }
  
  .quill-content ul ul ul {
    list-style-type: square;
  }
  
  /* Blockquote styles */
  .quill-content blockquote {
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
    padding-left: 1rem;
    font-style: italic;
    position: relative;
  }
  
  [data-theme="wireframe"] .quill-content blockquote {
    border-left: 4px solid #3B82F6;
    color: rgba(31, 41, 55, 0.7);
    background: rgba(59, 130, 246, 0.05);
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    padding-right: 0.5rem;
  }
  
  [data-theme="black"] .quill-content blockquote {
    border-left: 4px solid #4F46E5;
    color: rgba(255, 255, 255, 0.7);
    background: rgba(79, 70, 229, 0.1);
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    padding-right: 0.5rem;
  }
  
  /* Code block styles */
  .quill-content pre {
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
    padding: 0.75rem;
    border-radius: 0.375rem;
    overflow-x: auto;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.875rem;
    line-height: 1.5;
  }
  
  [data-theme="wireframe"] .quill-content pre {
    background: #f3f4f6;
    color: #1f2937;
    border: 1px solid #e5e7eb;
  }
  
  [data-theme="black"] .quill-content pre {
    background: #121214;
    color: #e5e5e5;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  /* Inline code styles */
  .quill-content code:not(pre code) {
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.875em;
  }
  
  [data-theme="wireframe"] .quill-content code:not(pre code) {
    background: rgba(59, 130, 246, 0.1);
    color: #3B82F6;
    border: 1px solid rgba(59, 130, 246, 0.2);
  }
  
  [data-theme="black"] .quill-content code:not(pre code) {
    background: rgba(79, 70, 229, 0.15);
    color: #818CF8;
    border: 1px solid rgba(79, 70, 229, 0.3);
  }
  
  /* Link styles */
  .quill-content a {
    text-decoration: underline;
    transition: color 0.2s ease;
  }
  
  [data-theme="wireframe"] .quill-content a {
    color: #3B82F6;
  }
  
  [data-theme="wireframe"] .quill-content a:hover {
    color: #2563EB;
  }
  
  [data-theme="black"] .quill-content a {
    color: #818CF8;
  }
  
  [data-theme="black"] .quill-content a:hover {
    color: #A5B4FC;
  }
  
  /* Text formatting */
  .quill-content strong,
  .quill-content b {
    font-weight: 600;
  }
  
  [data-theme="wireframe"] .quill-content strong,
  [data-theme="wireframe"] .quill-content b {
    color: #1f2937;
  }
  
  [data-theme="black"] .quill-content strong,
  [data-theme="black"] .quill-content b {
    color: #ffffff;
  }
  
  .quill-content em,
  .quill-content i {
    font-style: italic;
  }
  
  .quill-content u {
    text-decoration: underline;
  }
  
  .quill-content s,
  .quill-content strike {
    text-decoration: line-through;
    opacity: 0.7;
  }
  
  /* Horizontal rule */
  .quill-content hr {
    margin-top: 1rem;
    margin-bottom: 1rem;
    border: none;
    height: 1px;
  }
  
  [data-theme="wireframe"] .quill-content hr {
    background: #e5e7eb;
  }
  
  [data-theme="black"] .quill-content hr {
    background: rgba(255, 255, 255, 0.1);
  }
  
  /* Image styles */
  .quill-content img {
    max-width: 100%;
    height: auto;
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
    border-radius: 0.375rem;
  }
  
  /* Video styles */
  .quill-content video {
    max-width: 100%;
    height: auto;
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
    border-radius: 0.375rem;
  }
  
  /* Table styles (if needed) */
  .quill-content table {
    width: 100%;
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
    border-collapse: collapse;
  }
  
  .quill-content th,
  .quill-content td {
    padding: 0.5rem;
    text-align: left;
  }
  
  [data-theme="wireframe"] .quill-content th {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    font-weight: 600;
    color: #1f2937;
  }
  
  [data-theme="wireframe"] .quill-content td {
    border: 1px solid #e5e7eb;
  }
  
  [data-theme="black"] .quill-content th {
    background: #1A1A1D;
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-weight: 600;
    color: #ffffff;
  }
  
  [data-theme="black"] .quill-content td {
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  /* Truncated content styles */
  .quill-content.truncated {
    position: relative;
    overflow: hidden;
  }
  
  .quill-content.truncated::after {
    // content: '...';
    // position: flex;
    // bottom: 0;
    // right: 0;
    padding-left: 0.25rem;
  }
  
  [data-theme="wireframe"] .quill-content.truncated::after {
    background: linear-gradient(to right, transparent, #ffffff 50%);
  }
  
  [data-theme="black"] .quill-content.truncated::after {
    background: linear-gradient(to right, transparent, #0a0a0a 50%);
  }
`;

const CACHE_CONFIG = {
  LIST_TIMEOUT: 2 * 60 * 1000,
  POLLING_INTERVAL: 30 * 1000,
  DEBOUNCE_DELAY: 500,
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const useSmartSearch = (initialSearchTerm = "") => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchTerm = useDebounce(
    searchTerm,
    CACHE_CONFIG.DEBOUNCE_DELAY
  );

  const updateSearchTerm = useCallback((term) => {
    setSearchTerm(term);
    setIsSearching(true);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setIsSearching(false);
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setIsSearching(false);
    }
  }, [debouncedSearchTerm, searchTerm]);

  return {
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    updateSearchTerm,
    clearSearch,
  };
};

export const ClassRoomPage = () => {
  const navigate = useNavigate();
  useSaveLastClassroomParams();

  const location = useLocation();
  const currentUser = useSelector((state) => state.auth.user);
  const newlyCreated = location.state?.newlyCreated;
  const newClassroomId = location.state?.classroomId;
  const fromCreate = location.state?.fromCreate;

  const [selectedClassrooms, setSelectedClassrooms] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showNewDataAlert, setShowNewDataAlert] = useState(false);
  const [highlightedClassroom, setHighlightedClassroom] = useState(null);
  const isMobile = useIsMobile();
  const viewMode = useSelector(selectViewMode);

  const {
    classrooms,
    pagination,
    searchTerm: storeSearchTerm,
    filters,
    isLoading,
    canLoadMore,
    lastUpdated,
    hasClassrooms,
    handleSearch: storeHandleSearch,
    handleFilterChange,
    handlePerPageChange,
    handleViewModeChange,
    loadMore,
    refresh,
    smartRefresh,
    clearFilters,
    invalidateListCache,
    loadClassrooms,
  } = useClassroomList({
    autoLoad: !fromCreate,
    cacheTimeout: CACHE_CONFIG.LIST_TIMEOUT,
    enablePolling: false,
    pollingInterval: CACHE_CONFIG.POLLING_INTERVAL,
  });

  const { handleDelete, isDeleting } = useClassroomDelete();
  const { checkStaleness } = useClassroomCache();

  const {
    searchTerm: localSearchTerm,
    debouncedSearchTerm,
    isSearching,
    updateSearchTerm,
    clearSearch,
  } = useSmartSearch(storeSearchTerm);

  useEffect(() => {
    if (newlyCreated && newClassroomId) {
      setShowNewDataAlert(true);
      setHighlightedClassroom(newClassroomId);

      if (!hasClassrooms) {
        loadClassrooms({}, true);
      }

      const timer = setTimeout(() => {
        setShowNewDataAlert(false);
      }, 5000);

      const highlightTimer = setTimeout(() => {
        setHighlightedClassroom(null);
      }, 10000);

      window.history.replaceState({}, document.title);

      return () => {
        clearTimeout(timer);
        clearTimeout(highlightTimer);
      };
    }
  }, [newlyCreated, newClassroomId, hasClassrooms, loadClassrooms]);

  useEffect(() => {
    if (fromCreate && !hasClassrooms && !isLoading) {
      loadClassrooms({}, false);
    }
  }, [fromCreate, hasClassrooms, isLoading, loadClassrooms]);

  useEffect(() => {
    if (debouncedSearchTerm !== storeSearchTerm) {
      storeHandleSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, storeSearchTerm, storeHandleSearch]);

  const isDataStale = useMemo(
    () => checkStaleness("list", CACHE_CONFIG.LIST_TIMEOUT),
    [checkStaleness, lastUpdated]
  );

  useEffect(() => {
    const handleFocus = () => {
      if (isDataStale && !isLoading && !newlyCreated) {
        smartRefresh();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isDataStale, isLoading, smartRefresh, newlyCreated]);

  const onDeleteClassroom = useCallback(
    async (classroomId) => {
      const result = await handleDelete(classroomId, {
        confirmMessage: "Apakah Anda yakin ingin menghapus kelas ini?",
        successMessage: "Kelas berhasil dihapus",
      });

      if (result.success) {
        setSelectedClassrooms((prev) =>
          prev.filter((id) => id !== classroomId)
        );
      }

      return result;
    },
    [handleDelete]
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedClassrooms.length === 0) return;

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus ${selectedClassrooms.length} kelas yang dipilih?`
    );

    if (!confirmed) return;

    let successCount = 0;
    const errors = [];

    for (const classroomId of selectedClassrooms) {
      try {
        const result = await handleDelete(classroomId, { showConfirm: false });
        if (result.success) {
          successCount++;
        } else if (result.error) {
          errors.push(`Kelas ${classroomId}: ${result.error.message}`);
        }
      } catch (error) {
        errors.push(`Kelas ${classroomId}: ${error.message}`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} kelas berhasil dihapus`);
    }

    if (errors.length > 0) {
      {
        process.env.NODE_ENV === "production" &&
          console.error("Bulk delete errors:", errors);
      }
      toast.error(`Gagal menghapus ${errors.length} kelas`);
    }

    setSelectedClassrooms([]);
  }, [selectedClassrooms, handleDelete]);

  const handleSelectAll = useCallback(
    (checked) => {
      if (checked) {
        setSelectedClassrooms(classrooms.map((classroom) => classroom.id));
      } else {
        setSelectedClassrooms([]);
      }
    },
    [classrooms]
  );

  const handleSelectClassroom = useCallback((classroomId, checked) => {
    setSelectedClassrooms((prev) =>
      checked
        ? prev.includes(classroomId)
          ? prev
          : [...prev, classroomId]
        : prev.filter((id) => id !== classroomId)
    );
  }, []);

  const handleManualRefresh = useCallback(() => {
    invalidateListCache();
    refresh();
    setShowNewDataAlert(false);
  }, [invalidateListCache, refresh]);

  const handleClearSearch = useCallback(() => {
    clearSearch();
    if (storeSearchTerm) {
      storeHandleSearch("");
    }
  }, [clearSearch, storeSearchTerm, storeHandleSearch]);

  const handleClearAllFilters = useCallback(() => {
    clearSearch();
    clearFilters();
  }, [clearSearch, clearFilters]);

  const handlePreviewData = useCallback(
    (data) => {
      navigate(`/classrooms/${data.code}`);
    },
    [navigate]
  );

  const handleEditData = useCallback(
    (data) => {
      navigate(`/classrooms/${data.code}/edit`);
    },
    [navigate]
  );

  const statistics = useMemo(() => {
    if (!classrooms.length)
      return { total: 0, active: 0, teachers: 0, students: 0 };

    return {
      total:
        pagination.totalItems ||
        pagination.totalClassrooms ||
        classrooms.length,
      active: classrooms.filter((cls) => cls.status === "active").length,
      teachers: classrooms.reduce(
        (sum, cls) => sum + (cls.teacher_count || 0),
        0
      ),
      students: classrooms.reduce(
        (sum, cls) => sum + (cls.student_count || 0),
        0
      ),
    };
  }, [classrooms, pagination.totalItems, pagination.totalClassrooms]);

  const selectionState = useMemo(
    () => ({
      hasSelected: selectedClassrooms.length > 0,
      isAllSelected:
        selectedClassrooms.length === classrooms.length &&
        classrooms.length > 0,
      selectedCount: selectedClassrooms.length,
    }),
    [selectedClassrooms, classrooms]
  );

  const isClassroomHighlighted = useCallback(
    (classroomId) => {
      return highlightedClassroom === classroomId;
    },
    [highlightedClassroom]
  );

  // 1. Import dan inject styles
  useEffect(() => {
    const styleId = "quill-display-styles";
    let existingStyle = document.getElementById(styleId);

    if (!existingStyle) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = quillDisplayStyles;
      document.head.appendChild(style);
    }

    return () => {
      const style = document.getElementById(styleId);
      if (style) {
        style.remove();
      }
    };
  }, []);
  return (
    <div className="min-h-screen px-1 md:px-0">
      {/* Header Navigation */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-12 md:col-span-9">
          <div className="">
            {/* New Data Alert */}
            {showNewDataAlert && newlyCreated && (
              <div className="mb-6 bg-success/10 border border-success/20 p-4 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-success mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-success font-medium">
                        Kelas baru berhasil dibuat!
                      </p>
                      <p className="text-success/80 text-sm">
                        Data telah ditambahkan ke daftar tanpa perlu memuat
                        ulang halaman.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNewDataAlert(false)}
                    className="text-success/60 hover:text-success transition-colors duration-100">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Header with Cache Status */}
            <div className="mb-6 group bg-base-100 dark:bg-base-200 backdrop-blur-sm p-6 rounded-3xl border border-base-200/50 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 006 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                    />
                  </svg>
                  <div>
                    <h1 className="text-xl font-bold text-base-content">
                      Manajemen Kelas
                    </h1>
                    <p className="text-base-content/60 text-sm">
                      Kelola kelas, guru, dan siswa dengan mudah
                    </p>
                  </div>
                  {isDataStale && !newlyCreated && (
                    <div className="flex items-center gap-2 ml-4">
                      <div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
                      <span className="text-xs text-warning font-medium">
                        Data mungkin sudah usang
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-4 lg:mt-0">
                  <button
                    onClick={handleManualRefresh}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-base-300 rounded-xl bg-base-100 dark:bg-base-300 text-base-content/80 hover:bg-base-200/50 disabled:opacity-50 transition-all duration-300 shadow-sm hover:shadow-sm"
                    title="Refresh data">
                    <svg
                      className={`w-4 h-4 mr-2 ${
                        isLoading ? "animate-spin" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {isLoading ? "Memuat..." : "Refresh"}
                  </button>
                  {currentUser.role !== "user" && (
                    <Link
                      to="/classrooms/create"
                      className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-primary to-blue-700 text-white rounded-xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 shadow-sm font-medium">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Tambah Kelas
                    </Link>
                  )}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center px-4 py-2 border border-base-300 rounded-xl bg-base-100 dark:bg-base-300 text-base-content/80 hover:bg-base-200/50 transition-all duration-300 shadow-sm hover:shadow-sm">
                    <svg
                      className="w-4 h-4 mr-2 text-base-content/60"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                      />
                    </svg>
                    {showFilters ? "Sembunyikan Filter" : "Tampilkan Filter"}
                  </button>
                  <div className="flex items-center bg-base-100 dark:bg-base-300 border border-base-300 rounded-xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => handleViewModeChange("table")}
                      className={`px-3 py-2 text-sm font-medium duration-300 hover:shadow-inner ${
                        viewMode === "table"
                          ? "bg-primary text-white"
                          : "text-base-content/80 hover:text-base-content hover:bg-base-200/50"
                      }`}
                      title="Tampilan Tabel">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 10h16M4 14h16M4 18h16"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleViewModeChange("grid")}
                      className={`px-3 py-2 text-sm font-medium duration-300 hover:shadow-inner ${
                        viewMode === "grid"
                          ? "bg-primary text-white"
                          : "text-base-content/80 hover:text-base-content hover:bg-base-200/50"
                      }`}
                      title="Tampilan Grid">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Enhanced Search and Filters */}
              <div className="space-y-2">
                <div className="relative max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-base-content/40"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Cari kelas atau kode..."
                    value={localSearchTerm}
                    onChange={(e) => updateSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-base-100 border border-base-300 rounded-xl outline-none focus:border-primary transition-all duration-300 shadow-sm hover:shadow-sm text-base-content/80 placeholder:text-base-content/40"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {isSearching && (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                    )}
                    {localSearchTerm && (
                      <button
                        onClick={handleClearSearch}
                        className="text-base-content/40 hover:text-base-content/80 transition-colors duration-300">
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {showFilters && (
                  <div className="bg-base-100 border border-base-200 rounded-2xl p-4 md:p-6 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-sm font-semibold text-base-content/80 mb-2">
                          Status
                        </label>
                        <select
                          value={filters.status}
                          onChange={(e) =>
                            handleFilterChange({ status: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-xl outline-none focus:border-primary transition-all duration-300 shadow-sm text-base-content/80">
                          <option value="all">Semua Status</option>
                          <option value="active">Aktif</option>
                          <option value="inactive">Tidak Aktif</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-base-content/80 mb-2">
                          Item per Halaman
                        </label>
                        <select
                          value={pagination.perPage}
                          onChange={(e) =>
                            handlePerPageChange(Number(e.target.value))
                          }
                          className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-xl outline-none focus:border-primary transition-all duration-300 shadow-sm text-base-content/80">
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={handleClearAllFilters}
                          className="w-full px-4 py-3 bg-base-100 text-base-content/80 rounded-xl hover:bg-base-200/50 border border-base-300 transition-all duration-300 shadow-sm font-medium">
                          <svg
                            className="w-4 h-4 inline mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          Reset Filter
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {selectionState.hasSelected && (
                <div className="mt-4 flex items-center justify-between bg-primary/5 border border-primary/20 p-4 rounded-2xl shadow-sm">
                  <span className="text-primary font-medium">
                    {selectionState.selectedCount} kelas dipilih
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                      className="px-4 py-2 bg-error text-white rounded-xl hover:bg-error/80 disabled:opacity-50 transition-all duration-300 shadow-sm font-medium">
                      {isDeleting ? (
                        <>
                          <svg
                            className="w-4 h-4 inline mr-2 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Menghapus...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 inline mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Hapus Terpilih
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setSelectedClassrooms([])}
                      className="px-4 py-2 border border-base-300 bg-base-100 text-base-content/80 rounded-xl hover:bg-base-200/50 transition-all duration-300 shadow-sm font-medium">
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
              <div className="group bg-base-100 dark:bg-base-200 backdrop-blur-sm p-4 rounded-3xl border border-base-200/50 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-base-content">
                      {statistics.total}
                    </div>
                    <div className="text-base-content/60 text-sm">
                      Total Kelas
                    </div>
                  </div>
                </div>
              </div>
              <div className="group bg-base-100 dark:bg-base-200 backdrop-blur-sm p-4 rounded-3xl border border-base-200/50 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-success"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-base-content">
                      {statistics.active}
                    </div>
                    <div className="text-base-content/60 text-sm">
                      Kelas Aktif
                    </div>
                  </div>
                </div>
              </div>
              <div className="group bg-base-100 dark:bg-base-200 backdrop-blur-sm p-4 rounded-3xl border border-base-200/50 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-info/10 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-info"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-base-content">
                      {statistics.teachers}
                    </div>
                    <div className="text-base-content/60 text-sm">
                      Total Guru
                    </div>
                  </div>
                </div>
              </div>
              <div className="group bg-base-100 dark:bg-base-200 backdrop-blur-sm p-4 rounded-3xl border border-base-200/50 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-warning"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-base-content">
                      {statistics.students}
                    </div>
                    <div className="text-base-content/60 text-sm">
                      Total Siswa
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Layout with Calendar Sidebar */}
            <div className="flex flex-col lg:flex-row gap-2">
              {/* Left/Main Content */}
              <div className="lg:w-full">
                {/* Loading State */}
                {isLoading && !hasClassrooms && (
                  <div className="flex justify-center items-center py-20">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-base-content/80 font-medium">
                        Memuat data kelas...
                      </p>
                      <p className="text-base-content/60 text-sm mt-2">
                        {isDataStale
                          ? "Mengambil data terbaru..."
                          : "Memuat dari cache..."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Classroom Content */}
                {hasClassrooms && (
                  <>
                    {viewMode === "table" ? (
                      <div className="overflow-x-auto rounded-2xl shadow-sm border border-base-200/50">
                        <table className="min-w-full divide-y divide-base-300 table-zebra">
                          <thead className="bg-base-200/50">
                            <tr>
                              <th className="px-6 py-4 text-left">
                                <input
                                  type="checkbox"
                                  checked={selectionState.isAllSelected}
                                  onChange={(e) =>
                                    handleSelectAll(e.target.checked)
                                  }
                                  className="rounded border-base-300 text-primary focus:ring-primary"
                                />
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                                Nama Kelas
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                                Kode
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                                Guru
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                                Siswa
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                                Dibuat
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                                Aksi
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-base-100 divide-y divide-base-200">
                            {classrooms.map((classroom) => (
                              <tr
                                key={classroom.id}
                                className={`hover:bg-base-200/30 transition-all duration-300 shadow-sm hover:shadow-sm ${
                                  selectedClassrooms.includes(classroom.id)
                                    ? "bg-primary/5"
                                    : ""
                                } ${
                                  isClassroomHighlighted(classroom.id)
                                    ? "bg-success/10 ring-2 ring-success/20"
                                    : ""
                                }`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={selectedClassrooms.includes(
                                      classroom.id
                                    )}
                                    onChange={(e) =>
                                      handleSelectClassroom(
                                        classroom.id,
                                        e.target.checked
                                      )
                                    }
                                    className="rounded border-base-300 text-primary focus:ring-primary"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mr-3">
                                      {isClassroomHighlighted(classroom.id) && (
                                        <svg
                                          className="w-5 h-5 text-success animate-pulse"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24">
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                      )}
                                      {!isClassroomHighlighted(
                                        classroom.id
                                      ) && (
                                        <svg
                                          className="w-5 h-5 text-primary"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24">
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 006 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-base-content line-clamp-1">
                                        {classroom.name}
                                        {isClassroomHighlighted(
                                          classroom.id
                                        ) && (
                                          <span className="ml-2 text-xs bg-success/10 text-success px-2 py-1 rounded-full">
                                            Baru
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-sm text-primary font-mono bg-primary/10 px-2 py-1 rounded-lg">
                                    {classroom.code}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      classroom.status === "active"
                                        ? "bg-success/10 text-success"
                                        : "bg-error/10 text-error"
                                    }`}>
                                    <span
                                      className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
                                        classroom.status === "active"
                                          ? "bg-success"
                                          : "bg-error"
                                      }`}></span>
                                    {classroom.status === "active"
                                      ? "Aktif"
                                      : "Tidak Aktif"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <svg
                                      className="w-4 h-4 text-base-content/40 mr-1"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                      />
                                    </svg>
                                    <span className="text-sm font-medium text-base-content">
                                      {classroom.teacher_count || 0}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <svg
                                      className="w-4 h-4 text-base-content/40 mr-1"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                      />
                                    </svg>
                                    <span className="text-sm font-medium text-base-content">
                                      {classroom.student_count || 0}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content/60">
                                  {formatDate(classroom.created_at)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() =>
                                        handlePreviewData(classroom)
                                      }
                                      className="text-primary hover:text-primary/80 font-medium transition-all duration-300 shadow-sm hover:shadow-sm p-1 rounded"
                                      title="Lihat detail kelas">
                                      <svg
                                        className="w-4 h-4 inline mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                      </svg>
                                      Detail
                                    </button>
                                    {currentUser.role !== "user" && (
                                      <>
                                        <button
                                          onClick={() =>
                                            handleEditData(classroom)
                                          }
                                          className="text-warning hover:text-warning/80 font-medium transition-all duration-300 shadow-sm hover:shadow-sm p-1 rounded"
                                          title="Edit kelas">
                                          <svg
                                            className="w-4 h-4 inline mr-1"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                            />
                                          </svg>
                                          Edit
                                        </button>
                                        <button
                                          onClick={() =>
                                            onDeleteClassroom(classroom.id)
                                          }
                                          disabled={isDeleting}
                                          className="text-error hover:text-error/80 disabled:opacity-50 font-medium transition-all duration-300 shadow-sm hover:shadow-sm p-1 rounded"
                                          title="Hapus kelas">
                                          <svg
                                            className="w-4 h-4 inline mr-1"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                          </svg>
                                          Hapus
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2">
                        {classrooms.map((classroom) => (
                          <div
                            key={classroom.id}
                            className={`group bg-base-100 dark:bg-base-200 shadow-sm backdrop-blur-sm rounded-3xl border border-base-200/50 overflow-hidden hover:border-primary/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                              selectedClassrooms.includes(classroom.id)
                                ? "ring-2 ring-primary ring-opacity-50"
                                : ""
                            } ${
                              isClassroomHighlighted(classroom.id)
                                ? "ring-2 ring-success ring-opacity-50 bg-success/5"
                                : ""
                            }`}>
                            <div className="p-6 relative">
                              <div className="absolute top-4 right-4">
                                <input
                                  type="checkbox"
                                  checked={selectedClassrooms.includes(
                                    classroom.id
                                  )}
                                  onChange={(e) =>
                                    handleSelectClassroom(
                                      classroom.id,
                                      e.target.checked
                                    )
                                  }
                                  className="rounded border-base-300 text-primary focus:ring-primary bg-base-100/80"
                                />
                              </div>
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                                    {classroom.code}
                                  </span>
                                  {isClassroomHighlighted(classroom.id) && (
                                    <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full animate-pulse">
                                      Baru
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                    classroom.status === "active"
                                      ? "bg-success/10 text-success"
                                      : "bg-error/10 text-error"
                                  }`}>
                                  <span
                                    className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
                                      classroom.status === "active"
                                        ? "bg-success"
                                        : "bg-error"
                                    }`}></span>
                                  {classroom.status === "active"
                                    ? "Aktif"
                                    : "Tidak Aktif"}
                                </span>
                              </div>
                              <h3 className="text-lg font-semibold text-base-content mb-2 line-clamp-1">
                                {classroom.name}
                                {isClassroomHighlighted(classroom.id) && (
                                  <svg
                                    className="w-5 h-5 text-success inline ml-2 animate-bounce"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </h3>
                              <div className="text-sm text-base-content/70 opacity-65 line-clamp-3 mb-3 leading-relaxed px-1 h-[80px]">
                                <div
                                  className="quill-content"
                                  dangerouslySetInnerHTML={{
                                    __html: truncateHTML(
                                      classroom.description,
                                      80
                                    ),
                                  }}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2 mb-6">
                                <div className="bg-primary/5 rounded-xl p-3 shadow-inner">
                                  <div className="flex items-center">
                                    <svg
                                      className="w-4 h-4 text-info mr-2"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                      />
                                    </svg>
                                    <div>
                                      <div className="text-lg font-bold text-base-content">
                                        {classroom.teacher_count || 0}
                                      </div>
                                      <div className="text-xs text-base-content/60">
                                        Guru
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-warning/5 rounded-xl p-3 shadow-inner">
                                  <div className="flex items-center">
                                    <svg
                                      className="w-4 h-4 text-warning mr-2"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                      />
                                    </svg>
                                    <div>
                                      <div className="text-lg font-bold text-base-content">
                                        {classroom.student_count || 0}
                                      </div>
                                      <div className="text-xs text-base-content/60">
                                        Siswa
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-base-content/60 mb-4">
                                Dibuat: {formatDate(classroom.created_at)}
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handlePreviewData(classroom)}
                                  className="w-full px-3 py-2 bg-gradient-to-r from-primary to-blue-700 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 shadow-sm text-sm font-medium text-center"
                                  title="Lihat detail kelas">
                                  <svg
                                    className="w-4 h-4 inline mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                  Detail
                                </button>
                                {currentUser.role !== "user" && (
                                  <>
                                    <button
                                      onClick={() => handleEditData(classroom)}
                                      className="px-3 py-2 bg-warning/10 text-warning rounded-xl hover:bg-warning/20 transition-all duration-300 shadow-sm text-sm font-medium"
                                      title="Edit kelas">
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() =>
                                        onDeleteClassroom(classroom.id)
                                      }
                                      disabled={isDeleting}
                                      className="px-3 py-2 bg-error/10 text-error rounded-xl hover:bg-error/20 disabled:opacity-50 transition-all duration-300 shadow-sm text-sm font-medium"
                                      title="Hapus kelas">
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Enhanced Load More Button */}
                    {canLoadMore && (
                      <div className="mt-8 text-center">
                        <button
                          onClick={loadMore}
                          disabled={isLoading}
                          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-blue-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:transform-none">
                          {isLoading ? (
                            <>
                              <svg
                                className="w-5 h-5 mr-2 animate-spin"
                                fill="none"
                                viewBox="0 0 24 24">
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                              Memuat...
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-5 h-5 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                              Muat Lebih Banyak
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Enhanced Empty State */}
                    {!hasClassrooms && !isLoading && (
                      <div className="text-center py-20">
                        <div className="w-24 h-24 bg-base-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                          <svg
                            className="w-12 h-12 text-base-content/40"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 006 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                            />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-base-content mb-2">
                          {localSearchTerm || filters.status !== "all"
                            ? "Tidak ada kelas yang sesuai"
                            : "Belum ada kelas"}
                        </h3>
                        <p className="text-base-content/60 mb-8 max-w-md mx-auto">
                          {localSearchTerm || filters.status !== "all"
                            ? "Coba ubah kata kunci pencarian atau filter Anda untuk menemukan kelas yang diinginkan."
                            : "Mulai dengan membuat kelas baru untuk mengelola pembelajaran dengan lebih terorganisir."}
                        </p>
                        {localSearchTerm || filters.status !== "all" ? (
                          <button
                            onClick={handleClearAllFilters}
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-blue-700 text-white rounded-xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 shadow-sm font-medium">
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            Reset Pencarian & Filter
                          </button>
                        ) : (
                          <Link
                            to="/classrooms/create"
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-blue-700 text-white rounded-xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 shadow-sm font-medium">
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            Buat Kelas Pertama
                          </Link>
                        )}
                        {isDataStale && !newlyCreated && (
                          <div className="mt-4">
                            <button
                              onClick={handleManualRefresh}
                              disabled={isLoading}
                              className="inline-flex items-center px-4 py-2 border border-base-300 rounded-xl bg-base-100 dark:bg-base-300 text-base-content/80 hover:bg-base-200/50 disabled:opacity-50 transition-all duration-300 shadow-sm">
                              <svg
                                className={`w-4 h-4 mr-2 ${
                                  isLoading ? "animate-spin" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                              {isLoading ? "Memuat..." : "Coba Muat Ulang"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Right Sidebar - Calendar */}
            </div>
            {/* Mobile Calendar - Below main content */}
          </div>
        </div>
        <div className={`${isMobile ? "col-span-12" : "col-span-3"}`}>
          <Calendar />
        </div>
      </div>
    </div>
  );
};

export default memo(ClassRoomPage);
