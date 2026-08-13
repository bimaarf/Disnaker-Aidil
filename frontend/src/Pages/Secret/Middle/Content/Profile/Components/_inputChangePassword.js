import React, { useState } from "react";

export const InputChangePassword = () => {
  const [formInput, setInput] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const handleChange = (e) => {
    e.persist();
    setInput({ ...formInput, [e.target.name]: e.target.value });
  };
  return (
    <>
      <div className="mt-4 font-body -tracking-wide text-[13px] space-y-4">
        <div className="flex items-center gap-4">
          <p className="w-10/12">Kata Sandi Saat Ini</p>
          <p className="w-fit flex items-center">
            <i className="fas fa-circle text-[5px] text-red-600"></i>
          </p>
          <div className="form-control w-full">
            <input
              className="px-2 py-2 outline-none border border-base-300 focus:border-yellow-600 rounded bg-base-100/50"
              value={formInput.currentPassword}
              type="password"
              name="currentPassword"
              placeholder="Kata Sandi Saat Ini"
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="w-10/12">Kata Sandi Baru</p>
          <p className="w-fit flex items-center">
            <i className="fas fa-circle text-[5px] text-red-600"></i>
          </p>
          <div className="form-control w-full">
            <input
              className="px-2 py-2 outline-none border border-base-300 focus:border-yellow-600 rounded bg-base-100/50"
              value={formInput.newPassword}
              type="password"
              name="newPassword"
              placeholder="Kata Sandi Baru"
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="w-10/12">Ulangi Kata Sandi</p>
          <p className="w-fit flex items-center">
            <i className="fas fa-circle text-[5px] text-red-600"></i>
          </p>
          <div className="form-control w-full">
            <input
              className="px-2 py-2 outline-none border border-base-300 focus:border-yellow-600 rounded bg-base-100/50"
              value={formInput.confirmPassword}
              type="password"
              name="confirmPassword"
              placeholder="Ulangi Kata Sandi"
              onChange={handleChange}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-center border-t border-yellow-700 pt-4 mt-4">
        <button className="py-2 px-4 md:w-1/3 bg-gradient-to-t from-yellow-700 to-yellow-500 text-white hover:brightness-90 rounded">
          Ubah Kata Sandi
        </button>
      </div>
    </>
  );
};
