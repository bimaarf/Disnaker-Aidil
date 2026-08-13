import {
  CalendarCheck2,
  Eye,
  MoreVertical,
  Pencil,
  ShoppingBag,
  Trash,
  User,
  CheckCircle,
  XCircle,
} from "lucide-react";
import React, { useCallback, useRef, useEffect } from "react";

const CheckoutList = ({
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Calculate product discount
  const calculateProductDiscount = (product) => {
    if (!product.promotions || product.promotions.length === 0) return 0;

    return product.promotions.reduce((total, promo) => {
      return total + parseFloat(promo.discount_percentage || 0);
    }, 0);
  };

  // Calculate discounted price
  const calculateDiscountedPrice = (originalPrice, discountPercentage) => {
    const discount = originalPrice * (discountPercentage / 100);
    return originalPrice - discount;
  };

  // Status Badge Component
  const StatusBadge = React.memo(({ status, type = "payment" }) => {
    const getStatusConfig = useCallback((status, type) => {
      const effectiveStatus =
        typeof status === "object" ? status.status : status;

      if (type === "payment") {
        switch (effectiveStatus) {
          case "settlement":
          case "paid":
            return {
              color: "bg-success/10 text-success",
              text: "Paid",
              icon: <CheckCircle size={12} />,
            };
          case "pending":
            return {
              color: "bg-warning/10 text-warning",
              text: "Pending",
              icon: <CalendarCheck2 size={12} />,
            };
          case "cancel":
          case "cancelled":
            return {
              color: "bg-error/10 text-error",
              text: "Cancelled",
              icon: <XCircle size={12} />,
            };
          case "expire":
          case "expired":
            return {
              color: "bg-base-300/80 text-base-content/60",
              text: "Expired",
              icon: <XCircle size={12} />,
            };
          default:
            return {
              color: "bg-base-300/80 text-base-content/60",
              text: "Unpaid",
              icon: <XCircle size={12} />,
            };
        }
      } else {
        // Order status
        switch (effectiveStatus) {
          case "completed":
            return {
              color: "bg-success/10 text-success",
              text: "Completed",
              icon: <CheckCircle size={12} />,
            };
          case "processing":
            return {
              color: "bg-primary/10 text-primary",
              text: "Processing",
              icon: <CalendarCheck2 size={12} />,
            };
          case "cancelled":
            return {
              color: "bg-error/10 text-error",
              text: "Cancelled",
              icon: <XCircle size={12} />,
            };
          default:
            return {
              color: "bg-warning/10 text-warning",
              text: "Pending",
              icon: <CalendarCheck2 size={12} />,
            };
        }
      }
    }, []);

    const config = getStatusConfig(status, type);

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.text}
      </span>
    );
  });
  StatusBadge.displayName = "StatusBadge";


  if (!datas) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="loading loading-spinner loading-md"></div>
        <span className="ml-2 text-base-content">Loading...</span>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Header Controls */}
      {selectedDatas?.length > 0 && (
        <div className="bg-primary/5 border border-base-300 rounded-lg p-4 mb-4">
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
      {selectedDatas?.length > 0 && (
        <div className="bg-base-100 dark:bg-base-200 rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  onChange={handleSelectAll}
                  checked={
                    selectedDatas?.length === datas?.length && datas?.length > 0
                  }
                />
                <span className="text-sm text-base-content">Select All</span>
              </label>
            </div>

            {/* Sort Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-base-content/60">Sort by:</span>
              {[
                { key: "id", label: "Order ID" },
                { key: "status", label: "Status" },
                { key: "total_price", label: "Total" },
                { key: "created_at", label: "Date" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => requestSort(key)}
                  className={`btn btn-xs ${
                    sortConfig.key === key ? "btn-primary" : "btn-ghost"
                  } transition-colors duration-200`}>
                  {label}
                  {sortConfig.key === key &&
                    (sortConfig.direction === "desc" ? " ↓" : " ↑")}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      {datas?.length === 0 && status !== "loading" ? (
        <div className="bg-base-100 dark:bg-base-200 rounded-lg shadow-sm p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <ShoppingBag size={48} className="text-base-content/30" />
            <p className="text-base-content/60">No checkout records found</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(datas || []).map((data) => (
            <div
              key={data?.key}
              className="bg-base-100 dark:bg-base-200 rounded-2xl shadow-sm border border-base-300 overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300 transform hover:-translate-y-1">
              {/* Card Header */}
              <div className="relative p-4 border-b border-base-300">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm"
                      checked={selectedDatas?.includes(data?.key)}
                      onChange={() => handleCheckboxChange(data?.key)}
                    />
                    <div>
                      <div className="text-sm font-bold text-base-content">
                        #{data?.payment?.order_id}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-base-content/60">
                        <User size={12} />
                        <span>{data?.user?.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <StatusBadge
                      status={data?.payment?.payment_status}
                      type="payment"
                    />
                    <StatusBadge status={data?.status} type="order" />
                  </div>
                </div>
              </div>

              {/* Products Section */}
              <div className="p-4 border-b border-base-300">
                <div className="space-y-2 max-h-32 overflow-y-auto">
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
                        className="flex items-center gap-2 p-2 rounded bg-base-50 border border-base-300">
                        {product.product?.images?.[0] ? (
                          <div className="avatar">
                            <div className="mask mask-squircle h-8 w-8">
                              <img
                                src={`${process.env.REACT_APP_API}${product.product.images[0].image_data}`}
                                alt={product.product_name}
                                className="object-cover"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="avatar placeholder">
                            <div className="bg-primary/10 text-primary h-8 w-8 mask mask-squircle">
                              <span className="text-xs font-semibold">
                                {product.product_name
                                  ?.charAt(0)
                                  ?.toUpperCase() || "?"}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <h4 className="text-xs font-medium text-base-content truncate">
                              {truncateTitle(product.product_name, 20)}
                            </h4>
                            <span className="text-xs">x{product.quantity}</span>
                          </div>

                          <div className="flex items-center gap-1 text-xs">
                            {discountPercentage > 0 ? (
                              <>
                                <span className="text-base-content/50 line-through">
                                  {formatPrice(originalPrice)}
                                </span>
                                <span className="text-success font-semibold">
                                  {formatPrice(discountedPrice)}
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
              </div>

              {/* Total and Payment Info */}
              <div className="p-4 border-b border-base-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-base-content">
                    Total:
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(data?.total_price)}
                  </span>
                </div>
              </div>

              {/* Promotions */}
              <div className="p-4 border-b border-base-300">
                <div className="text-xs font-medium text-base-content mb-1">
                  Promotions:
                </div>
                <div className="space-y-1">
                  {data?.referral_promotion ? (
                    <div className="bg-accent/10 text-accent text-xs px-2 py-1 rounded-full">
                      {truncateTitle(data?.referral_promotion.title, 20)}(
                      {data?.referral_promotion.discount_percentage}%)
                    </div>
                  ) : (
                    <div className="py-1 text-xs">{"-"}</div>
                  )}

                  {!data?.products?.some((p) => p.promotions?.length > 0) &&
                    !data?.referral_promotion && (
                      <span className="text-xs text-base-content/40 italic">
                        No promotions
                      </span>
                    )}
                </div>
              </div>

              {/* Date and Actions */}
              <div className="p-4">
                <div className="flex items-center justify-between text-xs text-base-content/60 mb-3">
                  <span>{formatDate(data?.created_at, "DD MMM YYYY")}</span>
                  {data?.payment?.paid_at && (
                    <span>
                      Paid: {formatDate(data?.payment?.paid_at, "HH:mm")}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => handlePreviewData(data)}
                    className="btn btn-sm btn-primary flex-1">
                    <Eye size={14} />
                    Preview
                  </button>

                  <div className="dropdown dropdown-top dropdown-left">
                    <div
                      tabIndex={0}
                      role="button"
                      className="btn btn-sm btn-ghost btn-circle">
                      <MoreVertical size={16} />
                    </div>
                    <ul
                      tabIndex={0}
                      className="dropdown-content menu bg-base-100 rounded-box z-[1] w-40 p-2 shadow-lg border border-base-300">
                      <li>
                        <button
                          onClick={() => handlePreviewData(data)}
                          className="flex items-center gap-2 text-info hover:bg-info/10">
                          <Eye size={14} />
                          View
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleEditData(data)}
                          className="flex items-center gap-2 text-warning hover:bg-warning/10"
                          disabled={data?.status === "completed"}>
                          <Pencil size={14} />
                          Edit
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleDeleteData(data?.key)}
                          className="flex items-center gap-2 text-error hover:bg-error/10">
                          <Trash size={14} />
                          Delete
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CheckoutList;
