import React from "react";

export const DepositHistory = () => {
  return (
    <>
      <div className="mt-4 md:border border-base-300">
        <div className="p-3 bg-gradient-to-t from-yellow-700 to-yellow-500 text-white text-sm uppercase">
          <h1>Account Information</h1>
        </div>
        <div className="p-3">
          <div className="md:flex items-start gap-4 space-y-4 md:space-y-0">
            <div className="md:w-1/2 bg-base-100/10 text-pretty text-sm space-y-4">
              <h1>Status Deposit Terakhir</h1>
              <table className="table">
                <thead className="bg-neutral-500/40">
                  <tr>
                    <th>
                      <p className="font-medium text-pretty">Jumlah</p>
                    </th>
                    <th>
                      <p className="font-medium text-pretty">
                        Tanggal/Waktu (WIB)
                      </p>
                    </th>
                    <th>
                      <p className="font-medium text-pretty">Status</p>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-base-300 border-dashed h-10">
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                  <tr className="border-b border-base-300 border-dashed h-10">
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="md:w-1/2 bg-base-100/10 text-white text-sm space-y-4">
              <h1>Status Deposit Terakhir</h1>
              <table className="table">
                <thead className="bg-neutral-500/40">
                  <tr>
                    <th>
                      <p className="font-medium text-pretty">Jumlah</p>
                    </th>
                    <th>
                      <p className="font-medium text-pretty">
                        Tanggal/Waktu (WIB)
                      </p>
                    </th>
                    <th>
                      <p className="font-medium text-pretty">Status</p>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-base-300 border-dashed h-10">
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                  <tr className="border-b border-base-300 border-dashed h-10">
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
