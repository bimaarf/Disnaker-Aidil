import React from "react";
import { rupiahFormat } from "../../../../../Context/__rupiahFormat";

const WithdrawTable = ({
  datas,
  status,
  sortConfig,
  requestSort,
  handlePreviewData,
  handleDeleteData,
  truncateTitle,
  handleDelete,
  selectedDatas,
  setSelectedDatas, // Receive setSelectedDatas as a prop
}) => {
  const handleCheckboxChange = (withdrawKeys) => {
    setSelectedDatas((prevSelected) =>
      prevSelected.includes(withdrawKeys)
        ? prevSelected.filter((key) => key !== withdrawKeys)
        : [...prevSelected, withdrawKeys]
    );
  };

  const handleSelectAll = (event) => {
    setSelectedDatas(event.target.checked ? datas.map((data) => data.key) : []);
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
                  onClick={() => requestSort("username")}
                  className="flex items-center">
                  Username{" "}
                  {sortConfig.username === "username"
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
              onClick={() => requestSort("amount")}
              className="flex items-center">
              Amount{" "}
              {sortConfig.amount === "amount"
                ? sortConfig.direction === "desc"
                  ? "↓"
                  : "↑"
                : ""}
            </div>
          </th>
          <th>
            <div
              onClick={() => requestSort("payment")}
              className="flex items-center">
              Wallet{" "}
              {sortConfig.payment === "payment"
                ? sortConfig.direction === "desc"
                  ? "↓"
                  : "↑"
                : ""}
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
              No Withdraw found
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
                      onChange={() => handleCheckboxChange(data.key)} // Use handleCheckboxChange
                    />
                  </label>
                  <div className="avatar placeholder">
                    <div className="bg-base-200 text-neudival-content h-12 w-12 rounded-full">
                      <span className="material-symbols-outlined">
                        arrow_outward
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="font-bold">
                      {truncateTitle(data.username, 50)}
                    </div>
                    <div className="text-sm opacity-50">
                      {data.status ? "Approved" : "Pending"}
                    </div>
                  </div>
                </div>
              </td>
              <td>{rupiahFormat(data.amount)}</td>
              <td>{data.account_name}</td>
              <td onClick={() => handlePreviewData(data)}>
                <div className="flex gap-0.5 items-center justify-start text-xs">
                  {data.status ? (
                    <>
                      <span className="material-symbols-outlined text-success text-sm">
                        content_paste
                      </span>
                      <p className="text-success">Complete</p>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-warning text-sm">
                        sync
                      </span>
                      <p className="text-warning">Pending</p>
                    </>
                  )}
                </div>
              </td>
              <td>{data.created_at}</td>
              <td>
                <div className="flex items-baseline justify-start gap-2">
                  <button
                    onClick={() => handlePreviewData(data)}
                    className="btn btn-ghost btn-sm bg-base-200/50 font-medium rounded text-pretty">
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteData(data.key)}
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

export default WithdrawTable;
