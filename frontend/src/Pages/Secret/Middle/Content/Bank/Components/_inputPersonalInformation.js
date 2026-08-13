import React, { useState } from "react";

export const InputPersonalInformation = () => {
  const [formInput, setInput] = useState({
    name: "",
    gender: "Perempuan",
    address: "",
    postalCode: "",
    province: "",
    country: "",
  });
  const handleChange = (e) => {
    e.persist();
    setInput({ ...formInput, [e.target.name]: e.target.value });
  };
  return (
    <>
      <div className="mt-4 font-mono -tracking-wide text-[13px] space-y-4">
        <div className="flex items-center">
          <p className="w-5/12">Nama Pengguna</p>
          <p className="w-1/12 flex items-center">
            <i className="fas fa-circle text-[5px] text-red-600"></i>
          </p>
          <div className="form-control w-6/12">
            <input
              className="px-2 py-2 outline-none border border-base-300 focus:border-yellow-600 rounded bg-base-100/50"
              value={formInput.name}
              type="text"
              name="name"
              placeholder="Nama Pengguna"
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="flex items-center">
          <p className="w-5/12">Jenis Kelamin</p>
          <p className="w-1/12 flex items-center">
            <i className="fas fa-circle text-[5px] text-red-600"></i>
          </p>
          <div className="form-control w-6/12">
            <select
              onChange={handleChange}
              name="gender"
              defaultValue={formInput.gender}
              className="select outline-none border border-base-300 focus:border-yellow-600 rounded bg-base-100/50">
              <option disabled value={""}>
                -- Pilih Jenis Kelamin --
              </option>
              <option value={"Laki-Laki"}>Laki-laki</option>
              <option value={"Perempuan"}>Perempuan</option>
            </select>
          </div>
        </div>
        <div className="flex items-baseline">
          <p className="w-5/12">Alamat</p>
          <p className="w-1/12 flex items-center">
            <i className="fas fa-circle text-[5px] text-red-600"></i>
          </p>
          <div className="form-control w-6/12">
            <textarea
              rows={5}
              className="px-2 py-2 outline-none border border-base-300 focus:border-yellow-600 rounded bg-base-100/50"
              value={formInput.address}
              type="text"
              name="address"
              placeholder="Alamat"
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="flex items-center">
          <p className="w-5/12">Kode Pos</p>
          <p className="w-1/12 flex items-center">
            <i className="fas fa-circle text-[5px] text-red-600"></i>
          </p>
          <div className="form-control w-6/12">
            <input
              inputMode="numeric" // Memunculkan keyboard numerik
              className="px-2 py-2 outline-none border border-base-300 focus:border-yellow-600 rounded bg-base-100/50"
              value={formInput.postalCode}
              type="tel"
              name="postalCode"
              placeholder="Kode Pos"
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="flex items-center">
          <p className="w-5/12">Provinsi</p>
          <p className="w-1/12 flex items-center">
            <i className="fas fa-circle text-[5px] text-red-600"></i>
          </p>
          <div className="form-control w-6/12">
            <input
              className="px-2 py-2 outline-none border border-base-300 focus:border-yellow-600 rounded bg-base-100/50"
              value={formInput.province}
              type="text"
              name="province"
              placeholder="Provinsi"
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="flex items-center">
          <p className="w-5/12">Negara</p>
          <p className="w-1/12 flex items-center">
            <i className="fas fa-circle text-[5px] text-red-600"></i>
          </p>
          <div className="form-control w-6/12">
            <input
              className="px-2 py-2 outline-none border border-base-300 focus:border-yellow-600 rounded bg-base-100/50"
              value={formInput.country}
              type="text"
              name="country"
              placeholder="Negara"
              onChange={handleChange}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-center border-t border-yellow-700 pt-4 mt-4">
        <button className="py-2 px-4 md:w-1/3 bg-gradient-to-t from-yellow-700 to-yellow-500 text-white hover:brightness-90 rounded">
          Simpan Data
        </button>
      </div>
    </>
  );
};
