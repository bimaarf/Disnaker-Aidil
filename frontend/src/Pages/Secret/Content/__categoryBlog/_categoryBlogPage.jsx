import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CircularLoader } from "../../../../Components/_CircularLoader";
import { formatDate } from "../../../../Context/__formatDate";
import useIsMobile from "../../../../Context/__useIsMobile";
import { truncateText } from "../../../../Context/__useTruncate";
import {
  handleDelete,
  handleDeleteData,
  handleEditData,
} from "./__actions/__categoryBlogAction";
import CategoryBlogList from "./__components/_categoryBlogList";
import CategoryBlogTable from "./__components/_categoryBlogTable";
import {
  fetchCategoryBlogs,
  resetCategoryBlogs,
} from "../../../../features/blog/categoryBlogSlice";

export const CategoryBlogPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux State
  const datas = useSelector((state) => state.categoryBlogs.categoryBlogs);
  const total = useSelector((state) => state.categoryBlogs.total);
  const status = useSelector((state) => state.categoryBlogs.status);
  const currentPageFromStore = useSelector((state) => state.categoryBlogs.page);
  const totalPages = useSelector((state) => state.categoryBlogs.totalPages);

  const isMobile = useIsMobile();

  // Local State - Restore from sessionStorage if available
  const [query, setQuery] = useState(() => {
    return sessionStorage.getItem("categoryBlogPage_query") || "";
  });
  const [sortConfig, setSortConfig] = useState(() => {
    const saved = sessionStorage.getItem("categoryBlogPage_sortConfig");
    return saved ? JSON.parse(saved) : { key: "created_at", direction: "desc" };
  });
  const [selectedDatas, setSelectedDatas] = useState([]);
  const [isTab, setIsTab] = useState(() => {
    return (
      sessionStorage.getItem("categoryBlogPage_isTab") ||
      (isMobile ? "list" : "table")
    );
  });
  const [searchParams, setSearchParams] = useState(() => {
    const saved = sessionStorage.getItem("categoryBlogPage_searchParams");
    return saved ? JSON.parse(saved) : { query: "" };
  });

  // Refs
  const isFetchingRef = useRef(false);
  const observerRef = useRef(null);
  const loadMoreTriggerRef = useRef(null);
  const hasInitialFetchRef = useRef(false);

  // ============================================
  // STATE PERSISTENCE
  // ============================================
  useEffect(() => {
    sessionStorage.setItem("categoryBlogPage_query", query);
  }, [query]);

  useEffect(() => {
    sessionStorage.setItem(
      "categoryBlogPage_sortConfig",
      JSON.stringify(sortConfig)
    );
  }, [sortConfig]);

  useEffect(() => {
    sessionStorage.setItem("categoryBlogPage_isTab", isTab);
  }, [isTab]);

  useEffect(() => {
    sessionStorage.setItem(
      "categoryBlogPage_searchParams",
      JSON.stringify(searchParams)
    );
  }, [searchParams]);

  // ============================================
  // SEARCH & FILTER HANDLERS
  // ============================================
  const handleSearch = () => {
    setSearchParams({ query });
    dispatch(resetCategoryBlogs());
    isFetchingRef.current = false;
    hasInitialFetchRef.current = false; 

    dispatch(
      fetchCategoryBlogs({
        page: 1,
        perPage: 10,
        searchQuery: query,
        loadMore: false,
      })
    );
  };

  const handleReset = () => {
    setQuery("");
    setSearchParams({ query: "" });
    dispatch(resetCategoryBlogs());
    isFetchingRef.current = false;
    hasInitialFetchRef.current = false;

    dispatch(
      fetchCategoryBlogs({
        page: 1,
        perPage: 10,
        searchQuery: "",
        loadMore: false,
      })
    );
  };

  // ============================================
  // INITIAL DATA LOADING
  // ============================================
  useEffect(() => {
    if (hasInitialFetchRef.current) {
      return;
    }

    if (datas.length === 0 && status === "idle") {
      hasInitialFetchRef.current = true;
      isFetchingRef.current = false;

      dispatch(
        fetchCategoryBlogs({
          page: 1,
          perPage: 10,
          searchQuery: searchParams.query,
          loadMore: false,
        })
      );
    }
  }, []); 

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
          fetchCategoryBlogs({
            page: currentPageFromStore + 1,
            perPage: 10,
            searchQuery: searchParams.query,
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
  }, [dispatch, currentPageFromStore, totalPages, status, searchParams.query]);

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

  const sortedDatas = useMemo(() => {
    let sortable = [...datas];

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
  }, [datas, sortConfig]);

  const uniqueDatas = useMemo(() => {
    // Deduplicate by ID to prevent double data
    const seen = new Map();
    return sortedDatas.filter((data) => {
      if (seen.has(data.id)) {
        return false;
      }
      seen.set(data.id, true);
      return true;
    });
  }, [sortedDatas]);

  const truncateTitle = truncateText;
  const hasMore = currentPageFromStore < totalPages;

  return (
    <div className="min-h-[90vh] overflow-hidden">
      {/* Floating Action Button */}
      <div
        className="fixed bottom-20 md:bottom-10 z-50 right-4 md:right-10 cursor-pointer group"
        onClick={() => navigate("/category/blog/create")}>
        <div className="rounded-full bg-primary hover:bg-primary/90 hover:scale-110 active:scale-95 duration-300 p-4 flex justify-center items-center shadow-lg group-hover:shadow-xl transition-all">
          <span className="material-symbols-outlined text-primary-content text-2xl">
            add
          </span>
        </div>
      </div>

      {/* Header Section */}
      <div className="bg-base-100 dark:bg-base-200 border-2 border-base-200/30 rounded-3xl backdrop-blur-sm p-6">
        <div className="space-y-6">
          {/* Title & Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-start md:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-primary">
                  category
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-base-content">
                  Category Management
                </h1>
                <p className="text-base-content/60">
                  Manage your blog categories
                  {datas.length > 0 && (
                    <span className="ml-2 text-xs">
                      ({datas.length} of {total} loaded)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-9">
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
                  placeholder="Search categories..."
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

          {/* Active Filters */}
          {query && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-base-200/50">
              <span className="text-sm font-medium text-base-content/70">
                Active filters:
              </span>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                <span className="material-symbols-outlined text-xs">
                  search
                </span>
                <span>{`"${query}"`}</span>
                <button
                  onClick={() => {
                    setQuery("");
                    handleReset();
                  }}
                  className="hover:bg-primary/20 rounded-full p-0.5 transition-colors duration-200">
                  <span className="material-symbols-outlined text-xs">
                    close
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* View Toggle Tabs */}
        {isMobile && (
          <div className="px-6 pt-6">
            <div className="flex gap-2 p-1 bg-base-200 rounded-xl w-fit">
              <button
                onClick={() => setIsTab("table")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isTab === "table"
                    ? "bg-primary text-primary-content shadow-md"
                    : "text-base-content/70 hover:bg-base-300"
                }`}>
                <span className="material-symbols-outlined text-lg">
                  table_rows
                </span>
                <span className="hidden sm:inline">Table View</span>
              </button>
              <button
                onClick={() => setIsTab("list")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isTab === "list"
                    ? "bg-primary text-primary-content shadow-md"
                    : "text-base-content/70 hover:bg-base-300"
                }`}>
                <span className="material-symbols-outlined text-lg">
                  view_list
                </span>
                <span className="hidden sm:inline">List View</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div>
        {isTab === "table" ? (
          <CategoryBlogTable
            datas={uniqueDatas}
            status={status}
            sortConfig={sortConfig}
            requestSort={requestSort}
            formatDate={formatDate}
            truncateTitle={truncateTitle}
            selectedDatas={selectedDatas}
            setSelectedDatas={setSelectedDatas}
            handleEditData={(data) => handleEditData(navigate, data)}
            handleDeleteData={(dataId) => handleDeleteData(dispatch, dataId)}
            handleDelete={() =>
              handleDelete(dispatch, selectedDatas, setSelectedDatas)
            }
          />
        ) : (
          <CategoryBlogList
            datas={uniqueDatas}
            status={status}
            sortConfig={sortConfig}
            requestSort={requestSort}
            formatDate={formatDate}
            truncateTitle={truncateTitle}
            selectedDatas={selectedDatas}
            setSelectedDatas={setSelectedDatas}
            handleEditData={(data) => handleEditData(navigate, data)}
            handleDeleteData={(dataId) => handleDeleteData(dispatch, dataId)}
            handleDelete={() =>
              handleDelete(dispatch, selectedDatas, setSelectedDatas)
            }
          />
        )}
      </div>

      {/* Load More Indicator */}
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

      {/* End of List */}
      {!hasMore && uniqueDatas.length > 0 && (
        <div className="py-8 flex items-center justify-center">
          <div className="flex items-center gap-3 text-base-content/60">
            <span className="material-symbols-outlined text-lg">
              check_circle
            </span>
            <span className="font-medium">No more categories to load</span>
          </div>
        </div>
      )}

      {/* Initial Loading */}
      {status === "loading" && uniqueDatas.length === 0 && <CircularLoader />}
    </div>
  );
};
