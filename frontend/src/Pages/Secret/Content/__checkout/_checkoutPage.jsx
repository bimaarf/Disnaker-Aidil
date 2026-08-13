import { debounce } from "lodash";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { formatDate } from "../../../../Context/__formatDate";
import { truncateText } from "../../../../Context/__useTruncate";
import {
  fetchCheckout,
  fetchCheckouts,
  resetCheckoutState,
  setViewMode,
  setSearchParams,
  clearSearchParams,
  deleteCheckout,
  deleteCheckouts,
} from "../../../../features/product/checkoutSlice";
import CheckoutList from "./__components/checkoutList";
import CheckoutTable from "./__components/checkoutTable";

export const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const checkouts = useSelector((state) => state.checkout.checkouts);
  const status = useSelector((state) => state.checkout.status);
  const page = useSelector((state) => state.checkout.pagination.current_page);
  const totalPages = useSelector(
    (state) => state.checkout.pagination.last_page
  );
  const searchParams = useSelector((state) => state.checkout.searchParams);
  const viewMode = useSelector((state) => state.checkout.viewMode);

  const [currentPage, setCurrentPage] = useState(page || 1);
  const [lastLoadedPage, setLastLoadedPage] = useState(0); // Track last successfully loaded page
  const [isUserTriggeredLoadMore, setIsUserTriggeredLoadMore] = useState(false); // Track if load more was user-triggered
  const [query, setQuery] = useState(searchParams.query || "");
  const [fromDate, setFromDate] = useState(searchParams.fromDate || "");
  const [toDate, setToDate] = useState(searchParams.toDate || "");
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [manualSortSnapshot, setManualSortSnapshot] = useState([]);
  const [isManualSortFrozen, setIsManualSortFrozen] = useState(false);
  const [selectedDatas, setSelectedDatas] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const isFetchingRef = useRef(false);

  const handleSetViewMode = (x) => {
    dispatch(setViewMode(x));
  };

  // Optimized search handler - reset pagination tracking
  const handleSearch = useCallback(() => {
    const newSearchParams = {
      query: query.trim(),
      fromDate: fromDate.trim(),
      toDate: toDate.trim(),
    };

    const hasNewFilters =
      newSearchParams.query !== searchParams.query ||
      newSearchParams.fromDate !== searchParams.fromDate ||
      newSearchParams.toDate !== searchParams.toDate;

    if (hasNewFilters) {
      // Update search params in Redux store
      dispatch(setSearchParams(newSearchParams));
      setCurrentPage(1);
      setLastLoadedPage(0); // Reset pagination tracking
      setIsUserTriggeredLoadMore(false); // Reset load more tracking
      dispatch(resetCheckoutState());

      // Always make request for search (don't block on idle)
      dispatch(
        fetchCheckouts({
          page: 1,
          perPage: 15,
          searchQuery: newSearchParams.query,
          fromDate: newSearchParams.fromDate,
          toDate: newSearchParams.toDate,
          loadMore: false,
        })
      );
    }
  }, [query, fromDate, toDate, searchParams, dispatch]);

  // Optimized reset handler - reset pagination tracking
  const handleReset = useCallback(() => {
    setQuery("");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
    setLastLoadedPage(0); // Reset pagination tracking
    setIsUserTriggeredLoadMore(false); // Reset load more tracking
    dispatch(clearSearchParams());
    dispatch(resetCheckoutState());

    // Always make request for reset (don't block on idle)
    dispatch(
      fetchCheckouts({
        page: 1,
        perPage: 15,
        searchQuery: "",
        fromDate: "",
        toDate: "",
        loadMore: false,
      })
    );
  }, [dispatch]);

  // Initial load effect - fetch data when status is 'idle'
  useEffect(() => {
    // Only fetch initial data when status is 'idle' and no data exists
    if (status === "idle" && checkouts.length === 0) {
      dispatch(
        fetchCheckouts({
          page: 1,
          perPage: 15,
          searchQuery: searchParams.query,
          fromDate: searchParams.fromDate,
          toDate: searchParams.toDate,
          loadMore: false,
        })
      );
    }
  }, [dispatch, searchParams, checkouts.length, status]);

  // Load more when page changes (separate effect for load more)
  useEffect(() => {
    // Only for load more with strict conditions:
    // 1. currentPage > 1 (not initial load)
    // 2. User triggered load more action
    // 3. Haven't loaded this page yet
    // 4. Status is succeeded and not currently loading
    // 5. Page exists (within totalPages)
    if (
      currentPage > 1 &&
      isUserTriggeredLoadMore && // Only if user explicitly triggered load more
      currentPage > lastLoadedPage && // Haven't loaded this page yet
      status === "succeeded" &&
      !isFetchingRef.current &&
      currentPage <= totalPages &&
      !isLoadingMore
    ) {
      isFetchingRef.current = true;
      setIsLoadingMore(true);
      dispatch(
        fetchCheckouts({
          page: currentPage,
          perPage: 15,
          searchQuery: searchParams.query,
          fromDate: searchParams.fromDate,
          toDate: searchParams.toDate,
          loadMore: true,
        })
      );
    }
  }, [
    currentPage,
    isUserTriggeredLoadMore,
    lastLoadedPage,
    searchParams,
    dispatch,
    status,
    totalPages,
    isLoadingMore,
  ]);

  // Optimized load more handler with tracking
  const handleLoadMore = useCallback(() => {
    if (
      currentPage < totalPages &&
      !isFetchingRef.current &&
      !isLoadingMore &&
      status === "succeeded"
    ) {
      setIsUserTriggeredLoadMore(true); // Mark as user-triggered
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages, isLoadingMore, status]);

  // Optimized scroll handler
  const handleScroll = useCallback(
    debounce(() => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 300
      ) {
        handleLoadMore();
      }
    }, 200),
    [handleLoadMore]
  );

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Optimized status effect with pagination tracking
  useEffect(() => {
    if (status === "succeeded" && isLoadingMore) {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
      setLastLoadedPage(currentPage); // Track successfully loaded page
      setIsUserTriggeredLoadMore(false); // Reset trigger flag
    } else if (status === "succeeded" && currentPage === 1 && !isLoadingMore) {
      // Initial load success
      setLastLoadedPage(1);
    } else if (status === "failed") {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
      setIsUserTriggeredLoadMore(false); // Reset trigger flag on error
      toast.error("Failed to load checkouts");
    }
  }, [status, isLoadingMore, currentPage]);

  // Optimized sort handler
  const requestSort = useCallback(
    (key) => {
      setSortConfig((prev) => {
        const newDirection =
          prev.key === key && prev.direction === "desc" ? "asc" : "desc";
        return { key, direction: newDirection };
      });

      const snapshot = [...checkouts];
      snapshot.sort((a, b) => {
        const direction =
          sortConfig.key === key && sortConfig.direction === "desc"
            ? "asc"
            : "desc";
        if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
        if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
        return 0;
      });

      setManualSortSnapshot(snapshot);
      setIsManualSortFrozen(true);
    },
    [checkouts, sortConfig]
  );

  // Optimized sorted checkouts memoization
  const sortedCheckouts = useMemo(() => {
    if (isManualSortFrozen && manualSortSnapshot.length > 0) {
      const latestIds = new Set(manualSortSnapshot.map((item) => item.id));
      const newItems = checkouts.filter((item) => !latestIds.has(item.id));
      return [...manualSortSnapshot, ...newItems];
    }

    if (!checkouts.length) return [];

    const sortable = [...checkouts];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key])
          return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key])
          return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [checkouts, sortConfig, isManualSortFrozen, manualSortSnapshot]);

  // Optimized unique checkouts memoization
  const uniqueCheckouts = useMemo(() => {
    if (!sortedCheckouts.length) return [];

    const seen = new Set();
    return sortedCheckouts.filter((checkout) => {
      const id = checkout.id || checkout.key;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [sortedCheckouts]);

  // Optimized preview handler
  const handlePreviewData = useCallback(
    (data) => {
      if (!data?.key || data.key === "undefined" || data.key.trim() === "") {
        toast.error("Cannot preview checkout: Invalid checkout key.");
        return;
      }

      dispatch(fetchCheckout(data.key))
        .then(() => {
          navigate(`/checkout/preview/${data.key}`, {
            state: { key: data.key, dataProps: data },
          });
        })
        .catch(() => {
          toast.error("Failed to load checkout data");
        });
    },
    [dispatch, navigate]
  );

  // Delete handlers
  const handleDelete = useCallback(async () => {
    if (selectedDatas.length === 0) return;

    if (
      window.confirm("Are you sure you want to delete the selected checkouts?")
    ) {
      try {
        await dispatch(deleteCheckouts(selectedDatas)).unwrap();
        setSelectedDatas([]);
        toast.success("Successfully deleted!");
      } catch (error) {
        toast.error(error?.message || "Failed to delete checkouts.");
      }
    }
  }, [dispatch, selectedDatas]);

  // Handle deleting a single data entry
  const handleDeleteData = useCallback(
    (dataKey) => {
      if (window.confirm("Are you sure you want to delete this checkout?")) {
        dispatch(deleteCheckout(dataKey))
          .unwrap()
          .then(() => {
            toast.success("Successfully deleted!");
          })
          .catch((error) => {
            if (error === "Session expired. Logging out...") {
              toast.error("Your session has expired. Logging out...");
            } else {
              toast.error("checkout can't be deleted.");
            }
          });
      }
    },
    [dispatch]
  );

  // Handle editing a data entry
  const handleEditData = useCallback(
    (data) => {
      navigate(`/checkout/update/${data.key}`, {
        state: { key: data.key, dataProps: data },
      });
    },
    [navigate]
  );

  // Keyboard shortcuts for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        handleSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSearch]);

  // Select all handler
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedDatas(uniqueCheckouts.map((checkout) => checkout.id));
    } else {
      setSelectedDatas([]);
    }
  };

  // Sync local state with Redux searchParams when component mounts
  useEffect(() => {
    setQuery(searchParams.query || "");
    setFromDate(searchParams.fromDate || "");
    setToDate(searchParams.toDate || "");
  }, [searchParams]);

  return (
    <div className="min-h-[90vh]">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-8 bg-base-100 dark:bg-base-200 p-4 rounded-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-base-content mb-2">
                Manajemen Checkout
              </h1>
              <p className="text-base-content/40 text-xs">
                Kelola semua checkout dengan mudah
              </p>
            </div>
            <div className="flex flex-wrap gap-3 mt-4 lg:mt-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-base-300 rounded-xl bg-base-100 dark:bg-base-300 text-base-content/80 hover:bg-base-200/50 transition-colors duration-200">
                <svg
                  className="w-4 h-4 mr-2 text-base-content/40"
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
              <div className="flex items-center bg-base-100 dark:bg-base-300 border border-base-300 rounded-xl overflow-hidden">
                <button
                  onClick={() => handleSetViewMode("table")}
                  className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    viewMode === "table"
                      ? "bg-primary text-white"
                      : "text-base-content/80 hover:text-base-content"
                  }`}>
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
                  onClick={() => handleSetViewMode("grid")}
                  className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    viewMode === "grid"
                      ? "bg-primary text-white"
                      : "text-base-content/80 hover:text-base-content"
                  }`}>
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

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-12 pr-10 py-4 bg-base-200/30 cursor-pointer focus:bg-base-300/30 dark:bg-base-300 dark:focus:bg-base-100 border border-base-300 rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80"
                placeholder="Cari checkout... (Enter untuk mencari)"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-base-content/40 hover:text-base-content/80">
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
            {showFilters && (
              <div className="bg-base-100 border border-base-200 rounded-2xl p-6 shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-base-content/80 mb-2">
                      Tanggal Dari
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full pl-12 pr-10 py-4 bg-base-200/80 border border-base-200 rounded-2xl shadow-sm outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-base-content/80 mb-2">
                      Tanggal Sampai
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full pl-12 pr-10 py-4 bg-base-200/80 border border-base-200 rounded-2xl shadow-sm outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80"
                    />
                  </div>

                  <div className="flex items-end gap-4">
                    <button
                      onClick={handleReset}
                      disabled={
                        status === "loading" || status === "loadingMore"
                      }
                      className="w-full px-4 py-5 bg-base-200 text-base-content/80 rounded-xl hover:bg-base-200/50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                      Reset Filter
                    </button>
                    <button
                      onClick={handleSearch}
                      disabled={
                        status === "loading" || status === "loadingMore"
                      }
                      className="w-full px-4 py-5 bg-primary text-white hover:brightness-90 rounded-xl hover:bg-primary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                      Search
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status indicator */}
          {status === "idle" && checkouts.length === 0 && (
            <div className="mt-4 p-3 bg-info/10 border border-info/20 rounded-xl">
              <p className="text-info/80 text-sm font-medium">
                💡 Sistem siap - loading data awal...
              </p>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedDatas.length > 0 && (
            <div className="mt-4 flex items-center justify-between bg-primary/5 border border-primary/10 p-4 rounded-2xl">
              <span className="text-primary/80 font-medium">
                {selectedDatas.length} checkout dipilih
              </span>
              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedDatas([])}
                  className="px-4 py-2 border border-base-200 bg-base-100 text-base-content/80 rounded-xl hover:bg-base-200/50 transition-colors duration-200">
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-error text-white rounded-xl hover:bg-error/90 transition-colors duration-200">
                  Hapus Terpilih
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-base-100 dark:bg-base-200 p-6 rounded-2xl shadow-sm border border-base-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-md md:text-2xl font-bold text-base-content/80">
                  {totalPages * 15}
                </div>
                <div className="text-base-content/40 text-sm">
                  Total Checkout
                </div>
              </div>
            </div>
          </div>
          <div className="bg-base-100 dark:bg-base-200 p-6 rounded-2xl shadow-sm border border-base-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-md md:text-2xl font-bold text-base-content/80">
                  {
                    uniqueCheckouts.filter((chk) => {
                      const today = new Date();
                      const chkDate = new Date(chk.created_at);
                      return chkDate.toDateString() === today.toDateString();
                    }).length
                  }
                </div>
                <div className="text-base-content/40 text-sm">Hari Ini</div>
              </div>
            </div>
          </div>
          <div className="bg-base-100 dark:bg-base-200 p-6 rounded-2xl shadow-sm border border-base-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-warning"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-md md:text-2xl font-bold text-base-content/80">
                  {
                    uniqueCheckouts.filter((chk) => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return new Date(chk.created_at) >= weekAgo;
                    }).length
                  }
                </div>
                <div className="text-base-content/40 text-sm">
                  7 Hari Terakhir
                </div>
              </div>
            </div>
          </div>
          <div className="bg-base-100 dark:bg-base-200 p-6 rounded-2xl shadow-sm border border-base-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div>
                <div className="text-md md:text-2xl font-bold text-base-content/80">
                  Rp{" "}
                  {uniqueCheckouts
                    .reduce((sum, chk) => sum + (chk.total_price || 0), 0)
                    .toLocaleString("id-ID")}
                </div>
                <div className="text-base-content/40 text-sm">Total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {status === "loading" && uniqueCheckouts.length === 0 && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-base-content/80 font-medium">
                Memuat data checkout...
              </p>
            </div>
          </div>
        )}

        {/* Checkout Content */}
        {viewMode === "grid" ? (
          <CheckoutList
            type="dash/checkout"
            datas={uniqueCheckouts}
            status={status}
            sortConfig={sortConfig}
            requestSort={requestSort}
            handlePreviewData={handlePreviewData}
            handleDeleteData={handleDeleteData}
            handleEditData={handleEditData}
            formatDate={formatDate}
            truncateTitle={truncateText}
            selectedDatas={selectedDatas}
            setSelectedDatas={setSelectedDatas}
          />
        ) : (
          <CheckoutTable
            type="dash/checkout"
            datas={uniqueCheckouts}
            status={status}
            sortConfig={sortConfig}
            requestSort={requestSort}
            handlePreviewData={handlePreviewData}
            handleDeleteData={handleDeleteData}
            handleEditData={handleEditData}
            formatDate={formatDate}
            truncateTitle={truncateText}
            selectedDatas={selectedDatas}
            setSelectedDatas={setSelectedDatas}
            handleSelectAll={handleSelectAll}
          />
        )}

        {/* Load More Button */}
        {currentPage < totalPages && status === "succeeded" && (
          <div className="mt-8 text-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore || status === "loading"}
              className="px-8 py-3 bg-gradient-to-r from-primary to-blue-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoadingMore ? "Memuat..." : "Muat Lebih Banyak"}
            </button>
          </div>
        )}

        {/* Empty State */}
        {uniqueCheckouts.length === 0 &&
          status !== "loading" &&
          status !== "idle" && (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-base-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-12 h-12 text-base-content/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-base-content/80 mb-2">
                {searchParams.query ||
                searchParams.fromDate ||
                searchParams.toDate
                  ? "Tidak ada checkout yang sesuai"
                  : "Belum ada checkout"}
              </h3>
              <p className="text-base-content/40 mb-6">
                {searchParams.query ||
                searchParams.fromDate ||
                searchParams.toDate
                  ? "Coba ubah kata kunci pencarian atau filter Anda."
                  : "Checkout akan muncul di sini setelah ada transaksi."}
              </p>
              {(searchParams.query ||
                searchParams.fromDate ||
                searchParams.toDate) && (
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-gradient-to-r from-primary to-blue-700 text-white rounded-xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 font-medium">
                  Reset Pencarian & Filter
                </button>
              )}
            </div>
          )}

        {/* Initial Loading State */}
        {status === "idle" && uniqueCheckouts.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-base-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-semibold text-base-content/80 mb-2">
              Memuat Data Awal
            </h3>
            <p className="text-base-content/40 mb-6">
              Sedang mengambil data checkout...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
