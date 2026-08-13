import React from "react";
import { formatDate } from "../../../../../Context/__formatDate";
import * as LucideIcons from "lucide-react"; // ✨ Import semua icon lucide
import { Trash2, FolderOpen, Clock, Pencil } from "lucide-react";

const CategoryEventTable = ({
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

  // Helper untuk ambil icon sesuai nama
  const DynamicLucideIcon = ({ iconName, className }) => {
    const IconComponent = LucideIcons[iconName];
    // Jika ditemukan sebagai icon, gunakan icon
    if (IconComponent) {
      return <IconComponent className={className} />;
    }
    // Jika bukan icon valid, tampilkan sebagai teks (misal "1")
    return (
      <span className={`text-lg font-semibold ${className}`}>{iconName}</span>
    );
  };

  return (
    <div className="overflow-x-auto bg-base-100 shadow-md rounded-2xl border border-base-200">
      <table className="table w-full">
        <thead className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-base-300">
          <tr className="text-base-content text-sm uppercase tracking-wide">
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
                    <Trash2 className="h-4 w-4" />
                    <span className="font-medium">
                      Delete ({selectedDatas.length})
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => requestSort("name")}
                    className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors duration-200 font-medium">
                    <span>Title</span>
                    <span className="text-xs opacity-60">
                      {getSortIcon("name")}
                    </span>
                  </button>
                )}
              </div>
            </th>

            <th>
              <button
                onClick={() => requestSort("created_at")}
                className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors duration-200 font-medium">
                <span>Date</span>
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
              <td colSpan="4" className="text-center py-8">
                <div className="flex flex-col items-center gap-3 text-base-content/60">
                  <FolderOpen className="h-10 w-10" />
                  <p className="text-lg font-medium">No Categories Found</p>
                  <p className="text-sm">
                    Create your first category to get started
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
                key={data.id}>
                {/* Name Column */}
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

                    {/* Avatar / Dynamic Icon */}
                    <div className="flex-shrink-0">
                      <div className="avatar placeholder">
                        <div className="bg-gradient-to-br from-primary/20 to-primary/40 text-primary h-12 w-12 rounded-xl ring-2 ring-primary/20 flex items-center justify-center">
                          {data.icon ? (
                            <DynamicLucideIcon
                              iconName={data.icon}
                              className="h-6 w-6"
                            />
                          ) : (
                            <span className="text-lg font-semibold">
                              {data.name?.charAt(0).toUpperCase() || "?"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-base-content leading-tight">
                        {truncateTitle(data.name, 50)}
                      </div>
                      <div className="text-sm text-base-content/60 mt-1">
                        Category #{index + 1}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Date Column */}
                <td className="py-4">
                  <div className="flex items-center gap-2 text-base-content/80">
                    <Clock className="h-4 w-4" />
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
                      <Pencil className="h-4 w-4" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteData(data.id)}
                      className="btn btn-sm bg-error/10 text-error hover:bg-error hover:text-white border-none font-medium rounded-lg transition-all duration-200 flex items-center gap-1">
                      <Trash2 className="h-4 w-4" />
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

export default CategoryEventTable;
