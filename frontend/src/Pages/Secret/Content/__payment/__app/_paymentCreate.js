import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CircularLoader } from "../../../../../Components/_CircularLoader";
import { createPayment } from "../../../../../features/payments/paymentSlice";

const PaymentCreatePage = () => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState(true); // true for ON, false for OFF
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { error } = useSelector((state) => state.payments); // Updated to state.payments

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImage(null);
      setImagePreview("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("body", body);
    formData.append("status", status ? "1" : "0");

    if (image) {
      formData.append("image", image);
    }

    try {
      await dispatch(createPayment(formData)).unwrap();
      navigate("/payments");
      toast.success("Payment created successfully!");
    } catch (err) {
      toast.error("Validation error occurred. Please check the fields.");
    } finally {
      setLoading(false);
    }
  };

  const renderErrorMessages = (error) => {
    if (typeof error === "object" && error !== null) {
      return Object.keys(error).map((key) => {
        const messages = error[key];
        if (Array.isArray(messages)) {
          return messages.map((message, index) => (
            <div key={index} className="error-message">
              {message}
            </div>
          ));
        }
        return null; // In case messages is not an array
      });
    }
    return null; // In case error is not an object
  };
  return (
    <>
      {loading && <CircularLoader />}
      <div className="bg-gradient-to-br from-transparent via-black to-black min-h-screen overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-control">
            <label className="label text-white">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`input input-bordered w-full ${
                error?.title ? "border-red-500" : ""
              }`}
              required
            />
            {error?.title && (
              <div className="text-red-500">{error.title.join(", ")}</div>
            )}
          </div>
          <div className="form-control">
            <label className="label text-white">Account Number</label>
            <input
              type="text"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={`input input-bordered w-full ${
                error?.body ? "border-red-500" : ""
              }`}
              required
            />
            {error?.body && (
              <div className="text-red-500">{error.body.join(", ")}</div>
            )}
          </div>
          <div className="form-control">
            <label className="label text-white">Visibility</label>
            <label className="swap">
              <input
                type="checkbox"
                checked={status}
                onChange={() => setStatus((prevStatus) => !prevStatus)}
              />
              <div className="swap-on">ON</div>
              <div className="swap-off">OFF</div>
            </label>
            {error?.status && (
              <div className="text-red-500">{error.status.join(", ")}</div>
            )}
          </div>
          <div className="form-control">
            <label className="label text-white">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="file-input file-input-bordered w-full"
            />
            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-xs max-h-64 object-cover"
                />
              </div>
            )}
          </div>
          {renderErrorMessages()}
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}>
            {loading ? "Creating..." : "Create Payment"}
          </button>
        </form>
      </div>
    </>
  );
};

export default PaymentCreatePage;
