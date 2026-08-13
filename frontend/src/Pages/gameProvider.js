import React from "react";

export const GameProvider = () => {
  const providers = [
    {
      name: "Slots",
      content: [
        { image: require("../Images/Providers/Slots/1.webp") },
        { image: require("../Images/Providers/Slots/2.webp") },
        { image: require("../Images/Providers/Slots/3.webp") },
        { image: require("../Images/Providers/Slots/4.webp") },
        { image: require("../Images/Providers/Slots/5.webp") },
        { image: require("../Images/Providers/Slots/6.webp") },
        { image: require("../Images/Providers/Slots/7.webp") },
        { image: require("../Images/Providers/Slots/8.webp") },
        { image: require("../Images/Providers/Slots/9.webp") },
        { image: require("../Images/Providers/Slots/10.webp") },
        { image: require("../Images/Providers/Slots/11.webp") },
        { image: require("../Images/Providers/Slots/12.webp") },
        { image: require("../Images/Providers/Slots/13.webp") },
        { image: require("../Images/Providers/Slots/14.webp") },
        { image: require("../Images/Providers/Slots/15.webp") },
        { image: require("../Images/Providers/Slots/16.webp") },
        { image: require("../Images/Providers/Slots/17.webp") },
        { image: require("../Images/Providers/Slots/18.webp") },
        { image: require("../Images/Providers/Slots/19.webp") },
        { image: require("../Images/Providers/Slots/20.webp") },
        { image: require("../Images/Providers/Slots/21.webp") },
        { image: require("../Images/Providers/Slots/22.webp") },
        { image: require("../Images/Providers/Slots/23.webp") },
        { image: require("../Images/Providers/Slots/24.webp") },
        { image: require("../Images/Providers/Slots/25.webp") },
        { image: require("../Images/Providers/Slots/26.webp") },
        { image: require("../Images/Providers/Slots/27.webp") },
        { image: require("../Images/Providers/Slots/28.webp") },
        { image: require("../Images/Providers/Slots/29.webp") },
        { image: require("../Images/Providers/Slots/30.webp") },
        { image: require("../Images/Providers/Slots/31.webp") },
        { image: require("../Images/Providers/Slots/32.webp") },
        { image: require("../Images/Providers/Slots/33.webp") },
        { image: require("../Images/Providers/Slots/34.webp") },
        { image: require("../Images/Providers/Slots/35.webp") },
        { image: require("../Images/Providers/Slots/36.webp") },
        { image: require("../Images/Providers/Slots/37.webp") },
      ],
    },
    {
      name: "Live Casino",
      content: [
        { image: require("../Images/Providers/LiveCasino/1.webp") },
        { image: require("../Images/Providers/LiveCasino/2.webp") },
        { image: require("../Images/Providers/LiveCasino/3.webp") },
        { image: require("../Images/Providers/LiveCasino/4.webp") },
        { image: require("../Images/Providers/LiveCasino/5.webp") },
        { image: require("../Images/Providers/LiveCasino/6.webp") },
        { image: require("../Images/Providers/LiveCasino/7.webp") },
        { image: require("../Images/Providers/LiveCasino/8.webp") },
        { image: require("../Images/Providers/LiveCasino/9.webp") },
        { image: require("../Images/Providers/LiveCasino/10.webp") },
        { image: require("../Images/Providers/LiveCasino/11.webp") },
        { image: require("../Images/Providers/LiveCasino/12.webp") },
        { image: require("../Images/Providers/LiveCasino/13.webp") },
        { image: require("../Images/Providers/LiveCasino/14.webp") },
      ],
    },
    {
      name: "Togel",
      content: [{ image: require("../Images/Providers/Togel/1.webp") }],
    },
    {
      name: "Olahraga",
      content: [
        { image: require("../Images/Providers/Olahraga/1.webp") },
        { image: require("../Images/Providers/Olahraga/2.webp") },
        { image: require("../Images/Providers/Olahraga/3.webp") },
        { image: require("../Images/Providers/Olahraga/4.webp") },
        { image: require("../Images/Providers/Olahraga/5.webp") },
        { image: require("../Images/Providers/Olahraga/6.webp") },
        { image: require("../Images/Providers/Olahraga/7.webp") },
        { image: require("../Images/Providers/Olahraga/8.webp") },
      ],
    },
    {
      name: "CrashGame",
      content: [
        { image: require("../Images/Providers/CrashGame/1.webp") },
        { image: require("../Images/Providers/CrashGame/2.webp") },
        { image: require("../Images/Providers/CrashGame/3.webp") },
        { image: require("../Images/Providers/CrashGame/4.webp") },
        { image: require("../Images/Providers/CrashGame/5.webp") },
        { image: require("../Images/Providers/CrashGame/6.webp") },
        { image: require("../Images/Providers/CrashGame/7.webp") },
        { image: require("../Images/Providers/CrashGame/8.webp") },
        { image: require("../Images/Providers/CrashGame/9.webp") },
        { image: require("../Images/Providers/CrashGame/10.webp") },
      ],
    },
    {
      name: "Arcade",
      content: [
        { image: require("../Images/Providers/Arcade/1.webp") },
        { image: require("../Images/Providers/Arcade/2.webp") },
        { image: require("../Images/Providers/Arcade/3.webp") },
        { image: require("../Images/Providers/Arcade/4.webp") },
        { image: require("../Images/Providers/Arcade/5.webp") },
        { image: require("../Images/Providers/Arcade/6.webp") },
        { image: require("../Images/Providers/Arcade/7.webp") },
        { image: require("../Images/Providers/Arcade/8.webp") },
        { image: require("../Images/Providers/Arcade/9.webp") },
        { image: require("../Images/Providers/Arcade/10.webp") },
        { image: require("../Images/Providers/Arcade/11.webp") },
        { image: require("../Images/Providers/Arcade/12.webp") },
        { image: require("../Images/Providers/Arcade/13.webp") },
        { image: require("../Images/Providers/Arcade/14.webp") },
        { image: require("../Images/Providers/Arcade/15.webp") },
        { image: require("../Images/Providers/Arcade/16.webp") },
        { image: require("../Images/Providers/Arcade/17.webp") },
        { image: require("../Images/Providers/Arcade/18.webp") },
        { image: require("../Images/Providers/Arcade/19.webp") },
        { image: require("../Images/Providers/Arcade/20.webp") },
        { image: require("../Images/Providers/Arcade/21.webp") },
        { image: require("../Images/Providers/Arcade/22.webp") },
      ],
    },
    {
      name: "Poker",
      content: [
        { image: require("../Images/Providers/Poker/1.webp") },
        { image: require("../Images/Providers/Poker/2.webp") },
      ],
    },
    {
      name: "E-Sports",
      content: [{ image: require("../Images/Providers/E-Sports/1.webp") }],
    },
    {
      name: "Sabung Ayam",
      content: [
        { image: require("../Images/Providers/SabungAyam/1.webp") },
        { image: require("../Images/Providers/SabungAyam/2.webp") },
      ],
    },
  ];
  return (
    <div className="flex flex-wrap overflow-hidden gap-2 w-full">
      {providers.map((provider, index) => (
        <div
          key={index}
          className="relative rounded-lg p-6 mt-10 border border-base-300 bg-base-100/10">
          {/* Provider Name */}
          <div className="absolute -top-7 left-4 z-20 text-white font-bold">
            <div
              className="relative bg-base-100 bg-opacity-10 border-t border-x border-base-300 px-3 pt-1 pb-0 rounded-t-lg"
              style={{
                marginBottom: "-1px", // Menutupi border bawah
              }}>
              {provider.name}
            </div>
          </div>

          {/* Content */}
          <div className="relative flex flex-wrap overflow-hidden gap-2 w-full space-y-4 z-10 bg-base-100 bg-opacity-10 rounded-lg">
            {provider.content?.map((item, key) => (
              <img
                key={key}
                className="flex-shrink-0 filter grayscale hover:grayscale-0 duration-300 cursor-pointer w-auto md:h-[6vh] h-[4vh]"
                src={item.image}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
