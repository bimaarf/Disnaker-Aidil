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
import { CircularLoader } from "../../../../Components/_CircularLoader";
import { formatDate } from "../../../../Context/__formatDate";
import useIsMobile from "../../../../Context/__useIsMobile";
import { truncateText } from "../../../../Context/__useTruncate";
import { fetchPayments } from "../../../../features/payments/paymentSlice";
import GeneralList from "../../Components/__generalList";
import GeneralTable from "../../Components/__generalTable";
import {
  handleDelete,
  handleDeleteData,
  handleEditData,
} from "./__actions/__paymentAction"; // Import the actions
import { PaymentModal } from "./__app/_paymentPreviewModal";
import PaymentPreviewPage from "./__app/_paymentPreviewPage";
import { BadgePayments } from "./__badgePayment";

export const PaymentPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const datas = useSelector((state) => state.payments.payments);
  const total = useSelector((state) => state.payments.total);
  const status = useSelector((state) => state.payments.status);
  const page = useSelector((state) => state.payments.page);
  const totalPages = useSelector((state) => state.payments.totalPages);
  const totalVisible = useSelector((state) => state.payments.totalVisible);
  const totalHidden = useSelector((state) => state.payments.totalHidden);

  const [selectedData, setSelectedData] = useState(null);
  const [currentPage, setCurrentPage] = useState(page || 1);
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [selectedDatas, setSelectedDatas] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFetchingRef = useRef(false);

  const isMobile = useIsMobile(); // Use the custom hook

  useEffect(() => {
    dispatch(fetchPayments({ page: currentPage, perPage: 10 }))
      .unwrap()
      .catch((error) => console.error("Failed to fetch datas:", error));
  }, [dispatch, currentPage]);

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
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    } else if (status === "failed") {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [status, isLoadingMore]);

  const handlePreviewData = (data) => {
    setSelectedData(data);
    if (!isMobile) {
      const modal = document.getElementById(`modal-${data.id}`);
      if (modal) {
        modal.showModal();
      }
    } else {
      navigate(`/payments/preview/${data.key}`);
    }
  };

  const sortedDatas = useMemo(() => {
    let sortableDatas = [...datas];
    if (sortConfig.key) {
      sortableDatas.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
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

  const uniqueDatas = useMemo(() => {
    const seen = {};
    return sortedDatas.filter((data) => {
      if (seen[data.id]) {
        return false;
      }
      seen[data.id] = true;
      return true;
    });
  }, [sortedDatas]);

  const truncateTitle = truncateText;

  return (
    <div>
      <div
        className="fixed bottom-20 md:bottom-10 z-50 right-4 md:right-10 cursor-pointer"
        onClick={() => navigate("/payments/create")}>
        <div className="rounded-full hover:brightness-110 scale-150 active:scale-125 duration-300 bg-base-300 p-1.5 flex justify-center items-center">
          <span className="material-symbols-outlined">add</span>
        </div>
      </div>
      <BadgePayments
        totalVisible={totalVisible}
        totalHidden={totalHidden}
        badgeData={total}
      />
      <>
        {!isMobile ? (
          <GeneralTable
            type="payment"
            datas={uniqueDatas}
            status={status}
            sortConfig={sortConfig}
            requestSort={requestSort}
            handlePreviewData={handlePreviewData}
            formatDate={formatDate}
            truncateTitle={truncateTitle}
            selectedDatas={selectedDatas}
            setSelectedDatas={setSelectedDatas}
            handleEditData={(data) => handleEditData(navigate, data)}
            handleDeleteData={(dataId) => handleDeleteData(dispatch, dataId)} // Pass dispatch to action
            handleDelete={() =>
              handleDelete(dispatch, selectedDatas, setSelectedDatas)
            }
          />
        ) : (
          <GeneralList
            type="payment"
            datas={uniqueDatas}
            status={status}
            sortConfig={sortConfig}
            requestSort={requestSort}
            handlePreviewData={handlePreviewData}
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
        {isLoadingMore || (status === "loading" && <CircularLoader />)}
      </>
      {selectedData && (
        <>
          {!isMobile ? (
            <PaymentModal
              selectedData={selectedData}
              onClose={() => {
                setSelectedData(null);
                document.body.style.overflow = "auto";
              }}
            />
          ) : (
            <PaymentPreviewPage data={selectedData} />
          )}
        </>
      )}
    </div>
  );
};
