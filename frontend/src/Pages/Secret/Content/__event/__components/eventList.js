import { CheckCircle, XCircle, Book, Eye } from "lucide-react";
import React, { useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// Format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Truncate title
const truncateTitle = (title, maxLength) => {
  if (!title) return "Untitled";
  return title.length > maxLength
    ? `${title.substring(0, maxLength)}...`
    : title;
};

// Memoized StatusBadge Component
const StatusBadge = React.memo(({ status }) => {
  const isActive = status === 1 || status === "1" || status === true;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold shadow-sm backdrop-blur-sm transition-all duration-200 ${
        isActive
          ? "bg-success/90 text-base-content"
          : "bg-base-100/90 text-base-content/70"
      }`}>
      {isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
      <span className="hidden sm:inline">
        {isActive ? "Available" : "Hidden"}
      </span>
    </div>
  );
});
StatusBadge.displayName = "StatusBadge";

// Memoized EventCard Component
const EventCard = React.memo(
  ({
    data,
    selectedDatas,
    handleCheckboxChange,
    handlePreviewData,
    handleEditData,
    handleDeleteData,
  }) => {
    const navigate = useNavigate();
    const primaryImage = useMemo(
      () =>
        data?.images?.find((img) => img.is_primary === 1) || data?.images?.[0],
      [data?.images]
    );

    return (
      <div className="group cursor-pointer bg-base-100 dark:bg-base-200 shadow-sm backdrop-blur-sm rounded-2xl transition-all duration-200 transform border border-base-200 overflow-hidden hover:border-primary hover:shadow-lg flex flex-col h-full">
        {/* Image Section */}
        <div className="relative aspect-[4/3] w-full overflow-hidden flex-shrink-0">
          {primaryImage ? (
            <img
              src={`${process.env.REACT_APP_API}${primaryImage.image_data}`}
              alt={data?.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-primary/20">
              <Book className="w-12 h-12 sm:w-16 sm:h-16 text-primary/40 group-hover:scale-110 transition-transform duration-500" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Checkbox */}
          <div className="absolute top-2 left-2 z-20">
            <div className="bg-base-100/30 dark:bg-base-200/30 backdrop-blur-sm rounded-lg pt-1.5 px-1.5 shadow-lg">
              <input
                type="checkbox"
                className={`checkbox checkbox-xs ${
                  selectedDatas?.length > 0 && "checkbox-primary"
                } hover:scale-110 transition-transform duration-200`}
                checked={selectedDatas?.includes(data?.key)}
                onChange={() => handleCheckboxChange(data?.key)}
              />
            </div>
          </div>

          {/* Status Badge */}
          <div className="absolute top-2 right-2 z-10">
            <StatusBadge status={data?.status} />
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3 sm:p-4 space-y-1 sm:space-y-2 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="text-sm sm:text-base font-bold text-base-content line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-300 flex-shrink-0">
            {truncateTitle(data?.name, 50)}
          </h3>

          {/* Categories */}
          <div className="flex flex-wrap gap-1 flex-shrink-0">
            {data?.categories?.slice(0, 1).map((category, index) => (
              <span
                key={index}
                className="badge badge-primary badge-sm px-2 py-1 rounded-lg text-xs font-semibold">
                {category?.name || "Uncategorized"}
              </span>
            ))}
            {data?.categories?.length > 1 && (
              <span className="badge badge-ghost badge-sm px-2 py-1 rounded-lg text-xs font-semibold">
                +{data.categories.length - 1}
              </span>
            )}
          </div>

          {/* Author */}
          <div className="flex items-center gap-2 text-base-content/70 text-xs flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-xs text-primary">
                person
              </span>
            </div>
            <span className="font-medium">
              {data?.author?.name || "Anonymous"}
            </span>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 text-base-content/70 text-xs flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-xs text-primary">
                schedule
              </span>
            </div>
            <span className="font-medium">{formatDate(data?.created_at)}</span>
          </div>

          {/* Actions */}
          <div className="h-full flex-col place-content-end">
            <div className="flex items-center gap-2 pt-2 mt-auto">
              <button
                onClick={() => navigate(`/event/${data?.key}`)}
                className="btn btn-primary btn-sm flex-1 rounded-lg text-xs font-semibold hover:scale-105 transition-all duration-300 disabled:opacity-50"
                disabled={!data?.status}>
                <Eye size={16} />
                <span className="">Preview</span>
              </button>

              <div className="dropdown dropdown-top dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-ghost btn-sm btn-square rounded-lg hover:bg-primary/10 hover:scale-110 transition-all duration-300">
                  <span className="material-symbols-outlined text-sm">
                    more_vert
                  </span>
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu bg-base-100 dark:bg-base-200 rounded-xl z-[1] w-40 p-2 shadow-xl border border-base-200/50 backdrop-blur-sm">
                  <li>
                    <button
                      onClick={() => handlePreviewData(data)}
                      className="flex items-center gap-2 p-2 text-info hover:bg-info/10 rounded-lg transition-all duration-300 text-xs font-semibold">
                      <div className="w-6 h-6 rounded-lg bg-info/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xs text-info">
                          visibility
                        </span>
                      </div>
                      <span>View</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleEditData(data)}
                      className="flex items-center gap-2 p-2 text-warning hover:bg-warning/10 rounded-lg transition-all duration-300 text-xs font-semibold">
                      <div className="w-6 h-6 rounded-lg bg-warning/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xs text-warning">
                          edit
                        </span>
                      </div>
                      <span>Edit</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleDeleteData(data?.key)}
                      className="flex items-center gap-2 p-2 text-error hover:bg-error/10 rounded-lg transition-all duration-300 text-xs font-semibold">
                      <div className="w-6 h-6 rounded-lg bg-error/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xs text-error">
                          delete
                        </span>
                      </div>
                      <span>Delete</span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
EventCard.displayName = "EventCard";

const EventList = ({
  datas,
  status,
  sortConfig,
  requestSort,
  handlePreviewData,
  handleEditData,
  handleDeleteData,
  handleDelete,
  selectedDatas,
  setSelectedDatas,
}) => {
  const selectAllRef = useRef(null);

  const handleCheckboxChange = (dataId) => {
    setSelectedDatas((prevSelected) =>
      prevSelected.includes(dataId)
        ? prevSelected.filter((key) => key !== dataId)
        : [...prevSelected, dataId]
    );
  };

  const handleSelectAll = (event) => {
    setSelectedDatas(
      event.target.checked ? datas?.map((data) => data?.key) : []
    );
  };

  useEffect(() => {
    if (selectAllRef.current) {
      const isIndeterminate =
        selectedDatas?.length > 0 && selectedDatas?.length < datas?.length;
      selectAllRef.current.indeterminate = isIndeterminate;
    }
  }, [selectedDatas?.length, datas?.length]);

  if (!datas) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="text-base-content/60 font-medium text-sm">
            Loading events...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-4">
      {/* Header Controls */}
      <div className="bg-base-100 dark:bg-base-200 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-base-200/50 p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          {/* Selection Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                ref={selectAllRef}
                type="checkbox"
                className={`checkbox checkbox-sm ${
                  selectedDatas.length > 0 && "checkbox-primary"
                } bg-base-100 group-hover:scale-110 transition-transform duration-200`}
                onChange={handleSelectAll}
                checked={
                  selectedDatas.length === datas.length && datas.length > 0
                }
              />
              <span className="text-sm sm:text-base font-semibold text-base-content group-hover:text-primary transition-colors duration-200">
                Select All
              </span>
            </label>
            {selectedDatas.length > 0 && (
              <div
                onClick={handleDelete}
                className="cursor-pointer text-error flex items-center gap-2 px-3 py-2 rounded-lg bg-error/10 hover:bg-error hover:text-white transition-all duration-300 hover:scale-105 group w-fit">
                <span className="material-symbols-outlined text-sm group-hover:animate-pulse">
                  delete
                </span>
                <span className="font-semibold text-sm">
                  Delete ({selectedDatas.length})
                </span>
              </div>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-base-content/70">Sort by:</p>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 text-sm">
              {[
                { key: "name", label: "Title", icon: "title" },
                { key: "status", label: "Status", icon: "toggle_on" },
                { key: "category", label: "Category", icon: "category" },
                { key: "author", label: "Author", icon: "person" },
                { key: "created_at", label: "Date", icon: "schedule" },
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => requestSort(key)}
                  className={`active:scale-[99%] px-3 flex items-center py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 text-xs sm:text-sm ${
                    sortConfig.key === key
                      ? "bg-primary text-white"
                      : "text-base-content/70 hover:bg-primary/10"
                  }`}>
                  <p className="material-symbols-outlined mr-1 text-sm">
                    {icon}
                  </p>
                  <span className="whitespace-nowrap">{label}</span>
                  {sortConfig.key === key ? (
                    <p className="ml-1 font-bold">
                      {sortConfig.direction === "desc" ? "↓" : "↑"}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {datas.length === 0 && status !== "loading" ? (
        <div className="bg-base-100 dark:bg-base-200 rounded-xl sm:rounded-2xl shadow-lg border border-base-200/50 p-8 sm:p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Book className="w-8 h-8 sm:w-12 sm:h-12 text-primary/60" />
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-base-content mb-2">
              No Events Found
            </h3>
            <p className="text-sm sm:text-base text-base-content/60 mb-4 sm:mb-6">
              Create your first event to start sharing
            </p>
            <button className="btn btn-primary btn-sm sm:btn-md rounded-lg sm:rounded-xl">
              <span className="material-symbols-outlined mr-2">add</span>
              Add New Event
            </button>
          </div>
        </div>
      ) : (
        /* Event Grid - 2 columns on mobile, responsive on larger screens */
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {(datas || []).map((data) => (
            <EventCard
              key={data?.key}
              data={data}
              selectedDatas={selectedDatas}
              handleCheckboxChange={handleCheckboxChange}
              handlePreviewData={handlePreviewData}
              handleEditData={handleEditData}
              handleDeleteData={handleDeleteData}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;
