import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { CircularLoader } from "../../../../Components/_CircularLoader";
import { formatDate } from "../../../../Context/__formatDate";
import { truncateText } from "../../../../Context/__useTruncate";
import { fetchBlogs, resetBlogs } from "../../../../features/blog/blogSlice";
import {
  handleDelete,
  handleDeleteData,
  handleEditData,
} from "./__actions/__blogAction";
import { BadgeBlogs } from "./__badgeBlogs";
import { TabsFilter } from "./__components/__tabs";
import BlogList from "./__components/blogList";
import BlogTable from "./__components/blogTable";

export const BlogPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Redux State
  const blogs = useSelector((state) => state.blogs.blogs);
  const total = useSelector((state) => state.blogs.total);
  const totalVisible = useSelector((state) => state.blogs.totalVisible);
  const totalHidden = useSelector((state) => state.blogs.totalHidden);
  const status = useSelector((state) => state.blogs.status);
  const currentPageFromStore = useSelector((state) => state.blogs.page);
  const totalPages = useSelector((state) => state.blogs.totalPages);

  // ============================================
  // SCROLL RESTORATION HOOK
  // ============================================
  // Hook akan otomatis handle scroll save & restore

  // Local State - Restore dari sessionStorage jika ada
  const [query, setQuery] = useState(() => {
    return sessionStorage.getItem("blogPage_query") || "";
  });
  const [fromDate, setFromDate] = useState(() => {
    return sessionStorage.getItem("blogPage_fromDate") || "";
  });
  const [toDate, setToDate] = useState(() => {
    return sessionStorage.getItem("blogPage_toDate") || "";
  });
  const [sortConfig, setSortConfig] = useState(() => {
    const saved = sessionStorage.getItem("blogPage_sortConfig");
    return saved ? JSON.parse(saved) : { key: "created_at", direction: "desc" };
  });
  const [selectedDatas, setSelectedDatas] = useState([]);
  const [isTab, setIsTab] = useState(() => {
    return sessionStorage.getItem("blogPage_isTab") || "table";
  });
  const [searchParams, setSearchParams] = useState(() => {
    const saved = sessionStorage.getItem("blogPage_searchParams");
    return saved ? JSON.parse(saved) : { query: "", fromDate: "", toDate: "" };
  });

  // Refs
  const isFetchingRef = useRef(false);
  const observerRef = useRef(null);
  const loadMoreTriggerRef = useRef(null);

  // ============================================
  // STATE PERSISTENCE
  // ============================================

  // Simpan state ke sessionStorage setiap kali berubah
  useEffect(() => {
    sessionStorage.setItem("blogPage_query", query);
  }, [query]);

  useEffect(() => {
    sessionStorage.setItem("blogPage_fromDate", fromDate);
  }, [fromDate]);

  useEffect(() => {
    sessionStorage.setItem("blogPage_toDate", toDate);
  }, [toDate]);

  useEffect(() => {
    sessionStorage.setItem("blogPage_sortConfig", JSON.stringify(sortConfig));
  }, [sortConfig]);

  useEffect(() => {
    sessionStorage.setItem("blogPage_isTab", isTab);
  }, [isTab]);

  useEffect(() => {
    sessionStorage.setItem(
      "blogPage_searchParams",
      JSON.stringify(searchParams)
    );
  }, [searchParams]);

  // ============================================
  // SEARCH & FILTER HANDLERS
  // ============================================

  const handleSearch = () => {
    setSearchParams({ query, fromDate, toDate });
    dispatch(resetBlogs());
    isFetchingRef.current = false;

    // Clear scroll data saat search baru

    dispatch(
      fetchBlogs({
        page: 1,
        perPage: 10,
        searchQuery: query,
        fromDate,
        toDate,
        loadMore: false,
      })
    );
  };

  const handleReset = () => {
    setQuery("");
    setFromDate("");
    setToDate("");
    setSearchParams({ query: "", fromDate: "", toDate: "" });
    dispatch(resetBlogs());
    isFetchingRef.current = false;

    // Clear scroll data saat reset

    dispatch(
      fetchBlogs({
        page: 1,
        perPage: 10,
        searchQuery: "",
        fromDate: "",
        toDate: "",
        loadMore: false,
      })
    );
  };

  // ============================================
  // INITIAL DATA LOADING
  // ============================================

  // Initial load
  // Initial load
  useEffect(() => {
    const fromDetail =
      location.state?.fromDetail || location.state?.fromBlogPage;

    // Jika kembali dari detail dan sudah ada data, skip fetch
    if (fromDetail && blogs.length > 0) {
      return; // ✅ Ini sudah benar - skip fetch jika ada data
    }

    // Jika belum ada data, fetch dari awal
    if (blogs.length === 0) {
      isFetchingRef.current = false;

      dispatch(
        fetchBlogs({
          page: 1,
          perPage: 10,
          searchQuery: searchParams.query,
          fromDate: searchParams.fromDate,
          toDate: searchParams.toDate,
          loadMore: false,
        })
      );
    }
  }, []); // Empty dependency - hanya run sekali saat mount

  // ============================================
  // INFINITE SCROLL WITH INTERSECTION OBSERVER
  // ============================================

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (currentPageFromStore >= totalPages || status === "loading") {
      return;
    }

    const options = {
      root: null,
      rootMargin: "200px",
      threshold: 0.1,
    };

    const handleIntersection = (entries) => {
      const [entry] = entries;

      if (
        entry.isIntersecting &&
        !isFetchingRef.current &&
        currentPageFromStore < totalPages &&
        status !== "loading"
      ) {
        isFetchingRef.current = true;

        dispatch(
          fetchBlogs({
            page: currentPageFromStore + 1,
            perPage: 10,
            searchQuery: searchParams.query,
            fromDate: searchParams.fromDate,
            toDate: searchParams.toDate,
            loadMore: true,
          })
        );
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersection, options);

    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [
    dispatch,
    currentPageFromStore,
    totalPages,
    status,
    searchParams.query,
    searchParams.fromDate,
    searchParams.toDate,
  ]);
  // Agar ga render ulang
  useEffect(() => {
    const fromBlogPage = location.state?.fromBlogPage;

    if (fromBlogPage) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  
  useEffect(() => {
    if (status === "succeeded" || status === "failed") {
      isFetchingRef.current = false;
    }
  }, [status]);

  // ============================================
  // SORTING
  // ============================================

  const requestSort = (key) => {
    const newDirection =
      sortConfig.key === key && sortConfig.direction === "desc"
        ? "asc"
        : "desc";
    setSortConfig({ key, direction: newDirection });
  };

  const sortedBlogs = useMemo(() => {
    let sortable = [...blogs];

    if (sortConfig.key) {
      sortable.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal == null) return 1;
        if (bVal == null) return -1;

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return sortable;
  }, [blogs, sortConfig]);

  const uniqueBlogs = useMemo(() => {
    return sortedBlogs;
  }, [sortedBlogs]);

  // ============================================
  // NAVIGATION HANDLERS
  // ============================================

  const handlePreviewData = (data) => {
    if (!data?.key || data.key === "undefined" || data.key.trim() === "") {
      toast.error("Cannot preview blog: Invalid blog key.");
      return;
    }

    // Navigate dengan state flag
    // Hook useScrollRestoration akan otomatis save scroll position
    navigate(`/blog/preview/${data.key}`, {
      state: {
        key: data.key,
        dataProps: data,
        fromBlogPage: true, // Flag untuk restore scroll
      },
    });
  };

  const hasMore = currentPageFromStore < totalPages;

  return (
    <div className="space-y-6 min-h-[90vh] overflow-hidden">
      <div className="bg-base-100 dark:bg-base-200 border-2 border-base-200/30 rounded-3xl backdrop-blur-sm p-6">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start md:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-primary">
                  article
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-base-content">
                  Blog Management
                </h1>
                <p className="text-base-content/60">
                  Manage your blog posts and content
                  {blogs.length > 0 && (
                    <span className="ml-2 text-xs">
                      ({blogs.length} of {total} loaded)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="hidden md:block">
              <BadgeBlogs
                totalVisible={totalVisible}
                totalHidden={totalHidden}
                badgeData={total}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-base-content/60 group-focus-within:text-primary transition-colors duration-300">
                    search
                  </span>
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-12 pr-4 py-3 bg-base-200 dark:bg-base-300 rounded-2xl focus:border-primary outline-none transition-all duration-300 placeholder:text-base-content/50 hover:border-base-300"
                  placeholder="Search blog posts..."
                />
              </div>
            </div>

            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
              <div className="relative group">
                <label className="absolute -top-5 left-3 px-2 text-xs font-medium text-base-content/70 z-10">
                  From
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full p-3 bg-base-200 dark:bg-base-300 rounded-2xl focus:border-primary outline-none transition-all duration-300 hover:border-base-300"
                />
              </div>
              <div className="relative group">
                <label className="absolute -top-5 left-3 px-2 text-xs font-medium text-base-content/70 z-10">
                  To
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full p-3 bg-base-200 dark:bg-base-300 rounded-2xl focus:border-primary outline-none transition-all duration-300 hover:border-base-300"
                />
              </div>
            </div>

            <div className="lg:col-span-3 grid grid-cols-2 gap-3">
              <button
                onClick={handleSearch}
                className="group flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-content rounded-2xl font-semibold hover:bg-primary/90 transition-all duration-300 active:scale-[98%] hover:scale-105">
                <span className="material-symbols-outlined text-lg">
                  search
                </span>
                <span className="hidden sm:inline">Search</span>
              </button>
              <button
                onClick={handleReset}
                className="group flex items-center justify-center gap-2 px-6 py-3 bg-base-200/80 text-base-content rounded-2xl font-semibold hover:bg-base-300/80 transition-all duration-300 active:scale-[98%] hover:scale-105">
                <span className="material-symbols-outlined text-lg">
                  refresh
                </span>
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>

          {(query || fromDate || toDate) && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-base-200/50">
              <span className="text-sm font-medium text-base-content/70">
                Active filters:
              </span>
              {query && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  <span className="material-symbols-outlined text-xs">
                    search
                  </span>
                  <span>{`"${query}"`}</span>
                  <button
                    onClick={() => setQuery("")}
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors duration-200">
                    <span className="material-symbols-outlined text-xs">
                      close
                    </span>
                  </button>
                </div>
              )}
              {fromDate && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-info/10 text-info rounded-full text-sm font-medium">
                  <span className="material-symbols-outlined text-xs">
                    calendar_today
                  </span>
                  <span>From: {fromDate}</span>
                  <button
                    onClick={() => setFromDate("")}
                    className="hover:bg-info/20 rounded-full p-0.5 transition-colors duration-200">
                    <span className="material-symbols-outlined text-xs">
                      close
                    </span>
                  </button>
                </div>
              )}
              {toDate && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-warning/10 text-warning rounded-full text-sm font-medium">
                  <span className="material-symbols-outlined text-xs">
                    calendar_today
                  </span>
                  <span>To: {toDate}</span>
                  <button
                    onClick={() => setToDate("")}
                    className="hover:bg-warning/20 rounded-full p-0.5 transition-colors duration-200">
                    <span className="material-symbols-outlined text-xs">
                      close
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 pt-6">
          <TabsFilter isTab={isTab} setIsTab={setIsTab} />
        </div>
      </div>

      <div className="">
        {!isTab ? (
          <BlogList
            type="dash/blog"
            datas={uniqueBlogs}
            status={status}
            sortConfig={sortConfig}
            requestSort={requestSort}
            handlePreviewData={handlePreviewData}
            handleEditData={(data) => handleEditData(navigate, data)}
            handleDeleteData={(dataKey) => handleDeleteData(dispatch, dataKey)}
            handleDelete={() =>
              handleDelete(dispatch, selectedDatas, setSelectedDatas)
            }
            formatDate={formatDate}
            truncateTitle={truncateText}
            selectedDatas={selectedDatas}
            setSelectedDatas={setSelectedDatas}
          />
        ) : (
          <BlogTable
            type="dash/blog"
            datas={uniqueBlogs}
            status={status}
            sortConfig={sortConfig}
            requestSort={requestSort}
            handlePreviewData={handlePreviewData}
            handleEditData={(data) => handleEditData(navigate, data)}
            handleDeleteData={(dataKey) => handleDeleteData(dispatch, dataKey)}
            handleDelete={() =>
              handleDelete(dispatch, selectedDatas, setSelectedDatas)
            }
            formatDate={formatDate}
            truncateTitle={truncateText}
            selectedDatas={selectedDatas}
            setSelectedDatas={setSelectedDatas}
          />
        )}
      </div>

      {hasMore && (
        <div
          ref={loadMoreTriggerRef}
          className="py-8 flex items-center justify-center">
          {status === "loading" ? (
            <div className="flex items-center gap-3 text-base-content/60">
              <div className="loading loading-spinner loading-md text-primary"></div>
              <span className="font-medium">Loading more...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-base-content/60">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg text-primary animate-pulse">
                  more_horiz
                </span>
              </div>
              <span className="font-medium">Scroll for more content</span>
            </div>
          )}
        </div>
      )}

      {!hasMore && uniqueBlogs.length > 0 && (
        <div className="py-8 flex items-center justify-center">
          <div className="flex items-center gap-3 text-base-content/60">
            <span className="material-symbols-outlined text-lg">
              check_circle
            </span>
            <span className="font-medium">No more blogs to load</span>
          </div>
        </div>
      )}

      {status === "loading" && uniqueBlogs.length === 0 && <CircularLoader />}
    </div>
  );
};
