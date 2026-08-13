import React, { useState, useEffect, useRef } from "react";

export const DrawingPenPopup = () => {
  const [position, setPosition] = useState({ x: 130, y: 130 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 130, y: 130 });
  const [isVisible, setIsVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [size, setSize] = useState({ width: 920, height: 684 });
  const [penColor, setPenColor] = useState("#FFFFFF");
  const [edgeDragging, setEdgeDragging] = useState(null);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    posX: 0,
    posY: 0,
  });
  const canvasRef = useRef(null);
  const popupRef = useRef(null);

  // Base dimensions (minimum sizes)
  const minWidth = 160;
  const minHeight = 192;

  // Header drag handlers
  const handleHeaderMouseDown = (e) => {
    if (edgeDragging) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    e.stopPropagation();
  };

  // Edge drag handlers
  const handleEdgeMouseDown = (edge) => (e) => {
    e.preventDefault();
    e.stopPropagation();

    setEdgeDragging(edge);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      posX: position.x,
      posY: position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else if (edgeDragging && popupRef.current) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      switch (edgeDragging) {
        case "right": {
          const newWidth = Math.max(minWidth, resizeStart.width + deltaX);
          setSize((prev) => ({ ...prev, width: newWidth }));
          break;
        }

        case "left": {
          const widthChange = Math.min(resizeStart.width - minWidth, deltaX);
          const newLeftWidth = resizeStart.width - widthChange;
          setSize((prev) => ({ ...prev, width: newLeftWidth }));
          setPosition((prev) => ({
            ...prev,
            x: resizeStart.posX + widthChange,
          }));
          break;
        }

        case "bottom": {
          const newHeight = Math.max(minHeight, resizeStart.height + deltaY);
          setSize((prev) => ({ ...prev, height: newHeight }));
          break;
        }

        case "top": {
          const heightChange = Math.min(resizeStart.height - minHeight, deltaY);
          const newTopHeight = resizeStart.height - heightChange;
          setSize((prev) => ({ ...prev, height: newTopHeight }));
          setPosition((prev) => ({
            ...prev,
            y: resizeStart.posY + heightChange,
          }));
          break;
        }

        default:
          break;
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setEdgeDragging(null);
  };

  useEffect(() => {
    if (isDragging || edgeDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, edgeDragging]);

  // Drawing handlers
  const startDrawing = (e) => {
    if (edgeDragging || isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    e.stopPropagation();
  };

  const draw = (e) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#2E8B57"; // Chalkboard green
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Update canvas dimensions
  useEffect(() => {
    if (isVisible && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Adjusted for frame (8px border) and inner padding
      const canvasWidth = size.width - 56; // 40 (padding) + 16 (border: 8px each side)
      const canvasHeight = size.height - 100; // 84 (header/controls) + 16 (border)

      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        ctx.fillStyle = "#2E8B57";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [isVisible, size]);

  return (
    <div className="relative font-sans">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`mb-6 px-6 py-2.5 rounded-full shadow-lg transition-all duration-300 ${
          isDarkMode
            ? "bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-600 hover:to-gray-700"
            : "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 hover:from-gray-300 hover:to-gray-400"
        } font-medium tracking-wide`}>
        {isVisible ? "Hide Sketchpad" : "Open Sketchpad"}
      </button>

      {/* Drawing Popup */}
      {isVisible && (
        <div
          ref={popupRef}
          className="fixed z-50 transition-colors duration-200"
          style={{
            top: `${position.y}px`,
            left: `${position.x}px`,
            width: `${size.width}px`,
            height: `${size.height}px`,
          }}>
          <div
            className={`relative w-full h-full rounded-2xl overflow-hidden shadow-xl ${
              isDarkMode ? "bg-gray-900" : "bg-gray-100"
            } border-4 border-[#4A2F1A]`}>
            {/* Header */}
            <div
              className={`w-full h-14 flex items-center justify-between px-4 ${
                isDarkMode
                  ? "bg-gradient-to-r from-gray-800 to-gray-900"
                  : "bg-gradient-to-r from-gray-200 to-gray-300"
              } border-b border-[#4A2F1A]`}
              onMouseDown={handleHeaderMouseDown}>
              <span
                className={`font-semibold text-lg ${
                  isDarkMode ? "text-white" : "text-gray-800"
                } tracking-tight`}>
                Sketchpad
              </span>
              <div className="justify-end items-center">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`p-2 rounded-full ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                  } transition-colors`}
                  title={isDarkMode ? "Light Mode" : "Dark Mode"}>
                  {isDarkMode ? (
                    <svg
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 2a8 8 0 00-8 8c0 4.418 3.582 8 8 8s8-3.582 8-8a8 8 0 00-8-8zm0 14a6 6 0 01-6-6 6 6 0 016-6 6 6 0 016 6 6 6 0 01-6 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => setIsVisible(!isVisible)}
                  className={`p-2  dark: rounded-full ${
                    isDarkMode ? "text-white" : "text-black"
                  } transition-colors`}
                  title={"Close"}>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="p-3 bg-[#2E8B57] m-2 rounded-xl shadow-inner">
              <canvas
                ref={canvasRef}
                className="w-full h-full rounded-lg cursor-crosshair bg-[#2E8B57]"
                style={{
                  width: `${size.width - 48}px`,
                  height: `${size.height - 92}px`,
                }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
              />
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[#4A2F1A]/80 to-transparent">
              <div className="flex items-center justify-between max-w-md mx-auto">
                <button
                  onClick={clearCanvas}
                  className={`px-4 py-2 rounded-full ${
                    isDarkMode
                      ? "bg-gray-800 hover:bg-gray-700 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  } font-medium transition-all duration-200 shadow-md`}>
                  Clear Canvas
                </button>
                <input
                  type="color"
                  value={penColor}
                  onChange={(e) => setPenColor(e.target.value)}
                  className="w-10 h-10 rounded-full cursor-pointer border-2 border-white/50 shadow-md"
                />
              </div>
            </div>

            {/* Resize Handles */}
            <div
              className={`absolute top-0 left-0 w-3 h-full cursor-ew-resize ${
                edgeDragging === "left" ? "bg-white/20" : "hover:bg-white/10"
              } transition-colors`}
              onMouseDown={handleEdgeMouseDown("left")}
            />
            <div
              className={`absolute top-0 right-0 w-3 h-full cursor-ew-resize ${
                edgeDragging === "right" ? "bg-white/20" : "hover:bg-white/10"
              } transition-colors`}
              onMouseDown={handleEdgeMouseDown("right")}
            />
            <div
              className={`absolute top-0 left-0 w-full h-3 cursor-ns-resize ${
                edgeDragging === "top" ? "bg-white/20" : "hover:bg-white/10"
              } transition-colors`}
              onMouseDown={handleEdgeMouseDown("top")}
            />
            <div
              className={`absolute bottom-0 left-0 w-full h-3 cursor-ns-resize ${
                edgeDragging === "bottom" ? "bg-white/20" : "hover:bg-white/10"
              } transition-colors`}
              onMouseDown={handleEdgeMouseDown("bottom")}
            />
          </div>
        </div>
      )}
    </div>
  );
};
