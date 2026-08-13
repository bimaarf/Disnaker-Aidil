import React, { useState } from "react";

export const LoyaltyContent = () => {
  const [btnActive, setBtnActive] = useState("Semua");
  const data = [
    {
      title: "SILVER TICKET-EVENT GASCOR MINGGUAN DESEMBER",
      price: "2.500",
      timeDays: "09",
      category: "Lucky Draw",
      image: require("../../../../../../Images/Loyality/9559903d-4232-4dd6-a9eb-534b513e67f3.png"),
    },
    {
      title: "GOLD TICKET-EVENT GASCOR MINGGUAN DESEMBER",
      price: "5.000",
      timeDays: "09",
      category: "Lucky Draw",
      image: require("../../../../../../Images/Loyality/2ff9f7a5-ddea-48e1-bc5e-0a62b3427dc2.png"),
    },
  ];
  return (
    <>
      <img
        className="w-full"
        src={require("../../../../../../Images/Loyality/id_cbd_a33439b0-986b-48d5-b909-693093e640ff_1732142578063.png")}
      />
      <div className="border border-base-300 bg-base-100/50 p-6 space-y-4">
        <div className="flex justify-start items-center gap-2">
          <button
            onClick={() => setBtnActive("Semua")}
            className={`${
              btnActive === "Semua" ? "bg-base-300/80" : "bg-base-300/50"
            } px-4 py-1.5 rounded hover:brightness-90 duration-100 text-pretty`}>
            Semua
          </button>
          <button
            onClick={() => setBtnActive("Lucky Draw")}
            className={`${
              btnActive === "Lucky Draw" ? "bg-base-300/80" : "bg-base-300/50"
            } px-4 py-1.5 rounded hover:brightness-90 duration-100 text-pretty`}>
            Lucky Draw
          </button>
        </div>
        <div className="flex justify-between items-center font-medium text-pretty ">
          <div className="flex items-center gap-2 uppercase">
            <div className="w-1 rounded h-8 bg-yellow-600"></div>
            <p>Lucky Draw</p>
          </div>
          <div className="flex items-center">
            <p className="text-xs text-neutral-content">Lihat Semua</p>
            <span className="material-symbols-outlined">chevron_right</span>
          </div>
        </div>
        <div
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
          style={
            {
              // gridTemplateColumns: "repeat(auto-fit, minmax(100px, 30%))",
            }
          }>
          {data.map((item, key) => (
            <div key={key} className="p-2 bg-base-200 rounded">
              <div className="border border-base-300 rounded">
                <div className="p-1">
                  <img
                    className="float-right p-2"
                    src={require("../../../../../../Images/Loyality/nexus-alpha-cbo-icon.webp")}
                  />
                  <img className="w-full my-2 p-2" src={item.image} />
                </div>
                <div className="bg-red-700 border border-red-700 text-white w-full py-2 rounded-b">
                  <div className="flex font-mono text-[10px] md:text-xs justify-center items-center gap-2">
                    <p>Diundi Dalam:</p>
                    <p className="bg-base-300 py-1 rounded px-1 md:px-4">
                      {item.timeDays} Hari
                    </p>
                  </div>
                </div>
              </div>
              <p className="font-mono font-bold uppercase text-pretty -tracking-wider">
                {item.title}
              </p>
              <div className="flex items-center gap-2 rounded p-1 bg-base-300 w-fit">
                <p className="bg-warning py-1 px-2 rounded">LP</p>
                <p className="font-mono text-balance -tracking-wider font-bold">
                  {item.price}
                </p>
              </div>
              <button className="rounded-full w-full bg-warning-500 text-base-100 text-sm py-1 mt-3">
                Tukar
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
