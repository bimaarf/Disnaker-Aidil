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
import { fetchBanks, resetBanks } from "../../../../features/bank/bankSlice";
import {
  handleDelete,
  handleDeleteData,
  handleEditData,
} from "./__actions/__bankAction";
import { BadgeBanks } from "./__badgeBanks";
import { TabsFilter } from "./__components/__tabs";
import BankList from "./__components/bankList";
import BankTable from "./__components/bankTable";
import useIsMobile from "../../../../Context/__useIsMobile";

export const BankPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const banks = useSelector((state) => state.banks.banks);
  const total = useSelector((state) => state.banks.total);
  const totalVisible = useSelector((state) => state.banks.totalVisible);
  const totalHidden = useSelector((state) => state.banks.totalHidden);
  const status = useSelector((state) => state.banks.status);
  const page = useSelector((state) => state.banks.page);
  const totalPages = useSelector((state) => state.banks.totalPages);

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

  const isMobile = useIsMobile();
  const isFetchingRef = useRef(false);

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchParams({ query, fromDate, toDate });
    dispatch(resetBanks());
    dispatch(
      fetchBanks({
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
    dispatch(resetBanks());
    dispatch(
      fetchBanks({
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
    if (currentPage === 1) {
      dispatch(
        fetchBanks({
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
    if (currentPage > 1) {
      dispatch(
        fetchBanks({
          page: currentPage,
          perPage: 10,
          searchQuery: searchParams.query,
          fromDate: searchParams.fromDate,
          toDate: searchParams.toDate,
          loadMore: true,
        })
      );
    }
  }, [dispatch, currentPage, searchParams]);

  const handleLoadMore = useCallback(() => {
    if (currentPage < totalPages && !isFetchingRef.current && !isLoadingMore) {
      isFetchingRef.current = true;
      setIsLoadingMore(true);
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages, isLoadingMore]);

  const handleScroll = useCallback(
    debounce(() => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 500
      ) {
        handleLoadMore();
      }
    }, 300),
    [handleLoadMore]
  );

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (status === "succeeded" && isLoadingMore) {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
    } else if (status === "failed") {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
      toast.error("Failed to load banks");
    }
  }, [status, isLoadingMore]);

  const requestSort = (key) => {
    const newDirection =
      sortConfig.key === key && sortConfig.direction === "desc"
        ? "asc"
        : "desc";
    const snapshot = [...banks];
    snapshot.sort((a, b) => {
      if (a[key] < b[key]) return newDirection === "asc" ? -1 : 1;
      if (a[key] > b[key]) return newDirection === "asc" ? 1 : -1;
      return 0;
    });
    setSortConfig({ key, direction: newDirection });
    setManualSortSnapshot(snapshot);
    setIsManualSortFrozen(true);
  };

  const sortedBanks = useMemo(() => {
    if (isManualSortFrozen) {
      const latestIds = new Set(manualSortSnapshot.map((item) => item.id));
      const newItems = banks.filter((item) => !latestIds.has(item.id));
      const combined = [...manualSortSnapshot, ...newItems];
      return combined;
    }

    let sortable = [...banks];
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
  }, [banks, sortConfig, isManualSortFrozen, manualSortSnapshot]);

  const uniqueBanks = useMemo(() => {
    const seen = new Set();
    return sortedBanks.filter((b) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    });
  }, [sortedBanks]);

  const handlePreviewData = (data) => {
    if (!data?.key || data.key === "undefined" || data.key.trim() === "") {
      console.error("Invalid bank key for preview:", data);
      toast.error("Cannot preview bank: Invalid bank key.");
      return;
    }
    navigate(`/bank/preview/${data.key}`, {
      state: { key: data.key, dataProps: data },
    });
  };

  const handleCreateNew = () => {
    navigate("/bank/create");
  };

  return (
    <div className="bg-base-100 border rounded-xl px-4 border-base-200 min-h-[90vh]">
      <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between p-4">
        <div className="flex gap-2 flex-wrap items-center w-full">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base-content/70">
              search
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border border-base-300 bg-base-100 dark:bg-base-300 dark:focus:bg-base-100 duration-300 focus:border-primary hover:border-primary cursor-pointer py-2 rounded pl-10 pr-3 outline-none w-full"
              placeholder="Search bank account..."
            />
          </div>
          <div className="md:flex md:space-y-0 space-y-2 items-center w-full max-w-md gap-2">
            <div className="flex items-center w-full gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border border-base-300 bg-base-100 dark:bg-base-300 dark:focus:bg-base-100 duration-300 focus:border-primary cursor-pointer p-2 rounded w-1/2 outline-none"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border border-base-300 bg-base-100 dark:bg-base-300 dark:focus:bg-base-100 duration-300 focus:border-primary cursor-pointer p-2 rounded w-1/2 outline-none"
              />
            </div>
            <div
              className={`flex items-center ${
                isMobile && "flex-row-reverse"
              } w-full gap-2`}>
              <button
                onClick={handleSearch}
                className="border border-base-300 bg-base-100 dark:bg-base-300 dark:active:bg-base-100 duration-300 hover:border-primary active:border-primary w-1/2 cursor-pointer py-[0.6em] px-4 rounded hover:bg-primary outline-none">
                Search
              </button>
              <button
                onClick={handleReset}
                className="border border-base-300 bg-base-100 dark:bg-base-300 dark:active:bg-base-100 duration-300 hover:border-primary active:border-primary w-1/2 cursor-pointer py-[0.6em] px-4 rounded hover:bg-primary outline-none">
                Reset
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <BadgeBanks
            totalVisible={totalVisible}
            totalHidden={totalHidden}
            badgeData={total}
          />
          <button
            onClick={handleCreateNew}
            className="btn btn-primary btn-sm text-white gap-2">
            <span className="material-symbols-outlined text-sm">add</span>
            New Bank
          </button>
        </div>
      </div>

      <TabsFilter isTab={isTab} setIsTab={setIsTab} />
      {!isTab ? (
        <BankList
          type="dash/bank"
          datas={uniqueBanks}
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
        <BankTable
          type="dash/bank"
          datas={uniqueBanks}
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

      {isLoadingMore || (status === "loading" && <CircularLoader />)}
    </div>
  );
};
