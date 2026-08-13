import { toast } from "react-toastify";
import {
  deleteNotification,
  deleteNotifications,
} from "../../../../../features/notifications/notificationSlice";

export const handleDelete = async (
  dispatch,
  selectedDatas,
  setSelectedDatas
) => {
  if (window.confirm("Are you sure you want to delete the selected datas?")) {
    try {
      await dispatch(deleteNotifications(selectedDatas)).unwrap();
      setSelectedDatas([]);
      toast.success("Successfully deleted!");
    } catch (error) {
      toast.error(error?.message || "Failed to delete datas.");
    }
  }
};

export const handleDeleteData = (dispatch, dataId) => {
  if (window.confirm("Are you sure you want to delete this data?")) {
    dispatch(deleteNotification(dataId))
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

export const handleEditData = (navigate, data) => {
  navigate(`/notifications/update/${data.id}`, {
    state: { id: data.id, dataProps: data },
  });
};
