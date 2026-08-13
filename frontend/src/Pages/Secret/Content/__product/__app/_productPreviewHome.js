import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "../../../../../App.css";
import { fetchProduct } from "../../../../../features/product/productSlice";
import {
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Shield,
  Truck,
  Award,
  MessageCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
} from "lucide-react";
import useScrollRestoration from "../../../../../Components/_scrollRestoration";

const ProductPreviewHome = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const products = useSelector((state) => state.products.products);
  const cachedProduct = useMemo(
    () => products.find((p) => p.key === key),
    [products, key]
  );

  const status = useSelector((state) => state.products.status);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(status === "loading");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalAnimating, setIsModalAnimating] = useState(false);
  const [imageTransition, setImageTransition] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const location = useLocation();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (
      data?.key &&
      location.pathname !== `/product/preview/${data.key}`
    ) {
      navigate(`/product/preview/${data.key}`);
    }
  };

  useScrollRestoration();

  useEffect(() => {
    const fetchProductData = async () => {
      if (!key || key === "undefined" || key.trim() === "") {
        toast.error("Invalid product URL. Please select a valid product.");
        navigate("/products");
        setLoading(false);
        return;
      }

      try {
        if (cachedProduct) {
          setData(cachedProduct);
          const primaryImage =
            cachedProduct?.images?.find((img) => img.is_primary == 1) ||
            cachedProduct?.images?.[0];
          setSelectedImage(primaryImage);
          setLoading(false);
          return;
        }

        const productData = await dispatch(fetchProduct({ key })).unwrap();
        setData(productData);
        const primaryImage =
          productData?.images?.find((img) => img.is_primary == 1) ||
          productData?.images?.[0];
        setSelectedImage(primaryImage);
        setLoading(false);
      } catch (err) {
        toast.error("Failed to load product data.");
        navigate("/products");
        setLoading(false);
      }
    };

    fetchProductData();
  }, [key, dispatch, navigate, cachedProduct]);

  const handleImageSelect = (image) => {
    setSelectedImage(image);
    const imageIndex =
      data?.images?.findIndex((img) => img.id === image.id) || 0;
    setCurrentImageIndex(imageIndex);
  };

  const openImageModal = () => {
    if (selectedImage && data?.images?.length > 0) {
      const imageIndex =
        data.images.findIndex((img) => img.id === selectedImage.id) || 0;
      setCurrentImageIndex(imageIndex);
      setIsImageModalOpen(true);
      setIsModalAnimating(true);
      document.body.style.overflow = "hidden"; // Prevent background scroll

      // Trigger entrance animation
      setTimeout(() => setIsModalAnimating(false), 100);
    }
  };

  const closeImageModal = () => {
    setIsModalAnimating(true);

    // Delay closing to allow exit animation
    setTimeout(() => {
      setIsImageModalOpen(false);
      setIsModalAnimating(false);
      document.body.style.overflow = "unset"; // Restore scroll
    }, 200);
  };

  const navigateImage = (direction) => {
    if (!data?.images?.length) return;

    setImageTransition(true);

    setTimeout(() => {
      const totalImages = data.images.length;
      let newIndex;

      if (direction === "next") {
        newIndex = (currentImageIndex + 1) % totalImages;
      } else {
        newIndex = (currentImageIndex - 1 + totalImages) % totalImages;
      }

      setCurrentImageIndex(newIndex);
      setSelectedImage(data.images[newIndex]);

      // End transition
      setTimeout(() => setImageTransition(false), 50);
    }, 150);
  };

  // Touch handlers for swipe navigation
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && data?.images?.length > 1) {
      navigateImage("next");
    }
    if (isRightSwipe && data?.images?.length > 1) {
      navigateImage("prev");
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isImageModalOpen) return;

      switch (e.key) {
        case "Escape":
          closeImageModal();
          break;
        case "ArrowLeft":
          navigateImage("prev");
          break;
        case "ArrowRight":
          navigateImage("next");
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    // Cleanup touch states when modal closes
    if (!isImageModalOpen) {
      setTouchStart(null);
      setTouchEnd(null);
    }

    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [isImageModalOpen, currentImageIndex, data?.images?.length]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (!data) {
    return null;
  }

  // Filter active promotions
  const activePromotions =
    data?.promotions?.filter(
      (promo) =>
        (promo.status === 1 || promo.status === "1") &&
        promo.discount_percentage > 0 &&
        (!promo.expired || new Date(promo.expired) > new Date())
    ) || [];

  // Check for bonus product (100% discount)
  const isBonusProduct = activePromotions.some(
    (promo) => parseFloat(promo.discount_percentage) === 100
  );

  // Calculate price
  let productPrice = parseFloat(data?.price || 0);
  if (isBonusProduct) {
    productPrice = 0;
  }
  const totalDiscount = isBonusProduct
    ? 100
    : activePromotions.reduce(
        (acc, promo) => acc + parseFloat(promo.discount_percentage),
        0
      );
  const discountedPrice = isBonusProduct
    ? 0
    : productPrice * (1 - totalDiscount / 100);

  return (
    <>
      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-200 border-t-green-600"></div>
            <p className="text-sm text-gray-600 font-medium">
              Loading product...
            </p>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {isImageModalOpen && data?.images?.length > 0 && (
        <div
          className={`fixed inset-0 bg-black z-50 flex items-center justify-center transition-all duration-300 ${
            isModalAnimating ? "bg-opacity-0" : "bg-opacity-90"
          }`}>
          {/* Close Button */}
          <button
            onClick={closeImageModal}
            className={`absolute top-4 right-4 z-60 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200 hover:scale-110 ${
              isModalAnimating
                ? "opacity-0 translate-y-[-10px]"
                : "opacity-100 translate-y-0"
            }`}
            style={{ transitionDelay: isModalAnimating ? "0ms" : "150ms" }}
            aria-label="Close modal">
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Buttons */}
          {data.images.length > 1 && (
            <>
              <button
                onClick={() => navigateImage("prev")}
                className={`absolute left-4 z-60 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200 hover:scale-110 hover:-translate-x-1 ${
                  isModalAnimating
                    ? "opacity-0 translate-x-[-20px]"
                    : "opacity-100 translate-x-0"
                }`}
                style={{ transitionDelay: isModalAnimating ? "0ms" : "100ms" }}
                aria-label="Previous image">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => navigateImage("next")}
                className={`absolute right-4 z-60 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200 hover:scale-110 hover:translate-x-1 ${
                  isModalAnimating
                    ? "opacity-0 translate-x-[20px]"
                    : "opacity-100 translate-x-0"
                }`}
                style={{ transitionDelay: isModalAnimating ? "0ms" : "100ms" }}
                aria-label="Next image">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Image Container */}
          <div
            className={`relative max-w-5xl max-h-[90vh] mx-4 transition-all duration-300 ${
              isModalAnimating
                ? "opacity-0 scale-95 translate-y-4"
                : "opacity-100 scale-100 translate-y-0"
            }`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}>
            <div className="relative overflow-hidden rounded-lg select-none">
              <img
                src={`${process.env.REACT_APP_API}${data.images[currentImageIndex]?.image_data}`}
                alt={`${data?.name || "Product"} - Image ${
                  currentImageIndex + 1
                }`}
                className={`max-w-full max-h-full object-contain rounded-lg transition-all duration-300 pointer-events-none ${
                  imageTransition
                    ? "opacity-0 scale-105"
                    : "opacity-100 scale-100"
                }`}
                draggable={false}
              />

              {/* Loading overlay during transition */}
              {imageTransition && (
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                </div>
              )}
            </div>

            {/* Swipe Indicator for Mobile */}
            <div
              className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 md:hidden ${
                isModalAnimating ? "opacity-0" : "opacity-30"
              }`}
              style={{ transitionDelay: isModalAnimating ? "0ms" : "1000ms" }}>
              <div className="flex items-center gap-2 bg-black bg-opacity-60 text-white px-4 py-2 rounded-full text-xs">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16l-4-4m0 0l4-4m-4 4h18"
                  />
                </svg>
                <span>Swipe to navigate</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </div>
            </div>

            {/* Image Counter */}
            <div
              className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                isModalAnimating
                  ? "opacity-0 translate-y-2"
                  : "opacity-100 translate-y-0"
              }`}
              style={{ transitionDelay: isModalAnimating ? "0ms" : "200ms" }}>
              {currentImageIndex + 1} / {data.images.length}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {data.images.length > 1 && (
            <div
              className={`absolute bottom-16 left-1/2 transform -translate-x-1/2 transition-all duration-300 ${
                isModalAnimating
                  ? "opacity-0 translate-y-4"
                  : "opacity-100 translate-y-0"
              }`}
              style={{ transitionDelay: isModalAnimating ? "0ms" : "250ms" }}>
              <div className="flex gap-2 max-w-xs overflow-x-auto pb-2 px-4">
                {data.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => {
                      if (index !== currentImageIndex) {
                        setImageTransition(true);
                        setTimeout(() => {
                          setCurrentImageIndex(index);
                          setSelectedImage(image);
                          setTimeout(() => setImageTransition(false), 50);
                        }, 150);
                      }
                    }}
                    className={`flex-shrink-0 w-12 h-12 rounded border-2 transition-all duration-200 overflow-hidden hover:scale-110 ${
                      index === currentImageIndex
                        ? "border-white shadow-lg"
                        : "border-gray-400 hover:border-gray-200 opacity-60 hover:opacity-80"
                    }`}
                    style={{ minWidth: "48px", minHeight: "48px" }}>
                    <img
                      src={`${process.env.REACT_APP_API}${image.image_data}`}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-200"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="min-h-screen bg-gray-100">
        {/* Header Navigation */}
        <div className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => navigate("/products")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="font-medium">Back to Products</span>
              </button>

              <div className="flex items-center gap-3 relative z-10">
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Images */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-lg shadow-sm sticky top-24 z-10">
                {/* Main Image */}
                <div className="aspect-square bg-gray-100 relative group overflow-hidden rounded-t-lg">
                  {selectedImage ? (
                    <div className="relative w-full h-full">
                      <img
                        src={`${process.env.REACT_APP_API}${selectedImage.image_data}`}
                        alt={data?.name || "Product image"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={openImageModal}
                      />

                      {/* Zoom Icon Overlay */}
                      <div
                        className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center cursor-pointer"
                        onClick={openImageModal}>
                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white bg-opacity-90 rounded-full p-2 transform scale-90 group-hover:scale-100">
                          <ZoomIn className="w-6 h-6 text-gray-700" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <svg
                        className="w-16 h-16 mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm font-medium">No image available</p>
                    </div>
                  )}

                  {/* Discount Badge */}
                  {totalDiscount > 0 && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                        -{totalDiscount}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {data?.images?.length > 1 && (
                  <div className="p-4">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {data.images.map((image, index) => (
                        <button
                          key={image.id}
                          onClick={() => handleImageSelect(image)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 transition-all duration-200 overflow-hidden cursor-pointer hover:scale-105 hover:shadow-md ${
                            selectedImage?.image_data === image.image_data
                              ? "border-green-500 shadow-lg scale-105"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          style={{ minWidth: "64px", minHeight: "64px" }}
                          type="button">
                          <img
                            src={`${process.env.REACT_APP_API}${image.image_data}`}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover pointer-events-none transition-transform duration-200 hover:scale-110"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Product Info */}
            <div className="lg:col-span-7">
              <div className="space-y-4">
                {/* Product Title & Rating */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 leading-tight">
                    {data?.name || "Untitled Product"}
                  </h1>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-1">
                        4.8 (127 reviews)
                      </span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <span className="text-sm text-gray-600">
                      {data?.views || 0} views
                    </span>
                  </div>

                  {/* Price Section */}
                  <div className="mb-6">
                    {totalDiscount > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl font-bold text-red-500">
                            {formatRupiah(discountedPrice)}
                          </span>
                          <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-semibold">
                            {totalDiscount}%
                          </span>
                        </div>
                        <div className="text-gray-500 text-lg line-through">
                          {formatRupiah(parseFloat(data?.price || 0))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-3xl font-bold text-gray-900">
                        {formatRupiah(productPrice)}
                      </span>
                    )}
                  </div>

                  {/* Promo Tags */}
                  {activePromotions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {activePromotions.map((promo) => (
                        <span
                          key={promo.id}
                          className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-medium border border-red-200">
                          🏷️ {promo.title}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Key Features */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span>Garansi Original</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <span>Free Shipping</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="w-4 h-4 text-yellow-600" />
                      <span>Best Seller</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                    <button
                      onClick={handleCheckout}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors shadow-sm relative z-20 cursor-pointer">
                      <ShoppingCart className="w-5 h-5" />
                      Daftar Sekarang
                    </button>

                    <button className="flex-1 flex items-center justify-center gap-2 border-2 border-green-600 text-green-600 hover:bg-green-50 py-3 px-6 rounded-lg font-semibold transition-colors relative z-20 cursor-pointer">
                      <MessageCircle className="w-5 h-5" />
                      Chat Seller
                    </button>
                  </div>
                </div>

                {/* Seller Info */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Seller Information
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">S</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        Store Name
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>⭐ 4.9 (1.2k reviews)</span>
                        <span>📍 Jakarta</span>
                      </div>
                    </div>
                    <button className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium relative z-10 cursor-pointer">
                      View Store
                    </button>
                  </div>
                </div>

                {/* Product Details */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Product Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Category</span>
                      <span className="font-medium text-gray-900">
                        {data?.categories?.[0]?.name || "Uncategorized"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Status</span>
                      <span
                        className={`font-medium ${
                          data.status ? "text-green-600" : "text-yellow-600"
                        }`}>
                        {data.status ? "Available" : "Draft"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Created</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(data?.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {data?.categories?.length > 0 && (
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {data.categories.map((category) => (
                        <span
                          key={category.id}
                          className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors cursor-pointer">
                          #{category.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Product Description
                  </h3>
                  {data?.description ? (
                    <div
                      className="prose max-w-none text-gray-700 leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                      dangerouslySetInnerHTML={{ __html: data.description }}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-400"
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
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        No description available
                      </h4>
                      <p className="text-gray-500">
                        {`This product doesn't have a description yet.`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductPreviewHome;
