import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { changePassword } from "../features/authentication/AuthSlice";
import { fetchLogos } from "../features/LandingPages/logoSlice";
import { toast } from "react-toastify";
import { CircularLoader } from "./_CircularLoader";
import { ArrowLeft, Home, Lock, CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: "",
    password_confirmation: "",
  });
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const user_id = searchParams.get("user_id");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const logo = useSelector((state) => state.logos.logos);
  const { isPasswordResetOtpVerified } = useSelector((state) => state.auth);
  useEffect(() => {
    if (isPasswordResetOtpVerified && user_id) {
      navigate(`/reset-password?user_id=${user_id}`);
    }
  }, [isPasswordResetOtpVerified, user_id, navigate]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await dispatch(
        changePassword({
          user_id,
          password: formData.password,
          password_confirmation: formData.password_confirmation,
        })
      ).unwrap();

      if (response.status === 200) {
        navigate("/login");
        toast.success(response.message);
      } else {
        toast.error(response.message || "Password change failed.");
      }
    } catch (err) {
      console.error("Password change error:", err);
      toast.error(
        err?.message || "Failed to change password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-[10vh] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-700/5"></div>
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-300/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-purple-300/10 rounded-full blur-lg animate-bounce"></div>

      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              {logo?.image ? (
                <img
                  src={`${process.env.REACT_APP_API}logo/images/${logo.image}`}
                  alt="Logo"
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <Lock className="w-8 h-8 text-white" />
              )}
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-2">
              Reset Kata Sandi
            </h2>
            <p className="text-gray-600">
              Masukkan kata sandi baru untuk akun Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-white/60 backdrop-blur-sm border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-700 placeholder-gray-400"
                  placeholder="Masukkan kata sandi baru"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-white/60 backdrop-blur-sm border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-700 placeholder-gray-400"
                  placeholder="Konfirmasi kata sandi"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <CircularLoader />
                  <span>Mengubah Kata Sandi...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Ubah Kata Sandi</span>
                  <CheckCircle className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-600">
                Kembali ke{" "}
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors">
                  Login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      <button
        onClick={() => navigate("/login")}
        className="fixed bottom-8 left-8 bg-white/80 backdrop-blur-sm hover:bg-white/90 text-gray-700 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center gap-2">
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">Kembali</span>
      </button>

      <button
        onClick={() => navigate("/")}
        className="fixed bottom-8 right-8 bg-white/80 backdrop-blur-sm hover:bg-white/90 text-gray-700 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center gap-2">
        <Home className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">Beranda</span>
      </button>
    </div>
  );
};

export default ResetPassword;
