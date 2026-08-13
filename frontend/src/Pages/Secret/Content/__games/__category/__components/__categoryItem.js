import React from "react";
import { useNavigate } from "react-router-dom";
import { useSwipeable } from "react-swipeable";
import { formatDate } from "../../../../../../Context/__formatDate";

const CategoryListItem = ({
  data,
  handleDeleteData,
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
  const navigate = useNavigate();
  return (
    <div
      {...handlers}
      className={`relative h-20 place-content-center border select-none border-base-300 cursor-pointer active:bg-base-200 rounded-xl swipe-container ${
        activeSwipeId === data.id ? "swipe-right" : ""
      }`}
      key={data.id}>
      <div className="flex items-center justify-between p-2 gap-3">
        <div className="avatar placeholder">
          <div className="bg-base-200 text-neudival-content h-12 w-12 rounded-full">
            <span className="material-symbols-outlined">bookmark</span>
          </div>
        </div>
        <div
          onClick={() => {
            if (!isSelect) {
              activeSwipeId === null
                ? navigate(`/games/categories/update/${data?.name}`, {
                    state: { key: data?.name, dataProps: data },
                  })
                : setActiveSwipeId(null);
            } else {
              navigate(`/games/categories/update/${data?.name}`, {
                state: { key: data?.name, dataProps: data },
              });
            }
          }}
          className="flex w-full items-start gap-3">
          <div className="w-full">
            <div className="font-bold text-ellipsis">{data.name}</div>
          </div>
          <div className="text-xs text-neutral">
            {formatDate(data.created_at)}
          </div>
        </div>
        <label id={`select-${data.id}`} className="w-1/12 text-right">
          <input
            type="checkbox"
            className="checkbox rounded-full"
            checked={selectedDatas.includes(data.id)}
            onChange={() => handleCheckboxChange(data.id)}
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

export default CategoryListItem;
