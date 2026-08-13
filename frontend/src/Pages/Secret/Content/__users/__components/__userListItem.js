import React from "react";
import { useSwipeable } from "react-swipeable";
import { useNavigate } from "react-router-dom";

const UserListItem = ({
  type,
  data,
  handleDeleteData,
  truncateTitle,
  formatDate,
  handleCheckboxChange,
  selectedDatas,
  isSelect,
  activeSwipeId,
  setActiveSwipeId,
}) => {
  const navigate = useNavigate();

  const handlers = useSwipeable({
    onSwipedLeft: () => setActiveSwipeId(data.id),
    onSwipedRight: () => setActiveSwipeId(null),
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  const isActive = activeSwipeId === data.id;
  const isSelected = selectedDatas.includes(data.id);

  return (
    <div className="relative overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm hover:shadow-md transition-all duration-300">
      <div
        {...handlers}
        className={`relative h-20 select-none cursor-pointer transition-transform duration-300 ${
          isActive ? "-translate-x-20" : "translate-x-0"
        } ${
          isSelected ? "bg-primary/5 border-primary/30" : "hover:bg-base-200/50"
        }`}
        key={data.id}>
        <div className="flex items-center h-full p-4 gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {data.avatar && data.avatar !== "default.jpg" ? (
              <div className="avatar">
                <div className="mask mask-squircle h-12 w-12 ring-2 ring-base-300 ring-offset-1">
                  <img
                    src={`${process.env.REACT_APP_API}${type}/images/${data.avatar}`}
                    alt="Avatar"
                    className="object-cover"
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
          </div>

          {/* Info */}
          <div
            onClick={() => {
              if (!isSelect) {
                isActive
                  ? setActiveSwipeId(null)
                  : navigate(`/users/account?email=${data.email}`, {
                      state: { data },
                    });
              } else {
                document.getElementById(`select-${data.id}`).click();
              }
            }}
            className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base-content text-sm leading-tight mb-1 truncate">
                  {truncateTitle(data.name, 40)}
                </h3>
                <div className="flex items-center gap-2 text-xs text-base-content/60">
                  <span className="material-symbols-outlined text-xs">
                    mail
                  </span>
                  <span>{truncateTitle(data.email, 20)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-base-content/60">
                  <span className="material-symbols-outlined text-xs">
                    schedule
                  </span>
                  <span>{formatDate(data.created_at)}</span>
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="flex items-center gap-1 justify-end">
                  {data.roles === "administrator" && (
                    <span className="material-symbols-outlined text-base-content/60 text-xs">
                      key
                    </span>
                  )}
                  <p
                    className={`text-xs capitalize ${
                      data.roles === "administrator"
                        ? "text-info-content"
                        : "text-neutral"
                    }`}>
                    {data.roles}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs justify-end">
                  <span
                    className={`material-symbols-outlined text-xs ${
                      data.status ? "text-success" : "text-error"
                    }`}>
                    {data.status ? "lock_open" : "lock"}
                  </span>
                  <p
                    className={`${
                      data.status ? "text-success" : "text-error"
                    }`}>
                    {data.status ? "Active" : "Suspended"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Checkbox */}
          <div className="flex-shrink-0">
            <label
              id={`select-${data.id}`}
              className="cursor-pointer flex items-center justify-center w-10 h-10 rounded-full hover:bg-base-300/50 transition-colors duration-200">
              <input
                type="checkbox"
                className={`checkbox checkbox-sm rounded-md ${
                  isSelected ? "checkbox-primary" : ""
                }`}
                checked={isSelected}
                onChange={() => handleCheckboxChange(data.id)}
              />
            </label>
          </div>
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
        )}
      </div>

      {/* Delete button slide-in */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-20 bg-error text-error-content flex flex-col items-center justify-center transition-transform duration-300 ${
          isActive ? "translate-x-0" : "translate-x-full"
        }`}>
        <button
          onClick={() => handleDeleteData(data.id)}
          className="w-full h-full flex flex-col items-center justify-center gap-1 hover:bg-error-focus transition-colors duration-200">
          <span className="material-symbols-outlined text-lg">delete</span>
          <span className="text-xs font-medium">Delete</span>
        </button>
      </div>
    </div>
  );
};

export default UserListItem;
