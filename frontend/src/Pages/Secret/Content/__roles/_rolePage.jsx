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
import { fetchRoles } from "../../../../features/roles/roleSlice";
import {
  handleDelete,
  handleDeleteData,
  handleEditData,
} from "./__actions/__roleAction"; // Import the actions
import { UserModal } from "./__app/_rolePreviewModal";
import UserPreviewPage from "./__app/_rolePreviewPage";
import UserList from "./__components/__rolesList";
import RolesTable from "./__components/__rolesTable";

export const RolePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const datas = useSelector((state) => state.roles.roles);
  const status = useSelector((state) => state.roles.status);
  const page = useSelector((state) => state.roles.page);
  const totalPages = useSelector((state) => state.roles.totalPages);

  const [selectedData, setSelectedData] = useState(null);
  const [currentPage, setCurrentPage] = useState(page || 1);
  const [sortConfig, setSortConfig] = useState({
    id: "created_at",
    direction: "desc",
  });
  const [selectedDatas, setSelectedDatas] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFetchingRef = useRef(false);

  const isMobile = useIsMobile(); // Use the custom hook

  useEffect(() => {
    dispatch(fetchRoles({ page: currentPage, perPage: 10 }))
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
      navigate(`/users/preview/${data.id}`);
    }
  };

  const sortedDatas = useMemo(() => {
    let sortableDatas = [...datas];
    if (sortConfig.id) {
      sortableDatas.sort((a, b) => {
        if (a[sortConfig.id] < b[sortConfig.id]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.id] > b[sortConfig.id]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableDatas;
  }, [datas, sortConfig]);

  const requestSort = (id) => {
    setSortConfig((prevSortConfig) => ({
      id,
      direction:
        prevSortConfig.id === id && prevSortConfig.direction === "desc"
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
    <div className="bg-base-100 border rounded-xl px-4 border-base-200 min-h-[90vh]">
      <div
        className="fixed bottom-20 md:bottom-10 z-50 right-4 md:right-10 cursor-pointer"
        onClick={() => navigate("/roles/create")}>
        <div className="rounded-full hover:brightness-110 scale-150 active:scale-125 duration-300 bg-base-300 p-1.5 flex justify-center items-center">
          <span className="material-symbols-outlined">add</span>
        </div>
      </div>
      <>
        {!isMobile ? (
          <RolesTable
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
          <UserList
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
            <UserModal
              selectedData={selectedData}
              onClose={() => {
                setSelectedData(null);
                document.body.style.overflow = "auto";
              }}
            />
          ) : (
            <UserPreviewPage data={selectedData} />
          )}
        </>
      )}
    </div>
  );
};
