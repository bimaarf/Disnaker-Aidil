import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  verifyOtp,
  clearErrors,
  resendOtp,
} from "../features/authentication/AuthSlice";
import { fetchLogos } from "../features/LandingPages/logoSlice";
import { toast } from "react-toastify";
import {
  ArrowRight,
  ArrowLeft,
  Home,
  Shield,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Heart,
} from "lucide-react";
import secureLocalStorage from "react-secure-storage";
import { CircularLoader } from "./_CircularLoader";
import useIsMobile from "../Context/__useIsMobile";

const VerifyOtpPage = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [searchParams] = useSearchParams();

  const user_id = searchParams.get("user_id");
  const verificationType = searchParams.get("type") || "registration";

  const inputRefs = useRef([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const pendingUserId = useSelector((state) => state.auth.pendingUserId);
  const finalUserId = user_id || pendingUserId;

  const { error, otpError, otpMessage, isPasswordResetOtpVerified } =
    useSelector((state) => state.auth);
  const logo = useSelector((state) => state.logos.logos);

  useEffect(() => {
    const token = secureLocalStorage.getItem("auth_token");

    if (token && verificationType === "login") {
      console.log("Token ditemukan, redirect ke dashboard");
      toast.success("Login berhasil dengan OTP!");
      navigate("/dashboard");
      return;
    }
  }, [isPasswordResetOtpVerified, verificationType, user_id, navigate]);
  useEffect(() => {
    if (!user_id && pendingUserId) {
      const newParams = new URLSearchParams();
      newParams.set("user_id", pendingUserId);
      newParams.set("type", verificationType);
      navigate(`/verify-otp?${newParams.toString()}`, { replace: true });
    }
  }, [user_id, pendingUserId, verificationType, navigate]);

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

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleInputChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value) {
      dispatch(clearErrors());
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const pasteData = text.replace(/\D/g, "").slice(0, 6);
        const newOtp = [...otp];

        for (let i = 0; i < 6; i++) {
          newOtp[i] = pasteData[i] || "";
        }

        setOtp(newOtp);
        const lastFilledIndex = Math.min(pasteData.length - 1, 5);
        inputRefs.current[lastFilledIndex]?.focus();
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      toast.error("Please enter complete 6-digit OTP code.");
      return;
    }
    if (!finalUserId) {
      toast.error("User ID not found. Please try again.");
      return;
    }

    setLoading(true);

    try {
      const verifyData = {
        user_id: finalUserId,
        otp_code: otpCode,
        type: verificationType,
      };

      console.log("Sending OTP verification:", verifyData);

      const result = await dispatch(verifyOtp(verifyData)).unwrap();

      console.log("OTP verification response:", result);

      if (result.status === 200) {
        window.dispatchEvent(
          new CustomEvent("otpVerificationSuccess", {
            detail: { verified: true },
          })
        );
        if (verificationType === "password_reset") {
          toast.success(
            result.message ||
              "OTP verified successfully! Proceed to reset your password."
          );
          navigate(`/reset-password?user_id=${user_id}`);
        } else if (result.token) {
          toast.success(result.message || "OTP verified successfully!");
          secureLocalStorage.setItem("auth_token", result.token);
          secureLocalStorage.setItem("user", JSON.stringify(result.user));
          navigate("/dashboard");
        } else {
          toast.error(result.message || "OTP verification failed.");
        }
      } else {
        toast.error(result.message || "OTP verification failed.");
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      toast.error(err?.message || "OTP verification failed. Please try again.");

      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };
  const isMobile = useIsMobile();
  const handleResendOtp = async () => {
    if (!canResend || !user_id) return;

    setResendLoading(true);

    try {
      const resendData = {
        user_id: user_id,
        type: verificationType,
      };

      console.log("Resending OTP:", resendData);

      const result = await dispatch(resendOtp(resendData)).unwrap();

      console.log("Resend OTP response:", result);

      if (result.status === 200) {
        toast.success(result.message || "OTP sent successfully!");
        setCountdown(result.cooldown || 60);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        toast.error(result.message || "Failed to resend OTP.");
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      toast.error(err?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderErrorMessages = () => {
    if (error?.otp_code && Array.isArray(error.otp_code)) {
      return error.otp_code.map((message, index) => (
        <div
          key={index}
          className="flex items-center gap-2 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-red-600 text-sm">{message}</span>
        </div>
      ));
    }
    return null;
  };

  if (!user_id) {
    return (
      <div className="min-h-screen overflow-x-hidden w-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Link
          </h2>
          <p className="text-gray-600 mb-4">
            The verification link is invalid or expired.
          </p>
          <Link
            to="/login"
            className="text-orange-600 hover:text-orange-700 font-semibold">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-screen px-0 pt-[10vh] pb-8 bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center
">
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
              Sedang Memverifikasi...
            </h3>
            <p className="text-gray-600 mb-4">
              Mohon tunggu, kami sedang memproses OTP Anda
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
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
          {!isMobile && (
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
                    Verifikasi OTP
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent italic">
                    Enggang Foundation
                  </span>
                </h1>
                <p className="text-xl text-gray-600 max-w-md mx-auto mb-8 leading-relaxed">
                  Masukkan kode OTP yang telah dikirim ke WhatsApp atau email
                  Anda untuk melanjutkan
                </p>
                {/* Enhanced Feature List with Orange Accents */}
                <div className="space-y-4 text-left">
                  {[
                    { text: "Keamanan terjamin", delay: "0s", icon: "🔒" },
                    {
                      text: "Kode berlaku 10 menit",
                      delay: "0.1s",
                      icon: "⏰",
                    },
                    {
                      text: "Verifikasi mudah",
                      delay: "0.2s",
                      icon: "✅",
                    },
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 sm:gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl hover:bg-white/80 transition-all duration-300 transform hover:translate-x-2 border border-orange-100/50"
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
          )}

          <div className="w-full">
            <div className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-2xl p-4 sm:p-8 border border-orange-100/30 hover:shadow-3xl transition-shadow duration-500">
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
                  Verifikasi OTP
                </h2>
                <p className="text-gray-600">
                  Masukkan kode 6 digit yang telah dikirim ke WhatsApp atau
                  email Anda
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm">
                  <Shield className="w-4 h-4" />
                  <span>
                    Kode untuk{" "}
                    {verificationType === "registration"
                      ? "pendaftaran"
                      : verificationType === "password_reset"
                      ? "reset kata sandi"
                      : "login"}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-700 text-center block">
                    Masukkan Kode OTP
                  </p>

                  <div className="grid grid-cols-6 mx-auto gap-1">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) =>
                          handleInputChange(index, e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        disabled={loading}
                        className={`w-14 h-14 text-center text-2xl font-bold bg-white/70 backdrop-blur-sm border rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-white/80 focus:bg-white/90 ${
                          error?.otp_code
                            ? "border-red-300"
                            : "border-orange-200/50"
                        } ${digit ? "border-orange-300 bg-orange-50" : ""}`}
                        placeholder="•"
                      />
                    ))}
                  </div>

                  {renderErrorMessages()}
                </div>

                <div className="text-center">
                  {!canResend ? (
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        Kirim ulang dalam {formatTime(countdown)}
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendLoading || loading}
                      className="flex items-center justify-center gap-2 text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed mx-auto">
                      <RefreshCw
                        className={`w-4 h-4 ${
                          resendLoading ? "animate-spin" : ""
                        }`}
                      />
                      <span>
                        {resendLoading ? "Mengirim..." : "Kirim Ulang OTP"}
                      </span>
                    </button>
                  )}
                </div>

                {otpError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-sm text-center">
                      {typeof otpError === "string"
                        ? otpError
                        : otpError.message || JSON.stringify(otpError)}
                    </p>
                  </div>
                )}

                {otpMessage && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                    <p className="text-orange-600 text-sm text-center">
                      {otpMessage}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.join("").length !== 6}
                  className="group w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-orange-500/25 transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden">
                  {loading ? (
                    <>
                      <CircularLoader />
                      <span className="animate-pulse">Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 transition-transform group-hover:scale-110" />
                      <span>Verifikasi Sekarang</span>
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
                    Tidak menerima kode?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-colors">
                      Kembali ke Login
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate("/login")}
        className="fixed bottom-8 left-8 bg-white/80 backdrop-blur-sm hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed text-gray-700 hover:text-orange-600 p-3 rounded-full shadow-lg hover:shadow-xl border border-orange-100/50 transition-all duration-300 transform hover:scale-110 flex items-center gap-2">
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">Kembali</span>
      </button>

      <button
        onClick={() => navigate("/")}
        className="fixed bottom-8 right-8 bg-white/80 backdrop-blur-sm hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed text-gray-700 hover:text-orange-600 p-3 rounded-full shadow-lg hover:shadow-xl border border-orange-100/50 transition-all duration-300 transform hover:scale-110 flex items-center gap-2">
        <Home className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">Beranda</span>
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

export default VerifyOtpPage;
