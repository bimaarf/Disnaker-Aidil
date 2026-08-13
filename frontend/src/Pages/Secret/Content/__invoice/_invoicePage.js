import React, { useState } from "react";
import {
  useInvoiceList,
  useInvoiceDelete,
} from "../../../../features/product/invoiceHook";
import { useDispatch, useSelector } from "react-redux";
import { setViewMode } from "../../../../features/product/invoiceSlice";

export const InvoicePage = () => {
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const dispatch = useDispatch();
  const viewMode = useSelector((state) => state.invoice.viewMode);
  const handleSetViewMode = (x) => {
    dispatch(setViewMode(x));
  };
  const {
    invoices,
    pagination,
    searchTerm,
    filters,
    isLoading,
    canLoadMore,
    handleSearch,
    handleFilterChange,
    handlePageChange,
    loadMore,
    refresh,
    clearFilters,
  } = useInvoiceList();

  const { handleDelete, isDeleting } = useInvoiceDelete();

  const onDeleteInvoice = async (checkoutKey) => {
    const result = await handleDelete(checkoutKey, {
      confirmMessage: "Apakah Anda yakin ingin menghapus invoice ini?",
      successMessage: "Invoice berhasil dihapus",
    });

    if (result.success) {
      refresh();
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedInvoices(invoices.map((invoice) => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId, checked) => {
    if (checked) {
      setSelectedInvoices((prev) => [...prev, invoiceId]);
    } else {
      setSelectedInvoices((prev) => prev.filter((id) => id !== invoiceId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInvoices.length === 0) return;

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus ${selectedInvoices.length} invoice yang dipilih?`
    );

    if (!confirmed) return;

    const checkoutKeys = invoices
      .filter((invoice) => selectedInvoices.includes(invoice.id))
      .map((invoice) => invoice.checkout_key);

    for (const checkoutKey of checkoutKeys) {
      await handleDelete(checkoutKey, { showConfirm: false });
    }

    setSelectedInvoices([]);
    refresh();
  };

  return (
    <div className="min-h-[90vh]">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-8 bg-base-100 dark:bg-base-200 p-4 rounded-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-base-content mb-2">
                Manajemen Invoice
              </h1>
              <p className="text-base-content/40 text-xs">
                Kelola semua invoice bukti transfer dengan mudah
              </p>
            </div>
            <div className="flex flex-wrap gap-3 mt-4 lg:mt-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-base-300 rounded-xl bg-base-100 dark:bg-base-300 text-base-content/80 hover:bg-base-200/50 transition-colors duration-200">
                <svg
                  className="w-4 h-4 mr-2 text-base-content/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                  />
                </svg>
                {showFilters ? "Sembunyikan Filter" : "Tampilkan Filter"}
              </button>

              <div className="flex items-center bg-base-100 dark:bg-base-300 border border-base-300 rounded-xl overflow-hidden">
                <button
                  onClick={() => handleSetViewMode("table")}
                  className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    viewMode === "table"
                      ? "bg-primary text-white"
                      : "text-base-content/80 hover:text-base-content"
                  }`}>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleSetViewMode("grid")}
                  className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    viewMode === "grid"
                      ? "bg-primary text-white"
                      : "text-base-content/80 hover:text-base-content"
                  }`}>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-base-content/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Cari invoice, bank, atau catatan..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-10 py-4 bg-base-200/30 cursor-pointer focus:bg-base-300/30 dark:bg-base-300 dark:focus:bg-base-100 border border-base-300 rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80"
              />
              {searchTerm && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-base-content/40 hover:text-base-content/80">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="bg-base-100 border border-base-200 rounded-2xl p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-base-content/80 mb-2">
                      Tanggal Dari
                    </label>
                    <input
                      type="date"
                      value={filters.dateFrom || ""}
                      onChange={(e) =>
                        handleFilterChange({ dateFrom: e.target.value })
                      }
                      className="w-full pl-12 pr-10 py-4 bg-base-200/80 border border-base-200 rounded-2xl shadow-sm outline-none focus:outline-none  focus:border-primary transition-all duration-200 text-base-content/80"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-base-content/80 mb-2">
                      Tanggal Sampai
                    </label>
                    <input
                      type="date"
                      value={filters.dateTo || ""}
                      onChange={(e) =>
                        handleFilterChange({ dateTo: e.target.value })
                      }
                      className="w-full pl-12 pr-10 py-4 bg-base-200/80 border border-base-200 rounded-2xl shadow-sm outline-none focus:outline-none  focus:border-primary transition-all duration-200 text-base-content/80"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-base-content/80 mb-2">
                      Bank
                    </label>
                    <select
                      value={filters.bankName || ""}
                      onChange={(e) =>
                        handleFilterChange({ bankName: e.target.value })
                      }
                      className="w-full pl-12 pr-10 py-5 bg-base-200/80 border border-base-200 rounded-2xl shadow-sm outline-none focus:outline-none  focus:border-primary transition-all duration-200 text-base-content/80">
                      <option value="">Semua Bank</option>
                      {[...new Set(invoices.map((inv) => inv.bank_name))].map(
                        (bankName) => (
                          <option key={bankName} value={bankName}>
                            {bankName}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="w-full px-4 py-5 bg-base-200 text-base-content/80 rounded-xl hover:bg-base-200/50 transition-colors duration-200">
                      Reset Filter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedInvoices.length > 0 && (
            <div className="mt-4 flex items-center justify-between bg-primary/5 border border-primary/10 p-4 rounded-2xl">
              <span className="text-primary/80 font-medium">
                {selectedInvoices.length} invoice dipilih
              </span>
              <div className="flex space-x-3">
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-error text-white rounded-xl hover:bg-error/80 disabled:opacity-50 transition-colors duration-200">
                  {isDeleting ? "Menghapus..." : "Hapus Terpilih"}
                </button>
                <button
                  onClick={() => setSelectedInvoices([])}
                  className="px-4 py-2 border border-base-200 bg-base-100 text-base-content/80 rounded-xl hover:bg-base-200/50 transition-colors duration-200">
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-base-100 dark:bg-base-200 p-6 rounded-2xl shadow-sm border border-base-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-base-content/80">
                  {pagination.totalInvoices}
                </div>
                <div className="text-base-content/40 text-sm">
                  Total Invoice
                </div>
              </div>
            </div>
          </div>

          <div className="bg-base-100 dark:bg-base-200 p-6 rounded-2xl shadow-sm border border-base-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-base-content/80">
                  {
                    invoices.filter((inv) => {
                      const today = new Date();
                      const invDate = new Date(inv.created_at);
                      return invDate.toDateString() === today.toDateString();
                    }).length
                  }
                </div>
                <div className="text-base-content/40 text-sm">Hari Ini</div>
              </div>
            </div>
          </div>

          <div className="bg-base-100 dark:bg-base-200 p-6 rounded-2xl shadow-sm border border-base-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-warning"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-base-content/80">
                  {
                    invoices.filter((inv) => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return new Date(inv.created_at) >= weekAgo;
                    }).length
                  }
                </div>
                <div className="text-base-content/40 text-sm">
                  7 Hari Terakhir
                </div>
              </div>
            </div>
          </div>

          <div className="bg-base-100 dark:bg-base-200 p-6 rounded-2xl shadow-sm border border-base-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-base-content/80">
                  Rp{" "}
                  {invoices
                    .reduce((sum, inv) => sum + (inv.total_price || 0), 0)
                    .toLocaleString("id-ID")}
                </div>
                <div className="text-base-content/40 text-sm">Total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && invoices.length === 0 && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-base-content/80 font-medium">
                Memuat data invoice...
              </p>
            </div>
          </div>
        )}

        {/* Invoice Content */}
        {invoices.length > 0 && (
          <>
            {viewMode === "table" ? (
              // Table View
              <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-x-auto">
                <table className="min-w-full divide-y divide-base-200 table-zebra">
                  <thead className="bg-base-200/50">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={
                            selectedInvoices.length === invoices.length &&
                            invoices.length > 0
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-base-200 text-primary focus:ring-primary"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-base-content/40 uppercase tracking-wider">
                        Invoice
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-base-content/40 uppercase tracking-wider">
                        Bank Info
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-base-content/40 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-base-content/40 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-base-content/40 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-base-100 divide-y divide-base-200">
                    {invoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className={`hover:bg-base-200/50 transition-colors duration-200 ${
                          selectedInvoices.includes(invoice.id)
                            ? "bg-primary/5"
                            : ""
                        }`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedInvoices.includes(invoice.id)}
                            onChange={(e) =>
                              handleSelectInvoice(invoice.id, e.target.checked)
                            }
                            className="rounded border-base-200 text-primary focus:ring-primary"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {invoice.image && (
                              <img
                                src={invoice.image}
                                alt="Bukti Transfer"
                                className="h-14 w-14 rounded-xl object-cover mr-4 cursor-pointer shadow-sm hover:shadow-md transition-shadow duration-200"
                                onClick={() =>
                                  window.open(invoice.image, "_blank")
                                }
                              />
                            )}
                            <div>
                              <div className="text-sm font-semibold text-base-content/80">
                                #{invoice.checkout_key}
                              </div>
                              <div className="text-sm text-base-content/40 truncate max-w-xs">
                                {invoice.note || "Tidak ada catatan"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-base-content/80">
                            {invoice.bank_name}
                          </div>
                          <div className="text-sm text-base-content/40 font-mono bg-base-200 px-2 py-1 rounded inline-block">
                            {invoice.account_number}
                          </div>
                          <div className="text-sm text-base-content/40 mt-1">
                            {invoice.receiver_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-success">
                            {invoice.formatted_total_price}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content/40">
                          <div className="font-medium">
                            {new Date(invoice.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </div>
                          <div className="text-xs text-base-content/40">
                            {new Date(invoice.created_at).toLocaleTimeString(
                              "id-ID",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                window.open(invoice.image, "_blank")
                              }
                              className="text-primary hover:text-primary/80 font-medium transition-colors duration-200">
                              Lihat
                            </button>
                            <button
                              onClick={() =>
                                onDeleteInvoice(invoice.checkout_key)
                              }
                              disabled={isDeleting}
                              className="text-error hover:text-error/80 disabled:opacity-50 font-medium transition-colors duration-200">
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // Grid View
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="bg-base-100 dark:bg-base-200 rounded-2xl shadow-sm border border-base-200 overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300 transform hover:-translate-y-1">
                    <div className="relative">
                      {invoice.image && (
                        <img
                          src={invoice.image}
                          alt="Bukti Transfer"
                          className="w-full h-48 object-cover cursor-pointer"
                          onClick={() => window.open(invoice.image, "_blank")}
                        />
                      )}
                      <div className="absolute top-4 left-4">
                        <input
                          type="checkbox"
                          checked={selectedInvoices.includes(invoice.id)}
                          onChange={(e) =>
                            handleSelectInvoice(invoice.id, e.target.checked)
                          }
                          className="rounded border-base-200 text-primary focus:ring-primary bg-base-100/80"
                        />
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                          #{invoice.checkout_key}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-base-content/40">
                            Bank:
                          </span>
                          <span className="text-sm font-semibold text-base-content/80">
                            {invoice.bank_name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-base-content/40">
                            Rekening:
                          </span>
                          <span className="text-sm font-mono bg-base-200 px-2 py-1 rounded">
                            {invoice.account_number}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-base-content/40">
                            Tanggal:
                          </span>
                          <span className="text-sm text-base-content/80">
                            {new Date(invoice.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-base-content/40">
                            Total:
                          </span>
                          <span className="text-sm font-bold text-success">
                            {invoice.formatted_total_price}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-base-content/40 bg-base-200 p-3 rounded-xl">
                          {invoice.note || "-"}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(invoice.image, "_blank")}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-blue-700 text-white rounded-xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-sm font-medium">
                          Lihat Detail
                        </button>
                        <button
                          onClick={() => onDeleteInvoice(invoice.checkout_key)}
                          disabled={isDeleting}
                          className="px-4 py-2 bg-error/10 text-error rounded-xl hover:bg-error/20 disabled:opacity-50 transition-colors duration-200 text-sm font-medium">
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-base-content/40">
              Menampilkan{" "}
              {(pagination.currentPage - 1) * pagination.perPage + 1} -{" "}
              {Math.min(
                pagination.currentPage * pagination.perPage,
                pagination.totalInvoices
              )}{" "}
              dari {pagination.totalInvoices} invoice
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1 || isLoading}
                className="px-4 py-2 border border-base-200 rounded-xl text-sm font-medium text-base-content/80 bg-base-100 hover:bg-base-200/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200">
                Sebelumnya
              </button>

              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  const pageNum =
                    pagination.currentPage <= 3
                      ? i + 1
                      : pagination.currentPage > pagination.totalPages - 2
                      ? pagination.totalPages - 4 + i
                      : pagination.currentPage - 2 + i;

                  if (pageNum < 1 || pageNum > pagination.totalPages)
                    return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isLoading}
                      className={`px-4 py-2 text-sm font-medium rounded-xl disabled:cursor-not-allowed transition-colors duration-200 ${
                        pageNum === pagination.currentPage
                          ? "bg-primary text-white"
                          : "bg-base-100 text-base-content/80 border border-base-200 hover:bg-base-200/50"
                      }`}>
                      {pageNum}
                    </button>
                  );
                }
              )}

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={
                  pagination.currentPage === pagination.totalPages || isLoading
                }
                className="px-4 py-2 border border-base-200 rounded-xl text-sm font-medium text-base-content/80 bg-base-100 hover:bg-base-200/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200">
                Selanjutnya
              </button>
            </div>
          </div>
        )}

        {/* Load More Button */}
        {canLoadMore && (
          <div className="mt-8 text-center">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="px-8 py-3 bg-gradient-to-r from-primary to-blue-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50">
              {isLoading ? "Memuat..." : "Muat Lebih Banyak"}
            </button>
          </div>
        )}

        {/* Empty State */}
        {invoices.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-base-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-base-content/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-base-content/80 mb-2">
              {searchTerm || Object.values(filters).some((f) => f)
                ? "Tidak ada invoice yang sesuai"
                : "Belum ada invoice"}
            </h3>
            <p className="text-base-content/40 mb-6">
              {searchTerm || Object.values(filters).some((f) => f)
                ? "Coba ubah kata kunci pencarian atau filter Anda."
                : "Invoice akan muncul di sini setelah ada yang mengupload bukti transfer."}
            </p>
            {(searchTerm || Object.values(filters).some((f) => f)) && (
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-gradient-to-r from-primary to-blue-700 text-white rounded-xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 font-medium">
                Reset Pencarian & Filter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
