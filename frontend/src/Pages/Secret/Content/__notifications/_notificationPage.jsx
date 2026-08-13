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
import { fetchNotifications } from "../../../../features/notifications/notificationSlice";
import { TabsFilter } from "./__components/__tabs";
import useIsMobile from "../../../../Context/__useIsMobile";

// Enhanced NotificationListItem Component
const NotificationListItem = ({
  type,
  data,
  handleDeleteData,
  handlePreviewData,
  formatDate,
  handleCheckboxChange,
  selectedDatas,
  isSelect,
  activeSwipeId,
  setActiveSwipeId,
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const [isVerticalScroll, setIsVerticalScroll] = useState(false);
  const isMobile = window.innerWidth < 768;

  const handleTouchStart = (e) => {
    if (!isMobile) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
    setIsVerticalScroll(false);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !isMobile) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = Math.abs(startX.current - currentX);
    const diffY = Math.abs(startY.current - currentY);

    // Detect if this is vertical scrolling
    if (!isVerticalScroll && diffY > diffX) {
      setIsVerticalScroll(true);
      return;
    }

    // If vertical scrolling, don't prevent default or handle swipe
    if (isVerticalScroll) return;

    e.preventDefault();
    const swipeDiff = startX.current - currentX;

    if (swipeDiff > 0 && swipeDiff <= 100) {
      setSwipeOffset(swipeDiff);
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile || isVerticalScroll) {
      setIsDragging(false);
      return;
    }

    setIsDragging(false);

    if (swipeOffset > 50) {
      setActiveSwipeId(data.id);
      setSwipeOffset(100);
    } else {
      setActiveSwipeId(null);
      setSwipeOffset(0);
    }
  };

  // Reset swipe when another item is active
  useEffect(() => {
    if (activeSwipeId !== data.id) {
      setSwipeOffset(0);
    } else if (activeSwipeId === data.id) {
      setSwipeOffset(100);
    }
  }, [activeSwipeId, data.id]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-base-300 mb-2 bg-base-100">
      {/* Delete button background - mobile only */}
      {isMobile && (
        <div
          className={`absolute right-0 top-0 h-full w-24 bg-error flex items-center justify-center text-error-content font-medium transition-opacity duration-300 ${
            activeSwipeId === data.id ? "opacity-100 z-10" : "opacity-0 -z-10"
          }`}
          onClick={() => handleDeleteData(data.key)}>
          <span className="material-symbols-outlined">delete</span>
        </div>
      )}

      {/* Main content */}
      <div
        className={`bg-base-100 transition-transform duration-300 ease-out touch-pan-y ${
          activeSwipeId === data.id && isMobile
            ? "transform -translate-x-24"
            : ""
        }`}
        style={
          isMobile && isDragging && !isVerticalScroll
            ? { transform: `translateX(-${swipeOffset}px)` }
            : {}
        }
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}>
        <div className="flex items-center justify-between p-3 sm:p-4 gap-3">
          {/* Main content area */}
          <div
            onClick={() => {
              if (!isSelect) {
                activeSwipeId === null
                  ? handlePreviewData(data)
                  : setActiveSwipeId(null);
              } else {
                document.getElementById(`select-${data.id}`).click();
              }
            }}
            className="flex w-full items-start gap-3 cursor-pointer min-w-0">
            {/* Avatar */}
            {data.avatar ? (
              <div className="avatar flex-shrink-0">
                <div className="mask mask-squircle h-12 w-12 sm:h-14 sm:w-14">
                  <img
                    src={`${process.env.REACT_APP_API}${type}/images/${data.avatar}`}
                    alt="Avatar"
                    className="object-cover object-center"
                  />
                </div>
              </div>
            ) : (
              <div className="avatar placeholder flex-shrink-0">
                <div className="bg-primary text-primary-content h-12 w-12 sm:h-14 sm:w-14 rounded-xl">
                  <span className="material-symbols-outlined text-lg sm:text-xl">
                    notifications_active
                  </span>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h4
                    className={`font-semibold text-sm sm:text-base leading-tight truncate ${
                      data.label === "Account" ? "text-sm" : ""
                    }`}>
                    {data.label === "Account" ? data.title : data.label}
                  </h4>
                </div>

                {/* Icon and label */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-base sm:text-lg">
                    {data.label === "Account" && "person"}
                    {data.label === "Deposit" && "arrow_insert"}
                    {data.label === "Withdraw" && "arrow_outward"}
                    {data.label === "Winner" && "military_tech"}
                  </span>
                  <span className="text-xs sm:text-sm capitalize text-primary font-medium">
                    {data.label}
                  </span>
                </div>
              </div>

              {/* Message */}
              <p className="text-xs sm:text-sm text-base-content/70 mb-3 line-clamp-2 leading-relaxed">
                {data.message}
              </p>

              {/* Footer info */}
              <div className="flex items-center justify-between gap-2">
                {/* Role info */}
                <div className="flex items-center gap-1 text-xs text-base-content/60">
                  {data.roles === "administrator" && (
                    <span className="material-symbols-outlined text-warning text-sm">
                      key
                    </span>
                  )}
                  <span className="capitalize font-medium">{data.roles}</span>
                </div>

                {/* Date */}
                <div className="text-xs text-base-content/60 font-medium">
                  {formatDate(data.created_at)}
                </div>
              </div>
            </div>
          </div>

          {/* Checkbox with better spacing */}
          <div className="flex-shrink-0 pl-2">
            <label id={`select-${data.id}`}>
              <input
                type="checkbox"
                className="checkbox checkbox-sm rounded-full"
                checked={selectedDatas.includes(data.key)}
                onChange={() => handleCheckboxChange(data.key)}
              />
            </label>
          </div>

          {/* Desktop action buttons */}
          {!isMobile && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviewData(data);
                }}
                className="btn btn-ghost btn-xs hover:bg-base-200"
                title="View">
                <span className="material-symbols-outlined text-sm">
                  visibility
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteData(data.key);
                }}
                className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                title="Delete">
                <span className="material-symbols-outlined text-sm">
                  delete
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced NotificationList Component
const NotificationList = ({
  type,
  datas,
  status,
  sortConfig,
  requestSort,
  handlePreviewData,
  handleDeleteData,
  formatDate,
  handleDelete,
  selectedDatas,
  setSelectedDatas,
}) => {
  const [isSelect, setIsSelect] = useState(false);
  const [activeSwipeId, setActiveSwipeId] = useState(null);
  const isMobile = window.innerWidth < 768;

  const handleCheckboxChange = (dataId) => {
    setSelectedDatas((prevSelected) =>
      prevSelected.includes(dataId)
        ? prevSelected.filter((id) => id !== dataId)
        : [...prevSelected, dataId]
    );
    setIsSelect(true);
  };

  const handleSelectAll = (event) => {
    setSelectedDatas(event.target.checked ? datas.map((data) => data.id) : []);
    setIsSelect(event.target.checked);
  };

  const handleCancelSelection = () => {
    setIsSelect(false);
    setSelectedDatas([]);
    setActiveSwipeId(null);
  };

  useEffect(() => {
    if (selectedDatas.length === 0) {
      setIsSelect(false);
    }
  }, [selectedDatas.length]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleCancelSelection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSelectedDatas]);

  const getSortIcon = (field) => {
    if (sortConfig.key === field) {
      return sortConfig.direction === "desc" ? "↓" : "↑";
    }
    return "↕";
  };

  return (
    <div className="space-y-4">
      {/* Enhanced Header */}
      <div className="sticky bg-base-100 rounded-b-xl top-12 z-20 pb-2">
        <div
          className={`
          ${
            isSelect
              ? "bg-primary/10 border-primary/20"
              : "bg-base-200/60 border-base-300"
          } 
          flex border rounded-xl p-3 sm:p-4 justify-between items-center 
          transition-all duration-300 backdrop-blur-sm
        `}>
          {!isSelect ? (
            // Normal header with sort controls
            <>
              <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
                <button
                  onClick={() => requestSort("title")}
                  className="btn btn-ghost btn-sm gap-1 flex-shrink-0 hover:bg-base-300/50">
                  <span className="text-xs sm:text-sm font-medium">Title</span>
                  <span className="text-xs opacity-60">
                    {getSortIcon("title")}
                  </span>
                </button>

                {!isMobile && (
                  <>
                    <button
                      onClick={() => requestSort("status")}
                      className="btn btn-ghost btn-sm gap-1 flex-shrink-0 hover:bg-base-300/50">
                      <span className="text-xs sm:text-sm font-medium">
                        Status
                      </span>
                      <span className="text-xs opacity-60">
                        {getSortIcon("status")}
                      </span>
                    </button>

                    <button
                      onClick={() => requestSort("created_at")}
                      className="btn btn-ghost btn-sm gap-1 flex-shrink-0 hover:bg-base-300/50">
                      <span className="text-xs sm:text-sm font-medium">
                        Date
                      </span>
                      <span className="text-xs opacity-60">
                        {getSortIcon("created_at")}
                      </span>
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-base-content/60 hidden sm:inline font-medium">
                  Select
                </span>
                <input
                  id="select-all"
                  type="checkbox"
                  className="checkbox checkbox-sm rounded-full"
                  onChange={handleSelectAll}
                  checked={
                    selectedDatas.length === datas.length && datas.length > 0
                  }
                />
              </div>
            </>
          ) : (
            // Selection mode header
            <div className="flex justify-between items-center w-full">
              <button
                onClick={handleCancelSelection}
                className="btn btn-ghost btn-sm gap-2 hover:bg-base-300/50">
                <span className="material-symbols-outlined text-sm">close</span>
                <span className="text-sm">Cancel</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="bg-primary/20 px-3 py-1 rounded-full">
                  <span className="text-sm font-semibold text-primary">
                    {selectedDatas.length} selected
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => document.getElementById("select-all").click()}
                  className="btn btn-ghost btn-sm hover:bg-base-300/50">
                  <span className="text-xs sm:text-sm">
                    {selectedDatas.length === datas.length
                      ? "Deselect All"
                      : "Select All"}
                  </span>
                </button>

                <button
                  onClick={handleDelete}
                  className="btn btn-error btn-sm gap-1">
                  <span className="material-symbols-outlined text-sm">
                    delete
                  </span>
                  <span className="hidden sm:inline text-sm">Delete</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* List content */}
      <div className="space-y-1">
        {datas.length === 0 && status !== "loading" ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-base-200 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-base-content/40">
                notifications_off
              </span>
            </div>
            <h3 className="text-lg font-medium text-base-content/70 mb-2">
              No Notifications
            </h3>
            <p className="text-sm text-base-content/50">
              {`You're all caught up!`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {datas.map((data) => (
              <NotificationListItem
                key={data.id}
                type={type}
                isSelect={isSelect}
                setIsSelect={setIsSelect}
                data={data}
                selectedDatas={selectedDatas}
                onChange={() => handleCheckboxChange(data.id)}
                handleCheckboxChange={handleCheckboxChange}
                handleDeleteData={handleDeleteData}
                handlePreviewData={handlePreviewData}
                formatDate={formatDate}
                activeSwipeId={activeSwipeId}
                setActiveSwipeId={setActiveSwipeId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced NotificationsTable Component
const NotificationsTable = ({
  datas,
  status,
  sortConfig,
  requestSort,
  handleDeleteData,
  formatDate,
  handleDelete,
  selectedDatas,
  setSelectedDatas,
}) => {
  const handleCheckboxChange = (dataId) => {
    setSelectedDatas((prevSelected) =>
      prevSelected.includes(dataId)
        ? prevSelected.filter((key) => key !== dataId)
        : [...prevSelected, dataId]
    );
  };

  const handleSelectAll = (event) => {
    setSelectedDatas(event.target.checked ? datas.map((data) => data.key) : []);
  };

  const getSortIcon = (field) => {
    if (sortConfig[field] === field) {
      return sortConfig.direction === "desc" ? " ↓" : " ↑";
    }
    return " ↕";
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-base-300">
      <table className="table table-zebra w-full">
        <thead className="bg-base-200">
          <tr>
            <th className="bg-base-200 sticky left-0 z-10">
              <div className="flex items-center gap-3">
                <label>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    onChange={handleSelectAll}
                    checked={
                      selectedDatas.length === datas.length && datas.length > 0
                    }
                  />
                </label>
                {selectedDatas.length > 0 ? (
                  <button
                    onClick={handleDelete}
                    className="btn btn-error btn-sm gap-2 hover:btn-error">
                    <span className="material-symbols-outlined text-sm">
                      delete
                    </span>
                    <span>Delete ({selectedDatas.length})</span>
                  </button>
                ) : (
                  <button
                    onClick={() => requestSort("label")}
                    className="btn btn-ghost btn-sm gap-1 hover:bg-base-300">
                    <span>Label</span>
                    <span className="text-xs">{getSortIcon("label")}</span>
                  </button>
                )}
              </div>
            </th>
            <th className="bg-base-200">
              <button
                onClick={() => requestSort("name")}
                className="btn btn-ghost btn-sm gap-1 hover:bg-base-300">
                <span>Username</span>
                <span className="text-xs">{getSortIcon("name")}</span>
              </button>
            </th>
            <th className="bg-base-200">
              <button
                onClick={() => requestSort("message")}
                className="btn btn-ghost btn-sm gap-1 hover:bg-base-300">
                <span>Message</span>
                <span className="text-xs">{getSortIcon("message")}</span>
              </button>
            </th>
            <th className="bg-base-200">
              <button
                onClick={() => requestSort("title")}
                className="btn btn-ghost btn-sm gap-1 hover:bg-base-300">
                <span>Title</span>
                <span className="text-xs">{getSortIcon("title")}</span>
              </button>
            </th>
            <th className="bg-base-200">
              <button
                onClick={() => requestSort("created_at")}
                className="btn btn-ghost btn-sm gap-1 hover:bg-base-300">
                <span>Date</span>
                <span className="text-xs">{getSortIcon("created_at")}</span>
              </button>
            </th>
            <th className="bg-base-200">Actions</th>
          </tr>
        </thead>
        <tbody>
          {datas.length === 0 && status !== "loading" ? (
            <tr>
              <td colSpan="6" className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-base-content/40">
                      notifications_off
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-base-content/70">
                      No Notifications found
                    </h3>
                    <p className="text-sm text-base-content/50 mt-1">
                      There are no notifications to display
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            datas.map((data, key) => (
              <tr
                key={key}
                className="hover:bg-base-100 transition-colors duration-200"
                id={data.id}>
                <td className="sticky left-0 bg-inherit z-10">
                  <div className="flex items-center gap-3">
                    <label>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={selectedDatas.includes(data.key)}
                        onChange={() => handleCheckboxChange(data.key)}
                      />
                    </label>
                    <div className="avatar placeholder">
                      <div className="bg-primary text-primary-content h-12 w-12 rounded-xl">
                        <span className="material-symbols-outlined">
                          notifications_active
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{data.label}</div>
                      <div className="text-xs opacity-60">
                        {data.user?.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">
                      person
                    </span>
                    <span className="capitalize font-medium">
                      {data.user?.name}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="flex items-start gap-2 max-w-xs">
                    <span className="material-symbols-outlined text-sm mt-0.5">
                      chat
                    </span>
                    <p className="text-sm leading-relaxed line-clamp-2">
                      {data.message}
                    </p>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">
                      {data.label === "Account" && "person"}
                      {data.label === "Deposit" && "arrow_insert"}
                      {data.label === "Withdraw" && "arrow_outward"}
                      {data.label === "Winner" && "military_tech"}
                    </span>
                    <span className="capitalize font-medium">{data.label}</span>
                  </div>
                </td>
                <td>
                  <div className="text-sm font-medium">
                    {formatDate(data.created_at)}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteData(data.key)}
                      className="btn btn-ghost btn-sm text-error hover:bg-error/10"
                      title="Delete">
                      <span className="material-symbols-outlined text-sm">
                        delete
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// Enhanced Main NotificationPage Component
export const NotificationPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const datas = useSelector((state) => state.notifications.notifications);
  const status = useSelector((state) => state.notifications.status);
  const page = useSelector((state) => state.notifications.page);
  const totalPages = useSelector((state) => state.notifications.totalPages);
  const totalActive = useSelector((state) => state.notifications.totalActive);
  const totalSuspend = useSelector((state) => state.notifications.totalSuspend);

  const [selectedData, setSelectedData] = useState(null);
  const [currentPage, setCurrentPage] = useState(page || 1);
  const [sortConfig, setSortConfig] = useState({
    id: "created_at",
    direction: "desc",
  });
  const [selectedDatas, setSelectedDatas] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filter, setFilter] = useState(null);
  const isFetchingRef = useRef(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await dispatch(
          fetchNotifications({ page: currentPage, perPage: 10 })
        ).unwrap();

        if (result.notifications.length < 10 && currentPage < totalPages) {
          setCurrentPage((prevPage) => prevPage + 1);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };
    if (status === "idle") {
      fetchData();
    }
  }, [dispatch, currentPage, filter, totalPages]);

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

  useEffect(() => {
    if (status === "succeeded" && isLoadingMore) {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    } else if (status === "failed") {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [status, isLoadingMore]);

  const handlePreviewData = () => {
    return null;
  };

  const sortedDatas = useMemo(() => {
    if (!datas || datas.length === 0) return [];
    let sortableDatas = datas.filter((data) => data && data.id);

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
          ? "desc"
          : "asc",
    }));
  };

  const uniqueDatas = useMemo(() => {
    const seen = {};
    return sortedDatas.filter((data) => {
      if (!data || !data.id) return false;
      if (seen[data.id]) {
        return false;
      }
      seen[data.id] = true;
      return true;
    });
  }, [sortedDatas]);

  const filteredDatas = useMemo(() => {
    if (filter) {
      return uniqueDatas.filter((data) => data && data.label === filter);
    }
    return uniqueDatas;
  }, [uniqueDatas, filter]);

  // Import your action handlers
  const handleEditData = (data) => {
    // Your existing handleEditData logic
    navigate(`/edit/${data.id}`);
  };

  const handleDeleteData = (dataId) => {
    // Your existing handleDeleteData logic
    console.log("Delete single item:", dataId);
  };

  const handleDelete = () => {
    // Your existing bulk delete logic
    console.log("Bulk delete:", selectedDatas);
    setSelectedDatas([]);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-base-100 border rounded-xl border-base-300 min-h-[90vh] overflow-hidden">
      {/* Badge Notifications - you'll need to import this */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold">Notifications</h1>
          <div className="flex items-center gap-2 text-sm">
            <div className="badge badge-primary">{totalActive} Active</div>
            <div className="badge badge-ghost">{totalSuspend} Suspended</div>
          </div>
        </div>
      </div>

      {/* Tabs Filter - you'll need to import this */}
      <div className="p-4 border-b border-base-300">
        {/* Your existing TabsFilter component */}
        <TabsFilter
          currentPage={currentPage}
          totalPages={totalPages}
          filter={filter}
          setFilter={setFilter}
          handleLoadMore={handleLoadMore}
        />
      </div>

      {/* Main Content */}
      <div className="p-4">
        {!isMobile ? (
          <NotificationsTable
            type="notification"
            datas={filteredDatas}
            status={status}
            sortConfig={sortConfig}
            requestSort={requestSort}
            handlePreviewData={handlePreviewData}
            formatDate={formatDate}
            selectedDatas={selectedDatas}
            setSelectedDatas={setSelectedDatas}
            handleEditData={(data) => handleEditData(data)}
            handleDeleteData={(dataId) => handleDeleteData(dataId)}
            handleDelete={() => handleDelete()}
          />
        ) : (
          <NotificationList
            type="notification"
            datas={filteredDatas}
            status={status}
            sortConfig={sortConfig}
            requestSort={requestSort}
            handlePreviewData={handlePreviewData}
            formatDate={formatDate}
            selectedDatas={selectedDatas}
            setSelectedDatas={setSelectedDatas}
            handleEditData={(data) => handleEditData(data)}
            handleDeleteData={(dataId) => handleDeleteData(dataId)}
            handleDelete={() => handleDelete()}
          />
        )}

        {/* Loading indicator */}
        {isLoadingMore && (
          <div className="flex justify-center items-center py-8">
            <div className="loading loading-spinner loading-md"></div>
          </div>
        )}
      </div>

      {/* Modal/Preview - Conditional rendering based on device */}
      {selectedData && (
        <>
          {!isMobile ? (
            // Desktop Modal - you'll need to import NotificationModal
            <div className="modal modal-open">
              <div className="modal-box max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Notification Details</h3>
                  <button
                    onClick={() => {
                      setSelectedData(null);
                      document.body.style.overflow = "auto";
                    }}
                    className="btn btn-ghost btn-sm">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Modal content */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Title</h4>
                    <p className="text-sm bg-base-200 p-3 rounded-lg">
                      {selectedData.title || selectedData.label}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Message</h4>
                    <p className="text-sm bg-base-200 p-3 rounded-lg">
                      {selectedData.message}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">User</h4>
                      <p className="text-sm bg-base-200 p-3 rounded-lg">
                        {selectedData.user?.name || "N/A"}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Date</h4>
                      <p className="text-sm bg-base-200 p-3 rounded-lg">
                        {formatDate(selectedData.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="modal-action">
                  <button
                    onClick={() => {
                      setSelectedData(null);
                      document.body.style.overflow = "auto";
                    }}
                    className="btn btn-primary">
                    Close
                  </button>
                </div>
              </div>
              <div
                className="modal-backdrop"
                onClick={() => {
                  setSelectedData(null);
                  document.body.style.overflow = "auto";
                }}></div>
            </div>
          ) : (
            // Mobile Preview Page - you'll need to import NotificationPreviewPage
            <div className="fixed inset-0 bg-base-100 z-50 overflow-y-auto">
              <div className="sticky top-0 bg-base-100 border-b border-base-300 p-4 z-10">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedData(null)}
                    className="btn btn-ghost btn-sm">
                    <span className="material-symbols-outlined">
                      arrow_back
                    </span>
                  </button>
                  <h1 className="font-bold text-lg">Notification Details</h1>
                </div>
              </div>

              <div className="p-4 space-y-6">
                {/* Avatar and basic info */}
                <div className="flex items-start gap-4">
                  {selectedData.avatar ? (
                    <div className="avatar">
                      <div className="mask mask-squircle h-16 w-16">
                        <img
                          src={`${process.env.REACT_APP_API}notification/images/${selectedData.avatar}`}
                          alt="Avatar"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="avatar placeholder">
                      <div className="bg-primary text-primary-content h-16 w-16 rounded-xl">
                        <span className="material-symbols-outlined text-xl">
                          notifications_active
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex-1">
                    <h2 className="font-bold text-lg mb-1">
                      {selectedData.title || selectedData.label}
                    </h2>
                    <p className="text-sm text-base-content/60 mb-2">
                      {selectedData.user?.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-sm">
                        {selectedData.label === "Account" && "person"}
                        {selectedData.label === "Deposit" && "arrow_insert"}
                        {selectedData.label === "Withdraw" && "arrow_outward"}
                        {selectedData.label === "Winner" && "military_tech"}
                      </span>
                      <span className="text-sm capitalize text-primary font-medium">
                        {selectedData.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="bg-base-200 rounded-xl p-4">
                  <h3 className="font-semibold mb-3">Message</h3>
                  <p className="text-sm leading-relaxed">
                    {selectedData.message}
                  </p>
                </div>

                {/* Additional details */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                    <span className="text-sm font-medium">Role</span>
                    <div className="flex items-center gap-1">
                      {selectedData.roles === "administrator" && (
                        <span className="material-symbols-outlined text-warning text-sm">
                          key
                        </span>
                      )}
                      <span className="text-sm capitalize">
                        {selectedData.roles}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                    <span className="text-sm font-medium">Date</span>
                    <span className="text-sm">
                      {formatDate(selectedData.created_at)}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleEditData(selectedData)}
                    className="btn btn-primary flex-1 gap-2">
                    <span className="material-symbols-outlined text-sm">
                      edit
                    </span>
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteData(selectedData.key);
                      setSelectedData(null);
                    }}
                    className="btn btn-error flex-1 gap-2">
                    <span className="material-symbols-outlined text-sm">
                      delete
                    </span>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Export individual components for reusability
export { NotificationList, NotificationListItem, NotificationsTable };
