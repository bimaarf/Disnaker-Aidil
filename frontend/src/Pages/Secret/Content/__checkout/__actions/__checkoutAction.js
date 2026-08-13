import { toast } from "react-toastify";
import {
  deleteCheckout,
  deleteCheckouts,
} from "../../../../../features/product/checkoutSlice";

export const handleDelete = async (
  dispatch,
  selectedDatas,
  setSelectedDatas
) => {
  if (window.confirm("Are you sure you want to delete the selected checkouts?")) {
    try {
      await dispatch(deleteCheckouts(selectedDatas)).unwrap();
      setSelectedDatas([]);
      toast.success("Successfully deleted!");
    } catch (error) {
      toast.error(error?.message || "Failed to delete checkouts.");
    }
  }
};

// Handle deleting a single data entry
export const handleDeleteData = (dispatch, dataKey) => {
  if (window.confirm("Are you sure you want to delete this checkout?")) {
    dispatch(deleteCheckout(dataKey))
      .unwrap()
      .then(() => {
        toast.success("Successfully deleted!");
      })
      .catch((error) => {
        if (error === "Session expired. Logging out...") {
          toast.error("Your session has expired. Logging out...");
        } else {
          // toast.error(error?.message || "Failed to delete checkout.");
          toast.error("checkout can't be deleted.");
        }
      });
  }
};

// Handle editing a data entry
export const handleEditData = (navigate, data) => {
  navigate(`/checkout/update/${data.key}`, {
    state: { key: data.key, dataProps: data },
  });
};
