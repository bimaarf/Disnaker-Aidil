import { toast } from "react-toastify";
import {
  deleteEvent,
  deleteEvents,
} from "../../../../../features/event/eventSlice";

export const handleDelete = async (
  dispatch,
  selectedDatas,
  setSelectedDatas
) => {
  if (window.confirm("Are you sure you want to delete the selected events?")) {
    try {
      await dispatch(deleteEvents(selectedDatas)).unwrap();
      setSelectedDatas([]);
      toast.success("Successfully deleted!");
    } catch (error) {
      toast.error(error?.message || "Failed to delete events.");
    }
  }
};

// Handle deleting a single data entry
export const handleDeleteData = (dispatch, dataKey) => {
  if (window.confirm("Are you sure you want to delete this event?")) {
    dispatch(deleteEvent(dataKey))
      .unwrap()
      .then(() => {
        toast.success("Successfully deleted!");
      })
      .catch((error) => {
        if (error === "Session expired. Logging out...") {
          toast.error("Your session has expired. Logging out...");
        } else {
          // toast.error(error?.message || "Failed to delete event.");
          toast.error("event can't be deleted.");
        }
      });
  }
};

// Handle editing a data entry
export const handleEditData = (navigate, data) => {
  navigate(`/event/update/${data.key}`, {
    state: { key: data.key, dataProps: data },
  });
};
