import React from "react";
import { rupiahFormat } from "../../../../../Context/__rupiahFormat";

const WalletsTable = ({
  datas,
  status,
  sortConfig,
  requestSort,
  handlePreviewData,
  handleEditData,
  handleDeleteData,
  formatDate,
  handleDelete,
  selectedDatas,
  setSelectedDatas,
}) => {
  const handleCheckboxChange = (dataKey) => {
    setSelectedDatas((prevSelected) =>
      prevSelected.includes(dataKey)
        ? prevSelected.filter((key) => key !== dataKey)
        : [...prevSelected, dataKey]
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
                  Wallet Account
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
              onClick={() => requestSort("account_number")}
              className="flex items-center">
              Account Number
              {sortConfig.id === "account_number"
                ? sortConfig.direction === "desc"
                  ? "↓"
                  : "↑"
                : ""}
            </div>
          </th>
          <th>
            <div
              onClick={() => requestSort("balance")}
              className="flex items-center">
              Balance
              {sortConfig.balance === "balance"
                ? sortConfig.direction === "desc"
                  ? "↓"
                  : "↑"
                : ""}
            </div>
          </th>
          <th>
            <div
              onClick={() => requestSort("phone_number")}
              className="flex items-center">
              Phone Number
              {sortConfig.phone_number === "phone_number"
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
              {sortConfig.id === "status"
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
              No Wallet found
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
                      checked={selectedDatas.includes(data.key)}
                      onChange={() => handleCheckboxChange(data.key)}
                    />
                  </label>
                  <div className="avatar placeholder">
                    <div className="bg-base-200 text-neudival-content h-12 w-12 rounded-full">
                      <span className="material-symbols-outlined">wallet</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-bold">{data.username}</div>
                    <div className="text-sm opacity-50">{data.email}</div>
                  </div>
                </div>
              </td>
              <td>
                <div className="flex justify-start gap-1 items-center">
                  <span
                    className={`material-symbols-outlined text-neutral-content`}>
                    content_paste
                  </span>
                  <p className="text-neutral-content capitalize">
                    {data?.account_number || "-"}
                  </p>
                </div>
              </td>
              <td>
                <p
                  className={`${
                    data.balance > 0 ? "text-neutral-content" : "text-neutral"
                  } font-medium capitalize`}>
                  {rupiahFormat(data.balance || 0)}
                </p>
              </td>
              <td>
                <div className="flex justify-start gap-1 items-center">
                  <span
                    className={`material-symbols-outlined text-neutral-content`}>
                    call
                  </span>
                  <p className="text-neutral-content capitalize">
                    {data?.phone_number || "-"}
                  </p>
                </div>
              </td>
              <td>
                <div className="flex gap-1 items-center">
                  {data.status ? (
                    <>
                      <span className="material-symbols-outlined text-success text-sm">
                        check
                      </span>
                      <p className="text-success">Active</p>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-warning text-sm">
                        error
                      </span>
                      <p className="text-warning">Suspended</p>
                    </>
                  )}
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

export default WalletsTable;
