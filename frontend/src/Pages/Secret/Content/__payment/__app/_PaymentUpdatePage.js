import React, { useEffect, useState } from "react";
import "react-quill/dist/quill.snow.css";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  fetchPayment as fetch,
  updatePayment,
} from "../../../../../features/payments/paymentSlice";

const PaymentUpdatePage = () => {
  const { key } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // const { error } = useSelector((state) => state.payments);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("0"); // Ensure this is a string

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Extract dataProps from location state
  const dataProps = location.state?.dataProps;
  useEffect(() => {
    if (dataProps) {
      setTitle(dataProps.title || "");
      setBody(dataProps.body || "");
      setStatus(dataProps.status ? "1" : "0"); // Set status as string
    }

    window.scrollTo(0, 0);
  }, [dataProps]);

  useEffect(() => {
    if (key) {
      // Fetch data based on key if dataProps is not available
      const fetchData = async () => {
        setLoading(true);
        try {
          await dispatch(fetch(key)).unwrap();
        } catch (error) {
          console.error("Failed to fetch payment data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [dispatch, key, dataProps]);

  useEffect(() => {
    if (!location.state?.dataProps && !key) {
      navigate("/payments");
    }
  }, [location.state, key, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("body", body);
    formData.append("status", status); // Send as string
    if (image) {
      formData.append("image", image);
    }

    setLoading(true);
    try {
      await dispatch(updatePayment({ key, paymentData: formData })).unwrap();
      toast.success("Payment updated successfully!");
      if (dataProps) {
        navigate(-1);
      } else {
        navigate("/payments");
      }
    } catch (error) {
      toast.error("Failed to update the payment.");
      console.error("Failed to update the payment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (event) => {
    setImage(event.target.files[0]);
  };

  const handleStatusChange = () => {
    setStatus((prevStatus) => (prevStatus === "1" ? "0" : "1"));
  };

  return (
    <div className="bg-gradient-to-br from-transparent via-black to-black min-h-screen overflow-hidden">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Title</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input input-bordered"
            required
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Account Number</span>
          </label>
          <input
            type="number"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="input input-bordered"
            required
          />
        </div>
        <div className="form-control">
          <label className="label text-white">Visibility</label>
          <label className="swap">
            <input
              type="checkbox"
              checked={status === "1"}
              onChange={handleStatusChange}
            />
            <div className="swap-on">Visible</div>
            <div className="swap-off">Hidden</div>
          </label>
        </div>
        <div className="form-control">
          <label className="label text-white">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="file-input file-input-bordered w-full"
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}>
          {loading ? "Updating..." : "Update"}
        </button>
      </form>
    </div>
  );
};

export default PaymentUpdatePage;
