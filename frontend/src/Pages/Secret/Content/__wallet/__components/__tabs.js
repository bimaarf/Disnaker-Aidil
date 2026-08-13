import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "../../../../../features/authentication/AuthSlice";
import { fetchWallets } from "../../../../../features/wallets/walletSlice";

export const TabsFilter = ({ filter, setFilter, handleLoadMore }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  return (
    <>
      <div className="flex justify-start items-center overflow-x-auto gap-4">
        <span className="material-symbols-outlined">notifications_active</span>
        <button
          className={`${
            !filter && "glass"
          } px-4 py-2 text-sm bg-base-200 hover:bg-base-300 rounded active:scale-95 duration-100 `}
          onClick={() => {
            setFilter(null);
            handleLoadMore();
            dispatch(fetchWallets({ fetchAll: true }));
          }}>
          All
        </button>
        <button
          className={`${
            filter === user.email && "glass"
          } px-4 py-2 text-sm bg-base-200 hover:bg-base-300 rounded active:scale-95 duration-100 `}
          onClick={() => {
            setFilter(user.email);
            handleLoadMore();

            dispatch(fetchWallets({ fetchAll: true }));
          }}>
          Current
        </button>
      </div>
    </>
  );
};
