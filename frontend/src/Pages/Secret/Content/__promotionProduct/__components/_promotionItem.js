import React from "react";
import { useSwipeable } from "react-swipeable";
import { formatDate } from "../../../../../Context/__formatDate";

const PromotionProductItem = ({
  data,
  handleDeleteData,
  handleEditData,
  truncateTitle,
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

  const isActive = activeSwipeId === data.id;
  const isSelected = selectedDatas.includes(data.id);

  const getStatusBadge = (status) => {
    return status === 1 || status === "1" ? (
      <span className="badge badge-success badge-xs">Active</span>
    ) : (
      <span className="badge badge-error badge-xs">Inactive</span>
    );
  };

  const isExpired = (expiredDate) => {
    if (!expiredDate) return false;
    return new Date(expiredDate) < new Date();
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm hover:shadow-md transition-all duration-300">
      <div
        {...handlers}
        className={`relative h-24 select-none cursor-pointer transition-transform duration-300 ${
          isActive ? "-translate-x-20" : "translate-x-0"
        } ${
          isSelected ? "bg-primary/5 border-primary/30" : "hover:bg-base-200/50"
        }`}
        key={data.id}>
        <div className="flex items-center h-full p-4 gap-4">
          {/* Avatar Section */}
          <div className="flex-shrink-0">
            {data.image ? (
              <div className="avatar">
                <div className="mask mask-squircle h-12 w-12 ring-2 ring-base-300 ring-offset-1">
                  <img
                    src={`${process.env.REACT_APP_API}${data.image}`}
                    alt="Promotion"
                    className="object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="avatar placeholder">
                <div className="bg-gradient-to-br from-primary/20 to-primary/40 text-primary h-12 w-12 rounded-xl ring-2 ring-primary/20">
                  <span className="text-lg font-semibold">
                    {data.title?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div
            onClick={() => {
              if (!isSelect) {
                activeSwipeId === null
                  ? handleEditData(data)
                  : setActiveSwipeId(null);
              } else {
                document.getElementById(`select-${data.id}`).click();
              }
            }}
            className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Title and Status */}
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-base-content text-sm leading-tight truncate">
                    {truncateTitle(data.title, 30)}
                  </h3>
                  {getStatusBadge(data.status)}
                </div>

                {/* Key Info */}
                <div className="flex items-center gap-1 text-xs text-base-content/50 mb-1">
                  <span className="material-symbols-outlined text-xs">key</span>
                  <span className="font-mono">{data.key}</span>
                </div>

                {/* Referral Code and Expiration */}
                <div className="flex items-center gap-3 text-xs text-base-content/60">
                  {data.referral_code && (
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">
                        confirmation_number
                      </span>
                      <span className="font-mono bg-base-200 px-1 py-0.5 rounded text-xs">
                        {data.referral_code}
                      </span>
                    </div>
                  )}

                  {data.expired ? (
                    <div
                      className={`flex items-center gap-1 ${
                        isExpired(data.expired) ? "text-error" : "text-warning"
                      }`}>
                      <span className="material-symbols-outlined text-xs">
                        {isExpired(data.expired) ? "schedule" : "event"}
                      </span>
                      <span>{formatDate(data.expired)}</span>
                      {isExpired(data.expired) && (
                        <span className="text-error font-medium">
                          • Expired
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-success">
                      <span className="material-symbols-outlined text-xs">
                        all_inclusive
                      </span>
                      <span>Never expires</span>
                    </div>
                  )}
                </div>

                {/* Created Date */}
                <div className="flex items-center gap-1 text-xs text-base-content/40 mt-1">
                  <span className="material-symbols-outlined text-xs">
                    schedule
                  </span>
                  <span>Created {formatDate(data.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkbox Section */}
          <div className="flex-shrink-0">
            <label
              id={`select-${data.id}`}
              className="cursor-pointer flex items-center justify-center w-10 h-10 rounded-full hover:bg-base-300/50 transition-colors duration-200">
              <input
                type="checkbox"
                className={`checkbox checkbox-sm rounded-md ${
                  isSelected ? "checkbox-primary" : ""
                }`}
                checked={isSelected}
                onChange={() => handleCheckboxChange(data.id)}
              />
            </label>
          </div>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
        )}

        {/* Expired Indicator */}
        {data.expired && isExpired(data.expired) && (
          <div className="absolute top-2 right-2">
            <span className="badge badge-error badge-xs">Expired</span>
          </div>
        )}
      </div>

      {/* Action Buttons - Slide In */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-20 bg-error text-error-content flex flex-col transition-transform duration-300 ${
          isActive ? "translate-x-0" : "translate-x-full"
        }`}>
        <button
          onClick={() => handleEditData(data)}
          className="w-full flex-1 flex flex-col items-center justify-center gap-1 hover:bg-warning hover:text-warning-content transition-colors duration-200 bg-warning/20 text-warning">
          <span className="material-symbols-outlined text-lg">edit</span>
          <span className="text-xs font-medium">Edit</span>
        </button>
        <button
          onClick={() => handleDeleteData(data.id)}
          className="w-full flex-1 flex flex-col items-center justify-center gap-1 hover:bg-error-focus transition-colors duration-200">
          <span className="material-symbols-outlined text-lg">delete</span>
          <span className="text-xs font-medium">Delete</span>
        </button>
      </div>
    </div>
  );
};

export default PromotionProductItem;
