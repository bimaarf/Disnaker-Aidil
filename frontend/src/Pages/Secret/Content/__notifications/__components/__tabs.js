import React from "react";
import { useDispatch } from "react-redux";
import { fetchNotifications } from "../../../../../features/notifications/notificationSlice";

export const TabsFilter = ({ filter, setFilter, handleLoadMore }) => {
  const dispatch = useDispatch();
  return (
    <>
      <div className="flex justify-start items-center overflow-x-auto gap-4">
        <span className="material-symbols-outlined">notifications_active</span>
        <button
          className={`${
            !filter && "glass"
          } px-4 py-2 text-sm bg-base-200 hover:bg-base-300 rounded active:scale-95 duration-100`}
          onClick={() => {
            setFilter(null);
            handleLoadMore();
            dispatch(fetchNotifications({ fetchAll: true }));
          }}>
          All
        </button>
        <button
          className={`${
            filter === "Account" && "glass"
          } px-4 py-2 text-sm bg-base-200 hover:bg-base-300 rounded active:scale-95 duration-100`}
          onClick={() => {
            setFilter("Account");
            handleLoadMore();
            dispatch(fetchNotifications({ fetchAll: true }));
          }}>
          Account
        </button>
      </div>
    </>
  );
};
