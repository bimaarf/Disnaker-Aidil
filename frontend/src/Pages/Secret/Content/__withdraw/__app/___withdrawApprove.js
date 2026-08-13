import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { updateBalance } from "../../../../../features/wallets/walletSlice";
import {
  fetchWithdraw,
  processWithdraw,
} from "../../../../../features/withdraws/withdrawSlice";
import { updateBalance as authUpdateBalance } from "../../../../../features/authentication/AuthSlice";

export const WithdrawApproveButton = ({
  selectedData,
  handleApproveSuccess,
}) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (selectedData) {
      const formData = new FormData();
      formData.append("status", 1);
      setLoading(true);

      try {
        if (!selectedData.amount) {
          throw new Error("Amount is required for approval");
        }

        const result = await dispatch(
          processWithdraw({ key: selectedData.key, withdrawData: formData })
        ).unwrap();

        dispatch(fetchWithdraw(selectedData.key));
        toast.success("Withdraw Approveed!");

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

        if (handleApproveSuccess) {
          handleApproveSuccess(result.status, result.wallet);
        }
      } catch (error) {
        console.error("Error approveing withdraw:", error); // Log full error
        toast.error(
          `Failed to approve withdraw: ${
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
        disabled={loading || selectedData.status}
        onClick={handleApprove}
        className={`btn ${
          loading ? "btn-loading" : "btn-success"
        } w-full rounded`}>
        {loading ? "Approveing..." : "Approve!"}
      </button>
    </div>
  );
};
