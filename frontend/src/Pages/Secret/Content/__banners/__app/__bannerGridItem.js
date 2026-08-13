import React from "react";
import { useSwipeable } from "react-swipeable";

const BannerGridItem = ({
  data,
  handleDeleteData,
  handlePreviewData,
  selectedDatas,
  handleCheckboxChange,
  activeSwipeId,
  setActiveSwipeId,
}) => {
  const handlers = useSwipeable({
    onSwipedLeft: () => setActiveSwipeId(data.id),
    onSwipedRight: () => setActiveSwipeId(null),
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  const isSelected = selectedDatas.includes(data.id);

  const handleClick = (e) => {
    if (e.target.type !== "checkbox") {
      if (selectedDatas.length < 1) {
        handlePreviewData(data);
      } else {
        document.getElementById(`banner-${data.id}`).click();
      }
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    handleDeleteData(data.id);
  };

  return (
    <div
      {...handlers}
      className={`group block relative overflow-hidden rounded-lg
        ${selectedDatas.length < 1 ? "cursor-zoom-in" : "cursor-pointer"}
         ${activeSwipeId === data.id ? "bg-gray-200" : ""}`}
      onClick={handleClick}>
      <img
        className="w-full size-40 object-cover bg-gray-100 rounded-lg dark:bg-neutral-800"
        src={`${process.env.REACT_APP_API}banners/images/${data.image}`}
        alt={data.key}
      />
      <div className="absolute bottom-1 right-1 opacity-0 hover:opacity-100 transition">
        <div className="flex items-center gap-1 py-1 px-2 bg-white border border-gray-200 rounded-lg">
          <span className="text-xs">View</span>
        </div>
      </div>
      {activeSwipeId === data.id && (
        <div
          className="absolute right-0 top-0 bottom-0 bg-red-700 text-white w-20 flex justify-center items-center"
          onClick={handleDeleteClick}>
          Delete
        </div>
      )}
      <label className="absolute z-10 flex items-center top-1 right-1 rounded-full">
        <input
          id={`banner-${data.id}`}
          type="checkbox"
          className={`checkbox rounded-full ${
            selectedDatas.length < 1 ? "bg-base-100/20" : "bg-base-300/80"
          }`}
          checked={isSelected}
          onChange={() => handleCheckboxChange(data.id)} // Correctly passing the handler
        />
      </label>
    </div>
  );
};

export default BannerGridItem;
