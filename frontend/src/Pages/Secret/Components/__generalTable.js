import React from "react";

const GeneralTable = ({
  type,
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
  setSelectedDatas, // Receive setSelectedDatas as a prop
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

  return (
    <table className="table">
      <thead
        className="sticky top-0 z-10 bg-base-100"
        style={{ position: "-webkit-sticky" }}>
        <tr>
          <th className="flex items-center gap-2 w-fit max-w-20 bg-base-100">
            <div className="flex gap-4 items-center">
              <label>
                <input
                  type="checkbox"
                  className="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedDatas.length === datas.length}
                />
              </label>
              {selectedDatas.length > 0 ? (
                <div
                  onClick={handleDelete}
                  className="cursor-pointer text-error flex items-center gap-4 h-6 px-2 duration-200 hover:bg-base-200 w-full">
                  <i className="fas fa-trash"></i>
                  <span>
                    {selectedDatas.length > 0 && `(${selectedDatas.length})`}
                  </span>
                  <p>Delete</p>
                </div>
              ) : (
                <div
                  onClick={() => requestSort("title")}
                  className="flex items-center">
                  Title{" "}
                  {sortConfig.key === "title"
                    ? sortConfig.direction === "desc"
                      ? "↓"
                      : "↑"
                    : ""}
                </div>
              )}
            </div>
          </th>
          <th>
            <div
              onClick={() => requestSort("status")}
              className="flex items-center">
              Status{" "}
              {sortConfig.key === "status"
                ? sortConfig.direction === "desc"
                  ? "↓"
                  : "↑"
                : ""}
            </div>
          </th>
          <th>
            <div
              onClick={() => requestSort("created_at")}
              className="flex items-center">
              Date{" "}
              {sortConfig.key === "created_at"
                ? sortConfig.direction === "desc"
                  ? "↓"
                  : "↑"
                : ""}
            </div>
          </th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {datas.length === 0 && status !== "loading" ? (
          <tr>
            <td colSpan="5" className="text-center">
              No Data found
            </td>
          </tr>
        ) : (
          datas.map((data) => (
            <tr
              className="cursor-pointer hover:bg-base-200 duration-500 ease-in-out"
              key={data.id}>
              <td className="title-cell">
                <div className="flex items-center gap-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={selectedDatas.includes(data.id)} // Use selectedDatas
                      onChange={() => handleCheckboxChange(data.id)} // Use handleCheckboxChange
                    />
                  </label>
                  {data.image ? (
                    <div className="avatar">
                      <div className="mask mask-squircle h-12 w-12 object-cover object-center">
                        <img
                          src={`${process.env.REACT_APP_API}${type}/images/${data.image}`}
                          alt="Avatar"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="avatar placeholder">
                      <div className="bg-neutral text-neutral-content h-12 w-12 rounded-full">
                        <span className="text-3xl">X</span>
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="font-bold">
                      {truncateTitle(data.title, 50)}
                    </div>
                    <div className="text-sm opacity-50">
                      {data.status ? "Visible" : " Hidden"}
                    </div>
                  </div>
                </div>
              </td>
              <td onClick={() => handlePreviewData(data)}>
                <div className="flex gap-1 items-center">
                  <span
                    className={`indicator-item indicator-middle rounded-full indicator-start badge ${
                      data.status ? "badge-success" : "badge-error"
                    }`}></span>
                  <p
                    className={`${
                      data.status ? "text-success" : "text-danger"
                    }`}>
                    {data.status ? "Visible" : "Hidden"}
                  </p>
                </div>
              </td>
              <td>{formatDate(data.created_at)}</td>
              <td>
                <div className="flex items-baseline justify-start gap-2">
                  <button
                    onClick={() => handlePreviewData(data)}
                    className="btn btn-ghost btn-sm bg-base-200/50 font-medium rounded text-pretty">
                    View
                  </button>
                  <button
                    onClick={() => handleEditData(data)}
                    className="btn btn-ghost btn-sm bg-base-200/50 font-medium rounded text-pretty">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteData(data.id)}
                    className="btn btn-ghost btn-sm bg-base-200/50 font-medium rounded text-pretty">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default GeneralTable;
