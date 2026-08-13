import React, { useState } from "react";
import { useWhatsappSocket } from "../../utils/SocketWhatsappContext";
import {
  MessageCircle,
  Phone,
  Send,
  Trash2,
  Image,
  FileText,
  X,
  LogOut,
} from "lucide-react";

const WhatsAppNotificationSystem = () => {
  const { qrCode, status } = useWhatsappSocket();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [images, setImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [sendImageAsMedia, setSendImageAsMedia] = useState(false);
  const [responseMessage, setResponseMessage] = useState(null);
  const [extractedText, setExtractedText] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [fileNames, setFileNames] = useState([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setImages((prev) => [...prev, ...selectedFiles]);

      selectedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreviews((prev) => [
            ...prev,
            { file: file.name, url: reader.result },
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFiles((prev) => [...prev, ...selectedFiles]);
      setFileNames((prev) => [...prev, ...selectedFiles.map((f) => f.name)]);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileNames((prev) => prev.filter((_, i) => i !== index));
  };

  const clearForm = () => {
    setPhoneNumber("");
    setMessage("");
    setImages([]);
    setFiles([]);
    setSendImageAsMedia(false);
    setImagePreviews([]);
    setFileNames([]);
    setExtractedText(null);
  };

  const handleLogout = async () => {
    if (
      !window.confirm(
        "Yakin ingin logout dari WhatsApp? QR code baru akan muncul."
      )
    ) {
      return;
    }

    setIsLoggingOut(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API}api/logout-whatsapp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("WhatsApp berhasil logout. Silakan scan QR code kembali.");
      } else {
        throw new Error(data.error || "Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert(`Gagal logout: ${error.message}`);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResponseMessage(null);
    setExtractedText(null);
    setIsError(false);
    setIsLoading(true);

    const formData = new FormData();
    formData.append("phone_number", phoneNumber);
    formData.append("message", message);
    formData.append("sendImageAsMedia", sendImageAsMedia.toString());

    // Append multiple images
    images.forEach((image) => {
      formData.append("images", image);
    });

    // Append multiple files
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API}api/send-whatsapp`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      setResponseMessage(data.message || "No response from server");
      setExtractedText(data.extractedText);
      setIsError(!data.success);

      if (data.success) clearForm();
    } catch (error) {
      console.error("Frontend error:", error.message);
      setResponseMessage(`Failed to send notification: ${error.message}`);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatusMessage = () => {
    switch (status) {
      case "qr-pending":
        return "Scan QR code with WhatsApp";
      case "ready":
        return "WhatsApp connected";
      case "authenticated":
        return "WhatsApp authenticated";
      case "disconnected":
        return "WhatsApp disconnected";
      case "auth_failure":
        return "Authentication failed";
      case "logged_out":
        return "Logged out - scan QR to reconnect";
      default:
        return "Connecting to WhatsApp...";
    }
  };

  const getStatusStyles = () => {
    switch (status) {
      case "ready":
      case "authenticated":
        return "bg-success/5 text-success border-success";
      case "qr-pending":
        return "bg-primary/5 text-primary border-primary";
      case "disconnected":
      case "auth_failure":
      case "logged_out":
        return "bg-error/5 text-error border-error";
      default:
        return "bg-base-300/5 text-base-content/60 border-base-300";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "ready":
      case "authenticated":
        return (
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        );
      case "qr-pending":
        return (
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
        );
      case "disconnected":
      case "auth_failure":
      case "logged_out":
        return (
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        );
      default:
        return (
          <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></div>
        );
    }
  };

  return (
    <div className="min-h-[90vh] bg-gradient-to-br from-base-100 to-base-200">
      {/* Modern Header with Glass Effect */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-base-100/80 border-b border-base-300/50">
        <div className="px-8 py-6">
          <div className="md:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-base-content bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  WhatsApp Notification
                </h1>
                <div className="flex justify-end">
                  <p className="text-sm text-base-content/80 mt-1">
                    Send messages and media to WhatsApp contacts
                  </p>
                </div>
              </div>
            </div>

            {/* Status indicator with Logout button */}
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-3 px-4 py-2 rounded-full border ${getStatusStyles()}`}>
                {getStatusIcon()}
                <span className="text-sm font-medium">
                  {renderStatusMessage()}
                </span>
                {status === "connecting" && (
                  <div className="flex space-x-1 ml-2">
                    <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
                    <div
                      className="w-1 h-1 bg-current rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}></div>
                    <div
                      className="w-1 h-1 bg-current rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}></div>
                  </div>
                )}
              </div>

              {/* Logout Button - only show when connected */}
              {(status === "ready" || status === "authenticated") && (
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Logout WhatsApp">
                  {isLoggingOut ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="md:p-8 p-2 max-w-6xl">
        {/* Main Content Card with Modern Design */}
        <div className="bg-base-100/60 backdrop-blur-sm rounded-2xl border border-base-300/50 shadow-xl shadow-base-300/20 overflow-hidden">
          {/* QR Code Section */}
          {qrCode && (
            <div className="bg-gradient-to-r from-primary/10 to-primary/10 p-8 border-b border-blue-100/50">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 bg-primary/90 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-100"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-primary/90 mb-1">
                    Scan QR Code
                  </h3>
                  <p className="text-sm text-base-content/80">
                    Scan this QR code with your WhatsApp to connect
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative bg-white p-6 rounded-2xl shadow-2xl">
                    <img
                      src={qrCode}
                      alt="WhatsApp QR Code"
                      className="w-48 h-48 rounded-xl"
                    />
                    <div className="absolute top-2 right-2 w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Section */}
          {(status === "authenticated" || status === "ready") && (
            <div className="p-8 space-y-8">
              {/* Phone Number Section */}
              <div>
                <h2 className="text-xl font-bold text-base-content mb-6 flex items-center gap-3">
                  <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                  Phone Number
                </h2>

                <div className="bg-base-200 rounded-2xl border border-base-300 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-lg overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="font-semibold text-base-content">
                        Recipient Phone Number
                      </span>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-base-content/70">
                        Phone Number (with country code)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl bg-primary/10 text-base-content focus:border-blue-500 hover:border-blue-300 transition-all duration-200 placeholder:text-base-content/80"
                          placeholder="+628123456789"
                          required
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <Phone className="w-5 h-5 text-blue-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Section */}
              <div>
                <h2 className="text-xl font-bold text-base-content mb-6 flex items-center gap-3">
                  <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                  Message Content
                </h2>

                <div className="bg-base-200 rounded-2xl border border-base-300 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-lg overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="font-semibold text-base-content">
                        Message Text
                      </span>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-base-content/70">
                        Message
                      </label>
                      <div className="relative">
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows="4"
                          className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl bg-primary/10 text-base-content focus:border-blue-500 hover:border-blue-300 transition-all duration-200 placeholder:text-base-content/80 resize-none"
                          placeholder="Type your message here..."
                          required
                        />
                        <div className="absolute bottom-4 right-4">
                          <MessageCircle className="w-5 h-5 text-blue-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Uploads Section */}
              <div>
                <h2 className="text-xl font-bold text-base-content mb-6 flex items-center gap-3">
                  <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                  Attachments (Optional)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Image Upload */}
                  <div className="bg-base-200 rounded-2xl border border-base-300 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-lg overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="font-semibold text-base-content">
                          Image Upload
                        </span>
                      </div>

                      <div className="space-y-4">
                        <input
                          type="file"
                          id="image"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="image"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-xl cursor-pointer bg-primary/10 hover:border-blue-400 transition-all duration-300 group">
                          <Image className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
                          <p className="mt-2 text-sm text-base-content/80 group-hover:text-blue-500 transition-colors duration-300">
                            Click to upload images (multiple)
                          </p>
                          <p className="text-xs text-base-content/60 mt-1">
                            {images.length} file(s) selected
                          </p>
                        </label>

                        {imagePreviews.length > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            {imagePreviews.map((preview, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={preview.url}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-xl shadow-lg"
                                />
                                <button
                                  onClick={() => removeImage(index)}
                                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100">
                                  <X className="w-3 h-3" />
                                </button>
                                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                  {index + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className="bg-base-200 rounded-2xl border border-base-300 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-lg overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="font-semibold text-base-content">
                          Document Upload
                        </span>
                      </div>

                      <div className="space-y-4">
                        <input
                          type="file"
                          id="file"
                          accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="file"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-xl cursor-pointer bg-primary/10 hover:border-blue-400 transition-all duration-300 group">
                          <FileText className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
                          <p className="mt-2 text-sm text-base-content/80 group-hover:text-blue-500 transition-colors duration-300">
                            Click to upload documents (multiple)
                          </p>
                          <p className="text-xs text-base-content/60 mt-1">
                            {files.length} file(s) selected
                          </p>
                        </label>

                        {fileNames.length > 0 && (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {fileNames.map((name, index) => (
                              <div
                                key={index}
                                className="bg-base-200 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                  <div className="w-8 h-8 bg-base-300 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-4 h-4 text-blue-500" />
                                  </div>
                                  <span className="text-sm text-base-content truncate">
                                    {name}
                                  </span>
                                </div>
                                <button
                                  onClick={() => removeFile(index)}
                                  className="w-7 h-7 bg-red-500/20 hover:bg-red-500/30 rounded-lg flex items-center justify-center text-red-500 transition-all duration-300 flex-shrink-0 ml-2">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-6 border-t border-base-300 gap-4">
                <button
                  onClick={clearForm}
                  className="px-6 py-3 rounded-xl text-base-content/60 bg-base-100 hover:bg-base-300/30 transition-all duration-200 flex items-center gap-2 border border-gray-200">
                  <Trash2 className="w-4 h-4" />
                  Clear Form
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="relative px-8 py-4 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3 min-w-[180px] justify-center border border-blue-500/20">
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}

                  <span>{isLoading ? "Sending..." : "Send Message"}</span>

                  {/* Shine effect */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-all duration-700"></div>
                </button>
              </div>

              {/* Response Message */}
              {responseMessage && (
                <div
                  className={`p-6 rounded-2xl border transition-all duration-500 ${
                    isError
                      ? "bg-error/10 border-error/30 text-error"
                      : "bg-success/10 border-success/30 text-success"
                  } shadow-lg`}>
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center mt-1 ${
                        isError ? "bg-red-500/20" : "bg-green-500/20"
                      }`}>
                      {isError ? (
                        <X className="w-4 h-4" />
                      ) : (
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2">
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{responseMessage}</p>
                      {extractedText && !sendImageAsMedia && (
                        <div className="mt-4 p-4 bg-base-200 rounded-xl border border-base-300/50">
                          <p className="font-semibold text-base-content mb-2">
                            Extracted Text:
                          </p>
                          <pre className="text-sm whitespace-pre-wrap text-base-content/80 leading-relaxed">
                            {extractedText}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {status !== "authenticated" && status !== "ready" && !qrCode && (
            <div className="text-center py-16">
              <div className="relative mb-6">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                <div
                  className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto"
                  style={{
                    animationDelay: "0.3s",
                    animationDuration: "1.5s",
                  }}></div>
              </div>
              <p className="text-base-content/80 text-lg">
                Connecting to WhatsApp server...
              </p>
              <p className="text-base-content/60 text-sm mt-2">
                Please wait while we establish connection
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppNotificationSystem;
