import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { rupiahFormat } from "../../../../../Context/__rupiahFormat";
import { fetchCurrent } from "../../../../../features/wallets/walletSlice";

export const CurrentWalletList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wallets = useSelector((state) => state.wallets.currentWallets || []);
  const totalPagesWallet = useSelector(
    (state) => state.wallets.totalPagesFilter
  );
  const [noMoreData, setNoMoreData] = useState(false);

  const [currentPageWallet, setCurrentPageWallet] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  useEffect(() => {
    dispatch(
      fetchCurrent({ pageFilter: currentPageWallet, perPageFilter: 10 })
    ).unwrap();
  }, [dispatch, currentPageWallet]);
  const handleLoadMoreWallet = useCallback(() => {
    if (currentPageWallet < totalPagesWallet && !isLoadingMore) {
      setIsLoadingMore(true);
      dispatch(
        fetchCurrent({ pageFilter: currentPageWallet + 1, perPageFilter: 10 })
      )
        .unwrap()
        .then(() => {
          setIsLoadingMore(false);
          if (currentPageWallet + 1 >= totalPagesWallet) {
            setNoMoreData(true);
          }
          setCurrentPageWallet((prevPage) => prevPage + 1);
        })
        .catch(() => {
          setIsLoadingMore(false);
        });
    }
  }, [dispatch, currentPageWallet, totalPagesWallet, isLoadingMore]);
  const uniqueWallets = {};
  const visibleWallets = wallets.filter((wallet) => {
    if (wallet.status && !uniqueWallets[wallet.id]) {
      uniqueWallets[wallet.id] = true;
      return true;
    }
    return false;
  });
  return (
    <>
      <div className="divider text-neutral">Your Wallets</div>
      {noMoreData && <h1>Current Wallets</h1>}
      {visibleWallets.length === 0 && status !== "loading" ? (
        <p>No Wallet available</p>
      ) : (
        visibleWallets.map((wallet) => (
          <div
            key={wallet.id}
            onClick={() => navigate(`/wallets/preview/${wallet.key}`)}
            className={`flex mb-2 justify-between items-center border cursor-pointer hover:bg-base-300/45 p-2 border-cyan-700`}>
            <div className="flex justify-start items-start gap-2">
              <span
                className={`text-cyan-700 text-4xl material-symbols-outlined`}>
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
        onClick={handleLoadMoreWallet}>
        Load more
      </div>
    </>
  );
};
