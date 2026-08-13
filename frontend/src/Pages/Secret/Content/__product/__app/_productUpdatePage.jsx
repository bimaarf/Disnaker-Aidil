import React, { useEffect, useMemo, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import useIsMobile from "../../../../../Context/__useIsMobile";
import {
  fetchProduct as fetch,
  updateProduct,
} from "../../../../../features/product/productSlice";
import { fetchCategoryProducts } from "../../../../../features/product/categoryProductSlice";
import TopBarProgress from "react-topbar-progress-indicator";
import {
  formatRupiah,
  parseRupiahToInt,
} from "../../../../../utils/rupiahInput";
import { fetchPromotionProducts } from "../../../../../features/product/promotionProductSlice";
// import "../../../../../App.css";
const ProductUpdatePage = () => {
  const { key } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const dataProps = location.state?.dataProps;

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedPromotions, setSelectedPromotions] = useState([]);
  const [images, setImages] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const categories = useSelector(
    (state) => state.categoryProducts.categoryProducts || []
  );
  const promotions = useSelector(
    (state) => state.promotionProducts.promotionProducts || []
  );
  const { error } = useSelector((state) => state.products);

  const uniquePromotions = useMemo(() => {
    const seen = new Set();
    return promotions.filter((item) => {
      const duplicate = seen.has(item.id);
      seen.add(item.id);
      return !duplicate;
    });
  }, [promotions]);

  useEffect(() => {
    if (promotions.length === 0) {
      dispatch(fetchPromotionProducts({ pageFilter: 1, perPageFilter: 100 }))
        .unwrap()
        .catch(() => toast.error("Failed to load promotions."));
    }
  }, [dispatch, promotions]);
  const uniqueCategories = useMemo(() => {
    const seen = new Set();
    return categories.filter((item) => {
      const duplicate = seen.has(item.id);
      seen.add(item.id);
      return !duplicate;
    });
  }, [categories]);

  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategoryProducts({ pageFilter: 1, perPageFilter: 100 }))
        .unwrap()
        .catch(() => toast.error("Failed to load categories."));
    }
  }, [dispatch, categories]);

  const isMobile = useIsMobile();
  useEffect(() => {
    if (dataProps) {
      setName(dataProps.name || "");
      setPrice(formatRupiah(dataProps.price || 0));
      setDescription(dataProps.description || "");
      setStatus(!!dataProps.status);
      setSelectedCategories(dataProps.categories?.map((cat) => cat.id) || []);
      setSelectedPromotions(dataProps.promotions?.map((pro) => pro.id) || []);
      const images =
        dataProps.images?.map((img) => ({
          ...img,
          is_primary: !!img.is_primary,
        })) || [];
      setImages(images);
      setSelectedImage(images.find((img) => img.is_primary) || images[0]);
    } else if (key) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const productData = await dispatch(fetch(key)).unwrap();
          setName(productData.name || "");
          setPrice(formatRupiah(productData.price || ""));
          setDescription(productData.description || "");
          setStatus(!!productData.status);
          setSelectedCategories(
            productData.categories?.map((cat) => cat.id) || []
          );
          setSelectedPromotions(
            productData.promotions?.map((pro) => pro.id) || []
          );
          const images =
            productData.images?.map((img) => ({
              ...img,
              is_primary: !!img.is_primary,
            })) || [];
          setImages(images);
          setSelectedImage(images.find((img) => img.is_primary) || images[0]);
        } catch (err) {
          toast.error("Failed to fetch product data.");
          navigate("/product");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      navigate(isMobile && dataProps ? -2 : dataProps ? -1 : "/product");
    }
  }, [dispatch, key, dataProps, navigate, isMobile]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    const maxSize = 2 * 1024 * 1024;

    const validImages = files.filter((file) => {
      if (!validTypes.includes(file.type)) {
        toast.error(
          `Invalid file type: ${file.name}. Only JPEG, PNG, JPG, WebP allowed.`
        );
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`File too large: ${file.name}. Max size is 2MB.`);
        return false;
      }
      return true;
    });

    const newImages = validImages.map((file) => ({
      image_data: file,
      is_primary: false,
    }));

    setImages((prevImages) => {
      const updatedImages = [...prevImages, ...newImages];
      if (
        !updatedImages.some((img) => img.is_primary) &&
        updatedImages.length > 0
      ) {
        updatedImages[0].is_primary = true;
        setSelectedImage(updatedImages[0]);
      }
      return updatedImages;
    });
  };

  const togglePrimaryImage = (index) => {
    setImages((prevImages) => {
      const updatedImages = prevImages.map((img, i) => ({
        ...img,
        is_primary: i === index,
      }));
      setSelectedImage(updatedImages[index]);
      return updatedImages;
    });
  };

  const removeImage = (index) => {
    const image = images[index];
    if (image.id) {
      setImagesToRemove((prev) => [...prev, image.id]);
    }
    setImages((prevImages) => {
      const updatedImages = prevImages.filter((_, i) => i !== index);
      if (
        !updatedImages.some((img) => img.is_primary) &&
        updatedImages.length > 0
      ) {
        updatedImages[0].is_primary = true;
        setSelectedImage(updatedImages[0]);
      } else if (updatedImages.length === 0) {
        setSelectedImage(null);
      }
      return updatedImages;
    });
  };

  const handleImageSelect = (image) => {
    setSelectedImage(image);
  };

  const handlePromotionChange = (promotionId) => {
    setSelectedPromotions((prev) => {
      const exists = prev.includes(promotionId);
      if (exists) {
        return prev.filter((id) => id !== promotionId);
      }
      return [...prev, promotionId];
    });
  };
  const handleCategoryChange = (categoryId) => {
    setSelectedCategories((prev) => {
      const exists = prev.includes(categoryId);
      if (exists) {
        return prev.filter((id) => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (selectedCategories.length === 0) {
      toast.error("Please select at least one category");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      const parsedPrice = parseRupiahToInt(price);
      formData.append("price", parsedPrice);
      formData.append("description", description);
      formData.append("status", status ? 1 : 0);

      selectedPromotions.forEach((promotionId) => {
        formData.append("promotion_ids[]", String(promotionId));
      });
      selectedCategories.forEach((categoryId) => {
        formData.append("category_ids[]", String(categoryId));
      });

      const existingImages = images.filter((image) => image.id);
      existingImages.forEach((image, index) => {
        formData.append(`existing_images[${index}][id]`, image.id);
        formData.append(
          `existing_images[${index}][is_primary]`,
          image.is_primary ? 1 : 0
        );
      });

      const newImages = images.filter(
        (image) => image.image_data instanceof File
      );
      newImages.forEach((image, index) => {
        formData.append(`images[${index}]`, image.image_data);
        formData.append(`is_primary[${index}]`, image.is_primary ? 1 : 0);
      });

      imagesToRemove.forEach((id) => {
        formData.append("images_to_remove[]", id);
      });

      const response = await dispatch(
        updateProduct({ key, productData: formData })
      ).unwrap();
      if (!response.errors) {
        toast.success("Product updated successfully!");
        navigate(dataProps ? -1 : "/product");
      }
    } catch (err) {
      toast.error(
        "Error updating product: " + (err.message || "Unknown error")
      );
      // console.error("Update error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100">
      {loading && <TopBarProgress />}
      {/* Navbar */}
      <div className="navbar bg-base-100 shadow-sm border-b border-base-300 sticky top-0 z-40">
        <div className="navbar-start">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>
        </div>
        <div className="navbar-center">
          <span className="text-sm text-base-content/60">Update Product</span>
        </div>
        <div className="navbar-end">
          <button
            type="submit"
            form="product-update-form"
            className="btn btn-primary text-white btn-sm gap-2"
            disabled={loading || selectedCategories.length === 0}>
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <span className="material-symbols-outlined text-sm">save</span>
            )}
            {loading ? "Updating..." : "Save"}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <form id="product-update-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Section */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square bg-base-200 rounded-2xl overflow-hidden shadow-sm border border-base-300">
                {selectedImage ? (
                  <img
                    src={
                      selectedImage.image_data instanceof File
                        ? URL.createObjectURL(selectedImage.image_data)
                        : `${process.env.REACT_APP_API}${selectedImage.image_data}`
                    }
                    alt="Selected image"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-base-content/40">
                    <span className="material-symbols-outlined text-6xl mb-2">
                      image
                    </span>
                    <p className="text-sm">No image available</p>
                  </div>
                )}
              </div>

              {/* File Upload */}
              <div className="border p-4 border-base-300 rounded-lg bg-base-50">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                  multiple
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-4xl text-base-content/60">
                      upload
                    </span>
                    <span className="text-sm font-medium text-base-content">
                      Upload images
                    </span>
                    <span className="text-xs text-base-content/70">
                      JPEG, PNG, JPG, WebP up to 2MB
                    </span>
                  </div>
                </label>
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((image, index) => (
                    <div
                      key={image.id || `new-${index}`}
                      onClick={() => handleImageSelect(image)}
                      className={`aspect-square relative rounded-lg overflow-hidden cursor-pointer ${
                        selectedImage === image
                          ? "ring-2 ring-primary ring-offset-2"
                          : "ring-1 ring-base-300 opacity-50 hover:opacity-90"
                      }`}>
                      <img
                        src={
                          image.image_data instanceof File
                            ? URL.createObjectURL(image.image_data)
                            : `${process.env.REACT_APP_API}${image.image_data}`
                        }
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-0 right-0 p-1 flex gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePrimaryImage(index);
                          }}
                          className={`btn btn-circle btn-xs btn-${
                            image.is_primary
                              ? "primary text-white"
                              : "ghost bg-white/80 hover:bg-white dark:bg-base-200/80 dark:hover:bg-base-200"
                          }`}
                          title={
                            image.is_primary
                              ? "Primary Image"
                              : "Set as Primary"
                          }>
                          <span className="material-symbols-outlined text-xs">
                            star
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          className="btn btn-circle btn-xs btn-error text-white"
                          title="Remove Image">
                          <span className="material-symbols-outlined text-xs">
                            delete
                          </span>
                        </button>
                      </div>
                      {image.is_primary && (
                        <span className="absolute bottom-2 left-2 badge badge-primary badge-sm text-white">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Fields Section */}
            <div className="space-y-6">
              {/* Title & Status */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`badge badge-${
                      status ? "badge-success" : "badge-warning"
                    } gap-2`}>
                    <span className="material-symbols-outlined text-xs">
                      {status ? "check_circle" : "pending"}
                    </span>
                    {status ? "Published" : "Draft"}
                  </div>
                </div>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input w-full font-semibold bg-base-100 text-base-content border-b border-base-300 focus:border-primary focus:ring-none dark:bg-base-100 dark:border-base-200"
                  placeholder="Enter your product title..."
                  required
                />
                {error?.name && (
                  <p className="text-red-500 text-sm mt-1">{error.name}</p>
                )}
              </div>

              {/* Categories & Status */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      label
                    </span>
                    Categories
                  </h3>
                  <div className="bg-base-50 rounded-xl p-4 border border-base-300 max-h-64 overflow-y-auto">
                    {uniqueCategories.length > 0 ? (
                      <div className="space-y-2">
                        {uniqueCategories.map((category) => (
                          <label
                            key={category.id}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-base-100 transition-colors cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(category.id)}
                              onChange={() => handleCategoryChange(category.id)}
                              className="checkbox checkbox-primary"
                            />
                            <span className="text-sm font-medium text-base-content">
                              {category.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-base-content/60 text-sm py-4">
                        No categories available
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-base-content/60">
                    Selected: {selectedCategories.length} categories
                  </p>
                </div>

                {/* promotions */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      label
                    </span>
                    Promotions
                  </h3>
                  <div className="bg-base-50 rounded-xl p-4 border border-base-300 max-h-64 overflow-y-auto">
                    {uniquePromotions.length > 0 ? (
                      <div className="space-y-2">
                        {uniquePromotions.map((promotion) => (
                          <label
                            key={promotion.id}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-base-100 transition-colors cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedPromotions.includes(
                                promotion.id
                              )}
                              onChange={() =>
                                handlePromotionChange(promotion.id)
                              }
                              className="checkbox checkbox-primary"
                            />
                            <span className="text-sm font-medium text-base-content">
                              {promotion.title}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-base-content/60 text-sm py-4">
                        No promotions available
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-base-content/60">
                    Selected: {selectedPromotions.length} Promotions
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      verified
                    </span>
                    Publication Status
                  </h3>
                  <div className="bg-base-50 rounded-xl p-4 border border-base-300">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="font-semibold text-base-content">
                          {status ? "Published" : "Draft"}
                        </span>
                        <p className="text-sm text-base-content/70 mt-1">
                          {status
                            ? "Your product will be visible to everyone"
                            : "Your product will be saved as a draft"}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary toggle-lg"
                        checked={status}
                        onChange={(e) => setStatus(e.target.checked)}
                      />
                    </label>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      attach_money
                    </span>
                    Price
                  </h3>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(formatRupiah(e.target.value))}
                    className="input w-full font-semibold bg-base-100 text-base-content border-b border-base-300 focus:border-primary focus:ring-none dark:bg-base-100 dark:border-base-200"
                    placeholder="Rp 0"
                    required
                  />
                  {error?.price && (
                    <p className="text-red-500 text-sm mt-1">{error.price}</p>
                  )}
                </div>
              </div>

              {/* Description */}
            </div>
          </div>
          <div className="mt-12 border-t border-base-300 pt-8">
            <div className="border-t border-base-300 pt-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  description
                </span>
                Content
              </h3>
              <div className="rounded-xl border border-base-300 dark:border-base-300 bg-gray-50 dark:bg-base-300">
                <ReactQuill
                  value={description}
                  onChange={setDescription}
                  theme="snow"
                  className="react-quill modern-quill"
                  placeholder="Write your product content here..."
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ["bold", "italic", "underline", "strike"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["blockquote", "code-block"],
                      ["link", "image"],
                      ["clean"],
                    ],
                  }}
                />
              </div>
              {error?.description && (
                <p className="text-red-500 text-sm mt-2">{error.description}</p>
              )}
            </div>
          </div>
          {/* Submit Button */}
          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline px-4"
              disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary text-white px-4 gap-2"
              disabled={loading || selectedCategories.length === 0}>
              {loading && (
                <span className="loading loading-spinner loading-sm"></span>
              )}
              {loading ? "Updating..." : "Update Product"}
            </button>
          </div>
          {selectedCategories.length === 0 && (
            <p className="text-red-500 text-sm mt-2 text-right">
              Please select at least one category
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProductUpdatePage;
