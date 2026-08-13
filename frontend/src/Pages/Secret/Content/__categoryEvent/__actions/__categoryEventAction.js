import { toast } from "react-toastify";
import {
  categoryEventCache,
  deleteCategoryEvent,
  deleteCategoryEvents,
} from "../../../../../features/event/categoryEventSlice";

const removeFromCache = (ids) => {
  const cacheKeys = Array.from(categoryEventCache.keys());

  ids.forEach((id) => {
    categoryEventCache.delete(id);
  });

  cacheKeys.forEach((key) => {
    if (!key.startsWith("categoryEvents_page_")) return;

    const cacheEntry = categoryEventCache.get(key);
    const items = cacheEntry?.data?.categoryEvents || [];

    if (items.some((item) => ids.includes(item.id))) {
      categoryEventCache.delete(key);
    }
  });
};

export const handleDelete = async (
  dispatch,
  selectedItems,
  setSelectedItems
) => {
  if (!selectedItems.length) {
    toast.warn("No categories selected for deletion.");
    return;
  }

  if (
    window.confirm(
      `Are you sure you want to delete ${selectedItems.length} selected category(s)?`
    )
  ) {
    try {
      // Menghapus data dengan menggunakan action deleteCategoryEvents
      await dispatch(deleteCategoryEvents(selectedItems)).unwrap();
      removeFromCache(selectedItems); // Hapus data dari cache
      setSelectedItems([]); // Kosongkan list selectedItems setelah penghapusan
      toast.success("Successfully deleted category!");
    } catch (error) {
      toast.error(error?.message || "Failed to delete categories.");
    }
  }
};

export const handleDeleteData = async (dispatch, dataId) => {
  if (window.confirm("Are you sure you want to delete this category?")) {
    try {
      await dispatch(deleteCategoryEvent(dataId)).unwrap();
      removeFromCache([dataId]);
      toast.success("Successfully deleted category!");
    } catch (error) {
      if (error === "Session expired. Logging out...") {
        toast.error("Your session has expired. Logging out...");
      } else {
        toast.error(error?.message || "Failed to delete category.");
      }
    }
  }
};

export const handleEditData = (navigate, data) => {
  navigate(`/category/event/update/${data.key}`, {
    state: { key: data.key, dataProps: data },
  });
};
