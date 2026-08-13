import React, { useState, useEffect } from "react";

export const NeumorphicClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [position, setPosition] = useState({ x: 120, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Drag handlers
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

  // Format time and date
  const hours = currentTime.getHours().toString().padStart(2, "0");
  const minutes = currentTime.getMinutes().toString().padStart(2, "0");
  const seconds = currentTime.getSeconds().toString().padStart(2, "0");
  const day = currentTime.toLocaleString("en-US", { weekday: "short" });
  const month = currentTime.toLocaleString("en-US", { month: "short" });
  const date = currentTime.getDate();

  return (
    <div className="relative">
      {/* Toggle Visibility Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`mb-4 px-4 py-2 rounded-lg shadow-md transition-colors ${
          isDarkMode
            ? "bg-gray-800 text-white hover:bg-gray-700"
            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
        }`}>
        {isVisible ? "Hide Clock" : "Show Clock"}
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
            className={`relative w-72 h-96 rounded-3xl p-6 transition-all duration-300 ${
              isDarkMode
                ? "bg-gray-900 text-gray-100 shadow-[5px_5px_15px_#1a1a1a,-5px_-5px_15px_#2a2a2a]"
                : "bg-gray-100 text-gray-900 shadow-[5px_5px_15px_#d1d1d1,-5px_-5px_15px_#ffffff]"
            } ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}>
            {/* Mode Toggle Button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                isDarkMode
                  ? "bg-gray-800 text-yellow-400 hover:bg-gray-700"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}>
              {isDarkMode ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    d="M10 2a8 8 0 00-8 8c0 4.418 3.582 8 8 8s8-3.582 8-8a8 8 0 00-8-8zm0 14a6 6 0 01-6-6 6 6 0 016-6 6 6 0 016 6 6 6 0 01-6 6z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            {/* Clock Face */}
            <div className="flex flex-col items-center justify-center h-full">
              {/* Time Display */}
              <div
                className={`text-7xl font-extrabold tracking-tight transition-colors ${
                  isDarkMode ? "text-cyan-400" : "text-indigo-600"
                }`}>
                {hours}
                <span
                  className={`animate-pulse ${
                    isDarkMode ? "text-gray-300" : "text-gray-500"
                  }`}>
                  :
                </span>
                {minutes}
                <span
                  className={`animate-pulse ${
                    isDarkMode ? "text-gray-300" : "text-gray-500"
                  }`}>
                  :
                </span>
                {seconds}
              </div>

              {/* Date Display */}
              <div
                className={`mt-4 text-lg font-medium transition-colors ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}>
                {`${day}, ${month} ${date}`}
              </div>

              {/* Neumorphic Ring */}
              <div
                className={`mt-6 w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                  isDarkMode
                    ? "bg-gray-800 shadow-[inset_5px_5px_10px_#1a1a1a,inset_-5px_-5px_10px_#2a2a2a]"
                    : "bg-gray-200 shadow-[inset_5px_5px_10px_#d1d1d1,inset_-5px_-5px_10px_#ffffff]"
                }`}>
                <div
                  className={`w-24 h-24 rounded-full ${
                    isDarkMode
                      ? "bg-gray-900 shadow-[5px_5px_10px_#1a1a1a,-5px_-5px_10px_#2a2a2a]"
                      : "bg-gray-100 shadow-[5px_5px_10px_#d1d1d1,-5px_-5px_10px_#ffffff]"
                  }`}></div>
              </div>
            </div>

            {/* Glowing Accent */}
            <div
              className={`absolute bottom-0 left-0 w-full h-1 ${
                isDarkMode
                  ? "bg-gradient-to-r from-cyan-400 to-blue-500"
                  : "bg-gradient-to-r from-indigo-500 to-purple-500"
              }`}></div>
          </div>
        </div>
      )}
    </div>
  );
};
