import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import useIsMobile from "../../../../../Context/__useIsMobile";
import {
  fetchBank as fetch,
  updateBank,
} from "../../../../../features/bank/bankSlice";
import TopBarProgress from "react-topbar-progress-indicator";

const BankUpdatePage = () => {
  const { key } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const dataProps = location.state?.dataProps;

  const [bank_name, setBankName] = useState("");
  const [receiver_name, setReceiverName] = useState("");
  const [account_number, setAccountNumber] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const { error } = useSelector((state) => state.banks);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (dataProps) {
      setBankName(dataProps.bank_name || "");
      setReceiverName(dataProps.receiver_name || "");
      setAccountNumber(dataProps.account_number || "");
      setDescription(dataProps.description || "");
      setStatus(!!dataProps.status);
      if (dataProps.image) {
        setExistingImage(dataProps.image);
        setImagePreview(`${process.env.REACT_APP_API}${dataProps.image}`);
      }
    } else if (key) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const bankData = await dispatch(fetch({ key })).unwrap();
          setBankName(bankData.bank_name || "");
          setReceiverName(bankData.receiver_name || "");
          setAccountNumber(bankData.account_number || "");
          setDescription(bankData.description || "");
          setStatus(!!bankData.status);
          if (bankData.image) {
            setExistingImage(bankData.image);
            setImagePreview(`${process.env.REACT_APP_API}${bankData.image}`);
          }
        } catch (err) {
          toast.error("Failed to fetch bank data.");
          navigate("/bank");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      navigate(isMobile && dataProps ? -2 : dataProps ? -1 : "/bank");
    }
  }, [dispatch, key, dataProps, navigate, isMobile]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Only JPEG, PNG, JPG, WebP allowed.");
      return;
    }

    if (file.size > maxSize) {
      toast.error("File too large. Max size is 2MB.");
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    setExistingImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("bank_name", bank_name);
      formData.append("receiver_name", receiver_name);
      formData.append("account_number", account_number);
      formData.append("description", description);
      formData.append("status", status ? 1 : 0);

      if (image) {
        formData.append("image", image);
      }

      const response = await dispatch(
        updateBank({ key, bankData: formData })
      ).unwrap();

      if (!response.errors) {
        toast.success("Bank account updated successfully!");
        navigate(dataProps ? -1 : "/bank");
      }
    } catch (err) {
      toast.error(
        "Error updating bank account: " + (err.message || "Unknown error")
      );
      console.error("Update error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100">
      {loading && <TopBarProgress />}

      {/* Navbar */}
      <div className="navbar bg-base-100 shadow-sm border-b border-base-300 sticky top-0 z-40">
        <div className="navbar-start">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>
        </div>
        <div className="navbar-center">
          <span className="text-sm text-base-content/60">
            Update Bank Account
          </span>
        </div>
        <div className="navbar-end">
          <button
            type="submit"
            form="bank-update-form"
            className="btn btn-primary text-white btn-sm gap-2"
            disabled={loading}>
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <span className="material-symbols-outlined text-sm">save</span>
            )}
            {loading ? "Updating..." : "Save"}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <form id="bank-update-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Section */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square bg-base-200 rounded-2xl overflow-hidden shadow-sm border border-base-300">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Bank image"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-base-content/40">
                    <span className="material-symbols-outlined text-6xl mb-2">
                      account_balance
                    </span>
                    <p className="text-sm">No image available</p>
                  </div>
                )}
              </div>

              {/* File Upload */}
              <div className="border p-4 border-base-300 rounded-lg bg-base-50">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-4xl text-base-content/60">
                      upload
                    </span>
                    <span className="text-sm font-medium text-base-content">
                      {existingImage ? "Change image" : "Upload image"}
                    </span>
                    <span className="text-xs text-base-content/70">
                      JPEG, PNG, JPG, WebP up to 2MB
                    </span>
                  </div>
                </label>
              </div>

              {/* Remove Image Button */}
              {(image || existingImage) && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="btn btn-error btn-sm btn-block text-white">
                  <span className="material-symbols-outlined text-sm">
                    delete
                  </span>
                  Remove Image
                </button>
              )}
            </div>

            {/* Form Fields Section */}
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <div
                  className={`badge ${
                    status ? "badge-success" : "badge-warning"
                  } gap-2`}>
                  <span className="material-symbols-outlined text-xs">
                    {status ? "check_circle" : "pending"}
                  </span>
                  {status ? "Active" : "Inactive"}
                </div>
              </div>

              {/* Bank Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-base-content">
                  Bank Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={bank_name}
                  onChange={(e) => setBankName(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="Enter bank name..."
                  required
                />
                {error?.bank_name && (
                  <p className="text-error text-sm mt-1">{error.bank_name}</p>
                )}
              </div>

              {/* Receiver Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-base-content">
                  Receiver Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={receiver_name}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="Enter receiver name..."
                  required
                />
                {error?.receiver_name && (
                  <p className="text-error text-sm mt-1">
                    {error.receiver_name}
                  </p>
                )}
              </div>

              {/* Account Number */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-base-content">
                  Account Number <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={account_number}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="Enter account number..."
                  required
                />
                {error?.account_number && (
                  <p className="text-error text-sm mt-1">
                    {error.account_number}
                  </p>
                )}
              </div>

              {/* Status Toggle */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    verified
                  </span>
                  Account Status
                </h3>
                <div className="bg-base-200 rounded-xl p-4 border border-base-300">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-semibold text-base-content">
                        {status ? "Active" : "Inactive"}
                      </span>
                      <p className="text-sm text-base-content/70 mt-1">
                        {status
                          ? "This bank account is active and visible"
                          : "This bank account is inactive and hidden"}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary toggle-lg"
                      checked={status}
                      onChange={(e) => setStatus(e.target.checked)}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-8 border-t border-base-300 pt-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                description
              </span>
              Description
            </h3>
            <div className="rounded-xl border border-base-300 bg-base-200">
              <ReactQuill
                value={description}
                onChange={setDescription}
                theme="snow"
                className="react-quill modern-quill"
                placeholder="Write bank account description here..."
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ["bold", "italic", "underline", "strike"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["blockquote", "code-block"],
                    ["link"],
                    ["clean"],
                  ],
                }}
              />
            </div>
            {error?.description && (
              <p className="text-error text-sm mt-2">{error.description}</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline"
              disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary text-white gap-2"
              disabled={loading}>
              {loading && (
                <span className="loading loading-spinner loading-sm"></span>
              )}
              {loading ? "Updating..." : "Update Bank Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BankUpdatePage;
