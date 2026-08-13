import React from "react";
import { useSwipeable } from "react-swipeable";

const BlogListItem = ({
  data,
  handleDeleteData,
  handlePreviewData,
  truncateTitle,
  formatDate,
  handleCheckboxChange,
  selectedDatas,
  isSelect,
  activeSwipeId,
  setActiveSwipeId,
}) => {
  const handlers = useSwipeable({
    onSwipedLeft: () => setActiveSwipeId(data.id),
    onSwipedRight: () => setActiveSwipeId(null),
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  return (
    <div
      {...handlers}
      className={`relative border border-base-300 bg-base-100 dark:bg-base-200 text-base-content dark:text-neutral-300 rounded-xl shadow-sm transition-all duration-300 overflow-hidden ${
        activeSwipeId === data.id ? "translate-x-[-80px]" : ""
      } hover:bg-base-200`}>
      <div
        className="flex items-center justify-between gap-3 p-4"
        onClick={() => {
          if (!isSelect) {
            activeSwipeId === null
              ? handlePreviewData(data)
              : setActiveSwipeId(null);
          } else {
            document.getElementById(`select-${data.id}`).click();
          }
        }}>
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          {data.image ? (
            <div className="avatar">
              <div className="mask mask-squircle w-14 h-14">
                <img
                  src={`${data.image}`}
                  alt="Blog"
                  className="object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="avatar placeholder">
              <div className="bg-base-300 text-base-content dark:text-neutral-300 h-14 w-14 rounded-full flex justify-center items-center">
                <span className="text-xl">{data.name?.charAt(0) || "X"}</span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">
            {truncateTitle(data.name, 50)}
          </h3>
          <p className="text-xs text-base-content dark:text-neutral-300/60 truncate">
            {data.description?.replace(/<\/?[^>]+(>|$)/g, "")}
          </p>
          <div className="flex justify-between items-center mt-1 text-xs">
            <span className="text-base-content dark:text-neutral-300">
              {formatDate(data.created_at)}
            </span>
            <span
              className={`flex items-center gap-1 ${
                data.status ? "text-success" : "text-error"
              }`}>
              <span className="material-symbols-outlined text-sm">
                {data.status ? "check_circle" : "error"}
              </span>
              {data.status ? "Visible" : "Hidden"}
            </span>
          </div>
        </div>

        {/* Checkbox */}
        <label htmlFor={`select-${data.key}`}>
          <input
            type="checkbox"
            id={`select-${data.id}`}
            checked={selectedDatas.includes(data.key)}
            onChange={() => handleCheckboxChange(data.key)}
            className="checkbox checkbox-sm checkbox-primary rounded"
          />
        </label>
      </div>

      {/* Swipe Delete */}
      {activeSwipeId === data.id && (
        <div
          className="absolute top-0 right-0 bottom-0 w-20 bg-error hover:bg-red-700 text-white flex justify-center items-center transition-all duration-200"
          onClick={() => handleDeleteData(data.key)}>
          <span className="material-symbols-outlined">delete</span>
        </div>
      )}
    </div>
  );
};

export default BlogListItem;
