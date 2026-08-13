import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  requestLoginOtp,
  clearErrors,
} from "../features/authentication/AuthSlice";
import { fetchLogos } from "../features/LandingPages/logoSlice";
import { toast } from "react-toastify";
import {
  ArrowRight,
  Home,
  Mail,
  Send,
  AlertCircle,
  CheckCircle,
  Key,
  LogIn,
  Shield,
  Heart,
} from "lucide-react";
import { CircularLoader } from "./_CircularLoader";

export const ForgotPassword = () => {
  const [login, setLogin] = useState("");
  const loginType = "password_reset";
  const [loading, setLoading] = useState(false);
  const [showResetOption, setShowResetOption] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { otpError, pendingUserId, isAuthenticated } = useSelector(
    (state) => state.auth
  );
  const logo = useSelector((state) => state.logos.logos);

  useEffect(() => {
    if (isAuthenticated && !showResetOption) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, showResetOption, navigate]);

  useEffect(() => {
    const getLogo = async () => {
      try {
        await dispatch(fetchLogos()).unwrap();
      } catch (error) {
        console.error("Failed to fetch logos:", error);
      }
    };
    getLogo();
  }, [dispatch]);

  // Listen for OTP verification success
  useEffect(() => {
    const handleOtpVerificationSuccess = (event) => {
      if (event.detail?.verified) {
        setShowResetOption(true);
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

  const handleInputChange = (e) => {
    setLogin(e.target.value);
  };

  const handleFocus = () => {
    dispatch(clearErrors());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!login) {
      toast.error("Please enter your email or phone number.");
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(
        requestLoginOtp({ login, type: loginType })
      ).unwrap();

      console.log("Request OTP response:", result);

      if (result?.user_id && result?.otp_expires_at) {
        toast.success(
          result.message || "OTP sent successfully to your WhatsApp."
        );
        navigate(
          `/verify-otp?user_id=${result.user_id}&type=password_reset&return_to=forgot-password`
        );
      } else {
        // fallback jika payload tidak lengkap
        toast.error("Incomplete server response. Please contact admin.");
      }
    } catch (err) {
      console.error("Request OTP error:", err);

      // Tangani jika err hanya string
      if (typeof err === "string") {
        toast.error(err);
        return;
      }

      const { status, message, user_id, otp_expires_at } = err || {};

      if (status === 200 && user_id && otp_expires_at) {
        toast.success(message || "OTP may have been sent to WhatsApp.");
        navigate(
          `/verify-otp?user_id=${user_id}&type=password_reset&return_to=forgot-password`
        );
      } else {
        toast.error(message || "Failed to request OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = () => {
    navigate(`/reset-password?user_id=${pendingUserId}`);
  };

  const handleContinueToDashboard = () => {
    toast.success("Login successful! Redirecting to dashboard...");
    navigate("/dashboard");
  };

  const renderErrorMessages = () => {
    const fieldErrors = otpError?.login;
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

  if (showResetOption && isAuthenticated) {
    return (
      <div className="min-h-screen pt-[10vh] bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center px-4 py-8">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 to-red-700/5"></div>
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-300/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-red-300/10 rounded-full blur-lg animate-bounce"></div>

        <div className="relative z-10 w-full max-w-md mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                Verifikasi Berhasil!
              </h2>
              <p className="text-gray-600 mb-6">
                OTP berhasil diverifikasi. Apakah Anda ingin mereset kata sandi
                sekarang?
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-orange-800">
                    Keamanan Akun
                  </span>
                </div>
                <p className="text-orange-700 text-sm">
                  Disarankan untuk mereset kata sandi secara berkala untuk
                  menjaga keamanan akun Anda.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleResetPassword}
                  className="group w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-orange-500/25 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2">
                  <Key className="w-5 h-5" />
                  <span>Ya, Reset Kata Sandi</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={handleContinueToDashboard}
                  className="group w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2">
                  <LogIn className="w-5 h-5" />
                  <span>Tidak, Lanjut ke Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-gray-500 text-sm">
                  Anda dapat mereset kata sandi kapan saja melalui pengaturan
                  profil
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate("/")}
          className="fixed bottom-8 left-8 bg-white/80 backdrop-blur-sm hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed text-gray-700 hover:text-orange-600 p-3 rounded-full shadow-lg hover:shadow-xl border border-orange-100/50 transition-all duration-300 transform hover:scale-110 flex items-center gap-2">
          <Home className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-medium">
            Halaman Utama
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[10vh] bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center px-4 py-8">
      {/* Background Pattern and Elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 to-red-700/5"></div>
      <div className="absolute top-20 left-10 w-32 h-32 bg-orange-300/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-red-300/10 rounded-full blur-lg animate-bounce"></div>
      <div className="absolute top-32 right-10 w-16 h-16 bg-yellow-300/20 rounded-full blur-lg animate-bounce"></div>
      <div className="absolute bottom-32 left-20 w-20 h-20 bg-pink-300/15 rounded-full blur-md animate-pulse delay-1000"></div>

      {/* Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f97316' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>

      {/* Enhanced Loading Overlay with Orange Theme */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/40 text-center max-w-md mx-4 transform transition-all duration-500 animate-fadeIn">
            {/* Multi-layer Loading Spinner */}
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-orange-200 rounded-full animate-spin mx-auto"></div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <div
                className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-12 border-2 border-red-400 border-b-transparent rounded-full animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1s",
                }}></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Heart className="w-6 h-6 text-orange-600 animate-pulse" />
              </div>
            </div>

            {/* Loading Text */}
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Sedang Memproses...
            </h3>
            <p className="text-gray-600 mb-4">
              Mohon tunggu, kami sedang mengirim OTP
            </p>

            {/* Progress Bar with Orange Gradient */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full animate-pulse"
                style={{ width: "70%" }}></div>
            </div>

            {/* Animated Dots with Orange Colors */}
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}></div>
              <div
                className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}></div>
              <div
                className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.3s" }}></div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="hidden lg:block">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <div className="p-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  {logo?.image ? (
                    <img
                      src={`${process.env.REACT_APP_API}logo/images/${logo.image}`}
                      alt="Logo"
                      className="w-20 h-20 object-contain"
                    />
                  ) : (
                    <Heart className="w-20 h-20 text-white" />
                  )}
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Lupa Kata Sandi
                </span>
                <br />
                <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent italic">
                  Enggang Foundation
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-md mx-auto mb-8 leading-relaxed">
                Masukkan email atau nomor telepon untuk menerima kode OTP
              </p>

              {/* Enhanced Feature List with Orange Accents */}
              <div className="space-y-4 text-left">
                {[
                  { text: "Lebih aman dengan OTP", delay: "0s", icon: "🔒" },
                  { text: "Kirim ke WhatsApp", delay: "0.1s", icon: "📱" },
                  {
                    text: "Verifikasi mudah",
                    delay: "0.2s",
                    icon: "✅",
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl hover:bg-white/80 transition-all duration-300 transform hover:translate-x-2 border border-orange-100/50"
                    style={{ animationDelay: feature.delay }}>
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg text-sm">
                      {feature.icon}
                    </div>
                    <span className="text-gray-700 font-medium">
                      {feature.text}
                    </span>
                    <CheckCircle className="w-5 h-5 text-orange-500 ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-orange-100/30 hover:shadow-3xl transition-shadow duration-500">
              <div className="lg:hidden flex justify-center mb-6">
                <div className="p-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg">
                  {logo?.image ? (
                    <img
                      src={`${process.env.REACT_APP_API}logo/images/${logo.image}`}
                      alt="Logo"
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <Heart className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                  Lupa Kata Sandi
                </h2>
                <p className="text-gray-600">
                  OTP akan dikirim melalui WhatsApp
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Email atau Nomor Telepon
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      name="login"
                      value={login}
                      onChange={handleInputChange}
                      onFocus={handleFocus}
                      disabled={loading}
                      className={`w-full pl-10 pr-4 py-3 bg-white/70 backdrop-blur-sm border rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-300 text-gray-700 placeholder-gray-400 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-white/80 focus:bg-white/90 ${
                        otpError?.login
                          ? "border-red-300"
                          : "border-orange-200/50"
                      }`}
                      placeholder="contoh@email.com atau 08123456789"
                      required
                    />
                  </div>
                  {renderErrorMessages()}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-orange-500/25 transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden">
                  {loading ? (
                    <>
                      <CircularLoader />
                      <span className="animate-pulse">Mengirim OTP...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 transition-transform group-hover:scale-110" />
                      <span>Kirim Kode OTP</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}

                  {/* Shimmer Effect */}
                  {!loading && (
                    <div className="absolute inset-0 -top-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:top-full transition-all duration-700"></div>
                  )}
                </button>

                <div className="text-center pt-4 border-t border-orange-200/50">
                  <p className="text-gray-600">
                    Kembali ke{" "}
                    <Link
                      to="/login"
                      className="text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-colors">
                      Login
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate("/")}
        className="fixed bottom-8 left-8 bg-white/80 backdrop-blur-sm hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed text-gray-700 hover:text-orange-600 p-3 rounded-full shadow-lg hover:shadow-xl border border-orange-100/50 transition-all duration-300 transform hover:scale-110 flex items-center gap-2">
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

export default ForgotPassword;
