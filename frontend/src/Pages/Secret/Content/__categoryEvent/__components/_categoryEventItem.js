import React from "react";
import { useSwipeable } from "react-swipeable";
import * as LucideIcons from "lucide-react"; // import semua icon lucide
import { formatDate } from "../../../../../Context/__formatDate";
// optional helper untuk className agar rapi
import clsx from "clsx";
import { Clock, Trash2 } from "lucide-react";

const CategoryEventItem = ({
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

  /** ✅ Dynamic Lucide Icon
   *  - Gunakan MoveRight sebagai fallback default
   *  - useMemo agar tidak re-render berulang
   */
  const DynamicLucideIcon = ({ iconName, className }) => {
    const IconComponent = LucideIcons[iconName];
    // Jika ditemukan sebagai icon, gunakan icon
    if (IconComponent) {
      return <IconComponent className={className} />;
    }
    // Jika bukan icon valid, tampilkan sebagai teks (misal "1")
    return (
      <span className={`text-lg font-semibold ${className}`}>{iconName}</span>
    );
  };
  return (
    <div className="relative overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm hover:shadow-md transition-all duration-300">
      <div
        {...handlers}
        className={clsx(
          "relative h-20 select-none cursor-pointer transition-transform duration-300",
          isActive && "-translate-x-20",
          isSelected ? "bg-primary/5 border-primary/30" : "hover:bg-base-200/50"
        )}>
        <div className="flex items-center h-full p-4 gap-4">
          {/* Avatar / Icon Section */}
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl ring-2 ring-primary/20 bg-primary/10 text-primary">
              {/* ✅ Pakai Icon Lucide dynamic atau fallback */}
              {data.icon ? (
                <DynamicLucideIcon iconName={data.icon} className="h-6 w-6" />
              ) : (
                <span className="text-lg font-semibold">
                  {data.name?.charAt(0).toUpperCase() || "?"}
                </span>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div
            onClick={() => {
              if (!isSelect) {
                activeSwipeId === null
                  ? handleEditData(data)
                  : setActiveSwipeId(null);
              } else {
                handleCheckboxChange(data.id);
              }
            }}
            className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base-content text-sm leading-tight mb-1 truncate">
                  {truncateTitle(data.name, 40)}
                </h3>
                <div className="flex items-center gap-2 text-xs text-base-content/60">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(data.created_at)}</span>
                  {data.description && (
                    <>
                      <span className="w-1 h-1 bg-base-content/30 rounded-full"></span>
                      <span className="truncate max-w-20">
                        {data.description.substring(0, 20)}...
                      </span>
                    </>
                  )}
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
                className={clsx(
                  "checkbox checkbox-sm rounded-md",
                  isSelected && "checkbox-primary"
                )}
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
      </div>

      {/* Delete Button - Slide In */}
      <div
        className={clsx(
          "absolute right-0 top-0 bottom-0 w-20 bg-error text-error-content flex flex-col items-center justify-center transition-transform duration-300",
          isActive ? "translate-x-0" : "translate-x-full"
        )}>
        <button
          onClick={() => handleDeleteData(data.id)}
          className="w-full h-full flex flex-col items-center justify-center gap-1 hover:bg-error-focus transition-colors duration-200">
          <Trash2 className="w-5 h-5" />
          <span className="text-xs font-medium">Delete</span>
        </button>
      </div>
    </div>
  );
};

export default CategoryEventItem;
