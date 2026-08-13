import React from "react";
import { useSwipeable } from "react-swipeable";
import { rupiahFormat } from "../../../../../Context/__rupiahFormat";

const WalletListItem = ({
  data,
  handleDeleteData,
  handlePreviewData,
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
      className={`relative bg-base-100 h-20 place-content-center border select-none border-base-300 cursor-pointer active:bg-base-200 rounded-xl swipe-container ${
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
          <div className="avatar placeholder">
            <div className="bg-base-200 text-neudival-content h-12 w-12 rounded-full">
              <span className="material-symbols-outlined">wallet</span>
            </div>
          </div>
          <div className="w-full">
            <div className="font-bold text-ellipsis">{data.account_name}</div>
            <div className="flex items-center justify-between gap-1">
              <div className="text-xs text-neutral-content/50">
                {data.username}
              </div>
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
            <div className="text-sm font-medium text-primary whitespace-nowrap">
              {rupiahFormat(data.balance)}
            </div>
            <div className="flex gap-1 items-center justify-end text-xs">
              {data.status ? (
                <>
                  <span className="material-symbols-outlined text-success text-sm">
                    content_paste
                  </span>
                  <p className="text-success">Actived</p>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-warning text-sm">
                    sync
                  </span>
                  <p className="text-warning">Suspended</p>
                </>
              )}
            </div>
          </div>
        </div>
        <label id={`select-${data.id}`} className="w-1/12 text-right">
          <input
            type="checkbox"
            className="checkbox rounded-full"
            checked={selectedDatas.includes(data.key)} // Use selectedDatas
            onChange={() => handleCheckboxChange(data.key)} // Use handleCheckboxChange
          />
        </label>
      </div>
      {/* Tombol Hapus */}
      {activeSwipeId === data.id && (
        <div
          className="delete-btn absolute right-0 top-0 bottom-0 bg-red-700 text-white w-20 flex justify-center items-center"
          onClick={() => handleDeleteData(data.key)}>
          Delete
        </div>
      )}
    </div>
  );
};

export default WalletListItem;
