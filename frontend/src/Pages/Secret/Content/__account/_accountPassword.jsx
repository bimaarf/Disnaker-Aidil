import {
  CheckCircle2,
  Eye,
  EyeOff,
  ImageIcon,
  KeyRound,
  Shield,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { updateSingleUser } from "../../../../features/authentication/AuthSlice";
import {
  updatePassword,
  updateUser,
} from "../../../../features/users/userSlice";

export const AccountPassword = ({ user }) => {
  const dispatch = useDispatch();
  const [data, setData] = useState(user);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    setData(user);
  }, [user]);

  const handlePasswordUpdate = async () => {
    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    setPasswordLoading(true);
    const formData = new FormData();
    formData.append("new_password", newPassword);
    formData.append("password_confirmation", confirmPassword);

    try {
      await dispatch(
        updatePassword({ id: user.id, userData: formData })
      ).unwrap();
      setSuccessMessage("Password updated successfully.");
      setErrorMessage("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setErrorMessage("Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleFocus = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Handle avatar update and image preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      handleAvatarUpdate(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleAvatarUpdate = async (imageFile) => {
    setAvatarLoading(true);

    if (!imageFile) {
      toast.error("Please select an image first.");
      setAvatarLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const updatedUser = await dispatch(
        updateUser({ id: user.id, userData: formData })
      ).unwrap();
      if (updatedUser.current) {
        dispatch(updateSingleUser(updatedUser));
      }
      setData(updatedUser);
      toast.success("Avatar updated successfully.");
      setPreviewUrl(null);
    } catch (error) {
      toast.error("Failed to update avatar.");
      console.error("Avatar update error:", error);
      setPreviewUrl(null);
    } finally {
      setAvatarLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: "", color: "", bg: "" };

    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    const levels = [
      { text: "Very Weak", color: "text-red-500", bg: "bg-red-500" },
      { text: "Weak", color: "text-orange-500", bg: "bg-orange-500" },
      { text: "Fair", color: "text-yellow-500", bg: "bg-yellow-500" },
      { text: "Good", color: "text-blue-500", bg: "bg-blue-500" },
      { text: "Strong", color: "text-green-500", bg: "bg-green-500" },
    ];

    return { strength, ...levels[Math.min(strength, 4)] };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="space-y-2 max-w-screen-lg">
      {/* Profile Picture Section */}
      <div className="bg-base-100 dark:bg-base-200 shadow-sm rounded-3xl p-3 sm:p-6 border border-base-200/50 backdrop-blur-sm">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-16 h-16 bg-success/10 rounded-3xl flex items-center justify-center shadow-sm">
            <ImageIcon className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-base-content">
              Profile Picture
            </h3>
            <p className="text-[12px] sm:text-base text-base-content/70 mt-1">
              Update your profile avatar (Max 5MB)
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="relative group">
            {avatarLoading ? (
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl bg-base-200/50 dark:bg-base-300 flex items-center justify-center animate-pulse">
                  <div className="w-10 h-10 bg-base-300/30 rounded-full animate-spin border-3 border-base-200/50 border-t-base-200/50"></div>
                </div>
              </div>
            ) : previewUrl ? (
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-500 to-teal-600 p-1 shadow-xl">
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-base-100">
                    <img
                      src={previewUrl}
                      alt="Preview avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-3 border-base-100 flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              </div>
            ) : data?.avatar && data?.avatar !== "default.jpg" ? (
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-500 to-teal-600 p-1 shadow-xl">
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-base-100">
                    <img
                      src={data?.avatar}
                      alt="User avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-3 border-base-100 flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-indigo-500 via-teal-500 to-pink-500 flex items-center justify-center shadow-xl">
                  <span className="text-4xl font-bold text-white">
                    {data?.username?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
              </div>
            )}
          </div>
          {/* Upload Button */}
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={handleImageChange}
              accept="image/*"
            />
            <div className="mt-4 inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-2xl font-medium hover:from-blue-700 hover:to-teal-700 transition-all duration-200 transform hover:scale-[99%] active:scale-[98%] shadow-sm hover:shadow-xl sm:text-md text-sm">
              <ImageIcon className="w-5 h-5" />
              Upload New Avatar
            </div>
          </label>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="bg-base-100 dark:bg-base-200 shadow-sm rounded-3xl p-3 sm:p-6 border border-base-200/50 backdrop-blur-sm">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-16 h-16 bg-primary/10 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-sm">
            <KeyRound className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-base-content">
              Change Password
            </h3>
            <p className="text-[12px] sm:text-base text-base-content/70 mt-1">
              Update your account password
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {/* Password Inputs */}
          <div className="space-y-4">
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={handleFocus}
                placeholder="New Password"
                className="w-full px-4 py-3 rounded-2xl focus:bg-base-100 dark:focus:bg-base-100 bg-base-200/50 dark:bg-base-300 border border-base-300 focus:border-blue-500 focus:outline-none text-base"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2">
                {showNewPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-500" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>

            {/* Password Strength */}
            {newPassword && (
              <div className="mt-2">
                <p className={`font-medium ${passwordStrength.color}`}>
                  Strength: {passwordStrength.text}
                </p>
                <div className="h-2 bg-gray-200 rounded mt-1">
                  <div
                    className={`h-full rounded ${passwordStrength.bg}`}
                    style={{ width: `${passwordStrength.strength * 20}%` }}
                  />
                </div>
              </div>
            )}

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={handleFocus}
                placeholder="Confirm Password"
                className="w-full px-4 py-3 rounded-2xl focus:bg-base-100 dark:focus:bg-base-100 bg-base-200/50 dark:bg-base-300 border border-base-300 focus:border-blue-500 focus:outline-none text-base"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2">
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-500" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          {/* Error and Success Messages */}
          {errorMessage && (
            <div className="flex items-center gap-3 p-4 bg-red-100 dark:bg-red-900/10 text-red-700 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-800/40">
              <span className="text-base">{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="flex items-center gap-3 p-4 bg-green-100 dark:bg-green-900/10 text-green-700 dark:text-green-400 rounded-2xl border border-green-200 dark:border-green-800/40">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              <span className="text-base">{successMessage}</span>
            </div>
          )}

          {/* Password Requirements */}
          <div className="bg-base-100/50 rounded-2xl p-6 border border-base-300/50">
            <h4 className="font-medium text-base-content mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Password Requirements
            </h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <div
                className={`flex items-center gap-2 text-sm ${
                  newPassword.length >= 6
                    ? "text-green-600"
                    : "text-base-content/60"
                }`}>
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    newPassword.length >= 6 ? "bg-green-500" : "bg-gray-300"
                  }`}>
                  {newPassword.length >= 6 && (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  )}
                </div>
                At least 6 characters
              </div>
              <div
                className={`flex items-center gap-2 text-sm ${
                  newPassword.length >= 8
                    ? "text-green-600"
                    : "text-base-content/60"
                }`}>
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    newPassword.length >= 8 ? "bg-green-500" : "bg-gray-300"
                  }`}>
                  {newPassword.length >= 8 && (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  )}
                </div>
                8+ characters (recommended)
              </div>
              <div
                className={`flex items-center gap-2 text-sm ${
                  /[A-Z]/.test(newPassword)
                    ? "text-green-600"
                    : "text-base-content/60"
                }`}>
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    /[A-Z]/.test(newPassword) ? "bg-green-500" : "bg-gray-300"
                  }`}>
                  {/[A-Z]/.test(newPassword) && (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  )}
                </div>
                Uppercase letter
              </div>
              <div
                className={`flex items-center gap-2 text-sm ${
                  /[0-9]/.test(newPassword)
                    ? "text-green-600"
                    : "text-base-content/60"
                }`}>
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    /[0-9]/.test(newPassword) ? "bg-green-500" : "bg-gray-300"
                  }`}>
                  {/[0-9]/.test(newPassword) && (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  )}
                </div>
                Number
              </div>
            </div>
          </div>

          {/* Update Button */}
          <div className="flex flex-col sm:flex-row justify-end gap-4">
            <button
              disabled={passwordLoading || !newPassword || !confirmPassword}
              onClick={handlePasswordUpdate}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl font-medium hover:from-red-700 hover:to-orange-700 transition-all duration-200 transform hover:scale-[99%] active:scale-[98%] shadow-sm hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none sm:text-md text-sm">
              {passwordLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-base-200/50 border-t-base-200/50 rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                <>
                  <KeyRound className="w-5 h-5" />
                  Change Password
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPassword;
