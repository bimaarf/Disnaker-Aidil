import React, { useEffect, useState } from "react";
import CategoryEventItem from "./_categoryEventItem";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  FolderOpen,
  Trash2,
} from "lucide-react";

const CategoryEventList = ({
  datas,
  status,
  sortConfig,
  handleEditData,
  requestSort,
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
      <div className="sticky bg-base-100 rounded-b-xl top-12 z-10">
        <div
          className={`${
            isSelect ? "bg-base-200 -mx-2" : "bg-base-100"
          } flex border-b border-base-300 mb-2 justify-between items-start p-2`}>
          {!isSelect && (
            <>
              <div>
                <div
                  onClick={() => requestSort("name")}
                  className="flex items-center pt-2 w-full h-full cursor-pointer hover:text-primary transition-colors duration-200">
                  <span>Title</span>
                  {sortConfig.key === "name" ? (
                    sortConfig.direction === "desc" ? (
                      <ArrowDown className="h-3 w-3 ml-1 opacity-60" />
                    ) : (
                      <ArrowUp className="h-3 w-3 ml-1 opacity-60" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 ml-1 opacity-60" />
                  )}
                </div>
              </div>
              <div>
                <div
                  onClick={() => requestSort("created_at")}
                  className="flex items-center pt-2 w-full h-full cursor-pointer hover:text-primary transition-colors duration-200">
                  <span>Date</span>
                  {sortConfig.key === "created_at" ? (
                    sortConfig.direction === "desc" ? (
                      <ArrowDown className="h-3 w-3 ml-1 opacity-60" />
                    ) : (
                      <ArrowUp className="h-3 w-3 ml-1 opacity-60" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 ml-1 opacity-60" />
                  )}
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
                  className="cursor-pointer text-primary justify-start flex items-center gap-2 text-center">
                  <span>Cancel</span>
                </div>
                <div
                  onClick={handleDelete}
                  className="cursor-pointer text-error flex items-center gap-2 h-8 px-3 rounded-md hover:bg-error hover:text-white transition-all duration-200">
                  <Trash2 className="h-4 w-4" />
                  <span className="font-medium">
                    Delete ({selectedDatas.length})
                  </span>
                </div>
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
          <div className="flex flex-col items-center gap-3 text-base-content/60 py-8">
            <FolderOpen className="h-10 w-10" />
            <p className="text-lg font-medium">No Categories Found</p>
            <p className="text-sm">Create your first category to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {datas.map((data) => (
              <CategoryEventItem
                key={data.id}
                isSelect={isSelect}
                setIsSelect={setIsSelect}
                data={data}
                selectedDatas={selectedDatas}
                onChange={() => handleCheckboxChange(data.id)}
                handleCheckboxChange={handleCheckboxChange}
                handleDeleteData={handleDeleteData}
                handleEditData={handleEditData}
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

export default CategoryEventList;
