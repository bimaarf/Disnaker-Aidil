import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fetchBank } from "../../../../../features/bank/bankSlice";
import { CircularLoader } from "../../../../../Components/_CircularLoader";

const BankPreviewPage = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const banks = useSelector((state) => state.banks.banks);
  const user = useSelector((state) => state.auth.user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBankData = async () => {
      if (!key || key === "undefined" || key.trim() === "") {
        console.error("Invalid bank key:", key);
        toast.error("Invalid bank URL. Please select a valid bank.");
        navigate("/bank");
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
        navigate("/bank");
        setLoading(false);
      }
    };
    fetchBankData();
  }, [key, dispatch, banks, navigate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
  };

  const handleEditData = (data) => {
    navigate(`/bank/update/${data.key}`, {
      state: { key: data.key, dataProps: data },
    });
  };

  if (loading) {
    return <CircularLoader />;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="navbar bg-base-100 shadow-sm border-b border-base-300 sticky top-0 z-40">
        <div className="navbar-start">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>
        </div>
        <div className="navbar-center">
          <span className="text-sm text-base-content/60">Bank Preview</span>
        </div>
        <div className="navbar-end">
          {(user?.is_super_admin || user?.is_admin) && (
            <button
              onClick={() => handleEditData(data)}
              className="btn btn-primary text-white btn-sm gap-2">
              <span className="material-symbols-outlined text-sm">edit</span>
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4 rounded-2xl">
            <div className="aspect-square bg-base-200 rounded-2xl overflow-hidden shadow-sm border border-base-300">
              {data.image ? (
                <img
                  src={`${process.env.REACT_APP_API}${data.image}`}
                  alt={data?.bank_name || "Bank image"}
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
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className={`badge ${
                    data.status ? "badge-success" : "badge-warning"
                  } gap-2`}>
                  <span className="material-symbols-outlined text-xs">
                    {data.status ? "check_circle" : "pending"}
                  </span>
                  {data.status ? "Active" : "Inactive"}
                </div>
                <span className="text-xs text-base-content/60">
                  Created {formatDate(data?.created_at)}
                </span>
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold text-base-content leading-tight">
                {data?.bank_name || "Untitled Bank Account"}
              </h1>

              <div className="text-lg text-base-content/60">
                Account Number:{" "}
                <span className="font-semibold text-base-content">
                  {data?.account_number}
                </span>
              </div>
            </div>

            {/* Bank Details */}
            <div className="space-y-4">
              <div className="border-t border-base-300 pt-6">
                <h3 className="text-lg font-semibold mb-3">Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-base-content/60">Status:</span>
                    <p className="font-medium">
                      {data.status ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div>
                    <span className="text-base-content/60">Created:</span>
                    <p className="font-medium">
                      {formatDate(data?.created_at)}
                    </p>
                  </div>
                  <div>
                    <span className="text-base-content/60">Bank Name:</span>
                    <p className="font-medium">{data?.bank_name}</p>
                  </div>
                  <div>
                    <span className="text-base-content/60">
                      Account Number:
                    </span>
                    <p className="font-medium">{data?.account_number}</p>
                  </div>
                  <div>
                    <span className="text-base-content/60">Receiver Name:</span>
                    <p className="font-medium">{data?.receiver_name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {(user?.is_super_admin || user?.is_admin) && (
                <button
                  onClick={() => handleEditData(data)}
                  className="btn btn-primary text-white flex-1 gap-2">
                  <span className="material-symbols-outlined">edit</span>
                  Edit Bank Account
                </button>
              )}
              <button className="btn btn-outline gap-2">
                <span className="material-symbols-outlined">share</span>
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="mt-12 border-t border-base-300 pt-8">
          <div className="border-t border-base-300 pt-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                description
              </span>
              Description
            </h3>
            <div className="bg-base-100 rounded-xl p-6 border border-base-300">
              {data?.description ? (
                <div
                  className="prose prose-sm max-w-none text-base-content/80 leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                  dangerouslySetInnerHTML={{ __html: data.description }}
                />
              ) : (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl opacity-20 mb-2 block">
                    description
                  </span>
                  <p className="text-base-content/50">
                    No description available
                  </p>
                  <p className="text-sm text-base-content/30 mt-1">
                    {`This bank account doesn't have any description yet`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankPreviewPage;
