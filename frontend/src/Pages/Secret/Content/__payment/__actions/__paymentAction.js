import { toast } from "react-toastify";
import {
  deletePayment,
  deletePayments,
} from "../../../../../features/payments/paymentSlice";

export const handleDelete = async (
  dispatch,
  selectedDatas,
  setSelectedDatas
) => {
  if (window.confirm("Are you sure you want to delete the selected datas?")) {
    try {
      await dispatch(deletePayments(selectedDatas)).unwrap();
      setSelectedDatas([]);
      toast.success("Successfully deleted!");
    } catch (error) {
      toast.error(error?.message || "Failed to delete datas.");
    }
  }
};

// Handle deleting a single data entry
export const handleDeleteData = (dispatch, dataId) => {
  if (window.confirm("Are you sure you want to delete this data?")) {
    dispatch(deletePayment(dataId))
      .unwrap()
      .then(() => {
        toast.success("Successfully deleted!");
      })
      .catch((error) => {
        if (error === "Session expired. Logging out...") {
          toast.error("Your session has expired. Logging out...");
        } else {
          toast.error(error?.message || "Failed to delete data.");
        }
      });
  }
};

// Handle editing a data entry
export const handleEditData = (navigate, data) => {
  navigate(`/payments/update/${data.key}`, {
    state: { key: data.key, dataProps: data },
  });
};
