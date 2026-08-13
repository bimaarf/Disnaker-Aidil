import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CircularProgress } from "@mui/material";
import { createPromotionProduct } from "../../../../../features/product/promotionProductSlice";
import {
  PlusCircle,
  ArrowLeft,
  Tag,
  Save,
  Calendar,
  Code,
  Image,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

const PromotionSection = ({
  icon: Icon,
  title,
  children,
  gradient,
  themeClasses,
}) => {
  const gradientBr = gradient.replace("to-r", "to-br");

  return (
    <div
      className={`${themeClasses?.card} rounded-2xl border border-base-300/50 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300`}>
      <div className={`h-1 bg-gradient-to-r ${gradient}`}></div>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientBr} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h3 className={`text-lg font-semibold ${themeClasses?.text}`}>
            {title}
          </h3>
        </div>
        {children}
      </div>
    </div>
  );
};

const PromotionProductCreatePage = () => {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [expired, setExpired] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useSelector((state) => state.themes.localTheme);
  const { error } = useSelector((state) => state.promotionProducts);
  const [localError, setLocalError] = useState(null);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleStatusChange = () => {
    setStatus(!status);
  };

  const handleReferralCodeChange = (e) => {
    setReferralCode(e.target.value);
  };

  const handleExpiredChange = (e) => {
    setExpired(e.target.value);
  };
  const handleDiscountPercentageChange = (e) => {
    let value = e.target.value.replace(",", ".");

    // Hanya izinkan angka + desimal dengan 1 digit maksimum
    const regex = /^\d*\.?\d{0,1}$/;
    if (regex.test(value)) {
      setDiscountPercentage(value);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please select a valid image file (JPEG, PNG, JPG, WEBP)");
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size should not exceed 2MB");
        return;
      }

      setImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  useEffect(() => {
    if (error) {
      setLocalError(error);
    } else {
      setLocalError(null);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("status", status ? 1 : 0);
    if (referralCode) formData.append("referral_code", referralCode);
    if (expired) formData.append("expired", expired);
    if (discountPercentage) {
      const parsed = parseFloat(discountPercentage.replace(",", "."));
      if (!isNaN(parsed)) {
        const fixed = parsed.toFixed(1); 
        formData.append("discount_percentage", fixed);
      }
    }

    if (image) formData.append("image", image);

    try {
      await dispatch(createPromotionProduct(formData)).unwrap();
      navigate("/promotion/product");
      toast.success("Promotion created successfully!");
    } catch (err) {
      toast.error("Validation error occurred. Please check the fields.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/promotion/product");
  };

  const getThemeClasses = () => {
    if (theme === "wireframe") {
      return {
        container: "bg-base-300/25",
        card: "bg-base-100",
        header: "bg-base-100/90",
        input:
          "bg-base-100 border-base-300 focus:border-blue-500 text-base-content",
        button: "bg-blue-600 hover:bg-blue-700 text-white",
        cancelButton:
          "bg-base-200 hover:bg-base-300 text-base-content border-base-300",
        text: "text-base-content",
        muted: "text-base-content/60",
      };
    } else {
      return {
        container: "bg-base-300/25 dark:bg-base-100",
        card: "bg-base-100 dark:bg-base-200",
        header: "bg-base-100/90 dark:bg-base-200/90",
        input:
          "bg-base-100 dark:bg-base-300 border-base-300 dark:border-base-600 focus:border-blue-500 dark:focus:border-blue-400 text-base-content",
        button:
          "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white",
        cancelButton:
          "bg-base-200 hover:bg-base-300 dark:bg-base-600 dark:hover:bg-base-700 text-base-content border-base-300 dark:border-base-600",
        text: "text-base-content",
        muted: "text-base-content/60 dark:text-base-content/70",
      };
    }
  };

  const themeClasses = getThemeClasses();

  const renderErrorMessages = (error) => {
    if (typeof error === "object" && error !== null) {
      return Object.keys(error).map((key) => {
        const messages = error[key];
        if (Array.isArray(messages)) {
          return messages.map((message, index) => (
            <div key={index} className="text-xs text-red-500 mt-1">
              {message}
            </div>
          ));
        }
        return null;
      });
    }
    return null;
  };

  return (
    <div className={`min-h-screen ${themeClasses.container} p-1 md:p-6`}>
      {/* Header */}
      <div
        className={`${themeClasses.header} backdrop-blur-xl border-b border-base-300/50 rounded-t-2xl mb-6`}>
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-start md:items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={handleBack}
                className="w-10 h-10 bg-base-200 hover:bg-base-300 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105">
                <ArrowLeft className="w-5 h-5 text-base-content" />
              </button>

              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <PlusCircle className="w-6 h-6 text-white" />
              </div>

              <div>
                <h1
                  className={`text-xl md:text-3xl font-bold ${themeClasses.text}`}>
                  Create Promotion
                </h1>
                <p className={`text-sm ${themeClasses.muted} mt-1`}>
                  Tambahkan promosi produk baru
                </p>
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
                <CircularProgress size={16} />
                <span className="text-sm font-medium text-blue-700">
                  Membuat...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        <form
          onSubmit={handleSubmit}
          className="gap-2 md:gap-6 grid grid-cols-1">
          {/* Basic Information Section */}
          <PromotionSection
            themeClasses={themeClasses}
            icon={Tag}
            title="Basic Information"
            gradient="from-blue-500 to-blue-600">
            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label
                  className={`block text-sm font-medium ${themeClasses.muted}`}>
                  Judul Promosi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    className={`w-full px-4 py-3 rounded-xl ${themeClasses.input} transition-all duration-100 placeholder:text-base-content/50`}
                    placeholder="Masukkan judul promosi..."
                    required
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <Tag className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
                {!title.trim() && (
                  <p className="text-xs text-red-500 mt-1">
                    Judul promosi wajib diisi
                  </p>
                )}
                {localError?.title &&
                  renderErrorMessages({ title: localError.title })}
              </div>

              {/* Status Toggle */}
              <div className="space-y-2">
                <label
                  className={`block text-sm font-medium ${themeClasses.muted}`}>
                  Status Promosi
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleStatusChange}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200
                      ${
                        status
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-red-100 text-red-700 border border-red-200"
                      }
                    `}>
                    {status ? (
                      <>
                        <ToggleRight className="w-5 h-5" />
                        <span className="text-sm font-medium">Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5" />
                        <span className="text-sm font-medium">Inactive</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              {/* Discount Percentage */}
              <div className="space-y-2">
                <label
                  className={`block text-sm font-medium ${themeClasses.muted}`}>
                  Diskon (%) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={discountPercentage}
                    onChange={handleDiscountPercentageChange}
                    onBlur={() => {
                      const normalized = discountPercentage.replace(",", ".");
                      const parsed = parseFloat(normalized);
                      if (!isNaN(parsed)) {
                        setDiscountPercentage(parsed.toFixed(1)); // <= hanya 1 digit
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-xl ${themeClasses.input} transition-all duration-100`}
                    placeholder="Masukkan persentase diskon (misalnya 25.50)"
                    title="Masukkan angka maksimal 2 digit di belakang koma"
                  />

                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <span className="text-sm text-purple-500 font-semibold">
                      %
                    </span>
                  </div>
                </div>
                {localError?.discount_percentage &&
                  renderErrorMessages({
                    discount_percentage: localError.discount_percentage,
                  })}
              </div>
            </div>
          </PromotionSection>

          {/* Promotion Details Section */}
          <PromotionSection
            themeClasses={themeClasses}
            icon={Code}
            title="Promotion Details"
            gradient="from-purple-500 to-purple-600">
            <div className="space-y-6">
              {/* Referral Code */}
              <div className="space-y-2">
                <label
                  className={`block text-sm font-medium ${themeClasses.muted}`}>
                  Kode Referral
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={handleReferralCodeChange}
                    className={`w-full px-4 py-3 rounded-xl ${themeClasses.input} transition-all duration-100 placeholder:text-base-content/50`}
                    placeholder="Masukkan kode referral (opsional)..."
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <Code className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
                {localError?.referral_code &&
                  renderErrorMessages({
                    referral_code: localError.referral_code,
                  })}
              </div>

              {/* Expired Date */}
              <div className="space-y-2">
                <label
                  className={`block text-sm font-medium ${themeClasses.muted}`}>
                  Tanggal Kadaluarsa
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={expired}
                    onChange={handleExpiredChange}
                    className={`w-full px-4 py-3 rounded-xl ${themeClasses.input} transition-all duration-100`}
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <Calendar className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
                {localError?.expired &&
                  renderErrorMessages({ expired: localError.expired })}
              </div>
            </div>
          </PromotionSection>

          {/* Image Section */}
          <PromotionSection
            themeClasses={themeClasses}
            icon={Image}
            title="Promotion Image"
            gradient="from-green-500 to-green-600">
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  className={`block text-sm font-medium ${themeClasses.muted}`}>
                  Gambar Promosi
                </label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="image-upload"
                    className={`
                      flex flex-col items-center justify-center w-full h-64 border-2 border-dashed 
                      rounded-xl cursor-pointer hover:bg-base-50 transition-all duration-200
                      ${themeClasses.input} border-base-300 hover:border-green-400
                    `}>
                    {imagePreview ? (
                      <div className="relative w-full h-full">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Image className="w-10 h-10 mb-3 text-green-500" />
                        <p className="mb-2 text-sm text-base-content/70">
                          <span className="font-semibold">Click to upload</span>{" "}
                          gambar promosi
                        </p>
                        <p className="text-xs text-base-content/50">
                          PNG, JPG, JPEG, WEBP (MAX. 2MB)
                        </p>
                      </div>
                    )}
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {localError?.image &&
                  renderErrorMessages({ image: localError.image })}
              </div>
            </div>
          </PromotionSection>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={handleBack}
              className={`
                px-6 py-3 rounded-xl text-base font-medium transition-all duration-200 
                hover:scale-[1.02] active:scale-[0.98] border-2
                ${themeClasses.cancelButton}
              `}>
              Batal
            </button>

            <button
              type="submit"
              disabled={loading || !title.trim()}
              className={`
                relative px-8 py-4 rounded-2xl text-base font-semibold
                ${themeClasses.button}
                shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30
                transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                flex items-center gap-3 min-w-[180px] justify-center
                border border-blue-500/20
              `}>
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Save className="w-5 h-5" />
              )}

              <span>{loading ? "Membuat..." : "Buat Promosi"}</span>

              {/* Shine effect */}
              <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-all duration-700"></div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromotionProductCreatePage;
