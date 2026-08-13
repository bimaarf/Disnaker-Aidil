import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchAllPrograms } from "../../features/enggang/programSlice";

const ImageCard = ({ image, title, program }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() =>
        navigate(`/programs/${program.key}`, { state: { program } })
      }
      className="relative overflow-hidden cursor-pointer group rounded-lg shadow-lg h-[45vh]">
      <img
        src={`${process.env.REACT_APP_API}${image}`}
        alt={title || "Program Image"}
        className="absolute inset-0 w-full h-[45vh] object-cover"
        onError={(e) => {
          e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
        }}
      />
      <div className="absolute bottom-0 w-full bg-gradient-to-b from-green-800/50 to-blue-800/50 text-white h-20 group-hover:h-full transition-all duration-300 flex flex-col justify-center items-start p-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center gap-2 mt-2">
          <span>Selengkapnya</span>
          <span className="material-symbols-outlined">east</span>
        </div>
      </div>
    </div>
  );
};

const EventsSection = () => {
  const dispatch = useDispatch();
  const { allPrograms, status } = useSelector((state) => state.programs);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    dispatch(fetchAllPrograms());
  }, [dispatch]);

  const groupedPrograms = allPrograms.reduce((acc, item, index) => {
    const groupIndex = Math.floor(index / 3);
    if (!acc[groupIndex]) acc[groupIndex] = [];
    acc[groupIndex].push(item);
    return acc;
  }, []);

  const totalSlides = groupedPrograms.length;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 4000); // Bergulir otomatis setiap 4 detik

    return () => clearInterval(interval); // Membersihkan interval saat komponen di-unmount
  }, [totalSlides]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };



  if (status === "failed") {
    return (
      <div className="text-center text-red-500">Failed to load programs</div>
    );
  }

  return (
    <section className="py-16 px-4 max-w-screen-xl mx-auto bg-white text-black text-center relative">
      <h2 className="text-3xl font-bold mb-8">Events</h2>
      <div className="relative">
        {totalSlides > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute flex justify-center items-center left-0 top-1/2 -translate-y-1/2 bg-blue-700 text-white p-2 rounded-full hover:bg-blue-800 z-10">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              onClick={nextSlide}
              className="absolute flex justify-center items-center right-0 top-1/2 -translate-y-1/2 bg-blue-700 text-white p-2 rounded-full hover:bg-blue-800 z-10">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </>
        )}

        <div className="overflow-hidden max-w-screen-lg mx-auto">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              width: `${totalSlides * 100}%`,
              transform: `translateX(-${currentSlide * (100 / totalSlides)}%)`,
            }}>
            {groupedPrograms.map((group, index) => (
              <div key={index} className="flex w-full">
                {group.map((program) => (
                  <div key={program.id} className="w-1/3 px-2">
                    <ImageCard
                      program={program}
                      image={program.image}
                      title={program.title}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {groupedPrograms.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors duration-200 ${
              currentSlide === index ? "bg-blue-700" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default EventsSection;
