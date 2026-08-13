import {
  CheckCircle,
  XCircle,
  Book,
  Eye,
  Trash2,
  Edit,
  MoreVertical,
  User,
  Calendar,
  Tag,
  FileText,
} from "lucide-react";
import React, { useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { truncateText } from "../../../../../Context/__useTruncate";
import useIsMobile from "../../../../../Context/__useIsMobile";

// Format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Memoized StatusBadge Component
const StatusBadge = React.memo(({ status }) => {
  const isActive = status === 1 || status === "1" || status === true;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all duration-200 ${
        isActive
          ? "bg-success/10 text-success border border-success/20"
          : "bg-error/10 text-error border border-error/20"
      }`}>
      {isActive ? (
        <CheckCircle className="w-3.5 h-3.5" />
      ) : (
        <XCircle className="w-3.5 h-3.5" />
      )}
      <span className="hidden sm:inline">
        {isActive ? "Available" : "Hidden"}
      </span>
    </div>
  );
});
StatusBadge.displayName = "StatusBadge";

// Memoized BlogCard Component
const BlogCard = React.memo(
  ({
    data,
    selectedDatas,
    handleCheckboxChange,
    handlePreviewData,
    handleEditData,
    handleDeleteData,
  }) => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const primaryImage = useMemo(
      () =>
        data?.images?.find((img) => img.is_primary === 1) || data?.images?.[0],
      [data?.images]
    );

    return (
      <div className="group bg-base-100 dark:bg-base-200 shadow-sm rounded-xl transition-all duration-300 border border-base-300 overflow-hidden hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 flex flex-col h-full">
        {/* Image Section */}
        <div className="relative aspect-[4/3] w-full overflow-hidden flex-shrink-0">
          {primaryImage ? (
            <img
              src={`${primaryImage.image_data}`}
              alt={data?.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
              <Book className="w-12 h-12 sm:w-16 sm:h-16 text-primary/40 group-hover:scale-110 transition-transform duration-500" />
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Checkbox */}
          <div className="absolute top-2 left-2 z-20">
            <div className="bg-base-100/80 backdrop-blur-sm rounded-lg p-1.5 shadow-md">
              <input
                type="checkbox"
                className="checkbox checkbox-primary checkbox-xs"
                checked={selectedDatas?.includes(data?.key)}
                onChange={() => handleCheckboxChange(data?.key)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Status Badge */}
          <div className="absolute top-2 right-2 z-10">
            <StatusBadge status={data?.status} />
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3 sm:p-4 space-y-1 sm:space-y-3 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="text-sm sm:text-base font-bold text-base-content leading-tight group-hover:text-primary transition-colors duration-300 min-h-[2.5rem] sm:min-h-[3rem] line-clamp-2">
            {data?.name}
          </h3>

          {/* Categories */}
          <div className="flex flex items-center gap-1">
            {data?.categories
              ?.slice(0, isMobile ? 1 : 2)
              .map((category, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 px-1 py-0.5 sm:px-2 sm:py-1 rounded-lg text-xs font-semibold">
                  <Tag className="w-3 h-3" />
                  <span className="truncate">
                    {truncateText(category?.name, 15) || "Uncategorized"}
                  </span>
                </span>
              ))}
            {isMobile
              ? data?.categories?.length > 1
              : data?.categories?.length > 2 && (
                  <span className="badge badge-ghost badge-sm px-2 py-1 rounded-lg text-xs font-semibold">
                    +
                    {isMobile
                      ? data.categories.length - 1
                      : data.categories.length - 2}
                  </span>
                )}
          </div>

          <div className="flex space-y-1 sm:space-y-0 items-center justify-between">
            {/* Author */}
            <div className="hidden sm:flex items-center gap-2 text-base-content/70 text-xs">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-medium line-clamp-1">
                {data?.author?.name || "Anonymous"}
              </span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 text-base-content/70 text-xs">
              <div className="w-6 h-6 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-3.5 h-3.5 text-secondary" />
              </div>
              <span className="font-medium">
                {formatDate(data?.created_at)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 mt-auto border-t border-base-300">
            <button
              onClick={() => navigate(`/blog/${data?.key}`)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-primary-content rounded-lg text-xs font-semibold hover:bg-primary/90 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!data?.status}>
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>

            <div className="dropdown dropdown-top dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-sm btn-square rounded-lg hover:bg-base-300 transition-all duration-200"
                onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="w-4 h-4" />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 dark:bg-base-200 rounded-xl z-[1000] w-44 p-2 shadow-xl border border-base-300 mb-2">
                <li>
                  <button
                    onClick={() => handlePreviewData(data)}
                    className="flex items-center gap-2 text-info hover:bg-info/10 rounded-lg">
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleEditData(data)}
                    className="flex items-center gap-2 text-warning hover:bg-warning/10 rounded-lg">
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleDeleteData(data?.key)}
                    className="flex items-center gap-2 text-error hover:bg-error/10 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
BlogCard.displayName = "BlogCard";

const BlogList = ({
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
            Loading blogs...
          </p>
        </div>
      </div>
    );
  }

  const sortOptions = [
    { key: "name", label: "Title", icon: FileText },
    { key: "status", label: "Status", icon: CheckCircle },
    { key: "category", label: "Category", icon: Tag },
    { key: "author", label: "Author", icon: User },
    { key: "created_at", label: "Date", icon: Calendar },
  ];

  return (
    <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
      {/* Header Controls */}
      <div className="bg-base-100 dark:bg-base-200 rounded-xl border border-base-300 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          {/* Selection Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                ref={selectAllRef}
                type="checkbox"
                className="checkbox checkbox-primary checkbox-sm"
                onChange={handleSelectAll}
                checked={
                  selectedDatas.length === datas.length && datas.length > 0
                }
              />
              <span className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors duration-200">
                Select All
              </span>
            </label>

            {selectedDatas.length > 0 && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-error/10 text-error hover:bg-error hover:text-error-content transition-all duration-200 hover:scale-105 font-semibold text-sm w-fit">
                <Trash2 className="w-4 h-4" />
                <span>Delete ({selectedDatas.length})</span>
              </button>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-base-content/70">Sort by:</p>
            <div className="flex flex-wrap items-center gap-2">
              {sortOptions.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => requestSort(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-xs sm:text-sm ${
                    sortConfig.key === key
                      ? "bg-primary text-primary-content shadow-md"
                      : "bg-base-200 dark:bg-base-300 text-base-content hover:bg-base-300"
                  }`}>
                  <Icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{label}</span>
                  {sortConfig.key === key && (
                    <span className="font-bold">
                      {sortConfig.direction === "desc" ? "↓" : "↑"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {datas.length === 0 && status !== "loading" ? (
        <div className="bg-base-100 dark:bg-base-200 rounded-xl border border-base-300 p-8 sm:p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Book className="w-8 h-8 sm:w-10 sm:h-10 text-primary/60" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-base-content mb-2">
              No Blogs Found
            </h3>
            <p className="text-sm text-base-content/60 mb-4 sm:mb-6">
              Create your first blog to start sharing
            </p>
            <button className="btn btn-primary btn-sm sm:btn-md rounded-lg">
              <FileText className="w-4 h-4" />
              <span>Add New Blog</span>
            </button>
          </div>
        </div>
      ) : (
        /* Blog Grid */
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          {(datas || []).map((data) => (
            <BlogCard
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

      {/* Loading State */}
      {status === "loading" && (
        <div className="flex justify-center py-12">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      )}
    </div>
  );
};

export default BlogList;
