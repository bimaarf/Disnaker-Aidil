import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Home,
  Lock,
  Mail,
  User,
  Phone,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  register,
  setErrors,
  clearErrors,
} from "../features/authentication/AuthSlice";
import { fetchLogos } from "../features/LandingPages/logoSlice";
import PhoneNumberInput from "../Pages/Secret/Components/phoneNumberInput";
import React, { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { CircularLoader } from "./_CircularLoader";

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    phoneNumber: "",
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((state) => state.auth);
  const logo = useSelector((state) => state.logos.logos);
  const status = useSelector((state) => state.logos.status);
  useEffect(() => {
    const getLogo = async () => {
      try {
        await dispatch(fetchLogos()).unwrap();
      } catch (error) {
        console.error("Failed to fetch logos:", error);
      }
    };
    if (status === "idle") {
      getLogo();
    }
  }, [dispatch]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  // Password strength checker
  useEffect(() => {
    const calculatePasswordStrength = (password) => {
      let strength = 0;
      if (password.length >= 8) strength += 1;
      if (/[A-Z]/.test(password)) strength += 1;
      if (/[a-z]/.test(password)) strength += 1;
      if (/[0-9]/.test(password)) strength += 1;
      if (/[^A-Za-z0-9]/.test(password)) strength += 1;
      return strength;
    };
    setPasswordStrength(calculatePasswordStrength(formData.password));
  }, [formData.password]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Silakan upload file gambar yang valid.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran gambar melebihi 5MB.");
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview("");
  };

  const renderErrorMessages = (field) => {
    const fieldErrors = error?.[field];
    if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
      return fieldErrors.map((message, index) => (
        <div
          key={index}
          className="flex items-center gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-red-600 text-sm">{message}</span>
        </div>
      ));
    }
    return null;
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return "bg-red-500";
      case 2:
        return "bg-yellow-500";
      case 3:
        return "bg-orange-500";
      case 4:
      case 5:
        return "bg-green-500";
      default:
        return "bg-gray-300";
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return "Lemah";
      case 2:
        return "Sedang";
      case 3:
        return "Kuat";
      case 4:
      case 5:
        return "Sangat Kuat";
      default:
        return "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Clean phone number client-side

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("password", formData.password);
    formDataToSend.append("passwordConfirm", formData.passwordConfirm);
    formDataToSend.append("phone_number", formData.phoneNumber);

    if (image) {
      formDataToSend.append("image", image);
    }

    try {
      const result = await dispatch(register(formDataToSend)).unwrap();
      toast.success(
        "Pendaftaran berhasil! OTP telah dikirim ke WhatsApp Anda."
      );
      navigate(`/verify-otp?user_id=${result.user_id}&type=registration`);
    } catch (err) {
      const validationErrors = err || {};
      dispatch(setErrors(validationErrors));

      if (validationErrors.message) {
        toast.error(validationErrors.message);
      } else if (validationErrors.errors) {
        Object.keys(validationErrors.errors).forEach((field) => {
          const fieldError = validationErrors.errors[field];
          if (Array.isArray(fieldError)) {
            toast.error(`${field}: ${fieldError.join(", ")}`);
          } else if (typeof fieldError === "string") {
            toast.error(`${field}: ${fieldError}`);
          }
        });
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = () => {
    dispatch(clearErrors());
  };

  return (
    <div className="min-h-screen pt-[10vh] bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4 py-8">
      {/* Background Pattern and Elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1a1d47]/5 to-[#2d3166]/5"></div>
      <div className="absolute top-20 left-10 w-32 h-32 bg-[#1a1d47]/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-[#2d3166]/10 rounded-full blur-lg animate-bounce"></div>
      <div className="absolute top-32 right-10 w-16 h-16 bg-[#1a1d47]/20 rounded-full blur-lg animate-bounce"></div>
      <div className="absolute bottom-32 left-20 w-20 h-20 bg-[#2d3166]/15 rounded-full blur-md animate-pulse delay-1000"></div>

      {/* Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231a1d47' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>

      {/* Enhanced Loading Overlay with Blue Theme */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/40 text-center max-w-md mx-4 transform transition-all duration-500 animate-fadeIn">
            {/* Multi-layer Loading Spinner */}
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-spin mx-auto"></div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 border-4 border-[#1a1d47] border-t-transparent rounded-full animate-spin"></div>
              <div
                className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-12 border-2 border-[#2d3166] border-b-transparent rounded-full animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1s",
                }}></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Heart className="w-6 h-6 text-[#1a1d47] animate-pulse" />
              </div>
            </div>

            {/* Loading Text */}
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Sedang Mendaftar...
            </h3>
            <p className="text-gray-600 mb-4">
              Mohon tunggu, kami sedang memproses data Anda
            </p>

            {/* Progress Bar with Blue Gradient */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#1a1d47] to-[#2d3166] h-full rounded-full animate-pulse"
                style={{ width: "70%" }}></div>
            </div>

            {/* Animated Dots with Blue Colors */}
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-[#1a1d47] rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-[#1a1d47] rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}></div>
              <div
                className="w-2 h-2 bg-[#2d3166] rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}></div>
              <div
                className="w-2 h-2 bg-[#2d3166] rounded-full animate-bounce"
                style={{ animationDelay: "0.3s" }}></div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Panel - Enhanced Welcome Section with Blue Theme */}
          <div className="hidden lg:block">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <div className="p-4 bg-gradient-to-br from-[#1a1d47] to-[#2d3166] rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  {logo?.image ? (
                    <img
                      src={logo.image}
                      alt="Logo"
                      className="w-20 h-20 object-contain"
                    />
                  ) : (
                    <Heart className="w-20 h-20 text-white" />
                  )}
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-[#1a1d47] to-[#2d3166] bg-clip-text text-transparent">
                  Selamat Datang
                </span>
                <br />
                <span className="bg-gradient-to-r from-[#2d3166] to-[#1a1d47] bg-clip-text text-transparent italic">
                  Dinas Ketenagakerjaan
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-md mx-auto mb-8 leading-relaxed">
                Daftar akun baru untuk mulai berkontribusi pada pelestarian
                Kalimantan
              </p>

              {/* Enhanced Feature List with Blue Accents */}
              <div className="space-y-4 text-left">
                {[
                  {
                    text: "Pendaftaran mudah dan cepat",
                    delay: "0s",
                    icon: "📝",
                  },
                  { text: "Data terlindungi aman", delay: "0.1s", icon: "🔒" },
                  {
                    text: "Mulai kontribusi Anda",
                    delay: "0.2s",
                    icon: "🌱",
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl hover:bg-white/80 transition-all duration-300 transform hover:translate-x-2 border border-gray-100/50"
                    style={{ animationDelay: feature.delay }}>
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-sm">
                      {feature.icon}
                    </div>
                    <span className="text-gray-700 font-medium">
                      {feature.text}
                    </span>
                    <CheckCircle className="w-5 h-5 text-[#1a1d47] ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Enhanced Register Form with Blue Theme */}
          <div className="w-full">
            <div className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-gray-100/30 hover:shadow-3xl transition-shadow duration-500">
              <div className="lg:hidden flex justify-center mb-6">
                <div className="p-4 bg-gradient-to-br from-[#1a1d47] to-[#2d3166] rounded-2xl shadow-lg">
                  {logo?.image ? (
                    <img
                      src={logo.image}
                      alt="Logo"
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <Heart className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-[#1a1d47] to-[#2d3166] bg-clip-text text-transparent mb-2">
                  Daftar Akun Baru
                </h2>
                <p className="text-gray-600">
                  Lengkapi data diri Anda untuk mendaftar
                </p>
              </div>

              {/* Register Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-4 border-white shadow-lg hover:from-gray-200 hover:to-gray-300 transition-colors">
                          <Upload className="w-8 h-8 text-gray-500" />
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Foto Profil (Opsional)
                    </p>
                  </div>
                </div>

                {/* Name Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Nama Lengkap
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 group-hover:text-[#1a1d47] transition-colors" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onFocus={handleFocus}
                      disabled={loading}
                      className={`w-full pl-10 landing-input pr-4 py-3 bg-white/70 backdrop-blur-sm border rounded-xl focus:ring-2 focus:ring-[#1a1d47] focus:border-transparent transition-all duration-300 text-gray-700 placeholder-gray-400 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-white/80 focus:bg-white/90 ${
                        error?.name ? "border-red-300" : "border-gray-200/50"
                      }`}
                      placeholder="Masukkan nama lengkap"
                      required
                    />
                  </div>
                  {renderErrorMessages("name")}
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Alamat Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-hover:text-[#1a1d47] transition-colors" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onFocus={handleFocus}
                      disabled={loading}
                      className={`w-full pl-10 landing-input pr-4 py-3 bg-white/70 backdrop-blur-sm border rounded-xl focus:ring-2 focus:ring-[#1a1d47] focus:border-transparent transition-all duration-300 text-gray-700 placeholder-gray-400 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-white/80 focus:bg-white/90 ${
                        error?.email ? "border-red-300" : "border-gray-200/50"
                      }`}
                      placeholder="contoh@email.com"
                      required
                    />
                  </div>
                  {renderErrorMessages("email")}
                </div>

                {/* Phone Number Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Nomor Telepon
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400 group-hover:text-[#1a1d47] transition-colors" />
                    </div>
                    <div className="pl-10 w-full">
                      <PhoneNumberInput
                        lightForce={true}
                        initialValue={formData.phoneNumber}
                        onChange={(formattedPhone) =>
                          setFormData((prev) => ({
                            ...prev,
                            phoneNumber: formattedPhone,
                          }))
                        }
                        onFocus={handleFocus}
                        disabled={loading}
                        className={`w-full landing-input py-3 pl-4 bg-white/70 backdrop-blur-sm border rounded-xl focus:ring-2 focus:ring-[#1a1d47] focus:border-transparent transition-all duration-300 text-gray-700 placeholder-gray-400 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-white/80 focus:bg-white/90 ${
                          error?.phone_number
                            ? "border-red-300"
                            : "border-gray-200/50"
                        }`}
                      />
                    </div>
                  </div>
                  {renderErrorMessages("phone_number")}
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Kata Sandi
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-hover:text-[#1a1d47] transition-colors" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onFocus={handleFocus}
                      disabled={loading}
                      className={`w-full pl-10 landing-input pr-12 py-3 bg-white/70 backdrop-blur-sm border rounded-xl focus:ring-2 focus:ring-[#1a1d47] focus:border-transparent transition-all duration-300 text-gray-700 placeholder-gray-400 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-white/80 focus:bg-white/90 ${
                        error?.password
                          ? "border-red-300"
                          : "border-gray-200/50"
                      }`}
                      placeholder="Masukkan kata sandi"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50/50 rounded-r-xl transition-all duration-200">
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-[#1a1d47]" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-[#1a1d47]" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                            style={{
                              width: `${(passwordStrength / 5) * 100}%`,
                            }}></div>
                        </div>
                        <span className="text-xs text-gray-600">
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Gunakan minimal 8 karakter dengan kombinasi huruf besar,
                        kecil, angka, dan simbol
                      </p>
                    </div>
                  )}
                  {renderErrorMessages("password")}
                </div>

                {/* Password Confirmation Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Konfirmasi Kata Sandi
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-hover:text-[#1a1d47] transition-colors" />
                    </div>
                    <input
                      type={showPasswordConfirm ? "text" : "password"}
                      name="passwordConfirm"
                      value={formData.passwordConfirm}
                      onChange={handleInputChange}
                      onFocus={handleFocus}
                      disabled={loading}
                      className={`w-full pl-10 landing-input pr-12 py-3 bg-white/70 backdrop-blur-sm border rounded-xl focus:ring-2 focus:ring-[#1a1d47] focus:border-transparent transition-all duration-300 text-gray-700 placeholder-gray-400 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-white/80 focus:bg-white/90 ${
                        error?.passwordConfirm
                          ? "border-red-300"
                          : "border-gray-200/50"
                      }`}
                      placeholder="Ulangi kata sandi"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswordConfirm(!showPasswordConfirm)
                      }
                      disabled={loading}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50/50 rounded-r-xl transition-all duration-200">
                      {showPasswordConfirm ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-[#1a1d47]" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-[#1a1d47]" />
                      )}
                    </button>
                  </div>
                  {renderErrorMessages("passwordConfirm")}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full bg-gradient-to-r from-[#1a1d47] to-[#2d3166] hover:from-[#2d3166] hover:to-[#1a1d47] disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-[#1a1d47]/25 transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden">
                  {loading ? (
                    <>
                      <CircularLoader />
                      <span className="animate-pulse">Sedang Mendaftar...</span>
                    </>
                  ) : (
                    <>
                      <User className="w-5 h-5 transition-transform group-hover:scale-110" />
                      <span>Daftar Sekarang</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}

                  {/* Shimmer Effect */}
                  {!loading && (
                    <div className="absolute inset-0 -top-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:top-full transition-all duration-700"></div>
                  )}
                </button>

                {/* Login Link */}
                <div className="text-center pt-4 border-t border-gray-200/50">
                  <p className="text-gray-600">
                    Sudah punya akun?{" "}
                    <Link
                      to="/login"
                      className="text-[#1a1d47] hover:text-[#2d3166] font-semibold hover:underline transition-colors">
                      Masuk Sekarang
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Home Button with Blue Accent */}
      <button
        onClick={() => navigate("/")}
        disabled={loading}
        className="fixed bottom-8 left-8 bg-white/80 backdrop-blur-sm hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed text-gray-700 hover:text-[#1a1d47] p-3 rounded-full shadow-lg hover:shadow-xl border border-gray-100/50 transition-all duration-300 transform hover:scale-110 flex items-center gap-2">
        <Home className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">
          Halaman Utama
        </span>
      </button>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        /* Enhanced hover effects */
        .group:hover .animate-shimmer {
          animation: shimmer 0.7s ease-out;
        }
      `}</style>
    </div>
  );
};
