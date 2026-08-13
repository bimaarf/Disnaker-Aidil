import React from "react";

export const AccountInformation = ({ theme, currentUser }) => {
  return (
    <div className="mt-4 md:border border-base-300">
      <div className="p-3 bg-gradient-to-t from-yellow-700 to-yellow-500 text-white text-sm uppercase">
        <h1>Account Information</h1>
      </div>
      <div className="p-3 font-body">
        <div className="md:flex items-start gap-4 space-y-4 md:space-y-0">
          <div
            className={`md:w-1/2 bg-${theme?.name}-100/10 uppercase text-white text-sm font-medium space-y-4 p-4`}>
            <div className="flex items-center gap-4">
              <p className="w-10/12 text-end">Nama Lengkap</p>
              <p className="w-fit">:</p>
              <p className="w-10/12">{currentUser.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="w-10/12 text-end">Email</p>
              <p className="w-fit">:</p>
              <p className="w-10/12">{currentUser.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="w-10/12 text-end">Status</p>
              <p className="w-fit">:</p>
              <div className="w-10/12 flex items-center gap-2">
                <p>{currentUser.status ? "Aktif" : "Ditangguhkan"}</p>
                <span className="material-symbols-outlined">
                  {currentUser.status ? "check" : "lock"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="w-10/12 text-end">Nomor Telepon</p>
              <p className="w-fit">:</p>
              <p className="w-10/12">{currentUser.phone_number}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="w-10/12 text-end">Mata Uang</p>
              <p className="w-fit">:</p>
              <p className="w-10/12">IDR</p>
            </div>
          </div>
          <div
            className={`md:w-1/2 bg-${theme?.name}-100/10 uppercase text-white text-sm font-medium space-y-3 p-4`}>
            <div className="flex justify-between items-start">
              <h1>Detail Perbankan</h1>
              <button
                className={`bg-${theme?.name}-500/30 hover:brightness-90 px-3 py-1 rounded`}>
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            </div>
            <div className="mt-4 bg-neutral-500/40 p-3 rounded">
              <div className="flex items-start justify-between">
                <p className="text-xs">{currentUser.name}</p>
                <div className="flex items-center gap-1 font-bold italic">
                  <span className="material-symbols-outlined">
                    account_balance
                  </span>
                  <p className="text-lg">BCA</p>
                </div>
              </div>
              <p className="text-2xl font-light tracking-widest">1110128818</p>
              <div className="border-t border-base-300 mt-4 pt-2">
                <p className="text-md font-bold">BCA</p>
              </div>
            </div>
            <div className="flex justify-center cursor-pointer">
              <span className="material-symbols-outlined text-yellow-700">
                remove
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
