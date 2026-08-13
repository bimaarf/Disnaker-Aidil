import { toast } from "react-toastify";
import {
  deleteGame,
  deleteGames,
} from "../../../../../features/games/gameSlice";

export const handleDelete = async (
  dispatch,
  selectedDatas,
  setSelectedDatas
) => {
  if (window.confirm("Are you sure you want to delete the selected datas?")) {
    try {
      await dispatch(deleteGames(selectedDatas)).unwrap();
      setSelectedDatas([]);
      toast.success("Successfully deleted!");
    } catch (error) {
      toast.error("Failed to delete datas.");
    }
  }
};

export const handleDeleteData = (dispatch, dataId) => {
  if (window.confirm("Are you sure you want to delete this data?")) {
    dispatch(deleteGame(dataId))
      .unwrap()
      .then(() => toast.success("Successfully deleted!"))
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
  navigate(`/games/update/${data.key}`, {
    state: { key: data.key, dataProps: data },
  });
};
