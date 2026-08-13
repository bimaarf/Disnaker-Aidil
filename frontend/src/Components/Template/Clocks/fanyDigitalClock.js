import React, { useState, useEffect } from "react";

export const FancyDigitalClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [position, setPosition] = useState({ x: 150, y: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false); // Toggle visibility

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const hours = currentTime.getHours().toString().padStart(2, "0");
  const minutes = currentTime.getMinutes().toString().padStart(2, "0");
  const seconds = currentTime.getSeconds().toString().padStart(2, "0");
  const day = currentTime.toLocaleString("en-US", { weekday: "long" });
  const month = currentTime.toLocaleString("en-US", { month: "short" });
  const date = currentTime.getDate();
  const year = currentTime.getFullYear();

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
        {isVisible ? "Hide Fancy Clock" : "Show Fancy Clock"}
      </button>

      {/* Clock Popup */}
      {isVisible && (
        <div
          className="fixed z-50"
          style={{ top: `${position.y}px`, left: `${position.x}px` }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}>
          <div
            className={`relative w-80 h-48 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl shadow-2xl overflow-hidden ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}>
            <div className="absolute inset-0 bg-white/10 backdrop-blur-md"></div>
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
              <div className="absolute w-96 h-96 bg-blue-400/20 rounded-full animate-pulse -top-48 -left-48"></div>
              <div className="absolute w-96 h-96 bg-pink-400/20 rounded-full animate-pulse -bottom-48 -right-48"></div>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
              <div className="flex items-center space-x-2">
                <span className="text-6xl font-extrabold tracking-tight drop-shadow-lg">
                  {hours}
                </span>
                <span className="text-4xl font-bold animate-pulse">:</span>
                <span className="text-6xl font-extrabold tracking-tight drop-shadow-lg">
                  {minutes}
                </span>
                <span className="text-4xl font-bold animate-pulse">:</span>
                <span className="text-6xl font-extrabold tracking-tight drop-shadow-lg">
                  {seconds}
                </span>
              </div>
              <div className="mt-4 text-sm font-medium tracking-wide">
                {`${day}, ${month} ${date}, ${year}`}
              </div>
              <div className="absolute top-2 right-2 w-4 h-4 bg-white/30 rounded-full animate-ping"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 bg-white/30 rounded-full animate-ping"></div>
            </div>
            <div className="absolute inset-0 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.3)] pointer-events-none"></div>
          </div>
        </div>
      )}
    </div>
  );
};
