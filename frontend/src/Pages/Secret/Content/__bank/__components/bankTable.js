import { Eye, Pencil, Trash } from "lucide-react";
import React, { useRef, useEffect } from "react";

const BankTable = ({
  datas,
  status,
  sortConfig,
  requestSort,
  handlePreviewData,
  handleEditData,
  handleDeleteData,
  formatDate,
  truncateTitle,
  handleDelete,
  selectedDatas,
  setSelectedDatas,
}) => {
  const selectAllRef = useRef(null);

  const handleCheckboxChange = (dataId) => {
    setSelectedDatas((prevSelected) =>
      prevSelected.includes(dataId)
        ? prevSelected.filter((key) => key !== dataId)
        : [...prevSelected, dataId]
    );
  };

  const handleSelectAll = (event) => {
    setSelectedDatas(event.target.checked ? datas.map((data) => data.key) : []);
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
        <table className="table w-full table-zebra">
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
              <th className="min-w-[200px]">
                <SortableHeader columnKey="bank_name">Bank Name</SortableHeader>
              </th>
              <th className="min-w-[150px]">
                <SortableHeader columnKey="account_number">
                  Account Number
                </SortableHeader>
              </th>
              <th className="min-w-[120px]">
                <SortableHeader columnKey="status">Status</SortableHeader>
              </th>
              <th className="min-w-[120px]">
                <SortableHeader columnKey="created_at">Created</SortableHeader>
              </th>
              <th className="min-w-[180px] text-center">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {datas.length === 0 && status !== "loading" ? (
              <tr>
                <td colSpan="6" className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-4xl text-base-content/30">
                      account_balance
                    </span>
                    <p className="text-base-content/60">
                      No bank accounts found
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              datas.map((data) => (
                <tr
                  key={data.id}
                  className="hover:bg-base-200/50 transition-colors duration-200 border-b border-base-300/50 last:border-b-0">
                  <td>
                    <label className="cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={selectedDatas.includes(data.key)}
                        onChange={() => handleCheckboxChange(data.key)}
                      />
                    </label>
                  </td>

                  <td>
                    <div className="flex items-center gap-3">
                      {data.image ? (
                        <div className="avatar">
                          <div className="mask mask-squircle h-12 w-12">
                            <img
                              src={`${process.env.REACT_APP_API}${data.image}`}
                              alt="Bank thumbnail"
                              className="object-contain w-full"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="avatar placeholder">
                          <div className="bg-primary/10 text-primary h-12 w-12 mask mask-squircle">
                            <span className="text-lg font-semibold">
                              {data.bank_name?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-base-content truncate">
                          {truncateTitle(data.bank_name, 50)}
                        </div>
                        <div className="text-sm text-base-content/60">
                          {data.receiver_name}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Account Number */}
                  <td>
                    <div className="font-mono text-sm">
                      {data.account_number}
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    <div className="flex items-center gap-2">
                      {data.status === 1 ||
                      data.status === "1" ||
                      data.status === true ? (
                        <>
                          <div className="bg-success/10 text-success text-xs px-2 py-1 flex items-center rounded gap-1">
                            <span className="material-symbols-outlined text-xs">
                              check_circle
                            </span>
                            Active
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-warning/10 text-warning text-xs px-2 py-1 flex items-center rounded gap-1">
                            <span className="material-symbols-outlined text-xs">
                              cancel
                            </span>
                            Inactive
                          </div>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="text-sm text-base-content/80">
                    {formatDate(data.created_at)}
                  </td>

                  {/* Action Buttons */}
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handlePreviewData(data)}
                        className="btn btn-sm btn-ghost text-info hover:bg-info/20"
                        title="View details">
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEditData(data)}
                        className="btn btn-sm btn-ghost text-warning hover:bg-warning/20"
                        title="Edit bank account">
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteData(data.key)}
                        className="btn btn-sm btn-ghost text-error hover:bg-error/20"
                        title="Delete bank account">
                        <Trash size={16} />
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

export default BankTable;
