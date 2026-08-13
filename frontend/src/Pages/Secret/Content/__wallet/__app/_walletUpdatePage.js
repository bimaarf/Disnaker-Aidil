import React, { useEffect, useState } from "react";
import "react-quill/dist/quill.snow.css";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useIsMobile from "../../../../../Context/__useIsMobile";
import {
  fetchWallet as fetch,
  updateWallet,
} from "../../../../../features/wallets/walletSlice";
import { ProfileBox } from "../../__dashboard/__components/__profile/other/__profileBox";
import { OtherWalletList } from "./_otherWalletList";
import { ProfileHeader } from "../../__dashboard/__components/__profile/other/__profileHeader";
import { selectUser } from "../../../../../features/authentication/AuthSlice";

const WalletUpdatePage = () => {
  const { key } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const [email, setEmail] = useState("");
  const [account_name, setAccountName] = useState("");
  const [account_number, setAccountNumber] = useState("");
  const [balance, setBalance] = useState(""); // Nilai integer untuk pengolahan
  const [formattedBalance, setFormattedBalance] = useState(""); // Nilai format untuk ditampilkan
  const [status, setStatus] = useState("0");
  const [loading, setLoading] = useState(false);
  const userWallet = useSelector((state) => state.wallets.otherUser) || [];
  const user = useSelector(selectUser);

  const dataProps = location.state?.dataProps;
  useEffect(() => {
    if (dataProps) {
      setEmail(dataProps.email || "");
      setAccountName(dataProps.account_name || "");
      setAccountNumber(dataProps.account_number || "");
      setBalance(dataProps.balance || "");
      setFormattedBalance(formatRupiah(dataProps.balance || "")); // Format saat di-load
      setStatus(dataProps.status ? "1" : "0");
    }

    window.scrollTo(0, 0);
  }, [dataProps]);

  useEffect(() => {
    if (key) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const walletData = await dispatch(fetch(key)).unwrap();
          setEmail(walletData.email);
          setAccountName(walletData.account_name);
          setAccountNumber(walletData.account_number);
          setBalance(walletData.balance);
          setFormattedBalance(formatRupiah(walletData.balance));
          setStatus(walletData.status ? "1" : "0");
        } catch (error) {
          console.error("Failed to fetch wallet data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [dispatch, key]);

  useEffect(() => {
    if (!location.state?.dataProps && !key) {
      navigate("/wallets");
    }
  }, [location.state, key, navigate]);

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleBalanceChange = (event) => {
    const value = event.target.value.replace(/\D/g, ""); // Hapus semua karakter non-digit
    setBalance(value); // Simpan nilai integer
    setFormattedBalance(formatRupiah(value)); // Update tampilan format
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("account_name", account_name);
    formData.append("account_number", account_number);
    formData.append("balance", balance); // Kirim nilai integer
    formData.append("status", status);

    setLoading(true);
    try {
      await dispatch(updateWallet({ key: key, walletData: formData })).unwrap();
      toast.success("Wallet updated successfully!");
      if (dataProps) {
        navigate(-1);
      } else {
        navigate(-1);
      }
    } catch (error) {
      toast.error("Failed to update the wallet.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = () => {
    setStatus((prevStatus) => (prevStatus === "1" ? "0" : "1"));
  };

  return (
    <>
      <div className="divider divider-primary">Account</div>

      <div className="md:flex items-start gap-4">
        <form onSubmit={handleSubmit} className="space-y-4 md:w-3/5">
          <ProfileBox data={userWallet} />
          <div className="form-control">
            <label className="label">
              <span className="label-text">Account Name</span>
            </label>
            <input
              type="text"
              value={account_name}
              onChange={(e) => setAccountName(e.target.value)}
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
              value={account_number}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="input input-bordered"
              required
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Balance</span>
            </label>
            <input
              disabled={
                user.role === "administrator" || user.role === "Super Admin"
                  ? false
                  : true
              }
              type="text"
              value={formattedBalance} // Tampilkan saldo dalam format rupiah
              onChange={handleBalanceChange} // Panggil fungsi saat berubah
              className="input input-bordered"
              required
            />
          </div>
          <div className="form-control">
            <label className="label text-white">Status</label>
            <label className="swap w-fit">
              <input
                disabled={
                  user.role === "administrator" || user.role === "Super Admin"
                    ? false
                    : true
                }
                type="checkbox"
                checked={status === "1"}
                onChange={handleStatusChange}
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
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}>
            {loading ? "Updating..." : "Update"}
          </button>
        </form>
        {!isMobile && (
          <div className="w-2/5">
            <ProfileHeader data={userWallet} />
            <OtherWalletList email={email} />
          </div>
        )}
      </div>
    </>
  );
};

export default WalletUpdatePage;
