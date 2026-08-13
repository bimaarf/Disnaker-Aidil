import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "../../../../../App.css";
import { fetchBank } from "../../../../../features/bank/bankSlice";
import { ShoppingCart } from "lucide-react";

const BankPreviewHome = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const banks = useSelector((state) => state.banks.banks);
  const status = useSelector((state) => state.banks.status);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBankData = async () => {
      if (!key || key === "undefined" || key.trim() === "") {
        console.error("Invalid bank key:", key);
        toast.error("Invalid bank URL. Please select a valid bank.");
        navigate("/");
        setLoading(false);
        return;
      }

      try {
        const cachedBank = banks.find((bank) => bank.key === key);
        if (cachedBank) {
          console.log("Using cached bank:", cachedBank);
          setData(cachedBank);
          setLoading(false);
          return;
        }

        const bankData = await dispatch(fetchBank(key)).unwrap();
        console.log("Fetched bank data:", bankData);
        setData(bankData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching bank:", err);
        const errorMessage =
          err?.message?.includes("404") || err?.message?.includes("not found")
            ? "Bank not found or not accessible."
            : "Failed to load bank data.";
        toast.error(errorMessage);
        navigate("/");
        setLoading(false);
      }
    };

    fetchBankData();
  }, [key, dispatch, banks, navigate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
  };

  if (loading && status === "loading") {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-200 border-t-blue-600"></div>
          <p className="text-sm text-gray-600 font-medium">
            Loading bank account...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const backgroundImage = data.image
    ? `${process.env.REACT_APP_API}${data.image}`
    : "https://via.placeholder.com/1200x400?text=Bank+Background";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Background */}
      <div
        className="relative h-[40vh] bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent"></div>
        <div className="absolute top-6 left-6">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg shadow-sm transition-all duration-200 backdrop-blur-sm">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative -mt-48 max-w-7xl px-4 sm:px-8 mx-auto rounded-3xl shadow bg-white">
        <div className="grid grid-cols-1 pt-4 sm:pt-8 lg:grid-cols-2 gap-10">
          {/* Image Section */}
          <div className="space-y-4 relative">
            <div className="aspect-square bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-200">
              {data.image ? (
                <img
                  src={`${process.env.REACT_APP_API}${data.image}`}
                  alt={data?.bank_name || "Bank image"}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <svg
                    className="w-16 h-16 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 2v20M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6"
                    />
                  </svg>
                  <p className="text-sm font-medium">No image available</p>
                </div>
              )}
            </div>
          </div>

          {/* Bank Info Section */}
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  data.status
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20">
                  {data.status ? (
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  ) : (
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  )}
                </svg>
                {data.status ? "Active" : "Inactive"}
              </span>
              <span className="text-sm text-gray-500">
                Created {formatDate(data?.created_at)}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              {data?.bank_name || "Untitled Bank"}
            </h1>

            {/* Account Number */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-600 mb-1">Account Number</p>
              <p className="text-xl font-bold text-blue-900">
                {data?.account_number}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(data.account_number);
                  toast.success("Account number copied!");
                }}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 shadow-sm">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                Copy Account Number
              </button>
              <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-sm">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
                Share
              </button>
            </div>

            {/* Bank Details */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Bank Details
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium text-gray-900">
                    {data.status ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Bank Name</span>
                  <span className="font-medium text-gray-900">
                    {data?.bank_name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Account Number</span>
                  <span className="font-medium text-gray-900">
                    {data?.account_number}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Created</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(data?.created_at)}
                  </span>
                </div>
                <div>
                  <span className="text-base-content/60">Receiver Name:</span>
                  <p className="font-medium">{data?.receiver_name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="border-t border-gray-200">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Description</h3>
            </div>

            {data?.description ? (
              <div
                className="prose prose-lg prose-gray max-w-none text-gray-700 leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                dangerouslySetInnerHTML={{ __html: data.description }}
              />
            ) : (
              <div className="text-center py-16">
                <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  No description available
                </h4>
                <p className="text-gray-500">
                  This bank account doesn't have a description yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankPreviewHome;
