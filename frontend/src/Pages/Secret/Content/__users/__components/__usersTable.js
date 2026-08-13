import React from "react";
import { useNavigate } from "react-router-dom";

const UsersTable = ({
  type,
  datas,
  status,
  sortConfig,
  requestSort,
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
        ? prevSelected.filter((id) => id !== dataId)
        : [...prevSelected, dataId]
    );
  };

  const handleSelectAll = (event) => {
    setSelectedDatas(event.target.checked ? datas.map((data) => data.id) : []);
  };

  const navigate = useNavigate();

  return (
    <table className="table">
      <thead className="sticky top-0 z-10 bg-base-100">
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
                  <span>({selectedDatas.length})</span>
                  <p>Delete</p>
                </div>
              ) : (
                <div
                  onClick={() => requestSort("name")}
                  className="flex items-center">
                  Title{" "}
                  {sortConfig.id === "name"
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
              onClick={() => requestSort("roles")}
              className="flex items-center">
              Role{" "}
              {sortConfig.id === "roles"
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
              onClick={() => requestSort("phone_number")}
              className="flex items-center">
              Phone{" "}
              {sortConfig.phone_number === "phone_number"
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
              {sortConfig.created_at === "created_at"
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
            <td colSpan="6" className="text-center">
              No Users found
            </td>
          </tr>
        ) : (
          datas.map((data) => (
            <tr
              key={data.id}
              className="cursor-pointer hover:bg-base-200 duration-500 ease-in-out">
              <td className="title-cell">
                <div className="flex items-center gap-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={selectedDatas.includes(data.id)}
                      onChange={() => handleCheckboxChange(data.id)}
                    />
                  </label>
                  {data.avatar && data.avatar !== "default.jpg" ? (
                    <div className="avatar">
                      <div className="mask mask-squircle h-12 w-12 object-cover object-center">
                        <img
                          src={`${process.env.REACT_APP_API}${type}/images/${data.avatar}`}
                          alt="Avatar"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="avatar placeholder">
                      <div className="bg-gradient-to-br from-primary/20 to-primary/40 text-primary h-12 w-12 rounded-xl ring-2 ring-primary/20">
                        <span className="text-lg font-semibold">
                          {data.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="font-bold">
                      {truncateTitle(data.name, 50)}
                    </div>
                    <div className="text-sm opacity-50">{data.email}</div>
                  </div>
                </div>
              </td>
              <td>
                <div className="flex gap-1 items-center">
                  <span
                    className={`material-symbols-outlined ${
                      data.roles === "administrator" ||
                      data.roles === "super admin"
                        ? "text-info"
                        : "text-neutral"
                    }`}>
                    key
                  </span>
                  <p
                    className={`${
                      data.roles === "administrator" ||
                      data.roles === "super admin"
                        ? "text-info"
                        : "text-base-content"
                    } capitalize`}>
                    {data.roles}
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
              <td>
                <div className="flex gap-1 items-center">
                  <span className="material-symbols-outlined text-sm">
                    call
                  </span>
                  <p>{data.phone_number}</p>
                </div>
              </td>
              <td>{formatDate(data.created_at)}</td>
              <td>
                <div className="flex items-baseline justify-start gap-2">
                  <button
                    onClick={() =>
                      navigate(`/users/account?email=${data.email}`, {
                        state: { data },
                      })
                    }
                    className="btn btn-ghost btn-sm bg-base-200/50 font-medium rounded text-pretty">
                    View
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

export default UsersTable;
