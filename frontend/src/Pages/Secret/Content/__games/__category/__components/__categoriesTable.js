import React from "react";

const CategoriesTable = ({
  datas,
  status,
  sortConfig,
  requestSort,
  handleEditData,
  handleDeleteData,
  formatDate,
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
        className="sticky top-0 z-50 bg-base-100"
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
                  onClick={() => requestSort("name")}
                  className="flex items-center">
                  Name{" "}
                  {sortConfig.name === "name"
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
              onClick={() => requestSort("created_at")}
              className="flex items-center">
              Date{" "}
              {sortConfig.id === "created_at"
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
              No Categories found
            </td>
          </tr>
        ) : (
          datas.map((data, key) => (
            <tr
              key={key}
              className="cursor-pointer hover:bg-base-200 duration-500 ease-in-out"
              id={data.id}>
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

                  <div>
                    <div className="font-bold">{data.name}</div>
                  </div>
                </div>
              </td>
              <td>{formatDate(data.created_at)}</td>
              <td>
                <div className="flex items-baseline justify-start gap-2">
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

export default CategoriesTable;
