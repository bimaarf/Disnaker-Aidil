import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  fetchCheckout,
  updatePaymentStatus,
  optimisticUpdateCheckout,
  clearOptimisticState,
  changePaymentMethod,
} from "../../../../features/product/checkoutSlice";
import { CircularLoader } from "../../../../Components/_CircularLoader";
import { formatRupiah } from "../../../../utils/rupiahInput";
import { Landmark, ShoppingBag } from "lucide-react";
import axios from "axios";
import { BankItemSelect } from "../__bank/__components/bankItemSelect";

// =====================================================
// MEMOIZED COMPONENTS
// =====================================================

// PaymentMethodInfo Component
const PaymentMethodInfo = React.memo(({ paymentMethod, paymentType }) => {
  const formatPaymentType = (type) => {
    const paymentTypeMap = {
      credit_card: "Kartu Kredit",
      bank_transfer: "Transfer Bank",
      echannel: "Mandiri Bill",
      bca_va: "BCA Virtual Account",
      bni_va: "BNI Virtual Account",
      bri_va: "BRI Virtual Account",
      permata_va: "Permata Virtual Account",
      other_va: "Bank Lain Virtual Account",
      gopay: "GoPay",
      shopeepay: "ShopeePay",
      qris: "QRIS",
      cstore: "Convenience Store",
      akulaku: "Akulaku",
      indomaret: "Indomaret",
      alfamart: "Alfamart",
    };

    return paymentTypeMap[type] || type || "Belum dipilih";
  };
  const methodConfig = useMemo(
    () => ({
      bank_transfer: {
        icon: "account_balance",
        label: "Transfer Bank",
        description: "Transfer ke rekening bank (Memerlukan bukti transfer)",
        color: "purple",
      },
      cash_on_delivery: {
        icon: "payments",
        label: "Bayar di Tempat",
        description: "Bayar saat sesi pertemuan pertama",
        color: "green",
      },
      midtrans: {
        icon: "payment",
        label: "Payment Gateway",
        description: paymentType
          ? `Metode: ${formatPaymentType(paymentType)}`
          : "Metode pembayaran belum dipilih",
        color: paymentType ? "orange" : "gray",
      },
    }),
    [paymentType]
  );

  const config = methodConfig[paymentMethod] || methodConfig.credit_card;

  // Helper function to format payment type

  // Get specific icon for payment type if using Midtrans
  const getPaymentTypeIcon = (type) => {
    const iconMap = {
      credit_card: "credit_card",
      bank_transfer: "account_balance",
      echannel: "account_balance",
      bca_va: "account_balance",
      bni_va: "account_balance",
      bri_va: "account_balance",
      permata_va: "account_balance",
      other_va: "account_balance",
      gopay: "account_balance_wallet",
      shopeepay: "account_balance_wallet",
      qris: "qr_code_2",
      cstore: "store",
      indomaret: "store",
      alfamart: "store",
      akulaku: "payment",
    };

    return iconMap[type] || "payment";
  };

  const displayIcon =
    paymentMethod === "midtrans" && paymentType
      ? getPaymentTypeIcon(paymentType)
      : config.icon;

  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          paymentMethod === "midtrans" && paymentType
            ? "bg-orange-100 dark:bg-orange-900/20"
            : "bg-base-300/10"
        }`}>
        <span
          className={`material-symbols-outlined ${
            paymentMethod === "midtrans" && paymentType
              ? "text-orange-600 dark:text-orange-400"
              : `text-${config.color}-600`
          }`}>
          {displayIcon}
        </span>
      </div>
      <div>
        <p className="font-semibold text-base-content">{config.label}</p>
        <p className="text-sm text-base-content/50">{config.description}</p>
        {paymentMethod === "midtrans" && paymentType && (
          <div className="mt-1 flex items-center gap-2">
            <span className="badge badge-sm badge-warning">
              {formatPaymentType(paymentType)}
            </span>
            {paymentType === "qris" && (
              <span className="text-xs text-base-content/50">
                Scan QR Code untuk pembayaran
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
PaymentMethodInfo.displayName = "PaymentMethodInfo";

// ProductItem Component
const ProductItem = React.memo(({ checkoutProduct }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const product = checkoutProduct?.product;
  const quantity = checkoutProduct?.quantity || 1;
  const price = checkoutProduct?.price || 0;
  const promotions = checkoutProduct?.promotions || [];

  // Calculate discount information
  const totalProductPrice = price * quantity;
  const activePromotions = promotions.filter(
    (promo) =>
      (promo.status === 1 || promo.status === "1") &&
      promo.discount_percentage > 0 &&
      (!promo.expired || new Date(promo.expired) > new Date())
  );

  const totalDiscount = activePromotions.reduce(
    (acc, promo) => acc + parseFloat(promo.discount_percentage),
    0
  );

  const discountAmount = totalDiscount
    ? (totalProductPrice * totalDiscount) / 100
    : 0;

  const discountedPrice = totalProductPrice - discountAmount;

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, []);

  if (!product) {
    return (
      <div className="bg-base-100 dark:bg-base-200 rounded-lg border border-base-300 p-4">
        <p className="text-base-content/60">Data produk tidak tersedia</p>
      </div>
    );
  }

  return (
    <div className="bg-base-100 dark:bg-base-200 rounded-lg border border-base-300 p-4 hover:shadow-sm transition-shadow">
      <div className="flex gap-4">
        <div className="w-16 h-16 bg-base-300/10 rounded-lg overflow-hidden flex-shrink-0 relative">
          {product.images?.[0] && !imageError ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="loading loading-spinner loading-sm"></span>
                </div>
              )}
              <img
                src={`${process.env.REACT_APP_API}${product.images[0].image_data}`}
                alt={product.name}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  imageLoaded ? "opacity-100 hover:scale-105" : "opacity-0"
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-base-content/40">
                image
              </span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-base-content mb-1 line-clamp-1">
            {product.name}
          </h4>
          <p className="text-sm text-base-content/50 mb-2">
            {product.categories?.[0]?.name || "Tanpa Kategori"}
          </p>
          {activePromotions.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {activePromotions.map((promo) => (
                <span
                  key={promo.id}
                  className="badge bg-error/10 text-error text-xs">
                  {promo.discount_percentage}% -{" "}
                  {promo.title.replace(` (Product ID: ${product.id})`, "")}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              {totalDiscount > 0 ? (
                <>
                  <span className="text-base-content/50 text-sm line-through">
                    {formatRupiah(totalProductPrice)}
                  </span>
                  <span className="text-xl font-bold text-primary ml-2">
                    {formatRupiah(discountedPrice)}
                  </span>
                </>
              ) : (
                <span className="text-xl font-bold text-primary">
                  {formatRupiah(totalProductPrice)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-base-content/50">{quantity}x</span>
              <span className="text-sm font-medium text-base-content/70">
                ={" "}
                {formatRupiah(
                  totalDiscount > 0 ? discountedPrice : totalProductPrice
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
ProductItem.displayName = "ProductItem";

// StatusBadge Component
// Updated StatusBadge Component dengan mapping yang benar
const StatusBadge = React.memo(({ status, type = "payment" }) => {
  const getStatusConfig = useCallback((status, type) => {
    const effectiveStatus = typeof status === "object" ? status.status : status;

    if (type === "payment") {
      switch (effectiveStatus) {
        case "settlement":
        case "paid": // Added "paid" status
          return {
            color: "bg-success/10 text-success",
            text: "Paid",
            tooltip: "Payment has been confirmed",
          };
        case "pending":
          return {
            color: "bg-warning/10 text-warning",
            text: "Pending",
            tooltip: "Awaiting payment confirmation",
          };
        case "cancel":
        case "cancelled": // Handle both spellings
          return {
            color: "bg-error/10 text-error",
            text: "Cancelled",
            tooltip: "Payment has been cancelled",
          };
        case "expire":
        case "expired": // Handle both spellings
          return {
            color: "bg-base-300/80 text-base-content/60",
            text: "Expired",
            tooltip: "Payment deadline has passed",
          };
        case "deny":
          return {
            color: "bg-error/10 text-error",
            text: "Denied",
            tooltip: "Payment was rejected by the gateway",
          };
        case "refund":
        case "partial_refund":
        case "refunded": // Handle different refund statuses
          return {
            color: "bg-warning/10 text-warning",
            text: "Refunded",
            tooltip: "Payment has been refunded",
          };
        case "challenge":
          return {
            color: "bg-primary/10 text-primary",
            text: "Under Review",
            tooltip: "Payment is under review for potential fraud",
          };
        case "failed":
          return {
            color: "bg-error/10 text-error",
            text: "Failed",
            tooltip: "Payment failed, please try again",
          };
        case "unpaid":
        default:
          return {
            color: "bg-base-300/80 text-base-content/60",
            text: "Unpaid",
            tooltip: "Payment has not been made",
          };
      }
    } else {
      // Order status
      switch (effectiveStatus) {
        case "completed":
          return {
            color: "bg-success/10 text-success",
            text: "Completed",
            tooltip: "Order has been completed",
          };
        case "processing":
          return {
            color: "bg-primary/10 text-primary",
            text: "Processing",
            tooltip: "Order is being processed",
          };
        case "cancelled":
          return {
            color: "bg-error/10 text-error",
            text: "Cancelled",
            tooltip: "Order has been cancelled",
          };
        case "pending":
        default:
          return {
            color: "bg-warning/10 text-warning",
            text: "Pending",
            tooltip: "Order is awaiting confirmation",
          };
      }
    }
  }, []);

  const config = getStatusConfig(status, type);

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${config.color} relative group`}>
      {config.text}
      <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 z-10 whitespace-nowrap">
        {config.tooltip}
      </span>
    </span>
  );
});
StatusBadge.displayName = "StatusBadge";

// Receipt Component
// Updated conditions in Receipt component for showing regenerate payment button

const Receipt = React.memo(
  ({
    checkoutData,
    onPaymentStatusChange,
    isUpdating,
    calculateProductTotals,
    onRegeneratePayment,
    onChangePaymentMethod,
    isChangePaymentModalOpen,
    handleChangePaymentMethod,
    effectiveCheckoutData,
    availablePaymentMethods,
    setIsChangePaymentModalOpen,
  }) => {
    const currentPaymentStatus =
      checkoutData.payment?.payment_status?.status ||
      checkoutData.payment?.payment_status ||
      "unpaid";
    const currentOrderStatus = checkoutData.status || "pending";
    const paymentType = checkoutData.payment?.payment_type || null;

    // Updated conditions for showing payment buttons
    const canUpdatePayment =
      (currentPaymentStatus === "pending" ||
        currentPaymentStatus === "unpaid" ||
        (currentPaymentStatus === "cancelled" && paymentType !== null) ||
        (currentPaymentStatus === "expire" && paymentType !== null) ||
        currentOrderStatus === "cancelled") &&
      currentOrderStatus !== "completed";

    const canChangePaymentMethod =
      currentOrderStatus !== "completed" &&
      currentPaymentStatus !== "settlement" &&
      currentPaymentStatus !== "paid";

    // New condition for regenerate payment button
    const canRegeneratePayment =
      checkoutData.payment?.payment_method === "midtrans" &&
      (currentPaymentStatus === "expire" ||
        currentPaymentStatus === "failed" ||
        currentPaymentStatus === "cancel" ||
        currentPaymentStatus === "cancelled" ||
        currentPaymentStatus === "deny" ||
        currentPaymentStatus === "pending" ||
        (currentOrderStatus === "cancelled" &&
          checkoutData.payment?.payment_method === "midtrans"));

    // Calculate totals with promotions
    const { subtotalBeforeDiscounts, totalProductDiscounts } =
      calculateProductTotals();
    const subtotalAfterProductDiscounts =
      subtotalBeforeDiscounts - totalProductDiscounts;

    // Calculate referral discount
    const referralPromotion = checkoutData.referral_promotion;
    const referralDiscountAmount = referralPromotion
      ? (subtotalAfterProductDiscounts *
          parseFloat(referralPromotion.discount_percentage)) /
        100
      : 0;

    return (
      <div className="bg-base-100 dark:bg-base-200 rounded-lg max-w-full mx-auto border-4 border-dashed border-base-300 print-area">
        <div className="p-4">
          <h2 className="text-lg font-bold text-base-content text-center mb-2">
            Yz-Course Checkout
          </h2>
          <div className="text-center text-base-content/60 mb-4 text-sm">
            <p>1234 Market Street, Suite 101</p>
            <p>City, State ZIP</p>
            <p>Date: {new Date().toLocaleDateString()}</p>
            <p>
              Time:{" "}
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <table className="w-full text-base-content mb-4 text-sm">
            <thead>
              <tr className="border-b border-base-300">
                <th className="text-left py-1 font-semibold">Item</th>
                <th className="text-center py-1 font-semibold">Qty</th>
                <th className="text-right py-1 font-semibold">Price</th>
              </tr>
            </thead>
            <tbody>
              {checkoutData.products?.map((checkoutProduct, index) => {
                const productPrice = parseFloat(checkoutProduct.price || 0);
                const totalProductPrice =
                  productPrice * checkoutProduct.quantity;
                const activePromotions = (
                  checkoutProduct.promotions || []
                ).filter(
                  (promo) =>
                    (promo.status === 1 || promo.status === "1") &&
                    promo.discount_percentage > 0 &&
                    (!promo.expired || new Date(promo.expired) > new Date())
                );

                const totalProductDiscount = activePromotions.reduce(
                  (acc, promo) => acc + parseFloat(promo.discount_percentage),
                  0
                );

                const productDiscountAmount = totalProductDiscount
                  ? (totalProductPrice * totalProductDiscount) / 100
                  : 0;

                const productDiscountedPrice =
                  totalProductPrice - productDiscountAmount;

                return (
                  <tr
                    key={checkoutProduct.id || index}
                    className="border-b border-base-200">
                    <td className="py-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-base-300/10 rounded flex items-center justify-center flex-shrink-0">
                          {checkoutProduct.product?.images?.[0] ? (
                            <img
                              src={`${process.env.REACT_APP_API}${checkoutProduct.product.images[0].image_data}`}
                              alt={checkoutProduct.product.name}
                              className="w-full h-full rounded object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-base-content/40 text-sm">
                              image
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs truncate">
                            {checkoutProduct.product?.name || "Produk"}
                          </p>
                          <p className="text-xs text-base-content/50 truncate">
                            {checkoutProduct.product?.categories?.[0]?.name ||
                              "Tanpa Kategori"}
                          </p>
                          {activePromotions.length > 0 && (
                            <div className="mt-1">
                              {activePromotions.map((promo) => (
                                <p
                                  key={promo.id}
                                  className="text-xs text-error">
                                  {promo.title.replace(
                                    ` (Product ID: ${checkoutProduct.product_id})`,
                                    ""
                                  )}{" "}
                                  ({promo.discount_percentage}%)
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-1">
                      {checkoutProduct.quantity}
                    </td>
                    <td className="text-right py-1">
                      {totalProductDiscount > 0 ? (
                        <div>
                          <span className="line-through text-base-content/50 text-xs block">
                            {formatRupiah(totalProductPrice)}
                          </span>
                          <span className="text-primary font-semibold">
                            {formatRupiah(productDiscountedPrice)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-primary font-semibold">
                          {formatRupiah(totalProductPrice)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalProductDiscounts > 0 && (
            <div className="mb-4 border-t border-base-300 pt-2">
              <p className="text-sm text-base-content/60 font-semibold mb-1">
                Diskon Produk
              </p>
              {checkoutData.products?.flatMap((checkoutProduct) =>
                (checkoutProduct.promotions || [])
                  .filter(
                    (promo) =>
                      (promo.status === 1 || promo.status === "1") &&
                      promo.discount_percentage > 0 &&
                      (!promo.expired || new Date(promo.expired) > new Date())
                  )
                  .map((promo) => (
                    <div
                      key={promo.id}
                      className="flex justify-between text-base-content/60 text-xs">
                      <span>
                        {promo.title.replace(
                          ` (Product ID: ${checkoutProduct.product_id})`,
                          ""
                        )}{" "}
                        ({promo.discount_percentage}%) -{" "}
                        {checkoutProduct.product?.name}
                      </span>
                      <span className="text-error">
                        -{" "}
                        {formatRupiah(
                          (promo.discount_percentage *
                            checkoutProduct.price *
                            checkoutProduct.quantity) /
                            100
                        )}
                      </span>
                    </div>
                  ))
              )}
              <div className="flex justify-between text-base-content font-medium text-sm border-t border-base-200 pt-1 mt-1">
                <span>Subtotal setelah diskon produk:</span>
                <span>{formatRupiah(subtotalAfterProductDiscounts)}</span>
              </div>
            </div>
          )}

          {referralPromotion && referralDiscountAmount > 0 && (
            <div className="mb-4 border-t border-base-300 pt-2">
              <p className="text-sm text-base-content/60 font-semibold mb-1">
                Diskon Referral
              </p>
              <div className="flex justify-between text-base-content/60 text-xs">
                <span>
                  {referralPromotion.title} (
                  {referralPromotion.discount_percentage}% dari subtotal)
                </span>
                <span className="text-error">
                  - {formatRupiah(referralDiscountAmount)}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-between font-bold text-base-content mb-4 text-lg border-t border-base-300 pt-2">
            <span>Total:</span>
            <span className="text-primary">
              {formatRupiah(checkoutData.total_price)}
            </span>
          </div>

          <div className="bg-base-200/50 dark:bg-base-300/50 p-3 rounded border border-base-300 text-center text-sm">
            <p className="font-medium text-info mb-1">Informasi Penting</p>
            <p className="text-info">
              Harga sudah termasuk pajak dan biaya layanan. Pengiriman akan
              dikenakan biaya tambahan.
              {(totalProductDiscounts > 0 || referralDiscountAmount > 0) && (
                <span className="text-success font-medium">
                  {" "}
                  Diskon telah diterapkan.
                </span>
              )}
            </p>
          </div>

          <p className="text-base-content/60 text-center mt-2 text-sm">
            Thank you for shopping with us!
          </p>
        </div>

        {/* Change Payment Method Button */}
        <div className="p-4 border-t border-base-300 space-y-3">
          {canChangePaymentMethod && (
            <button
              onClick={onChangePaymentMethod}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              disabled={isUpdating}>
              {isUpdating ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <span className="material-symbols-outlined text-sm">
                  swap_horiz
                </span>
              )}
              Ubah Metode Pembayaran
            </button>
          )}

          <ChangePaymentMethodModal
            isOpen={isChangePaymentModalOpen}
            onClose={() => setIsChangePaymentModalOpen(false)}
            onConfirm={handleChangePaymentMethod}
            currentMethod={effectiveCheckoutData?.payment?.payment_method}
            availableMethods={availablePaymentMethods}
          />
        </div>

        {/* Payment Action Buttons */}
        {canUpdatePayment && (
          <div className="p-4 border-t border-base-300 space-y-3">
            {/* Regenerate Payment Button for Midtrans */}
            {canRegeneratePayment && (
              <button
                onClick={onRegeneratePayment}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                disabled={isUpdating}>
                {isUpdating ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <span className="material-symbols-outlined text-sm">
                    refresh
                  </span>
                )}
                {currentPaymentStatus === "expire" ||
                currentPaymentStatus === "failed" ||
                currentPaymentStatus === "cancel" ||
                currentPaymentStatus === "cancelled" ||
                currentPaymentStatus === "deny"
                  ? "Buat Token Pembayaran Baru"
                  : "Bayar Sekarang"}
              </button>
            )}

            {/* Manual Payment Confirmation Buttons */}
            {checkoutData.payment?.payment_method !== "midtrans" && (
              <div className="flex justify-between items-center gap-2">
                <button
                  onClick={() => onPaymentStatusChange("paid")}
                  className="w-full md:w-1/2 text-sm whitespace-nowrap bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  disabled={
                    isUpdating || currentPaymentStatus === "settlement"
                  }>
                  {isUpdating ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">
                      check_circle
                    </span>
                  )}
                  Konfirmasi Pembayaran
                </button>

                {currentOrderStatus !== "cancelled" && (
                  <button
                    onClick={() => onPaymentStatusChange("cancelled")}
                    className="w-full md:w-1/2 text-sm whitespace-nowrap bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    disabled={isUpdating}>
                    {isUpdating ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <span className="material-symbols-outlined text-sm">
                        cancel
                      </span>
                    )}
                    Batalkan Pesanan
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);
Receipt.displayName = "Receipt";

// ConfirmationModal Component
const ConfirmationModal = React.memo(
  ({ isOpen, onClose, onConfirm, action }) => {
    const [transactionId, setTransactionId] = useState("");

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-base-100 dark:bg-base-200 rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-bold text-base-content mb-4">
            {action === "paid" ? "Konfirmasi Pembayaran" : "Batalkan Pesanan"}
          </h3>
          <p className="text-base-content/60 mb-6">
            Apakah Anda yakin ingin{" "}
            {action === "paid"
              ? "mengkonfirmasi pembayaran untuk"
              : "membatalkan"}{" "}
            pesanan ini?
          </p>
          {action === "paid" && (
            <input
              type="text"
              placeholder="Masukkan ID Transaksi (opsional)"
              className="input input-bordered w-full mb-4"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
          )}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="btn bg-gray-600 text-white hover:bg-gray-700 rounded-lg px-4 py-2">
              Batal
            </button>
            <button
              onClick={() => onConfirm(transactionId)}
              className="btn bg-green-600 text-white hover:bg-green-700 rounded-lg px-4 py-2">
              Konfirmasi
            </button>
          </div>
        </div>
      </div>
    );
  }
);
ConfirmationModal.displayName = "ConfirmationModal";

// PaymentSummaryComponent
const PaymentSummaryComponent = React.memo(({ checkoutData }) => {
  const calculateDetailedBreakdown = () => {
    let subtotalOriginal = 0;
    let totalProductDiscounts = 0;

    checkoutData.products?.forEach((checkoutProduct) => {
      const productPrice = parseFloat(checkoutProduct.price || 0);
      const totalProductPrice = productPrice * checkoutProduct.quantity;
      subtotalOriginal += totalProductPrice;

      const activePromotions = (checkoutProduct.promotions || []).filter(
        (promo) =>
          (promo.status === 1 || promo.status === "1") &&
          promo.discount_percentage > 0 &&
          (!promo.expired || new Date(promo.expired) > new Date())
      );

      const productDiscount = activePromotions.reduce(
        (acc, promo) => acc + parseFloat(promo.discount_percentage),
        0
      );

      if (productDiscount > 0) {
        totalProductDiscounts += (totalProductPrice * productDiscount) / 100;
      }
    });

    const subtotalAfterProductDiscounts =
      subtotalOriginal - totalProductDiscounts;

    const referralPromotion = checkoutData.referral_promotion;
    const referralDiscountAmount = referralPromotion
      ? (subtotalAfterProductDiscounts *
          parseFloat(referralPromotion.discount_percentage)) /
        100
      : 0;

    return {
      subtotalOriginal,
      totalProductDiscounts,
      subtotalAfterProductDiscounts,
      referralDiscountAmount,
      finalTotal: checkoutData.total_price,
    };
  };

  const breakdown = calculateDetailedBreakdown();

  return (
    <div className="bg-base-100 dark:bg-base-200 rounded-xl shadow-sm border border-base-300">
      <div className="bg-gradient-to-r from-warning to-warning px-4 py-3 border-b border-warning rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined w-5 h-5 text-white">
            receipt_long
          </span>
          <h2 className="text-lg font-bold text-white uppercase tracking-wide">
            Ringkasan Pembayaran
          </h2>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-base-content/70">Subtotal Produk</span>
            <span className="text-base-content font-medium">
              {formatRupiah(breakdown.subtotalOriginal)}
            </span>
          </div>

          {breakdown.totalProductDiscounts > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-base-content/70">Diskon Produk</span>
              <span className="text-error font-medium">
                - {formatRupiah(breakdown.totalProductDiscounts)}
              </span>
            </div>
          )}

          {breakdown.totalProductDiscounts > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-base-content/70">
                Subtotal setelah diskon produk
              </span>
              <span className="text-base-content font-medium">
                {formatRupiah(breakdown.subtotalAfterProductDiscounts)}
              </span>
            </div>
          )}

          {breakdown.referralDiscountAmount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-base-content/70">
                Diskon Referral (
                {checkoutData.referral_promotion?.discount_percentage}%)
              </span>
              <span className="text-error font-medium">
                - {formatRupiah(breakdown.referralDiscountAmount)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-base-content/70">Pajak & Biaya Layanan</span>
            <span className="text-base-content font-medium">Termasuk</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-base-content/70">Biaya Pengiriman</span>
            <span className="text-base-content font-medium">Gratis</span>
          </div>

          <div className="border-t border-base-300 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-base-content">Total</span>
              <span className="text-lg font-bold text-primary">
                {formatRupiah(breakdown.finalTotal)}
              </span>
            </div>
          </div>

          {(breakdown.totalProductDiscounts > 0 ||
            breakdown.referralDiscountAmount > 0) && (
            <div className="bg-success/10 p-3 rounded-lg border border-success/20">
              <div className="flex justify-between items-center">
                <span className="text-success font-medium">Total Hemat</span>
                <span className="text-success font-bold">
                  {formatRupiah(
                    breakdown.totalProductDiscounts +
                      breakdown.referralDiscountAmount
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
PaymentSummaryComponent.displayName = "PaymentSummaryComponent";
const ChangePaymentMethodModal = React.memo(
  ({ isOpen, onClose, onConfirm, currentMethod, availableMethods }) => {
    const [selectedMethod, setSelectedMethod] = useState(currentMethod);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      setSelectedMethod(currentMethod);
    }, [currentMethod]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
      setIsLoading(true);
      await onConfirm(selectedMethod);
      setIsLoading(false);
    };

    const getMethodIcon = (method) => {
      const icons = {
        credit_card: "credit_card",
        bank_transfer: "account_balance",
        cash_on_delivery: "payments",
        e_wallet: "account_balance_wallet",
        midtrans: "payment",
      };
      return icons[method] || "payment";
    };

    const getMethodLabel = (method) => {
      const labels = {
        credit_card: "Kartu Kredit",
        bank_transfer: "Transfer Bank",
        cash_on_delivery: "Bayar di Tempat",
        e_wallet: "E-Wallet",
        midtrans: "Payment Gateway (Midtrans)",
      };
      return labels[method] || method;
    };

    const getMethodDescription = (method) => {
      const descriptions = {
        credit_card: "Visa, MasterCard, JCB",
        bank_transfer: "Transfer ke rekening bank",
        cash_on_delivery: "Bayar saat barang tiba",
        e_wallet: "OVO, GoPay, Dana",
        midtrans: "Semua metode pembayaran via Midtrans",
      };
      return descriptions[method] || "";
    };

    // Check if changing to Midtrans will reset payment type
    const willResetPaymentType =
      currentMethod === "midtrans" && selectedMethod === "midtrans";

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-base-100 dark:bg-base-200 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
          <h3 className="text-lg font-bold text-base-content mb-4">
            Ubah Metode Pembayaran
          </h3>

          <div className="mb-4">
            <p className="text-sm text-base-content/60 mb-2">
              Metode pembayaran saat ini:{" "}
              <span className="font-semibold">
                {getMethodLabel(currentMethod)}
              </span>
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {availableMethods.map((method) => (
              <label
                key={method}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedMethod === method
                    ? "border-primary bg-primary/10"
                    : "border-base-300 hover:border-base-content/20"
                }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method}
                  checked={selectedMethod === method}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="radio radio-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base-content/60">
                      {getMethodIcon(method)}
                    </span>
                    <div>
                      <p className="font-semibold text-base-content">
                        {getMethodLabel(method)}
                      </p>
                      <p className="text-sm text-base-content/50">
                        {getMethodDescription(method)}
                      </p>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {selectedMethod === "midtrans" && (
            <div className="alert alert-info mb-4">
              <span className="material-symbols-outlined">info</span>
              <div>
                <span className="text-sm">
                  {currentMethod === "midtrans" ? (
                    <>
                      <strong>Perhatian:</strong> Mengubah ke Midtrans akan
                      membuat token pembayaran baru dan mereset pilihan metode
                      pembayaran sebelumnya. Anda perlu memilih metode
                      pembayaran kembali di halaman Midtrans.
                    </>
                  ) : (
                    <>
                      Dengan memilih Midtrans, Anda akan diarahkan ke halaman
                      pembayaran untuk memilih metode pembayaran spesifik.
                    </>
                  )}
                </span>
              </div>
            </div>
          )}

          {willResetPaymentType && (
            <div className="alert alert-warning mb-4">
              <span className="material-symbols-outlined">warning</span>
              <span className="text-sm">
                Token pembayaran baru akan dibuat. Transaksi sebelumnya akan
                dibatalkan.
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="btn bg-gray-600 text-white hover:bg-gray-700 rounded-lg px-4 py-2"
              disabled={isLoading}>
              Batal
            </button>
            <button
              onClick={handleConfirm}
              className="btn bg-primary text-white hover:bg-primary-focus rounded-lg px-4 py-2 flex items-center gap-2"
              disabled={isLoading}>
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <span className="material-symbols-outlined">check</span>
              )}
              {willResetPaymentType ? "Buat Token Baru" : "Ubah Metode"}
            </button>
          </div>
        </div>
      </div>
    );
  }
);
ChangePaymentMethodModal.displayName = "ChangePaymentMethodModal";
// =====================================================
// MAIN COMPONENT
// =====================================================
const CheckoutPreviewPage = () => {
  const { key } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useSelector((state) => state.auth);

  const { checkoutData, status, error, isOptimistic } = useSelector(
    (state) => state.checkout
  );

  // State Management
  const [isUpdating, setIsUpdating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingTimeLeft, setPollingTimeLeft] = useState(300); // 5 minutes
  const [pollingStopped, setPollingStopped] = useState(false);
  const [lastStatusCheck, setLastStatusCheck] = useState(null);
  const [isSnapLoaded, setIsSnapLoaded] = useState(false);
  const [isChangePaymentModalOpen, setIsChangePaymentModalOpen] =
    useState(false);
  const [availablePaymentMethods] = useState([
    "credit_card",
    "bank_transfer",
    "cash_on_delivery",
    "e_wallet",
    "midtrans",
  ]);

  // Refs
  const maxScriptLoadAttempts = 3;
  const scriptLoadedRef = useRef(false);
  const scriptElementRef = useRef(null);

  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================

  // Date formatter
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "Tidak tersedia";
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Invalid Date"
      : date.toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  }, []);

  // Format polling time
  const formatTimeLeft = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const effectiveCheckoutData = useMemo(() => {
    return checkoutData || location.state?.dataProps || null;
  }, [checkoutData, location.state?.dataProps]);

  // Calculate product totals
  const calculateProductTotals = useCallback(() => {
    let subtotalBeforeDiscounts = 0;
    let totalProductDiscounts = 0;

    effectiveCheckoutData?.products?.forEach((checkoutProduct) => {
      const productPrice = parseFloat(checkoutProduct.price || 0);
      const totalProductPrice = productPrice * checkoutProduct.quantity;
      subtotalBeforeDiscounts += totalProductPrice;

      const activePromotions = (checkoutProduct.promotions || []).filter(
        (promo) =>
          (promo.status === 1 || promo.status === "1") &&
          promo.discount_percentage > 0 &&
          (!promo.expired || new Date(promo.expired) > new Date())
      );

      const productDiscount = activePromotions.reduce(
        (acc, promo) => acc + parseFloat(promo.discount_percentage),
        0
      );

      if (productDiscount > 0) {
        totalProductDiscounts += (totalProductPrice * productDiscount) / 100;
      }
    });

    return { subtotalBeforeDiscounts, totalProductDiscounts };
  }, [effectiveCheckoutData]);

  // =====================================================
  // POLLING FUNCTIONS
  // =====================================================
  const formatPaymentType = (type) => {
    const paymentTypeMap = {
      credit_card: "Kartu Kredit",
      bank_transfer: "Transfer Bank",
      echannel: "Mandiri Bill",
      bca_va: "BCA Virtual Account",
      bni_va: "BNI Virtual Account",
      bri_va: "BRI Virtual Account",
      permata_va: "Permata Virtual Account",
      other_va: "Bank Lain Virtual Account",
      gopay: "GoPay",
      shopeepay: "ShopeePay",
      qris: "QRIS",
      cstore: "Convenience Store",
      akulaku: "Akulaku",
      indomaret: "Indomaret",
      alfamart: "Alfamart",
    };

    return paymentTypeMap[type] || type || "Belum dipilih";
  };
  const stopPolling = useCallback(() => {
    setIsPolling(false);
    setPollingStopped(true);
    // toast.info(
    //   "Pemeriksaan status otomatis telah berhenti. Gunakan tombol 'Periksa Status' untuk memeriksa kembali.",
    //   { autoClose: 5000 }
    // );
  }, []);
  const handleStatusChangeNotification = (status, paymentType) => {
    switch (status) {
      case "settlement":
      case "paid":
        toast.success("Pembayaran berhasil dikonfirmasi! ✅", {
          autoClose: 5000,
          position: "top-center",
        });
        break;

      case "expire":
        if (paymentType === null) {
          toast.info(
            "Token pembayaran kedaluwarsa, tapi pesanan masih aktif. Silakan buat token baru.",
            { autoClose: 5000 }
          );
        } else {
          toast.error(
            "Pembayaran kedaluwarsa. Silakan buat token pembayaran baru.",
            { autoClose: 5000 }
          );
        }
        break;

      case "cancelled":
      case "deny":
      case "cancel":
        toast.error("Pembayaran dibatalkan. Silakan coba lagi.", {
          autoClose: 5000,
        });
        break;

      case "challenge":
        toast.warning(
          "Pembayaran sedang dalam peninjauan. Mohon tunggu konfirmasi.",
          { autoClose: 5000 }
        );
        break;
    }
  };
  const checkPaymentStatus = useCallback(async () => {
    if (!token || !key || !effectiveCheckoutData) return;

    setIsUpdating(true);

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}api/checkout/${key}/payment-status`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { data } = response;
      let newPaymentStatus;
      let newCheckoutStatus;
      let paymentType = null;
      let transactionId = null;

      // Handle different response formats
      if (data.source === "midtrans_api") {
        newPaymentStatus = data.transaction_status;
        newCheckoutStatus = data.checkout_status;
        transactionId = data.transaction_id;
        paymentType = data.payment_type;
      } else {
        newPaymentStatus = data.payment_status;
        newCheckoutStatus = data.checkout_status;
        paymentType = data.payment_type;
        transactionId = data.transaction_id;
      }

      setLastStatusCheck(data);

      console.log("Payment status check:", {
        newPaymentStatus,
        newCheckoutStatus,
        paymentType,
        transactionId,
        source: data.source,
      });

      // Determine if we need to update backend
      const hasSignificantChange =
        newPaymentStatus !== effectiveCheckoutData.payment?.payment_status ||
        newCheckoutStatus !== effectiveCheckoutData.status ||
        (paymentType &&
          paymentType !== effectiveCheckoutData.payment?.payment_type);

      // Update Redux state
      dispatch(
        optimisticUpdateCheckout({
          key,
          payment: {
            ...effectiveCheckoutData.payment,
            payment_status: newPaymentStatus,
            transaction_id:
              transactionId || effectiveCheckoutData.payment.transaction_id,
            paid_at: data.transaction_time || data.paid_at,
            payment_type:
              paymentType || effectiveCheckoutData.payment?.payment_type,
          },
          status: newCheckoutStatus,
        })
      );

      // If significant change detected, fetch complete data from backend
      if (hasSignificantChange) {
        console.log("Significant change detected, fetching complete data");
        await dispatch(fetchCheckout(effectiveCheckoutData.key));
      }

      // Stop polling if final status reached
      if (!["pending", "challenge"].includes(newPaymentStatus)) {
        stopPolling();
      }

      // Show appropriate toast messages
      handleStatusChangeNotification(newPaymentStatus, paymentType);
    } catch (err) {
      console.error("Payment status check error:", err);

      const errorMessage =
        err.response?.data?.midtrans_error ||
        err.response?.data?.error ||
        "Gagal memeriksa status pembayaran";

      // Only show error toast after multiple retries
      if (retryCount >= 2) {
        toast.error(
          `${errorMessage}. Silakan coba lagi atau hubungi support.`,
          {
            autoClose: 5000,
          }
        );
      }

      if (retryCount < 3) {
        setRetryCount((prev) => prev + 1);
        // Retry after delay
        setTimeout(() => checkPaymentStatus(), 2000 * (retryCount + 1));
      } else {
        stopPolling();
      }
    } finally {
      setIsUpdating(false);
    }
  }, [token, key, effectiveCheckoutData, dispatch, retryCount, stopPolling]);

  // Helper function to format payment type

  const pollPaymentStatus = useCallback(async () => {
    if (!isPolling || pollingTimeLeft <= 0) {
      stopPolling();
      return;
    }

    await checkPaymentStatus();

    if (isPolling) {
      // Use exponential backoff: start with 3s, then 5s, then 10s
      const pollInterval =
        retryCount === 0 ? 3000 : retryCount === 1 ? 5000 : 10000;

      setTimeout(() => pollPaymentStatus(), pollInterval);
    }
  }, [isPolling, pollingTimeLeft, checkPaymentStatus, stopPolling, retryCount]);

  const startPolling = useCallback(() => {
    setIsPolling(true);
    setPollingStopped(false);
    checkPaymentStatus();
    pollPaymentStatus();
  }, [pollPaymentStatus]);

  const handleManualCheck = () => {
    setPollingStopped(false);
    startPolling();
  };

  const handleChangePaymentMethod = useCallback(
    async (newMethod) => {
      if (!effectiveCheckoutData?.key) {
        toast.error("Data checkout tidak tersedia", { autoClose: 5000 });
        return;
      }

      if (!availablePaymentMethods.includes(newMethod)) {
        toast.error("Metode pembayaran tidak valid", { autoClose: 5000 });
        return;
      }

      setIsUpdating(true);

      try {
        const response = await dispatch(
          changePaymentMethod({
            checkoutKey: effectiveCheckoutData.key,
            paymentMethod: newMethod,
          })
        ).unwrap();

        toast.success("Metode pembayaran berhasil diubah!", {
          autoClose: 3000,
        });

        console.log(`asd => -> ${JSON.stringify(response)}`);

        dispatch(
          optimisticUpdateCheckout({
            key: effectiveCheckoutData.key,
            payment: {
              ...response.payment,
              payment_status: response.payment.payment_status || "pending",
              payment_method: newMethod,
              snap_token: response.payment.snap_token || null,
              redirect_url: response.payment.redirect_url || null,
              payment_type: null, // reset agar Snap munculkan pilihan metode baru
              order_id: response.payment.order_id || null,
              transaction_id: null,
              paid_at: null,
              expired_at: null,
            },
            status: response.status || effectiveCheckoutData.status,
          })
        );

        // ✅ Langsung munculkan Snap
        if (newMethod === "midtrans" && response.payment_gateway?.snap_token) {
          const snapInstance = window.snap || window.Snap;

          if (!snapInstance) {
            toast.error(
              "Midtrans Snap belum dimuat. Silakan refresh halaman.",
              {
                autoClose: 5000,
              }
            );
            return;
          }

          // Flag untuk tracking apakah payment type sudah dipilih
          let paymentTypeSelected = false;
          let statusCheckInterval = null;

          // Fungsi untuk check status secara berkala saat popup terbuka
          const startStatusChecking = () => {
            statusCheckInterval = setInterval(async () => {
              try {
                const statusResponse = await axios.get(
                  `${process.env.REACT_APP_API}api/checkout/${effectiveCheckoutData.key}/payment-status`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      Accept: "application/json",
                    },
                  }
                );

                if (statusResponse.data.payment_type && !paymentTypeSelected) {
                  paymentTypeSelected = true;
                  console.log(
                    "Payment type detected:",
                    statusResponse.data.payment_type
                  );

                  // Update local state dengan payment type
                  dispatch(
                    optimisticUpdateCheckout({
                      key: effectiveCheckoutData.key,
                      payment: {
                        ...effectiveCheckoutData.payment,
                        payment_type: statusResponse.data.payment_type,
                        payment_status:
                          statusResponse.data.transaction_status ||
                          statusResponse.data.payment_status,
                      },
                    })
                  );

                  toast.info(
                    `Metode pembayaran dipilih: ${formatPaymentType(
                      statusResponse.data.payment_type
                    )}`,
                    { autoClose: 3000 }
                  );
                }
              } catch (error) {
                console.log("Status check error:", error);
              }
            }, 3000); // Check every 3 seconds
          };

          const stopStatusChecking = () => {
            if (statusCheckInterval) {
              clearInterval(statusCheckInterval);
              statusCheckInterval = null;
            }
          };

          // Start checking status when popup opens
          startStatusChecking();

          snapInstance.pay(response.payment_gateway.snap_token, {
            onSuccess: async (result) => {
              console.log("Midtrans success:", result);
              stopStatusChecking();
              toast.success("Pembayaran berhasil!", { autoClose: 2000 });

              await checkPaymentStatus();
              startPolling();
            },
            onPending: async (result) => {
              console.log("Midtrans pending:", result);
              stopStatusChecking();

              // Update payment type from result if available
              if (result.payment_type) {
                dispatch(
                  optimisticUpdateCheckout({
                    key: effectiveCheckoutData.key,
                    payment: {
                      ...effectiveCheckoutData.payment,
                      payment_type: result.payment_type,
                    },
                  })
                );
              }

              toast.info("Pembayaran pending. Memeriksa status...", {
                autoClose: 2000,
              });

              await checkPaymentStatus();
              startPolling();
            },
            onError: (result) => {
              console.log("Midtrans error:", result);
              stopStatusChecking();
              toast.error("Pembayaran gagal. Silakan coba lagi.", {
                autoClose: 2000,
              });
              checkPaymentStatus();
            },
            onClose: async () => {
              console.log("Midtrans popup ditutup");
              stopStatusChecking();

              // Final status check when popup closes
              await checkPaymentStatus();

              dispatch(fetchCheckout(effectiveCheckoutData.key));
            },
          });
        }

        setIsChangePaymentModalOpen(false);
      } catch (err) {
        console.error("Failed to change payment method:", err);
        const errorMessage = err.message || "Gagal mengubah metode pembayaran";
        toast.error(errorMessage, { autoClose: 5000 });
      } finally {
        setIsUpdating(false);
      }
    },
    [
      effectiveCheckoutData,
      dispatch,
      availablePaymentMethods,
      token,
      startPolling,
      checkPaymentStatus,
      formatPaymentType,
    ]
  );

  // Retry Midtrans payment

  // Handle regenerate payment for expired transactions
  // Updated handleRegeneratePayment function in CheckoutPreviewPage component

  const handleRegeneratePayment = useCallback(async () => {
    if (!token || !key || !effectiveCheckoutData) return;

    setIsUpdating(true);
    try {
      // Check current status
      if (effectiveCheckoutData.payment?.payment_method === "midtrans") {
        try {
          await axios.get(
            `${process.env.REACT_APP_API}api/checkout/${key}/payment-status`,
            {
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } catch (error) {
          console.log(
            "Failed to check payment status, continuing with regeneration"
          );
        }
      }

      const { subtotalBeforeDiscounts, totalProductDiscounts } =
        calculateProductTotals();
      const subtotalAfterProductDiscounts =
        subtotalBeforeDiscounts - totalProductDiscounts;

      const referralPromotion = effectiveCheckoutData.referral_promotion;
      const referralDiscountAmount = referralPromotion
        ? (subtotalAfterProductDiscounts *
            parseFloat(referralPromotion.discount_percentage)) /
          100
        : 0;

      const totalPrice = subtotalAfterProductDiscounts - referralDiscountAmount;

      const response = await axios.post(
        `${process.env.REACT_APP_API}api/checkout/${key}/regenerate-payment`,
        {
          total_price: totalPrice,
          payment_method: "midtrans",
          referral_code: referralPromotion?.referral_code,
          referral_discount: referralPromotion?.discount_percentage,
          referral_promotion_id: referralPromotion?.id,
        },
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.data || response.data.snap_token) {
        const newSnapToken =
          response.data.data?.snap_token ||
          response.data.snap_token ||
          response.data.data?.payment_gateway?.snap_token;

        if (!newSnapToken) {
          if (
            response.data.message === "Payment is still active" &&
            response.data.data?.snap_token
          ) {
            toast.info("Menggunakan token pembayaran yang masih aktif", {
              autoClose: 3000,
            });
            openMidtransPayment(response.data.data.snap_token);
            return;
          }
          throw new Error(
            "Token pembayaran baru tidak ditemukan dalam respons"
          );
        }

        toast.success("Token pembayaran baru berhasil dibuat!", {
          autoClose: 3000,
        });

        console.log(
          `conatolasdasd asda sa============ ${JSON.stringify(response.data)}`
        );
        console.log(
          `conatolasdasd asda sa============ ${JSON.stringify(
            response.data.data.redirect_url
          )}`
        );

        dispatch(
          optimisticUpdateCheckout({
            key,
            payment: {
              ...effectiveCheckoutData.payment,
              payment_status: "pending",
              snap_token: newSnapToken,
              redirect_url:
                response.data.data?.redirect_url ||
                response.data.data?.payment_gateway?.redirect_url,
              payment_type: null, // Reset payment_type untuk transaksi baru
              order_id: response.data.data?.order_id || response.data.order_id,
              transaction_id: null,
              paid_at: null,
              expired_at: null,
            },
            status: "pending",
          })
        );

        setTimeout(() => {
          openMidtransPayment(newSnapToken);
        }, 1000);
      }
    } catch (err) {
      console.error("Failed to regenerate payment:", err);
      if (
        err.response?.status === 400 &&
        err.response.data.message === "Payment is still active"
      ) {
        toast.info(
          "Pembayaran masih aktif. Silakan lanjutkan pembayaran yang ada.",
          { autoClose: 5000 }
        );
        if (effectiveCheckoutData.payment?.snap_token) {
          setTimeout(() => {
            openMidtransPayment(effectiveCheckoutData.payment.snap_token);
          }, 1000);
        }
        return;
      }
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Gagal membuat token pembayaran baru";
      toast.error(errorMessage, { autoClose: 5000 });
    } finally {
      setIsUpdating(false);
    }
  }, [token, key, effectiveCheckoutData, dispatch, calculateProductTotals]);

  // Helper function to open Midtrans payment
  const handleMidtransCallback = useCallback(
    async (result, callbackType) => {
      console.log(`Midtrans ${callbackType} callback:`, result);

      // Immediately check status after any callback
      await checkPaymentStatus();

      switch (callbackType) {
        case "success":
          toast.success("Pembayaran berhasil! Memverifikasi...", {
            autoClose: 2000,
          });
          startPolling();
          break;

        case "pending":
          toast.info(
            result.payment_type
              ? `Metode pembayaran: ${formatPaymentType(result.payment_type)}`
              : "Pembayaran pending. Memeriksa status...",
            { autoClose: 2000 }
          );
          startPolling();
          break;

        case "error":
          toast.error("Pembayaran gagal. Silakan coba lagi.", {
            autoClose: 3000,
          });
          break;

        case "close":
          // Check if payment was started
          if (effectiveCheckoutData?.payment?.payment_type) {
            toast.info(
              "Jendela pembayaran ditutup. Memeriksa status terakhir...",
              {
                autoClose: 2000,
              }
            );
          }
          // Always check status when popup closes
          await checkPaymentStatus();
          break;
      }
    },
    [checkPaymentStatus, startPolling, effectiveCheckoutData]
  );

  // Update the openMidtransPayment function
  const openMidtransPayment = useCallback(
    (snapToken) => {
      if (window.snap || window.Snap) {
        const snapInstance = window.snap || window.Snap;

        // Before opening Snap, save current state
        sessionStorage.setItem(
          "midtrans_checkout_key",
          effectiveCheckoutData.key
        );
        sessionStorage.setItem("midtrans_payment_started", "true");

        snapInstance.pay(snapToken, {
          onSuccess: (result) => {
            console.log("Payment success:", result);
            sessionStorage.removeItem("midtrans_payment_started");
            handleMidtransCallback(result, "success");
          },
          onPending: (result) => {
            console.log("Payment pending:", result);
            // Untuk metode seperti BCA KlikPay yang redirect,
            // status akan tetap pending sampai user selesai di halaman BCA
            handleMidtransCallback(result, "pending");
          },
          onError: (result) => {
            console.log("Payment error:", result);
            sessionStorage.removeItem("midtrans_payment_started");
            handleMidtransCallback(result, "error");
          },
          onClose: () => {
            console.log("Payment popup closed");
            sessionStorage.removeItem("midtrans_payment_started");
            handleMidtransCallback({}, "close");
          },
        });
      } else {
        toast.error("Midtrans Snap belum dimuat. Silakan refresh halaman.", {
          autoClose: 5000,
        });
      }
    },
    [handleMidtransCallback, effectiveCheckoutData]
  );

  // Optimistic payment status update handler
  // Update the handlePaymentStatusChange function in CheckoutPreviewPage component

  const handlePaymentStatusChange = useCallback(
    async (newStatus, transactionId = null) => {
      if (!effectiveCheckoutData?.id) {
        toast.error("Data checkout tidak tersedia", { autoClose: 5000 });
        return;
      }

      setIsUpdating(true);
      setLastUpdateTime(Date.now());

      // Map the status to match backend expectations
      const statusMap = {
        paid: "settlement",
        cancelled: "cancelled",
        failed: "failed",
        pending: "pending",
      };

      const mappedStatus = statusMap[newStatus] || newStatus;

      // Optimistic update for better UX
      const optimisticData = {
        ...effectiveCheckoutData,
        payment: {
          ...effectiveCheckoutData.payment,
          payment_status: mappedStatus,
          paid_at:
            mappedStatus === "settlement" ? new Date().toISOString() : null,
          transaction_id:
            transactionId || effectiveCheckoutData.payment.transaction_id,
        },
        status:
          mappedStatus === "cancelled" || mappedStatus === "failed"
            ? "cancelled"
            : mappedStatus === "settlement"
            ? "completed"
            : effectiveCheckoutData.status,
        updated_at: new Date().toISOString(),
      };

      dispatch(optimisticUpdateCheckout(optimisticData));

      try {
        // ✅ FIX: Include current payment_method in the request
        await dispatch(
          updatePaymentStatus({
            checkoutId: effectiveCheckoutData.id,
            paymentStatus: newStatus, // Send original status, let backend map it
            paymentMethod: effectiveCheckoutData.payment.payment_method, // Include current payment method
            transactionId,
          })
        ).unwrap();

        dispatch(clearOptimisticState());

        // Fetch updated data from server to ensure consistency
        await dispatch(fetchCheckout(effectiveCheckoutData.key));

        toast.success(
          `Status pembayaran berhasil diubah ke ${
            newStatus === "paid" ? "dibayar" : "dibatalkan"
          }`,
          { autoClose: 5000 }
        );
        setRetryCount(0);
        setIsModalOpen(false);
      } catch (err) {
        console.error("Payment status update failed:", err);
        dispatch(clearOptimisticState());

        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Gagal mengubah status pembayaran";
        toast.error(errorMessage, { autoClose: 5000 });

        if (err.response?.status >= 500 && retryCount < 2) {
          const delay = Math.pow(2, retryCount) * 1000;
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            handlePaymentStatusChange(newStatus, transactionId);
          }, delay);
        } else {
          setIsModalOpen(false);
        }
      } finally {
        setIsUpdating(false);
      }
    },
    [effectiveCheckoutData, dispatch, retryCount]
  );

  // Handle modal confirmation
  const handleConfirmModal = useCallback(
    (transactionId) => {
      handlePaymentStatusChange(modalAction, transactionId || null);
    },
    [modalAction, handlePaymentStatusChange]
  );

  // =====================================================
  // EFFECTS
  // =====================================================

  // Handle location state message and trigger status check
  useEffect(() => {
    if (location.state?.message) {
      const [type, message] = location.state.message.split("|");
      toast[type || "info"](message, { autoClose: 5000 });
      checkPaymentStatus();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.message, navigate, checkPaymentStatus]);

  // Fetch checkout data
  useEffect(() => {
    if (key && (!effectiveCheckoutData || effectiveCheckoutData.key !== key)) {
      console.log("CheckoutPreviewPage: Fetching checkout data for key:", key);
      dispatch(fetchCheckout(key));
    }
  }, [key, dispatch, effectiveCheckoutData]);

  // Polling timer countdown
  useEffect(() => {
    let timer;
    if (isPolling && pollingTimeLeft > 0) {
      timer = setInterval(() => {
        setPollingTimeLeft((prev) => {
          if (prev <= 1) {
            stopPolling();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPolling, pollingTimeLeft, stopPolling]);

  // Load Midtrans Snap.js
  useEffect(() => {
    const cleanup = () => {
      if (
        scriptElementRef.current &&
        document.body.contains(scriptElementRef.current)
      ) {
        document.body.removeChild(scriptElementRef.current);
        scriptElementRef.current = null;
      }
    };

    if (effectiveCheckoutData?.payment?.payment_method !== "midtrans") {
      setIsSnapLoaded(false);
      scriptLoadedRef.current = false;
      cleanup();
      return;
    }

    if (window.snap || window.Snap) {
      console.log("Midtrans Snap.js already loaded", {
        windowSnap: !!window.snap,
        windowSnapCapital: !!window.Snap,
      });
      setIsSnapLoaded(true);
      scriptLoadedRef.current = true;
      return;
    }

    const clientKey = process.env.REACT_APP_MIDTRANS_CLIENT_KEY;
    if (!clientKey) {
      console.error("Midtrans client key is missing");
      toast.error(
        "Kunci klien Midtrans tidak ditemukan. Silakan hubungi support.",
        { autoClose: 5000 }
      );
      setIsSnapLoaded(false);
      return;
    }

    console.log("Loading Midtrans Snap.js", {
      clientKey,
      snapUrl: process.env.REACT_APP_MIDTRANS_SNAP_URL,
      environment: process.env.REACT_APP_MIDTRANS_ENV,
    });

    const loadScript = (attempt = 1) => {
      if (attempt > maxScriptLoadAttempts) {
        console.error(
          `Failed to load Midtrans Snap.js after ${maxScriptLoadAttempts} attempts`
        );
        toast.error(
          "Gagal memuat skrip pembayaran Midtrans. Periksa koneksi internet atau hubungi support.",
          { autoClose: 5000 }
        );
        setIsSnapLoaded(false);
        return;
      }

      cleanup();

      const script = document.createElement("script");
      const snapUrl =
        process.env.REACT_APP_MIDTRANS_SNAP_URL ||
        (process.env.REACT_APP_MIDTRANS_ENV === "production"
          ? "https://app.midtrans.com/snap/snap.js"
          : "https://app.sandbox.midtrans.com/snap/snap.js");

      script.src = snapUrl;
      script.setAttribute("data-client-key", clientKey);
      script.async = true;
      script.id = "midtrans-snap-script";

      scriptElementRef.current = script;

      const checkSnapLoaded = () => {
        if (window.snap || window.Snap) {
          console.log(
            `Midtrans Snap.js loaded successfully on attempt ${attempt}`,
            {
              snapUrl,
              clientKey,
              hasSnap: !!window.snap,
              hasSnapCapital: !!window.Snap,
            }
          );

          if (!window.snap && window.Snap) {
            window.snap = window.Snap;
          } else if (window.snap && !window.Snap) {
            window.Snap = window.snap;
          }

          setIsSnapLoaded(true);
          scriptLoadedRef.current = true;
          return true;
        }
        return false;
      };

      script.onload = () => {
        console.log(`Script onload fired for attempt ${attempt}`);

        let checkCount = 0;
        const maxChecks = 10;

        const intervalId = setInterval(() => {
          checkCount++;

          if (checkSnapLoaded()) {
            clearInterval(intervalId);
            return;
          }

          if (checkCount >= maxChecks) {
            clearInterval(intervalId);
            console.error(
              `Midtrans Snap.js loaded but window.snap/Snap is undefined after ${maxChecks} checks on attempt ${attempt}`
            );

            setTimeout(() => loadScript(attempt + 1), 2000 * attempt);
          }
        }, 200);
      };

      script.onerror = (error) => {
        console.error(`Failed to load Midtrans Snap.js on attempt ${attempt}`, {
          snapUrl,
          clientKey,
          error,
        });
        toast.error(
          `Gagal memuat skrip Midtrans (percobaan ${attempt}/${maxScriptLoadAttempts}). Mencoba lagi...`,
          { autoClose: 3000 }
        );
        setTimeout(() => loadScript(attempt + 1), 2000 * attempt);
      };

      document.body.appendChild(script);
    };

    loadScript();

    return () => {
      cleanup();
      setIsSnapLoaded(false);
      scriptLoadedRef.current = false;
    };
  }, [effectiveCheckoutData?.payment?.payment_method]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "Escape":
            navigate(-1);
            break;
          case "p":
            if (
              effectiveCheckoutData?.payment?.payment_status !== "settlement" &&
              effectiveCheckoutData?.payment?.payment_status !== "paid"
            ) {
              e.preventDefault();
              setModalAction("paid");
              setIsModalOpen(true);
            }
            break;
          case "c":
            if (effectiveCheckoutData?.status !== "cancelled") {
              e.preventDefault();
              setModalAction("cancelled");
              setIsModalOpen(true);
            }
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, effectiveCheckoutData]);

  // =====================================================
  // RENDER COMPONENTS
  // =====================================================

  // Loading component
  const LoadingComponent = useMemo(
    () => (
      <div className="min-h-screen bg-base-200/10 flex items-center justify-center">
        <div className="text-center">
          <CircularLoader />
          <p className="mt-4 text-lg text-base-content/60">
            Memuat detail checkout...
          </p>
          {retryCount > 0 && (
            <p className="mt-2 text-sm text-base-content/40">
              Mencoba lagi... ({retryCount}/3)
            </p>
          )}
        </div>
      </div>
    ),
    [retryCount]
  );

  // Error component
  const ErrorComponent = useMemo(
    () => (
      <div className="min-h-screen bg-base-200/10 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-red-500 text-4xl">
              error
            </span>
          </div>
          <h2 className="text-2xl font-bold text-base-content mb-4">
            Gagal Memuat Data
          </h2>
          <p className="text-base-content/60 mb-6">
            {error?.message || "Tidak dapat mengambil data checkout"}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => dispatch(fetchCheckout(key))}
              className="btn bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-6 py-2 flex items-center gap-2">
              <span className="material-symbols-outlined">refresh</span>
              Coba Lagi
            </button>
            <button
              onClick={() => navigate("/checkout")}
              className="btn bg-gray-600 text-white hover:bg-gray-700 rounded-lg px-6 py-2 flex items-center gap-2">
              <span className="material-symbols-outlined">arrow_back</span>
              Kembali
            </button>
          </div>
        </div>
      </div>
    ),
    [error, dispatch, key, navigate]
  );

  // Conditional rendering
  if (status === "loading" && !effectiveCheckoutData) {
    return LoadingComponent;
  }

  if (status === "failed" && !effectiveCheckoutData) {
    return ErrorComponent;
  }

  if (!effectiveCheckoutData) {
    return (
      <div className="min-h-screen bg-base-200/10 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-base-300/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-base-content/40 text-4xl">
              info
            </span>
          </div>
          <h2 className="text-2xl font-bold text-base-content mb-4">
            Data Tidak Ditemukan
          </h2>
          <p className="text-base-content/60 mb-6">
            Tidak ada data checkout yang tersedia
          </p>
          <button
            onClick={() => navigate("/checkout")}
            className="btn btn-link outline-none rounded-lg px-4 py-2 flex-1 text-base-content/60 hover:text-base-content">
            <span className="material-symbols-outlined">arrow_back</span>
            Kembali ke Checkout
          </button>
        </div>
      </div>
    );
  }

  const currentPaymentStatus =
    effectiveCheckoutData.payment?.payment_status?.status ||
    effectiveCheckoutData.payment?.payment_status ||
    "unpaid";
  const currentOrderStatus = effectiveCheckoutData.status || "pending";

  // =====================================================
  // MAIN RENDER
  // =====================================================
  return (
    <div className="min-h-screen bg-base-200/10">
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmModal}
        action={modalAction}
      />
      <ChangePaymentMethodModal
        isOpen={isChangePaymentModalOpen}
        onClose={() => setIsChangePaymentModalOpen(false)}
        onConfirm={handleChangePaymentMethod}
        currentMethod={effectiveCheckoutData?.payment?.payment_method}
        availableMethods={availablePaymentMethods}
      />
      {/* Polling Indicator */}
      {isPolling && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <span className="loading loading-spinner loading-sm text-blue-600"></span>
            <span className="font-medium">
              Memeriksa status pembayaran... (Waktu tersisa:{" "}
              {formatTimeLeft(pollingTimeLeft)})
            </span>
            <button
              onClick={stopPolling}
              className="ml-2 text-blue-600 hover:text-blue-800">
              Hentikan
            </button>
          </div>
        </div>
      )}

      {/* Manual Check Button */}
      {pollingStopped && currentPaymentStatus === "pending" && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <span className="font-medium">
              Pemeriksaan otomatis telah berhenti.
            </span>
            <button
              onClick={handleManualCheck}
              className="ml-2 text-blue-600 hover:text-blue-800">
              Periksa Status
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-base-100 dark:bg-base-200 shadow-sm border-b border-base-300">
        <div className="max-w-full mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="btn bg-base-200/80 outline-none border-none hover:bg-base-200 btn-circle">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div>
                <h1 className="text-xl font-bold text-base-content">
                  Detail Pesanan
                  {isOptimistic && (
                    <span className="ml-2 text-sm text-orange-600 font-normal">
                      (Memperbarui...)
                    </span>
                  )}
                </h1>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-base-content/50">
                    #{effectiveCheckoutData.key}
                  </p>
                  <StatusBadge status={currentPaymentStatus} type="payment" />
                  <StatusBadge status={currentOrderStatus} type="order" />
                </div>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="hidden md:flex justify-center">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <span className="font-semibold text-blue-600">Checkout</span>
                </div>
                <span className="material-symbols-outlined text-blue-500">
                  arrow_forward
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold ${
                      currentPaymentStatus === "paid" ||
                      currentPaymentStatus === "settlement"
                        ? "bg-green-500"
                        : "bg-orange-500"
                    }`}>
                    2
                  </div>
                  <span
                    className={`font-semibold ${
                      currentPaymentStatus === "paid" ||
                      currentPaymentStatus === "settlement"
                        ? "text-green-600"
                        : "text-orange-600"
                    }`}>
                    Payment
                  </span>
                </div>
                <span
                  className={`material-symbols-outlined ${
                    currentPaymentStatus === "paid" ||
                    currentPaymentStatus === "settlement"
                      ? "text-green-500"
                      : "text-orange-500"
                  }`}>
                  arrow_forward
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full text-base-content flex items-center justify-center text-xs font-bold ${
                      currentOrderStatus === "completed"
                        ? "bg-green-500"
                        : "bg-base-300"
                    }`}>
                    3
                  </div>
                  <span
                    className={`font-medium ${
                      currentOrderStatus === "completed"
                        ? "text-green-600"
                        : "text-base-content"
                    }`}>
                    Complete
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                inventory_2
              </span>
              <span className="text-sm font-medium">
                {effectiveCheckoutData.products?.length || 0} produk
              </span>
              {lastUpdateTime && (
                <span className="text-xs text-base-content/40">
                  Updated: {new Date(lastUpdateTime).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-full mx-auto py-8 ">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information */}
            <div className="bg-base-100 dark:bg-base-200 rounded-xl shadow-sm border border-base-300">
              <div className="bg-gradient-to-r from-warning to-warning px-4 py-3 border-b border-warning rounded-t-xl">
                <div className="flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-bold text-white uppercase tracking-wide">
                    Detail Pesanan
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-base-content mb-3">
                      Metode Pembayaran
                    </h3>
                    <PaymentMethodInfo
                      paymentMethod={
                        effectiveCheckoutData.payment?.payment_method
                      }
                      paymentType={effectiveCheckoutData.payment?.payment_type}
                    />
                    {effectiveCheckoutData.payment?.payment_method ===
                      "midtrans" &&
                      effectiveCheckoutData.payment?.payment_gateway
                        ?.snap_token && (
                        <div className="mt-2">
                          <p className="text-sm text-base-content/60">
                            Snap Token:{" "}
                            {
                              effectiveCheckoutData.payment.payment_gateway
                                .snap_token
                            }
                          </p>
                        </div>
                      )}
                    {effectiveCheckoutData.payment?.payment_method ===
                      "midtrans" &&
                      effectiveCheckoutData.payment?.payment_status ===
                        "expire" &&
                      !effectiveCheckoutData.payment?.payment_type && (
                        <div className="mt-2 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
                          <p className="text-sm">
                            Metode pembayaran belum dipilih untuk transaksi ini.
                            Silakan buat token pembayaran baru untuk
                            melanjutkan.
                          </p>
                        </div>
                      )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base-content mb-3">
                      Informasi Waktu
                    </h3>
                    <div className="space-y-2 text-sm text-base-content/60">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">
                          schedule
                        </span>
                        <span>
                          Dibuat: {formatDate(effectiveCheckoutData.created_at)}
                        </span>
                      </div>
                      {effectiveCheckoutData.updated_at && (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">
                            update
                          </span>
                          <span>
                            Diperbarui:{" "}
                            {formatDate(effectiveCheckoutData.updated_at)}
                          </span>
                        </div>
                      )}
                      {effectiveCheckoutData.payment?.paid_at && (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">
                            payments
                          </span>
                          <span>
                            Dibayar:{" "}
                            {formatDate(effectiveCheckoutData.payment.paid_at)}
                          </span>
                        </div>
                      )}
                      {lastStatusCheck?.transaction_id && (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">
                            receipt
                          </span>
                          <span>
                            ID Transaksi: {lastStatusCheck.transaction_id}
                          </span>
                        </div>
                      )}
                      {lastStatusCheck?.source === "midtrans_api" &&
                        lastStatusCheck?.payment_type && (
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">
                              info
                            </span>
                            <span>
                              Tipe Pembayaran: {lastStatusCheck.payment_type}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="bg-base-100 dark:bg-base-200 rounded-xl shadow-sm border border-base-300">
              <div className="bg-gradient-to-r from-warning to-warning px-4 py-3 border-b border-warning rounded-t-xl">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-bold text-white uppercase tracking-wide">
                    Produk Pesanan (
                    {effectiveCheckoutData.products?.length || 0})
                  </h2>
                </div>
              </div>
              <div className="p-6">
                {effectiveCheckoutData.products &&
                effectiveCheckoutData.products.length > 0 ? (
                  <div className="space-y-4">
                    {effectiveCheckoutData.products.map(
                      (checkoutProduct, index) => (
                        <ProductItem
                          key={checkoutProduct.id || index}
                          checkoutProduct={checkoutProduct}
                        />
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-base-300/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="material-symbols-outlined text-base-content/40 text-2xl">
                        inventory_2
                      </span>
                    </div>
                    <p className="text-base-content/60">
                      Tidak ada produk ditemukan
                    </p>
                  </div>
                )}
              </div>
            </div>

            {(effectiveCheckoutData.products?.some(
              (p) => p.promotions?.length > 0
            ) ||
              effectiveCheckoutData.referral_promotion) && (
              <div className="bg-base-100 dark:bg-base-200 rounded-xl shadow-sm border border-base-300">
                <div className="bg-gradient-to-r from-success to-success px-4 py-3 border-b border-success rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined w-5 h-5 text-white">
                      local_offer
                    </span>
                    <h2 className="text-lg font-bold text-white uppercase tracking-wide">
                      Promosi & Diskon
                    </h2>
                  </div>
                </div>
                <div className="p-6">
                  {effectiveCheckoutData.products?.some(
                    (p) => p.promotions?.length > 0
                  ) && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-base-content mb-3">
                        Diskon Produk
                      </h3>
                      <div className="space-y-3">
                        {effectiveCheckoutData.products?.map(
                          (checkoutProduct) => {
                            const activePromotions = (
                              checkoutProduct.promotions || []
                            ).filter(
                              (promo) =>
                                (promo.status === 1 || promo.status === "1") &&
                                promo.discount_percentage > 0 &&
                                (!promo.expired ||
                                  new Date(promo.expired) > new Date())
                            );

                            if (activePromotions.length === 0) return null;

                            return (
                              <div
                                key={checkoutProduct.id}
                                className="bg-success/5 p-4 rounded-lg border border-success/20">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-8 h-8 bg-base-300/10 rounded flex items-center justify-center">
                                    {checkoutProduct.product?.images?.[0] ? (
                                      <img
                                        src={`${process.env.REACT_APP_API}${checkoutProduct.product.images[0].image_data}`}
                                        alt={checkoutProduct.product.name}
                                        className="w-full h-full rounded object-cover"
                                      />
                                    ) : (
                                      <span className="material-symbols-outlined text-base-content/40 text-sm">
                                        image
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-base-content">
                                      {checkoutProduct.product?.name}
                                    </p>
                                    <p className="text-sm text-base-content/50">
                                      {checkoutProduct.quantity} x{" "}
                                      {formatRupiah(checkoutProduct.price)}
                                    </p>
                                  </div>
                                </div>
                                {activePromotions.map((promo) => (
                                  <div
                                    key={promo.id}
                                    className="flex justify-between text-sm mt-2">
                                    <span className="text-base-content/60">
                                      {promo.title.replace(
                                        ` (Product ID: ${checkoutProduct.product_id})`,
                                        ""
                                      )}{" "}
                                      ({promo.discount_percentage}%)
                                    </span>
                                    <span className="text-error">
                                      -{" "}
                                      {formatRupiah(
                                        (promo.discount_percentage *
                                          checkoutProduct.price *
                                          checkoutProduct.quantity) /
                                          100
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}

                  {effectiveCheckoutData.referral_promotion && (
                    <div>
                      <h3 className="font-semibold text-base-content mb-3">
                        Diskon Referral
                      </h3>
                      <div className="bg-success/5 p-4 rounded-lg border border-success/20">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-base-content font-semibold">
                              {effectiveCheckoutData.referral_promotion.title}
                            </p>
                            <p className="text-sm text-base-content/60">
                              Diskon{" "}
                              {
                                effectiveCheckoutData.referral_promotion
                                  .discount_percentage
                              }
                              % dari subtotal
                            </p>
                          </div>
                          <span className="text-error font-semibold">
                            -{" "}
                            {formatRupiah(
                              (calculateProductTotals()
                                .subtotalAfterProductDiscounts *
                                effectiveCheckoutData.referral_promotion
                                  .discount_percentage) /
                                100
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {effectiveCheckoutData.payment?.payment_method ===
              "bank_transfer" && (
              <div className="max-w-7xl mt-4">
                <div className="alert alert-info mb-4">
                  <span className="material-symbols-outlined">info</span>
                  <div>
                    <span className="text-sm">
                      <strong>Perhatian:</strong> Metode pembayaran menggunakan
                      Bank Transfer memerlukan (foto) bukti pembayaran sebelum
                      dikonfirmasi oleh Admin.
                    </span>
                  </div>
                </div>
                <BankItemSelect checkoutData={effectiveCheckoutData} />
              </div>
            )}
          </div>

          {/* Right Column - Payment Summary and Receipt */}
          <div className="lg:col-span-1 space-y-6">
            <PaymentSummaryComponent checkoutData={effectiveCheckoutData} />
            <Receipt
              setIsChangePaymentModalOpen={setIsChangePaymentModalOpen}
              availablePaymentMethods={availablePaymentMethods}
              effectiveCheckoutData={effectiveCheckoutData}
              isChangePaymentModalOpen={isChangePaymentModalOpen}
              checkoutData={effectiveCheckoutData}
              onPaymentStatusChange={(status) => {
                setModalAction(status);
                setIsModalOpen(true);
              }}
              isUpdating={isUpdating}
              isSnapLoaded={isSnapLoaded}
              calculateProductTotals={calculateProductTotals}
              onRegeneratePayment={handleRegeneratePayment}
              onChangePaymentMethod={() => setIsChangePaymentModalOpen(true)}
              handleChangePaymentMethod={handleChangePaymentMethod} // Add this
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPreviewPage;
