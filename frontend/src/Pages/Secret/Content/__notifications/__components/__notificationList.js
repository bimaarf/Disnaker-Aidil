import React, { useEffect, useState, useRef } from "react";

// NotificationListItem Component - Enhanced untuk mobile
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
  const isMobile = window.innerWidth < 768;

  const handleTouchStart = (e) => {
    if (!isMobile) return;
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !isMobile) return;
    e.preventDefault();
    const currentX = e.touches[0].clientX;
    const diff = startX.current - currentX;

    if (diff > 0 && diff <= 100) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
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
    } else {
      setSwipeOffset(100);
    }
  }, [activeSwipeId, data.id]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-base-300 mb-2">
      {/* Delete button background - hanya muncul di mobile saat swipe */}
      {isMobile && activeSwipeId === data.id && (
        <div
          className="absolute right-0 top-0 h-full w-24 bg-error flex items-center justify-center text-error-content font-medium z-10"
          onClick={() => handleDeleteData(data.key)}>
          <span className="material-symbols-outlined">delete</span>
        </div>
      )}

      {/* Main content */}
      <div
        className={`bg-base-100 transition-transform duration-300 ease-out ${
          activeSwipeId === data.id && isMobile
            ? "transform -translate-x-24"
            : ""
        }`}
        style={
          isMobile && isDragging
            ? { transform: `translateX(-${swipeOffset}px)` }
            : {}
        }
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}>
        <div className="flex items-center justify-between p-3 sm:p-4 gap-3">
          {/* Left content dengan avatar dan info */}
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
            className="flex w-full items-start gap-3 cursor-pointer">
            {/* Avatar */}
            {data.avatar ? (
              <div className="avatar flex-shrink-0">
                <div className="mask mask-squircle h-10 w-10 sm:h-12 sm:w-12 object-cover object-center">
                  <img
                    src={`${process.env.REACT_APP_API}${type}/images/${data.avatar}`}
                    alt="Avatar"
                  />
                </div>
              </div>
            ) : (
              <div className="avatar placeholder flex-shrink-0">
                <div className="bg-primary text-primary-content h-10 w-10 sm:h-12 sm:w-12 rounded-xl">
                  <span className="material-symbols-outlined text-sm sm:text-base">
                    notifications_active
                  </span>
                </div>
              </div>
            )}

            {/* Content area */}
            <div className="w-full min-w-0">
              {/* Title dan label */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-semibold text-sm sm:text-base truncate ${
                      data.label === "Account" && "text-sm"
                    }`}>
                    {data.label === "Account" ? data.title : data.label}
                  </div>
                </div>

                {/* Icon label di kanan atas */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-sm sm:text-base">
                    {data.label === "Account" && "person"}
                    {data.label === "Deposit" && "arrow_insert"}
                    {data.label === "Withdraw" && "arrow_outward"}
                    {data.label === "Winner" && "military_tech"}
                  </span>
                  <p className="text-xs sm:text-sm capitalize text-base-content/80">
                    {data.label}
                  </p>
                </div>
              </div>

              {/* Message */}
              <div className="text-xs sm:text-sm text-base-content/70 mb-2 line-clamp-2">
                {data.message}
              </div>

              {/* Info bawah */}
              <div className="flex items-center justify-between gap-2 text-xs text-base-content/60">
                {/* User info dan role */}
                <div className="flex items-center gap-1 min-w-0">
                  {data.roles === "administrator" && (
                    <span className="material-symbols-outlined text-warning text-xs">
                      key
                    </span>
                  )}
                  <span className="truncate capitalize">{data.roles}</span>
                </div>

                {/* Date */}
                <div className="flex-shrink-0">
                  {formatDate(data.created_at)}
                </div>
              </div>
            </div>
          </div>

          {/* Checkbox */}
          <label id={`select-${data.id}`} className="flex-shrink-0">
            <input
              type="checkbox"
              className="checkbox checkbox-sm rounded-full"
              checked={selectedDatas.includes(data.key)}
              onChange={() => handleCheckboxChange(data.key)}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

// NotificationList Component - Enhanced
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

  // Sort icon helper
  const getSortIcon = (field) => {
    if (sortConfig.key === field) {
      return sortConfig.direction === "desc" ? "↓" : "↑";
    }
    return "↕";
  };

  return (
    <div>
      {/* Header yang lebih mobile-friendly */}
      <div className="sticky bg-base-100 rounded-b-xl top-12 z-10 mb-4">
        <div
          className={`${
            isSelect
              ? "bg-primary/10 border-primary/20"
              : "bg-base-200/50 border-base-300"
          } flex border rounded-lg p-3 justify-between items-center transition-all duration-300`}>
          {!isSelect ? (
            // Normal header dengan sort
            <>
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => requestSort("title")}
                  className="btn btn-ghost btn-sm gap-1 flex-shrink-0">
                  <span className="text-xs sm:text-sm">Title</span>
                  <span className="text-xs">{getSortIcon("title")}</span>
                </button>

                {!isMobile && (
                  <>
                    <button
                      onClick={() => requestSort("status")}
                      className="btn btn-ghost btn-sm gap-1 flex-shrink-0">
                      <span className="text-xs sm:text-sm">Status</span>
                      <span className="text-xs">{getSortIcon("status")}</span>
                    </button>

                    <button
                      onClick={() => requestSort("created_at")}
                      className="btn btn-ghost btn-sm gap-1 flex-shrink-0">
                      <span className="text-xs sm:text-sm">Date</span>
                      <span className="text-xs">
                        {getSortIcon("created_at")}
                      </span>
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-base-content/60 hidden sm:inline">
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
                className="btn btn-ghost btn-sm gap-2">
                <span className="material-symbols-outlined text-sm">close</span>
                <span className="hidden sm:inline">Cancel</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {selectedDatas.length} selected
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => document.getElementById("select-all").click()}
                  className="btn btn-ghost btn-sm text-xs">
                  {selectedDatas.length === datas.length
                    ? "Deselect"
                    : "Select All"}
                </button>

                <button
                  onClick={handleDelete}
                  className="btn btn-error btn-sm gap-1">
                  <span className="material-symbols-outlined text-sm">
                    delete
                  </span>
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* List content */}
      <div className="space-y-1">
        {datas.length === 0 && status !== "loading" ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-base-200 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-base-content/40">
                notifications_off
              </span>
            </div>
            <p className="text-base-content/60">No notifications found</p>
          </div>
        ) : (
          <div className="space-y-1">
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

export default NotificationList;
