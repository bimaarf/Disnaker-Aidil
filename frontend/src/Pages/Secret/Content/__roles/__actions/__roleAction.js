import { toast } from "react-toastify";
import {
  deleteRole,
  deleteRoles,
} from "../../../../../features/roles/roleSlice";

export const handleDelete = async (
  dispatch,
  selectedDatas,
  setSelectedDatas
) => {
  if (window.confirm("Are you sure you want to delete the selected datas?")) {
    try {
      await dispatch(deleteRoles(selectedDatas)).unwrap();
      setSelectedDatas([]);
      toast.success("Successfully deleted!");
    } catch (error) {
      toast.error(error?.message || "Failed to delete datas.");
    }
  }
};

export const handleDeleteData = (dispatch, dataId) => {
  if (window.confirm("Are you sure you want to delete this data?")) {
    dispatch(deleteRole(dataId))
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
  navigate(`/roles/update/${data.name}`, {
    state: { name: data.name, dataProps: data },
  });
};
