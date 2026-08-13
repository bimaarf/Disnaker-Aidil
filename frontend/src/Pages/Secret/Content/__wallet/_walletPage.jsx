import { debounce } from "lodash";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { CircularLoader } from "../../../../Components/_CircularLoader";
import { formatDate } from "../../../../Context/__formatDate";
import useIsMobile from "../../../../Context/__useIsMobile";
import { selectUser } from "../../../../features/authentication/AuthSlice";
import { fetchWallets } from "../../../../features/wallets/walletSlice";
import { BadgeTotal } from "../../Components/___badgeTotal";
import {
  handleDelete,
  handleDeleteData,
  handleEditData,
} from "./__actions/__walletAction";
import { WalletModal } from "./__app/_walletPreviewModal";
import { WalletPreviewPage } from "./__app/_walletPreviewPage";
import { TabsFilter } from "./__components/__tabs";
import WalletsList from "./__components/__walletsList";
import WalletsTable from "./__components/__walletsTable";

export const WalletPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const datas = useSelector((state) => state.wallets.wallets);
  const total = useSelector((state) => state.wallets.total);
  const status = useSelector((state) => state.wallets.status);
  const page = useSelector((state) => state.wallets.page);
  const totalPages = useSelector((state) => state.wallets.totalPages);
  const totalVisible = useSelector((state) => state.wallets.totalVisible);
  const totalHidden = useSelector((state) => state.wallets.totalHidden);

  const [selectedData, setSelectedData] = useState(null);
  const [currentPage, setCurrentPage] = useState(page || 1);
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [selectedDatas, setSelectedDatas] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFetchingRef = useRef(false);
  const [filter, setFilter] = useState(null);

  const isMobile = useIsMobile();

  useEffect(() => {
    dispatch(fetchWallets({ page: currentPage, perPage: 10 }))
      .unwrap()
      .catch((error) => console.error("Failed to fetch datas:", error));
  }, [dispatch, filter, currentPage]);

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
    navigate(`/wallets/preview/${data.key}`, {
      state: { dataProps: data },
    });
    // }
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
  const filteredDatas = useMemo(() => {
    if (filter) {
      return uniqueDatas.filter((data) => data && data.email === filter);
    }
    return uniqueDatas;
  }, [uniqueDatas, filter]);

  const [activeTab, setActiveTab] = useState(1);
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const key = queryParams.get("query");

    switch (key) {
      case "card":
        setActiveTab(2);
        break;
      default:
        setActiveTab(1);
        break;
    }
  }, [location.search]);
  return (
    <div>
      {user?.role === "administrator" || user?.role === "Super Admin" ? (
        <div
          className="fixed bottom-20 md:bottom-10 z-50 right-4 md:right-10 cursor-pointer"
          onClick={() => navigate("/wallets/create")}>
          <div className="rounded-full hover:brightness-110 scale-150 active:scale-125 duration-300 bg-base-300 p-1.5 flex justify-center items-center">
            <span className="material-symbols-outlined">add</span>
          </div>
        </div>
      ) : (
        <>
          <BadgeTotal
            totalVisible={totalVisible}
            totalHidden={totalHidden}
            badgeData={total}
          />
        </>
      )}
      <div className="my-4">
        <TabsFilter
          currentPage={currentPage}
          totalPages={totalPages}
          filter={filter}
          setFilter={setFilter}
          handleLoadMore={handleLoadMore}
        />
      </div>
      {!isMobile && (
        <div className="px-4 sticky top-0 z-50 bg-base-100">
          <nav
            className="flex gap-x-2"
            aria-label="Tabs"
            role="tablist"
            aria-orientation="horizontal">
            <button
              type="button"
              className={`py-4 px-1 inline-flex items-center gap-x-2 border-b-2 text-sm whitespace-nowrap ${
                activeTab === 1
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-blue-600"
              }`}
              onClick={() => {
                setActiveTab(1);
                navigate("/wallets?query=table");
              }}
              id="basic-tabs-item-1"
              aria-selected={activeTab === 1}
              aria-controls="basic-tabs-1"
              role="tab">
              Table
            </button>
            <button
              type="button"
              className={`py-4 px-1 inline-flex items-center gap-x-2 border-b-2 text-sm whitespace-nowrap ${
                activeTab === 2
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-blue-600"
              }`}
              onClick={() => {
                setActiveTab(2);
                navigate("/wallets?query=card");
              }}
              id="basic-tabs-item-1"
              aria-selected={activeTab === 1}
              aria-controls="basic-tabs-1"
              role="tab">
              Card
            </button>
          </nav>
        </div>
      )}
      {activeTab === 1 && (
        <>
          {!isMobile ? (
            <WalletsTable
              datas={filteredDatas}
              status={status}
              sortConfig={sortConfig}
              requestSort={requestSort}
              handlePreviewData={handlePreviewData}
              formatDate={formatDate}
              selectedDatas={selectedDatas}
              setSelectedDatas={setSelectedDatas}
              handleEditData={(data) => handleEditData(navigate, data)}
              handleDeleteData={(dataKey) =>
                handleDeleteData(dispatch, dataKey)
              }
              handleDelete={() =>
                handleDelete(dispatch, selectedDatas, setSelectedDatas)
              }
            />
          ) : (
            <WalletsList
              type="wallet"
              datas={filteredDatas}
              status={status}
              sortConfig={sortConfig}
              requestSort={requestSort}
              handlePreviewData={handlePreviewData}
              formatDate={formatDate}
              selectedDatas={selectedDatas}
              setSelectedDatas={setSelectedDatas}
              handleEditData={(data) => handleEditData(navigate, data)}
              handleDeleteData={(dataKey) =>
                handleDeleteData(dispatch, dataKey)
              }
              handleDelete={() =>
                handleDelete(dispatch, selectedDatas, setSelectedDatas)
              }
            />
          )}
        </>
      )}
      {activeTab === 2 && (
        <WalletsList
          type="wallet"
          datas={filteredDatas}
          status={status}
          sortConfig={sortConfig}
          requestSort={requestSort}
          handlePreviewData={handlePreviewData}
          formatDate={formatDate}
          selectedDatas={selectedDatas}
          setSelectedDatas={setSelectedDatas}
          handleEditData={(data) => handleEditData(navigate, data)}
          handleDeleteData={(dataKey) => handleDeleteData(dispatch, dataKey)}
          handleDelete={() =>
            handleDelete(dispatch, selectedDatas, setSelectedDatas)
          }
        />
      )}

      {isLoadingMore || status === "loading" ? <CircularLoader /> : ""}
      {selectedData && (
        <>
          {!isMobile ? (
            <WalletModal
              selectedData={selectedData}
              onClose={() => {
                setSelectedData(null);
                document.body.style.overflow = "auto";
              }}
            />
          ) : (
            <WalletPreviewPage data={selectedData} />
          )}
        </>
      )}
    </div>
  );
};
