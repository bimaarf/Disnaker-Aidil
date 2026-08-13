import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBanks } from "../../../../../features/bank/bankSlice";
import { toast } from "react-toastify";
import { useInvoiceForm } from "../../../../../features/product/invoiceHook";
import { Check, Clipboard } from "lucide-react"; // Import Lucide Clipboard icon
import clipboardCopy from "clipboard-copy"; // Import clipboard-copy package
import { formatRupiah } from "../../../../../utils/rupiahInput";

export const BankItemSelect = ({ checkoutData }) => {
  // Bank state (existing)
  const { banks, status, page, totalPages } = useSelector(
    (state) => state.banks || []
  );
  const [currentPage, setCurrentPage] = useState(page || 1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFetchingRef = useRef(false);

  // Invoice state (new with Redux)
  const {
    currentInvoice,
    isLoading: invoiceLoading,
    isCreating,
    validationErrors,
    handleSubmit: submitInvoice,
    clearErrors,
  } = useInvoiceForm(checkoutData?.key);

  // Form state
  const [selectedBank, setSelectedBank] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [transferAmount, setTransferAmount] = useState(
    checkoutData?.total_price
  );
  const [transferNote, setTransferNote] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef(null);

  const dispatch = useDispatch();

  // Check if checkout is confirmed or cancelled
  const isCheckoutFinalized = () => {
    const paymentStatus = checkoutData?.payment?.payment_status;
    const checkoutStatus = checkoutData?.status;

    return (
      paymentStatus === "settlement" ||
      paymentStatus === "paid" ||
      checkoutStatus === "completed" ||
      checkoutStatus === "cancelled"
    );
  };

  // Check if can update invoice
  const canUpdateInvoice = currentInvoice && !isCheckoutFinalized();

  // Load banks (existing logic)
  useEffect(() => {
    if (status === "idle") {
      dispatch(
        fetchBanks({
          page: currentPage,
          perPage: 10,
          loadMore: false,
        })
      );
    }
  }, [dispatch, status, currentPage]);

  // Load more banks
  const handleLoadMore = useCallback(() => {
    if (currentPage < totalPages && !isFetchingRef.current && !isLoadingMore) {
      isFetchingRef.current = true;
      setIsLoadingMore(true);
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages, isLoadingMore]);

  // Fetch more banks when page changes
  useEffect(() => {
    if (currentPage > 1) {
      dispatch(
        fetchBanks({
          page: currentPage,
          perPage: 10,
          loadMore: true,
        })
      ).finally(() => {
        isFetchingRef.current = false;
        setIsLoadingMore(false);
      });
    }
  }, [dispatch, currentPage]);

  // Pre-fill form if invoice exists
  useEffect(() => {
    if (currentInvoice) {
      setTransferNote(currentInvoice.note || "");
      setTransferAmount(currentInvoice.total_price);

      // Find and select the bank based on existing invoice
      const bank = banks?.find(
        (b) =>
          b.bank_name === currentInvoice.bank_name &&
          b.account_number === currentInvoice.account_number
      );
      if (bank) {
        setSelectedBank(bank);
      }
    }
  }, [currentInvoice, banks]);

  // Handle bank selection
  const handleBankSelect = (bank) => {
    // Don't allow bank selection if checkout is finalized and invoice exists
    if (currentInvoice && isCheckoutFinalized()) {
      return;
    }

    if (bank.status === "1" || bank.status === 1 || bank.status === true) {
      setSelectedBank(selectedBank?.id === bank.id ? null : bank);
      // Reset form when changing banks
      if (selectedBank?.id !== bank.id) {
        if (!currentInvoice) {
          // Only reset if no existing invoice
          setUploadedFile(null);
          setPreviewUrl("");
          setTransferNote("");
        }
      }
    }
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file terlalu besar. Maksimal 5MB.");
        return;
      }

      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleFileUploadClick = () => {
    // Don't allow file upload if checkout is finalized
    if (isCheckoutFinalized()) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  // Handle form submission with Redux
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Don't allow submission if checkout is finalized
    if (isCheckoutFinalized()) {
      toast.error(
        "Tidak dapat mengupdate invoice. Pesanan sudah selesai atau dibatalkan."
      );
      return;
    }

    if (!selectedBank) {
      toast.error("Harap pilih bank terlebih dahulu");
      return;
    }

    if (!uploadedFile && !currentInvoice) {
      toast.error("Harap upload bukti transfer");
      return;
    }

    if (!transferAmount) {
      toast.error("Jumlah transfer harus diisi");
      return;
    }

    // Create FormData
    const formData = new FormData();
    if (uploadedFile) {
      formData.append("image", uploadedFile);
    }
    formData.append("note", transferNote || "");
    formData.append("bank_id", selectedBank.id);

    // Submit using Redux
    const result = await submitInvoice(formData);

    if (result.success) {
      // Reset form
      setUploadedFile(null);
      setPreviewUrl("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Filter banks based on search term
  const filteredBanks =
    banks?.filter((bank) =>
      bank.bank_name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  useEffect(() => {
    setCopyStatus("");
  }, [selectedBank]);
  const [copyStatus, setCopyStatus] = useState("");
  const copyToClipboard = (text) => {
    clipboardCopy(text).then(() => {
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(""), 2000);
    });
  };

  if (invoiceLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-base-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-base-content/80 font-medium">
            Memuat data invoice...
          </p>
        </div>
      </div>
    );
  }

  // If checkout is finalized and invoice exists, show read-only view
  if (currentInvoice && isCheckoutFinalized()) {
    return (
      <div className="min-h-screen dark:bg-base-200 border border-base-300 shadow-sm rounded-xl bg-base-100 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-xl md:text-2xl font-bold text-base-content/80 mb-3">
              Detail Invoice
            </h1>
            <p className="text-base-content/80 text-md max-w-2xl mx-auto">
              Bukti transfer Anda telah tersimpan
            </p>
          </div>

          {/* Invoice Info Card */}
          <div className="mb-8 bg-primary/5 border border-primary/5 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-white"
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
                <h3 className="text-lg font-semibold text-primary">
                  Invoice #{currentInvoice.id}
                </h3>
                <p className="text-primary/80 text-sm">
                  Status:{" "}
                  {isCheckoutFinalized()
                    ? checkoutData?.status === "completed"
                      ? "Selesai"
                      : "Dibatalkan"
                    : "Menunggu Konfirmasi"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-primary/5 rounded-xl p-4">
                <div className="text-xs font-medium text-primary/80 uppercase tracking-wider mb-1">
                  Bank Tujuan
                </div>
                <div className="text-primary font-semibold">
                  {currentInvoice.bank_name}
                </div>
                <div className="text-primary/80 text-sm font-mono">
                  {currentInvoice.account_number}
                </div>
              </div>
              <div className="bg-primary/5 rounded-xl p-4">
                <div className="text-xs font-medium text-primary/80 uppercase tracking-wider mb-1">
                  Total Transfer
                </div>
                <div className="text-primary font-bold text-lg">
                  {currentInvoice.formatted_total_price}
                </div>
              </div>
              <div className="bg-primary/5 rounded-xl p-4">
                <div className="text-xs font-medium text-primary/80 uppercase tracking-wider mb-1">
                  Tanggal Upload
                </div>
                <div className="text-primary font-semibold">
                  {new Date(currentInvoice.created_at).toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }
                  )}
                </div>
                <div className="text-primary/80 text-sm">
                  {new Date(currentInvoice.created_at).toLocaleTimeString(
                    "id-ID",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </div>
              </div>
            </div>

            {/* Show invoice image */}
            {currentInvoice.image && (
              <div className="mt-6">
                <div className="text-sm font-medium text-primary/80 mb-3">
                  Bukti Transfer:
                </div>
                <div className="bg-base-100 rounded-xl p-4 shadow-sm">
                  <img
                    src={currentInvoice.image}
                    alt="Bukti Transfer"
                    className="max-w-full max-h-60 rounded-lg object-cover cursor-pointer mx-auto shadow-md hover:shadow-lg transition-shadow duration-200"
                    onClick={() => window.open(currentInvoice.image, "_blank")}
                  />
                </div>
              </div>
            )}

            {/* Show note if exists */}
            {currentInvoice.note && (
              <div className="mt-4 bg-base-100 rounded-xl p-4">
                <div className="text-sm font-medium text-base-content/60 mb-2">
                  Catatan:
                </div>
                <p className="text-base-content/80">{currentInvoice.note}</p>
              </div>
            )}
          </div>

          {/* Info message */}
          <div className="alert alert-info">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>
              Invoice tidak dapat diubah karena pesanan sudah{" "}
              {checkoutData?.status === "completed" ? "selesai" : "dibatalkan"}.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-base-200 border border-base-300 shadow-sm rounded-xl bg-base-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-xl md:text-2xl font-bold text-base-content/80 mb-3">
            {currentInvoice && !isCheckoutFinalized()
              ? "Update Invoice"
              : "Pilih Bank Transfer"}
          </h1>
          <p className="text-base-content/80 text-md max-w-2xl mx-auto">
            {currentInvoice && !isCheckoutFinalized()
              ? "Perbarui bukti transfer Anda dengan mudah dan aman"
              : "Pilih bank tujuan transfer dan upload bukti pembayaran Anda"}
          </p>
        </div>

        {/* Show existing invoice info if available and can update */}
        {currentInvoice && canUpdateInvoice && (
          <div className="mb-8 bg-primary/5 border border-primary/5 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-white"
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
                <h3 className="text-lg font-semibold text-primary">
                  Invoice Sudah Ada
                </h3>
                <p className="text-primary/80 text-sm">
                  Anda dapat memperbarui bukti transfer yang sudah diupload
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-primary/5 rounded-xl p-4">
                <div className="text-xs font-medium text-primary/80 uppercase tracking-wider mb-1">
                  Bank Tujuan
                </div>
                <div className="text-primary font-semibold">
                  {currentInvoice.bank_name}
                </div>
                <div className="text-primary/80 text-sm font-mono">
                  {currentInvoice.account_number}
                </div>
              </div>
              <div className="bg-primary/5 rounded-xl p-4">
                <div className="text-xs font-medium text-primary/80 uppercase tracking-wider mb-1">
                  Total Transfer
                </div>
                <div className="text-primary font-bold text-lg">
                  {currentInvoice.formatted_total_price}
                </div>
              </div>
              <div className="bg-primary/5 rounded-xl p-4">
                <div className="text-xs font-medium text-primary/80 uppercase tracking-wider mb-1">
                  Tanggal Upload
                </div>
                <div className="text-primary font-semibold">
                  {new Date(currentInvoice.created_at).toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }
                  )}
                </div>
                <div className="text-primary/80 text-sm">
                  {new Date(currentInvoice.created_at).toLocaleTimeString(
                    "id-ID",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Bank List */}
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
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
                placeholder="Cari nama bank..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-base-200/80 border border-base-200 rounded-2xl shadow-sm outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 placeholder-base-content/40"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
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

            {/* Bank List */}
            <div className="space-y-4">
              {filteredBanks.map((item, key) => {
                const isSelected = selectedBank?.id === item.id;
                const isActive =
                  item.status === "1" ||
                  item.status === 1 ||
                  item.status === true;
                const canSelect = !currentInvoice || canUpdateInvoice;

                return (
                  <div key={key} className="transition-all duration-300">
                    <div
                      onClick={() => canSelect && handleBankSelect(item)}
                      className={`group bg-base-100/50 rounded-2xl p-3 border border-base-300 shadow-sm transition-all duration-300 ${
                        isActive && canSelect
                          ? `cursor-pointer ${
                              isSelected
                                ? "border-info shadow-lg ring-4 ring-info/5 bg-base-100"
                                : "border-base-200 hover:border-info/30 hover:bg-base-100"
                            }`
                          : "border-base-200 opacity-40 cursor-not-allowed bg-base-100"
                      }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Bank Icon or Image */}
                          <div
                            className={`w-14 h-14 border-2 rounded-xl flex items-center justify-center shadow-sm overflow-hidden transition-all duration-200 ${
                              isSelected
                                ? "border-info/30 bg-info/5"
                                : "border-base-200 bg-base-100"
                            }`}>
                            {item.image ? (
                              <img
                                src={`${process.env.REACT_APP_API}${item.image}`}
                                alt={item.bank_name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <svg
                                className={`w-7 h-7 ${
                                  isSelected
                                    ? "text-info/80"
                                    : "text-base-content/40"
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-beetwen space-x-3 mb-2">
                              <h3
                                className={`text-md font-bold transition-colors duration-200 truncate ${
                                  isSelected
                                    ? "text-info/80"
                                    : "text-base-content/80 group-hover:text-info/80"
                                }`}>
                                {item.bank_name}
                              </h3>
                              {!isActive && (
                                <span className="px-3 py-1 text-xs float-right font-medium bg-error/5 text-error rounded-full whitespace-nowrap">
                                  Maintenance
                                </span>
                              )}
                              {isSelected && (
                                <span className="px-3 py-1 text-xs float-right font-medium bg-info/5 text-info/80 rounded-full whitespace-nowrap">
                                  Dipilih
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-base-content/80 font-semibold mb-1">
                              {item.receiver_name}
                            </p>
                            <p className="text-sm text-base-content/40 font-mono bg-base-200 px-3 py-1 rounded-lg inline-block">
                              {item.account_number}
                            </p>
                          </div>
                        </div>

                        {/* Arrow Icon */}
                        <div
                          className={`transition-all duration-300 flex-shrink-0 ml-4 ${
                            isActive && canSelect
                              ? isSelected
                                ? "text-blue-500 transform rotate-90"
                                : "text-base-content/40 group-hover:text-blue-500 group-hover:translate-x-1"
                              : "text-base-content"
                          }`}>
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Description */}
                    <div
                      className={`overflow-hidden transition-all duration-500 ${
                        isSelected
                          ? "max-h-96 opacity-100 mt-4"
                          : "max-h-0 opacity-0"
                      }`}>
                      {item.description && (
                        <div className="bg-warning border-l-8 border-primary p-4 rounded-r-xl">
                          <div
                            className="prose prose-sm max-w-none leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                            dangerouslySetInnerHTML={{
                              __html: item.description,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Loading State */}
            {(isLoadingMore || status === "loading") && (
              <div className="flex justify-center py-12">
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-base-content/80">
                    Memuat data bank...
                  </span>
                </div>
              </div>
            )}

            {/* Load More Button */}
            {currentPage < totalPages &&
              !isFetchingRef.current &&
              !isLoadingMore && (
                <div className="text-center pt-4">
                  <button
                    onClick={handleLoadMore}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300">
                    <div className="flex items-center space-x-2">
                      <span>Muat Lebih Banyak</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </div>
                  </button>
                </div>
              )}

            {/* Empty State */}
            {filteredBanks.length === 0 && searchTerm && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-10 h-10 text-base-content/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-base-content/80 mb-2">
                  Bank tidak ditemukan
                </h3>
                <p className="text-base-content/40 mb-4">
                  {`Tidak ada bank dengan nama "${searchTerm}"`}
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="px-6 py-2 bg-base-200 text-base-content/80 rounded-xl hover:bg-base-200 transition-colors duration-200">
                  Hapus Pencarian
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Upload Form */}
          <div className="lg:sticky lg:top-4 lg:h-fit">
            <div className="bg-base-100 rounded-2xl shadow-xl border border-base-300 overflow-hidden">
              {selectedBank ? (
                <>
                  {/* Form Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-base-100/20 rounded-xl flex items-center justify-center mr-4">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold mb-1">
                          {currentInvoice && canUpdateInvoice
                            ? "Update Bukti Transfer"
                            : "Upload Bukti Transfer"}
                        </h2>
                        <p className="text-blue-100 text-sm">
                          {currentInvoice && canUpdateInvoice
                            ? "Perbarui bukti pembayaran Anda"
                            : "Upload bukti pembayaran Anda"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-base-100/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-100 text-sm font-medium">
                          Transfer ke
                        </span>
                        <span className="text-white text-sm font-semibold">
                          {selectedBank.bank_name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-100 text-sm font-medium">
                          No. Rekening
                        </span>
                        <span className="text-white text-sm font-mono bg-base-100/10 px-3 py-1 rounded-lg">
                          {selectedBank.account_number}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-100 text-sm font-medium">
                          Atas Nama
                        </span>
                        <span className="text-white text-sm font-semibold">
                          {selectedBank.receiver_name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-base-100/10 rounded-xl p-4 flex justify-center text-center">
                    <div className="space-y-3 whitespace-nowrap">
                      <p className="text-base-content/60">Transfer ke:</p>
                      <img
                        className="max-w-60 mx-auto"
                        src={`${process.env.REACT_APP_API}${selectedBank.image}`}
                        alt={selectedBank.bank_name}
                      />
                      <div className="flex items-center gap-2 w-full mt-2 justify-between">
                        <span className="text-base-content/80 text-start min-w-40 text-sm font-medium">
                          Nama Bank
                        </span>
                        <span className="text-base-content/80 w-fit text-sm font-medium">
                          :
                        </span>
                        <div className="w-full text-end">
                          <span className="text-base-content text-sm font-mono bg-base-300/50 px-3 py-1 rounded-lg">
                            {selectedBank.bank_name}
                          </span>
                          <button className="ml-2 text-blue-500 hover:text-blue-700"></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full justify-between">
                        <span className="text-base-content/80 text-start min-w-40 text-sm font-medium">
                          Atas Nama
                        </span>
                        <span className="text-base-content/80 w-fit text-sm font-medium">
                          :
                        </span>
                        <div className="w-full text-end">
                          <span className="text-base-content text-sm font-mono bg-base-300/50 px-3 py-1 rounded-lg">
                            {selectedBank.receiver_name}
                          </span>
                          <button className="ml-2 text-blue-500 hover:text-blue-700"></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full justify-between">
                        <span className="text-base-content/80 text-start min-w-40 text-sm font-medium">
                          No. Rekening
                        </span>
                        <span className="text-base-content/80 w-fit text-sm font-medium">
                          :
                        </span>
                        <div className="w-full flex justify-end text-end">
                          <div
                            onClick={() =>
                              copyToClipboard(selectedBank.account_number)
                            }
                            className="text-base-content w-fit flex justify-end cursor-pointer hover:brightness-95 items-center gap-2 text-sm font-mono bg-base-300/50 px-3 py-1 rounded-lg transition-all">
                            {copyStatus ? (
                              <Check className="h-4 w-4 text-success" />
                            ) : (
                              <Clipboard className="h-4 w-4" />
                            )}
                            <p>{selectedBank.account_number}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-center flex justify-center">
                        <div className="space-y-2">
                          <div className="text-base-content/80 min-w-40 text-sm font-medium">
                            Jumlah Transfer{" "}
                            <span className="text-red-500">*</span>
                          </div>
                          <p className="text-success text-2xl font-mono bg-base-300/50 px-3 py-1 rounded-lg">
                            {formatRupiah(transferAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Form Content */}
                  <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Display validation errors */}
                    {validationErrors && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-xl">
                        <div className="flex items-center mb-3">
                          <svg
                            className="w-5 h-5 text-red-400 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <div className="text-red-800 font-semibold">
                            Kesalahan Validasi
                          </div>
                        </div>
                        <ul className="text-error text-sm space-y-2 mb-4">
                          {Object.entries(validationErrors).map(
                            ([field, errors]) => (
                              <li key={field} className="flex items-start">
                                <span className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <div>
                                  <strong className="capitalize">
                                    {field}:
                                  </strong>{" "}
                                  {Array.isArray(errors)
                                    ? errors.join(", ")
                                    : errors}
                                </div>
                              </li>
                            )
                          )}
                        </ul>
                        <button
                          type="button"
                          onClick={clearErrors}
                          className="text-red-600 text-sm font-medium hover:text-red-800 transition-colors duration-200">
                          ✕ Tutup Pesan
                        </button>
                      </div>
                    )}

                    {/* Show current image if updating */}
                    {currentInvoice &&
                      currentInvoice.image &&
                      canUpdateInvoice && (
                        <div className="bg-gradient-to-r from-base-200 to-base-200 border border-base-200 rounded-2xl p-6">
                          <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center mr-3">
                              <svg
                                className="w-5 h-5 text-white/70"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            <div>
                              <div className="text-amber-800 font-semibold">
                                Bukti Transfer Saat Ini
                              </div>
                              <div className="text-amber-600 text-sm">
                                Klik gambar untuk melihat ukuran penuh
                              </div>
                            </div>
                          </div>
                          <div className="bg-base-100 rounded-xl p-4 shadow-sm">
                            <img
                              src={currentInvoice.image}
                              alt="Current Invoice"
                              className="max-w-full max-h-40 rounded-lg object-cover cursor-pointer mx-auto shadow-md hover:shadow-lg transition-shadow duration-200"
                              onClick={() =>
                                window.open(currentInvoice.image, "_blank")
                              }
                            />
                          </div>
                          <p className="text-amber-700 text-sm mt-4 text-center">
                            Upload gambar baru di bawah untuk mengganti bukti
                            transfer ini
                          </p>
                        </div>
                      )}

                    {/* File Upload */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-base-content/80">
                        Bukti Transfer <span className="text-red-500">*</span>
                      </label>
                      <div
                        onClick={handleFileUploadClick}
                        className={`border-3 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${
                          previewUrl
                            ? "border-success bg-success/50 hover:bg-success"
                            : "border-base-300 bg-primary/5 hover:border-primary hover:bg-primary/10"
                        }`}>
                        {previewUrl ? (
                          <div className="space-y-6">
                            <div className="relative inline-block">
                              <img
                                src={previewUrl}
                                alt="Preview"
                                className="max-w-full max-h-64 mx-auto rounded-2xl shadow-lg"
                              />
                              <div className="absolute -top-2 -right-2">
                                <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div className="bg-base-100 rounded-xl p-4 shadow-sm">
                              <p className="text-sm text-green-700 font-semibold mb-2">
                                ✓ File berhasil diupload
                              </p>
                              <p className="text-xs text-base-content/80 mb-3">
                                {uploadedFile?.name}
                              </p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFile();
                                }}
                                className="inline-flex items-center px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-error/5 rounded-xl transition-colors duration-200 font-medium">
                                <svg
                                  className="w-4 h-4 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Hapus File
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="w-16 h-16 bg-base-200 rounded-2xl flex items-center justify-center mx-auto">
                              <svg
                                className="w-8 h-8 text-base-content/40"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 48 48">
                                <path
                                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-base-content/80 font-semibold mb-2">
                                Klik untuk upload atau drag & drop
                              </p>
                              <p className="text-sm text-base-content/40">
                                PNG, JPG, JPEG, atau PDF • Maksimal 5MB
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileUpload}
                        accept="image/*,.pdf"
                        className="hidden"
                        required={!currentInvoice}
                      />
                    </div>

                    {/* Note Input */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-base-content/80">
                        Catatan (Opsional)
                      </label>
                      <textarea
                        value={transferNote}
                        onChange={(e) => setTransferNote(e.target.value)}
                        placeholder="Tambahkan catatan untuk transfer ini (opsional)..."
                        rows="4"
                        className="w-full px-4 py-4 border-2 border-base-200 bg-base-200/80 rounded-2xl focus:outline-none focus:border-primary resize-none outline-none transition-all duration-200 placeholder-base-content/40"
                      />
                      <p className="text-xs text-base-content/40">
                        Contoh: Transfer untuk pesanan #12345, dari rekening BCA
                        a.n John Doe
                      </p>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={
                          (!uploadedFile && !currentInvoice) ||
                          !transferAmount ||
                          isCreating ||
                          isCheckoutFinalized()
                        }
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-5 px-8 rounded-2xl shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-700 transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:from-base-300 disabled:to-base-300 text-lg">
                        {isCreating ? (
                          <div className="flex items-center justify-center space-x-3">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>
                              {currentInvoice && canUpdateInvoice
                                ? "Memperbarui..."
                                : "Mengirim..."}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                              />
                            </svg>
                            <span>
                              {currentInvoice && canUpdateInvoice
                                ? "Update Bukti Transfer"
                                : "Kirim Bukti Transfer"}
                            </span>
                          </div>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="p-16 text-center">
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-base-content/80 mb-3">
                    Pilih Bank Terlebih Dahulu
                  </h3>
                  <p className="text-base-content/40 leading-relaxed">
                    Klik pada salah satu bank di sebelah kiri untuk mulai upload
                    bukti transfer Anda
                  </p>
                  <div className="mt-6 flex items-center justify-center space-x-2 text-base-content/40">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    <span className="text-sm">Pilih bank di samping</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
