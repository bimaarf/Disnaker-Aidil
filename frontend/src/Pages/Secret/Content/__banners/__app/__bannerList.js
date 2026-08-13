import React, { useEffect, useState } from "react";
import useIsMobile from "../../../../../Context/__useIsMobile";
import BannerGridItem from "./__bannerGridItem";
import BannerListItem from "./__bannerListItem";

const BannerList = ({
  type,
  datas,
  status,
  sortConfig,
  requestSort,
  handlePreviewData,
  handleDeleteData,
  formatDate,
  handleDelete,
  selectedDatas,
  setSelectedDatas,
}) => {
  const [isSelect, setIsSelect] = useState(false);
  const [activeSwipeId, setActiveSwipeId] = useState(null);

  const handleCheckboxChange = (dataId) => {
    setSelectedDatas((prevSelected) =>
      prevSelected.includes(dataId)
        ? prevSelected.filter((id) => id !== dataId)
        : [...prevSelected, dataId]
    );
    setIsSelect(true);
  };

  const handleSelectAll = (event) => {
    setSelectedDatas(event.target.checked ? datas.map((data) => data.id) : []);
    setIsSelect(true);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsSelect(false);
        setSelectedDatas([]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [setSelectedDatas]);

  const isMobile = useIsMobile();

  return (
    <div>
      <div className="sticky bg-base-100 rounded-b-xl top-0 z-10">
        <div
          className={`${
            isSelect ? "bg-base-200 -mx-2" : "bg-base-100"
          } flex border-b border-base-300 mb-2 justify-between items-start p-2`}>
          {!isSelect && (
            <>
              <div>
                <div
                  onClick={() => requestSort("title")}
                  className="flex items-center pt-2 w-full h-full">
                  Title{" "}
                  {sortConfig.key === "title"
                    ? sortConfig.direction === "desc"
                      ? "↓"
                      : "↑"
                    : "↓↑"}
                </div>
              </div>
              <div>
                <div
                  onClick={() => requestSort("status")}
                  className="flex items-center pt-2 w-full h-full">
                  Status{" "}
                  {sortConfig.key === "status"
                    ? sortConfig.direction === "desc"
                      ? "↓"
                      : "↑"
                    : "↓↑"}
                </div>
              </div>
              <div>
                <div
                  onClick={() => requestSort("created_at")}
                  className="flex items-center pt-2 w-full h-full">
                  Date{" "}
                  {sortConfig.key === "created_at"
                    ? sortConfig.direction === "desc"
                      ? "↓"
                      : "↑"
                    : "↓↑"}
                </div>
              </div>
            </>
          )}
          <div
            className={`flex items-start pt-2 gap-2 ease-linear duration-500 transition-all ${
              isSelect && "w-full h-10"
            }`}>
            <label>
              <input
                id="select-all"
                type="checkbox"
                className={`checkbox rounded-full ${
                  isSelect && "absolute opacity-0"
                }`}
                onChange={handleSelectAll}
                checked={selectedDatas.length === datas.length}
              />
            </label>
            {isSelect && (
              <div className="flex justify-between items-center w-full">
                <div
                  onClick={() => {
                    setIsSelect(false);
                    setSelectedDatas([]);
                  }}
                  className="cursor-pointer text-primary justify-end flex items-center gap-2 text-center">
                  <span>Cancel</span>
                </div>
                <p onClick={handleDelete}>
                  {selectedDatas.length} file(s) selected
                </p>
                <div
                  onClick={() => document.getElementById("select-all").click()}
                  className="cursor-pointer text-primary justify-end flex items-center gap-2 text-center">
                  {selectedDatas.length === datas.length ? (
                    <span>Deselect All</span>
                  ) : (
                    <span>Select All</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={`${!isMobile && "grid grid-cols-2 gap-4 p-4"}`}>
        {datas.length === 0 && status !== "loading" ? (
          <div className="col-span-2 text-center">No Banners found</div>
        ) : (
          datas.map((data) => {
            if (!data) return null;
            return isMobile ? (
              <BannerListItem
                type={type}
                isSelect={isSelect}
                setIsSelect={setIsSelect}
                data={data}
                selectedDatas={selectedDatas}
                handleCheckboxChange={handleCheckboxChange}
                handleDeleteData={handleDeleteData}
                handlePreviewData={handlePreviewData}
                formatDate={formatDate}
                activeSwipeId={activeSwipeId}
                setActiveSwipeId={setActiveSwipeId}
              />
            ) : (
              <BannerGridItem
                type={type}
                isSelect={isSelect}
                setIsSelect={setIsSelect}
                data={data}
                selectedDatas={selectedDatas}
                handleCheckboxChange={handleCheckboxChange}
                handleDeleteData={handleDeleteData}
                handlePreviewData={handlePreviewData}
                formatDate={formatDate}
                activeSwipeId={activeSwipeId}
                setActiveSwipeId={setActiveSwipeId}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default BannerList;
