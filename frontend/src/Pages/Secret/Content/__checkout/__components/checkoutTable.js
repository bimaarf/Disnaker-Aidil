import {
  CalendarCheck2,
  CreditCard,
  Eye,
  Globe,
  Pencil,
  ShoppingBag,
  Trash,
  User,
} from "lucide-react";
import React, { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const CheckoutTable = ({
  datas,
  status,
  sortConfig,
  requestSort,
  handlePreviewData,
  handleEditData,
  handleDeleteData,
  formatDate,
  truncateTitle,
  handleDelete,
  selectedDatas,
  setSelectedDatas,
}) => {
  const navigate = useNavigate();
  const selectAllRef = useRef(null);

  const handleCheckboxChange = (dataId) => {
    setSelectedDatas((prevSelected) =>
      prevSelected.includes(dataId)
        ? prevSelected.filter((key) => key !== dataId)
        : [...prevSelected, dataId]
    );
  };

  const handleSelectAll = (event) => {
    setSelectedDatas(
      event.target.checked ? datas?.map((data) => data?.key) : []
    );
  };

  useEffect(() => {
    if (selectAllRef.current) {
      const isIndeterminate =
        selectedDatas?.length > 0 && selectedDatas?.length < datas?.length;
      selectAllRef.current.indeterminate = isIndeterminate;
    }
  }, [selectedDatas?.length, datas?.length]);

  const getSortIcon = (columnKey) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === "desc" ? "↓" : "↑";
    }
    return "↕";
  };

  const SortableHeader = ({ columnKey, children, className = "" }) => (
    <div
      onClick={() => requestSort(columnKey)}
      className={`flex items-center gap-1 cursor-pointer hover:text-primary transition-all duration-200 select-none ${className}`}>
      {children}
      <span className="text-xs opacity-60">{getSortIcon(columnKey)}</span>
    </div>
  );

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Fungsi untuk menghitung total diskon produk
  const calculateProductDiscount = (product) => {
    if (!product.promotions || product.promotions.length === 0) return 0;

    return product.promotions.reduce((total, promo) => {
      return total + parseFloat(promo.discount_percentage || 0);
    }, 0);
  };

  // Fungsi untuk menghitung harga setelah diskon produk
  const calculateDiscountedPrice = (originalPrice, discountPercentage) => {
    const discount = originalPrice * (discountPercentage / 100);
    return originalPrice - discount;
  };

  // Fungsi untuk mendapatkan status badge
  const StatusBadge = React.memo(({ status, type = "payment" }) => {
    const getStatusConfig = useCallback((status, type) => {
      const effectiveStatus =
        typeof status === "object" ? status.status : status;

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

  // Fungsi untuk mendapatkan payment method badge
  const getPaymentMethodBadge = (paymentMethod) => {
    const methodConfig = {
      midtrans: {
        color: "bg-primary/10 text-primary border-primary",
        icon: <CreditCard size={12} />,
        text: "Midtrans",
      },
    };

    const config = methodConfig[paymentMethod] || {
      color: "bg-warning/10 text-warning border-warning",
      icon: <CreditCard size={12} />,
      text: paymentMethod || "Unknown",
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${config.color}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  if (!datas) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="loading loading-spinner loading-md"></div>
        <span className="ml-2 text-base-content">Loading...</span>
      </div>
    );
  }

  return (
    <div className="bg-base-100 mt-4 rounded-xl border border-base-300 overflow-hidden">
      {selectedDatas?.length > 0 && (
        <div className="bg-primary/5 border-b border-base-300 px-6 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-base-content">
              {selectedDatas?.length} checkout
              {selectedDatas?.length > 1 ? "s" : ""} selected
            </span>
            <button
              onClick={handleDelete}
              className="btn btn-sm btn-error btn-outline gap-2">
              <Trash size={16} />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="table w-full table-zebra">
          <thead className="bg-base-200/50 sticky top-0 z-10">
            <tr className="border-b border-base-300">
              <th className="w-12">
                <label className="cursor-pointer">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    onChange={handleSelectAll}
                    checked={
                      selectedDatas?.length === datas?.length &&
                      datas?.length > 0
                    }
                  />
                </label>
              </th>
              <th className="w-20">
                <SortableHeader columnKey="id">Order ID</SortableHeader>
              </th>
              <th className="min-w-[300px]">
                <SortableHeader columnKey="products">Products</SortableHeader>
              </th>
              <th className="w-32">
                <SortableHeader columnKey="status">Status</SortableHeader>
              </th>
              <th className="w-48">
                <SortableHeader columnKey="total_price">Total</SortableHeader>
              </th>
              <th className="min-w-[180px]">
                <SortableHeader columnKey="promotions">Voucher</SortableHeader>
              </th>
              <th className="w-36">
                <SortableHeader columnKey="payment">Payment</SortableHeader>
              </th>
              <th className="w-40">
                <SortableHeader columnKey="created_at">Date</SortableHeader>
              </th>
              <th className="w-32">Actions</th>
            </tr>
          </thead>

          <tbody>
            {datas?.length === 0 && status !== "loading" ? (
              <tr>
                <td colSpan="9" className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <ShoppingBag size={48} className="text-base-content/30" />
                    <p className="text-base-content/60">
                      No checkout records found
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              (datas || []).map((data) => (
                <tr
                  key={data?.key}
                  className="transition-colors duration-200 hover:bg-base-200/30">
                  <td>
                    <label className="cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={selectedDatas?.includes(data?.key)}
                        onChange={() => handleCheckboxChange(data?.key)}
                      />
                    </label>
                  </td>

                  <td>
                    <div className="space-y-1 min-w-[180px]">
                      <div className="text-sm font-bold text-base-content">
                        #{data?.payment?.order_id}
                      </div>
                      <div className="flex items-center gap-1 text-base-content/60">
                        <User size={14} />
                        <p>{data?.user?.name}</p>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="space-y-2">
                      {data?.products?.map((product, index) => {
                        const discountPercentage =
                          calculateProductDiscount(product);
                        const originalPrice = product.price * product.quantity;
                        const discountedPrice =
                          discountPercentage > 0
                            ? calculateDiscountedPrice(
                                originalPrice,
                                discountPercentage
                              )
                            : originalPrice;

                        return (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-2 rounded-lg bg-base-50 border border-base-200">
                            {product.product?.images?.[0] ? (
                              <div className="avatar">
                                <div className="mask mask-squircle h-10 w-10">
                                  <img
                                    src={`${process.env.REACT_APP_API}${product.product.images[0].image_data}`}
                                    alt={product.product_name}
                                    className="object-cover"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="avatar placeholder">
                                <div className="bg-primary/10 text-primary h-10 w-10 mask mask-squircle">
                                  <span className="text-base font-semibold">
                                    {product.product_name
                                      ?.charAt(0)
                                      ?.toUpperCase() || "?"}
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-medium text-base-content truncate">
                                  {truncateTitle(product.product_name, 25)}
                                </h4>
                                <span className="text-xs">
                                  x{product.quantity}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-xs">
                                {discountPercentage > 0 ? (
                                  <>
                                    <span className="text-base-content/50 line-through">
                                      {formatPrice(originalPrice)}
                                    </span>
                                    <span className="text-success font-semibold">
                                      {formatPrice(discountedPrice)}
                                    </span>
                                    <span className="badge badge-success badge-xs">
                                      -{discountPercentage}%
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-primary font-semibold">
                                    {formatPrice(originalPrice)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>

                  <td>
                    <StatusBadge
                      status={data?.payment?.payment_status}
                      type="payment"
                    />
                    <StatusBadge status={data?.status} type="order" />
                  </td>

                  <td>
                    <div className="space-y-1 whitespace-nowrap">
                      <div className="text-md font-bold text-primary">
                        {formatPrice(data?.total_price)}
                      </div>
                      {data?.payment?.paid_at && (
                        <div className="text-[12px] text-base-content/40 flex items-center gap-1">
                          <CalendarCheck2 size={12} />
                          {formatDate(data?.payment?.paid_at, "DD/MM HH:mm")}
                        </div>
                      )}
                    </div>
                  </td>

                  <td>
                    <div className="space-y-1">
                      {data?.referral_promotion && (
                        <div className="mb-1">
                          <span className="bg-accent/10 text-accent text-xs px-2 py-1 rounded-full inline-block">
                            {truncateTitle(
                              data?.referral_promotion.referral_code,
                              15
                            )}
                          </span>
                          <div className="text-xs text-accent font-medium">
                            {truncateTitle(data?.referral_promotion.title, 15)}{" "}
                            ({data?.referral_promotion.discount_percentage}%)
                          </div>
                        </div>
                      )}

                      {!data?.products?.some((p) => p.promotions?.length > 0) &&
                        !data?.referral_promotion && (
                          <span className="text-xs text-base-content/40 italic">
                            No promotions
                          </span>
                        )}
                    </div>
                  </td>

                  <td>
                    <div className="space-y-2">
                      {data?.payment &&
                        getPaymentMethodBadge(data?.payment?.payment_method)}
                      {data?.payment?.payment_type && (
                        <div className="text-xs text-base-content/60 capitalize">
                          {data?.payment?.payment_type.replace("_", " ")}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="text-sm text-base-content/80">
                    <div className="space-y-1">
                      <div>{formatDate(data?.created_at, "DD MMM YYYY")}</div>
                      {data?.payment?.paid_at && (
                        <div className="text-xs text-base-content/60">
                          Paid : {formatDate(data?.payment?.paid_at, "HH:mm")}
                        </div>
                      )}
                    </div>
                  </td>

                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/checkout/${data?.key}`)}
                        className="btn btn-sm btn-ghost text-warning hover:bg-warning/10"
                        title="Preview checkout"
                        disabled={data?.status === "pending"}>
                        <Globe size={14} />
                      </button>

                      <button
                        onClick={() => handlePreviewData(data)}
                        className="btn btn-sm btn-ghost text-info hover:bg-info/10"
                        title="View details">
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={() => handleEditData(data)}
                        className="btn btn-sm btn-ghost text-warning hover:bg-warning/10"
                        title="Edit checkout"
                        disabled={data?.status === "completed"}>
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => handleDeleteData(data?.key)}
                        className="btn btn-sm btn-ghost text-error hover:bg-error/10"
                        title="Delete checkout">
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CheckoutTable;
