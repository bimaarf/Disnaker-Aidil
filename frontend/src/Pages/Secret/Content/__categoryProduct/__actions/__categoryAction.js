import { toast } from "react-toastify";
import {
  categoryProductCache,
  deleteCategoryProduct,
  deleteCategoryProducts,
} from "../../../../../features/product/categoryProductSlice";

const removeFromCache = (ids) => {
  const cacheKeys = Array.from(categoryProductCache.keys());

  ids.forEach((id) => {
    categoryProductCache.delete(id);
  });

  cacheKeys.forEach((key) => {
    if (!key.startsWith("categoryProducts_page_")) return;

    const cacheEntry = categoryProductCache.get(key);
    const items = cacheEntry?.data?.categoryProducts || [];

    if (items.some((item) => ids.includes(item.id))) {
      categoryProductCache.delete(key);
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
      // Menghapus data dengan menggunakan action deleteCategoryProducts
      await dispatch(deleteCategoryProducts(selectedItems)).unwrap();
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
      await dispatch(deleteCategoryProduct(dataId)).unwrap();
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
  navigate(`/category/product/update/${data.key}`, {
    state: { key: data.key, dataProps: data },
  });
};
