import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { rupiahFormat } from "../../../../../Context/__rupiahFormat";
import { fetchOther } from "../../../../../features/wallets/walletSlice";

export const OtherWalletList = ({ email }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const wallets = useSelector((state) => state.wallets.otherWallets) || [];
  const totalPagesWallet = useSelector(
    (state) => state.wallets.totalPagesOther
  );
  const [noMoreData, setNoMoreData] = useState(false);
  const [currentPageWallet, setOtherPageWallet] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // New loading state

  useEffect(() => {
    const fetchWallets = async () => {
      if (email) {
        try {
          await dispatch(
            fetchOther({
              email,
            })
          ).unwrap();
        } catch (error) {
          console.error("Failed to fetch wallets:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchWallets();
  }, [dispatch, currentPageWallet, email]);

  const handleLoadMoreWallet = useCallback(() => {
    if (currentPageWallet < totalPagesWallet && !isLoadingMore) {
      setIsLoadingMore(true);
      dispatch(
        fetchOther({
          pageOther: currentPageWallet + 1,
          perPageOther: 10,
          email,
        })
      )
        .unwrap()
        .then(() => {
          setIsLoadingMore(false);
          if (currentPageWallet + 1 >= totalPagesWallet) {
            setNoMoreData(true);
          }
          setOtherPageWallet((prevPage) => prevPage + 1);
        })
        .catch(() => {
          setIsLoadingMore(false);
        });
    }
  }, [dispatch, currentPageWallet, totalPagesWallet, isLoadingMore, email]);

  const uniqueWallets = {};
  const visibleWallets = wallets.filter((wallet) => {
    if (wallet.status && !uniqueWallets[wallet.id]) {
      uniqueWallets[wallet.id] = true;
      return true;
    }
    return false;
  });

  return (
    <div>
      <div className="divider text-neutral">Your Wallets</div>
      {noMoreData && <h1>Other Wallets</h1>}
      {isLoading ? ( // Show loading state
        <p>Loading...</p>
      ) : visibleWallets.length === 0 ? (
        <p>No Wallet available</p>
      ) : (
        visibleWallets.map((wallet) => (
          <div
            key={wallet.id}
            onClick={() => navigate(`/wallets/update/${wallet.key}`)}
            className="flex mb-2 justify-between items-center border cursor-pointer hover:bg-base-300/45 p-2 border-cyan-700">
            <div className="flex justify-start items-start gap-2">
              <span className="text-cyan-700 text-4xl material-symbols-outlined">
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
                  wallet
                </span>
              </button>
            </div>
          </div>
        ))
      )}
      <div
        className="divider text-neutral cursor-pointer"
        onClick={handleLoadMoreWallet}
        style={{ display: noMoreData ? "none" : "block" }} // Hide if no more data
      >
        Load more
      </div>
    </div>
  );
};
