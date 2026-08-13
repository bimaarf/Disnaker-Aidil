import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fetchProduct } from "../../../../../features/product/productSlice";
import { addToCart } from "../../../../../features/product/cartSlice";
import { CircularLoader } from "../../../../../Components/_CircularLoader";
import { formatRupiah } from "../../../../../utils/rupiahInput";

const ProductPreviewPage = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const products = useSelector((state) => state.products.products);
  const status = useSelector((state) => state.products.status);
  const user = useSelector((state) => state.auth.user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProductData = async () => {
      if (!key || key === "undefined" || key.trim() === "") {
        console.error("Invalid product key:", key);
        toast.error("Invalid product URL. Please select a valid product.");
        navigate("/products");
        setLoading(false);
        return;
      }

      try {
        const cachedProduct = products.find((product) => product.key === key);
        if (cachedProduct) {
          console.log("Using cached product:", cachedProduct);
          setData(cachedProduct);
          const primaryImage =
            cachedProduct?.images?.find(
              (image) => image.is_primary === 1 || image.is_primary === "1"
            ) || cachedProduct?.images?.[0];
          setSelectedImage(primaryImage);
          setLoading(false);
          return;
        }

        const productData = await dispatch(fetchProduct({ key })).unwrap();
        console.log("Fetched product data:", productData);
        setData(productData);
        const primaryImage =
          productData?.images?.find(
            (image) => image.is_primary === 1 || image.is_primary === "1"
          ) || productData?.images?.[0];
        setSelectedImage(primaryImage);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching product:", err);
        const errorMessage =
          err?.message?.includes("404") || err?.message?.includes("not found")
            ? "Product not found or not accessible."
            : "Failed to load product data.";
        toast.error(errorMessage);
        navigate("/products");
        setLoading(false);
      }
    };

    fetchProductData();
  }, [key, dispatch, products, navigate]);

  const handleImageSelect = (image) => {
    setSelectedImage(image);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
  };

  const handleEditData = (data) => {
    navigate(`/product/update/${data.key}`, {
      state: { key: data.key, dataProps: data },
    });
  };

  const handleCheckout = () => {
    if (!user) {
      toast.error("Please log in to proceed to checkout");
      navigate("/login");
      return;
    }
    if (!data?.status) {
      toast.error("This product is not available for purchase");
      return;
    }
    navigate(`/cart`, {
      state: { preSelectedProduct: data },
    });
  };

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please log in to add to cart");
      navigate("/login");
      return;
    }
    if (!data?.status) {
      toast.error("This product is not available for purchase");
      return;
    }
    dispatch(addToCart({ productId: data.id, quantity }))
      .unwrap()
      .then(() => {
        toast.success("Product added to cart");
      })
      .catch((error) => {
        toast.error(error || "Failed to add product to cart");
      });
  };

  if (loading && status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <CircularLoader />
      </div>
    );
  }

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
    <div className="min-h-screen bg-base-100">
      <nav className="navbar bg-base-100 shadow-sm border-b border-base-300 sticky top-0 z-40 px-4 sm:px-6">
        <div className="navbar-start">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm gap-2 text-base font-medium">
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>
        </div>
        <div className="navbar-center">
          <span className="text-base font-semibold text-base-content/80">
            Product Preview
          </span>
        </div>
        <div className="navbar-end">
          <button
            onClick={() => handleEditData(data)}
            className="btn btn-primary btn-sm gap-2 text-white font-medium disabled:opacity-50"
            disabled={!user?.is_super_admin}>
            <span className="material-symbols-outlined text-base">edit</span>
            Edit
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="space-y-4">
            <div className="aspect-square bg-base-200 rounded-xl overflow-hidden shadow-md border border-base-300">
              {selectedImage ? (
                <img
                  src={`${process.env.REACT_APP_API}${selectedImage.image_data}`}
                  alt={data?.name || "Product image"}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 rounded-xl"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-base-content/40">
                  <span className="material-symbols-outlined text-5xl sm:text-6xl mb-2">
                    image
                  </span>
                  <p className="text-sm sm:text-base">No image available</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
              {data?.images?.map((image) => (
                <div
                  key={image.id}
                  onClick={() => handleImageSelect(image)}
                  className={`aspect-square bg-base-200 rounded-lg cursor-pointer hover:ring-2 hover:ring-primary transition-all duration-200 ${
                    selectedImage?.image_data === image.image_data
                      ? "ring-2 ring-primary"
                      : "ring-1 ring-base-300"
                  }`}>
                  <img
                    src={`${process.env.REACT_APP_API}${image.image_data}`}
                    alt={`Thumbnail ${image.id}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                <div
                  className={`badge badge-${
                    data.status ? "success" : "warning"
                  } gap-2 text-sm font-medium`}>
                  <span className="material-symbols-outlined text-xs">
                    {data.status ? "check_circle" : "pending"}
                  </span>
                  {data.status ? "Published" : "Draft"}
                </div>
                <span className="text-sm text-base-content/60">
                  Created {formatDate(data?.created_at)}
                </span>
              </div>
              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-base-content leading-tight"
                style={{ fontSize: "clamp(1.5rem, 5vw, 2.25rem)" }}>
                {data?.name || "Untitled Product Post"}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-base-content/60">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">
                    visibility
                  </span>
                  <span>{data?.views || 0} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">
                    favorite
                  </span>
                  <span>{data?.likes || 0} likes</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">
                    share
                  </span>
                  <span>{data?.shares || 0} shares</span>
                </div>
              </div>
              {activePromotions.length > 0 && (
                <div className="bg-primary/5 p-4 sm:p-5 rounded-xl border-2 border-dashed border-primary/50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-blue-600 text-lg">
                      local_offer
                    </span>
                    <span className="font-semibold text-blue-700 text-base sm:text-lg">
                      Promo
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activePromotions.map((promo) => (
                      <span
                        key={promo.id}
                        className="bg-error/10 text-error px-3 py-1 rounded-full text-sm font-medium">
                        {promo.discount_percentage}% - {promo.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-base-200/10 p-4 sm:p-5 rounded-xl border border-base-300">
                <div className="flex flex-wrap items-center gap-3">
                  {totalDiscount > 0 ? (
                    <>
                      <span className="text-base-content/50 text-sm sm:text-base line-through">
                        {formatRupiah(parseFloat(data?.price || 0))}
                      </span>
                      <span className="text-lg sm:text-xl font-bold text-primary">
                        {formatRupiah(discountedPrice)}
                      </span>
                      <div className="badge bg-warning/10 text-warning text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-xs">Hemat:</span>
                          <span className="text-sm">
                            {formatRupiah(
                              parseFloat(data?.price || 0) - discountedPrice
                            )}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <span className="text-lg sm:text-xl font-semibold text-primary">
                      {formatRupiah(productPrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="input input-bordered w-20 sm:w-24 text-base h-10"
                />
                <button
                  onClick={handleAddToCart}
                  className="btn btn-primary text-white h-10 min-h-10 text-base font-medium gap-2 disabled:opacity-50"
                  disabled={!data?.status}>
                  <span className="material-symbols-outlined text-base">
                    garden_cart
                  </span>
                  Add to Cart
                </button>
              </div>
              <button
                onClick={handleCheckout}
                className="btn btn-primary text-white h-10 min-h-10 text-base font-medium flex-1 gap-2 disabled:opacity-50"
                disabled={!data?.status}>
                <span className="material-symbols-outlined text-base">
                  garden_cart
                </span>
                Checkout
              </button>
              <button className="btn btn-outline h-10 min-h-10 text-base font-medium gap-2">
                <span className="material-symbols-outlined text-base">
                  share
                </span>
                Share
              </button>
              <button className="btn btn-outline btn-square h-10 min-h-10">
                <span className="material-symbols-outlined text-base">
                  favorite
                </span>
              </button>
            </div>
            <div className="space-y-6">
              <div className="border-t border-base-300 pt-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-4">
                  Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
                  <div>
                    <span className="text-base-content/60">Status:</span>
                    <p className="font-medium">
                      {data.status ? "Published" : "Draft"}
                    </p>
                  </div>
                  <div>
                    <span className="text-base-content/60">Created:</span>
                    <p className="font-medium">
                      {formatDate(data?.created_at)}
                    </p>
                  </div>
                  <div>
                    <span className="text-base-content/60">Category:</span>
                    <p className="font-medium">
                      {data?.categories?.[0]?.name || "Uncategorized"}
                    </p>
                  </div>
                  <div>
                    <span className="text-base-content/60">Price:</span>
                    <p className="font-medium">
                      {formatRupiah(parseFloat(data?.price || 0))}
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t border-base-300 pt-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {data?.categories?.map((category) => (
                    <span
                      key={category.id}
                      className="badge badge-neutral text-sm">
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 sm:mt-12 border-t border-base-300 pt-8">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg sm:text-xl">
              description
            </span>
            Content
          </h3>
          <div className="bg-base-100 rounded-xl p-4 sm:p-6 border border-base-300 shadow-sm">
            {data?.description ? (
              <div
                className="prose prose-sm sm:prose-base max-w-none text-base-content/80 leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                dangerouslySetInnerHTML={{ __html: data.description }}
              />
            ) : (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl sm:text-5xl opacity-20 mb-2 block">
                  description
                </span>
                <p className="text-base-content/50 text-base sm:text-lg">
                  No content available
                </p>
                <p className="text-sm sm:text-base text-base-content/30 mt-1">
                  {`This product post doesn't have any content yet`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPreviewPage;
