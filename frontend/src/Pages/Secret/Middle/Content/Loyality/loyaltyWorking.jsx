import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export const LoyaltyWorking = () => {
  const navigate = useNavigate();
  const theme = useSelector((state) => state.themes.theme);
  const data = [
    {
      title: "Cara mendapatkan LP & EXP",
      content: [
        {
          label: "Setiap IDR 1,000.00 Turnover Mendapatkan 1 LP dan 1 EXP",
          image: require("../../../../../Images/Loyality/how-it-work/1-IDR.webp"),
        },
        {
          label:
            "Dengan menyelesaikan misi, Anda akan mendapatkan EXP gratis untuk meningkatkan level Anda",
          image: require("../../../../../Images/Loyality/how-it-work/2 (1).webp"),
        },
        {
          label: "Klaim hadiah harian untuk mendapatkan EXP Gratis",
          image: require("../../../../../Images/Loyality/how-it-work/3.webp"),
        },
      ],
    },
    {
      title: "Kadaluwarsa LP",
      content: [
        {
          label: "LP Anda akan kadaluwarsa setelah 3 tahun",
          image: require("../../../../../Images/Loyality/how-it-work/1.webp"),
        },
      ],
    },
    {
      title: "Penukaran",
      content: [
        {
          label:
            "Kunjungi halaman penukaran kami untuk menemukan berbagai macam barang yang dapat dibeli menggunakan LP.",
          image: require("../../../../../Images/Loyality/how-it-work/1 (1).webp"),
        },
      ],
    },
    {
      title: "Peningkatan EXP",
      content: [
        {
          label: "Tingkatkan level Anda dengan menukarkan sejumlah EXP",
          image: require("../../../../../Images/Loyality/how-it-work/1 (2).webp"),
        },
        {
          label:
            "Seiring dengan kemajuan level, Anda akan membuka lebih banyak keuntungan dan bonus eksklusif",
          image: require("../../../../../Images/Loyality/how-it-work/2 (1).webp"),
        },
      ],
    },
    {
      title: "Penyebab Turun Level",
      content: [
        {
          label:
            "Jika dalam 1 tahun Anda tidak berhasil mengumpulkan 50% syarat kenaikan level sebelumnya, maka dengan otomatis level Anda akan turun 1 tingkat dan seluruh EXP yang Anda miliki akan hilang.",
          image: require("../../../../../Images/Loyality/how-it-work/1 (3).webp"),
        },
      ],
    },
  ];
  return (
    <>
      <div className={`bg-${theme?.name}-950/10 md:p-4 space-y-4`}>
        <div className="p-3 bg-gradient-to-t from-yellow-700 to-yellow-500 text-center text-white text-sm uppercase">
          <p
            onClick={() => navigate("/loyalty/rewards")}
            className="float-left hover:brightness-90 duration-100 cursor-pointer material-symbols-outlined">
            arrow_back
          </p>
          <h1>Cara Kerja</h1>
        </div>
        <div className="p-3 space-y-4 md:space-y-6">
          <div className="w-full flex justify-center">
            <img
              src={require("../../../../../Images/Loyality/how-it-work/banner.webp")}
              alt=""
            />
          </div>
          <div className="space-y-4">
            {data.map((item, key) => (
              <div key={key} className="bg-base-100/50">
                <div
                  className={`p-3 bg-${theme?.name}-700/30 text-center text-white text-sm`}>
                  <h1>{item.title}</h1>
                </div>
                <div className="border border-t-0 border-base-300 p-3 space-y-6">
                  {item.content?.map((subItem, keyItem) => (
                    <div
                      key={keyItem}
                      className="flex w-full justify-end items-center md:gap-4">
                      <div className="w-1/3">
                        <img src={subItem.image} alt="" />
                      </div>
                      <div className="w-2/3 md:text-left text-right whitespace-normal text-[11px] md:text-[16px] font-mono -tracking-widest">
                        <p>{subItem.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Navigation Tabs */}
    </>
  );
};
