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

import {
  handleDelete,
  handleDeleteData,
  handleEditData,
} from "./__actions/__userAction";
import { BadgeUsers } from "./__badgeUser";
import UserList from "./__components/__usersList";
import UsersTable from "./__components/__usersTable";
import { fetchUsers, resetUsers } from "../../../../features/users/userSlice";

export const UserPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const datas = useSelector((state) => state.users.users);
  const total = useSelector((state) => state.users.total);
  const status = useSelector((state) => state.users.status);
  const page = useSelector((state) => state.users.page);
  const totalPages = useSelector((state) => state.users.totalPages);
  const totalActive = useSelector((state) => state.users.totalActive);
  const totalSuspend = useSelector((state) => state.users.totalSuspend);

  const [currentPage, setCurrentPage] = useState(page || 1);
  const [sortConfig, setSortConfig] = useState({
    id: "created_at",
    direction: "desc",
  });
  const [selectedDatas, setSelectedDatas] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFetchingRef = useRef(false);
  const isMobile = useIsMobile();

  // ✅ Independent search state split to avoid heavy re-render
  const [query, setQuery] = useState("");
  const [searchRef, setSearchRef] = useState("");

  const debouncedSearch = useMemo(
    () =>
      debounce((val) => {
        setSearchRef(val);
        setCurrentPage(1);
        dispatch(resetUsers());
        isFetchingRef.current = false;
      }, 500),
    [dispatch]
  );
  useEffect(() => {
    const fetchData = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        await dispatch(
          fetchUsers({
            page: currentPage,
            perPage: 10,
            search: searchRef,
            sortKey: sortConfig.id,
            sortDirection: sortConfig.direction,
          })
        ).unwrap();
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setIsLoadingMore(false);
        isFetchingRef.current = false;
      }
    };

    fetchData();
  }, [dispatch, currentPage, searchRef, sortConfig]);

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

  const sortedDatas = useMemo(() => [...datas], [datas]);

  const requestSort = (key) => {
    const newDirection =
      sortConfig.id === key && sortConfig.direction === "desc" ? "asc" : "desc";

    setSortConfig({ id: key, direction: newDirection });
    setCurrentPage(1);
    dispatch(resetUsers());
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
    <div className="bg-base-100 border rounded-xl pl-4 border-base-300 min-h-[90vh]">
      {/* Search Input */}
      <div className="w-full flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-4">
        <div className="w-full flex justify-center md:justify-start">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base-content/70">
              search
            </span>
            <input
              type="text"
              placeholder="Search: [name, email, phone]"
              className="border border-base-300 bg-base-100 dark:bg-base-300 dark:focus:bg-base-100 duration-300 focus:border-primary cursor-pointer py-2 rounded pl-10 pr-3 outline-none w-full"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                debouncedSearch(e.target.value);
              }}
            />
          </div>
        </div>

        {/* Badge section */}
        <div className="w-full md:w-auto">
          <BadgeUsers
            totalActive={totalActive}
            totalSuspend={totalSuspend}
            badgeData={total}
          />
        </div>
      </div>

      <>
        {!isMobile ? (
          <UsersTable
            type="user"
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
          <UserList
            type="user"
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
        {isLoadingMore && <CircularLoader />}
      </>
    </div>
  );
};
