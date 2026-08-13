import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { login, clearErrors } from "../features/authentication/AuthSlice";
import { fetchLogos } from "../features/LandingPages/logoSlice";
import { toast } from "react-toastify";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Home,
  Lock,
  Mail,
  Phone,
  User,
  AlertCircle,
  CheckCircle,
  Heart,
} from "lucide-react";

// Enhanced Button Loader Component
const ButtonLoader = () => (
  <div className="relative">
    <div className="w-5 h-5 border-2 border-white/30 rounded-full animate-spin"></div>
    <div className="absolute top-0 left-0 w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Improved Circular Loader (fallback jika masih digunakan)
export const CircularLoader = () => (
  <div className="relative">
    <div className="w-5 h-5 border-2 border-white/30 rounded-full animate-spin"></div>
    <div className="absolute top-0 left-0 w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";
  const [formData, setFormData] = useState({
    login: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState("email");
  const [otpRequested, setOtpRequested] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error, isAuthenticated, pendingUserId } = useSelector(
    (state) => state.auth
  );
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  const logo = useSelector((state) => state.logos.logos);
  const status = useSelector((state) => state.logos.status);

  // Page Loading Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated && !pendingUserId) {
      // console.log("User authenticated, redirecting to dashboard");
      navigate(redirectUrl);
    }
  }, [isAuthenticated, otpRequested, pendingUserId, navigate]);

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9\s\-()]+$/;

    if (emailRegex.test(formData.login)) {
      setLoginType("email");
    } else if (phoneRegex.test(formData.login) && formData.login.length > 5) {
      setLoginType("phone");
    }
  }, [formData.login]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFocus = () => {
    dispatch(clearErrors());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await dispatch(login(formData)).unwrap();
      console.log("Login response:", result);

      if (
        (result.status === 200 || result.statusCode === 200) &&
        result.otp_expires_at &&
        result.user_id
      ) {
        setOtpRequested(true);
        toast.success(
          result.message ||
            "OTP sent successfully to your WhatsApp. Please verify to complete login."
        );
        navigate(`/verify-otp?user_id=${result.user_id}&type=login`);
      } else if (
        (result.status === 200 || result.statusCode === 200) &&
        result.token
      ) {
        setOtpRequested(false);
        toast.success("Login successful!");
        navigate(redirectUrl); // ✅ fallback ke redirect atau dashboard
      } else {
        toast.error("Invalid server response. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);

      if (
        (err?.status === 500 || err?.statusCode === 500) &&
        err?.user_id &&
        err?.otp_expires_at
      ) {
        setOtpRequested(true);
        toast.success(
          err.message ||
            "OTP may have been sent to your WhatsApp. Please verify to complete login."
        );
        navigate(`/verify-otp?user_id=${err.user_id}&type=login`);
      } else if (err?.statusCode === 403 && err?.pendingUser) {
        setOtpRequested(true);
        toast.warning(
          "Your account has not been verified. Please verify the OTP."
        );
        navigate(`/verify-otp?user_id=${err.pendingUser.id}&type=login`);
      } else if (err?.statusCode === 401) {
        toast.error(
          "Invalid credentials. Please try again or reset your password."
        );
        navigate("/forgot-password");
      } else if (err?.message) {
        toast.error(err.message);
      } else {
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    const handleOtpVerificationSuccess = (event) => {
      if (event.detail?.verified) {
        setOtpRequested(false);
        console.log("OTP verification successful, resetting otpRequested");
      }
    };

    window.addEventListener(
      "otpVerificationSuccess",
      handleOtpVerificationSuccess
    );
    return () =>
      window.removeEventListener(
        "otpVerificationSuccess",
        handleOtpVerificationSuccess
      );
  }, []);

  // Enhanced Page Loading Screen with Blue Theme
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          {/* Multi-layer Loading Spinner with Blue Colors */}
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-gray-200 rounded-full animate-spin mx-auto"></div>
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-16 border-4 border-[#1a1d47] border-t-transparent rounded-full animate-spin"></div>
            <div
              className="absolute top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 border-2 border-[#2d3166] border-b-transparent rounded-full animate-spin"
              style={{ animationDirection: "reverse" }}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Heart className="w-6 h-6 text-[#1a1d47] animate-pulse" />
            </div>
          </div>

          {/* Loading Text with Blue Gradient */}
          <div className="space-y-3">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-[#1a1d47] to-[#2d3166] bg-clip-text text-transparent">
              Loading...
            </h3>
            <p className="text-gray-600 animate-pulse">
              Sedang mempersiapkan halaman login
            </p>

            {/* Animated Progress Dots with Blue Colors */}
            <div className="flex justify-center space-x-2 mt-4">
              <div className="w-3 h-3 bg-[#1a1d47] rounded-full animate-bounce"></div>
              <div
                className="w-3 h-3 bg-[#1a1d47] rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}></div>
              <div
                className="w-3 h-3 bg-[#2d3166] rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}></div>
              <div
                className="w-3 h-3 bg-[#2d3166] rounded-full animate-bounce"
                style={{ animationDelay: "0.3s" }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              Sedang Masuk...
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
                Masukkan email dan kata sandi Anda.
              </p>

              {/* Enhanced Feature List with Blue Accents */}
              <div className="space-y-4 text-left">
                {[
                  { text: "Dinas Ketenagakerjaan", delay: "0s", icon: "🔒" },
                  {
                    text: "Zona Integritas",
                    delay: "0.2s",
                    icon: "🔒",
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

          {/* Right Panel - Enhanced Login Form with Blue Theme */}
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
                  Masuk Akun
                </h2>
                <p className="text-gray-600">
                  Masukkan Alamat Email dan kata sandi Anda
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Enhanced Email/Phone Input with Blue Accents */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Alamat Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {loginType === "email" ? (
                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-gray-500 transition-colors" />
                      ) : (
                        <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-gray-500 transition-colors" />
                      )}
                    </div>
                    <input
                      type="text"
                      name="login"
                      value={formData.login}
                      onChange={handleInputChange}
                      onFocus={handleFocus}
                      disabled={loading}
                      className={`w-full landing-input text-gray-800 pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-white ${
                        error?.login ? "border-red-500" : "border-gray-200"
                      }`}
                      placeholder="contoh@email.com"
                      required
                    />
                  </div>
                  {renderErrorMessages("login")}
                </div>

                {/* Enhanced Password Input with Blue Accents */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kata Sandi
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-gray-500 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onFocus={handleFocus}
                      disabled={loading}
                      className={`w-full landing-input text-gray-800 pl-10 pr-12 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-white ${
                        error?.password ? "border-red-500" : "border-gray-200"
                      }`}
                      placeholder="Masukkan kata sandi"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-600 transition-colors">
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {renderErrorMessages("password")}
                </div>

                <div className="flex justify-end items-center">
                  {/* <Link
                    to="/forgot-password"
                    className="text-[#1a1d47] hover:text-[#2d3166] font-semibold hover:underline transition-colors text-sm">
                    Lupa kata sandi?
                  </Link> */}
                </div>

                {/* Enhanced Submit Button with Blue Gradient */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full bg-gradient-to-r from-[#1a1d47] to-[#2d3166] hover:from-[#2d3166] hover:to-[#1a1d47] disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-[#1a1d47]/25 transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden">
                  {loading ? (
                    <>
                      <ButtonLoader />
                      <span className="animate-pulse">Sedang Masuk...</span>
                    </>
                  ) : (
                    <>
                      <User className="w-5 h-5 transition-transform group-hover:scale-110" />
                      <span>Masuk Sekarang</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}

                  {/* Shimmer Effect */}
                  {!loading && (
                    <div className="absolute inset-0 -top-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:top-full transition-all duration-700"></div>
                  )}
                </button>

                {/* <div className="text-center pt-4 border-t border-gray-200/50">
                  <p className="text-gray-600">
                    Belum punya akun?{" "}
                    <Link
                      to="/register"
                      className="text-[#1a1d47] hover:text-[#2d3166] font-semibold hover:underline transition-colors">
                      Daftar Sekarang
                    </Link>
                  </p>
                </div> */}
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
