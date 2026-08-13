import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import {
  fetchDeposit,
  processDeposit,
} from "../../../../../features/deposits/depositSlice";
import { updateBalance } from "../../../../../features/wallets/walletSlice";
import { updateBalance as authUpdateBalance } from "../../../../../features/authentication/AuthSlice";

export const DepositApproveButton = ({
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
          processDeposit({ key: selectedData.key, depositData: formData })
        ).unwrap();

        dispatch(fetchDeposit(selectedData.key));
        toast.success("Deposit Approveed!");

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
        console.error("Error approveing deposit:", error); // Log full error
        toast.error(
          `Failed to approve deposit: ${
            error.response?.data?.message || error.message
          }`
        );
      } finally {
        setLoading(false);
      }
    }
  };
  if (!selectedData) {
    return <div>No deposit selected for approval.</div>;
  }

  return (
    <div className="mt-4">
      <button
        disabled={loading || selectedData.status}
        onClick={handleApprove}
        className={`btn ${
          loading ? "btn-loading" : "btn-success"
        } w-full rounded`}>
        {loading ? "Approving..." : "Approve!"}
      </button>
    </div>
  );
};
