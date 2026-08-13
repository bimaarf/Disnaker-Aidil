import axios from "axios";
import React from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { GameItems } from "./___gameItems";

export const GameGrid = ({ uniqueDatas }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const handleTrigger = async (game) => {
    if (!isAuthenticated) return toast.info("Silahkan login terlebih dahulu");
    const response = await axios.post(`api/games/play/${game.key}`);
    toast.info(response.data.message);
  };

  return (
    <>
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        }}>
        {uniqueDatas?.map((game, i) => (
          <GameItems key={i} game={game} handleTrigger={handleTrigger} />
        ))}
      </div>
    </>
  );
};
