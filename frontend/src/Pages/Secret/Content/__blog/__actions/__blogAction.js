import { toast } from "react-toastify";
import {
  deleteBlog,
  deleteBlogs,
} from "../../../../../features/blog/blogSlice";

export const handleDelete = async (
  dispatch,
  selectedDatas,
  setSelectedDatas
) => {
  if (window.confirm("Are you sure you want to delete the selected blogs?")) {
    try {
      await dispatch(deleteBlogs(selectedDatas)).unwrap();
      setSelectedDatas([]);
      toast.success("Successfully deleted!");
    } catch (error) {
      toast.error(error?.message || "Failed to delete blogs.");
    }
  }
};

// Handle deleting a single data entry
export const handleDeleteData = (dispatch, dataKey) => {
  if (window.confirm("Are you sure you want to delete this blog?")) {
    dispatch(deleteBlog(dataKey))
      .unwrap()
      .then(() => {
        toast.success("Successfully deleted!");
      })
      .catch((error) => {
        if (error === "Session expired. Logging out...") {
          toast.error("Your session has expired. Logging out...");
        } else {
          // toast.error(error?.message || "Failed to delete blog.");
          toast.error("blog can't be deleted.");
        }
      });
  }
};

// Handle editing a data entry
export const handleEditData = (navigate, data) => {
  navigate(`/blog/update/${data.key}`, {
    state: { key: data.key, dataProps: data },
  });
};
