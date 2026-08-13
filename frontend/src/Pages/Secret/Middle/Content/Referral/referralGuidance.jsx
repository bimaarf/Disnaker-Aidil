import React from "react";
import { Referral } from "./referral";
export const ReferralGuidance = () => {
  const data = [
    {
      icon: "percent",
      title: "Komisi Referral",
      body: "Tarik komisi dari referral yang sudah Anda miliki sebelumnya dan nikmati hasilnya.",
    },
    {
      icon: "share",
      title: "Kemudahan Berbagi Referral",
      body: "Berbagi kode referral Anda ke player lain dengan mudah dan cepat.",
    },
    {
      icon: "article",
      title: "Ringkasan Referral",
      body: "Lihat ringkasan mengenai progress dari hasil referral Anda.",
    },
  ];
  return (
    <Referral>
      <div className="p-3 space-y-4 md:space-y-6">
        <div className="w-full flex justify-center">
          <img src={require("../../../../../Images/Referral/id.webp")} alt="" />
        </div>
        <p className="font-mono -tracking-widest text-sm text-white">
          Sekali ID Anda terverifikasi, Anda dapat menikmati manfaat penuh dari
          program referral kami:
        </p>
        <div className="space-y-4">
          {data?.map((item, key) => (
            <div
              key={key}
              className={`flex justify-between items-center gap-4 bg-base-100/20 rounded px-3 py-2.5`}>
              <div className="w-1/12 flex items-center justify-center">
                <span
                  className={`material-symbols-outlined bg-gradient-to-b from-yellow-500 text-white to-yellow-500/80 px-4 py-1 rounded text-pretty`}>
                  {item.icon}
                </span>
              </div>
              <div className="w-11/12 text-sm">
                <p className="text-pretty font-medium text-white">
                  {item.title}
                </p>
                <p className="text-pretty text-yellow-500">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Referral>
  );
};
