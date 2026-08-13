import React, { useEffect, useState } from "react";
import GeneralListItem from "./__generalListItem";

const GeneralList = ({
  type,
  datas,
  status,
  sortConfig,
  requestSort,
  handlePreviewData,
  handleDeleteData,
  formatDate,
  truncateTitle,
  handleDelete,
  selectedDatas,
  setSelectedDatas, // Receive setSelectedDatas as a prop
}) => {
  const [isSelect, setIsSelect] = useState(false);
  const [activeSwipeId, setActiveSwipeId] = useState(null); // State untuk menyimpan ID data yang sedang diswipe

  const handleCheckboxChange = (dataKey) => {
    setSelectedDatas((prevSelected) =>
      prevSelected.includes(dataKey)
        ? prevSelected.filter((key) => key !== dataKey)
        : [...prevSelected, dataKey]
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

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [setSelectedDatas]);

  return (
    <div>
      <div className="sticky bg-base-100 rounded-b-xl top-0 z-50">
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
                  {sortConfig.title === "title"
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
                  {isSelect && `${selectedDatas.length}`} file(s) selected
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
      <div className="space-y-2">
        {datas.length === 0 && status !== "loading" ? (
          <div>
            <div colSpan="5" className="text-center">
              No Games found
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {datas.map((data) => (
              <GeneralListItem
                key={data.id}
                type={type}
                isSelect={isSelect}
                setIsSelect={setIsSelect}
                data={data}
                selectedDatas={selectedDatas}
                onChange={() => handleCheckboxChange(data.id)}
                handleCheckboxChange={handleCheckboxChange}
                handleDeleteData={handleDeleteData}
                handlePreviewData={handlePreviewData}
                truncateTitle={truncateTitle}
                formatDate={formatDate}
                activeSwipeId={activeSwipeId}
                setActiveSwipeId={setActiveSwipeId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneralList;
