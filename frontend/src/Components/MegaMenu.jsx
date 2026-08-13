import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const MegaMenu = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const theme = useSelector((state) => state.themes.theme);
  const navigate = useNavigate();
  const handleTrigger = async () => {
    if (!isAuthenticated) {
      return toast.info("Silahkan login terlebih dahulu.");
    }
    try {
      toast.error("Saldo tidak cukup");
    } catch (error) {
      toast.error("Saldo tidak cukup");
    }
  };

  const data = [
    {
      icon: "local_fire_department",
      name: "Hot Games",
      subItem: [
        { image: require("../Images/MegaMenu/menu-1/download.webp") },
        { image: require("../Images/MegaMenu/menu-1/game-code-48.webp") },
        { image: require("../Images/MegaMenu/menu-1/game-code-98.webp") },
        { image: require("../Images/MegaMenu/menu-1/game-code-16.webp") },
        { image: require("../Images/MegaMenu/menu-1/game-code-17.webp") },
        { image: require("../Images/MegaMenu/menu-1/game-code-9.webp") },
        { image: require("../Images/MegaMenu/menu-1/game-code-92.webp") },
        { image: require("../Images/MegaMenu/menu-1/game-code-1.webp") },
        { image: require("../Images/MegaMenu/menu-1/game-code-70.webp") },
      ],
    },
    {
      icon: "point_of_sale",
      name: "Slot",
      subItem: [
        { image: require("../Images/MegaMenu/menu-1/download.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-41.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-66.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-38.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-1.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-27.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-39.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-100.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-14.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-44.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-101.webp") },
        { image: require("../Images/MegaMenu/menu-1/game-code-48.webp") },
        { image: require("../Images/MegaMenu/menu-1/game-code-98.webp") },
        { image: require("../Images/MegaMenu/menu-1/game-code-16.webp") },
        { image: require("../Images/MegaMenu/menu-1/game-code-17.webp") },
        { image: require("../Images/MegaMenu/menu-1/game-code-9.webp") },
        { image: require("../Images/MegaMenu/menu-1/game-code-92.webp") },
        { image: require("../Images/MegaMenu/menu-1/game-code-1.webp") },
        { image: require("../Images/MegaMenu/menu-1/game-code-70.webp") },
      ],
    },
    {
      icon: "poker_chip",
      name: "Live Casino",
      subItem: [
        { image: require("../Images/MegaMenu/menu-3/game-code-105.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-41.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-66.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-38.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-1.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-27.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-39.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-100.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-14.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-44.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-101.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-84.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-85.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-43.webp") },
        { image: require("../Images/MegaMenu/menu-3/game-code-10.webp") },
      ],
    },
    {
      icon: "other_admission",
      name: "Togel",
      subItem: [
        { image: require("../Images/MegaMenu/menu-4/game-code-48.webp") },
      ],
    },
    {
      icon: "sports_soccer",
      name: "Olahraga",
      subItem: [
        { image: require("../Images/MegaMenu/menu-5/game-code-5.webp") },
        { image: require("../Images/MegaMenu/menu-5/game-code-23.webp") },
        { image: require("../Images/MegaMenu/menu-5/game-code-69.webp") },
        { image: require("../Images/MegaMenu/menu-5/game-code-83.webp") },
        { image: require("../Images/MegaMenu/menu-5/game-code-71.webp") },
        { image: require("../Images/MegaMenu/menu-5/game-code-86.webp") },
        { image: require("../Images/MegaMenu/menu-5/game-code-102.webp") },
        { image: require("../Images/MegaMenu/menu-5/game-code-103.webp") },
        { image: require("../Images/MegaMenu/menu-5/game-code-11.webp") },
      ],
    },
    {
      icon: "rocket_launch",
      name: "Crash Game",
      subItem: [
        { image: require("../Images/MegaMenu/menu-6/game-code-41.webp") },
        { image: require("../Images/MegaMenu/menu-6/game-code-17.webp") },
        { image: require("../Images/MegaMenu/menu-6/game-code-82.webp") },
        { image: require("../Images/MegaMenu/menu-6/game-code-62.webp") },
        { image: require("../Images/MegaMenu/menu-6/game-code-97.webp") },
        { image: require("../Images/MegaMenu/menu-6/game-code-81.webp") },
        { image: require("../Images/MegaMenu/menu-6/game-code-35.webp") },
      ],
    },
    {
      icon: "joystick",
      name: "Arcade",
      subItem: [
        { image: require("../Images/MegaMenu/menu-7/game-code-17 (1).webp") },
        { image: require("../Images/MegaMenu/menu-7/game-code-98.webp") },
        { image: require("../Images/MegaMenu/menu-7/game-code-82.webp") },
        { image: require("../Images/MegaMenu/menu-7/game-code-70.webp") },
        { image: require("../Images/MegaMenu/menu-7/game-code-107.webp") },
        { image: require("../Images/MegaMenu/menu-7/game-code-72.webp") },
        { image: require("../Images/MegaMenu/menu-7/game-code-61.webp") },
        { image: require("../Images/MegaMenu/menu-7/game-code-77.webp") },
        { image: require("../Images/MegaMenu/menu-7/game-code-89.webp") },
        { image: require("../Images/MegaMenu/menu-7/game-code-80.webp") },
        { image: require("../Images/MegaMenu/menu-7/game-code-81.webp") },
        { image: require("../Images/MegaMenu/menu-7/game-code-13.webp") },
        { image: require("../Images/MegaMenu/menu-7/game-code-79.webp") },
        { image: require("../Images/MegaMenu/menu-7/game-code-63.webp") },
        { image: require("../Images/MegaMenu/menu-7/game-code-96.webp") },
        { image: require("../Images/MegaMenu/menu-7/game-code-90.webp") },
        { image: require("../Images/MegaMenu/menu-7/game-code-62.webp") },
        { image: require("../Images/MegaMenu/menu-7/game-code-51.webp") },
        { image: require("../Images/MegaMenu/menu-7/game-code-35.webp") },
      ],
    },
    {
      icon: "playing_cards",
      name: "Poker",
      subItem: [
        { image: require("../Images/MegaMenu/menu-8/game-code-24.webp") },
        { image: require("../Images/MegaMenu/menu-8/game-code-32.webp") },
      ],
    },
    {
      icon: "stadia_controller",
      name: "E-Sports",
      subItem: [
        { image: require("../Images/MegaMenu/menu-9/game-code-58.webp") },
      ],
    },
    {
      icon: "raven",
      name: "Sabung Ayam",
      subItem: [
        { image: require("../Images/MegaMenu/menu-10/game-code-104.webp") },
        { image: require("../Images/MegaMenu/menu-10/game-code-57.webp") },
      ],
    },
    { icon: "redeem", name: "Promosi", url: "/promotion" },
  ];

  return (
    <div className="z-50 shadow-md relative">
      <ul className="flex justify-center space-x-2 p-4">
        {data.map((item, key) => (
          <li
            key={key}
            onClick={() => item.name == "Promosi" && navigate(item.url)}
            className={`relative group text-center border border-transparent hover:border-${theme?.name}-950 duration-200 ease-linear hover:bg-${theme?.name}-950/50 p-2 text-${theme?.name}-700 hover:text-${theme?.name}-500 cursor-pointer`}>
            {/* Menu Icon and Name */}
            <div
              className="z-50 relative"
              onClick={() => item.name == "Promosi" && navigate(item.url)}>
              <span className="material-symbols-outlined text-3xl text-white/50">
                {item.icon}
              </span>
              <p className="text-xs md:text-sm font-mono text-white uppercase whitespace-nowrap">
                {item.name}
              </p>
            </div>

            {/* SubItem Dropdown */}
            {item.subItem && (
              <div
                className={`fixed top-40 -mt-2 left-1/2 transform -translate-x-1/2 w-8/12 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 flex flex-col gap-4 shadow-lg p-6 z-40 bg-base-100/80 from-${theme?.name}-950/20 via-${theme?.name}-950/10 to-${theme?.name}-950/20 bg-gradient-to-b rounded-lg`}>
                <div className="w-full flex flex-wrap gap-4 justify-center">
                  {item.subItem.map((subItem, subKey) => (
                    <div
                      onClick={handleTrigger}
                      key={subKey}
                      className="relative hover:scale-105 duration-300">
                      {/* Gambar */}
                      <img
                        src={subItem.image}
                        className="w-auto h-32 object-contain relative z-10"
                        alt={`SubItem-${subKey}`}
                      />

                      {/* Border Top di Belakang Gambar */}
                      <div
                        className={`absolute bottom-0 left-0 right-0 h-5/6 border-yellow-500 border bg-gradient-to-r from-yellow-500/10 to-yellow-500/50 rounded-full -z-10`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}
      
      </ul>
    </div>
  );
};
