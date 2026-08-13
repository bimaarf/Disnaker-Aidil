import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { updateBalance } from "../../../../../features/wallets/walletSlice";
import {
  fetchWithdraw,
  processWithdraw,
} from "../../../../../features/withdraws/withdrawSlice";
import { updateBalance as authUpdateBalance } from "../../../../../features/authentication/AuthSlice";

export const WithdrawRejectButton = ({ selectedData, handleRejectSuccess }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    if (selectedData) {
      const formData = new FormData();
      formData.append("status", 0);
      setLoading(true);

      try {
        if (!selectedData.amount) {
          throw new Error("Amount is required for approval");
        }

        const result = await dispatch(
          processWithdraw({ key: selectedData.key, withdrawData: formData })
        ).unwrap();

        dispatch(fetchWithdraw(selectedData.key));
        toast.success("Withdraw Rejected!");

        if (result.wallet && result.wallet.key) {
          dispatch(
            updateBalance({
              key: result.wallet.key, // Ensure to pass the wallet key
              newBalance: result.wallet.balance,
            })
          );
          dispatch(
            authUpdateBalance({
              key: result.wallet.key, // Ensure to pass the wallet key
              newBalance: result.wallet.balance,
            })
          );
        } else {
          toast.error("Failed to update balance: Wallet data is incomplete");
        }

        if (handleRejectSuccess) {
          handleRejectSuccess(result.status, result.wallet);
        }
      } catch (error) {
        console.error("Error rejecting withdraw:", error); // Log full error
        toast.error(
          `Failed to reject withdraw: ${
            error.response?.data?.message || error.message
          }`
        );
      } finally {
        setLoading(false);
      }
    }
  };

  if (!selectedData) {
    return null;
  }

  return (
    <div className="mt-4">
      <button
        disabled={loading || !selectedData.status}
        onClick={handleReject}
        className={`btn ${
          loading ? "btn-loading" : "btn-error"
        } w-full rounded`}>
        {loading ? "Rejecting..." : "Reject!"}
      </button>
    </div>
  );
};
