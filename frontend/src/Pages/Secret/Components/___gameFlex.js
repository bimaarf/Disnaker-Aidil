import axios from "axios";
import { debounce } from "lodash";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fetchGames } from "../../../features/games/gameSlice";
import { GameItems } from "./___gameItems";
import { GameSkeleton } from "./___gameSkeleton";
import useIsMobile from "../../../Context/__useIsMobile";

export const GameFlex = () => {
  const dispatch = useDispatch();
  const games = useSelector((state) => state.games.games || []);
  const status = useSelector((state) => state.games.status);
  const page = useSelector((state) => state.games.page);
  const totalPages = useSelector((state) => state.games.totalPages);
  const [currentPage, setCurrentPage] = useState(page || 1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFetchingRef = useRef(false);
  const containerRef = useRef(null);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const handleTrigger = async (game) => {
    if (!isAuthenticated) {
      return toast.info("Please log in first.");
    }
    try {
      const response = await axios.post(`api/games/play/${game.key}`);
      toast.info(response.data.message);
    } catch (error) {
      console.error("Failed to play game:", error);
      toast.error(error.response?.data?.message || "Failed to play game");
    }
  };

  useEffect(() => {
    if (status === "idle" || isLoadingMore) {
      dispatch(fetchGames({ page: currentPage, perPage: 10 }));
    }
  }, [dispatch, currentPage, isLoadingMore]);

  useEffect(() => {
    if (status === "succeeded" && isLoadingMore) {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    } else if (status === "failed") {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [status, isLoadingMore]);

  const handleLoadMore = useCallback(() => {
    if (
      totalPages &&
      currentPage < totalPages &&
      !isFetchingRef.current &&
      !isLoadingMore
    ) {
      setIsLoadingMore(true);
      setCurrentPage((prevPage) => prevPage + 1);
    }
  }, [currentPage, totalPages, isLoadingMore]);

  const handleHorizontalScroll = useCallback(
    debounce(() => {
      const container = containerRef.current;
      if (container) {
        if (
          container.scrollWidth - container.scrollLeft <=
          container.clientWidth + 300
        ) {
          handleLoadMore();
        }
      }
    }, 300),
    [handleLoadMore]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleHorizontalScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleHorizontalScroll);
      }
    };
  }, [handleHorizontalScroll]);

  const uniqueDatas = useMemo(() => {
    const seen = {};
    return (games || []).filter((game) => {
      if (seen[game.id]) return false;
      seen[game.id] = true;
      return true;
    });
  }, [games]);
  const isMobile = useIsMobile();
  return (
    <div className={`${isMobile ? "w-full" : "w-full"}`}>
      <div
        ref={containerRef}
        className="flex flex-wrap justify-center gap-2 overflow-x-hidden pb-4"
        style={{
          maxWidth: "100%",
        }}>
        {uniqueDatas.length > 0
          ? uniqueDatas.map((game, i) => (
              <div
                key={i}
                className="flex flex-col w-[30vw] md:w-32 mx-auto h-auto">
                <GameItems game={game} handleTrigger={handleTrigger} />
              </div>
            ))
          : status === "loading" && <GameSkeleton total={10} />}

        {totalPages &&
          currentPage < totalPages &&
          !isFetchingRef.current &&
          !isLoadingMore && (
            <div
              onClick={handleLoadMore}
              className="group w-32 cursor-pointer hover:brightness-90 duration-100 select-none block relative overflow-hidden rounded-lg h-[18.5vh]">
              <div className="flex justify-center items-center w-full h-full">
                <div className="flex justify-center items-center">
                  <span className="material-symbols-outlined">add</span>
                </div>
              </div>
            </div>
          )}
      </div>

      {totalPages &&
        currentPage < totalPages &&
        !isFetchingRef.current &&
        !isLoadingMore && (
          <div
            onClick={handleLoadMore}
            className="flex justify-center items-center gap-2 cursor-pointer text-white rounded-lg">
            {isLoadingMore ? (
              <i className="fas fa-spinner animate-spin"></i>
            ) : (
              <span className="material-symbols-outlined">sync</span>
            )}
            <span>Load More</span>
          </div>
        )}
    </div>
  );
};
