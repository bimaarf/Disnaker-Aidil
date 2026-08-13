import { Eye, Globe, Pencil, Tag, Trash } from "lucide-react";
import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatRupiah } from "../../../../../utils/rupiahInput";

const ProductTable = ({
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
  const navigate = useNavigate();
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
              <th className="min-w-[200px]">
                <SortableHeader columnKey="name">Title</SortableHeader>
              </th>
              <th className="min-w-[120px]">
                <SortableHeader columnKey="status">Status</SortableHeader>
              </th>
              <th className="min-w-[140px]">
                <SortableHeader columnKey="category">Category</SortableHeader>
              </th>
              <th className="min-w-[140px]">
                <SortableHeader columnKey="promotion">Promotion</SortableHeader>
              </th>
              <th className="min-w-[140px]">
                <SortableHeader columnKey="price">Price</SortableHeader>
              </th>
              <th className="min-w-[120px]">
                <SortableHeader columnKey="author">Author</SortableHeader>
              </th>
              <th className="min-w-[120px]">
                <SortableHeader columnKey="created_at">Date</SortableHeader>
              </th>
              <th className="min-w-[100px]">Preview</th>
              <th className="min-w-[180px]">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {datas.length === 0 && status !== "loading" ? (
              <tr>
                <td colSpan="8" className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-4xl text-base-content/30">
                      inbox
                    </span>
                    <p className="text-base-content/60">
                      No product posts found
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
                              alt="Product thumbnail"
                              className="object-cover"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="avatar placeholder">
                          <div className="bg-primary/10 text-primary h-12 w-12 mask mask-squircle">
                            <span className="text-lg font-semibold">
                              {data.name?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-base-content truncate">
                          {truncateTitle(data.name, 50)}
                        </div>
                        <div className="text-sm text-base-content/60">
                          {data.status === 1 || data.status === "1"
                            ? "Published"
                            : "Draft"}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    <div className="flex items-center gap-2">
                      {data.status === 1 || data.status === "1" ? (
                        <>
                          <div className="bg-success/10 text-success text-xs px-1.5 py-0.5 flex items-center rounded gap-1">
                            <span className="material-symbols-outlined text-xs">
                              check_circle
                            </span>
                            Published
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-warning/10 text-warning text-xs px-1.5 py-0.5 flex items-center rounded gap-1">
                            <span className="material-symbols-outlined text-xs">
                              schedule
                            </span>
                            Draft
                          </div>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Categories */}
                  <td>
                    <div className="flex flex-wrap gap-1 max-w-[140px]">
                      {data.categories?.slice(0, 2).map((category, index) => (
                        <div
                          key={index}
                          className="bg-primary/20 flex items-center gap-1 text-primary px-1.5 text-xs rounded-full">
                          <Tag size={10} />
                          <p>{category.name}</p>
                        </div>
                      ))}
                      {data.categories?.length > 2 && (
                        <div className="bg-ghost px-1.5 text-xs rounded-full">
                          +{data.categories.length - 2}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1 max-w-[140px]">
                      {data.promotions?.slice(0, 2).map((promotion, index) => (
                        <div
                          key={index}
                          className="bg-primary/20 flex items-center gap-1 text-primary px-1.5 text-xs rounded-full">
                          <Tag size={10} />
                          <p>{promotion.title}</p>
                        </div>
                      ))}
                      {data.promotions?.length > 2 && (
                        <div className="bg-ghost px-1.5 text-xs rounded-full">
                          +{data.promotions.length - 2}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="bg-warning/10 text-warning text-xs px-1.5 py-0.5 flex items-center rounded gap-1">
                        {formatRupiah(data.price)}
                      </div>
                    </div>
                  </td>

                  {/* Author */}
                  <td>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="material-symbols-outlined text-base-content/60">
                        person
                      </span>
                      <span className="truncate">
                        {data.author?.name || "Unknown"}
                      </span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="text-sm text-base-content/80">
                    {formatDate(data.created_at)}
                  </td>

                  {/* Preview Button */}
                  <td>
                    <button
                      disabled={data.status == 0}
                      onClick={() => navigate(`/product/${data.key}`)}
                      className="btn btn-sm btn-ghost bg-warning/10 text-warning gap-1"
                      title="Preview product post">
                      <Globe size={12} />
                      Preview
                    </button>
                  </td>

                  {/* Action Buttons */}
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePreviewData(data)}
                        className="btn btn-sm btn-ghost text-info hover:btn-info"
                        title="View details">
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleEditData(data)}
                        className="btn btn-sm btn-ghost text-warning hover:btn-warning"
                        title="Edit product post">
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteData(data.key)}
                        className="btn btn-sm btn-ghost text-error hover:btn-error"
                        title="Delete product post">
                        <Trash size={18} />
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

export default ProductTable;
