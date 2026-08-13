import React from "react";
import { useSwipeable } from "react-swipeable";

const RoleListItem = ({
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
      className={`relative h-20 place-content-center border select-none border-base-300 cursor-pointer active:bg-base-200 rounded-xl swipe-container ${
        activeSwipeId === data.id ? "swipe-right" : ""
      }`}
      key={data.id}>
      <div className="flex items-center justify-between p-2 gap-3">
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
          className="flex w-full items-start gap-3">
          <div className="w-full">
            <div className="font-bold text-ellipsis">
              {truncateTitle(data.name, 50)}
            </div>
            <div className="flex items-center justify-between gap-1">
              <div className="text-xs text-base-300">{data.email}</div>
            </div>
          </div>
          <div className="text-right  space-y-1">
            <div className="flex gap-1 items-center">
              {data.roles === "administrator" && (
                <span className="material-symbols-outlined">key</span>
              )}
              <p
                className={`${
                  data.roles === "administrator"
                    ? "text-info-content"
                    : "text-neutral"
                } text-xs capitalize`}>
                {data.roles}
              </p>
            </div>
            <div className="text-xs text-base-300">
              {formatDate(data.created_at)}
            </div>
            <div className="flex gap-1 items-center justify-end text-xs whitespace-nowrap">
              <span className="material-symbols-outlined text-neutral text-xs">
                lock
              </span>

              <p className={`text-neutral`}>
                Admin - Access
              </p>
            </div>
          </div>
        </div>
        <label id={`select-${data.id}`} className="w-1/12 text-right">
          <input
            type="checkbox"
            className="checkbox rounded-full"
            checked={selectedDatas.includes(data.id)} // Use selectedDatas
            onChange={() => handleCheckboxChange(data.id)} // Use handleCheckboxChange
          />
        </label>
      </div>
      {/* Tombol Hapus */}
      {activeSwipeId === data.id && (
        <div
          className="delete-btn absolute right-0 top-0 bottom-0 bg-red-700 text-white w-20 flex justify-center items-center"
          onClick={() => handleDeleteData(data.id)}>
          Delete
        </div>
      )}
    </div>
  );
};

export default RoleListItem;
