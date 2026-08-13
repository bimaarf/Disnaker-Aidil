import { toast } from "react-toastify";
import {
  promotionProductCache,
  deletePromotionProduct,
  deletePromotionProducts,
} from "../../../../../features/product/promotionProductSlice";

const removeFromCache = (ids) => {
  const cacheKeys = Array.from(promotionProductCache.keys());

  ids.forEach((id) => {
    promotionProductCache.delete(id);
  });

  cacheKeys.forEach((key) => {
    if (!key.startsWith("promotionProducts_page_")) return;

    const cacheEntry = promotionProductCache.get(key);
    const items = cacheEntry?.data?.promotionProducts || [];

    if (items.some((item) => ids.includes(item.id))) {
      promotionProductCache.delete(key);
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
      `Are you sure you want to delete ${selectedItems.length} selected promotion(s)?`
    )
  ) {
    try {
      // Menghapus data dengan menggunakan action deletePromotionProducts
      await dispatch(deletePromotionProducts(selectedItems)).unwrap();
      removeFromCache(selectedItems); // Hapus data dari cache
      setSelectedItems([]); // Kosongkan list selectedItems setelah penghapusan
      toast.success("Successfully deleted promotion!");
    } catch (error) {
      toast.error(error?.message || "Failed to delete categories.");
    }
  }
};

export const handleDeleteData = async (dispatch, dataId) => {
  if (window.confirm("Are you sure you want to delete this promotion?")) {
    try {
      await dispatch(deletePromotionProduct(dataId)).unwrap();
      removeFromCache([dataId]);
      toast.success("Successfully deleted promotion!");
    } catch (error) {
      if (error === "Session expired. Logging out...") {
        toast.error("Your session has expired. Logging out...");
      } else {
        toast.error(error?.message || "Failed to delete promotion.");
      }
    }
  }
};

export const handleEditData = (navigate, data) => {
  navigate(`/promotion/product/update/${data.key}`, {
    state: { key: data.key, dataProps: data },
  });
};
