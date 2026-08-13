import React, { useEffect, useState } from "react";
import { Bonus } from "../bonus";
import "../../../../../components/button.css";
import { useSelector } from "react-redux";
export const CashbackComponent = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(23, 59, 59, 999);

      const difference = midnight - now;

      if (difference > 0) {
        const hours = String(
          Math.floor((difference / (1000 * 60 * 60)) % 24)
        ).padStart(2, "0");
        const minutes = String(
          Math.floor((difference / (1000 * 60)) % 60)
        ).padStart(2, "0");
        const seconds = String(Math.floor((difference / 1000) % 60)).padStart(
          2,
          "0"
        );

        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft({ hours: "00", minutes: "00", seconds: "00" });
      }
    };

    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);
  const getCurrentDate = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, "0");

    const monthOptions = { month: "short" };
    const month = date.toLocaleDateString("en-US", monthOptions);
    const year = date.getFullYear();
    // const time = date.toLocaleTimeString("id-ID", { hour12: false });
    return `${day}-${month}-${year}`;
  };

  const data = [
    {
      title: "Cashback Mingguan Slot",
      subTitle: `${getCurrentDate()} 00.00 WIB - ${getCurrentDate()} 23.59 WIB`,
    },
    {
      title: "Cashback Mingguan Casino",
      subTitle: `${getCurrentDate()} 00.00 WIB - ${getCurrentDate()} 23.59 WIB`,
    },
    {
      title: "Cashback MIngguan sambung ayam",
      subTitle: `${getCurrentDate()} 00.00 WIB - ${getCurrentDate()} 23.59 WIB`,
    },
    {
      title: "Cashback Mingguan Sports",
      subTitle: `${getCurrentDate()} 00.00 WIB - ${getCurrentDate()} 23.59 WIB`,
    },
  ];
  const theme = useSelector((state) => state.themes.theme);
  return (
    <Bonus>
      <div className={`bg-${theme?.name}-950/10 md:p-4 space-y-4`}>
        <div className="flex mt-4 items-center gap-4">
          <div className="flex items-center gap-2 font-body text-sm tracking-tighter">
            <p>Kategori</p>
            <select className="px-2 border-base-300 border bg-base-300/50 py-1 outline-none">
              <option>Semua</option>
              <option>Pendaftaran</option>
            </select>
          </div>
          <div className="flex items-center gap-2 font-body text-sm tracking-tighter">
            <p>Type</p>
            <select className="px-2 border-base-300 border bg-base-300/50 py-1 outline-none">
              <option>Semua</option>
              <option>Slots</option>
              <option>Arcade</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <div className="p-3 bg-gradient-to-t from-yellow-700 to-yellow-500 text-white text-sm uppercase">
            <h1>Klaim Cashback</h1>
          </div>

          <div className="p-3 font-body whitespace-normal">
            <div className="p-3 text-xs rounded text-white bg-neutral-500/40 ">
              <p className="text-yellow-500">Catatan</p>
              <li className="list-decimal">
                Promosi ini tidak bisa dikombinasikan dengan promosi lainnya dan
                promosi ini bisa kedaluarsa.
              </li>
              <li className="list-decimal">
                Cek progress promosi dan klaim tidak tersedia dari jam 03:00 -
                07:00!
              </li>
              <li className="list-decimal">
                Cashback sedang disimpan selama 30 menit dari 29-Nov-2024
                07:56:40 WIB
              </li>
              <div className="mt-4 md:flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <p className="bg-success h-2 w-10 rounded"></p>
                  <p className="text-sm font-body">: Diperbolehkan bergabung</p>
                </div>
                <div className="flex items-center gap-1">
                  <p className="bg-warning h-2 w-10 rounded"></p>
                  <p className="text-sm font-body">
                    : Tidak dapat menentukan kelayakan
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <p className="bg-error h-2 w-10 rounded"></p>
                  <p className="text-sm font-body">
                    : Tidak diperbolehkan bergabung
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-screen-xl my-4 mx-auto w-full">
            {data.map((item, key) => (
              <>
                <div className="flex justify-end mt-4">
                  <button
                    className={`parallelogram-left-button mx-2 px-10 py-1 bg-${theme?.name}-950 text-sm uppercase font-medium`}>
                    Mingguan
                  </button>
                </div>
                <div
                  key={key}
                  className={`border-2 border-${theme?.name}-950 mx-2`}>
                  <div className="flex justify-between items-start p-4">
                    <div className="w-3/4">
                      <div className="flex justify-between items-baseline">
                        <div>
                          <p className="text-pretty font-bold uppercase">
                            {item.title}
                          </p>
                          <p className="text-pretty text-sm font-medium">
                            {item.subTitle}
                          </p>
                          <p className="text-sm">[Gabung Otomatis]</p>
                        </div>
                        <p className="bg-success h-2 w-10 rounded"></p>
                      </div>
                      <div className="p-4 rounded bg-white mt-4">
                        <div className="h-4 bg-base-300/50"></div>
                      </div>
                      <div className="flex justify-center mt-2 text-sm items-center gap-1">
                        <p>Perkembangan:</p>
                        <p className="font-mono text-warning">0.0%</p>
                      </div>
                    </div>
                    <div>
                      <img
                        src={require("../../../../../../Images/Chest/chest-gold.png")}
                        alt=""
                      />
                    </div>
                  </div>
                  <div
                    className={`p-4 bg-${theme?.name}-950 md:flex justify-between`}>
                    <div className="h-10 flex items-center">
                      <button className="px-4 py-1 text-white bg-base-300/60 text-sm">
                        Info
                      </button>
                    </div>
                    <div className="flex items-center">
                      <div className="bg-base-300/50 h-full flex items-center p-3 text-xs">
                        KLAIM PADA WAKTU
                      </div>
                      <div className="bg-base-300/50 p-3 text-center text-xs border-l">
                        <p>00</p>
                        <p className="text-warning">Hari</p>
                      </div>
                      <div className="bg-base-300/50 p-3 text-center text-xs border-l">
                        <p>{timeLeft.hours}</p>
                        <p className="text-warning">Jam</p>
                      </div>
                      <div className="bg-base-300/50 p-3 text-center text-xs border-l">
                        <p>{timeLeft.minutes}</p>
                        <p className="text-warning">Menit</p>
                      </div>
                      <div className="bg-base-300/50 p-3 text-center text-xs border-l">
                        <p>{timeLeft.seconds}</p>
                        <p className="text-warning">Detik</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ))}
          </div>
        </div>
      </div>
    </Bonus>
  );
};
