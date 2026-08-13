import React, { useState } from "react";

export const HomeCarousel = () => {
  const slides = [
    {
      type: "video",
      source: require("../videos/68mHWdE6zlCvfjXTwpej.mp4"),
      text: "Inspiring Change",
    },
    {
      type: "image",
      source: require("./components/Images/beautiful-pathway-through-woods.jpg"),
      text: "Empowering Communities",
    },

    {
      type: "image",
      source: require("./components/Images/beautiful-pathway-through-woods.jpg"),
      text: "Promoting Education",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative w-full h-[80vh] bg-gray-800 overflow-hidden">
      {/* Carousel Wrapper */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${currentSlide * 100}%)`,
        }}>
        {slides.map((slide, index) => (
          <div
            key={index}
            className="w-full flex-shrink-0 h-[80vh] relative"
            style={{
              backgroundColor: slide.type === "image" ? "transparent" : "#000",
            }}>
            {/* Render Image or Video */}
            {slide.type === "image" ? (
              <div
                style={{
                  backgroundImage: `url(${slide.source})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                className="w-full h-full"></div>
            ) : (
              <video
                src={slide.source}
                autoPlay
                loop
                muted
                className="w-full h-full object-cover"></video>
            )}

            {/* Text Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <h2 className="text-white text-4xl font-bold">{slide.text}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 ">
        <button
          className="flex items-center justify-center bg-gray-900 bg-opacity-50 text-white p-2 text-center rounded-full hover:bg-gray-700"
          onClick={handlePrev}>
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
      </div>
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 ">
        <button
          className="flex items-center justify-center bg-gray-900 bg-opacity-50 text-white p-2 text-center rounded-full hover:bg-gray-700"
          onClick={handleNext}>
          <span className="material-symbols-outlined">arrow_forward_ios</span>
        </button>
      </div>
    </section>
  );
};
