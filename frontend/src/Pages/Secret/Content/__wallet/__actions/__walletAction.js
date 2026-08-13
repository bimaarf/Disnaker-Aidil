import { toast } from "react-toastify";
import {
  deleteWallet,
  deleteWallets,
} from "../../../../../features/wallets/walletSlice";

export const handleDelete = async (
  dispatch,
  selectedDatas,
  setSelectedDatas
) => {
  if (window.confirm("Are you sure you want to delete the selected wallets?")) {
    try {
      await dispatch(deleteWallets(selectedDatas)).unwrap();
      setSelectedDatas([]);
      toast.success("Successfully deleted!");
    } catch (error) {
      toast.error(error?.message || "Failed to delete wallets.");
    }
  }
};

// Handle deleting a single data entry
export const handleDeleteData = (dispatch, dataKey) => {
  if (window.confirm("Are you sure you want to delete this wallet?")) {
    dispatch(deleteWallet(dataKey))
      .unwrap()
      .then(() => {
        toast.success("Successfully deleted!");
      })
      .catch((error) => {
        if (error === "Session expired. Logging out...") {
          toast.error("Your session has expired. Logging out...");
        } else {
          toast.error(error?.message || "Failed to delete wallet.");
        }
      });
  }
};

// Handle editing a data entry
export const handleEditData = (navigate, data) => {
  navigate(`/wallets/update/${data.key}`, {
    state: { key: data.key, dataProps: data },
  });
};
