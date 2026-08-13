import React, { useRef, useEffect } from "react";
import { formatDate } from "../../../../../Context/__formatDate";

const CategoryBlogTable = ({
  datas,
  status,
  sortConfig,
  requestSort,
  handleEditData,
  handleDeleteData,
  truncateTitle,
  handleDelete,
  selectedDatas,
  setSelectedDatas,
}) => {
  const selectAllRef = useRef(null);

  const handleCheckboxChange = (dataId) => {
    setSelectedDatas((prevSelected) =>
      prevSelected.includes(dataId)
        ? prevSelected.filter((id) => id !== dataId)
        : [...prevSelected, dataId]
    );
  };

  const handleSelectAll = (event) => {
    setSelectedDatas(event.target.checked ? datas.map((data) => data.id) : []);
  };

  // Handle indeterminate state for select all checkbox
  useEffect(() => {
    if (selectAllRef.current) {
      const isIndeterminate =
        selectedDatas.length > 0 && selectedDatas.length < datas.length;
      selectAllRef.current.indeterminate = isIndeterminate;
    }
  }, [selectedDatas.length, datas.length]);

  const getSortIcon = (columnKey) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === "desc" ? "↓" : "↑";
    }
    return "↕";
  };

  const SortableHeader = ({ columnKey, children, className = "" }) => (
    <div
      onClick={() => requestSort(columnKey)}
      className={`flex items-center gap-1 cursor-pointer hover:text-primary transition-all duration-200 select-none ${className}`}>
      {children}
      <span className="text-xs opacity-60">{getSortIcon(columnKey)}</span>
    </div>
  );

  if (!datas) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="loading loading-spinner loading-md"></div>
        <span className="ml-2 text-base-content">Loading...</span>
      </div>
    );
  }

  return (
    <div className="bg-base-100 mt-4 rounded-xl shadow-lg border border-base-300 overflow-hidden">
      {/* Bulk Actions Bar */}
      {selectedDatas.length > 0 && (
        <div className="bg-primary/5 border-b border-base-300 px-6 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-base-content">
              {selectedDatas.length} item{selectedDatas.length > 1 ? "s" : ""}{" "}
              selected
            </span>
            <button
              onClick={handleDelete}
              className="btn btn-sm btn-error btn-outline gap-2">
              <span className="material-symbols-outlined text-sm">delete</span>
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="table w-full">
          {/* Table Header */}
          <thead className="bg-base-200/50">
            <tr className="border-b border-base-300">
              <th className="w-16">
                <label className="cursor-pointer">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    onChange={handleSelectAll}
                    checked={
                      selectedDatas.length === datas.length && datas.length > 0
                    }
                  />
                </label>
              </th>
              <th className="min-w-[250px]">
                <SortableHeader columnKey="name">Category Name</SortableHeader>
              </th>
              <th className="min-w-[120px]">
                <SortableHeader columnKey="created_at">
                  Created Date
                </SortableHeader>
              </th>
              <th className="min-w-[180px]">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {datas.length === 0 && status !== "loading" ? (
              <tr>
                <td colSpan="4" className="text-center py-16">
                  <div className="flex flex-col items-center gap-4 text-base-content/60">
                    <div className="w-20 h-20 rounded-full bg-base-200 flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl opacity-30">
                        folder_open
                      </span>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-base-content">
                        No Categories Found
                      </p>
                      <p className="text-sm mt-1">
                        Create your first category to get started
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              datas.map((data, index) => (
                <tr
                  key={data.id}
                  className={`hover:bg-base-200/50 transition-colors duration-200 border-b border-base-300/50 last:border-b-0 ${
                    selectedDatas.includes(data.id)
                      ? "bg-primary/5 border-l-4 border-l-primary"
                      : ""
                  }`}>
                  {/* Checkbox */}
                  <td>
                    <label className="cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={selectedDatas.includes(data.id)}
                        onChange={() => handleCheckboxChange(data.id)}
                      />
                    </label>
                  </td>

                  {/* Category Name with Avatar */}
                  <td>
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {data.image ? (
                          <div className="avatar">
                            <div className="w-12 h-12 rounded-xl ring-2 ring-base-300 ring-offset-2 ring-offset-base-100">
                              <img
                                src={`${process.env.REACT_APP_API}${data.image}`}
                                alt="Category"
                                className="object-cover"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-primary/30 to-primary/60 rounded-xl flex items-center justify-center ring-2 ring-primary/20 ring-offset-2 ring-offset-base-100">
                            <span className="text-lg font-bold text-primary">
                              {data.name?.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-base-content truncate">
                          {truncateTitle(data.name, 50)}
                        </div>
                        <div className="text-sm text-base-content/50 mt-0.5">
                          Category #{index + 1}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Date Column */}
                  <td>
                    <div className="flex items-center gap-2 text-base-content/70">
                      <span className="material-symbols-outlined text-lg">
                        schedule
                      </span>
                      <span className="text-sm font-medium">
                        {formatDate(data.created_at)}
                      </span>
                    </div>
                  </td>

                  {/* Actions Column */}
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditData(data)}
                        className="btn btn-sm btn-ghost text-warning hover:btn-warning gap-1"
                        title="Edit category">
                        <span className="material-symbols-outlined text-base">
                          edit
                        </span>
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteData(data.id)}
                        className="btn btn-sm btn-ghost text-error hover:btn-error gap-1"
                        title="Delete category">
                        <span className="material-symbols-outlined text-base">
                          delete
                        </span>
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryBlogTable;
