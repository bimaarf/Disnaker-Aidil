import React from "react";
import { useNavigate } from "react-router-dom";

export const BoxMenuWallet = ({ data }) => {
  const navigate = useNavigate();
  return (
    <>
      <div className="flex justify-center items-center gap-6 mt-4">
        <div
          onClick={() => navigate("/")}
          className="text-center text-xs font-medium hover:brightness-95 cursor-pointer space-y-1">
          <div className="bg-gradient-to-r from-base-300/80 to-base-300 rounded-xl size-14 flex justify-center items-center">
            <span className="material-symbols-outlined">home</span>
          </div>
          <p>Home</p>
        </div>
        <div
          onClick={() => navigate("/deposit/request")}
          className="text-center text-xs font-medium hover:brightness-95 cursor-pointer space-y-1">
          <div className="bg-gradient-to-r from-base-300/80 to-base-300 rounded-xl size-14 flex justify-center items-center">
            <span className="material-symbols-outlined">add</span>
          </div>
          <p>Isi Saldo</p>
        </div>
        <div
          onClick={() => navigate("/withdraw/request")}
          className="text-center text-xs font-medium hover:brightness-95 cursor-pointer space-y-1">
          <div className="bg-gradient-to-r from-base-300/80 to-base-300 rounded-xl size-14 flex justify-center items-center">
            <span className="material-symbols-outlined">money_bag</span>
          </div>
          <p>Tarik</p>
        </div>
        <div className="dropdown dropdown-left md:dropdown-right dropdown-bottom">
          <div
            tabIndex={0}
            role="button"
            className="text-center text-xs font-medium hover:brightness-95 cursor-pointer space-y-1">
            <div className="bg-gradient-to-r from-base-300/80 to-base-300 rounded-xl size-14 flex justify-center items-center">
              <span className="material-symbols-outlined">more_horiz</span>
            </div>
            <p>More</p>
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
            <li onClick={() => navigate(`/wallets/update/${data.key}`)}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">more_horiz</span>
                <p>Update</p>
              </div>
            </li>
            <li onClick={() => navigate(`/users/account?email=${data.email}`)}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">person</span>
                <p>Profile</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};
