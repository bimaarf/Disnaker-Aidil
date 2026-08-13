import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useIsMobile from "../../../../../../Context/__useIsMobile";
import { createDeposit } from "../../../../../../features/deposits/depositSlice";
import { fetchPayments } from "../../../../../../features/payments/paymentSlice";
import { fetchCurrent } from "../../../../../../features/wallets/walletSlice";
import RupiahInputV2 from "../../../../Components/rupiahInputV2";

export const DepositBankForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const payments = useSelector((state) => state.payments.payments || []);
  const wallets = useSelector((state) => state.wallets.currentWallets || []);

  const status = useSelector((state) => state.payments.status);
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [currentPage] = useState(1);
  const [currentPageWallet] = useState(1);
  const [amount, setAmount] = useState(""); // Store raw number
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchPayments({ page: currentPage, perPage: 10 }))
        .unwrap()
        .catch(() => toast.error("Failed to fetch payment methods."));
    }
    window.scrollTo(0, 0);
  }, [dispatch, status, currentPage]);

  useEffect(() => {
    if (status === "idle") {
      dispatch(
        fetchCurrent({ pageFilter: currentPageWallet, perPageFilter: 10 })
      )
        .unwrap()
        .catch(() => toast.error("Failed to fetch wallets."));
    }
  }, [dispatch, status, currentPageWallet]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!amount || !selectedPaymentMethod || !selectedWallet) {
        toast.error("Please fill in all required fields.");
        return;
      }
      const depositData = {
        amount: parseInt(amount.replace(/[^0-9]/g, "")), // Use raw number for submission
        payment_id: selectedPaymentMethod.id,
        wallet_id: selectedWallet.id,
      };

      dispatch(createDeposit(depositData))
        .unwrap()
        .then((response) => {
          toast.success("Deposit created successfully.");
          setAmount("");
          setSelectedPaymentMethod(null);
          setSelectedWallet(null);
          navigate(`/deposit/bank/preview/${response.key}`);
        })
        .catch(() => toast.error("Failed to create deposit."));
    } catch (error) {
      toast.error("Failed to create deposit.");
    } finally {
      setLoading(false);
    }
  };

  const uniquePayments = {};
  const visiblePayments = payments.filter((method) => {
    if (method.status && !uniquePayments[method.id]) {
      uniquePayments[method.id] = true;
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      setSelectedWallet(wallets[0]);
    }
  }, [wallets, selectedWallet]);

  return (
    <div className="">
      <div className="p-2 space-y-4">
        <div className="w-full space-y-2 gap-1">
          <div className="flex label-text font-mono text-xs items-start gap-2">
            <p className="text-white">Jumlah</p>
            <p className="text-red-500">*</p>
          </div>
          <RupiahInputV2
            initialValue={amount}
            onChange={(value) => setAmount(value)}
          />
          <p className="text-[10px] text-white font-mono -tracking-wider">
            Min: 10,000.00 | Max: 100,000,000.00
          </p>
        </div>
        <div className="w-full space-y-2 gap-1">
          <div className="flex label-text font-mono text-xs items-start gap-2">
            <p className="text-white">Akun Asal</p>
            <p className="text-red-500">*</p>
          </div>
          <div className="form-control w-full">
            <input
              disabled
              type="text"
              value={`${selectedWallet?.account_name} | ${selectedWallet?.account_number}`}
              placeholder={`${selectedWallet?.account_name}`}
              className="px-2 py-2 text-right font-mono w-full outline-none border border-base-300 focus:border-yellow-600 rounded focus:bg-base-100/30 bg-base-300/30"
            />
          </div>
        </div>
        <div className="w-full space-y-2 gap-1">
          <div className="flex label-text font-mono text-xs items-start gap-2">
            <p className="text-white">Akun Tujuan</p>
            <p className="text-red-500">*</p>
          </div>
          <div className="form-control w-full">
            {visiblePayments.length === 0 ? (
              <p>No Payment Method available</p>
            ) : (
              visiblePayments.map((payment) => (
                <div
                  key={payment.id}
                  onClick={() => setSelectedPaymentMethod(payment)}
                  className={`flex mb-2 justify-between items-center border cursor-pointer hover:bg-base-300/45 p-2 ${
                    selectedPaymentMethod?.id === payment.id
                      ? "border-cyan-700"
                      : "border-base-300"
                  } ${isMobile && "text-sm"}`}>
                  <div className="flex justify-start items-center gap-2">
                    {payment.image ? (
                      <div className="flex items-center h-12 w-20">
                        <div className=" object-contain">
                          <img
                            src={`${process.env.REACT_APP_API}payment/images/${payment.image}`}
                            alt="Avatar"
                          />
                        </div>
                      </div>
                    ) : (
                      <span
                        className={`${
                          selectedPaymentMethod?.id === payment.id
                            ? "text-cyan-700"
                            : "text-neutral"
                        } text-4xl h-12 w-20 text-center bg-base-200/45 material-symbols-outlined`}>
                        payment
                      </span>
                    )}
                    <div>
                      <h1 className="font-medium">{payment.title}</h1>
                      <h1 className="font-medium text-neutral text-sm">
                        {payment.body}
                      </h1>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn btn-sm md:btn-md bg-base-300/50">
                      <span className="md:text-xl text-sm material-symbols-outlined">
                        {selectedPaymentMethod?.id === payment.id
                          ? "check_circle"
                          : "select"}
                      </span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div
            disabled={loading}
            onClick={handleSubmit}
            className="flex justify-center mt-4 brightness-90">
            <button
              disabled={loading}
              className="px-4 py-1 w-1/3 h-10 text-pretty rounded font-body uppercase text-xs bg-white/20">
              Kirim
            </button>
          </div>
        </div>
      </div>
      {/* ----------- */}
      {/* ----------- */}
      {/* ----------- */}
    </div>
  );
};
