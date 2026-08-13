import React, { useState } from "react";
import axios from "axios";

const WhatsappNotificationForm = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [responseMessage, setResponseMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResponseMessage(null);
    setIsError(false);
    setIsLoading(true);

    const formData = new FormData();
    formData.append("phone_number", phoneNumber);
    formData.append("message", message);
    if (image) formData.append("image", image);
    if (file) formData.append("file", file);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE}/api/send-whatsapp`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setResponseMessage(response.data.message);
      setIsError(!response.data.success);
      setPhoneNumber("");
      setMessage("");
      setImage(null);
      setFile(null);
      e.target.reset(); // Reset file inputs
    } catch (error) {
      setResponseMessage(
        error.response?.data?.error || "Failed to send notification"
      );
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="whatsapp-form-container mt-8">
      <h2 className="text-xl font-bold mb-4">Send WhatsApp Notification</h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        encType="multipart/form-data">
        <div>
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            type="text"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+628123456789"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-gray-700">
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows="4"
            required
          />
        </div>
        <div>
          <label
            htmlFor="image"
            className="block text-sm font-medium text-gray-700">
            Image (optional)
          </label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
        <div>
          <label
            htmlFor="file"
            className="block text-sm font-medium text-gray-700">
            File (optional)
          </label>
          <input
            type="file"
            id="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setFile(e.target.files[0])}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}>
          {isLoading ? "Sending..." : "Send Notification"}
        </button>
      </form>
      {responseMessage && (
        <div
          className={`mt-4 p-2 rounded-md ${
            isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}>
          {responseMessage}
        </div>
      )}
    </div>
  );
};

export default WhatsappNotificationForm;
