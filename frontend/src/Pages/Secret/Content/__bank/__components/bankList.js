import React from "react";

const BankList = ({
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

  if (!datas) {
    return <div className="text-base-content text-center p-4">Loading...</div>;
  }

  return (
    <div className="mt-4">
      {/* Header Controls */}
      <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className={`checkbox ${
                  selectedDatas.length > 0 && "checkbox-primary"
                } bg-base-100`}
                onChange={handleSelectAll}
                checked={selectedDatas.length === datas.length}
              />
              <span className="text-sm text-base-content">Select All</span>
            </label>
            {selectedDatas.length > 0 && (
              <div
                onClick={handleDelete}
                className="cursor-pointer text-error flex items-center gap-2 h-8 px-3 rounded-md hover:bg-error hover:text-white transition-colors duration-200">
                <span className="material-symbols-outlined text-sm">
                  delete
                </span>
                <span className="text-sm">Delete ({selectedDatas.length})</span>
              </div>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-base-content/60">Sort by:</span>
            {[
              { key: "bank_name", label: "Bank Name" },
              { key: "status", label: "Status" },
              { key: "account_number", label: "Account Number" },
              { key: "author", label: "Author" },
              { key: "created_at", label: "Date" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => requestSort(key)}
                className={`btn btn-xs ${
                  sortConfig.key === key ? "btn-primary" : "btn-ghost"
                } transition-colors duration-200`}>
                {label}
                {sortConfig.key === key &&
                  (sortConfig.direction === "desc" ? " ↓" : " ↑")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {datas.length === 0 && status !== "loading" ? (
        <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-lg shadow-sm p-8 text-center">
          <div className="text-base-content/60">
            <span className="material-symbols-outlined text-6xl mb-4 block">
              article
            </span>
            <p className="text-lg">No Bank Posts Found</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {datas.map((data) => (
            <div
              key={data.id}
              className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
              {/* Card Header with Checkbox and Image */}
              <div className="relative">
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    className={`checkbox checkbox-sm ${
                      selectedDatas.length > 0 && "checkbox-primary"
                    } bg-white shadow-md`}
                    checked={selectedDatas.includes(data.key)}
                    onChange={() => handleCheckboxChange(data.key)}
                  />
                </div>

                {data.images?.length > 0 ? (
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={`${process.env.REACT_APP_API}${
                        data.images.find((img) => img.is_primary === 1)
                          ?.image_data || data.images[0]?.image_data
                      }`}
                      alt="Bank cover"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-primary/60">
                      article
                    </span>
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  {data.status || data.status === "1" ? (
                    <div className="badge badge-success badge-sm gap-1">
                      <span className="material-symbols-outlined text-xs">
                        check_circle
                      </span>
                      Available
                    </div>
                  ) : (
                    <div className="badge badge-ghost badge-sm gap-1">
                      <span className="material-symbols-outlined text-xs">
                        error
                      </span>
                      Hidden
                    </div>
                  )}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4">
                {/* Title */}
                <h3 className="font-semibold text-base-content mb-2 line-clamp-2">
                  {truncateTitle(data.bank_name, 60)}
                </h3>

                {/* Author & Date */}
                <div className="md:flex items-center justify-between text-sm text-base-content/60 mb-4">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">
                      person
                    </span>
                    <span>{data.author?.bank_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">
                      schedule
                    </span>
                    <span>{formatDate(data.created_at)}</span>
                  </div>
                </div>

                {/* Actions - Option 1: With Dropdown Menu */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    disabled={data.status === 0}
                    onClick={() => handlePreviewData(data)}
                    className="btn btn-sm btn-primary flex-1">
                    <span className="material-symbols-outlined text-sm">
                      visibility
                    </span>
                    Preview
                  </button>

                  {/* DROPDOWN MENU DISINI */}
                  <div className="dropdown dropdown-top dropdown-left">
                    <div
                      tabIndex={0}
                      role="button"
                      className="btn btn-sm btn-ghost btn-circle">
                      <span className="material-symbols-outlined">
                        more_vert
                      </span>
                    </div>
                    <ul
                      tabIndex={0}
                      className="dropdown-content menu bg-base-100 rounded-box z-[1] w-40 p-2 shadow-lg border border-base-300">
                      <li>
                        <button
                          onClick={() => handlePreviewData(data)}
                          className="flex items-center gap-2 text-info hover:bg-info/10">
                          <span className="material-symbols-outlined text-sm">
                            visibility
                          </span>
                          View
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleEditData(data)}
                          className="flex items-center gap-2 text-warning hover:bg-warning/10">
                          <span className="material-symbols-outlined text-sm">
                            edit
                          </span>
                          Edit
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleDeleteData(data.key)}
                          className="flex items-center gap-2 text-error hover:bg-error/10">
                          <span className="material-symbols-outlined text-sm">
                            delete
                          </span>
                          Delete
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
                {/* <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => navigate(`/bank/${data.key}`)}
                    className="btn btn-xs btn-primary">
                    Preview
                  </button>
                  <button
                    onClick={() => handlePreviewData(data)}
                    className="btn btn-xs btn-info">
                    View
                  </button>
                  <button
                    onClick={() => handleEditData(data)}
                    className="btn btn-xs btn-warning">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteData(data.key)}
                    className="btn btn-xs btn-error">
                    Delete
                  </button>
                </div> */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BankList;
