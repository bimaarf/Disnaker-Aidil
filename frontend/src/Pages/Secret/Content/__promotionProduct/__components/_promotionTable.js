import React from "react";
import { formatDate } from "../../../../../Context/__formatDate";

const PromotionProductTable = ({
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

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return "↕";
    return sortConfig.direction === "desc" ? "↓" : "↑";
  };

  const getStatusBadge = (status) => {
    return status === 1 || status === "1" ? (
      <span className="badge badge-success badge-sm">Active</span>
    ) : (
      <span className="badge badge-error badge-sm">Inactive</span>
    );
  };

  const isExpired = (expiredDate) => {
    if (!expiredDate) return false;
    return new Date(expiredDate) < new Date();
  };

  return (
    <div className="overflow-x-auto bg-base-100 rounded-l-lg">
      <table className="table w-full">
        <thead className="bg-base-300/50 dark:bg-base-200/50 border-b border-base-300">
          <tr className="text-base-content">
            <th className="w-fit max-w-80">
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className={`checkbox checkbox-sm ${
                      selectedDatas.length > 0 ? "checkbox-primary" : ""
                    }`}
                    onChange={handleSelectAll}
                    checked={
                      selectedDatas.length === datas.length && datas.length > 0
                    }
                  />
                </label>

                {selectedDatas.length > 0 ? (
                  <div
                    onClick={handleDelete}
                    className="cursor-pointer text-error flex items-center gap-2 h-8 px-3 rounded-md hover:bg-error hover:text-white transition-all duration-200">
                    <span className="material-symbols-outlined text-sm">
                      delete
                    </span>
                    <span className="font-medium">
                      Delete ({selectedDatas.length})
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => requestSort("title")}
                    className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors duration-200 font-medium">
                    <span>Title</span>
                    <span className="text-xs opacity-60">
                      {getSortIcon("title")}
                    </span>
                  </button>
                )}
              </div>
            </th>

            <th>
              <button
                onClick={() => requestSort("status")}
                className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors duration-200 font-medium">
                <span>Status</span>
                <span className="text-xs opacity-60">
                  {getSortIcon("status")}
                </span>
              </button>
            </th>
            <th>
              <button
                onClick={() => requestSort("discount_percentage")}
                className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors duration-200 font-medium">
                <span>Promotion</span>
                <span className="text-xs opacity-60">
                  {getSortIcon("discount_percentage")}
                </span>
              </button>
            </th>

            <th>
              <button
                onClick={() => requestSort("referral_code")}
                className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors duration-200 font-medium">
                <span>Referral Code</span>
                <span className="text-xs opacity-60">
                  {getSortIcon("referral_code")}
                </span>
              </button>
            </th>

            <th>
              <button
                onClick={() => requestSort("expired")}
                className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors duration-200 font-medium">
                <span>Expired Date</span>
                <span className="text-xs opacity-60">
                  {getSortIcon("expired")}
                </span>
              </button>
            </th>

            <th>
              <button
                onClick={() => requestSort("created_at")}
                className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors duration-200 font-medium">
                <span>Created Date</span>
                <span className="text-xs opacity-60">
                  {getSortIcon("created_at")}
                </span>
              </button>
            </th>

            <th>
              <span className="font-medium text-base-content/80">Actions</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {datas.length === 0 && status !== "loading" ? (
            <tr>
              <td colSpan="6" className="text-center py-8">
                <div className="flex flex-col items-center gap-3 text-base-content/60">
                  <span className="material-symbols-outlined text-4xl">
                    folder_open
                  </span>
                  <p className="text-lg font-medium">No Promotions Found</p>
                  <p className="text-sm">
                    Create your first promotion to get started
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            datas.map((data, index) => (
              <tr
                className={`hover:bg-base-200/50 transition-all duration-300 ${
                  selectedDatas.includes(data.id)
                    ? "bg-primary/5 border-l-4 border-l-primary"
                    : ""
                }`}
                key={index}>
                {/* Title Column */}
                <td className="py-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className={`checkbox checkbox-sm ${
                          selectedDatas.includes(data.id)
                            ? "checkbox-primary"
                            : ""
                        }`}
                        checked={selectedDatas.includes(data.id)}
                        onChange={() => handleCheckboxChange(data.id)}
                      />
                    </label>

                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {data.image ? (
                        <div className="avatar">
                          <div className="mask mask-squircle h-12 w-12 ring-2 ring-base-300 ring-offset-1">
                            <img
                              src={`${process.env.REACT_APP_API}${data.image}`}
                              alt="Promotion"
                              className="object-cover"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="avatar placeholder">
                          <div className="bg-gradient-to-br from-primary/20 to-primary/40 text-primary h-12 w-12 rounded-xl ring-2 ring-primary/20">
                            <span className="text-lg font-semibold">
                              {data.title?.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-base-content leading-tight">
                        {truncateTitle(data.title, 50)}
                      </div>
                      <div className="text-sm text-base-content/60 mt-1">
                        Key: {data.key}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Status Column */}
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(data.status)}
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    {data.discount_percentage}{" %"}
                  </div>
                </td>

                {/* Referral Code Column */}
                <td className="py-4">
                  <div className="flex items-center gap-2 text-base-content/80">
                    {data.referral_code ? (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">
                          confirmation_number
                        </span>
                        <span className="text-sm font-mono bg-base-200 px-2 py-1 rounded">
                          {data.referral_code}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-base-content/40 italic">
                        No referral code
                      </span>
                    )}
                  </div>
                </td>

                {/* Expired Date Column */}
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    {data.expired ? (
                      <div
                        className={`flex items-center gap-2 ${
                          isExpired(data.expired)
                            ? "text-error"
                            : "text-base-content/80"
                        }`}>
                        <span className="material-symbols-outlined text-sm">
                          {isExpired(data.expired) ? "schedule" : "event"}
                        </span>
                        <span className="text-sm">
                          {formatDate(data.expired)}
                        </span>
                        {isExpired(data.expired) && (
                          <span className="badge badge-error badge-xs">
                            Expired
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-success">
                        <span className="material-symbols-outlined text-sm">
                          all_inclusive
                        </span>
                        <span className="text-sm">Never expires</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Created Date Column */}
                <td className="py-4">
                  <div className="flex items-center gap-2 text-base-content/80">
                    <span className="material-symbols-outlined text-sm">
                      schedule
                    </span>
                    <span className="text-sm">
                      {formatDate(data.created_at)}
                    </span>
                  </div>
                </td>

                {/* Actions Column */}
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditData(data)}
                      className="btn btn-sm bg-warning/10 text-warning hover:bg-warning hover:text-white border-none font-medium rounded-lg transition-all duration-200 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        edit
                      </span>
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteData(data.id)}
                      className="btn btn-sm bg-error/10 text-error hover:bg-error hover:text-white border-none font-medium rounded-lg transition-all duration-200 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
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
  );
};

export default PromotionProductTable;
