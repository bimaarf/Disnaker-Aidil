import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  fetchCart,
  updateCartItem,
  removeFromCart,
} from "../../../../features/product/cartSlice";
import { CircularLoader } from "../../../../Components/_CircularLoader";
import { formatRupiah } from "../../../../utils/rupiahInput";
import { ShoppingBag } from "lucide-react";

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
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => navigate("/product")}
              className="btn bg-blue-600 hover:bg-blue-700 rounded-lg px-6 py-2 flex items-center gap-2 mx-auto text-white"
              aria-label="Browse available products">
              <span className="material-symbols-outlined">storefront</span>
              Jelajahi Produk
            </button>
          </div>
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

const OrderSummary = ({ cart, formatRupiah }) => {
  const calculateTotalPrice = () => {
    return cart.items.reduce((total, item) => {
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
      return total + discountedPrice;
    }, 0);
  };

  return (
    <div className="bg-base-100 dark:bg-base-200 rounded-lg max-w-full mx-auto border-4 border-dashed border-base-300 p-4">
      <h2 className="text-lg font-bold text-base-content text-center mb-2">
        Ringkasan Keranjang
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
            const totalDiscount = activePromotions.reduce(
              (acc, promo) => acc + parseFloat(promo.discount_percentage),
              0
            );
            const discountAmount = totalDiscount
              ? (totalProductPrice * totalDiscount) / 100
              : 0;
            const discountedPrice = totalProductPrice - discountAmount;

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
                  {totalDiscount > 0 ? (
                    <>
                      <span className="line-through text-base-content/50 mr-1">
                        {formatRupiah(totalProductPrice)}
                      </span>
                      <span className="text-primary font-semibold">
                        {formatRupiah(discountedPrice)}
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
          {cart.items.some((item) =>
            (item.product?.promotions || []).some(
              (promo) =>
                (promo.status === 1 || promo.status === "1") &&
                promo.discount_percentage > 0 &&
                (!promo.expired || new Date(promo.expired) > new Date())
            )
          ) && (
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

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cart, status, error, isLoading, isUpdating, isRemoving, isClearing } =
    useSelector((state) => state.cart);

  useEffect(() => {
    if (status === "idle") {
      status === "idle" &&
        dispatch(fetchCart())
          .unwrap()
          .catch((err) => {
            toast.error(err || "Gagal mengambil data keranjang");
          });
    }
  }, [dispatch, navigate]);

  const handleQuantityChange = (cartItemId, quantity) => {
    if (quantity < 1) {
      toast.error("Jumlah tidak boleh kurang dari 1");
      return;
    }
    dispatch(updateCartItem({ cartItemId, quantity }))
      .unwrap()
      .then(() => {
        toast.success("Jumlah item diperbarui");
      })
      .catch((err) => {
        toast.error(err || "Gagal memperbarui jumlah item");
      });
  };

  const handleRemoveItem = (cartItemId) => {
    dispatch(removeFromCart(cartItemId))
      .unwrap()
      .then(() => {
        toast.success("Item dihapus dari keranjang");
      })
      .catch((err) => {
        toast.error(err || "Gagal menghapus item");
      });
  };


  const handleCheckout = () => {
    if (!cart.items.length) {
      toast.error("Keranjang Anda kosong");
      return;
    }
    navigate("/checkout/process", { state: { cart } });
  };

  if (isLoading && status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200/10">
        <div className="text-center">
          <CircularLoader />
          <p className="mt-4 text-lg text-base-content/60">
            Memuat keranjang...
          </p>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200/10">
        <div className="text-center max-w-full mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-red-500 text-4xl">
              error
            </span>
          </div>
          <h2 className="text-2xl font-bold text-base-content mb-4">
            Gagal Memuat Keranjang
          </h2>
          <p className="text-base-content/60 mb-6">
            {error || "Tidak dapat mengambil data keranjang"}
          </p>
          <button
            onClick={() => navigate("/product")}
            className="btn bg-blue-600 text-base-content hover:bg-blue-700 rounded-lg px-6 py-2 flex items-center gap-2">
            <span className="material-symbols-outlined">storefront</span>
            Jelajahi Produk
          </button>
        </div>
      </div>
    );
  }

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
              <h1 className="text-xl font-bold text-base-content">Keranjang</h1>
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
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CartItems
              navigate={navigate}
              cart={cart}
              handleQuantityChange={handleQuantityChange}
              handleRemoveItem={handleRemoveItem}
              isUpdating={isUpdating}
              isRemoving={isRemoving}
            />
            <div className="bg-base-100 dark:bg-base-200 w-full rounded-xl shadow-sm border border-base-300 p-6 md:p-8">
              <div className="flex flex-col gap-4 w-full">
                <div className="text-center">
                  <p className="text-sm text-base-content/60 mb-1">
                    Total yang harus dibayar
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatRupiah(
                      cart.items.reduce((total, item) => {
                        const productPrice = parseFloat(
                          item.product?.price || 0
                        );
                        const totalProductPrice = productPrice * item.quantity;
                        const activePromotions =
                          item.product?.promotions?.filter(
                            (promo) =>
                              (promo.status === 1 || promo.status === "1") &&
                              promo.discount_percentage > 0 &&
                              (!promo.expired ||
                                new Date(promo.expired) > new Date())
                          ) || [];
                        const totalDiscount = activePromotions.reduce(
                          (acc, promo) =>
                            acc + parseFloat(promo.discount_percentage),
                          0
                        );
                        const discountAmount = totalDiscount
                          ? (totalProductPrice * totalDiscount) / 100
                          : 0;
                        const discountedPrice =
                          totalProductPrice - discountAmount;
                        return total + discountedPrice;
                      }, 0)
                    )}
                  </p>
                </div>
                <div className="flex w-full justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleCheckout}
                    className="btn w-1/2 max-w-96 bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-4 py-2 flex-1 flex items-center justify-center gap-2"
                    disabled={
                      isLoading ||
                      isUpdating ||
                      isRemoving ||
                      isClearing ||
                      !cart.items.length
                    }>
                    <span className="material-symbols-outlined">
                      shopping_cart_checkout
                    </span>
                    Lanjut ke Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div>
            <OrderSummary cart={cart} formatRupiah={formatRupiah} />
          </div>
        </div>
      </div>
      {(isUpdating || isRemoving || isClearing) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-base-100 dark:bg-base-200 p-8 rounded-lg shadow-xl text-center max-w-sm mx-4">
            <div className="mb-4">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
            <h3 className="text-lg font-semibold text-base-content mb-2">
              Memproses Keranjang
            </h3>
            <p className="text-sm text-base-content/60">
              Mohon tunggu, keranjang Anda sedang diproses...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
