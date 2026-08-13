import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  fetchInvoices,
  fetchInvoiceByKey,
  createOrUpdateInvoice,
  deleteInvoice,
  resetInvoiceState,
  resetCurrentInvoice,
  resetInvoiceStatus,
  setSearchTerm,
  setFilters,
  resetFilters,
  setCurrentPage,
  setPerPage,
  clearValidationErrors,
  selectInvoices,
  selectCurrentInvoice,
  selectCurrentCheckout,
  selectInvoiceStatus,
  selectFetchStatus,
  selectCreateStatus,
  selectDeleteStatus,
  selectInvoiceError,
  selectValidationErrors,
  selectSearchTerm,
  selectFilters,
  selectPagination,
  selectIsLoading,
  selectIsCreating,
  selectIsDeleting,
  selectHasError,
  selectHasValidationErrors,
  selectCanLoadMore,
} from "./invoiceSlice";

// Main hook untuk invoice operations
export const useInvoice = () => {
  const dispatch = useDispatch();

  // Selectors
  const invoices = useSelector(selectInvoices);
  const currentInvoice = useSelector(selectCurrentInvoice);
  const currentCheckout = useSelector(selectCurrentCheckout);
  const status = useSelector(selectInvoiceStatus);
  const fetchStatus = useSelector(selectFetchStatus);
  const createStatus = useSelector(selectCreateStatus);
  const deleteStatus = useSelector(selectDeleteStatus);
  const error = useSelector(selectInvoiceError);
  const validationErrors = useSelector(selectValidationErrors);
  const searchTerm = useSelector(selectSearchTerm);
  const filters = useSelector(selectFilters);
  const pagination = useSelector(selectPagination);

  // Loading states
  const isLoading = useSelector(selectIsLoading);
  const isCreating = useSelector(selectIsCreating);
  const isDeleting = useSelector(selectIsDeleting);
  const hasError = useSelector(selectHasError);
  const hasValidationErrors = useSelector(selectHasValidationErrors);
  const canLoadMore = useSelector(selectCanLoadMore);

  // Actions
  const loadInvoices = useCallback(
    (params = {}) => {
      return dispatch(fetchInvoices(params));
    },
    [dispatch]
  );

  const loadInvoiceByKey = useCallback(
    (checkoutKey) => {
      return dispatch(fetchInvoiceByKey(checkoutKey));
    },
    [dispatch]
  );

  const saveInvoice = useCallback(
    (checkoutKey, formData) => {
      return dispatch(createOrUpdateInvoice({ checkoutKey, formData }));
    },
    [dispatch]
  );

  const removeInvoice = useCallback(
    (checkoutKey) => {
      return dispatch(deleteInvoice(checkoutKey));
    },
    [dispatch]
  );

  // Reset functions
  const resetState = useCallback(() => {
    dispatch(resetInvoiceState());
  }, [dispatch]);

  const resetCurrent = useCallback(() => {
    dispatch(resetCurrentInvoice());
  }, [dispatch]);

  const resetStatus = useCallback(() => {
    dispatch(resetInvoiceStatus());
  }, [dispatch]);

  const clearErrors = useCallback(() => {
    dispatch(clearValidationErrors());
  }, [dispatch]);

  // Search and filter functions
  const updateSearchTerm = useCallback(
    (term) => {
      dispatch(setSearchTerm(term));
    },
    [dispatch]
  );

  const updateFilters = useCallback(
    (newFilters) => {
      dispatch(setFilters(newFilters));
    },
    [dispatch]
  );

  const clearFilters = useCallback(() => {
    dispatch(resetFilters());
    refresh();
  }, [dispatch]);

  // Pagination functions
  const goToPage = useCallback(
    (page) => {
      dispatch(setCurrentPage(page));
    },
    [dispatch]
  );

  const changePerPage = useCallback(
    (perPage) => {
      dispatch(setPerPage(perPage));
    },
    [dispatch]
  );

  // Load more function for infinite scroll
  const loadMore = useCallback(() => {
    if (canLoadMore && !isLoading) {
      return loadInvoices({
        page: pagination.currentPage + 1,
        per_page: pagination.perPage,
        search: searchTerm,
        ...filters,
      });
    }
  }, [canLoadMore, isLoading, loadInvoices, pagination, searchTerm, filters]);

  // Refresh function
  const refresh = useCallback(() => {
    return loadInvoices({
      page: 1,
      per_page: pagination.perPage,
      search: searchTerm,
      ...filters,
    });
  }, [loadInvoices, pagination.perPage, searchTerm, filters]);

  return {
    // Data
    invoices,
    currentInvoice,
    currentCheckout,
    pagination,
    searchTerm,
    filters,

    // Status
    status,
    fetchStatus,
    createStatus,
    deleteStatus,
    error,
    validationErrors,

    // Loading states
    isLoading,
    isCreating,
    isDeleting,
    hasError,
    hasValidationErrors,
    canLoadMore,

    // Actions
    loadInvoices,
    loadInvoiceByKey,
    saveInvoice,
    removeInvoice,
    loadMore,
    refresh,

    // Reset functions
    resetState,
    resetCurrent,
    resetStatus,
    clearErrors,

    // Search and filter
    updateSearchTerm,
    updateFilters,
    clearFilters,

    // Pagination
    goToPage,
    changePerPage,
  };
};

// Hook khusus untuk form invoice
export const useInvoiceForm = (checkoutKey) => {
  const {
    currentInvoice,
    currentCheckout,
    fetchStatus,
    createStatus,
    validationErrors,
    error,
    isCreating,
    loadInvoiceByKey,
    saveInvoice,
    clearErrors,
    resetCurrent,
  } = useInvoice();

  // Load invoice on mount
  useEffect(() => {
    if (checkoutKey) {
      loadInvoiceByKey(checkoutKey);
    }

    return () => {
      resetCurrent();
    };
  }, [checkoutKey, loadInvoiceByKey, resetCurrent]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (formData) => {
      try {
        clearErrors();
        const result = await saveInvoice(checkoutKey, formData);

        if (result.type === "invoice/createOrUpdateInvoice/fulfilled") {
          toast.success(result.payload.data.message);
          return { success: true, data: result.payload.data };
        } else {
          throw new Error(result.payload?.message || "Gagal menyimpan invoice");
        }
      } catch (err) {
        const errorMessage =
          err.message || "Terjadi kesalahan saat menyimpan invoice";
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [checkoutKey, saveInvoice, clearErrors]
  );

  return {
    currentInvoice,
    currentCheckout,
    fetchStatus,
    createStatus,
    validationErrors,
    error,
    isCreating,
    isLoading: fetchStatus === "loading",
    handleSubmit,
    clearErrors,
  };
};

// Hook khusus untuk list invoice (admin)
// features/product/invoiceHook.js
// Hook khusus untuk list invoice (admin)
export const useInvoiceList = () => {
  const {
    invoices,
    pagination,
    searchTerm,
    filters,
    status,
    error,
    isLoading,
    canLoadMore,
    loadInvoices,
    loadMore,
    refresh,
    updateSearchTerm,
    updateFilters,
    clearFilters,
    goToPage,
  } = useInvoice();

  // Load invoices on mount - only if status is 'idle'
  useEffect(() => {
    if (status === "idle") {
      loadInvoices({
        page: 1,
        per_page: pagination.perPage,
        search: searchTerm || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        bankName: filters.bankName || undefined,
      });
    }
  }, [status, loadInvoices, pagination.perPage, searchTerm, filters]);

  // Handle search with debounce
  const handleSearch = useCallback(
    (term) => {
      updateSearchTerm(term);

      // Debounce search
      const timeoutId = setTimeout(() => {
        loadInvoices({
          page: 1,
          per_page: pagination.perPage,
          search: term || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          bankName: filters.bankName || undefined,
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    },
    [updateSearchTerm, loadInvoices, pagination.perPage, filters]
  );

  // Handle filter change with validation
  const handleFilterChange = useCallback(
    (newFilters) => {
      // Validate date range
      if (
        newFilters.dateTo &&
        newFilters.dateFrom &&
        new Date(newFilters.dateTo) < new Date(newFilters.dateFrom)
      ) {
        toast.error(
          "Tanggal sampai harus setelah atau sama dengan tanggal dari"
        );
        return;
      }

      // Update filters
      updateFilters({
        dateFrom:
          newFilters.dateFrom !== undefined
            ? newFilters.dateFrom
            : filters.dateFrom,
        dateTo:
          newFilters.dateTo !== undefined ? newFilters.dateTo : filters.dateTo,
        bankName:
          newFilters.bankName !== undefined
            ? newFilters.bankName
            : filters.bankName,
      });

      // Load invoices with updated filters
      loadInvoices({
        page: 1,
        per_page: pagination.perPage,
        search: searchTerm || undefined,
        dateFrom:
          newFilters.dateFrom !== undefined
            ? newFilters.dateFrom
            : filters.dateFrom || undefined,
        dateTo:
          newFilters.dateTo !== undefined
            ? newFilters.dateTo
            : filters.dateTo || undefined,
        bankName:
          newFilters.bankName !== undefined
            ? newFilters.bankName
            : filters.bankName || undefined,
      });
    },
    [updateFilters, loadInvoices, pagination.perPage, searchTerm, filters]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (page) => {
      goToPage(page);
      loadInvoices({
        page,
        per_page: pagination.perPage,
        search: searchTerm || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        bankName: filters.bankName || undefined,
      });
    },
    [goToPage, loadInvoices, pagination.perPage, searchTerm, filters]
  );

  return {
    invoices,
    pagination,
    searchTerm,
    filters,
    status,
    error,
    isLoading,
    canLoadMore,
    handleSearch,
    handleFilterChange,
    handlePageChange,
    loadMore,
    refresh,
    clearFilters,
  };
};

// Hook untuk delete confirmation
export const useInvoiceDelete = () => {
  const { removeInvoice, deleteStatus, isDeleting } = useInvoice();

  const handleDelete = useCallback(
    async (checkoutKey, options = {}) => {
      const {
        confirmMessage = "Apakah Anda yakin ingin menghapus invoice ini?",
        successMessage = "Invoice berhasil dihapus",
        showConfirm = true,
      } = options;

      try {
        if (showConfirm && !window.confirm(confirmMessage)) {
          return { success: false, cancelled: true };
        }

        const result = await removeInvoice(checkoutKey);

        if (result.type === "invoice/deleteInvoice/fulfilled") {
          toast.success(successMessage);
          return { success: true, data: result.payload.data };
        } else {
          throw new Error(result.payload?.message || "Gagal menghapus invoice");
        }
      } catch (err) {
        const errorMessage =
          err.message || "Terjadi kesalahan saat menghapus invoice";
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [removeInvoice]
  );

  return {
    handleDelete,
    deleteStatus,
    isDeleting,
  };
};
