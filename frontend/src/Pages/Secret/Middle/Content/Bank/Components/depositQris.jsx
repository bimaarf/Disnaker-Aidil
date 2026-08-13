import React from "react";
import { Bank } from "../bank";
export const DepositQris = () => {
  return (
    <Bank>
      <div className="md:p-6">
        {/* <DepositForm /> */}
        <div
          className={`bg-white/10 text-sm text-error rounded-lg p-4`}
          role="alert"
          tabIndex="-1"
          aria-labelledby="hs-with-description-label">
          <div className="flex">
            <div className="shrink-0">
              <svg
                className="shrink-0 size-4 mt-0.5"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                <path d="M12 9v4"></path>
                <path d="M12 17h.01"></path>
              </svg>
            </div>
            <div className="ms-4">
              <h3
                id="hs-with-description-label"
                className="text-sm text-white whitespace-normal font-body">
                Metode pembayaran ini sedang tidak tersedia. Silahkan deposit
                menggunakan metode pembayaran lainnya.
              </h3>
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-4 brightness-90">
          <button
            disabled
            className="px-4 py-1 w-1/3 h-10 text-pretty rounded font-body uppercase text-xs bg-white/20">
            Kirim
          </button>
        </div>
      </div>
    </Bank>
  );
};
