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
import useIsMobile from "../../../../Context/__useIsMobile";
import { truncateText } from "../../../../Context/__useTruncate";
import {
  deleteDeposit,
  deleteDeposits,
  fetchDeposits,
} from "../../../../features/deposits/depositSlice";
import { DepositModal } from "../__dashboard/__components/__modalDeposit";
import DepositList from "./__app/__depositList";
import DepositTable from "./__app/__depositTable";
import { DepositPreview } from "./__app/_depositPreviewModal";
import { CircularLoader } from "../../../../Components/_CircularLoader";

export const DepositPage = () => {
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const datas = useSelector((state) => state.deposits.deposits);
  const status = useSelector((state) => state.deposits.status);
  const page = useSelector((state) => state.deposits.page);
  const totalPages = useSelector((state) => state.deposits.totalPages);
  const [selectedData, setSelectedData] = useState(null);
  const [currentPage, setCurrentPage] = useState(page || 1);
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "asc", // Default sort direction is descending for most recent datas first
  });
  const [selectedDatas, setSelectedDatas] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const navigate = useNavigate();
  const isFetchingRef = useRef(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleDeposit = () => {
    if (isMobile) {
      navigate("/deposit/request");
    } else {
      setModalOpen(true);
    }
  };

  useEffect(() => {
    dispatch(
      fetchDeposits({ page: currentPage, perPage: 10, sort: sortConfig })
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
    navigate(`/deposit/preview/${data.key}`, { state: { data } });
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
          ? "desc"
          : "asc",
    }));
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete the selected datas?")) {
      try {
        await dispatch(deleteDeposits(selectedDatas)).unwrap();
        setSelectedDatas([]);
        toast.success("Successfully deleted!");
      } catch (error) {
        toast.error("Failed to delete datas.");
      }
    }
  };

  const handleDeleteData = (dispatch, depositKey) => {
    if (window.confirm("Are you sure you want to delete this data?")) {
      dispatch(deleteDeposit(depositKey))
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
    <div className="lg:flex items-start gap-2">
      <button
        className="btn rounded-full fixed flex items-center bottom-20 z-50 right-0 lg:hidden"
        onClick={handleDeposit}>
        <span>Deposit Now</span>
        <span className="material-symbols-outlined text-md">
          currency_exchange
        </span>
      </button>
      <div className="w-full">
        {!isMobile ? (
          <DepositTable
            type="deposit"
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
          <DepositList
            type="deposit"
            datas={uniqueDatas}
            status={status}
            sortConfig={sortConfig}
            requestSort={requestSort}
            handlePreviewData={handlePreviewData}
            formatDate={formatDate}
            selectedDatas={selectedDatas}
            setSelectedDatas={setSelectedDatas}
            truncateTitle={truncateText}
            handleDeleteData={(depositKey) =>
              handleDeleteData(dispatch, depositKey)
            }
            handleDelete={() =>
              handleDelete(dispatch, selectedDatas, setSelectedDatas)
            }
          />
        )}

        {/* <div id="load-more-trigger" style={{ height: 1 }} /> */}
      {isLoadingMore ? (
          <CircularLoader />
        ) : (
          currentPage < totalPages &&
          status !== "loading" && (
            <div className="flex justify-center md:w-11/12">
              <button
                onClick={handleLoadMore}
                className="px-4 py-1 rounded bg-base-200 mt-4">
                Load Mores
              </button>
            </div>
          )
        )}
      </div>
      {modalOpen && <DepositModal onClose={() => setModalOpen(false)} />}

   
      {selectedData && (
        <DepositPreview
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
