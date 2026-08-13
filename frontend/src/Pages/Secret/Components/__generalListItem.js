import React from "react";
import { useSwipeable } from "react-swipeable";

const GeneralListItem = ({
  type,
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
        {/* Informasi Game */}
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
          {data.image ? (
            <div className="avatar">
              <div className="mask mask-squircle h-12 w-12 object-cover object-center">
                <img
                  src={`${process.env.REACT_APP_API}${type}/images/${data.image}`}
                  alt="Avatar"
                />
              </div>
            </div>
          ) : (
            <div className="avatar placeholder">
              <div className="bg-neudival text-neudival-content h-12 w-12 rounded-full">
                <span className="text-3xl">X</span>
              </div>
            </div>
          )}
          <div className="w-full">
            <div className="font-medium text-sm text-ellipsis">
              {truncateTitle(data.title, 50)}
            </div>
            <div className="flex items-start justify-between gap-1">
              {data.body && (
                <div className="text-xs text-neutral prose">{data.body}</div>
              )}
              {data.description && (
                <div className="text-xs text-neutral prose">
                  {formatDate(data.created_at)}
                </div>
              )}
              <div className="text-end">
                <div className="flex gap-1 items-center justify-start text-xs">
                  {data.status ? (
                    <span className="material-symbols-outlined text-success text-xs">
                      lock_open
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-error text-xs">
                      lock
                    </span>
                  )}

                  <p
                    className={`${
                      data.status ? "text-success" : "text-danger"
                    }`}>
                    {data.status ? "Visible" : "Hidden"}
                  </p>
                </div>
                {data.body && (
                  <div className="text-xs text-neutral">
                    {formatDate(data.created_at)}
                  </div>
                )}
              </div>
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

export default GeneralListItem;
