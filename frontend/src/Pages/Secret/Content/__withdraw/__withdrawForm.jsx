import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { rupiahFormat } from "../../../../Context/__rupiahFormat";
import { fetchCurrent } from "../../../../features/wallets/walletSlice";
import { createWithdraw } from "../../../../features/withdraws/withdrawSlice";
import RupiahInput from "../../Components/rupiahInput";

export const WithdrawForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const wallets = useSelector((state) => state.wallets.currentWallets || []);
  const totalPagesWallet = useSelector(
    (state) => state.wallets.totalPagesFilter
  );
  const status = useSelector((state) => state.payments.status);
  const [loading, setLoading] = useState(false);
  const [currentPageWallet, setCurrentPageWallet] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedWallet, setSelectedWallet] = useState(null);

  useEffect(() => {
    if (status === "idle") {
      dispatch(
        fetchCurrent({ pageFilter: currentPageWallet, perPageFilter: 10 })
      )
        .unwrap()
        .catch(() => toast.error("Failed to fetch wallets."));
    }
  }, [dispatch, status, currentPageWallet]);

  const handleLoadMoreWallet = useCallback(() => {
    if (currentPageWallet < totalPagesWallet && !isLoadingMore) {
      setIsLoadingMore(true);
      dispatch(fetchCurrent({ page: currentPageWallet + 1, perPage: 10 }))
        .unwrap()
        .then(() => {
          setIsLoadingMore(false);
          setCurrentPageWallet((prevPage) => prevPage + 1);
        })
        .catch(() => {
          setIsLoadingMore(false);
          toast.error("Failed to load more wallets.");
        });
    }
  }, [dispatch, currentPageWallet, totalPagesWallet, isLoadingMore]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (selectedWallet?.balance < amount) {
        return toast.error(
          `Maximum withdawal ${rupiahFormat(selectedWallet?.balance)}`
        );
      }

      const withdrawData = {
        amount: parseInt(amount.replace(/[^0-9]/g, "")), // Use raw number for submission

        wallet_id: selectedWallet.id,
      };

      dispatch(createWithdraw(withdrawData))
        .unwrap()
        .then((response) => {
          toast.success("Withdraw created successfully.");
          setAmount("");
          setSelectedWallet(null);
          navigate(`/withdraw/preview/${response.key}`);
        })
        .catch(() => toast.error("Failed to create withdraw."));
    } catch (error) {
      toast.error("Failed to create withdraw.");
    } finally {
      setLoading(false);
    }
  };

  const uniqueWallets = {};
  const visibleWallets = wallets.filter((wallet) => {
    if (wallet.status && !uniqueWallets[wallet.id]) {
      uniqueWallets[wallet.id] = true;
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
    <div className="max-w-screen-sm">
      <form className="p-2" onSubmit={handleSubmit}>
        <div className="divider">Your Wallet</div>
        {visibleWallets.length === 0 && status !== "loading" ? (
          <p>No Wallet available</p>
        ) : (
          visibleWallets.map((wallet) => (
            <div
              key={wallet.id}
              onClick={() => setSelectedWallet(wallet)}
              className={`flex mb-2 justify-between items-center border cursor-pointer hover:bg-base-300/45 p-2 ${
                selectedWallet?.id === wallet.id
                  ? "border-cyan-700"
                  : "border-base-300"
              }`}>
              <div className="flex justify-start items-start gap-2">
                <span
                  className={`${
                    selectedWallet?.id === wallet.id
                      ? "text-cyan-700"
                      : "text-base-300"
                  } text-4xl material-symbols-outlined`}>
                  wallet
                </span>
                <div>
                  <h1 className="font-medium">{wallet.account_name}</h1>
                  <h1 className="font-medium text-neutral text-sm">
                    {wallet.account_number}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="font-medium">{rupiahFormat(wallet.balance)}</h1>
                <button className="btn bg-base-300/50">
                  <span className="text-xl material-symbols-outlined">
                    {selectedWallet?.id === wallet.id
                      ? "check_circle"
                      : "select"}
                  </span>
                </button>
              </div>
            </div>
          ))
        )}

        <div
          className="divider text-neutral cursor-pointer"
          onClick={handleLoadMoreWallet}>
          Load more
        </div>
        <div className="form-control">
          <div className="flex w-full flex-col">
            <div className="divider">Withdraw</div>
          </div>
        </div>
        <div className="flex items-center w-full justify-center gap-2">
          <div className="flex justify-center w-full items-center mx-auto container gap-1">
            <RupiahInput
              initialValue={amount}
              onChange={(value) => setAmount(value)}
            />
          </div>
        </div>
        <p className="text-error text-center mt-2">
          {selectedWallet?.balance < amount &&
            `Max : ${rupiahFormat(selectedWallet?.balance)}`}
        </p>

        <button
          type="submit"
          disabled={loading || selectedWallet?.balance < amount}
          className="btn bg-green-700 btn-success w-full mt-4">
          {loading ? "Loading..." : "Withdrawal"}
        </button>
      </form>
    </div>
  );
};
