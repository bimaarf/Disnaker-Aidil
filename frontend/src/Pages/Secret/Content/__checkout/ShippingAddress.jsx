import React, { useState } from "react";

const ShippingAddress = ({ user, setShippingAddress, shippingAddress }) => {
  const [address, setAddress] = useState(shippingAddress || {
    street: user?.address?.street || "",
    city: user?.address?.city || "",
    state: user?.address?.state || "",
    zip: user?.address?.zip || "",
  });

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
    setShippingAddress({ ...address, [name]: value });
  };

  return (
    <div className="bg-base-100 dark:bg-base-200 rounded-xl shadow-sm border border-base-300 p-6 md:p-8">
      <div className="bg-gradient-to-r from-warning rounded-t-lg shadow-lg to-warning px-4 py-3 border-b border-warning">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-white">location_on</span>
          <h2 className="text-lg font-bold text-white uppercase tracking-wide">
            Alamat Pengiriman
          </h2>
        </div>
      </div>
      <div className="mt-4 grid gap-4">
        <div>
          <label className="block text-sm font-medium text-base-content/70 mb-1">
            Jalan
          </label>
          <input
            type="text"
            name="street"
            value={address.street}
            onChange={handleAddressChange}
            className="w-full px-4 py-3 border border-base-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Masukkan alamat jalan"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-base-content/70 mb-1">
              Kota
            </label>
            <input
              type="text"
              name="city"
              value={address.city}
              onChange={handleAddressChange}
              className="w-full px-4 py-3 border border-base-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan kota"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-base-content/70 mb-1">
              Provinsi
            </label>
            <input
              type="text"
              name="state"
              value={address.state}
              onChange={handleAddressChange}
              className="w-full px-4 py-3 border border-base-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan provinsi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-base-content/70 mb-1">
              Kode Pos
            </label>
            <input
              type="text"
              name="zip"
              value={address.zip}
              onChange={handleAddressChange}
              className="w-full px-4 py-3 border border-base-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan kode pos"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingAddress;