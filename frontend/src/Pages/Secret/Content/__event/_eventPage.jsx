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
import { CircularLoader } from "../../../../Components/_CircularLoader";
import { formatDate } from "../../../../Context/__formatDate";
import { truncateText } from "../../../../Context/__useTruncate";
import { fetchEvents, resetEvents } from "../../../../features/event/eventSlice";
import {
  handleDelete,
  handleDeleteData,
  handleEditData,
} from "./__actions/__eventAction";
import { BadgeEvents } from "./__badgeEvents";
import { TabsFilter } from "./__components/__tabs";
import EventList from "./__components/eventList";
import EventTable from "./__components/eventTable";
import { getCachedEvents } from "../../../../features/event/eventSlice";

export const EventPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const events = useSelector((state) => state.events.events);
  const total = useSelector((state) => state.events.total);
  const totalVisible = useSelector((state) => state.events.totalVisible);
  const totalHidden = useSelector((state) => state.events.totalHidden);
  const status = useSelector((state) => state.events.status);
  const page = useSelector((state) => state.events.page);
  const totalPages = useSelector((state) => state.events.totalPages);
  const user = useSelector((state) => state.auth.user);

  const [currentPage, setCurrentPage] = useState(page || 1);
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [manualSortSnapshot, setManualSortSnapshot] = useState([]);
  const [isManualSortFrozen, setIsManualSortFrozen] = useState(false);
  const [selectedDatas, setSelectedDatas] = useState([]);
  const [isTab, setIsTab] = useState("table");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchParams, setSearchParams] = useState({
    query: "",
    fromDate: "",
    toDate: "",
  });

  const isFetchingRef = useRef(false);

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchParams({ query, fromDate, toDate });
    dispatch(resetEvents());
    dispatch(
      fetchEvents({
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
    setCurrentPage(1);
    setSearchParams({ query: "", fromDate: "", toDate: "" });
    dispatch(resetEvents());
    dispatch(
      fetchEvents({
        page: 1,
        perPage: 10,
        searchQuery: "",
        fromDate: "",
        toDate: "",
        loadMore: false,
      })
    );
  };

  // Initial load and search parameter changes
  useEffect(() => {
    console.log("EventPage: User state:", user);
    console.log("EventPage: Fetching events with params:", {
      page: currentPage,
      perPage: 10,
      searchQuery: searchParams.query,
      fromDate: searchParams.fromDate,
      toDate: searchParams.toDate,
    });

    if (currentPage === 1) {
      dispatch(
        fetchEvents({
          page: currentPage,
          perPage: 10,
          searchQuery: searchParams.query,
          fromDate: searchParams.fromDate,
          toDate: searchParams.toDate,
          loadMore: false,
        })
      );
    }
  }, [dispatch, searchParams]);

  // Load more when currentPage changes (but not on first page)
  useEffect(() => {
    if (
      currentPage > 1 &&
      !isLoadingMore &&
      !isFetchingRef.current &&
      currentPage <= totalPages
    ) {
      const cacheKey = `events_page_${currentPage}_per_10_q_${searchParams.query}_from_${searchParams.fromDate}_to_${searchParams.toDate}`;
      const cachedData = getCachedEvents(cacheKey);

      const eventsForPage = events.filter((event) => event.page === currentPage);
      if (
        eventsForPage.length > 0 ||
        (cachedData && cachedData.data.length > 0)
      ) {
        console.log(
          `Serving page ${currentPage} from ${
            eventsForPage.length > 0 ? "state" : "cache"
          }`
        );
        if (
          cachedData &&
          cachedData.data.length > 0 &&
          eventsForPage.length === 0
        ) {
          dispatch({
            type: "events/fetchEvents/fulfilled",
            payload: { ...cachedData, isFromCache: true },
          });
        }
        isFetchingRef.current = false;
        setIsLoadingMore(false);
        return;
      }

      console.log("Loading more events for page:", currentPage);
      isFetchingRef.current = true;
      setIsLoadingMore(true);
      dispatch(
        fetchEvents({
          page: currentPage,
          perPage: 10,
          searchQuery: searchParams.query,
          fromDate: searchParams.fromDate,
          toDate: searchParams.toDate,
          loadMore: true,
        })
      );
    }
  }, [dispatch, currentPage, searchParams, events, isLoadingMore, totalPages]);

  // Debounced handleLoadMore to prevent multiple rapid calls
  const handleLoadMore = useCallback(
    debounce(() => {
      if (currentPage >= totalPages || isFetchingRef.current || isLoadingMore) {
        console.log(
          "handleLoadMore: Stopped - at last page or already fetching"
        );
        return;
      }

      const cacheKey = `events_page_${currentPage + 1}_per_10_q_${
        searchParams.query
      }_from_${searchParams.fromDate}_to_${searchParams.toDate}`;
      const cachedData = getCachedEvents(cacheKey);
      const eventsForNextPage = events.filter(
        (event) => event.page === currentPage + 1
      );

      if (
        eventsForNextPage.length > 0 ||
        (cachedData && cachedData.data.length > 0)
      ) {
        console.log(
          `Data for page ${currentPage + 1} already available, skipping fetch`
        );
        if (
          cachedData &&
          cachedData.data.length > 0 &&
          eventsForNextPage.length === 0
        ) {
          dispatch({
            type: "events/fetchEvents/fulfilled",
            payload: { ...cachedData, isFromCache: true },
          });
        }
        setCurrentPage((prev) => prev + 1);
        return;
      }

      console.log("handleLoadMore: Loading page", currentPage + 1);
      isFetchingRef.current = true;
      setIsLoadingMore(true);
      dispatch(
        fetchEvents({
          page: currentPage + 1,
          perPage: 10,
          searchQuery: searchParams.query,
          fromDate: searchParams.fromDate,
          toDate: searchParams.toDate,
          loadMore: true,
        })
      );
    }, 300),
    [currentPage, totalPages, isLoadingMore, searchParams, events, dispatch]
  );

  // Handle scroll with last page check
  const handleScroll = useCallback(() => {
    if (currentPage >= totalPages) {
      console.log("handleScroll: Reached last page, no more loading");
      return;
    }
    if (
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 500
    ) {
      handleLoadMore();
    }
  }, [currentPage, totalPages, handleLoadMore]);

  // Manage scroll event listener
  useEffect(() => {
    if (currentPage >= totalPages) {
      console.log("Removing scroll listener: Reached last page");
      window.removeEventListener("scroll", handleScroll);
      return;
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll, currentPage, totalPages]);

  // Handle fetchEvents fulfillment and edge cases
  useEffect(() => {
    if (status === "succeeded" && isLoadingMore) {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
      // Check for empty data or current_page > last_page
      const lastResponse =
        events.length > 0 ? events[events.length - 1].page : currentPage;
      if (
        lastResponse > totalPages ||
        events.filter((event) => event.page === currentPage).length === 0
      ) {
        console.log("No more data or invalid page, stopping loadMore");
        setCurrentPage(totalPages);
      } else {
        setCurrentPage((prev) => prev + 1);
      }
    } else if (status === "failed") {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
      toast.error("Failed to load events");
    }
  }, [status, isLoadingMore, events, totalPages, currentPage]);

  useEffect(() => {
    console.log("EventPage: Events in state:", events);
  }, [events]);

  const requestSort = (key) => {
    const newDirection =
      sortConfig.key === key && sortConfig.direction === "desc"
        ? "asc"
        : "desc";
    const snapshot = [...events];
    snapshot.sort((a, b) => {
      if (a[key] < b[key]) return newDirection === "asc" ? -1 : 1;
      if (a[key] > b[key]) return newDirection === "asc" ? 1 : -1;
      return 0;
    });
    setSortConfig({ key, direction: newDirection });
    setManualSortSnapshot(snapshot);
    setIsManualSortFrozen(true);
  };

  const sortedEvents = useMemo(() => {
    if (isManualSortFrozen) {
      const latestIds = new Set(manualSortSnapshot.map((item) => item.id));
      const newItems = events.filter((item) => !latestIds.has(item.id));
      const combined = [...manualSortSnapshot, ...newItems];
      return combined;
    }

    let sortable = [...events];
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
  }, [events, sortConfig, isManualSortFrozen, manualSortSnapshot]);

  const uniqueEvents = useMemo(() => {
    const seen = new Set();
    return sortedEvents.filter((b) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    });
  }, [sortedEvents]);

  const handlePreviewData = (data) => {
    if (!data?.key || data.key === "undefined" || data.key.trim() === "") {
      console.error("Invalid event key for preview:", data);
      toast.error("Cannot preview event: Invalid event key.");
      return;
    }
    console.log("Navigating to preview with key:", data.key);
    navigate(`/event/preview/${data.key}`, {
      state: { key: data.key, dataProps: data },
    });
  };

  return (
    <div className="space-y-6 min-h-[90vh] overflow-hidden">
      <div className="bg-base-100 dark:bg-base-200 border-2 border-base-200/30 rounded-3xl backdrop-blur-sm p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start md:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-primary">
                  article
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-base-content">
                  Event Management
                </h1>
                <p className="text-base-content/60">
                  Manage your event posts and content
                </p>
              </div>
            </div>
            <div className="hidden md:block">
              <BadgeEvents
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
                  className="w-full pl-12 pr-4 py-3 bg-base-200 dark:bg-base-300 rounded-2xl border focus:border-primary borderoutline-none transition-all duration-300 placeholder:text-base-content/50 hover:border-base-300"
                  placeholder="Search event posts..."
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
                  className="w-full p-3 bg-base-200 dark:bg-base-300 rounded-2xl border focus:border-primary outline-none transition-all duration-300 hover:border-base-300"
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
                  className="w-full p-3 bg-base-200 dark:bg-base-300 rounded-2xl border focus:border-primary outline-none transition-all duration-300 hover:border-base-300"
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
          <EventList
            type="dash/event"
            datas={uniqueEvents}
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
          <EventTable
            type="dash/event"
            datas={uniqueEvents}
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

      {isLoadingMore && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-primary/90 backdrop-blur-sm text-primary-content px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <div className="loading loading-spinner loading-sm"></div>
            <span className="font-medium">Loading more...</span>
          </div>
        </div>
      )}

      {currentPage < totalPages && (
        <div className="py-8 flex items-center justify-center">
          <div className="flex items-center gap-3 text-base-content/60">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg text-primary animate-pulse">
                more_horiz
              </span>
            </div>
            <span className="font-medium">Scroll for more content</span>
          </div>
        </div>
      )}

      {status === "loading" && !isLoadingMore && <CircularLoader />}
    </div>
  );
};
