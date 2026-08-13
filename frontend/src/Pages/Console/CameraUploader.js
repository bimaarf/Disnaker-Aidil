import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";

/**
 * AutoCameraUploaderWithConsent Component
 *
 * Automatically captures and uploads camera frames with motion detection
 *
 * @param {Object} props
 * @param {string} props.uploadUrl - API endpoint for image upload
 * @param {number} props.intervalMs - Capture interval in milliseconds (default: 5000)
 * @param {boolean} props.enableMotionDetection - Enable motion detection (default: true)
 * @param {number} props.motionThreshold - Motion sensitivity 0-255 (default: 20)
 * @param {number} props.minUploadIntervalMs - Minimum time between uploads (default: 3000)
 */
export default function AutoCameraUploaderWithConsent({
  uploadUrl = `${process.env.REACT_APP_API}api/upload-camera`,
  intervalMs = 5000,
  enableMotionDetection = true,
  motionThreshold = 20,
  minUploadIntervalMs = 3000,
}) {
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const prevCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const lastUploadAtRef = useRef(0);

  // State
  const [permissionState, setPermissionState] = useState("unknown");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Start camera stream
  const startCamera = useCallback(async () => {
    setError(null);

    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError(
        "Browser tidak mendukung akses kamera. Gunakan browser modern seperti Chrome, Firefox, atau Edge."
      );
      setPermissionState("denied");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }

      setStreaming(true);
      setPermissionState("granted");
    } catch (err) {
      console.error("getUserMedia error:", err);
      setError(err.message || "Gagal mengakses kamera");

      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setPermissionState("denied");
      } else {
        setPermissionState("prompt");
      }
    }
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    } catch (err) {
      console.error("stopCamera error:", err);
    }

    setStreaming(false);
  }, []);

  // Detect motion between frames
  const detectMotion = useCallback(
    (width, height) => {
      try {
        const canvas = canvasRef.current;
        const prevCanvas = prevCanvasRef.current;

        if (!canvas || !prevCanvas) return true;

        const ctx = canvas.getContext("2d");
        const prevCtx = prevCanvas.getContext("2d");
        const currentData = ctx.getImageData(0, 0, width, height).data;
        const previousData = prevCtx.getImageData(0, 0, width, height).data;

        let totalDiff = 0;
        let sampleCount = 0;
        const sampleStep = 8; // Sample every 8th pixel for performance

        for (let y = 0; y < height; y += sampleStep) {
          for (let x = 0; x < width; x += sampleStep) {
            const index = (y * width + x) * 4;
            const rDiff = Math.abs(currentData[index] - previousData[index]);
            const gDiff = Math.abs(
              currentData[index + 1] - previousData[index + 1]
            );
            const bDiff = Math.abs(
              currentData[index + 2] - previousData[index + 2]
            );
            const pixelDiff = (rDiff + gDiff + bDiff) / 3;

            totalDiff += pixelDiff;
            sampleCount++;
          }
        }

        const averageDiff = totalDiff / Math.max(1, sampleCount);
        return averageDiff >= motionThreshold;
      } catch (err) {
        console.error("Motion detection error:", err);
        return true; // Default to uploading on error
      }
    },
    [motionThreshold]
  );

  // Upload image blob to server
  const uploadBlob = useCallback(
    async (blob) => {
      const now = Date.now();

      // Throttle uploads
      if (now - lastUploadAtRef.current < minUploadIntervalMs) {
        return;
      }

      lastUploadAtRef.current = now;
      setIsUploading(true);

      try {
        const formData = new FormData();
        const filename = `camera_${now}.jpg`;
        formData.append("image", blob, filename);

        const response = await axios.post(uploadUrl, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
          timeout: 20000,
        });

        console.log("Upload success:", response.data);
      } catch (err) {
        console.error("Upload failed:", err);
      } finally {
        setIsUploading(false);
      }
    },
    [uploadUrl, minUploadIntervalMs]
  );

  // Update previous canvas with current frame
  const updatePreviousCanvas = useCallback((width, height) => {
    try {
      if (!prevCanvasRef.current) {
        prevCanvasRef.current = document.createElement("canvas");
      }

      prevCanvasRef.current.width = width;
      prevCanvasRef.current.height = height;
      const prevCtx = prevCanvasRef.current.getContext("2d");
      prevCtx.drawImage(videoRef.current, 0, 0, width, height);
    } catch (err) {
      console.error("Update previous canvas error:", err);
    }
  }, []);

  // Main capture loop
  useEffect(() => {
    if (!streaming) return;

    const captureFrame = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      const width = videoRef.current.videoWidth || 640;
      const height = videoRef.current.videoHeight || 480;

      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, width, height);

      let shouldUpload = true;

      // Check for motion if enabled
      if (enableMotionDetection) {
        if (!prevCanvasRef.current) {
          updatePreviousCanvas(width, height);
          shouldUpload = true;
        } else {
          shouldUpload = detectMotion(width, height);
        }
      }

      // Upload if motion detected or motion detection disabled
      if (shouldUpload) {
        canvas.toBlob(
          async (blob) => {
            if (blob) await uploadBlob(blob);
          },
          "image/jpeg",
          0.72
        );
      }

      // Update previous frame for next comparison
      updatePreviousCanvas(width, height);
    };

    intervalRef.current = setInterval(captureFrame, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    streaming,
    intervalMs,
    enableMotionDetection,
    detectMotion,
    uploadBlob,
    updatePreviousCanvas,
  ]);

  // Request camera permission on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startCamera();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #1a202c 0%, #2d3748 50%, #1a202c 100%)",
        padding: "16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
      <div
        style={{
          background: "#2d3748",
          borderRadius: "16px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
          overflow: "hidden",
          maxWidth: "800px",
          width: "100%",
          border: "1px solid #4a5568",
        }}>
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(90deg, #3182ce 0%, #805ad5 100%)",
            padding: "24px",
            textAlign: "center",
          }}>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "white",
              margin: 0,
            }}>
            Camera Auto-Capture
          </h2>
        </div>

        {/* Content */}
        <div style={{ padding: "24px" }}>
          {/* Permission Status */}
          <div style={{ marginBottom: "24px" }}>
            {permissionState === "granted" && streaming && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  color: "#48bb78",
                  background: "rgba(72, 187, 120, 0.1)",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid rgba(72, 187, 120, 0.2)",
                }}>
                <svg
                  style={{ width: "20px", height: "20px" }}
                  fill="currentColor"
                  viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span style={{ fontWeight: "500" }}>Kamera Aktif</span>
              </div>
            )}

            {permissionState === "denied" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  color: "#f56565",
                  background: "rgba(245, 101, 101, 0.1)",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid rgba(245, 101, 101, 0.2)",
                }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg
                    style={{ width: "20px", height: "20px" }}
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span style={{ fontWeight: "500" }}>Izin Kamera Ditolak</span>
                </div>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#a0aec0",
                    textAlign: "center",
                    margin: 0,
                  }}>
                  Buka pengaturan browser → Privacy & Security → Camera →
                  izinkan situs ini, lalu refresh halaman
                </p>
              </div>
            )}

            {permissionState === "unknown" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  color: "#4299e1",
                  background: "rgba(66, 153, 225, 0.1)",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid rgba(66, 153, 225, 0.2)",
                }}>
                <svg
                  style={{
                    width: "20px",
                    height: "20px",
                    animation: "spin 1s linear infinite",
                  }}
                  fill="none"
                  viewBox="0 0 24 24">
                  <circle
                    style={{ opacity: 0.25 }}
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    style={{ opacity: 0.75 }}
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span style={{ fontWeight: "500" }}>
                  Meminta Izin Kamera...
                </span>
              </div>
            )}
          </div>

          {/* Video Container */}
          <div
            style={{
              position: "relative",
              borderRadius: "12px",
              overflow: "hidden",
              background: "#000",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
            }}>
            <video
              ref={videoRef}
              style={{
                width: "100%",
                aspectRatio: "16/9",
                objectFit: "cover",
                display: "block",
              }}
              playsInline
              muted
            />

            {/* Upload Indicator */}
            {isUploading && (
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "#3182ce",
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                <svg
                  style={{
                    width: "16px",
                    height: "16px",
                    animation: "spin 1s linear infinite",
                  }}
                  fill="none"
                  viewBox="0 0 24 24">
                  <circle
                    style={{ opacity: 0.25 }}
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    style={{ opacity: 0.75 }}
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Uploading
              </div>
            )}

            {/* Recording Indicator */}
            {streaming && (
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  left: "16px",
                  background: "#e53e3e",
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    background: "white",
                    borderRadius: "50%",
                    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  }}
                />
                REC
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                marginTop: "16px",
                background: "rgba(245, 101, 101, 0.1)",
                border: "1px solid rgba(245, 101, 101, 0.2)",
                borderRadius: "8px",
                padding: "16px",
              }}>
              <p
                style={{
                  color: "#f56565",
                  fontSize: "14px",
                  margin: 0,
                }}>
                {error}
              </p>
            </div>
          )}

          {/* Status Info */}
          <div
            style={{
              marginTop: "24px",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
            }}>
            <div
              style={{
                background: "rgba(74, 85, 104, 0.5)",
                borderRadius: "8px",
                padding: "12px",
                textAlign: "center",
              }}>
              <p
                style={{
                  color: "#a0aec0",
                  fontSize: "12px",
                  marginBottom: "4px",
                }}>
                Status
              </p>
              <p
                style={{
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "500",
                  margin: 0,
                  textTransform: "capitalize",
                }}>
                {permissionState}
              </p>
            </div>
            <div
              style={{
                background: "rgba(74, 85, 104, 0.5)",
                borderRadius: "8px",
                padding: "12px",
                textAlign: "center",
              }}>
              <p
                style={{
                  color: "#a0aec0",
                  fontSize: "12px",
                  marginBottom: "4px",
                }}>
                Streaming
              </p>
              <p
                style={{
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "500",
                  margin: 0,
                }}>
                {streaming ? "Active" : "Inactive"}
              </p>
            </div>
            <div
              style={{
                background: "rgba(74, 85, 104, 0.5)",
                borderRadius: "8px",
                padding: "12px",
                textAlign: "center",
              }}>
              <p
                style={{
                  color: "#a0aec0",
                  fontSize: "12px",
                  marginBottom: "4px",
                }}>
                Motion Detect
              </p>
              <p
                style={{
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "500",
                  margin: 0,
                }}>
                {enableMotionDetection ? "On" : "Off"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `,
        }}
      />
    </div>
  );
}
