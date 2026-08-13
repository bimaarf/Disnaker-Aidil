import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBanners } from "../../../features/LandingPages/bannerSlice";

export const CarouselBanner = () => {
  const dispatch = useDispatch();
  const banners = useSelector((state) => state.banners.banners);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length === 0) {
      dispatch(fetchBanners({ page: 1, perPage: 10 }));
    }
  }, [banners, dispatch]);

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === banners.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="relative w-full overflow-hidden">
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {banners ? (
          banners?.map((banner, index) => (
            <div key={banner.id} className="w-full flex-shrink-0">
              <img
                src={`${process.env.REACT_APP_API}banners/images/${banner.image}`}
                className="block w-full"
                alt={`Banner ${index + 1}`}
              />
            </div>
          ))
        ) : (
          <div className="w-full flex-shrink-0">
            <img
              src={`https://placehold.co/1920x600?text=${process.env.REACT_APP_URL}&&font=roboto`}
              className="block w-full"
              alt={`Slider`}
            />
          </div>
        )}
      </div>

      {/* Prev and Next Buttons */}
      <button
        className="absolute flex items-center top-1/2 left-4 transform -translate-y-1/2 bg-base-300/50 hover:bg-base-300/80 duration-200 text-white p-2 rounded-full scale-125"
        onClick={handlePrev}>
        <span className="material-symbols-outlined">keyboard_arrow_left</span>
      </button>
      <button
        className="absolute flex items-center top-1/2 right-4 transform -translate-y-1/2 bg-base-300/50 hover:bg-base-300/80 duration-200 text-white p-2 rounded-full scale-125"
        onClick={handleNext}>
        <span className="material-symbols-outlined">keyboard_arrow_right</span>
      </button>
    </div>
  );
};
