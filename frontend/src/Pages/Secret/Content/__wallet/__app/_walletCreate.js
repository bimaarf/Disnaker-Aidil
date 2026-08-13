import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CircularLoader } from "../../../../../Components/_CircularLoader";
import useIsMobile from "../../../../../Context/__useIsMobile";
import { selectUser } from "../../../../../features/authentication/AuthSlice";
import { createWallet } from "../../../../../features/wallets/walletSlice";
import { ProfileBox } from "../../__dashboard/__components/__profile/__profileBox";
import { ProfileHeader } from "../../__dashboard/__components/__profile/__profileHeader";
import { CurrentWalletList } from "./_currentWalletList";

const WalletCreatePage = () => {
  const [account_name, setAccountName] = useState("");
  const [account_number, setAccountNumber] = useState("");
  const [status, setStatus] = useState(true);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { error } = useSelector((state) => state.wallets);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("account_name", account_name);
    formData.append("account_number", account_number);
    user.role == "administrator" &&
      formData.append("status", status ? "1" : "0");

    try {
      await dispatch(createWallet(formData)).unwrap();
      navigate("/wallets");
      toast.success("Wallet created successfully!");
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
      <div className="md:flex items-start gap-4">
        <form onSubmit={handleSubmit} className="space-y-6 md:w-3/5">
          <ProfileBox />
          <div className="form-control">
            <label className="label text-white">Account Name</label>
            <input
              type="text"
              value={account_name}
              onChange={(e) => setAccountName(e.target.value)}
              className={`input input-bordered w-full ${
                error?.account_name ? "border-red-500" : ""
              }`}
              required
            />
            {error?.account_name && (
              <div className="text-red-500">
                {error.account_name.join(", ")}
              </div>
            )}
          </div>
          <div className="form-control">
            <label className="label text-white">Account Number</label>
            <input
              type="number"
              value={account_number}
              onChange={(e) => setAccountNumber(e.target.value)}
              className={`input input-bordered w-full ${
                error?.account_number ? "border-red-500" : ""
              }`}
              required
            />
            {error?.account_number && (
              <div className="text-red-500">
                {error.account_number.join(", ")}
              </div>
            )}
          </div>
          {user.role === "administrator" && (
            <div className="form-control">
              <label className="label text-white">Status</label>
              <label className="swap w-fit">
                <input
                  type="checkbox"
                  checked={status}
                  onChange={() => setStatus((prevStatus) => !prevStatus)}
                />
                <div className="swap-on flex items-center gap-1 text-success">
                  <span className="material-symbols-outlined">key</span>
                  <span>Active</span>
                </div>
                <div className="swap-off flex items-center gap-1 text-warning">
                  <span className="material-symbols-outlined">lock</span>
                  <span>Suspend</span>
                </div>
              </label>
              {error?.status && (
                <div className="text-red-500">{error.status.join(", ")}</div>
              )}
            </div>
          )}
          <div className="form-control"></div>
          {renderErrorMessages()}
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}>
            {loading ? "Creating..." : "Create Wallet"}
          </button>
        </form>
        {!isMobile && (
          <div className="w-2/5">
            <ProfileHeader />
            <CurrentWalletList />
          </div>
        )}
      </div>
    </>
  );
};

export default WalletCreatePage;
