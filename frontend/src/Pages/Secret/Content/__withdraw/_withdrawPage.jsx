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
import useIsMobile from "../../../../Context/__useIsMobile";
import { truncateText } from "../../../../Context/__useTruncate";
import {
  createWithdraw,
  deleteWithdraw,
  deleteWithdraws,
  fetchWithdraws,
} from "../../../../features/withdraws/withdrawSlice";
import WithdrawList from "./__app/__withdrawList";
import WithdrawTable from "./__app/__withdrawTable";
import { WithdrawPreview } from "./__app/_withdrawPreviewModal";
import { WithdrawForm } from "./__withdrawForm";

export const WithdrawPage = () => {
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const datas = useSelector((state) => state.withdraws.withdraws);
  const status = useSelector((state) => state.withdraws.status);
  const page = useSelector((state) => state.withdraws.page);
  const totalPages = useSelector((state) => state.withdraws.totalPages);

  const [selectedData, setSelectedData] = useState(null);
  const [currentPage, setCurrentPage] = useState(page || 1);
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "asc",
  });
  const [selectedDatas, setSelectedDatas] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const navigate = useNavigate();
  const isFetchingRef = useRef(false);

  useEffect(() => {
    dispatch(
      fetchWithdraws({ page: currentPage, perPage: 10, sort: sortConfig })
    )
      .unwrap()
      .catch((error) => console.error("Failed to fetch datas:", error));
  }, [dispatch, currentPage, sortConfig]);

  useEffect(() => {
    if (status === "succeeded" && isLoadingMore) {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    } else if (status === "failed") {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [status, isLoadingMore]);

  const handleAddData = async (newData) => {
    try {
      await dispatch(createWithdraw(newData)).unwrap();
      toast.success("Data added successfully!");
    } catch (error) {
      toast.error("Failed to add data.");
    }
  };

  const handleLoadMore = useCallback(() => {
    if (currentPage < totalPages && !isFetchingRef.current && !isLoadingMore) {
      setIsLoadingMore(true);
      setCurrentPage((prevPage) => prevPage + 1);
    }
  }, [currentPage, totalPages, isLoadingMore]);

  const handleScroll = useCallback(
    debounce(() => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 300
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

  const handlePreviewData = (data) => {
    setSelectedData(data);
    navigate(`/withdraw/preview/${data.key}`, { state: { data } });
  };

  const sortedDatas = useMemo(() => {
    let sortableDatas = [...datas];
    if (sortConfig.key) {
      sortableDatas.sort((a, b) => {
        const getValue = (item, key) => {
          const keys = key.split(".");
          return keys.reduce((acc, k) => acc && acc[k], item);
        };

        const aValue = getValue(a, sortConfig.key);
        const bValue = getValue(b, sortConfig.key);

        if (aValue < bValue) {
          return sortConfig.direction === "desc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "desc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableDatas;
  }, [datas, sortConfig]);

  const requestSort = (key) => {
    setSortConfig((prevSortConfig) => ({
      key,
      direction:
        prevSortConfig.key === key && prevSortConfig.direction === "desc"
          ? "asc"
          : "desc",
    }));
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete the selected datas?")) {
      try {
        await dispatch(deleteWithdraws(selectedDatas)).unwrap();
        setSelectedDatas([]);
        toast.success("Successfully deleted!");
      } catch (error) {
        toast.error("Failed to delete datas.");
      }
    }
  };

  const handleDeleteData = (dispatch, withdrawKey) => {
    if (window.confirm("Are you sure you want to delete this data?")) {
      dispatch(deleteWithdraw(withdrawKey))
        .unwrap()
        .then(() => {
          toast.success("Successfully deleted!");
        })
        .catch((error) => {
          if (error === "Session expired. Logging out...") {
            toast.error("Your session has expired. Logging out...");
          } else {
            toast.error(error?.message || "Failed to delete data.");
          }
        });
    }
  };

  const uniqueDatas = useMemo(() => {
    const seen = {};
    return sortedDatas.filter((data) => {
      if (seen[data.key]) {
        return false;
      }
      seen[data.key] = true;
      return true;
    });
  }, [sortedDatas]);
  return (
    <div className="grid xl:grid-cols-7 items-start gap-2">
      <button
        className="btn rounded-full fixed flex items-center bottom-20 z-50 right-0 lg:hidden"
        onClick={() => navigate("/withdraw/request")}>
        <span>Withdraw Now</span>
        <span className="material-symbols-outlined text-md">
          currency_exchange
        </span>
      </button>
      <div className="xl:col-span-5 rounded-lg shadow-md">
        {!isMobile ? (
          <WithdrawTable
            type="withdraw"
            datas={uniqueDatas}
            status={status}
            sortConfig={sortConfig}
            requestSort={requestSort}
            handlePreviewData={handlePreviewData}
            formatDate={formatDate}
            truncateTitle={truncateText}
            selectedDatas={selectedDatas}
            setSelectedDatas={setSelectedDatas}
            handleDeleteData={(dataId) => handleDeleteData(dispatch, dataId)} // Pass dispatch to action
            handleDelete={() =>
              handleDelete(dispatch, selectedDatas, setSelectedDatas)
            }
          />
        ) : (
          <WithdrawList
            type="withdraw"
            datas={uniqueDatas}
            status={status}
            sortConfig={sortConfig}
            requestSort={requestSort}
            handlePreviewData={handlePreviewData}
            formatDate={formatDate}
            selectedDatas={selectedDatas}
            setSelectedDatas={setSelectedDatas}
            truncateTitle={truncateText}
            handleDeleteData={(withdrawKey) =>
              handleDeleteData(dispatch, withdrawKey)
            }
            handleDelete={() =>
              handleDelete(dispatch, selectedDatas, setSelectedDatas)
            }
          />
        )}

        {/* <div id="load-more-trigger" style={{ height: 1 }} /> */}
      </div>
      <div className="xl:col-span-2 hidden lg:block select-none">
        <WithdrawForm onAddData={handleAddData} />
      </div>
      
      {isLoadingMore && <CircularLoader />}
      
      {selectedData && (
        <WithdrawPreview
          selectedData={selectedData}
          onClose={() => {
            setSelectedData(null);
            document.body.style.overflow = "auto";
          }}
        />
      )}
    </div>
  );
};
