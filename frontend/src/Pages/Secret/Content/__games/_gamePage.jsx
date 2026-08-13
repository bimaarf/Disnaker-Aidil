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
import { fetchGames } from "../../../../features/games/gameSlice";
import GeneralList from "../../Components/__generalList";
import GeneralTable from "../../Components/__generalTable";
import {
  handleDelete,
  handleDeleteData,
  handleEditData,
} from "./__actions/__gameAction";
import GamePreviewPage from "./__app/_gamePreviewPage";
import { BadgeGames } from "./__badgeGames";
import { TabsFilter } from "./__components/__tabs";
import { GameGrid } from "../../Components/___gameGrid";
import { selectUser } from "../../../../features/authentication/AuthSlice";

export const GamePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const datas = useSelector((state) => state.games.games);
  const total = useSelector((state) => state.games.total);
  const status = useSelector((state) => state.games.status);
  const page = useSelector((state) => state.games.page);
  const totalPages = useSelector((state) => state.games.totalPages);
  const totalVisible = useSelector((state) => state.games.totalVisible);
  const totalHidden = useSelector((state) => state.games.totalHidden);
  const user = useSelector(selectUser);
  const [selectedData, setSelectedData] = useState(null);
  const [currentPage, setCurrentPage] = useState(page || 1);
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [selectedDatas, setSelectedDatas] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const isFetchingRef = useRef(false);

  useEffect(() => {
    dispatch(fetchGames({ page: currentPage, perPage: 20 }))
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
      isFetchingRef.current = false;
    } else if (status === "failed") {
      isFetchingRef.current = false;
    }
    setIsLoadingMore(false);
  }, [status, isLoadingMore]);

  const handlePreviewData = (data) => {
    setSelectedData(data);
    navigate(`/games/preview/${data.key}`);
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

  const isMobile = useIsMobile();
  const truncateTitle = truncateText;
  const [isTab, setIsTab] = useState(null);

  return (
    <div>
      <div
        className="fixed bottom-20 md:bottom-10 z-50 right-4 md:right-10 cursor-pointer"
        onClick={() => navigate("/games/create")}>
        <div className="rounded-full hover:brightness-110 scale-150 active:scale-125 duration-300 bg-base-300 p-1.5 flex justify-center items-center">
          <span className="material-symbols-outlined">add</span>
        </div>
      </div>
      <BadgeGames
        totalVisible={totalVisible}
        totalHidden={totalHidden}
        badgeData={total}
      />
      {user?.role === "administrator" || user?.role === "Super Admin" ? (
        <TabsFilter isTab={isTab} setIsTab={setIsTab} />
      ) : (
        <></>
      )}
      {isTab ? (
        <>
          {isMobile ? (
            <GeneralList
              type="game"
              datas={uniqueDatas}
              status={status}
              sortConfig={sortConfig}
              requestSort={requestSort}
              handlePreviewData={handlePreviewData}
              handleEditData={(data) => handleEditData(navigate, data)}
              handleDeleteData={(dataId) => handleDeleteData(dispatch, dataId)}
              handleDelete={() =>
                handleDelete(dispatch, selectedDatas, setSelectedDatas)
              }
              formatDate={formatDate}
              truncateTitle={truncateTitle}
              selectedDatas={selectedDatas}
              setSelectedDatas={setSelectedDatas}
            />
          ) : (
            <GeneralTable
              type="game"
              datas={uniqueDatas}
              status={status}
              sortConfig={sortConfig}
              requestSort={requestSort}
              handlePreviewData={handlePreviewData}
              handleEditData={(data) => handleEditData(navigate, data)}
              handleDeleteData={(dataId) => handleDeleteData(dispatch, dataId)}
              handleDelete={() =>
                handleDelete(dispatch, selectedDatas, setSelectedDatas)
              }
              formatDate={formatDate}
              truncateTitle={truncateTitle}
              selectedDatas={selectedDatas}
              setSelectedDatas={setSelectedDatas}
            />
          )}
        </>
      ) : (
        <>
          <GameGrid uniqueDatas={uniqueDatas} />
        </>
      )}

      {isLoadingMore || (status === "loading" && <CircularLoader />)}
      {selectedData && <GamePreviewPage data={selectedData} />}
    </div>
  );
};
