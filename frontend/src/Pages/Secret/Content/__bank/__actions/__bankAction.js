import { toast } from "react-toastify";
import {
  deleteBank,
  deleteBanks,
} from "../../../../../features/bank/bankSlice";

export const handleDelete = async (
  dispatch,
  selectedDatas,
  setSelectedDatas
) => {
  if (
    window.confirm("Are you sure you want to delete the selected banks?")
  ) {
    try {
      await dispatch(deleteBanks(selectedDatas)).unwrap();
      setSelectedDatas([]);
      toast.success("Successfully deleted!");
    } catch (error) {
      toast.error(error?.message || "Failed to delete banks.");
    }
  }
};

// Handle deleting a single data entry
export const handleDeleteData = (dispatch, dataKey) => {
  if (window.confirm("Are you sure you want to delete this bank?")) {
    dispatch(deleteBank(dataKey))
      .unwrap()
      .then(() => {
        toast.success("Successfully deleted!");
      })
      .catch((error) => {
        if (error === "Session expired. Logging out...") {
          toast.error("Your session has expired. Logging out...");
        } else {
          // toast.error(error?.message || "Failed to delete bank.");
          toast.error("bank can't be deleted.");
        }
      });
  }
};

// Handle editing a data entry
export const handleEditData = (navigate, data) => {
  navigate(`/bank/update/${data.key}`, {
    state: { key: data.key, dataProps: data },
  });
};
