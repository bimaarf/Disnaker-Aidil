import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createCheckout,
  resetCheckoutState,
  fetchCheckout,
  optimisticUpdateCheckout,
} from "../../../../features/product/checkoutSlice";
import { formatRupiah } from "../../../../utils/rupiahInput";
import { Landmark, ShoppingBag } from "lucide-react";
import axios from "axios";

const CartItems = ({
  navigate,
  cart,
  handleQuantityChange,
  handleRemoveItem,
  isUpdating,
  isRemoving,
}) => {
  if (!cart.items.length) {
    return (
      <div className="bg-base-100 dark:bg-base-200 rounded-xl shadow-sm border border-base-300 p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-semibold text-base-content mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">
            shopping_cart
          </span>
          Keranjang Anda
        </h2>
        <div className="text-center py-10">
          <div className="w-16 h-16 bg-base-300/10 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="material-symbols-outlined text-base-content/40 text-3xl">
              garden_cart
            </span>
          </div>
          <p className="text-base-content/60 mb-2">Keranjang Anda kosong</p>
          <p className="text-sm text-base-content/50 mb-6">
            Silakan tambahkan produk ke keranjang
          </p>
          <button
            type="button"
            onClick={() => navigate("/product")}
            className="btn bg-blue-600 text-base-content hover:bg-blue-700 rounded-lg px-6 py-2 flex items-center gap-2 mx-auto"
            aria-label="Browse available products">
            <span className="material-symbols-outlined">storefront</span>
            Jelajahi Produk
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-base-100 dark:bg-base-200 rounded-xl shadow-sm border border-base-300">
      <div className="bg-gradient-to-r from-warning rounded-t-lg shadow-lg to-warning px-4 py-3 border-b border-warning">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-white" />
          <h2 className="text-lg font-bold text-white uppercase tracking-wide">
            Keranjang Anda
          </h2>
        </div>
      </div>
      <div className="p-4 md:p-6">
        {cart.items.map((item) => {
          const productPrice = parseFloat(item.product?.price || 0);
          const totalProductPrice = productPrice * item.quantity;
          const activePromotions =
            item.product?.promotions?.filter(
              (promo) =>
                (promo.status === 1 || promo.status === "1") &&
                promo.discount_percentage > 0 &&
                (!promo.expired || new Date(promo.expired) > new Date())
            ) || [];
          const totalDiscount = activePromotions.reduce(
            (acc, promo) => acc + parseFloat(promo.discount_percentage),
            0
          );
          const discountAmount = totalDiscount
            ? (totalProductPrice * totalDiscount) / 100
            : 0;
          const discountedPrice = totalProductPrice - discountAmount;

          return (
            <div
              key={item.id}
              className="border-b border-base-300 py-4 last:border-b-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-base-300/10 rounded-lg overflow-hidden border border-base-300">
                    <img
                      src={`${process.env.REACT_APP_API}${
                        item.product.images.find(
                          (img) =>
                            img.is_primary === 1 || img.is_primary === "1"
                        )?.image_data || item.product.images[0]?.image_data
                      }`}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-base-content">
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-base-content/60">
                      {item.product.categories?.[0]?.name || "Tanpa Kategori"}
                    </p>
                    {activePromotions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {activePromotions.map((promo) => (
                          <span
                            key={promo.id}
                            className="badge bg-error/10 text-error text-xs">
                            {promo.discount_percentage}% - {promo.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleQuantityChange(item.id, item.quantity - 1)
                      }
                      className="btn btn-outline btn-circle outline-none border-base-300 text-base-content hover:brightness-95 duration-100"
                      disabled={item.quantity <= 1 || isUpdating}>
                      <span className="material-symbols-outlined">remove</span>
                    </button>
                    <div className="bg-base-100 dark:bg-base-200 px-4 py-2 rounded-lg border border-base-300">
                      <span className="text-lg font-semibold">
                        {item.quantity}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleQuantityChange(item.id, item.quantity + 1)
                      }
                      className="btn btn-primary btn-circle outline-none border-primary bg-primary text-white hover:brightness-95 duration-100"
                      disabled={isUpdating}>
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-base-content/60">Subtotal</p>
                    {totalDiscount > 0 ? (
                      <>
                        <span className="text-base-content/50 text-sm line-through">
                          {formatRupiah(totalProductPrice)}
                        </span>
                        <p className="text-lg font-semibold text-primary">
                          {formatRupiah(discountedPrice)}
                        </p>
                      </>
                    ) : (
                      <p className="text-lg font-semibold text-primary">
                        {formatRupiah(totalProductPrice)}
                      </p>
                    )}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="btn btn-outline btn-sm mt-2"
                      disabled={isRemoving}>
                      <span className="material-symbols-outlined">delete</span>
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PaymentMethodSelection = ({
  paymentMethod,
  setPaymentMethod,
  referralCode,
  setReferralCode,
  checkPromoCode,
  isCheckingPromo,
  validReferralCode,
  referralCodeDiscount,
  setReferralCodeDiscount,
  setValidReferralCode,
}) => (
  <div className="bg-base-100 dark:bg-base-200 rounded-xl shadow-sm border border-base-300 p-6 md:p-8">
    <div className="bg-gradient-to-r from-warning rounded-t-lg shadow-lg to-warning px-4 py-3 border-b border-warning">
      <div className="flex items-center gap-2">
        <Landmark className="w-5 h-5 text-white" />
        <h2 className="text-lg font-bold text-white uppercase tracking-wide">
          Metode Pembayaran
        </h2>
      </div>
    </div>
    <div className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3">
      {[
        {
          value: "bank_transfer",
          label: "Transfer Bank",
          icon: "account_balance",
          description: "Transfer ke rekening bank (Memerlukan bukti transfer)",
          color: "purple",
        },
        {
          value: "cash_on_delivery",
          label: "Bayar di Tempat",
          icon: "payments",
          description: "Bayar saat sesi pertemuan pertama",
          color: "green",
        },
        {
          value: "midtrans",
          label: "Payment Gateway",
          icon: "payment",
          description: "Semua metode pembayaran via Midtrans (otomatis)",
          color: "orange",
        },
      ].map((method) => (
        <label
          key={method.value}
          className={`cursor-pointer block p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-sm ${
            paymentMethod === method.value
              ? "border-blue-500 bg-base-200/50 dark:bg-base-300/50"
              : "border-base-300 hover:border-blue-300"
          }`}>
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="paymentMethod"
              value={method.value}
              checked={paymentMethod === method.value}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="radio radio-primary mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`material-symbols-outlined text-${method.color}-600`}>
                  {method.icon}
                </span>
                <span className="font-semibold text-base-content">
                  {method.label}
                </span>
              </div>
              <p className="text-sm text-base-content/50">
                {method.description}
              </p>
            </div>
          </div>
        </label>
      ))}
    </div>
    <div className="mt-6">
      <label className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">
          confirmation_number
        </span>
        <span className="font-semibold text-base-content">Promo Voucher</span>
      </label>
      {validReferralCode && referralCodeDiscount > 0 ? (
        <div className="bg-primary/5 p-5 rounded-xl border-2 border-dashed border-primary/50 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">
                  confirmation_number
                </span>
              </div>
              <div>
                <p className="font-semibold text-base-content mb-1">
                  {validReferralCode.title}
                </p>
                <p className="text-sm text-base-content">
                  Kode:{" "}
                  <span className="font-mono font-medium px-2 py-1 rounded-md">
                    {validReferralCode.referral_code}
                  </span>{" "}
                  • Diskon{" "}
                  <span
                    className={
                      referralCodeDiscount > 0
                        ? "text-primary"
                        : "text-base-content/60"
                    }>
                    ({referralCodeDiscount}% pada total checkout)
                  </span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setReferralCode("");
                setReferralCodeDiscount(0);
                setValidReferralCode(null);
              }}
              className="w-9 h-9 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center transition-all duration-200 group">
              <span className="material-symbols-outlined text-blue-600 group-hover:text-blue-700">
                close
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="Masukkan kode referral (jika ada)"
              className="w-full px-4 py-3 border border-base-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-base-100"
            />
          </div>
          <button
            type="button"
            onClick={() => checkPromoCode(referralCode)}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-base-300 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl whitespace-nowrap"
            disabled={!referralCode || isCheckingPromo}>
            {isCheckingPromo ? (
              <div className="w-5 h-5 border-2 border-base-300 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span className="material-symbols-outlined">check_circle</span>
            )}
            Cek Kode
          </button>
        </div>
      )}
    </div>
  </div>
);

const OrderSummary = ({
  cart,
  formatRupiah,
  referralCodeDiscount,
  validReferralCode,
}) => {
  const calculateTotalPrice = () => {
    const totalProductDiscounted = cart.items.reduce((total, item) => {
      const productPrice = parseFloat(item.product?.price || 0);
      const totalProductPrice = productPrice * item.quantity;
      const activePromotions =
        item.product?.promotions?.filter(
          (promo) =>
            (promo.status === 1 || promo.status === "1") &&
            promo.discount_percentage > 0 &&
            (!promo.expired || new Date(promo.expired) > new Date())
        ) || [];
      const totalProductDiscount = activePromotions.reduce(
        (acc, promo) => acc + parseFloat(promo.discount_percentage),
        0
      );
      const productDiscountAmount = totalProductDiscount
        ? (totalProductPrice * totalProductDiscount) / 100
        : 0;
      return total + (totalProductPrice - productDiscountAmount);
    }, 0);
    const referralDiscountAmount = referralCodeDiscount
      ? (totalProductDiscounted * referralCodeDiscount) / 100
      : 0;
    return Math.max(0, totalProductDiscounted - referralDiscountAmount);
  };

  if (!cart.items.length) {
    return (
      <div className="bg-base-100 dark:bg-base-200 rounded-xl shadow-sm border border-base-300 p-6 max-w-xs mx-auto">
        <h2 className="text-xl font-semibold text-base-content mb-6 flex items-center justify-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">
            receipt_long
          </span>
          Ringkasan Pesanan
        </h2>
        <div className="text-center py-10">
          <div className="w-16 h-16 bg-base-300/10 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="material-symbols-outlined text-base-content/40 text-3xl">
              shopping_cart
            </span>
          </div>
          <p className="text-base-content/60 mb-2">
            Tidak ada produk yang dipilih
          </p>
          <p className="text-sm text-base-content/50">
            Silakan pilih produk untuk melihat ringkasan pesanan
          </p>
        </div>
      </div>
    );
  }

  const totalProductDiscounted = cart.items.reduce((total, item) => {
    const productPrice = parseFloat(item.product?.price || 0);
    const totalProductPrice = productPrice * item.quantity;
    const activePromotions =
      item.product?.promotions?.filter(
        (promo) =>
          (promo.status === 1 || promo.status === "1") &&
          promo.discount_percentage > 0 &&
          (!promo.expired || new Date(promo.expired) > new Date())
      ) || [];
    const totalProductDiscount = activePromotions.reduce(
      (acc, promo) => acc + parseFloat(promo.discount_percentage),
      0
    );
    const productDiscountAmount = totalProductDiscount
      ? (totalProductPrice * totalProductDiscount) / 100
      : 0;
    return total + (totalProductPrice - productDiscountAmount);
  }, 0);
  const referralDiscountAmount = referralCodeDiscount
    ? (totalProductDiscounted * referralCodeDiscount) / 100
    : 0;

  return (
    <div className="bg-base-100 dark:bg-base-200 rounded-lg max-w-full mx-auto border-4 border-dashed border-base-300 p-4">
      <h2 className="text-lg font-bold text-base-content text-center mb-2">
        Ringkasan Pesanan
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
          {cart.items.map((item) => {
            const productPrice = parseFloat(item.product?.price || 0);
            const totalProductPrice = productPrice * item.quantity;
            const activePromotions =
              item.product?.promotions?.filter(
                (promo) =>
                  (promo.status === 1 || promo.status === "1") &&
                  promo.discount_percentage > 0 &&
                  (!promo.expired || new Date(promo.expired) > new Date())
              ) || [];
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
                key={item.id}
                className="border-b"
                style={{ borderColor: "#eee" }}>
                <td className="py-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-base-300/10 rounded flex items-center justify-center">
                      <img
                        src={`${process.env.REACT_APP_API}${
                          item.product.images.find(
                            (img) =>
                              img.is_primary === 1 || img.is_primary === "1"
                          )?.image_data || item.product.images[0]?.image_data
                        }`}
                        alt={item.product.name}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                    <div>
                      <p className="font-semibold">{item.product.name}</p>
                      <p className="text-xs text-base-content/50">
                        {item.product.categories?.[0]?.name || "Tanpa Kategori"}
                      </p>
                      {activePromotions.length > 0 && (
                        <div className="mt-1">
                          {activePromotions.map((promo) => (
                            <p key={promo.id} className="text-xs text-error">
                              Diskon {promo.title} ({promo.discount_percentage}
                              %): -
                              {formatRupiah(
                                (totalProductPrice *
                                  promo.discount_percentage) /
                                  100
                              )}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="text-center py-1">{item.quantity}</td>
                <td className="text-right py-1">
                  {totalProductDiscount > 0 ? (
                    <>
                      <span className="line-through text-base-content/50 mr-1">
                        {formatRupiah(totalProductPrice)}
                      </span>
                      <span className="text-primary font-semibold">
                        {formatRupiah(productDiscountedPrice)}
                      </span>
                    </>
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
      {cart.items.some((item) =>
        (item.product?.promotions || []).some(
          (promo) =>
            (promo.status === 1 || promo.status === "1") &&
            promo.discount_percentage > 0 &&
            (!promo.expired || new Date(promo.expired) > new Date())
        )
      ) && (
        <div className="mb-4">
          <p className="text-sm text-base-content/60 font-semibold mb-1">
            Diskon Produk
          </p>
          {cart.items.flatMap((item) =>
            (item.product?.promotions || [])
              .filter(
                (promo) =>
                  (promo.status === 1 || promo.status === "1") &&
                  promo.discount_percentage > 0 &&
                  (!promo.expired || new Date(promo.expired) > new Date())
              )
              .map((promo) => (
                <div
                  key={promo.id}
                  className="flex justify-between text-base-content/60 text-sm">
                  <span>
                    {promo.title} ({promo.discount_percentage}%) -{" "}
                    {item.product.name}
                  </span>
                  <span className="text-error">
                    -{" "}
                    {formatRupiah(
                      (promo.discount_percentage *
                        item.product.price *
                        item.quantity) /
                        100
                    )}
                  </span>
                </div>
              ))
          )}
        </div>
      )}
      {referralCodeDiscount > 0 && validReferralCode && (
        <div className="mb-4">
          <p className="text-sm text-base-content/60 font-semibold mb-1">
            Diskon Referral
          </p>
          <div className="flex justify-between text-base-content/60 text-sm">
            <span>
              {validReferralCode.title} ({referralCodeDiscount}% pada total
              checkout)
            </span>
            <span className="text-error">
              - {formatRupiah(referralDiscountAmount)}
            </span>
          </div>
        </div>
      )}
      <div className="flex justify-between font-bold text-base-content mb-4">
        <span>Total:</span>
        <span className="text-primary">
          {formatRupiah(calculateTotalPrice())}
        </span>
      </div>
      <div className="bg-base-200/50 dark:bg-base-300/50 p-3 rounded border border-base-300 text-center text-sm">
        <p className="font-medium text-info mb-1">Informasi Penting</p>
        <p className="text-info">
          Harga sudah termasuk pajak dan biaya layanan. Pengiriman akan
          dikenakan biaya tambahan.
          {(cart.items.some((item) =>
            (item.product?.promotions || []).some(
              (promo) =>
                (promo.status === 1 || promo.status === "1") &&
                promo.discount_percentage > 0 &&
                (!promo.expired || new Date(promo.expired) > new Date())
            )
          ) ||
            referralCodeDiscount > 0) && (
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
  );
};

export const CheckoutProcess = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { createStatus, checkoutData } = useSelector((state) => state.checkout);
  const { user, token } = useSelector((state) => state.auth);

  const [cart, setCart] = useState({ items: [] });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [referralCodeDiscount, setReferralCodeDiscount] = useState(0);
  const [validReferralCode, setValidReferralCode] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isSnapLoaded, setIsSnapLoaded] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingTimeLeft, setPollingTimeLeft] = useState(300); // 5 minutes
  const [pollingStopped, setPollingStopped] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const scriptLoadedRef = useRef(false);
  const scriptElementRef = useRef(null);
  const maxScriptLoadAttempts = 3;

  const formatPaymentType = useCallback((type) => {
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
  }, []);

  const formatTimeLeft = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    setPollingStopped(true);
    // toast.info(
    //   "Pemeriksaan status otomatis telah berhenti. Gunakan tombol 'Periksa Status' untuk memeriksa kembali.",
    //   { autoClose: 5000 }
    // );
  }, []);

  const checkPaymentStatus = useCallback(
    async (key) => {
      if (!token || !key) return;
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

        if (data.source === "midtrans_api") {
          newPaymentStatus = data.transaction_status;
          newCheckoutStatus = data.checkout_status;
          transactionId = data.transaction_id;
          if (["pending", "settlement"].includes(newPaymentStatus)) {
            paymentType = data.payment_type;
          }
        } else {
          newPaymentStatus = data.payment_status;
          newCheckoutStatus = data.checkout_status;
          paymentType = data.payment_type;
          transactionId = data.transaction_id;
        }


        dispatch(
          optimisticUpdateCheckout({
            key,
            payment: {
              ...checkoutData?.payment,
              payment_status: newPaymentStatus,
              transaction_id: transactionId || checkoutData?.payment?.transaction_id,
              paid_at: data.transaction_time || data.paid_at,
              payment_type: paymentType || checkoutData?.payment?.payment_type,
            },
            status: newCheckoutStatus,
          })
        );

        if (
          paymentType &&
          paymentType !== checkoutData?.payment?.payment_type &&
          ["pending", "settlement"].includes(newPaymentStatus)
        ) {
          console.log("Payment type changed, updating backend:", {
            from: checkoutData?.payment?.payment_type,
            to: paymentType,
          });
          await dispatch(fetchCheckout(key));
        }

        if (!["pending", "challenge"].includes(newPaymentStatus)) {
          stopPolling();
        }

        if ((newPaymentStatus !== "settlement" || newPaymentStatus !== "paid") &&newPaymentStatus === "expire" && paymentType === null) {
          stopPolling();
          toast.info(
            "Pembayaran kedaluwarsa, tetapi pesanan masih aktif karena metode pembayaran belum dipilih. Silakan buat token pembayaran baru.",
            { autoClose: 5000 }
          );
        } else if (newPaymentStatus === "expire" && paymentType !== null) {
          stopPolling();
          toast.error(
            "Pembayaran kedaluwarsa. Silakan buat token pembayaran baru.",
            { autoClose: 5000 }
          );
        } else if (
          newPaymentStatus === "cancelled" ||
          newPaymentStatus === "deny"
        ) {
          toast.error(
            "Pembayaran dibatalkan. Silakan coba lagi atau buat token pembayaran baru.",
            { autoClose: 5000 }
          );
        } else if (
          paymentType &&
          paymentType !== checkoutData?.payment?.payment_type &&
          ["pending", "settlement"].includes(newPaymentStatus)
        ) {
          toast.info(
            `Metode pembayaran dipilih: ${formatPaymentType(paymentType)}`,
            { autoClose: 3000 }
          );
        }
      } catch (err) {
        const errorMessage =
          err.response?.data?.midtrans_error ||
          err.response?.data?.error ||
          "Gagal memeriksa status pembayaran";
        toast.error(`${errorMessage}. Silakan coba lagi atau hubungi support.`, {
          autoClose: 5000,
        });
        if (retryCount < 3) {
          setRetryCount((prev) => prev + 1);
        } else {
          stopPolling();
        }
      } finally {
        setIsUpdating(false);
      }
    },
    [token, checkoutData, dispatch, retryCount, stopPolling]
  );

  const pollPaymentStatus = useCallback(
    async (key) => {
      if (!isPolling || pollingTimeLeft <= 0) {
        stopPolling();
        return;
      }
      await checkPaymentStatus(key);
      if (isPolling) {
        setTimeout(() => pollPaymentStatus(key), 5000);
      }
    },
    [isPolling, pollingTimeLeft, checkPaymentStatus, stopPolling]
  );

  const startPolling = useCallback(
    (key) => {
      setIsPolling(true);
      setPollingStopped(false);
      checkPaymentStatus(key);
      pollPaymentStatus(key);
    },
    [checkPaymentStatus, pollPaymentStatus]
  );

  const handleManualCheck = () => {
    setPollingStopped(false);
    startPolling(checkoutData?.key);
  };

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

    if (paymentMethod !== "midtrans") {
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
  }, [paymentMethod]);

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

  const calculateTotalPrice = useCallback(() => {
    const totalProductDiscounted = cart.items.reduce((total, item) => {
      const productPrice = parseFloat(item.product?.price || 0);
      const totalProductPrice = productPrice * item.quantity;
      const activePromotions =
        item.product?.promotions?.filter(
          (promo) =>
            (promo.status === 1 || promo.status === "1") &&
            promo.discount_percentage > 0 &&
            (!promo.expired || new Date(promo.expired) > new Date())
        ) || [];
      const totalProductDiscount = activePromotions.reduce(
        (acc, promo) => acc + parseFloat(promo.discount_percentage),
        0
      );
      const productDiscountAmount = totalProductDiscount
        ? (totalProductPrice * totalProductDiscount) / 100
        : 0;
      return total + (totalProductPrice - productDiscountAmount);
    }, 0);
    const referralDiscountAmount = referralCodeDiscount
      ? (totalProductDiscounted * referralCodeDiscount) / 100
      : 0;
    return Math.max(0, totalProductDiscounted - referralDiscountAmount);
  }, [cart, referralCodeDiscount]);

  const handleQuantityChange = useCallback((cartItemId, quantity) => {
    if (quantity < 1) {
      toast.error("Jumlah tidak boleh kurang dari 1");
      return;
    }
    setIsUpdating(true);
    setCart((prevCart) => ({
      items: prevCart.items.map((item) =>
        item.id === cartItemId ? { ...item, quantity } : item
      ),
    }));
    setIsUpdating(false);
  }, []);

  const handleRemoveItem = useCallback((cartItemId) => {
    setIsRemoving(true);
    setCart((prevCart) => ({
      items: prevCart.items.filter((item) => item.id !== cartItemId),
    }));
    setIsRemoving(false);
    toast.success("Item dihapus dari keranjang");
  }, []);

  const checkPromoCode = useCallback(
    async (code) => {
      if (!code) {
        toast.error("Masukkan kode promo terlebih dahulu");
        return;
      }
      if (!token) {
        toast.error("Silakan login terlebih dahulu untuk memeriksa kode promo");
        navigate("/login");
        return;
      }

      setIsCheckingPromo(true);
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API}api/checkout/code`,
          { referral_code: code },
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.status === 200) {
          const promoData = response.data.data;
          const discountPercentage = parseFloat(promoData.discount_percentage);

          setReferralCodeDiscount(discountPercentage);
          setValidReferralCode(promoData);

          toast.success(
            `Kode referral "${code}" valid! Diskon ${discountPercentage}% akan diterapkan pada total checkout.`,
            {
              autoClose: 5000,
            }
          );
          setReferralCode(code);
        } else {
          setReferralCodeDiscount(0);
          setValidReferralCode(null);
          toast.error(response.data.message, {
            action: {
              label: "Hapus Kode",
              onClick: () => {
                setReferralCode("");
                setReferralCodeDiscount(0);
                setValidReferralCode(null);
              },
            },
          });
        }
      } catch (error) {
        console.error("Error checking promo code:", error);
        setReferralCodeDiscount(0);
        setValidReferralCode(null);
        const errorMessage =
          error.response?.data?.message || "Gagal memeriksa kode promo";
        toast.error(errorMessage, {
          action: {
            label: "Hapus Kode",
            onClick: () => {
              setReferralCode("");
              setReferralCodeDiscount(0);
              setValidReferralCode(null);
            },
          },
        });
      } finally {
        setIsCheckingPromo(false);
      }
    },
    [token, navigate]
  );

  const validateCheckoutData = useCallback(() => {
    if (!user) {
      toast.error("Silakan login terlebih dahulu");
      return false;
    }
    if (!cart.items.length) {
      toast.error("Keranjang Anda kosong");
      return false;
    }
    if (!paymentMethod) {
      toast.error("Silakan pilih metode pembayaran");
      return false;
    }
    for (const item of cart.items) {
      if (!item.product.status) {
        toast.error(
          `Produk "${item.product.name}" tidak tersedia untuk dibeli`
        );
        return false;
      }
      if (item.quantity <= 0) {
        toast.error(`Jumlah tidak valid untuk produk "${item.product.name}"`);
        return false;
      }
    }
    return true;
  }, [user, cart, paymentMethod]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateCheckoutData()) return;

    setIsCalculating(true);

    const checkoutData = {
      total_price: Math.round(calculateTotalPrice() * 100) / 100,
      product_ids: cart.items.map((item) => item.product.id),
      quantity: cart.items.map((item) => item.quantity),
      payment_method: paymentMethod,
      referral_code: referralCode || null,
      referral_discount: referralCodeDiscount,
      total_quantity: cart.items.reduce((acc, item) => acc + item.quantity, 0),
      referral_promotion_id: validReferralCode ? validReferralCode.id : null,
    };

    console.log("Checkout Data:", {
      ...checkoutData,
      product_names: cart.items.map((item) => item.product.name),
    });

    try {
      const result = await dispatch(createCheckout(checkoutData)).unwrap();

      if (paymentMethod === "midtrans" && result.payment_gateway?.snap_token) {
        const snapInstance = window.snap || window.Snap;

        if (!snapInstance) {
          toast.error(
            "Midtrans Snap belum dimuat. Silakan refresh halaman.",
            { autoClose: 5000 }
          );
          setIsCalculating(false);
          return;
        }

        const popupTest = window.open("", "_blank");
        if (!popupTest) {
          toast.error(
            "Pop-up diblokir. Silakan izinkan pop-up untuk melanjutkan pembayaran.",
            { autoClose: 5000 }
          );
          setIsCalculating(false);
          return;
        }
        popupTest.close();

        let paymentTypeSelected = false;
        let statusCheckInterval = null;

        const startStatusChecking = () => {
          statusCheckInterval = setInterval(async () => {
            try {
              const statusResponse = await axios.get(
                `${process.env.REACT_APP_API}api/checkout/${result.key}/payment-status`,
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

                dispatch(
                  optimisticUpdateCheckout({
                    key: result.key,
                    payment: {
                      ...result.payment,
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
          }, 3000);
        };

        const stopStatusChecking = () => {
          if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
            statusCheckInterval = null;
          }
        };

        startStatusChecking();

        snapInstance.pay(result.payment_gateway.snap_token, {
          onSuccess: async (response) => {
            console.log("Midtrans success:", response);
            stopStatusChecking();

            await checkPaymentStatus(result.key);
            startPolling(result.key);
            setCart({ items: [] });
            setReferralCode("");
            setReferralCodeDiscount(0);
            setValidReferralCode(null);
            setPaymentMethod("");
            navigate(`/checkout/preview/${result.key}`, {
              state: { message: "success|Pembayaran berhasil!" },
            });
          },
          onPending: async (response) => {
            console.log("Midtrans pending:", response);
            stopStatusChecking();

            if (response.payment_type) {
              dispatch(
                optimisticUpdateCheckout({
                  key: result.key,
                  payment: {
                    ...result.payment,
                    payment_type: response.payment_type,
                  },
                })
              );
            }

            toast.info("Pembayaran pending. Memeriksa status...", {
              autoClose: 2000,
            });

            await checkPaymentStatus(result.key);
            startPolling(result.key);
            navigate(`/checkout/preview/${result.key}`, {
              state: { message: "info|Pembayaran sedang diproses" },
            });
          },
          onError: async (response) => {
            console.log("Midtrans error:", response);
            stopStatusChecking();
            toast.error("Pembayaran gagal. Silakan coba lagi.", {
              autoClose: 2000,
            });
            await checkPaymentStatus(result.key);
          },
          onClose: async () => {
            console.log("Midtrans popup ditutup");
            stopStatusChecking();

            await checkPaymentStatus(result.key);

            dispatch(fetchCheckout(result.key));
            navigate(`/checkout/preview/${result.key}`, {
              state: { message: "warning|Pembayaran belum selesai" },
            });
          },
        });
      } else {
        setCart({ items: [] });
        setReferralCode("");
        setReferralCodeDiscount(0);
        setValidReferralCode(null);
        setPaymentMethod("");
        navigate(`/checkout/preview/${result.key}`);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      const errorMessage =
        typeof err === "string"
          ? err
          : err?.error || "Gagal membuat checkout. Silakan coba lagi.";
      toast.error(errorMessage, {
        action: {
          label: "Hapus Kode",
          onClick: () => {
            setReferralCode("");
            setReferralCodeDiscount(0);
            setValidReferralCode(null);
          },
        },
      });
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    dispatch(resetCheckoutState());
    if (!user) {
      toast.error("Silakan login terlebih dahulu");
      navigate("/login");
      return;
    }

    const cartData = location.state?.cart;
    if (cartData && cartData.items?.length) {
      const validItems = cartData.items.filter(
        (item) => item.product?.status && item.quantity > 0
      );
      if (validItems.length) {
        setCart({ items: validItems });
      } else {
        toast.error("Tidak ada produk yang valid di keranjang");
        navigate("/cart");
      }
    } else {
      toast.error("Keranjang kosong atau tidak valid");
      navigate("/cart");
    }
  }, [dispatch, navigate, location, user]);

  const isSubmitting = createStatus === "loading" || isCalculating;

  return (
    <div className="min-h-screen bg-base-200/10">
      <div className="bg-base-100 dark:bg-base-200 shadow-sm border-b border-base-300">
        <div className="max-w-full mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="btn bg-base-200/80 outline-none border-none hover:bg-base-200 btn-circle">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h1 className="text-xl font-bold text-base-content">Checkout</h1>
            </div>
            <div className="flex justify-center">
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
                  <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <span className="font-semibold text-orange-600">Process</span>
                </div>
                <span className="material-symbols-outlined text-orange-500">
                  arrow_forward
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-base-300 text-base-content flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <span className="font-medium text-base-content">Complete</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                garden_cart
              </span>
              <span className="text-sm font-medium">
                {cart.items.length} produk
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-full mx-auto py-8">
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CartItems
              navigate={navigate}
              cart={cart}
              handleQuantityChange={handleQuantityChange}
              handleRemoveItem={handleRemoveItem}
              isUpdating={isUpdating}
              isRemoving={isRemoving}
            />
            <PaymentMethodSelection
              cart={cart}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              referralCode={referralCode}
              setReferralCode={setReferralCode}
              checkPromoCode={checkPromoCode}
              isCheckingPromo={isCheckingPromo}
              validReferralCode={validReferralCode}
              referralCodeDiscount={referralCodeDiscount}
              setReferralCodeDiscount={setReferralCodeDiscount}
              setValidReferralCode={setValidReferralCode}
            />
            <div className="bg-base-100 dark:bg-base-200 w-full rounded-xl shadow-sm border border-base-300 p-6 md:p-8">
              <div className="flex flex-col gap-4 w-full">
                <div className="text-center">
                  <p className="text-sm text-base-content/60 mb-1">
                    Total yang harus dibayar
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatRupiah(calculateTotalPrice())}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/cart")}
                    className="btn btn-link outline-none rounded-lg px-4 py-2 flex-1 text-base-content/60 hover:text-base-content"
                    disabled={isSubmitting}>
                    <span className="material-symbols-outlined">
                      garden_cart
                    </span>
                    Kembali ke Keranjang
                  </button>
                  <button
                    type="submit"
                    className="btn bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 flex-1 flex items-center justify-center gap-2"
                    disabled={
                      isSubmitting ||
                      !cart.items.length ||
                      !paymentMethod ||
                      (paymentMethod === "midtrans" && !isSnapLoaded) ||
                      cart.items.some((item) => !item.product?.status)
                    }>
                    {isSubmitting ? (
                      <div className="text-white flex items-center">
                        <span className="loading loading-spinner loading-sm"></span>
                        Memproses...
                      </div>
                    ) : (
                      <div className="text-white flex items-center">
                        <span className="material-symbols-outlined">
                          shopping_cart_checkout
                        </span>
                        {paymentMethod === "midtrans"
                          ? "Lanjutkan ke Pembayaran"
                          : "Daftar Sekarang"}
                      </div>
                    )}
                  </button>
                </div>
                <div className="border-t border-base-300 pt-4 text-sm text-base-content/60">
                  <p>
                    Dengan melanjutkan checkout, Anda menyetujui{" "}
                    <a href="#" className="text-primary hover:underline">
                      Syarat & Ketentuan
                    </a>{" "}
                    dan{" "}
                    <a href="#" className="text-primary hover:underline">
                      Kebijakan Privasi
                    </a>
                    .
                  </p>
                  <p>
                    Pembelian ini dilindungi oleh jaminan keamanan transaksi.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <OrderSummary
              cart={cart}
              formatRupiah={formatRupiah}
              referralCodeDiscount={referralCodeDiscount}
              validReferralCode={validReferralCode}
            />
          </div>
        </form>
      </div>
      {(isSubmitting || isUpdating || isRemoving) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-base-100 dark:bg-base-200 p-8 rounded-lg shadow-xl text-center max-w-sm mx-4">
            <div className="mb-4">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
            <h3 className="text-lg font-semibold text-base-content mb-2">
              Memproses Pesanan
            </h3>
            <p className="text-sm text-base-content/60">
              Mohon tunggu, pesanan Anda sedang diproses...
            </p>
          </div>
        </div>
      )}
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
      {pollingStopped && checkoutData?.payment?.payment_status === "pending" && (
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
    </div>
  );
};

export default CheckoutProcess;