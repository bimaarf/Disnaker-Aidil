import React from "react";
import { ReactComponent as UnlockSvg } from "../../../../../../Images/Missions/LoginAPK.svg";
import { ReactComponent as WhatsappSvg } from "../../../../../../Images/Missions/WhatsappVerification.svg";
import { ReactComponent as EmailSvg } from "../../../../../../Images/Missions/EmailVerification.svg";
import { ReactComponent as DepositSvg } from "../../../../../../Images/Missions/FirstDeposit.svg";
export const MissionItems = ({ theme }) => {
  const data = [
    {
      icon: <UnlockSvg width={80} height={80} />,
      bar: "0/1",
      exp: "12.500",
      title: "Unduh Apk dan Masuk",
    },
    {
      icon: <WhatsappSvg width={80} height={80} />,
      bar: "0/1",
      exp: "5.000",
      title: "Verifikasi WhatsApp",
    },
    {
      icon: <EmailSvg width={80} height={80} />,
      bar: "0/1",
      exp: "2.500",
      title: "Verifikasi Email",
    },
    {
      icon: <DepositSvg width={80} height={80} />,
      bar: "0/1",
      exp: "5.000",
      title: "Pertama kali Deposit",
    },
  ];
  return (
    <>
      {data.map((item, key) => (
        <div
          key={key}
          className={`flex items-center w-full gap-4 justify-between rounded bg-${theme?.name}-900/10`}>
          <div
            className={`flex w-3/4 md:w-4/5 p-2 rounded items-center gap-4 bg-${theme?.name}-700/10`}>
            {item.icon}
            <div className="w-full">
              <p>Unduh Apk dan Masuk</p>
              <div className="py-0.5 text-xs w-full rounded-full bg-base-100 border border-base-300 text-center">
                {item.bar}
              </div>
            </div>
          </div>
          <div className="w-1/4 md:w-1/5 space-y-1">
            <div className="flex items-center justify-center font-mono gap-2">
              <p className="font-bold text-lg">{item.exp}</p>
              <p className="px-1 py-0.5 text-xs font-mono bg-secondary/90 rounded">
                exp
              </p>
            </div>
            <div className="flex justify-center text-sm">
              <button className="hover:brightness-90 duration-200 text-base-content bg-info-800 w-2/3 rounded-full px-4 py-1">
                Mulai
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};
